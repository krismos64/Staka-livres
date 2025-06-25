import sgMail from "@sendgrid/mail";

// Configuration SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string; // Base64
    filename: string;
    type: string;
    disposition: string;
  }>;
}

/**
 * Service d'envoi d'emails via SendGrid
 */
export class MailerService {
  private static fromEmail =
    process.env.FROM_EMAIL || "noreply@staka-livres.com";
  private static fromName = process.env.FROM_NAME || "Staka Livres";

  /**
   * Envoie un email
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn(
        "⚠️ [Mailer] SENDGRID_API_KEY non configuré - simulation d'envoi"
      );
      console.log(`📧 [Mailer] Simulation envoi à ${options.to}`);
      console.log(`📧 [Mailer] Sujet: ${options.subject}`);
      return;
    }

    try {
      const msg: any = {
        to: options.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      console.log(`📧 [Mailer] Envoi email à ${options.to}...`);
      await sgMail.send(msg);
      console.log(`✅ [Mailer] Email envoyé avec succès à ${options.to}`);
    } catch (error) {
      console.error(`❌ [Mailer] Erreur lors de l'envoi:`, error);
      throw new Error(`Échec de l'envoi d'email: ${error}`);
    }
  }

  /**
   * Envoie une facture par email
   */
  static async sendInvoiceEmail(
    userEmail: string,
    invoiceUrl: string,
    commandeTitle: string
  ): Promise<void> {
    const subject = `Facture pour votre commande: ${commandeTitle}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🧾 Votre facture est prête</h2>
        
        <p>Bonjour,</p>
        
        <p>Nous vous confirmons que votre paiement a été traité avec succès pour la commande <strong>"${commandeTitle}"</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e40af;">📄 Facture disponible</h3>
          <p style="margin: 0;">Téléchargez votre facture en cliquant sur le lien ci-dessous :</p>
          <a href="${invoiceUrl}" style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            📥 Télécharger la facture
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Note :</strong> Conservez cette facture pour vos archives. Elle peut être nécessaire pour vos déclarations.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 12px;">
          Cordialement,<br>
          <strong>L'équipe Staka Livres</strong><br>
          <a href="mailto:contact@staka-livres.com">contact@staka-livres.com</a>
        </p>
      </div>
    `;

    const text = `
Votre facture est prête

Bonjour,

Nous vous confirmons que votre paiement a été traité avec succès pour la commande "${commandeTitle}".

Téléchargez votre facture : ${invoiceUrl}

Conservez cette facture pour vos archives.

Cordialement,
L'équipe Staka Livres
contact@staka-livres.com
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      text,
      html,
    });
  }
}

export default MailerService;
