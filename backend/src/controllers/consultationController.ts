import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";

const prisma = new PrismaClient();

// Schéma de validation pour la réservation de consultation
const consultationBookingSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  time: z.string().min(1, "L'heure est requise"),
  message: z.string().optional(),
  source: z.enum(["landing_page", "client_space"]).default("landing_page"),
});

type ConsultationBookingInput = z.infer<typeof consultationBookingSchema>;

/**
 * Réserver une consultation gratuite
 */
export const bookConsultation = async (req: Request, res: Response) => {
  try {
    const validatedData = consultationBookingSchema.parse(req.body);

    // Calculer la date/heure demandée
    const requestedDateTime = new Date(
      `${validatedData.date}T${validatedData.time}`
    );

    // Vérifier que la date est dans le futur
    if (requestedDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "La date de consultation doit être dans le futur",
      });
    }

    const messageContent = `
**Nouvelle demande de consultation gratuite**

**Informations du client :**
- Nom : ${validatedData.firstName} ${validatedData.lastName}
- Email : ${validatedData.email}
- Téléphone : ${validatedData.phone || "Non renseigné"}

**Créneaux souhaités :**
- Date : ${validatedData.date}
- Heure : ${validatedData.time}

**Message :**
${validatedData.message || "Aucun message spécifique"}

**Source :** ${
      validatedData.source === "landing_page"
        ? "Page d'accueil"
        : "Espace client"
    }

---
⚠️ **Action requise :** Veuillez confirmer ce rendez-vous par email à ${
      validatedData.email
    }
    `.trim();

    // Récupérer l'admin pour le message et la notification
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true }
    });

    if (!adminUser) {
      return res.status(500).json({
        success: false,
        message: "Aucun administrateur disponible pour traiter la demande",
      });
    }

    // Créer un message direct à l'admin
    const message = await prisma.message.create({
      data: {
        content: messageContent,
        visitorName: `${validatedData.firstName} ${validatedData.lastName}`,
        visitorEmail: validatedData.email,
        receiverId: adminUser.id, // ✅ AJOUT: Assigner le message à l'admin
        isFromVisitor: true,
        statut: "ENVOYE",
        type: "CONSULTATION_REQUEST",
        subject: "🗓️ Demande de consultation gratuite",
        metadata: {
          consultationRequest: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone,
            requestedDate: validatedData.date,
            requestedTime: validatedData.time,
            message: validatedData.message,
            source: validatedData.source,
          },
        },
      },
    });

    // Créer une notification pour l'admin
    await prisma.notification.create({
      data: {
        type: "CONSULTATION",
        title: "Nouvelle demande de consultation",
        message: `${validatedData.firstName} ${validatedData.lastName} souhaite planifier un appel le ${validatedData.date} à ${validatedData.time}`,
        isRead: false,
        userId: adminUser.id,
        data: JSON.stringify({
          messageId: message.id,
          email: validatedData.email,
          requestedDateTime: requestedDateTime.toISOString(),
        }),
      },
    });

    res.status(201).json({
      success: true,
      message: "Demande de consultation envoyée avec succès",
      data: {
        messageId: message.id,
        requestedDateTime: requestedDateTime.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: error.errors,
      });
    }

    console.error(
      "Erreur lors de la création de la demande de consultation:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

/**
 * Récupérer les demandes de consultation (admin uniquement)
 */
export const getConsultationRequests = async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        type: "CONSULTATION_REQUEST",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limiter à 50 demandes récentes
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des demandes de consultation:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

/**
 * Marquer une demande de consultation comme traitée
 */
export const markConsultationAsProcessed = async (
  req: Request,
  res: Response
) => {
  try {
    const { messageId } = req.params;
    const { status, adminNote } = req.body;

    // Récupérer le message existant d'abord
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: "Message non trouvé",
      });
    }

    // Mettre à jour avec les nouvelles données
    const existingMetadata = (existingMessage.metadata as any) || {};
    const updatedMetadata = {
      ...existingMetadata,
      adminNote: adminNote,
      processedAt: new Date().toISOString(),
    };

    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        statut: status || "LU",
        metadata: updatedMetadata,
      },
    });

    res.json({
      success: true,
      message: "Demande de consultation mise à jour",
      data: message,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la demande de consultation:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};

/**
 * Récupérer les créneaux disponibles (simulation)
 */
export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    // Simulation des créneaux disponibles
    // Dans une vraie application, on interrogerait un calendrier
    const availableSlots = [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
    ];

    // Simuler quelques créneaux occupés
    const occupiedSlots = ["10:00", "14:30", "16:00"];

    const slots = availableSlots.map((time) => ({
      time,
      available: !occupiedSlots.includes(time),
    }));

    res.json({
      success: true,
      date: date || new Date().toISOString().split("T")[0],
      slots,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des créneaux:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
    });
  }
};
