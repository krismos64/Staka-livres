import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { stripeService } from "../services/stripeService";
import { z } from "zod";
import { extractFileMetadata, enrichFileData, EnrichedFileData } from "../middleware/fileUpload";

const prisma = new PrismaClient();

// Schéma de validation Zod pour la commande publique - Workflow simplifié sans mot de passe
const publicOrderSchema = z.object({
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères").max(100),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Format d'email invalide").max(255),
  telephone: z.string().optional(),
  serviceId: z.string().min(1, "L'ID du service est requis"),
  nombrePages: z.number().min(1).max(1000).optional(),
  description: z.string().max(2000, "La description ne peut pas dépasser 2000 caractères").optional(),
  prixCalcule: z.number().min(0).optional(),
  consentementRgpd: z.boolean().refine(val => val === true, "Le consentement RGPD est obligatoire")
});

interface PublicOrderRequest {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  serviceId: string;
  nombrePages?: number;
  description?: string;
  prixCalcule?: number;
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
    // Convertir les booléens depuis FormData (qui arrive comme string)
    const processedBody = {
      ...req.body,
      consentementRgpd: req.body.consentementRgpd === 'true' || req.body.consentementRgpd === true,
      nombrePages: req.body.nombrePages ? parseInt(req.body.nombrePages) : undefined,
      prixCalcule: req.body.prixCalcule ? parseFloat(req.body.prixCalcule) : undefined
    };

    // Validation des données avec Zod
    const validationResult = publicOrderSchema.safeParse(processedBody);
    
    if (!validationResult.success) {
      console.log(`❌ [PUBLIC ORDER] Validation échouée:`, validationResult.error.errors);
      res.status(400).json({
        error: "Données invalides",
        message: "Veuillez vérifier les informations saisies",
        details: validationResult.error.errors
      });
      return;
    }

    const { prenom, nom, email, telephone, serviceId, nombrePages, description, prixCalcule, consentementRgpd } = validationResult.data;

    // Récupérer les fichiers uploadés et leurs métadonnées
    const uploadedFiles = req.files as Express.Multer.File[] || [];
    const fileMetadata = extractFileMetadata(req.body);
    const enrichedFiles = enrichFileData(uploadedFiles, fileMetadata);

    console.log(`📝 [PUBLIC ORDER] Nouvelle commande publique: ${email} - Service: ${serviceId} - Fichiers: ${enrichedFiles.length}`);

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

    // Créer une entrée temporaire dans PendingCommande - Sans mot de passe
    const pendingCommande = await prisma.pendingCommande.create({
      data: {
        prenom: prenom.trim(),
        nom: nom.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: "PENDING_ACTIVATION", // Valeur temporaire - sera défini lors de l'activation
        telephone: telephone?.trim() || null,
        serviceId,
        nombrePages, // Stocker le nombre de pages déclaré
        description: description?.trim() || null, // Stocker la description du projet
        consentementRgpd
      }
    });

    console.log(`✅ [PUBLIC ORDER] PendingCommande créée: ${pendingCommande.id}`);

    // Créer une session Stripe Checkout
    try {
      let priceId = service.stripePriceId || "default";
      let amount: number | undefined;
      
      // Si un prix calculé est fourni, utiliser le prix dynamique (services à la page)
      if (prixCalcule !== undefined && nombrePages !== undefined) {
        console.log(`💰 [PUBLIC ORDER] Prix calculé dynamique: ${prixCalcule}€ pour ${nombrePages} pages`);
        amount = Math.round(prixCalcule * 100); // Convertir en centimes
        priceId = "default"; // Forcer l'utilisation du prix dynamique
      } else if (!service.stripePriceId) {
        // Si pas de stripePriceId et pas de prix calculé, utiliser le prix du service
        console.log(`💰 [PUBLIC ORDER] Prix fixe du service: ${service.prix / 100}€`);
        amount = service.prix; // Le prix est déjà en centimes
        priceId = "default"; // Forcer l'utilisation du prix dynamique
      }
      
      const checkoutSession = await stripeService.createCheckoutSession({
        priceId,
        userId: pendingCommande.id, // Utiliser l'ID de la commande pending
        commandeId: pendingCommande.id,
        amount,
        successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-cancelled`
      });

      // Mettre à jour la PendingCommande avec l'ID de session Stripe
      await prisma.pendingCommande.update({
        where: { id: pendingCommande.id },
        data: { stripeSessionId: checkoutSession.id }
      });

      console.log(`💳 [PUBLIC ORDER] Session Stripe créée: ${checkoutSession.id} pour ${email}`);

      // Sauvegarder les fichiers temporairement avec pendingCommandeId
      if (enrichedFiles.length > 0) {
        try {
          console.log(`📎 [PUBLIC ORDER] Sauvegarde de ${enrichedFiles.length} fichier(s) temporaire(s)`);
          
          // Créer un utilisateur temporaire pour les fichiers si nécessaire
          let tempUser = await prisma.user.findFirst({
            where: { email: '__temp_upload_user__@staka.internal' }
          });
          
          if (!tempUser) {
            tempUser = await prisma.user.create({
              data: {
                prenom: 'TEMP',
                nom: 'UPLOAD_USER',
                email: '__temp_upload_user__@staka.internal',
                password: await bcrypt.hash('temp_password_not_used', 12),
                isActive: false,
                role: 'USER'
              }
            });
            console.log(`👤 [PUBLIC ORDER] Utilisateur temporaire créé: ${tempUser.id}`);
          }
          
          // Sauvegarder les métadonnées des fichiers pour la migration
          const fileMetadataMap = new Map();
          
          for (const fileData of enrichedFiles) {
            const fileRecord = await prisma.file.create({
              data: {
                filename: fileData.title,
                storedName: fileData.fileName,
                mimeType: fileData.mimeType,
                size: fileData.fileSize,
                url: `/uploads/orders/${fileData.fileName}`,
                type: 'DOCUMENT',
                description: fileData.description || null,
                uploadedById: tempUser.id, // Utiliser l'utilisateur temporaire
                commandeId: null, // Sera mis à jour lors du webhook
                isPublic: false,
              }
            });
            
            // Marquer le fichier comme temporaire dans la description
            await prisma.file.update({
              where: { id: fileRecord.id },
              data: {
                description: `TEMP_PENDING:${pendingCommande.id}|${fileData.description || ''}`
              }
            });
          }
          
          console.log(`✅ [PUBLIC ORDER] ${enrichedFiles.length} fichier(s) sauvegardé(s) temporairement`);
        } catch (fileError) {
          console.error(`❌ [PUBLIC ORDER] Erreur lors de la sauvegarde des fichiers:`, fileError);
          // Ne pas faire échouer la commande pour un problème de fichier
        }
      }

      res.status(201).json({
        message: "Commande créée avec succès",
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
        pendingCommandeId: pendingCommande.id,
        uploadedFiles: enrichedFiles.length
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