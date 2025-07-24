import { PrismaClient } from "@prisma/client";
import { MailerService } from "../utils/mailer";
import bcrypt from "bcryptjs";

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
   * Désactive le compte utilisateur (sans anonymisation)
   */
  static async deactivateUserAccount(userId: string): Promise<void> {
    try {
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error(`Utilisateur ${userId} introuvable`);
      }

      if (!user.isActive) {
        throw new Error(`Le compte utilisateur ${userId} est déjà désactivé`);
      }

      // Désactivation simple (conserve toutes les données)
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      console.log(`✅ [UserService] Compte utilisateur ${userId} désactivé`);

    } catch (error) {
      console.error('❌ [UserService] Erreur désactivation compte:', error);
      throw new Error(`Échec de la désactivation du compte: ${error instanceof Error ? error.message : error}`);
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

  /**
   * Récupère les statistiques utilisateur pour le profil
   */
  static async getUserStats(userId: string) {
    try {
      // Récupération des projets/commandes de l'utilisateur
      const projets = await prisma.commande.findMany({
        where: { 
          userId: userId,
          // Ne pas inclure les commandes supprimées
          deletedAt: null
        },
        select: {
          id: true,
          statut: true,
          rating: true,
        }
      });

      // Calcul des statistiques
      const totalProjects = projets.length;
      const completedProjects = projets.filter(p => 
        p.statut === 'TERMINE' || p.statut === 'LIVREE'
      ).length;

      // Calcul de la note moyenne (seulement les projets notés)
      const ratedProjects = projets.filter(p => p.rating && p.rating > 0);
      const averageRating = ratedProjects.length > 0 
        ? ratedProjects.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedProjects.length
        : 0;

      // Vérification du statut VIP (plus de 10 projets terminés)
      const isVip = completedProjects >= 10;

      return {
        totalProjects,
        completedProjects,
        averageRating: Math.round(averageRating * 10) / 10, // Arrondir à 1 décimale
        isVip
      };

    } catch (error) {
      console.error('❌ [UserService] Erreur récupération stats:', error);
      throw new Error(`Échec de la récupération des statistiques: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Met à jour le profil utilisateur
   */
  static async updateUserProfile(userId: string, data: {
    prenom?: string;
    nom?: string;
    telephone?: string;
    adresse?: string;
    bio?: string;
  }) {
    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new Error(`Utilisateur ${userId} introuvable`);
      }

      // Mettre à jour uniquement les champs fournis
      const updateData: any = {};
      if (data.prenom !== undefined) updateData.prenom = data.prenom;
      if (data.nom !== undefined) updateData.nom = data.nom;
      if (data.telephone !== undefined) updateData.telephone = data.telephone;
      if (data.adresse !== undefined) updateData.adresse = data.adresse;
      if (data.bio !== undefined) updateData.bio = data.bio;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          prenom: true,
          nom: true,
          telephone: true,
          adresse: true,
          bio: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log(`✅ [UserService] Profil utilisateur ${userId} mis à jour`);
      return updatedUser;

    } catch (error) {
      console.error('❌ [UserService] Erreur mise à jour profil:', error);
      throw new Error(`Échec de la mise à jour du profil: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Change le mot de passe utilisateur
   */
  static async changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Récupérer l'utilisateur avec son mot de passe
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          password: true
        }
      });

      if (!user) {
        throw new Error(`Utilisateur ${userId} introuvable`);
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Hasher le nouveau mot de passe
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      });

      console.log(`✅ [UserService] Mot de passe utilisateur ${userId} changé`);

    } catch (error) {
      console.error('❌ [UserService] Erreur changement mot de passe:', error);
      throw error; // Re-throw pour préserver le message d'erreur spécifique
    }
  }

  /**
   * Récupère les préférences utilisateur
   */
  static async getUserPreferences(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          preferences: true
        }
      });

      if (!user) {
        throw new Error(`Utilisateur ${userId} introuvable`);
      }

      // Si aucune préférence n'est définie, retourner les valeurs par défaut
      const defaultPreferences = {
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        notificationTypes: {
          projects: true,
          messages: true,
          invoices: true,
          promos: false
        },
        privacy: {
          publicProfile: false,
          analytics: true
        }
      };

      // Merger les préférences existantes avec les valeurs par défaut
      const userPreferences = user.preferences ? 
        JSON.parse(JSON.stringify(user.preferences)) : 
        {};

      return {
        ...defaultPreferences,
        ...userPreferences
      };

    } catch (error) {
      console.error('❌ [UserService] Erreur récupération préférences:', error);
      throw new Error(`Échec de la récupération des préférences: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Met à jour les préférences utilisateur
   */
  static async updateUserPreferences(userId: string, newPreferences: any) {
    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          preferences: true
        }
      });

      if (!existingUser) {
        throw new Error(`Utilisateur ${userId} introuvable`);
      }

      // Récupérer les préférences actuelles
      const currentPreferences = existingUser.preferences ? 
        JSON.parse(JSON.stringify(existingUser.preferences)) : 
        {};

      // Merger les nouvelles préférences avec les existantes
      const updatedPreferences = {
        ...currentPreferences,
        ...newPreferences,
        updatedAt: new Date().toISOString()
      };

      // Mettre à jour en base de données
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: updatedPreferences,
          updatedAt: new Date()
        },
        select: {
          preferences: true
        }
      });

      console.log(`✅ [UserService] Préférences utilisateur ${userId} mises à jour`);
      return updatedUser.preferences;

    } catch (error) {
      console.error('❌ [UserService] Erreur mise à jour préférences:', error);
      throw new Error(`Échec de la mise à jour des préférences: ${error instanceof Error ? error.message : error}`);
    }
  }
}