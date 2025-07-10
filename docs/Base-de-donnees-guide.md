# 🗄️ Guide Complet de la Base de Données - Staka Livres

## 📋 **Vue d'ensemble**

La base de données **Staka Livres** est une architecture complète MySQL 8 gérée par **Prisma ORM** et déployée avec **Docker**. Elle couvre tous les aspects d'une plateforme de correction de manuscrits : utilisateurs, projets, un système de messagerie unifié, support client, facturation automatique et contenu éditorial.

### 🏗️ **Architecture Technique**

- **Base de données** : MySQL 8.4+
- **ORM** : Prisma (dernière version)
- **Environnement** : Docker Compose
- **Port** : 3306 (MySQL), 5555 (Prisma Studio)
- **Container** : `staka_db` (MySQL), `staka_backend` (API + Prisma)
- **Volume persistant** : Données sauvegardées lors des redémarrages

---

## 🎯 **Modèles de Données**

### 👤 **1. User - Utilisateurs**

**Table** : `users`

```prisma
model User {
  id                      String           @id @default(uuid())
  prenom                  String           @db.VarChar(100)
  nom                     String           @db.VarChar(100)
  email                   String           @unique @db.VarChar(255)
  password                String           @db.VarChar(255)
  role                    Role             @default(USER)
  isActive                Boolean          @default(true)
  createdAt               DateTime         @default(now())
  updatedAt               DateTime         @updatedAt
  adresse                 String?          @db.Text
  avatar                  String?          @db.VarChar(500)
  telephone               String?          @db.VarChar(20)

  // Relations
  commandes               Commande[]
  files                   File[]           @relation("FileOwner")
  receivedMessages        Message[]        @relation("MessageReceiver")
  sentMessages            Message[]        @relation("MessageSender")
  notifications           Notification[]
  paymentMethods          PaymentMethod[]
  assignedSupportRequests SupportRequest[] @relation("SupportAssignee")
  supportRequests         SupportRequest[]
}
```

### 📋 **2. Commande - Projets de Correction**

**Table** : `commandes`

```prisma
model Commande {
  id              String         @id @default(uuid())
  userId          String         // FK vers User
  titre           String         @db.VarChar(255)
  description     String?        @db.Text
  fichierUrl      String?        @db.VarChar(500) // Optionnel, pour compatibilité
  statut          StatutCommande @default(EN_ATTENTE)
  noteClient      String?        @db.Text
  noteCorrecteur  String?        @db.Text
  priorite        Priorite       @default(NORMALE)
  dateEcheance    DateTime?
  dateFinition    DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  // Champs Stripe
  paymentStatus   String?        @db.VarChar(50)
  stripeSessionId String?        @db.VarChar(255)
  amount          Int?

  // Relations
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  files           File[]         @relation("CommandeFiles")
  invoices        Invoice[]
  // La relation directe avec les messages est supprimée pour plus de flexibilité.
  // Les conversations sont maintenant gérées par un système indépendant.
}
```

### 💬 **4. Message - Messagerie Unifiée par Conversation**

**Table** : `messages`

Le système de messagerie a été refactorisé pour être plus flexible. Il n'est plus directement lié aux commandes ou aux tickets de support, mais utilise un `conversationId` pour regrouper les messages.

```prisma
model Message {
  id             String @id @default(uuid())
  conversationId String @default(uuid()) // Regroupe les messages d'une même conversation

  senderId   String? // Optionnel: ID de l'utilisateur connecté
  receiverId String? // Toujours un admin pour le premier message

  // Champs pour les visiteurs non connectés
  visitorEmail String? @db.VarChar(255)
  visitorName  String? @db.VarChar(100)

  subject    String?       @db.VarChar(255)
  content    String        @db.Text
  type       MessageType   @default(USER_MESSAGE)
  statut     MessageStatut @default(ENVOYE)
  isRead     Boolean       @default(false)
  isArchived Boolean       @default(false)
  isPinned   Boolean       @default(false)
  parentId   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  attachments MessageAttachment[]
  parent      Message?            @relation("MessageThread", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  replies     Message[]           @relation("MessageThread")
  receiver    User?               @relation("MessageReceiver", fields: [receiverId], references: [id], onDelete: SetNull)
  sender      User?               @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)
}
```

**Logique des conversations :**

1.  **Nouveau message (visiteur ou client)** :
    - Un premier message est créé.
    - Prisma génère automatiquement un `conversationId`.
    - Pour les visiteurs, `visitorEmail` et `visitorName` sont remplis.
    - Pour les clients, `senderId` est rempli.
    - Le `receiverId` est l'ID d'un administrateur.
2.  **Réponses** :
    - Tous les messages de réponse (du client ou de l'admin) réutilisent le même `conversationId` pour lier les messages entre eux.
    - Le `parentId` peut être utilisé pour créer des fils de discussion.

Ce système découplé permet de gérer des conversations qui ne sont pas forcément liées à une commande ou un ticket, offrant une plus grande flexibilité.

### 🎫 **6. SupportRequest - Tickets de Support**

**Table** : `support_requests`

```prisma
model SupportRequest {
  id              String               @id @default(uuid())
  userId          String               // FK vers User (créateur)
  title           String               @db.VarChar(255)
  description     String               @db.Text
  category        SupportCategory      @default(GENERAL)
  priority        SupportPriority      @default(NORMALE)
  status          SupportRequestStatus @default(OUVERT)
  assignedToId    String?              // FK vers User (admin assigné)
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  // Relations
  user            User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignedTo      User?                @relation("SupportAssignee", fields: [assignedToId], references: [id], onDelete: SetNull)
  // La relation directe avec les messages est supprimée.
}
```

---

## _(Les autres modèles restent inchangés dans leur structure mais la documentation détaillée de leurs endpoints API est retirée pour se concentrer sur la base de données.)_

## 🐳 **Utilisation avec Docker et Prisma Studio**

### **1. Démarrage des Services**

```bash
# Démarrer tous les containers
docker-compose up -d
```

### **2. Prisma Studio - Interface d'Administration**

```bash
# Lancer Prisma Studio
docker exec -it staka_backend npx prisma studio

# Interface accessible sur : http://localhost:5555
```

### **3. Commandes de Maintenance Prisma**

```bash
# Appliquer les migrations en production
docker exec -it staka_backend npx prisma migrate deploy

# Générer le client Prisma après modification du schéma
docker exec -it staka_backend npx prisma generate

# Pousser les changements du schéma vers la DB (développement)
docker exec -it staka_backend npx prisma db push
```

---

## 📊 **Requêtes Prisma Courantes (Exemples Mis à Jour)**

### **Utilisateurs et Authentification**

```typescript
// Récupérer un profil utilisateur avec ses commandes
const profile = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    commandes: true,
    notifications: { where: { isRead: false } },
  },
});
```

### **Commandes et Projets**

```typescript
// Dashboard admin : commandes par statut
const stats = await prisma.commande.groupBy({
  by: ["statut"],
  _count: { id: true },
});
```

### **Messagerie et Support**

```typescript
// Récupérer tous les messages d'une conversation
const conversationMessages = await prisma.message.findMany({
  where: { conversationId: "some-conversation-uuid" },
  include: {
    sender: { select: { prenom: true, nom: true, avatar: true } },
    attachments: { include: { file: true } },
  },
  orderBy: { createdAt: "asc" },
});

// Créer un message de réponse dans une conversation
const replyMessage = await prisma.message.create({
  data: {
    conversationId: "some-conversation-uuid", // Utiliser l'ID existant
    senderId: adminId,
    receiverId: clientId,
    content: "Bonjour, nous avons bien reçu votre message.",
    type: "USER_MESSAGE",
  },
});

// Trouver toutes les conversations pour un utilisateur
const userConversations = await prisma.message.findMany({
  where: {
    OR: [{ senderId: userId }, { receiverId: userId }],
  },
  distinct: ["conversationId"],
  select: {
    conversationId: true,
  },
});
```

---

_Ce document se concentre sur la structure de la base de données et son interaction avec Prisma. Pour la documentation détaillée des endpoints API, veuillez consulter le `ADMIN_GUIDE_UNIFIED.md`._
