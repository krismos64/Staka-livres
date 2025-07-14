import { Request, Response } from "express";
import { MailerService } from "../utils/mailer";

/**
 * Contrôleur pour les endpoints publics (sans authentification)
 */

/**
 * Envoie un message de contact depuis le formulaire public du site
 */
export const sendContactMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { nom, email, sujet, message } = req.body;

    // Validation des champs requis (avant nettoyage)
    if (!nom || !email || !sujet || !message) {
      res.status(400).json({
        error: "Tous les champs sont requis",
        details: "Nom, email, sujet et message sont obligatoires"
      });
      return;
    }

    // Nettoyage des données (trim) - AVANT les autres validations
    const cleanData = {
      nom: nom.trim(),
      email: email.trim().toLowerCase(),
      sujet: sujet.trim(),
      message: message.trim()
    };

    // Validation des champs requis APRÈS nettoyage
    if (!cleanData.nom || !cleanData.email || !cleanData.sujet || !cleanData.message) {
      res.status(400).json({
        error: "Tous les champs sont requis",
        details: "Les champs ne peuvent pas être vides (après suppression des espaces)"
      });
      return;
    }

    // Validation format email (sur les données nettoyées)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanData.email)) {
      res.status(400).json({
        error: "Format d'email invalide",
        details: "Veuillez saisir une adresse email valide"
      });
      return;
    }

    // Validation longueur des champs (sur les données nettoyées)
    if (cleanData.nom.length > 100) {
      res.status(400).json({
        error: "Nom trop long",
        details: "Le nom ne peut pas dépasser 100 caractères"
      });
      return;
    }

    if (cleanData.sujet.length > 200) {
      res.status(400).json({
        error: "Sujet trop long", 
        details: "Le sujet ne peut pas dépasser 200 caractères"
      });
      return;
    }

    if (cleanData.message.length > 5000) {
      res.status(400).json({
        error: "Message trop long",
        details: "Le message ne peut pas dépasser 5000 caractères"
      });
      return;
    }

    // Adresse email de support (configurable)
    const supportEmail = process.env.SUPPORT_EMAIL || "contact@staka.fr";

    // Construction du contenu HTML de l'email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #2563eb; margin-bottom: 20px;">📧 Nouveau message de contact depuis le site</h2>
          
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">👤 Informations du contact</h3>
            <p style="margin: 5px 0;"><strong>Nom :</strong> ${cleanData.nom}</p>
            <p style="margin: 5px 0;"><strong>Email :</strong> ${cleanData.email}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin-bottom: 10px;">📋 Sujet</h3>
            <p style="background-color: #f8fafc; padding: 10px; border-left: 4px solid #2563eb; margin: 0;">
              ${cleanData.sujet}
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin-bottom: 10px;">💬 Message</h3>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
              ${cleanData.message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">
              Ce message a été envoyé depuis le formulaire de contact du site web.<br>
              Vous pouvez répondre directement à l'expéditeur : ${cleanData.email}
            </p>
            <p style="margin: 10px 0 0 0;">
              <strong>Staka Livres</strong> - Système de contact automatique
            </p>
          </div>
        </div>
      </div>
    `;

    // Contenu texte alternatif
    const textContent = `
Nouveau message de contact depuis le site

Informations du contact :
- Nom : ${cleanData.nom}
- Email : ${cleanData.email}

Sujet : ${cleanData.sujet}

Message :
${cleanData.message}

---
Ce message a été envoyé depuis le formulaire de contact du site web.
Vous pouvez répondre directement à l'expéditeur : ${cleanData.email}

Staka Livres - Système de contact automatique
    `;

    // Envoi de l'email
    await MailerService.sendEmail({
      to: supportEmail,
      subject: `Contact site – ${cleanData.sujet}`,
      html: htmlContent,
      text: textContent,
    });

    console.log(`✅ [Contact] Message envoyé depuis le site par ${cleanData.nom} (${cleanData.email})`);

    // Réponse de succès
    res.status(200).json({
      success: true,
      message: "Votre message a bien été envoyé à notre équipe. Nous vous répondrons sous 24h."
    });

  } catch (error) {
    console.error("❌ [Contact] Erreur lors de l'envoi du message de contact:", error);
    
    res.status(500).json({
      error: "Erreur lors de l'envoi du message",
      message: "Une erreur technique est survenue. Veuillez réessayer ou nous contacter directement."
    });
  }
};