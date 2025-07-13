import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Schema de validation pour la demande de consultation
const consultationBookingSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  date: z.string().min(1, 'La date est requise'),
  time: z.string().min(1, 'L\'heure est requise'),
  message: z.string().optional(),
  requestedDateTime: z.string().min(1, 'Date et heure requises'),
  source: z.enum(['landing_page', 'client_space']).default('landing_page')
});

type ConsultationBookingInput = z.infer<typeof consultationBookingSchema>;

/**
 * Créer une demande de consultation
 */
export const bookConsultation = async (req: Request, res: Response) => {
  try {
    // Validation des données
    const validatedData = consultationBookingSchema.parse(req.body);

    // Créer un message direct pour l'admin
    const messageContent = `
🗓️ **NOUVELLE DEMANDE DE CONSULTATION**

**Informations du contact :**
- Nom : ${validatedData.firstName} ${validatedData.lastName}
- Email : ${validatedData.email}
- Téléphone : ${validatedData.phone || 'Non renseigné'}

**Créneaux souhaités :**
- Date : ${validatedData.date}
- Heure : ${validatedData.time}

**Message :**
${validatedData.message || 'Aucun message spécifique'}

**Source :** ${validatedData.source === 'landing_page' ? 'Page d\'accueil' : 'Espace client'}

---
⚠️ **Action requise :** Veuillez confirmer ce rendez-vous par email à ${validatedData.email}
    `.trim();

    // Créer un message direct à l'admin
    const message = await prisma.message.create({
      data: {
        content: messageContent,
        visitorName: `${validatedData.firstName} ${validatedData.lastName}`,
        visitorEmail: validatedData.email,
        isFromVisitor: true,
        status: 'UNREAD',
        type: 'CONSULTATION_REQUEST',
        subject: '🗓️ Demande de consultation gratuite',
        metadata: {
          consultationRequest: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone,
            requestedDate: validatedData.date,
            requestedTime: validatedData.time,
            message: validatedData.message,
            source: validatedData.source
          }
        }
      }
    });

    // Créer une notification pour l'admin
    await prisma.notification.create({
      data: {
        type: 'CONSULTATION',
        title: 'Nouvelle demande de consultation',
        message: `${validatedData.firstName} ${validatedData.lastName} souhaite planifier un appel le ${validatedData.date} à ${validatedData.time}`,
        isRead: false,
        userId: '00000000-0000-0000-0000-000000000000', // ID admin par défaut (à adapter)
        data: JSON.stringify({
          messageId: message.id,
          email: validatedData.email,
          requestedDateTime: validatedData.requestedDateTime
        })
      }
    });

    res.status(201).json({
      success: true,
      message: 'Demande de consultation envoyée avec succès',
      data: {
        messageId: message.id,
        requestedDateTime: validatedData.requestedDateTime
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors
      });
    }

    console.error('Erreur lors de la création de la demande de consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
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
        type: 'CONSULTATION_REQUEST'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limiter à 50 demandes récentes
    });

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes de consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Marquer une demande de consultation comme traitée
 */
export const markConsultationAsProcessed = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { status, adminNote } = req.body;

    // Récupérer le message existant d'abord
    const existingMessage = await prisma.message.findUnique({ 
      where: { id: messageId } 
    });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }

    // Mettre à jour avec les nouvelles données
    const existingMetadata = existingMessage.metadata as any || {};
    const updatedMetadata = {
      ...existingMetadata,
      adminNote: adminNote,
      processedAt: new Date().toISOString()
    };

    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        status: status || 'read',
        metadata: updatedMetadata
      }
    });

    res.json({
      success: true,
      message: 'Demande de consultation mise à jour',
      data: message
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la demande de consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
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
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    // Simuler quelques créneaux occupés
    const occupiedSlots = ['10:00', '14:30', '16:00'];
    
    const slots = availableSlots.map(time => ({
      time,
      available: !occupiedSlots.includes(time)
    }));

    res.json({
      success: true,
      date: date || new Date().toISOString().split('T')[0],
      slots
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des créneaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};