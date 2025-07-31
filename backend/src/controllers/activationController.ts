import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ActivationEmailService } from "../services/activationEmailService";
import { signToken } from "../utils/token";
import { notifyAdminNewRegistration } from "./notificationsController";

const prisma = new PrismaClient();

// Schéma de validation pour l'activation avec mot de passe
const activateWithPasswordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(100),
});

/**
 * Activer un compte utilisateur via token d'activation
 * Route: GET /api/public/activate/:token
 */
export const activateAccount = async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  try {
    const { token } = req.params;

    if (!token) {
      console.log(`❌ [ACTIVATION] Token manquant dans la requête`);
      res.status(400).json({
        error: "Token manquant",
        message: "Le token d'activation est requis"
      });
      return;
    }

    console.log(`🔑 [ACTIVATION] Tentative d'activation avec token: ${token}`);

    // Valider le token et récupérer la commande en attente
    const pendingCommande = await ActivationEmailService.validateActivationToken(token);

    if (!pendingCommande) {
      console.log(`❌ [ACTIVATION] Token invalide, expiré ou déjà utilisé: ${token}`);
      res.status(400).json({
        error: "Token invalide",
        message: "Le lien d'activation est invalide, expiré ou a déjà été utilisé. Veuillez contacter le support si nécessaire."
      });
      return;
    }

    console.log(`✅ [ACTIVATION] Token valide pour ${pendingCommande.email}`);

    // Vérifier que l'utilisateur existe et récupérer ses informations
    const user = await prisma.user.findUnique({
      where: { id: pendingCommande.userId! },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        isActive: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      console.error(`❌ [ACTIVATION] Utilisateur non trouvé pour pendingCommande: ${pendingCommande.id}`);
      res.status(404).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur associé à ce token n'existe pas"
      });
      return;
    }

    if (user.isActive) {
      console.log(`⚠️ [ACTIVATION] Compte déjà actif pour ${user.email}`);
      res.status(400).json({
        error: "Compte déjà activé",
        message: "Votre compte est déjà activé. Vous pouvez vous connecter normalement."
      });
      return;
    }

    // Activer l'utilisateur
    const activatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        isActive: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true
      }
    });

    console.log(`🎉 [ACTIVATION] Compte activé avec succès: ${activatedUser.email}`);

    // Marquer la commande en attente comme traitée
    await ActivationEmailService.markAsProcessed(pendingCommande.id);

    // Notifier les admins de la nouvelle inscription
    try {
      await notifyAdminNewRegistration(
        `${activatedUser.prenom} ${activatedUser.nom}`,
        activatedUser.email
      );
      console.log(`🔔 [ACTIVATION] Notification admin envoyée pour ${activatedUser.email}`);
    } catch (notifError) {
      console.error(`❌ [ACTIVATION] Erreur notification admin:`, notifError);
      // Ne pas faire échouer l'activation pour un problème de notification
    }

    // Générer un JWT pour connexion automatique (optionnel)
    const jwtToken = signToken({
      userId: activatedUser.id,
      email: activatedUser.email,
      role: activatedUser.role
    });

    console.log(`🔐 [ACTIVATION] JWT généré pour connexion automatique: ${activatedUser.email}`);

    // Log de sécurité
    console.log(`🔐 [ACTIVATION AUDIT] ${new Date().toISOString()} - ACCOUNT_ACTIVATED - Email: ${activatedUser.email} - IP: ${ip} - UserAgent: ${userAgent?.substring(0, 100)}`);

    // Réponse avec les informations nécessaires pour le frontend
    res.status(200).json({
      message: "Compte activé avec succès",
      success: true,
      user: {
        id: activatedUser.id,
        prenom: activatedUser.prenom,
        nom: activatedUser.nom,
        email: activatedUser.email,
        role: activatedUser.role
      },
      token: jwtToken, // Pour connexion automatique
      redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/app/dashboard`
    });

  } catch (error) {
    console.error("❌ [ACTIVATION] Erreur lors de l'activation:", error);
    
    // Log de sécurité pour l'erreur
    console.log(`🔐 [ACTIVATION AUDIT ERROR] ${new Date().toISOString()} - ACTIVATION_ERROR - Token: ${req.params.token} - IP: ${ip} - UserAgent: ${userAgent?.substring(0, 100)} - Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible d'activer le compte. Veuillez réessayer ou contacter le support."
    });
  }
};

/**
 * Vérifier le statut d'un token d'activation (sans l'activer)
 * Route: GET /api/public/activate/:token/verify
 */
export const verifyActivationToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        error: "Token manquant",
        message: "Le token d'activation est requis"
      });
      return;
    }

    console.log(`🔍 [ACTIVATION] Vérification token: ${token}`);

    // Valider le token sans le consommer
    const pendingCommande = await ActivationEmailService.validateActivationToken(token);

    if (!pendingCommande) {
      res.status(400).json({
        error: "Token invalide",
        message: "Le lien d'activation est invalide, expiré ou a déjà été utilisé",
        valid: false
      });
      return;
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: pendingCommande.userId! },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(404).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur associé à ce token n'existe pas",
        valid: false
      });
      return;
    }

    const isAlreadyActive = user.isActive;

    res.status(200).json({
      message: "Token vérifié",
      valid: true,
      user: {
        prenom: user.prenom,
        nom: user.nom,
        email: user.email
      },
      isAlreadyActive,
      expiresAt: pendingCommande.tokenExpiresAt
    });

  } catch (error) {
    console.error("❌ [ACTIVATION] Erreur lors de la vérification:", error);
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible de vérifier le token",
      valid: false
    });
  }
};

/**
 * Activer un compte avec définition de mot de passe
 * Route: POST /api/public/activate/:token/set-password
 */
export const activateAccountWithPassword = async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  try {
    const { token } = req.params;
    
    if (!token) {
      console.log(`❌ [ACTIVATION] Token manquant dans la requête`);
      res.status(400).json({
        error: "Token manquant",
        message: "Le token d'activation est requis"
      });
      return;
    }

    // Validation du mot de passe
    const validationResult = activateWithPasswordSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.log(`❌ [ACTIVATION] Validation mot de passe échouée:`, validationResult.error.errors);
      res.status(400).json({
        error: "Mot de passe invalide",
        message: "Le mot de passe doit contenir au moins 8 caractères",
        details: validationResult.error.errors
      });
      return;
    }

    const { password } = validationResult.data;

    console.log(`🔑 [ACTIVATION] Tentative d'activation avec mot de passe pour token: ${token}`);

    // Valider le token et récupérer la commande en attente
    const pendingCommande = await ActivationEmailService.validateActivationToken(token);

    if (!pendingCommande) {
      console.log(`❌ [ACTIVATION] Token invalide, expiré ou déjà utilisé: ${token}`);
      res.status(400).json({
        error: "Token invalide",
        message: "Le lien d'activation est invalide, expiré ou a déjà été utilisé."
      });
      return;
    }

    console.log(`✅ [ACTIVATION] Token valide pour ${pendingCommande.email}`);

    // Vérifier que l'utilisateur existe et récupérer ses informations
    const user = await prisma.user.findUnique({
      where: { id: pendingCommande.userId! },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        isActive: true,
        role: true,
        password: true
      }
    });

    if (!user) {
      console.error(`❌ [ACTIVATION] Utilisateur non trouvé pour pendingCommande: ${pendingCommande.id}`);
      res.status(404).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur associé à ce token n'existe pas"
      });
      return;
    }

    if (user.isActive) {
      console.log(`⚠️ [ACTIVATION] Compte déjà actif pour ${user.email}`);
      res.status(400).json({
        error: "Compte déjà activé",
        message: "Votre compte est déjà activé. Vous pouvez vous connecter normalement."
      });
      return;
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Activer l'utilisateur avec le nouveau mot de passe
    const activatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        isActive: true,
        password: passwordHash, // Définir le mot de passe choisi
        updatedAt: new Date()
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true
      }
    });

    console.log(`🎉 [ACTIVATION] Compte activé avec mot de passe défini: ${activatedUser.email}`);

    // Marquer la commande en attente comme traitée
    await ActivationEmailService.markAsProcessed(pendingCommande.id);

    // Notifier les admins de la nouvelle inscription
    try {
      await notifyAdminNewRegistration(
        `${activatedUser.prenom} ${activatedUser.nom}`,
        activatedUser.email
      );
      console.log(`🔔 [ACTIVATION] Notification admin envoyée pour ${activatedUser.email}`);
    } catch (notifError) {
      console.error(`❌ [ACTIVATION] Erreur notification admin:`, notifError);
      // Ne pas faire échouer l'activation pour un problème de notification
    }

    // Générer un JWT pour connexion automatique
    const jwtToken = signToken({
      userId: activatedUser.id,
      email: activatedUser.email,
      role: activatedUser.role
    });

    console.log(`🔐 [ACTIVATION] JWT généré pour connexion automatique: ${activatedUser.email}`);

    // Log de sécurité
    console.log(`🔐 [ACTIVATION AUDIT] ${new Date().toISOString()} - ACCOUNT_ACTIVATED_WITH_PASSWORD - Email: ${activatedUser.email} - IP: ${ip} - UserAgent: ${userAgent?.substring(0, 100)}`);

    // Réponse avec les informations nécessaires pour le frontend
    res.status(200).json({
      message: "Compte activé avec succès",
      success: true,
      user: {
        id: activatedUser.id,
        prenom: activatedUser.prenom,
        nom: activatedUser.nom,
        email: activatedUser.email,
        role: activatedUser.role
      },
      token: jwtToken, // Pour connexion automatique
      redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/app/dashboard`
    });

  } catch (error) {
    console.error("❌ [ACTIVATION] Erreur lors de l'activation avec mot de passe:", error);
    
    // Log de sécurité pour l'erreur
    console.log(`🔐 [ACTIVATION AUDIT ERROR] ${new Date().toISOString()} - ACTIVATION_PASSWORD_ERROR - Token: ${req.params.token} - IP: ${ip} - UserAgent: ${userAgent?.substring(0, 100)} - Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Impossible d'activer le compte. Veuillez réessayer ou contacter le support."
    });
  }
};