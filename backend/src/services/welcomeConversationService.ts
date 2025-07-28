import { PrismaClient, MessageType, User, Commande } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

/**
 * Service pour la création de conversations de bienvenue automatiques
 */
export class WelcomeConversationService {
  
  /**
   * Crée une conversation de bienvenue pour un nouvel utilisateur après paiement
   * @param user - Utilisateur nouvellement créé
   * @param commande - Commande associée
   */
  static async createWelcomeConversation(
    user: { id: string; prenom: string; nom: string; email: string },
    commande: { id: string; titre: string }
  ): Promise<void> {
    try {
      console.log(`💬 [WELCOME CONV] Création conversation de bienvenue pour ${user.email}`);

      // Générer un ID de conversation unique
      const conversationId = uuidv4();

      // Message de bienvenue personnalisé
      const welcomeMessage = this.generateWelcomeMessage(user.prenom, commande.titre);

      // Créer le message de bienvenue depuis le "système"
      const message = await prisma.message.create({
        data: {
          senderId: null, // Message système (pas d'expéditeur)
          receiverId: user.id,
          subject: "🎉 Bienvenue chez Staka Livres !",
          content: welcomeMessage,
          type: MessageType.SYSTEM_MESSAGE,
          statut: "ENVOYE",
          isRead: false,
          conversationId,
          displayFirstName: "Équipe",
          displayLastName: "Staka Livres",
          displayRole: "Support",
          isFromVisitor: false,
          metadata: JSON.stringify({
            isWelcomeMessage: true,
            commandeId: commande.id,
            welcomeType: "post_payment",
            createdBySystem: true
          })
        }
      });

      console.log(`✅ [WELCOME CONV] Message de bienvenue créé: ${message.id} pour ${user.email}`);

      // Créer un message de suivi pour guider l'utilisateur
      const followUpMessage = this.generateFollowUpMessage(user.prenom);
      
      await prisma.message.create({
        data: {
          senderId: null, // Message système
          receiverId: user.id,
          subject: "📋 Prochaines étapes de votre projet",
          content: followUpMessage,
          type: MessageType.SYSTEM_MESSAGE,
          statut: "ENVOYE",
          isRead: false,
          conversationId,
          displayFirstName: "Équipe",
          displayLastName: "Staka Livres",
          displayRole: "Support",
          isFromVisitor: false,
          metadata: JSON.stringify({
            isFollowUpMessage: true,
            commandeId: commande.id,
            messageType: "next_steps",
            createdBySystem: true
          })
        }
      });

      console.log(`✅ [WELCOME CONV] Message de suivi créé pour ${user.email}`);
      console.log(`💬 [WELCOME CONV] Conversation ${conversationId} créée avec succès`);

    } catch (error) {
      console.error(`❌ [WELCOME CONV] Erreur création conversation pour ${user.email}:`, error);
      throw error;
    }
  }

  /**
   * Génère le message de bienvenue personnalisé
   * @param prenom - Prénom de l'utilisateur
   * @param commandeTitle - Titre de la commande
   * @returns Message de bienvenue formaté
   */
  private static generateWelcomeMessage(prenom: string, commandeTitle: string): string {
    return `Bonjour ${prenom},

🎉 **Félicitations !** Votre paiement a été confirmé avec succès et votre projet de correction "${commandeTitle}" est maintenant en cours de traitement.

## ✅ Ce qui vient d'être fait :
- ✅ Votre paiement a été validé
- ✅ Votre compte client a été créé
- ✅ Votre projet a été assigné à notre équipe de correcteurs professionnels
- ✅ Votre facture a été générée et envoyée par email

## 📊 Suivez votre projet :
Depuis votre espace client, vous pouvez maintenant :
- 📋 Consulter le statut de votre correction en temps réel
- 💬 Échanger directement avec nos correcteurs
- 📄 Télécharger vos documents une fois la correction terminée
- 🧾 Accéder à vos factures et historique

## 🚀 Prochaines étapes :
Notre équipe va maintenant :
1. **Analyser votre document** et définir la stratégie de correction
2. **Assigner un correcteur spécialisé** dans votre domaine
3. **Commencer la correction** selon nos standards de qualité
4. **Vous tenir informé** de l'avancement via cette messagerie

## ❓ Questions ou besoins spécifiques ?
N'hésitez pas à nous écrire directement dans cette conversation. Notre équipe support vous répondra dans les plus brefs délais.

**Merci de nous faire confiance pour votre projet !**

L'équipe Staka Livres 📚`;
  }

  /**
   * Génère le message de suivi avec les prochaines étapes
   * @param prenom - Prénom de l'utilisateur
   * @returns Message de suivi formaté
   */
  private static generateFollowUpMessage(prenom: string): string {
    return `${prenom}, voici ce qu'il faut savoir sur votre projet :

## ⏱️ Délais indicatifs :
- **Analyse initiale** : 24-48h après validation du paiement
- **Début de correction** : 2-5 jours ouvrés
- **Livraison finale** : Selon la complexité de votre document

## 📧 Notifications automatiques :
Vous recevrez un email à chaque étape importante :
- 🔍 Début d'analyse de votre document
- ✏️ Début de la correction
- 📝 Demandes de précisions si nécessaires
- ✅ Correction terminée et document disponible

## 💡 Conseils pour optimiser votre correction :
- **Soyez disponible** pour répondre aux questions de nos correcteurs
- **Précisez vos attentes** si vous avez des exigences particulières
- **Consultez régulièrement** votre espace client pour les mises à jour

## 🎯 Objectif qualité :
Notre engagement : vous livrer un document parfaitement corrigé, respectant les règles de :
- ✅ Orthographe et grammaire
- ✅ Style et cohérence
- ✅ Structure et lisibilité
- ✅ Respect de vos spécificités

**À bientôt dans votre espace client !** 👋`;
  }

  /**
   * Crée une conversation de support pour une question spécifique
   * @param userId - ID de l'utilisateur
   * @param subject - Sujet de la conversation
   * @param initialMessage - Message initial
   * @returns ID de la conversation créée
   */
  static async createSupportConversation(
    userId: string,
    subject: string,
    initialMessage: string
  ): Promise<string> {
    try {
      const conversationId = uuidv4();

      await prisma.message.create({
        data: {
          senderId: userId,
          subject,
          content: initialMessage,
          type: MessageType.SUPPORT_MESSAGE,
          statut: "ENVOYE",
          isRead: false,
          conversationId,
          isFromVisitor: false
        }
      });

      console.log(`💬 [SUPPORT CONV] Conversation support créée: ${conversationId}`);
      return conversationId;

    } catch (error) {
      console.error(`❌ [SUPPORT CONV] Erreur création conversation support:`, error);
      throw error;
    }
  }
}