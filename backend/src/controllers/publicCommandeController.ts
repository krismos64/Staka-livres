import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { stripeService } from "../services/stripeService";
import { z } from "zod";

const prisma = new PrismaClient();

// Schéma de validation Zod pour la commande publique
const publicOrderSchema = z.object({
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères").max(100),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Format d'email invalide").max(255),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(100),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  serviceId: z.string().min(1, "L'ID du service est requis"),
  consentementRgpd: z.boolean().refine(val => val === true, "Le consentement RGPD est obligatoire")
});

interface PublicOrderRequest {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  telephone?: string;
  adresse?: string;
  serviceId: string;
  consentementRgpd: boolean;
}

/**
 * Créer une commande publique (tunnel invité)
 * Route: POST /api/public/order
 */
export const createPublicOrder = async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  try {
    // Validation des données avec Zod
    const validationResult = publicOrderSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.log(`❌ [PUBLIC ORDER] Validation échouée:`, validationResult.error.errors);
      res.status(400).json({
        error: "Données invalides",
        message: "Veuillez vérifier les informations saisies",
        details: validationResult.error.errors
      });
      return;
    }

    const { prenom, nom, email, password, telephone, adresse, serviceId, consentementRgpd } = validationResult.data;

    console.log(`📝 [PUBLIC ORDER] Nouvelle commande publique: ${email} - Service: ${serviceId}`);

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      console.log(`⚠️ [PUBLIC ORDER] Email déjà utilisé: ${email}`);
      res.status(409).json({
        error: "Email déjà utilisé",
        message: "Un compte existe déjà avec cette adresse email. Veuillez vous connecter ou utiliser une autre adresse."
      });
      return;
    }

    // Vérifier que le serviceId existe
    const service = await prisma.tarif.findFirst({
      where: { 
        id: serviceId,
        actif: true
      },
      select: {
        id: true,
        nom: true,
        prix: true,
        stripePriceId: true,
        stripeProductId: true
      }
    });

    if (!service) {
      console.log(`❌ [PUBLIC ORDER] Service introuvable: ${serviceId}`);
      res.status(404).json({
        error: "Service introuvable",
        message: "Le service sélectionné n'est pas disponible"
      });
      return;
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer une entrée temporaire dans PendingCommande
    const pendingCommande = await prisma.pendingCommande.create({
      data: {
        prenom: prenom.trim(),
        nom: nom.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        telephone: telephone?.trim() || null,
        adresse: adresse?.trim() || null,
        serviceId,
        consentementRgpd
      }
    });

    console.log(`✅ [PUBLIC ORDER] PendingCommande créée: ${pendingCommande.id}`);

    // Créer une session Stripe Checkout
    try {
      const checkoutSession = await stripeService.createCheckoutSession({
        priceId: service.stripePriceId || "default", // Utiliser le prix du service
        userId: pendingCommande.id, // Utiliser l'ID de la commande pending
        commandeId: pendingCommande.id,
        successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/order-cancelled`
      });

      // Mettre à jour la PendingCommande avec l'ID de session Stripe
      await prisma.pendingCommande.update({
        where: { id: pendingCommande.id },
        data: { stripeSessionId: checkoutSession.id }
      });

      console.log(`💳 [PUBLIC ORDER] Session Stripe créée: ${checkoutSession.id} pour ${email}`);

      res.status(201).json({
        message: "Commande créée avec succès",
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
        pendingCommandeId: pendingCommande.id
      });

    } catch (stripeError) {
      console.error(`❌ [PUBLIC ORDER] Erreur Stripe:`, stripeError);
      
      // Supprimer la PendingCommande si la création Stripe échoue
      await prisma.pendingCommande.delete({
        where: { id: pendingCommande.id }
      });

      res.status(500).json({
        error: "Erreur de paiement",
        message: "Impossible de créer la session de paiement. Veuillez réessayer."
      });
    }

  } catch (error) {
    console.error("❌ [PUBLIC ORDER] Erreur lors de la création de la commande:", error);
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de traiter votre commande"
    });
  }
};

/**
 * Récupérer les détails d'une commande publique par son ID
 * Route: GET /api/public/order/:id
 */
export const getPublicOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: "ID requis",
        message: "L'ID de la commande est requis"
      });
      return;
    }

    const pendingCommande = await prisma.pendingCommande.findUnique({
      where: { id },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        adresse: true,
        serviceId: true,
        consentementRgpd: true,
        stripeSessionId: true,
        isProcessed: true,
        createdAt: true
      }
    });

    if (!pendingCommande) {
      res.status(404).json({
        error: "Commande introuvable",
        message: "Aucune commande trouvée avec cet ID"
      });
      return;
    }

    res.status(200).json({
      message: "Commande récupérée",
      pendingCommande
    });

  } catch (error) {
    console.error("❌ [PUBLIC ORDER] Erreur lors de la récupération:", error);
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de récupérer la commande"
    });
  }
};