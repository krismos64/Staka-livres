import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  token?: string;
}

/**
 * Service pour la gestion des tokens de réinitialisation de mot de passe
 * Conforme aux exigences RGPD/CNIL
 */
export class PasswordResetService {
  private static readonly TOKEN_TTL_HOURS = 1; // 1 heure d'expiration
  private static readonly TOKEN_LENGTH = 32; // 32 octets aléatoires

  /**
   * Crée un nouveau token de réinitialisation
   */
  static async createToken(userId: string): Promise<PasswordResetResult> {
    try {
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          success: false,
          message: "Utilisateur introuvable"
        };
      }

      // Invalider tous les tokens existants pour cet utilisateur
      await prisma.passwordReset.deleteMany({
        where: { userId: userId }
      });

      // Générer un nouveau token sécurisé
      const rawToken = PasswordResetService.generateSecureToken();
      const tokenHash = PasswordResetService.hashToken(rawToken);

      // Calculer l'expiration (1 heure)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_TTL_HOURS);

      // Créer l'entrée en base
      await prisma.passwordReset.create({
        data: {
          userId: userId,
          tokenHash: tokenHash,
          expiresAt: expiresAt
        }
      });

      console.log(`✅ [PasswordResetService] Token créé pour utilisateur ${userId}`);

      return {
        success: true,
        message: "Token de réinitialisation créé",
        token: rawToken
      };

    } catch (error) {
      console.error('❌ [PasswordResetService] Erreur création token:', error);
      return {
        success: false,
        message: "Erreur lors de la création du token"
      };
    }
  }

  /**
   * Vérifie la validité d'un token de réinitialisation
   */
  static async verifyToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const tokenHash = PasswordResetService.hashToken(token);

      // Rechercher le token en base
      const passwordReset = await prisma.passwordReset.findUnique({
        where: { tokenHash: tokenHash }
      });

      if (!passwordReset) {
        return { valid: false };
      }

      // Vérifier l'expiration
      if (passwordReset.expiresAt < new Date()) {
        // Nettoyer le token expiré
        await prisma.passwordReset.delete({
          where: { id: passwordReset.id }
        });
        return { valid: false };
      }

      return {
        valid: true,
        userId: passwordReset.userId
      };

    } catch (error) {
      console.error('❌ [PasswordResetService] Erreur vérification token:', error);
      return { valid: false };
    }
  }

  /**
   * Consomme un token de réinitialisation (usage unique)
   */
  static async consumeToken(token: string): Promise<{ success: boolean; userId?: string }> {
    try {
      const tokenHash = PasswordResetService.hashToken(token);

      // Rechercher et supprimer le token en une seule opération
      const passwordReset = await prisma.passwordReset.findUnique({
        where: { tokenHash: tokenHash }
      });

      if (!passwordReset) {
        return { success: false };
      }

      // Vérifier l'expiration
      if (passwordReset.expiresAt < new Date()) {
        await prisma.passwordReset.delete({
          where: { id: passwordReset.id }
        });
        return { success: false };
      }

      // Supprimer le token (usage unique)
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id }
      });

      console.log(`✅ [PasswordResetService] Token consommé pour utilisateur ${passwordReset.userId}`);

      return {
        success: true,
        userId: passwordReset.userId
      };

    } catch (error) {
      console.error('❌ [PasswordResetService] Erreur consommation token:', error);
      return { success: false };
    }
  }

  /**
   * Nettoie tous les tokens expirés
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await prisma.passwordReset.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`✅ [PasswordResetService] ${result.count} tokens expirés nettoyés`);

    } catch (error) {
      console.error('❌ [PasswordResetService] Erreur nettoyage tokens:', error);
    }
  }

  /**
   * Invalide tous les tokens d'un utilisateur
   */
  static async invalidateUserTokens(userId: string): Promise<void> {
    try {
      await prisma.passwordReset.deleteMany({
        where: { userId: userId }
      });

      console.log(`✅ [PasswordResetService] Tokens invalidés pour utilisateur ${userId}`);

    } catch (error) {
      console.error('❌ [PasswordResetService] Erreur invalidation tokens:', error);
    }
  }

  /**
   * Génère un token sécurisé (UUID + 32 octets aléatoires)
   */
  private static generateSecureToken(): string {
    const uuid = uuidv4().replace(/-/g, '');
    const randomData = randomBytes(this.TOKEN_LENGTH);
    const combined = Buffer.concat([Buffer.from(uuid, 'hex'), randomData]);
    return combined.toString('base64url');
  }

  /**
   * Hash un token avec SHA-256
   */
  private static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}