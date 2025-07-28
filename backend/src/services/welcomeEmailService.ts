import { MailerService } from "../utils/mailer";
import * as path from "path";
import * as Handlebars from "handlebars";
import * as fs from "fs";

/**
 * Service pour l'envoi d'emails de bienvenue aux nouveaux utilisateurs
 */
export class WelcomeEmailService {
  /**
   * Envoie un email de bienvenue à un nouvel utilisateur
   * @param userEmail - Email de l'utilisateur
   * @param userName - Nom complet de l'utilisateur
   * @param firstName - Prénom de l'utilisateur
   */
  static async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    firstName?: string
  ): Promise<void> {
    try {
      console.log(`📧 [WELCOME] Envoi d'email de bienvenue à ${userEmail} (${userName})`);

      // URLs depuis les variables d'environnement
      const frontendUrl = process.env.FRONTEND_URL || "https://livrestaka.fr";
      const supportEmail = process.env.SUPPORT_EMAIL || "contact@staka.fr";
      const dashboardUrl = `${frontendUrl}/app`;

      // Variables pour le template
      const templateVars = {
        subject: "🎉 Bienvenue chez Staka Livres - Votre inscription est confirmée !",
        customerName: userName,
        firstName: firstName || userName.split(' ')[0], // Premier mot comme prénom par défaut
        email: userEmail,
        frontendUrl,
        dashboardUrl,
        supportEmail,
        createdAt: new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit", 
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
      };

      // Charger et compiler le template Handlebars
      const templatePath = path.join(__dirname, "../emails/templates/welcome-user.hbs");
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template d'email de bienvenue non trouvé : ${templatePath}`);
      }

      const templateContent = fs.readFileSync(templatePath, "utf-8");
      const template = Handlebars.compile(templateContent);
      const html = template(templateVars);

      // Envoyer l'email via MailerService
      await MailerService.sendEmail({
        to: userEmail,
        subject: templateVars.subject,
        html: html,
      });

      console.log(`✅ [WELCOME] Email de bienvenue envoyé avec succès à ${userEmail}`);

    } catch (error) {
      console.error(`❌ [WELCOME] Erreur lors de l'envoi de l'email de bienvenue à ${userEmail}:`, error);
      
      // Ne pas faire échouer l'inscription si l'email ne part pas
      // L'utilisateur sera quand même inscrit
      if (error instanceof Error) {
        console.error(`❌ [WELCOME] Détail de l'erreur: ${error.message}`);
      }
      
      // Optionnel : On pourrait logger cela dans un système de monitoring
      // ou créer une tâche de retry pour plus tard
    }
  }

  /**
   * Valide qu'un email est au bon format avant envoi
   * @param email - Email à valider
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Formate le nom utilisateur pour l'affichage
   * @param prenom - Prénom
   * @param nom - Nom de famille
   */
  static formatUserName(prenom?: string, nom?: string): string {
    const firstName = prenom?.trim() || "";
    const lastName = nom?.trim() || "";
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    return firstName || lastName || "Utilisateur";
  }
}