import { MailerService } from "../utils/mailer";
import * as path from "path";
import * as Handlebars from "handlebars";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Service pour la gestion des emails d'activation de compte
 */
export class ActivationEmailService {
  
  /**
   * Génère un token d'activation unique avec expiration
   * @param pendingCommandeId - ID de la commande en attente
   * @returns Token d'activation
   */
  static async generateActivationToken(pendingCommandeId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    await prisma.pendingCommande.update({
      where: { id: pendingCommandeId },
      data: {
        activationToken: token,
        tokenExpiresAt: expiresAt
      }
    });

    console.log(`🔑 [ACTIVATION] Token généré pour ${pendingCommandeId}: ${token} (expire: ${expiresAt})`);
    return token;
  }

  /**
   * Envoie un email d'activation de compte après paiement validé
   * @param pendingCommande - Données de la commande en attente
   * @param commandeTitle - Titre de la commande créée
   */
  static async sendActivationEmail(
    pendingCommande: {
      id: string;
      prenom: string;
      nom: string;
      email: string;
      activationToken?: string | null;
    },
    commandeTitle: string
  ): Promise<void> {
    try {
      console.log(`📧 [ACTIVATION] Envoi d'email d'activation à ${pendingCommande.email}`);

      // Générer le token s'il n'existe pas
      let token = pendingCommande.activationToken;
      if (!token) {
        token = await this.generateActivationToken(pendingCommande.id);
      }

      // URLs depuis les variables d'environnement
      const frontendUrl = process.env.FRONTEND_URL || "https://livrestaka.fr";
      const supportEmail = process.env.SUPPORT_EMAIL || "contact@staka.fr";
      const activationUrl = `${frontendUrl}/activation/${token}`;

      // Variables pour le template
      const templateVars = {
        subject: "🎉 Activez votre compte Staka Livres - Paiement confirmé !",
        customerName: `${pendingCommande.prenom} ${pendingCommande.nom}`,
        firstName: pendingCommande.prenom,
        email: pendingCommande.email,
        activationUrl,
        commandeTitle,
        frontendUrl,
        supportEmail,
        tokenExpiry: "48 heures",
        createdAt: new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit", 
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
      };

      // Charger et compiler le template Handlebars
      const templatePath = path.join(__dirname, "../emails/templates/activation-user.hbs");
      
      if (!fs.existsSync(templatePath)) {
        // Créer un template temporaire si le fichier n'existe pas
        const fallbackHtml = this.createFallbackActivationEmail(templateVars);
        
        await MailerService.sendEmail({
          to: pendingCommande.email,
          subject: templateVars.subject,
          html: fallbackHtml,
        });
        
        console.log(`✅ [ACTIVATION] Email d'activation envoyé (fallback) à ${pendingCommande.email}`);
        return;
      }

      const templateContent = fs.readFileSync(templatePath, "utf-8");
      const template = Handlebars.compile(templateContent);
      const html = template(templateVars);

      // Envoyer l'email via MailerService
      await MailerService.sendEmail({
        to: pendingCommande.email,
        subject: templateVars.subject,
        html: html,
      });

      console.log(`✅ [ACTIVATION] Email d'activation envoyé avec succès à ${pendingCommande.email}`);

    } catch (error) {
      console.error(`❌ [ACTIVATION] Erreur lors de l'envoi de l'email d'activation à ${pendingCommande.email}:`, error);
      
      if (error instanceof Error) {
        console.error(`❌ [ACTIVATION] Détail de l'erreur: ${error.message}`);
      }
      
      // Re-throw l'erreur pour que le webhook puisse la gérer
      throw error;
    }
  }

  /**
   * Valide et consomme un token d'activation
   * @param token - Token d'activation
   * @returns Données de la commande en attente ou null si invalid
   */
  static async validateActivationToken(token: string) {
    try {
      const pendingCommande = await prisma.pendingCommande.findFirst({
        where: {
          activationToken: token,
          tokenExpiresAt: {
            gt: new Date() // Token non expiré
          },
          isProcessed: false // Pas encore traité
        }
      });

      if (!pendingCommande) {
        console.log(`❌ [ACTIVATION] Token invalide ou expiré: ${token}`);
        return null;
      }

      console.log(`✅ [ACTIVATION] Token valide trouvé: ${token} pour ${pendingCommande.email}`);
      return pendingCommande;

    } catch (error) {
      console.error(`❌ [ACTIVATION] Erreur lors de la validation du token:`, error);
      return null;
    }
  }

  /**
   * Marque une commande en attente comme traitée
   * @param pendingCommandeId - ID de la commande en attente
   */
  static async markAsProcessed(pendingCommandeId: string): Promise<void> {
    await prisma.pendingCommande.update({
      where: { id: pendingCommandeId },
      data: { 
        isProcessed: true,
        activationToken: null, // Invalider le token
        tokenExpiresAt: null
      }
    });

    console.log(`✅ [ACTIVATION] Commande ${pendingCommandeId} marquée comme traitée`);
  }

  /**
   * Crée un template HTML de fallback pour l'email d'activation
   * @param vars - Variables du template
   * @returns HTML de l'email
   */
  private static createFallbackActivationEmail(vars: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${vars.subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Activez votre compte Staka Livres</h1>
    </div>
    <div class="content">
      <p>Bonjour ${vars.firstName},</p>
      
      <p>Excellente nouvelle ! Votre paiement pour la commande "<strong>${vars.commandeTitle}</strong>" a été confirmé.</p>
      
      <p>Pour accéder à votre espace client et suivre l'avancement de votre projet, veuillez activer votre compte en cliquant sur le lien ci-dessous :</p>
      
      <p style="text-align: center;">
        <a href="${vars.activationUrl}" class="button">Activer mon compte</a>
      </p>
      
      <p><strong>Important :</strong> Ce lien d'activation expire dans ${vars.tokenExpiry}.</p>
      
      <p>Si le lien ne fonctionne pas, copiez-collez cette URL dans votre navigateur :<br>
      <code>${vars.activationUrl}</code></p>
      
      <p>Une fois votre compte activé, vous pourrez vous connecter avec :</p>
      <ul>
        <li><strong>Email :</strong> ${vars.email}</li>
        <li><strong>Mot de passe :</strong> celui que vous avez choisi lors de la commande</li>
      </ul>
    </div>
    <div class="footer">
      <p>Besoin d'aide ? Contactez-nous à ${vars.supportEmail}</p>
      <p>© 2025 Staka Livres - Service de correction professionnelle</p>
    </div>
  </div>
</body>
</html>`;
  }
}