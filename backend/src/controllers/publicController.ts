import { Request, Response } from "express";
import { MailerService } from "../utils/mailer";
import { PrismaClient, Role, MessageType, MessageStatut, FileType } from "@prisma/client";
import { notifyAdminNewMessage } from "./notificationsController";
import { AuditService, AUDIT_ACTIONS } from "../services/auditService";
import fs from "fs";

// Interface pour étendre Request avec le fichier multer
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

const prisma = new PrismaClient();

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

    // Créer une notification admin au lieu d'envoyer l'email directement
    try {
      await notifyAdminNewMessage(
        `${cleanData.nom} (contact site)`,
        `${cleanData.sujet}: ${cleanData.message.substring(0, 100)}${cleanData.message.length > 100 ? "..." : ""}`,
        true
      );
    } catch (notificationError) {
      console.error("Erreur lors de la création de la notification:", notificationError);
      // Continue even if notification fails
    }

    // Envoyer une confirmation par e-mail au visiteur
    try {
      const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:3001";
      
      await MailerService.sendEmail({
        to: cleanData.email,
        subject: "Nous avons bien reçu votre message - Staka Livres",
        template: "visitor-contact-confirmation.hbs",
        variables: {
          name: cleanData.nom,
          supportDelay: "24 h",
          siteUrl: appUrl
        }
      });

      console.log(`✅ [Contact] E-mail de confirmation envoyé à ${cleanData.email}`);
    } catch (emailError) {
      console.error("❌ [Contact] Erreur lors de l'envoi de l'e-mail de confirmation:", emailError);
      // Continue même si l'e-mail de confirmation échoue
    }

    console.log(`✅ [Contact] Message reçu depuis le site par ${cleanData.nom} (${cleanData.email})`);

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

/**
 * Traite les demandes d'échantillon gratuit depuis la landing page
 */
export const sendFreeSampleRequest = async (
  req: RequestWithFile,
  res: Response
): Promise<void> => {
  try {
    const { nom, email, telephone, genre, description } = req.body;
    const fichier = req.file; // Le fichier uploadé via multer

    // Validation des champs requis
    if (!nom || !email) {
      res.status(400).json({
        error: "Nom et email sont requis",
        details: "Ces champs sont obligatoires pour traiter votre demande"
      });
      return;
    }

    // Nettoyage des données
    const cleanData = {
      nom: nom.trim(),
      email: email.trim().toLowerCase(),
      telephone: telephone ? telephone.trim() : '',
      genre: genre ? genre.trim() : '',
      description: description ? description.trim() : '',
      fichier: fichier || null
    };

    // Validation des champs requis APRÈS nettoyage
    if (!cleanData.nom || !cleanData.email) {
      res.status(400).json({
        error: "Nom et email sont requis",
        details: "Ces champs ne peuvent pas être vides"
      });
      return;
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanData.email)) {
      res.status(400).json({
        error: "Format d'email invalide",
        details: "Veuillez saisir une adresse email valide"
      });
      return;
    }

    // Validation longueur des champs
    if (cleanData.nom.length > 100) {
      res.status(400).json({
        error: "Nom trop long",
        details: "Le nom ne peut pas dépasser 100 caractères"
      });
      return;
    }

    if (cleanData.description && cleanData.description.length > 2000) {
      res.status(400).json({
        error: "Description trop longue", 
        details: "La description ne peut pas dépasser 2000 caractères"
      });
      return;
    }

    // Trouver le premier admin disponible pour assigner le message
    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
      orderBy: { createdAt: "asc" },
    });

    if (!admin) {
      res.status(500).json({ 
        error: "Service temporairement indisponible",
        message: "Veuillez réessayer plus tard ou nous contacter directement"
      });
      return;
    }

    // Construire le contenu du message
    const messageContent = `
🎯 DEMANDE D'ÉCHANTILLON GRATUIT

📋 Informations du projet :
• Genre littéraire : ${cleanData.genre || 'Non spécifié'}
• Description : ${cleanData.description || 'Non fournie'}
• Téléphone : ${cleanData.telephone || 'Non fourni'}

📝 Demande : 10 pages de correction gratuite sans engagement

${cleanData.fichier ? '📎 Fichier joint : ' + cleanData.fichier.originalname + ' (' + Math.round(cleanData.fichier.size / 1024) + ' Ko)' : '⚠️ Aucun fichier joint pour le moment'}

---
Cette demande provient de la landing page section "Testez notre expertise gratuitement".
    `.trim();

    // Créer le message dans la messagerie admin
    const message = await prisma.message.create({
      data: {
        visitorEmail: cleanData.email,
        visitorName: cleanData.nom,
        receiverId: admin.id,
        subject: `🎯 Échantillon gratuit - ${cleanData.nom}`,
        content: messageContent,
        type: MessageType.USER_MESSAGE,
        statut: MessageStatut.ENVOYE,
        // Note: source serait utile mais pas défini dans le schéma Prisma
      },
    });

    // Si un fichier est fourni, le sauvegarder et l'associer au message
    if (cleanData.fichier) {
      try {
        // Créer l'entrée File dans la base de données
        const fileRecord = await prisma.file.create({
          data: {
            filename: cleanData.fichier.originalname,
            storedName: cleanData.fichier.filename,
            mimeType: cleanData.fichier.mimetype,
            size: cleanData.fichier.size,
            url: cleanData.fichier.path,
            type: FileType.DOCUMENT,
            uploadedById: admin.id, // Associer à l'admin pour simplifier
            description: `Fichier joint à la demande d'échantillon gratuit de ${cleanData.nom}`,
            isPublic: false,
          },
        });

        // Associer le fichier au message
        await prisma.messageAttachment.create({
          data: {
            messageId: message.id,
            fileId: fileRecord.id,
          },
        });

        console.log(`✅ [FreeSample] Fichier ${cleanData.fichier.originalname} sauvegardé et associé au message`);
      } catch (fileError) {
        console.error(`❌ [FreeSample] Erreur lors de la sauvegarde du fichier:`, fileError);
        // Ne pas faire échouer la demande pour un problème de fichier
      }
    }

    // Adresse email de support
    const supportEmail = process.env.SUPPORT_EMAIL || "contact@staka.fr";

    // Construction du contenu HTML de l'email pour l'équipe
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #16a34a; margin-bottom: 20px;">🎯 Nouvelle demande d'échantillon gratuit</h2>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #16a34a;">
            <h3 style="margin: 0 0 10px 0; color: #15803d;">👤 Informations du prospect</h3>
            <p style="margin: 5px 0;"><strong>Nom :</strong> ${cleanData.nom}</p>
            <p style="margin: 5px 0;"><strong>Email :</strong> <a href="mailto:${cleanData.email}">${cleanData.email}</a></p>
            ${cleanData.telephone ? `<p style="margin: 5px 0;"><strong>Téléphone :</strong> ${cleanData.telephone}</p>` : ''}
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #15803d; margin-bottom: 10px;">📚 Détails du projet</h3>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <p style="margin: 5px 0;"><strong>Genre littéraire :</strong> ${cleanData.genre || 'Non spécifié'}</p>
              ${cleanData.description ? `
                <p style="margin: 5px 0;"><strong>Description du projet :</strong></p>
                <div style="background-color: white; padding: 10px; border-radius: 4px; margin-top: 10px;">
                  ${cleanData.description.replace(/\n/g, '<br>')}
                </div>
              ` : '<p style="margin: 5px 0; color: #6b7280;"><em>Aucune description fournie</em></p>'}
            </div>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0; color: #d97706;">🎯 Action requise</h3>
            <p style="margin: 0; font-weight: bold;">Le prospect souhaite recevoir 10 pages corrigées gratuitement</p>
            ${cleanData.fichier ? '<p style="margin: 5px 0 0 0; color: #059669;">✅ Fichier joint fourni : ' + cleanData.fichier.originalname + ' (' + Math.round(cleanData.fichier.size / 1024) + ' Ko)</p>' : '<p style="margin: 5px 0 0 0; color: #dc2626;">⚠️ Aucun fichier joint - contacter le prospect</p>'}
          </div>

          <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #2563eb;">📨 Messagerie admin</h3>
            <p style="margin: 0;">Cette demande a été automatiquement ajoutée à la messagerie de <strong>${admin.prenom} ${admin.nom}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">ID conversation : ${message.conversationId}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">
              Cette demande provient de la landing page section "Testez notre expertise gratuitement".<br>
              Réponse attendue sous 48h selon les engagements du site.
            </p>
            <p style="margin: 10px 0 0 0;">
              <strong>Staka Livres</strong> - Système d'échantillons gratuits automatique
            </p>
          </div>
        </div>
      </div>
    `;

    // Contenu texte alternatif
    const textContent = `
🎯 Nouvelle demande d'échantillon gratuit

Informations du prospect :
- Nom : ${cleanData.nom}
- Email : ${cleanData.email}
${cleanData.telephone ? `- Téléphone : ${cleanData.telephone}` : ''}

Détails du projet :
- Genre littéraire : ${cleanData.genre || 'Non spécifié'}
${cleanData.description ? `- Description : ${cleanData.description}` : ''}

Action requise : Le prospect souhaite recevoir 10 pages corrigées gratuitement
${cleanData.fichier ? '✅ Fichier joint fourni : ' + cleanData.fichier.originalname + ' (' + Math.round(cleanData.fichier.size / 1024) + ' Ko)' : '⚠️ Aucun fichier joint - contacter le prospect'}

Cette demande a été automatiquement ajoutée à la messagerie de ${admin.prenom} ${admin.nom}
ID conversation : ${message.conversationId}

---
Cette demande provient de la landing page section "Testez notre expertise gratuitement".
Réponse attendue sous 48h selon les engagements du site.

Staka Livres - Système d'échantillons gratuits automatique
    `;

    // Préparer les attachments pour l'email (format SendGrid)
    const attachments = cleanData.fichier ? [{
      content: fs.readFileSync(cleanData.fichier.path, { encoding: 'base64' }),
      filename: cleanData.fichier.originalname,
      type: cleanData.fichier.mimetype,
      disposition: 'attachment'
    }] : [];

    // Email removal: Now handled by admin notification system via eventBus
    // The notification below will trigger an automatic email

    // Notification dans l'interface admin
    try {
      await notifyAdminNewMessage(
        `${cleanData.nom} (échantillon gratuit)`, 
        "Demande d'échantillon gratuit de 10 pages", 
        true
      );
    } catch (notificationError) {
      console.error("Erreur lors de la création de la notification:", notificationError);
    }

    // Log d'audit
    await AuditService.logAdminAction(
      'system',
      AUDIT_ACTIONS.USER_MESSAGE_SUPPORT_EMAIL_SENT,
      'system',
      'free-sample-request',
      {
        prospectEmail: cleanData.email,
        prospectName: cleanData.nom,
        genre: cleanData.genre,
        hasFile: !!cleanData.fichier,
        fileName: cleanData.fichier?.originalname || null,
        fileSize: cleanData.fichier?.size || null,
        assignedToAdmin: admin.email,
        conversationId: message.conversationId
      },
      req.ip,
      req.get('user-agent'),
      'MEDIUM'
    );

    // Envoyer une confirmation par e-mail au visiteur
    try {
      const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:3001";
      
      await MailerService.sendEmail({
        to: cleanData.email,
        subject: "Demande d'échantillon bien reçue - Staka Livres",
        template: "visitor-sample-confirmation.hbs",
        variables: {
          name: cleanData.nom,
          supportDelay: "48 h",
          siteUrl: appUrl
        }
      });

      console.log(`✅ [FreeSample] E-mail de confirmation envoyé à ${cleanData.email}`);
    } catch (emailError) {
      console.error("❌ [FreeSample] Erreur lors de l'envoi de l'e-mail de confirmation:", emailError);
      // Continue même si l'e-mail de confirmation échoue
    }

    console.log(`✅ [FreeSample] Demande d'échantillon gratuit reçue de ${cleanData.nom} (${cleanData.email})`);

    // Réponse de succès
    res.status(200).json({
      success: true,
      message: "Votre demande d'échantillon gratuit a bien été envoyée ! Nous vous recontacterons sous 48h avec vos 10 pages corrigées gratuitement.",
      conversationId: message.conversationId
    });

  } catch (error) {
    console.error("❌ [FreeSample] Erreur lors du traitement de la demande d'échantillon gratuit:", error);
    
    res.status(500).json({
      error: "Erreur lors de l'envoi de votre demande",
      message: "Une erreur technique est survenue. Veuillez réessayer ou nous contacter directement."
    });
  }
};