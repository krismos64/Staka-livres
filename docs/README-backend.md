# Backend Staka Livres

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.10-purple)
![Stripe](https://img.shields.io/badge/Stripe-18.2-purple)
![MySQL](https://img.shields.io/badge/MySQL-8.4-orange)

## 📋 Vue d'ensemble

Backend REST API pour Staka Livres, une plateforme de correction de livres professionnelle. Architecture moderne avec TypeScript, Express, Prisma ORM et intégration Stripe pour les paiements.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- Docker & Docker Compose
- Compte Stripe (test keys)

### Installation avec Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker logs staka_backend

# Appliquer les migrations
docker exec -it staka_backend npx prisma migrate dev

# Générer le client Prisma
docker exec -it staka_backend npx prisma generate

# Seed des données de test
docker exec -it staka_backend npm run db:seed
```

### Installation locale (développement)

```bash
# Installation des dépendances
npm install

# Configuration base de données
npm run db:migrate
npm run db:generate
npm run db:seed

# Démarrage en mode développement
npm run dev
```

## 🏗️ Architecture

### Structure des dossiers

```
backend/
├── src/
│   ├── controllers/          # Logique métier
│   │   ├── authController.ts      # Authentification
│   │   ├── adminController.ts     # Administration
│   │   ├── commandeController.ts  # Gestion commandes (admin)
│   │   ├── commandeClientController.ts  # Commandes côté client
│   │   ├── messagesController.ts  # Système de messagerie
│   │   └── paymentController.ts   # Paiements Stripe
│   ├── middleware/           # Middlewares de sécurité
│   │   ├── auth.ts               # Authentification JWT
│   │   └── requireRole.ts        # Contrôle d'accès par rôle
│   ├── routes/              # Définition des routes
│   │   ├── auth.ts              # Routes d'authentification
│   │   ├── admin.ts             # Routes administrateur
│   │   ├── commandes.ts         # Routes commandes client
│   │   ├── messages.ts          # Routes messagerie
│   │   └── payments.ts          # Routes paiements
│   ├── services/            # Services externes
│   │   └── stripeService.ts     # Intégration Stripe
│   ├── utils/               # Utilitaires
│   │   └── token.ts             # Gestion tokens JWT
│   ├── types/               # Types TypeScript
│   ├── config/              # Configuration
│   └── server.ts            # Point d'entrée principal
├── prisma/
│   ├── schema.prisma        # Modèle de données
│   ├── seed.ts              # Données de test
│   └── migrations/          # Migrations base de données
├── tests/                   # Tests unitaires et d'intégration
├── dist/                    # Code compilé TypeScript
├── .env                     # Variables d'environnement
├── package.json
├── tsconfig.json
├── jest.config.js
├── nodemon.json
└── Dockerfile
```

## 🗄️ Modèle de données

### Entités principales

```typescript
// Utilisateur
User {
  id: string (UUID)
  prenom: string
  nom: string
  email: string (unique)
  password: string (hashé bcrypt)
  role: "USER" | "ADMIN"
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
  commandes: Commande[]
  messages: Message[]
}

// Commande
Commande {
  id: string (UUID)
  userId: string
  titre: string
  description?: string
  fichierUrl?: string
  statut: "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "ANNULEE"
  noteClient?: string
  noteCorrecteur?: string
  paymentStatus?: "unpaid" | "paid" | "failed"
  stripeSessionId?: string
  createdAt: DateTime
  updatedAt: DateTime
  user: User
  messages: Message[]
}

// Message (Système de messagerie unifiée)
Message {
  id: string (UUID)
  senderId: string
  receiverId?: string
  commandeId?: string
  supportRequestId?: string
  subject?: string
  content: string
  type: MessageType
  statut: MessageStatut
  isRead: boolean
  isArchived: boolean
  isPinned: boolean
  threadId?: string
  parentId?: string
  createdAt: DateTime
  updatedAt: DateTime
  sender: User
  receiver?: User
  commande?: Commande
  supportRequest?: SupportRequest
  parent?: Message
  replies: Message[]
  attachments: MessageAttachment[]
}
```

## 🔐 Authentification & Sécurité

### JWT Authentication

- Tokens JWT avec expiration 24h
- Middleware `auth.ts` pour protection des routes
- Hachage bcrypt pour mots de passe
- Contrôle d'accès basé sur les rôles (USER/ADMIN)

### Middlewares de sécurité

```typescript
// Helmet - Headers de sécurité
app.use(helmet());

// CORS configuré
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Rate limiting (à implémenter)
// Body parsing sécurisé
```

### Protection des routes

```typescript
// Route protégée utilisateur connecté
router.get("/profile", auth, getProfile);

// Route protégée admin uniquement
router.get("/admin/stats", auth, requireRole("ADMIN"), getStats);
```

## 📡 API Reference

### Base URL

- **Développement**: `http://localhost:3001`
- **Production**: `https://api.staka-editions.com`

### Routes d'authentification (`/auth`)

```http
POST /auth/register
Content-Type: application/json

{
  "prenom": "Jean",
  "nom": "Dupont",
  "email": "jean@example.com",
  "password": "motdepasse123"
}

# Response: 201
{
  "message": "Utilisateur créé avec succès",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "prenom": "Jean",
    "nom": "Dupont",
    "email": "jean@example.com",
    "role": "USER"
  }
}
```

```http
POST /auth/login
Content-Type: application/json

{
  "email": "jean@example.com",
  "password": "motdepasse123"
}

# Response: 200
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "prenom": "Jean",
    "nom": "Dupont",
    "email": "jean@example.com",
    "role": "USER"
  }
}
```

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# Response: 200
{
  "id": "uuid",
  "prenom": "Jean",
  "nom": "Dupont",
  "email": "jean@example.com",
  "role": "USER",
  "isActive": true
}
```

### Routes commandes client (`/commandes`)

```http
# Créer une commande
POST /commandes
Authorization: Bearer token
Content-Type: application/json

{
  "titre": "Mon livre à corriger",
  "description": "Description détaillée...",
  "fichierUrl": "https://example.com/file.pdf"
}

# Mes commandes
GET /commandes
Authorization: Bearer token

# Détail d'une commande
GET /commandes/:id
Authorization: Bearer token
```

### Routes paiements (`/payments`)

```http
# Créer session Stripe Checkout
POST /payments/create-checkout-session
Authorization: Bearer token
Content-Type: application/json

{
  "commandeId": "uuid-commande"
}

# Response: 200
{
  "url": "https://checkout.stripe.com/pay/cs_...",
  "sessionId": "cs_..."
}

# Statut du paiement
GET /payments/status/:sessionId
Authorization: Bearer token

# Webhook Stripe (pas d'auth)
POST /payments/webhook
Stripe-Signature: t=...
Content-Type: application/json

# Response: 200
{
  "received": true,
  "eventType": "checkout.session.completed"
}
```

## 💬 **Système de Messagerie Unifiée - NOUVEAU**

### **Vue d'ensemble**

Système de messagerie complet avec support pour :

- **Messages directs** entre utilisateurs
- **Messages projet** liés aux commandes
- **Messages support** via tickets
- **Threading** et réponses
- **Pièces jointes** avec gestion fichiers
- **Administration** complète côté admin

### **Architecture technique**

#### **Types de messages**

```typescript
enum MessageType {
  USER_MESSAGE     // Message standard utilisateur
  SYSTEM_MESSAGE   // Message automatique du système
  ADMIN_MESSAGE    // Message administrateur
}

enum MessageStatut {
  BROUILLON        // En cours de rédaction
  ENVOYE           // Envoyé avec succès
  DELIVRE          // Délivré au destinataire
  LU               // Lu par le destinataire
  ARCHIVE          // Archivé
}
```

#### **Contrôle d'accès intelligent**

- **Utilisateurs** : Accès aux messages où ils sont expéditeur/destinataire
- **Propriétaires de projets** : Accès aux messages liés à leurs commandes
- **Support** : Accès aux messages des tickets assignés/créés
- **Admins** : Accès complet à tous les messages

#### **Anti-spam & sécurité**

- **Rate limiting** : 50 messages/heure par utilisateur
- **Validation contenu** : Maximum 10,000 caractères
- **Vérification contexte** : Au moins un destinataire requis
- **RGPD** : Soft delete par défaut, hard delete admin

### **Routes Messages (`/messages`)**

#### **1. POST /messages - Créer un message**

```http
POST /messages
Authorization: Bearer token
Content-Type: application/json

{
  "content": "Contenu du message",
  "receiverId": "uuid-destinataire",        // Optionnel (message direct)
  "commandeId": "uuid-commande",            // Optionnel (message projet)
  "supportRequestId": "uuid-ticket",       // Optionnel (message support)
  "subject": "Sujet du message",            // Optionnel
  "type": "TEXT",                           // TEXT, FILE, IMAGE, SYSTEM
  "parentId": "uuid-message-parent"        // Optionnel (réponse)
}

# Response: 201
{
  "message": "Message créé avec succès",
  "data": {
    "id": "msg-123",
    "content": "Contenu du message",
    "type": "USER_MESSAGE",
    "statut": "ENVOYE",
    "isRead": false,
    "isPinned": false,
    "threadId": "thread-456",
    "createdAt": "2024-01-15T10:30:00Z",
    "sender": {
      "id": "user-789",
      "prenom": "Jean",
      "nom": "Dupont",
      "role": "USER"
    },
    "receiver": { ... },
    "commande": {
      "id": "cmd-123",
      "titre": "Mon projet",
      "statut": "EN_COURS"
    },
    "attachments": [],
    "_count": { "replies": 0 }
  }
}
```

#### **2. GET /messages - Liste avec filtres et pagination**

```http
GET /messages?page=1&limit=20&commandeId=cmd-123&isRead=false&search=correction
Authorization: Bearer token

# Filtres disponibles:
# - page, limit: Pagination
# - commandeId: Messages d'un projet
# - supportRequestId: Messages d'un ticket support
# - threadId: Messages d'un thread
# - type: Type de message
# - statut: Statut du message
# - isRead: true/false - Messages lus/non lus
# - isArchived: true/false - Messages archivés
# - isPinned: true/false - Messages épinglés
# - search: Recherche dans contenu et sujet

# Response: 200
{
  "messages": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

#### **3. GET /messages/stats - Statistiques utilisateur**

```http
GET /messages/stats
Authorization: Bearer token

# Response: 200
{
  "totalSent": 45,
  "totalReceived": 38,
  "unreadCount": 7,
  "pinnedCount": 3,
  "projectMessages": 25,
  "supportMessages": 12,
  "total": 83
}
```

#### **4. GET /messages/:id - Détail avec réponses**

```http
GET /messages/msg-123
Authorization: Bearer token

# Response: 200
{
  "id": "msg-123",
  "content": "Message principal",
  "subject": "Discussion projet",
  // ... autres champs
  "replies": [
    {
      "id": "msg-124",
      "content": "Première réponse",
      "createdAt": "2024-01-15T11:00:00Z",
      "sender": { ... },
      "attachments": []
    }
  ],
  "attachments": [
    {
      "id": "att-456",
      "file": {
        "filename": "document.pdf",
        "size": 1024000,
        "mimeType": "application/pdf",
        "url": "https://storage.../document.pdf"
      }
    }
  ]
}
```

#### **5. PATCH /messages/:id - Mise à jour statut**

```http
PATCH /messages/msg-123
Authorization: Bearer token
Content-Type: application/json

{
  "isRead": true,          // Marquer comme lu (destinataire uniquement)
  "isArchived": false,     // Archiver/désarchiver
  "isPinned": true,        // Épingler (expéditeur/admin uniquement)
  "statut": "LU"          // Changer statut (expéditeur/admin uniquement)
}

# Contrôle des permissions:
# - isRead: Seul le destinataire peut marquer comme lu
# - isArchived: Tous les utilisateurs concernés
# - isPinned: Seul l'expéditeur ou admin
# - statut: Seul l'expéditeur ou admin
```

#### **6. DELETE /messages/:id - Suppression RGPD**

```http
DELETE /messages/msg-123?hard=false
Authorization: Bearer token

# Paramètres:
# - hard=true: Suppression définitive (ADMIN uniquement)
# - hard=false: Soft delete (anonymisation)

# Soft Delete (défaut):
# - Contenu remplacé par "[Message supprimé]"
# - Message marqué comme archivé
# - Pièces jointes conservées

# Hard Delete (Admin uniquement):
# - Suppression définitive du message
# - Suppression des pièces jointes
# - Suppression en cascade des réponses
```

#### **7. POST /messages/:id/attachments - Pièces jointes**

```http
POST /messages/msg-123/attachments
Authorization: Bearer token
Content-Type: application/json

{
  "fileId": "file-456"  // Fichier déjà uploadé via l'API Files
}

# Contraintes:
# - Seul l'expéditeur peut ajouter des pièces jointes
# - Maximum 10 pièces jointes par message
# - Le fichier doit appartenir à l'utilisateur
```

### **Routes Admin Messagerie (`/admin/conversations`)**

#### **1. GET /admin/conversations - Vue globale admin**

```http
GET /admin/conversations?page=1&limit=100&search=client&isRead=false&sortBy=user
Authorization: Bearer admin-token

# Paramètres:
# - page, limit: Pagination (max 100)
# - search: Recherche par nom utilisateur
# - isRead: Filtrer lu/non lu
# - sortBy: "user" (alphabétique) ou "date"

# Response: 200
{
  "conversations": [
    {
      "id": "direct_user1_user2",
      "type": "direct",
      "participants": {
        "client": {
          "nom": "Dupont",
          "prenom": "Jean"
        }
      },
      "messageCount": 5,
      "unreadCount": 2,
      "lastMessage": {
        "content": "Dernier message...",
        "createdAt": "2024-01-15T10:30:00Z",
        "sender": "Jean Dupont"
      }
    }
  ],
  "total": 45,
  "page": 1
}
```

#### **2. POST /admin/conversations/:id/messages - Message admin**

```http
POST /admin/conversations/direct_user1_user2/messages
Authorization: Bearer admin-token
Content-Type: application/json

{
  "contenu": "Message de l'administrateur",
  "isNote": false  // true pour note interne non visible
}

# Fonctionnalités backend:
# - Parser intelligent des conversation IDs
# - Identification automatique du destinataire
# - Support des contextes: direct, projet, support
# - Communication bidirectionnelle garantie
```

#### **3. GET /admin/conversations/stats - Statistiques globales**

```http
GET /admin/conversations/stats
Authorization: Bearer admin-token

# Response: 200
{
  "total": 156,
  "unread": 23,
  "totalMessages": 1247
}
```

#### **4. DELETE /admin/conversations/:id - Suppression RGPD**

```http
DELETE /admin/conversations/direct_user1_user2
Authorization: Bearer admin-token

# Suppression définitive de tous les messages
# de la conversation en base de données
```

### **Architecture Backend Avancée**

#### **Parser de Conversation IDs**

```typescript
const parseConversationId = (conversationId: string) => {
  if (conversationId.startsWith("direct_")) {
    return {
      type: "direct",
      userIds: conversationId.split("_").slice(1),
    };
  } else if (conversationId.startsWith("projet_")) {
    return {
      type: "projet",
      commandeId: conversationId.replace("projet_", ""),
    };
  } else if (conversationId.startsWith("support_")) {
    return {
      type: "support",
      supportRequestId: conversationId.replace("support_", ""),
    };
  }
  return null;
};
```

#### **Grouping automatique Messages → Conversations**

```typescript
const groupMessagesIntoConversations = (messages: Message[]) => {
  const conversationsMap = new Map();

  messages.forEach((message) => {
    let conversationId: string;

    if (message.commandeId) {
      conversationId = `projet_${message.commandeId}`;
    } else if (message.supportRequestId) {
      conversationId = `support_${message.supportRequestId}`;
    } else {
      // Conversation directe
      const userIds = [message.senderId, message.receiverId]
        .filter(Boolean)
        .sort();
      conversationId = `direct_${userIds.join("_")}`;
    }

    // Accumulation des messages par conversation
    // Calcul automatique compteurs non-lus
    // Détermination du dernier message
  });

  return Array.from(conversationsMap.values());
};
```

#### **Mapping Types Frontend ↔ Backend**

```typescript
// Compatibilité avec les types frontend
const mapFrontendTypeToPrisma = (frontendType: string): MessageType => {
  switch (frontendType) {
    case "TEXT":
    case "FILE":
    case "IMAGE":
      return MessageType.USER_MESSAGE;
    case "SYSTEM":
      return MessageType.SYSTEM_MESSAGE;
    case "ADMIN_NOTE":
      return MessageType.ADMIN_MESSAGE;
    default:
      return MessageType.USER_MESSAGE;
  }
};
```

## 🎯 **Webhook Stripe - Nouveau Système**

### Configuration

Le nouveau système de webhook Stripe est implémenté avec une architecture modulaire et robuste :

```typescript
// Routeur séparé : src/routes/payments/webhook.ts
// Body parser raw configuré dans server.ts AVANT express.json()
app.use(
  "/payments/webhook",
  bodyParser.raw({ type: "application/json" }),
  webhookRoutes
);
```

## 🧾 **Système de Facturation Automatique**

### Modèle Prisma Invoice

```prisma
model Invoice {
  id         String   @id @default(uuid())
  commande   Commande @relation(fields: [commandeId], references: [id])
  commandeId String
  amount     Int      // Montant en centimes
  pdfUrl     String   // URL du PDF sur S3
  createdAt  DateTime @default(now())
}
```

### Service InvoiceService

- **`generateInvoicePDF()`** : Génère un PDF professionnel avec PDFKit
- **`uploadInvoicePdf()`** : Upload sur AWS S3 avec gestion d'erreurs
- **`processInvoiceForCommande()`** : Processus complet de facturation

### MailerService

- **SendGrid** intégré pour l'envoi d'emails
- Templates HTML responsives
- Gestion des erreurs et fallback

### Routes factures (`/invoices`) - **NOUVEAU**

Routes pour consulter et télécharger les factures générées automatiquement :

```http
# Liste paginée des factures de l'utilisateur
GET /invoices?page=1&limit=10
Authorization: Bearer token

# Response: 200
{
  "invoices": [
    {
      "id": "invoice-123",
      "amount": 59900,
      "amountFormatted": "599.00 €",
      "createdAt": "2024-01-15T10:30:00Z",
      "pdfUrl": "https://s3.amazonaws.com/bucket/invoice.pdf",
      "commande": {
        "id": "cmd-456",
        "titre": "Correction Mémoire",
        "statut": "TERMINE",
        "createdAt": "2024-01-14T15:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}

# Détails d'une facture spécifique
GET /invoices/:id
Authorization: Bearer token

# Response: 200
{
  "id": "invoice-123",
  "amount": 59900,
  "amountFormatted": "599.00 €",
  "createdAt": "2024-01-15T10:30:00Z",
  "pdfUrl": "https://s3.amazonaws.com/bucket/invoice.pdf",
  "commande": {
    "id": "cmd-456",
    "titre": "Correction Mémoire",
    "description": "Correction complète d'un mémoire de master",
    "statut": "TERMINE",
    "createdAt": "2024-01-14T15:00:00Z",
    "updatedAt": "2024-01-15T09:00:00Z",
    "user": {
      "prenom": "Jean",
      "nom": "Dupont",
      "email": "jean.dupont@example.com"
    }
  }
}

# Téléchargement sécurisé du PDF de facture
GET /invoices/:id/download
Authorization: Bearer token

# Response: 200 (streaming PDF)
# Headers:
# Content-Type: application/pdf
# Content-Disposition: attachment; filename="facture-Correction-Memoire-ce-123.pdf"
# Cache-Control: private, no-cache

# Erreurs possibles :
# 401 - Token JWT manquant ou invalide
# 403 - Accès non autorisé (facture n'appartient pas à l'utilisateur)
# 404 - Facture non trouvée
# 500 - Erreur serveur (base de données ou S3)
```

#### Caractéristiques techniques

- **Pagination** : Limite de 50 factures par page maximum
- **Sécurité** : Vérification que la facture appartient à l'utilisateur connecté
- **Téléchargement** : Streaming direct depuis S3 ou fallback redirection URL
- **Format montant** : En centimes (base) et formaté avec devise (affichage)
- **Tri** : Les factures les plus récentes en premier

### Événements Gérés

#### **checkout.session.completed**

- Met à jour `paymentStatus: "paid"`
- Change le statut de commande vers `EN_COURS`
- Log détaillé avec informations client

#### **payment_intent.payment_failed**

- Met à jour `paymentStatus: "failed"`
- Log des raisons d'échec

#### **invoice.payment_succeeded** (préparé)

- Structure prête pour factures récurrentes

#### **Événements non gérés**

- Logging automatique pour analytics
- Structure extensible pour nouveaux événements

### Sécurité

- **Vérification signature** via `stripeService.constructEvent()`
- **Validation session ID** : correspondance avec `stripeSessionId` en base
- **Gestion d'erreurs** complète avec logging détaillé
- **Body parser raw** uniquement pour `/payments/webhook`

### Tests

```bash
# Tests d'intégration webhook
npm test -- webhook.test.ts

# Tests couverts :
# - ✅ checkout.session.completed success
# - ✅ payment_intent.payment_failed
# - ✅ Signature invalide (400)
# - ✅ Commande non trouvée (404)
# - ✅ Événements non gérés
# - ✅ Erreurs base de données
```

### Tests avec Stripe CLI

```bash
# Installation Stripe CLI
brew install stripe/stripe-cli/stripe

# Login et configuration
stripe login
stripe listen --forward-to localhost:3001/payments/webhook

# Simulation d'événements
stripe trigger checkout.session.completed
stripe trigger payment_intent.payment_failed

# Monitoring en temps réel
stripe logs tail
```

### Routes admin (`/admin`) - **PRÊTES POUR INTÉGRATION**

```http
# Statistiques générales (pour AdminDashboard)
GET /admin/stats
Authorization: Bearer admin_token
# → KPIs: utilisateurs, commandes, revenus

# Gestion utilisateurs (pour AdminUtilisateurs)
GET /admin/users?page=1&limit=10&search=email
Authorization: Bearer admin_token
PATCH /admin/user/:id/activate
PATCH /admin/user/:id/deactivate
DELETE /admin/user/:id

# Gestion commandes (pour AdminCommandes)
GET /admin/commandes?page=1&statut=EN_ATTENTE
Authorization: Bearer admin_token
PATCH /admin/commande/:id/status
Body: { "statut": "EN_COURS" }

# Gestion factures (pour AdminFactures)
GET /admin/invoices?page=1&statut=paid
POST /admin/invoice/:id/reminder
DELETE /admin/invoice/:id

# Gestion FAQ (pour AdminFAQ)
GET /admin/faq
POST /admin/faq
PATCH /admin/faq/:id
DELETE /admin/faq/:id
PATCH /admin/faq/:id/reorder

# Gestion tarifs (pour AdminTarifs)
GET /admin/tarifs
POST /admin/tarif
PATCH /admin/tarif/:id/activate
DELETE /admin/tarif/:id

# Gestion pages (pour AdminPages)
GET /admin/pages
POST /admin/page
PATCH /admin/page/:id/publish
DELETE /admin/page/:id

# Statistiques avancées (pour AdminStatistiques)
GET /admin/analytics/revenue
GET /admin/analytics/users
GET /admin/analytics/projects

# Logs système (pour AdminLogs)
GET /admin/logs?type=AUTH&date=2025-01

# Messagerie admin (IMPLÉMENTÉ)
GET /admin/conversations
POST /admin/conversations/:id/messages
DELETE /admin/conversations/:id
GET /admin/conversations/stats
GET /admin/stats/advanced
```

## 💳 Intégration Stripe

### Configuration

```typescript
// Variables d'environnement requises
STRIPE_SECRET_KEY=sk_test_...    # Clé secrète Stripe
STRIPE_WEBHOOK_SECRET=whsec_...  # Secret webhook
```

### Service Stripe (`stripeService.ts`)

```typescript
// Mode mock automatique si pas de vraie clé
const isMockMode = !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");

// Fonctionnalités principales
-createCheckoutSession(amount, commandeId, userId) -
  retrieveSession(sessionId) -
  createCustomer(email, name) -
  constructEvent(body, signature); // Webhook validation
```

### Flux de paiement

1. **Client**: Clic "Payer" → `POST /payments/create-checkout-session`
2. **Backend**: Création session Stripe + update commande `paymentStatus: "unpaid"`
3. **Stripe**: Redirection vers Checkout
4. **Webhook**: `checkout.session.completed` → update `paymentStatus: "paid"`
5. **Client**: Redirection vers page succès

### Pages de retour

- **Succès**: `/payment-success?session_id=cs_...`
- **Annulation**: `/payment-cancel`

## 🧪 Tests

### Configuration Jest

```bash
# Tous les tests
npm test

# Mode watch
npm run test:watch

# Coverage
npm test -- --coverage
```

### Structure des tests

```
tests/
├── controllers/
│   ├── authController.test.ts
│   ├── commandeController.test.ts
│   ├── messagesController.test.ts
│   └── paymentController.test.ts
├── routes/
│   ├── auth.test.ts
│   ├── messages.test.ts
│   └── admin.test.ts
└── utils/
    └── token.test.ts
```

## 🔧 Configuration

### Variables d'environnement (`.env`)

```bash
# Base de données
DATABASE_URL="mysql://staka:staka@db:3306/stakalivres"

# JWT
JWT_SECRET="dev_secret_key_change_in_production"

# Serveur
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
PORT=3001

# Stripe
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Scripts package.json

```json
{
  "dev": "nodemon src/server.ts", // Développement
  "build": "tsc", // Compilation TypeScript
  "start": "node dist/server.js", // Production
  "test": "jest", // Tests
  "db:migrate": "prisma migrate dev", // Migrations
  "db:generate": "prisma generate", // Client Prisma
  "db:seed": "ts-node prisma/seed.ts" // Données de test
}
```

### Configuration TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

## 📊 Logging & Monitoring

### Winston Logger (à implémenter)

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});
```

### Health Check

```http
GET /health

# Response: 200
{
  "status": "OK",
  "timestamp": "2024-12-28T10:30:00.000Z"
}
```

## 🐳 Docker

### Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Docker Compose

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=mysql://staka:staka@db:3306/stakalivres
    depends_on:
      - db

  db:
    image: mysql:8.4
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=stakalivres
      - MYSQL_USER=staka
      - MYSQL_PASSWORD=staka
    command: --mysql-native-password=ON
    ports:
      - "3306:3306"
```

## 🚀 Déploiement

### Production checklist

- [ ] Variables d'environnement sécurisées
- [ ] JWT_SECRET complexe et secret
- [ ] Clés Stripe de production
- [ ] SSL/HTTPS activé
- [ ] Rate limiting configuré
- [ ] Logs centralisés
- [ ] Monitoring/alertes
- [ ] Backup base de données
- [ ] Tests E2E passants

### Variables de production

```bash
NODE_ENV=production
JWT_SECRET=complex_secure_secret_256_bits
DATABASE_URL=mysql://user:pass@host:port/db
STRIPE_SECRET_KEY=sk_live_...
FRONTEND_URL=https://staka-editions.com
```

## 🛠️ Développement

### Installation développement

```bash
# Clone du repo
git clone https://github.com/your-org/staka-livres.git
cd staka-livres/backend

# Installation
npm install

# Configuration base de données
cp .env.example .env  # Éditer les variables
npm run db:migrate
npm run db:generate
npm run db:seed

# Démarrage
npm run dev
```

### Développement avec Docker

```bash
# Rebuild après changements
docker-compose build backend

# Logs en temps réel
docker logs -f staka_backend

# Shell dans le conteneur
docker exec -it staka_backend sh

# Prisma Studio (interface DB)
docker exec -it staka_backend npx prisma studio
# → http://localhost:5555
```

### Commandes utiles

```bash
# Reset complet base de données
docker exec -it staka_backend npx prisma migrate reset

# Nouveau migration
docker exec -it staka_backend npx prisma migrate dev --name nom_migration

# Seed uniquement
docker exec -it staka_backend npm run db:seed

# Types Prisma
docker exec -it staka_backend npx prisma generate
```

## 🔍 Troubleshooting

### Erreurs communes

**"Cannot connect to database"**

```bash
# Vérifier conteneur MySQL
docker ps | grep mysql
docker logs staka_db

# Tester connexion
docker exec -it staka_backend npx prisma db pull
```

**"JWT_SECRET is required"**

```bash
# Vérifier .env
cat backend/.env | grep JWT_SECRET
```

**"Stripe webhook failed"**

```bash
# Vérifier signature
curl -X POST localhost:3001/payments/webhook \
  -H "Stripe-Signature: t=..." \
  -d '{"type":"checkout.session.completed"}'
```

**"Permission denied" Prisma**

```bash
# Permissions conteneur
docker exec -it staka_backend chown -R node:node /app
```

### Logs de debug

```bash
# Logs backend
docker logs staka_backend

# Logs base de données
docker logs staka_db

# Tous les logs
docker-compose logs -f
```

### Reset complet développement

```bash
# Arrêter tout
docker-compose down -v

# Supprimer images
docker rmi staka-livres_backend staka-livres_frontend

# Redémarrer
docker-compose up -d --build

# Re-seed
docker exec -it staka_backend npm run db:seed
```

## 📚 Resources

### Documentation

- [Express.js](https://expressjs.com/)
- [Prisma ORM](https://prisma.io/docs)
- [Stripe API](https://stripe.com/docs/api)
- [JWT.io](https://jwt.io/)

### Dépendances principales

- **Express 4.18**: Framework web
- **Prisma 6.10**: ORM et migrations
- **Stripe 18.2**: Paiements
- **bcryptjs**: Hachage mots de passe
- **jsonwebtoken**: Authentification JWT
- **helmet**: Sécurité headers HTTP
- **winston**: Logging (à configurer)
- **zod**: Validation données

---

## 🤝 Contribution

### Convention commits

```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
style: formatage
refactor: refactoring
test: ajout tests
chore: maintenance
```

### Pull Request

1. Fork du projet
2. Branche feature: `git checkout -b feature/ma-fonctionnalite`
3. Commits: `git commit -m "feat: ajouter endpoint statistiques"`
4. Push: `git push origin feature/ma-fonctionnalite`
5. Pull Request avec description détaillée

---

## 🎯 **Intégration Espace Admin - Prochaines Étapes**

### 🔧 **Routes Admin à Implémenter (9 modules)**

L'espace admin frontend est maintenant **complet avec mock data**. Voici les endpoints backend à développer pour chaque page :

#### **1. AdminDashboard** - Tableau de Bord

```typescript
GET /admin/stats
→ { totalUsers, activeUsers, totalCommandes, revenue, monthlyGrowth }
```

#### **2. AdminUtilisateurs** - Gestion Utilisateurs

```typescript
GET /admin/users?page=1&limit=10&search=email&role=USER
PATCH /admin/user/:id/activate
PATCH /admin/user/:id/role { role: "ADMIN" }
DELETE /admin/user/:id
```

#### **3. AdminCommandes** - Gestion Commandes

```typescript
GET /admin/commandes?page=1&statut=EN_ATTENTE&sortBy=createdAt
PATCH /admin/commande/:id/status { statut: "EN_COURS" }
GET /admin/commande/:id/details
```

#### **4. AdminFactures** - Interface Facturation

```typescript
GET /admin/invoices?page=1&statut=paid&search=client
POST /admin/invoice/:id/reminder
GET /admin/invoice/:id/download
DELETE /admin/invoice/:id
```

#### **5. AdminFAQ** - Base de Connaissance

```typescript
GET /admin/faq?category=GENERAL&visible=true
POST /admin/faq { question, answer, category, order }
PATCH /admin/faq/:id/reorder { newOrder: 5 }
DELETE /admin/faq/:id
```

#### **6. AdminTarifs** - Configuration Prix

```typescript
GET /admin/tarifs?service=CORRECTION&active=true
POST /admin/tarif { service, price, description, features }
PATCH /admin/tarif/:id/activate
DELETE /admin/tarif/:id
```

#### **7. AdminPages** - CMS Pages Statiques

```typescript
GET /admin/pages?statut=PUBLIEE&search=titre
POST /admin/page { titre, contenu, slug, description }
PATCH /admin/page/:id/publish { statut: "PUBLIEE" }
GET /admin/page/:id/preview
```

#### **8. AdminStatistiques** - Analytics Avancées

```typescript
GET /admin/analytics/revenue?period=month
GET /admin/analytics/users/growth
GET /admin/analytics/projects/completion
GET /admin/analytics/top-clients?limit=10
```

#### **9. AdminLogs** - Audit et Sécurité

```typescript
GET /admin/logs?type=AUTH&userId=uuid&date=2025-01
GET /admin/logs/export?format=csv&period=week
```

#### **10. AdminMessagerie** - **✅ IMPLÉMENTÉ**

```typescript
✅ GET /admin/conversations
✅ POST /admin/conversations/:id/messages
✅ DELETE /admin/conversations/:id
✅ GET /admin/conversations/stats
✅ GET /admin/stats/advanced
```

### 🎯 **Frontend Prêt pour Intégration**

- ✅ **Mock services configurés** : `adminAPI.ts` avec structure complète
- ✅ **Types TypeScript** : Interfaces pour toutes les entités dans `shared.ts`
- ✅ **UI Components** : 10 pages admin avec états loading/error/empty
- ✅ **Architecture modulaire** : Services facilement remplaçables par vrais appels API
- ✅ **Messagerie complète** : Interface admin fonctionnelle avec API backend

### 🔄 **Plan d'Intégration**

1. **Créer les contrôleurs** : `adminFacturesController.ts`, `adminFAQController.ts`, etc.
2. **Ajouter les routes** : Extension du fichier `admin.ts` existant
3. **Implémenter la logique métier** : CRUD avec validation et sécurité
4. **Remplacer les mock services** frontend par vrais appels API
5. **Tests d'intégration** : Validation du fonctionnement complet

---

**Backend Staka Livres** - API REST moderne pour plateforme de correction de livres

**✨ Système de messagerie complet + Espace admin frontend - Prêt pour production**
