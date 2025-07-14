import { PrismaClient } from "@prisma/client";
import { MailerService } from "../utils/mailer";

const prisma = new PrismaClient();

export interface UserExportData {
  id: string;
  email: string;
  createdAt: Date;
  commandes: Array<{
    id: string;
    titre: string;
    description: string | null;
    statut: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  factures: Array<{
    id: string;
    commandeId: string;
    pdfUrl?: string;
    createdAt: Date;
    amount?: number;
  }>;
  messages: Array<{
    id: string;
    content: string;
    createdAt: Date;
    isFromAdmin: boolean;
  }>;
}

/**
 * Service pour les opérations utilisateur RGPD
 */
export class UserService {

  /**
   * Supprime le compte utilisateur (soft delete + anonymisation)
   */
  static async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error(`Utilisateur ${userId} introuvable`);
      }

      // Soft delete + anonymisation
      const anonymizedEmail = `deleted_${Date.now()}@anonymized.local`;
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: anonymizedEmail,
          prenom: "Utilisateur",
          nom: "Supprimé",
          // Conserver l'ID pour les références FK
        }
      });

      console.log(`✅ [UserService] Compte utilisateur ${userId} supprimé (soft delete)`);

    } catch (error) {
      console.error('❌ [UserService] Erreur suppression compte:', error);
      throw new Error(`Échec de la suppression du compte: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Exporte toutes les données utilisateur et les envoie par email
   */
  static async exportUserData(userId: string, userEmail: string): Promise<void> {
    try {
      // Récupération des données utilisateur
      const userData = await UserService.getUserData(userId);
      
      // Génération du fichier JSON
      const exportData = {
        exportDate: new Date().toISOString(),
        user: userData,
        dataTypes: ['profile', 'commandes', 'invoices', 'messages'],
        totalCommandes: userData.commandes.length,
        totalInvoices: userData.factures.length,
        totalMessages: userData.messages.length
      };

      // Conversion en JSON formaté
      const jsonContent = JSON.stringify(exportData, null, 2);
      const base64Content = Buffer.from(jsonContent, 'utf8').toString('base64');

      // Préparation de l'email avec pièce jointe
      const emailSubject = "Export de vos données personnelles (RGPD)";
      const filename = `export-donnees-${userData.id}-${new Date().toISOString().split('T')[0]}.json`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📄 Export de vos données personnelles</h2>
          
          <p>Bonjour,</p>
          
          <p>Suite à votre demande d'export de données personnelles conformément au RGPD, vous trouverez en pièce jointe l'ensemble de vos données stockées dans notre système.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">📊 Contenu de l'export</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Profil utilisateur :</strong> informations de base</li>
              <li><strong>Commandes :</strong> ${userData.commandes.length} commande(s)</li>
              <li><strong>Factures :</strong> ${userData.factures.length} facture(s)</li>
              <li><strong>Messages :</strong> ${userData.messages.length} message(s)</li>
            </ul>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
              Date d'export : ${new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Note :</strong> Ces données sont exportées au format JSON. Vous pouvez les ouvrir avec n'importe quel éditeur de texte.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 12px;">
            Cordialement,<br>
            <strong>L'équipe Staka Livres</strong><br>
            <a href="mailto:contact@staka-livres.com">contact@staka-livres.com</a>
          </p>
        </div>
      `;

      const emailText = `
Export de vos données personnelles (RGPD)

Bonjour,

Suite à votre demande d'export de données personnelles conformément au RGPD, vous trouverez en pièce jointe l'ensemble de vos données stockées dans notre système.

Contenu de l'export :
- Profil utilisateur : informations de base
- Commandes : ${userData.commandes.length} commande(s)
- Factures : ${userData.factures.length} facture(s)  
- Messages : ${userData.messages.length} message(s)

Date d'export : ${new Date().toLocaleDateString('fr-FR')}

Note : Ces données sont exportées au format JSON.

Cordialement,
L'équipe Staka Livres
contact@staka-livres.com
      `;

      // Envoi de l'email avec pièce jointe
      await MailerService.sendEmail({
        to: userEmail,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        attachments: [{
          content: base64Content,
          filename: filename,
          type: 'application/json',
          disposition: 'attachment'
        }]
      });

      console.log(`✅ [UserService] Données utilisateur ${userId} exportées et envoyées à ${userEmail}`);

    } catch (error) {
      console.error('❌ [UserService] Erreur export données:', error);
      throw new Error(`Échec de l'export des données: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Récupère toutes les données utilisateur pour l'export
   */
  private static async getUserData(userId: string): Promise<UserExportData> {
    try {
      // Récupération des données utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          createdAt: true,
        }
      });

      if (!user) {
        throw new Error(`Utilisateur ${userId} introuvable`);
      }

      // Récupération des commandes
      const commandes = await prisma.commande.findMany({
        where: { userId: userId },
        select: {
          id: true,
          titre: true,
          description: true,
          statut: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      // Récupération des factures via les commandes
      const commandesWithInvoices = await prisma.commande.findMany({
        where: { userId: userId },
        include: {
          invoices: {
            select: {
              id: true,
              commandeId: true,
              pdfUrl: true,
              createdAt: true,
              amount: true,
            }
          }
        }
      });

      const factures = commandesWithInvoices.flatMap(commande => commande.invoices);

      // Récupération des messages (envoyés ET reçus par l'utilisateur)
      const messages = await prisma.message.findMany({
        where: { 
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
          receiverId: true,
        },
        orderBy: { createdAt: 'asc' }
      });

      // Transformer les messages pour inclure isFromAdmin
      const messagesWithFlags = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        isFromAdmin: msg.senderId !== userId // Si ce n'est pas l'utilisateur qui envoie, c'est un admin
      }));

      return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        commandes,
        factures,
        messages: messagesWithFlags,
      };

    } catch (error) {
      console.error('❌ [UserService] Erreur récupération données:', error);
      throw new Error(`Échec de la récupération des données: ${error instanceof Error ? error.message : error}`);
    }
  }
}