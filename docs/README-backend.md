# Backend Staka Livres

![Node.js](https://img.shields.io/badge/Node.js-20.18.3-green)
![Express](https://img.shields.io/badge/Express-4.18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.10.1-purple)
![Stripe](https://img.shields.io/badge/Stripe-18.2-purple)
![MySQL](https://img.shields.io/badge/MySQL-8.4-orange)
![Tests](https://img.shields.io/badge/Tests-100%25%20Success-brightgreen)
![Production](https://img.shields.io/badge/Status-Production%20Ready-green)

## 📋 Vue d'ensemble

Backend REST API pour Staka Livres, une plateforme de correction de livres professionnelle. Architecture moderne avec TypeScript, Express, Prisma ORM et intégration Stripe pour les paiements.

**✨ Version Juillet 2025 - Mise à jour du 21 juillet :**

- **78+ endpoints API** répartis sur 27 fichiers de routes avec 23 contrôleurs
- **Système de réinitialisation de mot de passe** RGPD-compliant avec tokens sécurisés
- **Système d'échantillons gratuits** pour acquisition clients
- **Espace admin 100% opérationnel** (10/10 modules production-ready)
- **Système de réservation de consultations** avec workflow automatisé et notifications
- **Système de notifications temps réel** avec génération automatique et polling 15s
- **Système d'emails centralisé** avec EventBus + 22 templates automatiques (NOUVEAU 2025)
- **Système de messagerie unifiée** avec threading, pièces jointes et support consultations
- **Facturation automatique complète** avec génération PDF, AWS S3 et SendGrid
- **Tests exhaustifs** : 56 fichiers de test (Vitest), couverture 90%+ configurée
- **Architecture CI/CD optimisée** : Backend tests isolés, frontend tests séparés unitaires/intégration
- **Modules FAQ, Tarifs, Pages CMS et Statistiques** dynamiques avec synchronisation temps réel
- **Architecture scalable** avec monitoring intégré et logs structurés

## 🆕 Nouvelles Fonctionnalités Juillet 2025

### 🔑 Système de Réinitialisation de Mot de Passe RGPD-Compliant

**Architecture complète implémentée le 14 juillet 2025 :**

- **Tokens sécurisés** : SHA-256 avec expiration 1h et usage unique
- **Rate limiting** : 5 tentatives par heure par utilisateur 
- **Migration DB** : `20250714131722_add_password_reset` avec audit complet
- **Endpoints** :
  - `POST /public/forgot-password` - Demande de réinitialisation
  - `POST /public/reset-password` - Validation token + nouveau mot de passe
- **Templates email** : Handlebars avec liens sécurisés
- **Tests** : Couverture complète avec mocks et intégration
- **Sécurité** : Validation stricte, logs d'audit, conformité RGPD

### 📧 Système d'Emails Centralisé PRODUCTION-READY

**🆕 Architecture événementielle complète remplace l'ancienne approche manuelle :**

- **EventBus** (`src/events/eventBus.ts`) : Émetteur d'événements centralisé
- **Double notification automatique** : Interface + Email pour chaque événement
- **22 templates HTML professionnels** : Admin, utilisateurs et visiteurs
- **Queue asynchrone** (`src/queues/emailQueue.ts`) : Performance optimisée
- **Zero code duplication** : Plus besoin d'appeler `MailerService.sendEmail()` manuellement
- **Listeners spécialisés** :
  - `adminNotificationEmailListener.ts` : Notifications admin
  - `userNotificationEmailListener.ts` : Notifications utilisateurs avec opt-out
- **Emails visiteurs** : Confirmations automatiques pour contact/échantillons
- **Tests production validés** : 5+ emails réels envoyés et confirmés

**Usage simple :**
```typescript
// Un seul appel - double effet automatique !
await createAdminNotification("Nouveau paiement", "...", PAYMENT, HAUTE);
// → 1. Notification interface + 2. Email admin automatique
```

### 📖 Système d'Échantillons Gratuits

**Nouveau système d'acquisition clients :**

- **Controller public** : Gestion des demandes d'échantillons
- **Workflow automatisé** : Validation + notification équipe + emails automatiques
- **Intégration frontend** : Composant `FreeSample.tsx` 
- **Documentation** : Guide technique complet `FREE_SAMPLE_SYSTEM_GUIDE.md`
- **Base de données** : Extension modèle avec métadonnées échantillons

### 🧪 Architecture CI/CD Optimisée (NOUVEAU - JUILLET 2025)

**Séparation des tests pour stabilité maximale :**

- **Backend tests** : Isolés et indépendants, exécutés avec base de données test
- **Frontend tests** : Architecture séparée unitaires (CI/CD) vs intégration (local)
- **GitHub Actions** : Pipeline optimisé avec tests unitaires uniquement
- **Développement local** : Tests complets avec backend requis pour intégration

**Bénéfices :**
- **Plus d'échecs CI/CD** dus aux dépendances backend
- **Tests rapides** : < 30s pour les tests unitaires
- **Architecture robuste** : Séparation claire des responsabilités
- **Couverture maintenue** : 87%+ avec tests ciblés par environnement

### 📊 Améliorations Techniques

- **Node.js 20.18.3** : Migration depuis v18 pour performances optimisées
- **Vitest 3.2.4** : Framework de test moderne avec couverture v8
- **56 fichiers de test** : Coverage configurée à 90% minimum
- **23 contrôleurs** : Architecture modulaire étendue
- **14 services métier** : Logique centralisée et testable
- **CI/CD optimisé** : Tests backend isolés, architecture frontend séparée unitaires/intégration

## 🔐 Sécurité et Audit - Version 2025 Renforcée

### 🛡️ Système d'Audit Complet Implémenté

**✅ Service d'Audit Centralisé :**

- **AuditService** : Service centralisé avec 50+ actions standardisées
- **Logs d'authentification** : Tentatives de connexion, échecs, succès avec IP et UserAgent
- **Audit des actions admin** : Toutes les opérations sensibles tracées avec détails
- **Audit financier** : Accès aux factures, téléchargements PDF, rappels, annulations
- **Audit des paiements** : Sessions créées, statuts consultés, webhooks traités
- **Logs de sécurité** : Tentatives d'accès non autorisées, signatures invalides
- **Middleware d'audit** : Intégration automatique sur toutes les routes sensibles

### 🔒 Middleware de Sécurité Renforcé

**✅ Authentification avec Validation Base de Données :**

```typescript
// Middleware d'authentification avec validation DB réelle
export const authenticateToken = async (req, res, next) => {
  // Vérification JWT + validation utilisateur en base
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });
  
  if (!user || !user.isActive) {
    // Log tentative d'accès non autorisée
    await AuditService.logSecurityEvent(...);
    return res.status(401).json({ error: "Accès non autorisé" });
  }
  
  // Log connexion réussie
  await AuditService.logSecurityEvent(...);
  req.user = user;
  next();
};
```

### 📊 Événements Auditables

**Authentification :**
- `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`
- `PASSWORD_CHANGE`, `ACCOUNT_LOCKED`

**Gestion des Utilisateurs :**
- `USER_CREATED`, `USER_UPDATED`, `USER_DELETED`
- `USER_ROLE_CHANGED`, `USER_STATUS_CHANGED`

**Gestion des Factures :**
- `INVOICE_ACCESSED`, `INVOICE_DOWNLOADED`
- `INVOICE_SENT`, `INVOICE_CANCELLED`

**Gestion des Paiements :**
- `PAYMENT_SESSION_CREATED`, `PAYMENT_STATUS_CHECKED`
- `PAYMENT_WEBHOOK_RECEIVED`

**Sécurité :**
- `UNAUTHORIZED_ACCESS`, `SUSPICIOUS_ACTIVITY`
- `SECURITY_BREACH`, `INVALID_SIGNATURE`

### 🔐 Niveaux de Sévérité

- 🔷 **LOW** : Accès routinier, consultations
- 🔶 **MEDIUM** : Modifications, créations, suppressions
- 🔴 **HIGH** : Changements de rôle, annulations, échecs de sécurité
- 🚨 **CRITICAL** : Violations de signature, tentatives d'intrusion

### 📈 Monitoring et Traçabilité

**Format des Logs :**
```typescript
{
  timestamp: "2025-07-11T10:30:00.000Z",
  adminEmail: "admin@staka.com",
  action: "INVOICE_DOWNLOADED",
  targetType: "invoice",
  targetId: "inv-123",
  details: { filename: "facture-2025-001.pdf" },
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  severity: "MEDIUM"
}
```

**Conformité RGPD :**
- ✅ Traçabilité complète des accès aux données personnelles
- ✅ Logs d'export et suppression de données
- ✅ Audit des changements de consentement
- ✅ Historique des demandes d'accès aux données
- ✅ **NOUVEAU 2025**: Endpoints RGPD (DELETE /api/users/me, GET /api/users/me/export)
- ✅ **NOUVEAU 2025**: UserController et UserService pour gestion RGPD automatisée

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18.20+ (recommandé 20.18.3)
- Docker & Docker Compose
- MySQL 8.4+
- Compte Stripe (test/production keys)
- AWS S3 (pour stockage factures)

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

# Corriger le rôle admin (si nécessaire)
docker exec -w /app staka_backend node fix-admin-role.js
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
│   ├── controllers/          # Logique métier (23 fichiers)
│   │   ├── authController.ts              # Authentification
│   │   ├── adminController.ts             # Administration générale
│   │   ├── adminUserController.ts         # Gestion utilisateurs admin
│   │   ├── adminCommandeController.ts     # Gestion commandes admin
│   │   ├── adminFactureController.ts      # Gestion factures admin
│   │   ├── adminPageController.ts         # Gestion pages admin
│   │   ├── adminStatsController.ts        # Statistiques admin temps réel
│   │   ├── notificationsController.ts     # Notifications temps réel avec polling
│   │   ├── userController.ts              # Opérations utilisateur RGPD (NOUVEAU 2025)
│   │   ├── publicController.ts            # Endpoints publics contact (NOUVEAU 2025)
│   │   ├── adminPagesController.ts        # CMS pages statiques (NOUVEAU)
│   │   ├── adminTarifsController.ts       # Gestion tarifs dynamiques
│   │   ├── consultationController.ts      # Réservation consultations (NOUVEAU JUILLET 2025)
│   │   ├── faqController.ts               # Gestion FAQ
│   │   ├── commandeClientController.ts    # Commandes client
│   │   ├── commandeController.ts          # Commandes générales
│   │   ├── messagesController.ts          # Messagerie avancée
│   │   └── paymentController.ts           # Paiements Stripe
│   ├── middleware/           # Middlewares (auth, rôles)
│   ├── routes/               # Définition des routes Express
│   │   ├── admin/            # Routes espace admin
│   │   │   ├── users.ts      # ✅ Gestion utilisateurs
│   │   │   ├── commandes.ts  # ✅ Gestion commandes
│   │   │   ├── factures.ts   # ✅ Gestion factures
│   │   │   ├── faq.ts        # ✅ Gestion FAQ
│   │   │   ├── pages.ts      # ✅ Gestion pages CMS
│   │   │   ├── stats.ts      # ✅ Statistiques admin temps réel
│   │   │   ├── tarifs.ts     # ✅ Gestion tarifs dynamiques
│   │   ├── admin.ts          # Routeur principal admin
│   │   ├── adminStats.ts     # Routes statistiques admin 
│   │   ├── notifications.ts  # Routes notifications temps réel
│   │   ├── auth.ts           # Authentification
│   │   ├── commandes.ts      # Commandes client
│   │   ├── consultations.ts  # Consultations publiques + admin (NOUVEAU)
│   │   ├── faq.ts            # FAQ publique
│   │   ├── invoice.ts        # Factures client
│   │   ├── messages.ts       # Messagerie unifiée
│   │   ├── pages.ts          # Pages publiques
│   │   ├── payments/         # Routes paiements
│   │   │   └── webhook.ts    # Webhook Stripe
│   │   ├── payments.ts       # Création session paiement
│   │   └── tarifs.ts         # Tarifs publics
│   ├── services/             # Services métier
│   │   ├── pdf.ts            # Génération PDF factures (PDFKit)
│   │   ├── s3InvoiceService.ts # Stockage S3 sécurisé factures
│   │   ├── invoiceService.ts # Service facturation complet
│   │   ├── filesService.ts   # Gestion fichiers S3
│   │   ├── userService.ts    # Service utilisateur RGPD (NOUVEAU 2025)
│   │   └── ...autres services
│   ├── utils/                # Utilitaires (mailer, tokens)
│   ├── types/                # Types TypeScript partagés
│   │   ├── adminStats.ts     # Types statistiques admin
│   │   ├── notifications.ts  # Types notifications
│   │   ├── adminPages.ts     # Types CMS pages (NOUVEAU)
│   │   └── tarifsTypes.ts    # Types tarifs dynamiques (NOUVEAU)
│   ├── config/               # Configuration
│   └── server.ts            # Point d'entrée principal
├── prisma/
│   ├── schema.prisma        # Modèle de données (15 modèles actualisé)
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
  role: "USER" | "ADMIN" | "CORRECTOR"
  isActive: boolean
  adresse?: string
  avatar?: string
  telephone?: string
  createdAt: DateTime
  updatedAt: DateTime
  commandes: Commande[]
  files: File[]
  sentMessages: Message[]
  receivedMessages: Message[]
  notifications: Notification[]
  paymentMethods: PaymentMethod[]
  supportRequests: SupportRequest[]
  assignedSupportRequests: SupportRequest[]
}

// Commande/Projet
Commande {
  id: string (UUID)
  userId: string
  titre: string
  description?: string
  fichierUrl?: string
  statut: "EN_ATTENTE" | "EN_COURS" | "TERMINE" | "ANNULEE" | "SUSPENDUE"
  noteClient?: string
  noteCorrecteur?: string
  paymentStatus?: "unpaid" | "paid" | "failed"
  stripeSessionId?: string
  amount?: number // Montant en centimes
  dateEcheance?: DateTime
  dateFinition?: DateTime
  priorite: "FAIBLE" | "NORMALE" | "HAUTE" | "URGENTE"
  createdAt: DateTime
  updatedAt: DateTime
  user: User
  files: File[]
  invoices: Invoice[]
}

// Message (Système de messagerie unifié)
Message {
  id: string (UUID)
  conversationId: string (UUID) // Regroupe les messages d'une même conversation
  senderId?: string // Optionnel: ID de l'utilisateur connecté
  receiverId?: string // Toujours un admin pour le premier message
  visitorEmail?: string // Pour les visiteurs non connectés
  visitorName?: string // Pour les visiteurs non connectés
  subject?: string
  content: string
  type: "USER_MESSAGE" | "SYSTEM_MESSAGE" | "ADMIN_MESSAGE"
  statut: "BROUILLON" | "ENVOYE" | "DELIVRE" | "LU" | "ARCHIVE"
  isRead: boolean
  isArchived: boolean
  isPinned: boolean
  parentId?: string // Pour les réponses
  createdAt: DateTime
  updatedAt: DateTime
  sender?: User
  receiver?: User
  parent?: Message
  replies: Message[]
  attachments: MessageAttachment[]
}

// Notification (NOUVEAU)
Notification {
  id: string (UUID)
  userId: string
  title: string
  message: string
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "PAYMENT" | "ORDER" | "MESSAGE" | "SYSTEM"
  priority: "FAIBLE" | "NORMALE" | "HAUTE" | "URGENTE"
  data?: string // JSON metadata
  actionUrl?: string // URL pour action
  isRead: boolean
  isDeleted: boolean
  readAt?: DateTime
  expiresAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
  user: User
}

// Fichier
File {
  id: string (UUID)
  filename: string
  storedName: string
  mimeType: string
  size: number
  url: string
  type: "DOCUMENT" | "IMAGE" | "VIDEO" | "AUDIO" | "ARCHIVE"
  uploadedById: string
  commandeId?: string
  description?: string
  isPublic: boolean
  createdAt: DateTime
  updatedAt: DateTime
  uploadedBy: User
  commande?: Commande
  messageAttachments: MessageAttachment[]
}

// Pièce jointe de message
MessageAttachment {
  id: string (UUID)
  messageId: string
  fileId: string
  file: File
  message: Message
}

// Ticket de support
SupportRequest {
  id: string (UUID)
  userId: string
  title: string
  description: string
  category: "GENERAL" | "TECHNIQUE" | "FACTURATION" | "COMMANDE" | "AUTRE"
  priority: "FAIBLE" | "NORMALE" | "HAUTE" | "URGENTE"
  status: "OUVERT" | "EN_COURS" | "RESOLU" | "FERME"
  assignedToId?: string
  source?: string
  tags?: string
  firstResponseAt?: DateTime
  resolvedAt?: DateTime
  closedAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
  user: User
  assignedTo?: User
}

// Moyen de paiement
PaymentMethod {
  id: string (UUID)
  userId: string
  stripePaymentMethodId: string (unique)
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
  isActive: boolean
  fingerprint?: string
  createdAt: DateTime
  updatedAt: DateTime
  user: User
}

// Facture
Invoice {
  id: string (UUID)
  commandeId: string
  number: string (unique)
  amount: number // Montant en centimes
  taxAmount: number
  pdfUrl: string
  status: "GENERATED" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
  issuedAt?: DateTime
  dueAt?: DateTime
  paidAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
  commande: Commande
}

// Page de contenu
Page {
  id: string (UUID)
  title: string
  slug: string (unique)
  content: string
  excerpt?: string
  metaTitle?: string
  metaDescription?: string
  type: "STATIC" | "FAQ" | "LEGAL" | "MARKETING"
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  publishedAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}

// FAQ
FAQ {
  id: string (UUID)
  question: string
  reponse: string
  categorie: string
  isActive: boolean
  sortOrder: number
  createdAt: DateTime
  updatedAt: DateTime
}

// Tarif
Tarif {
  id: string (UUID)
  nom: string
  description: string
  prix: number // Prix en centimes
  prixFormate: string
  typeService: string
  dureeEstimee?: string
  actif: boolean
  ordre: number
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 🔐 Authentification & Sécurité

### JWT Authentication

- Tokens JWT avec expiration 7 jours
- Middleware `authenticateToken` pour protection des routes
- Hachage bcrypt pour mots de passe (12 rounds)
- Contrôle d'accès basé sur les rôles (USER/ADMIN/CORRECTOR)

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

// Rate limiting (implémenté)
// Body parsing sécurisé
```

### Protection des routes

```typescript
// Route protégée utilisateur connecté
router.get("/profile", authenticateToken, getProfile);

// Route protégée admin uniquement
router.get("/admin/stats", authenticateToken, requireRole(Role.ADMIN), getStats);
```

## 🔒 **Nouveaux Endpoints RGPD - Juillet 2025** ✅ PRODUCTION READY

### **Routes Utilisateur RGPD (`/users`) - UserController**

#### **DELETE /api/users/me - Suppression de compte utilisateur**

Permet à un utilisateur authentifié de supprimer son compte de manière conforme RGPD.

```http
DELETE /api/users/me
Authorization: Bearer token

# Response: 204 No Content
# Le compte est supprimé/anonymisé de manière irréversible
```

**Fonctionnalités :**
- ✅ **Soft delete** avec anonymisation des données
- ✅ **Audit logs** automatiques avec niveau de sévérité HIGH
- ✅ **Suppression en cascade** de toutes les données liées
- ✅ **Conformité RGPD** complète (droit à l'effacement)

#### **GET /api/users/me/export - Export des données utilisateur**

Permet à un utilisateur authentifié d'exporter toutes ses données personnelles.

```http
GET /api/users/me/export
Authorization: Bearer token

# Response: 200
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "commandes": [
    {
      "id": "cmd-uuid",
      "titre": "Mon livre",
      "statut": "TERMINE",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "factures": [
    {
      "id": "inv-uuid",
      "amount": 5990,
      "createdAt": "2024-01-16T00:00:00Z"
    }
  ],
  "messages": [
    {
      "id": "msg-uuid",
      "content": "Mon message",
      "createdAt": "2024-01-17T00:00:00Z",
      "isFromAdmin": false
    }
  ]
}
```

**Fonctionnalités :**
- ✅ **Export complet** de toutes les données utilisateur
- ✅ **Format JSON structuré** pour portabilité
- ✅ **Conformité RGPD** (droit à la portabilité)
- ✅ **Logs d'audit** pour traçabilité

### **Routes Publiques (`/public`) - PublicController**

#### **POST /api/public/contact - Formulaire de contact public**

Permet d'envoyer un message de contact depuis le site web sans authentification.

```http
POST /api/public/contact
Content-Type: application/json

{
  "nom": "Jean Dupont",
  "email": "jean@example.com",
  "sujet": "Question sur vos services",
  "message": "Bonjour, j'aimerais avoir plus d'informations..."
}

# Response: 201
{
  "success": true,
  "message": "Message envoyé avec succès",
  "data": {
    "messageId": "uuid"
  }
}
```

**Fonctionnalités :**
- ✅ **Validation stricte** des champs requis
- ✅ **Nettoyage automatique** des données (trim, toLowerCase)
- ✅ **Validation email** avec regex
- ✅ **Limitation longueur** des champs pour sécurité
- ✅ **Support email automatique** avec source 'client-help'
- ✅ **Logs structurés** pour monitoring
- ✅ **Anti-spam** intégré

**🔄 Workflow automatique complet :**
1. **Message créé** dans la messagerie admin avec source 'client-help'
2. **Email automatique visiteur** : Confirmation envoyée avec template `visitor-contact-confirmation.hbs`
3. **Notification admin automatique** : Alerte créée dans l'interface admin
4. **Email admin automatique** : Email envoyé à `ADMIN_EMAIL` avec template `admin-message.hbs`

#### **POST /api/public/free-sample - Demande d'échantillon gratuit**

Permet de demander un échantillon gratuit depuis la landing page.

```http
POST /api/public/free-sample
Content-Type: application/json

{
  "nom": "Marie Martin",
  "email": "marie@example.com",
  "genre": "Roman",
  "pages": "150",
  "details": "Premier roman, besoin d'aide pour améliorer le style"
}

# Response: 201
{
  "success": true,
  "message": "Demande d'échantillon envoyée avec succès"
}
```

**🔄 Workflow automatique complet :**
1. **Message créé** dans la messagerie admin avec type spécialisé
2. **Email automatique visiteur** : Confirmation envoyée avec template `visitor-sample-confirmation.hbs`
3. **Notification admin automatique** : Alerte créée avec détails de la demande
4. **Email admin automatique** : Email envoyé à `ADMIN_EMAIL` avec template `admin-message.hbs`

**🎯 Avantages centralisés :**
- **Zero code duplication** : Même logique pour contact et échantillons
- **Templates cohérents** : Design uniforme pour toutes les communications
- **Traçabilité complète** : Tous les emails et notifications automatiquement générés
- **Maintenance facile** : Un seul endroit pour modifier les templates

## 📡 API Reference

### Base URL

- **Développement**: `http://localhost:3001`
- **Production**: `https://api.staka-editions.com`

### 🔐 Routes d'authentification (`/auth`) - ✅ PRODUCTION READY

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

### 🔔 Routes notifications (`/notifications`) - ✅ NOUVEAU 2025

```http
# Liste des notifications avec pagination
GET /notifications?page=1&limit=20&unread=false
Authorization: Bearer token

# Response: 200
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Nouveau message",
      "message": "Vous avez reçu un nouveau message",
      "type": "MESSAGE",
      "priority": "NORMALE",
      "isRead": false,
      "actionUrl": "/app/messages",
      "createdAt": "2025-07-10T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}

# Compteur de notifications non lues
GET /notifications/unread-count
Authorization: Bearer token

# Response: 200
{
  "unreadCount": 5
}

# Marquer une notification comme lue
PATCH /notifications/:id/read
Authorization: Bearer token

# Marquer toutes les notifications comme lues
PATCH /notifications/read-all
Authorization: Bearer token

# Supprimer une notification
DELETE /notifications/:id
Authorization: Bearer token
```

### 📊 Routes statistiques admin (`/admin/stats`) - ✅ NOUVEAU 2025

```http
# Statistiques admin avec données réelles
GET /admin/stats
Authorization: Bearer admin-token

# Response: 200
{
  "chiffreAffairesMois": 12500, // en centimes
  "evolutionCA": 15.2, // pourcentage vs mois précédent
  "nouvellesCommandesMois": 8,
  "evolutionCommandes": 33.3,
  "nouveauxClientsMois": 5,
  "evolutionClients": -10.0,
  "derniersPaiements": [
    {
      "id": "uuid",
      "montant": 3500, // en centimes
      "date": "2025-07-10T14:30:00Z",
      "clientNom": "Marie Martin",
      "clientEmail": "marie@example.com",
      "projetTitre": "Correction essai philosophique"
    }
  ],
  "satisfactionMoyenne": 4.6,
  "nombreAvisTotal": 142,
  "resumeMois": {
    "periode": "janvier 2025",
    "totalCA": 12500,
    "totalCommandes": 8,
    "totalClients": 5
  }
}
```

### 📝 Routes commandes client (`/commandes`) - ✅ PRODUCTION READY

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

### 📋 Routes projets (`/projects`) - ✅ PRODUCTION READY

```http
# Récupérer mes projets avec pagination
GET /projects
Authorization: Bearer token

# Response: 200 - Projets paginés avec métadonnées
{
  "data": [
    {
      "id": "cmd-1-uuid",
      "title": "L'Écho du Temps",
      "type": "Roman",
      "pages": 280,
      "startedAt": "2025-01-05",
      "deliveryAt": "2025-01-15",
      "corrector": "Sarah Martin",
      "pack": "Pack Intégral",
      "status": "completed",
      "progress": 100,
      "rating": 4.8,
      "canDownload": true
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 42
  }
}

# Projets avec filtres et recherche
GET /projects?page=2&limit=5&status=active&search=roman
Authorization: Bearer token

# Paramètres disponibles :
# - page: ≥1 (défaut: 1)
# - limit: 1-50 (défaut: 10) 
# - status: all|active|pending|completed (défaut: all)
# - search: ≤100 caractères (recherche dans le titre)

# Compteurs par statut
GET /projects/counts
Authorization: Bearer token

# Response: 200
{
  "all": 42,
  "active": 12,
  "pending": 5,
  "completed": 25
}

# Response: 400 - Paramètres invalides
{
  "error": "Paramètres invalides",
  "message": "page doit être ≥ 1"
}
```

### 💳 Routes paiements (`/payments`) - ✅ PRODUCTION READY

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

# Webhook Stripe - Architecture modulaire 2025 ⚡ NOUVEAU
POST /payments/webhook
Stripe-Signature: t=...
Content-Type: application/json

# Response: 200
{
  "received": true,
  "eventType": "checkout.session.completed"
}
```

## 💬 **Système de Messagerie Unifiée - ✅ PRODUCTION READY**

### **Vue d'ensemble**

Système de messagerie **simplifié et unifié** basé sur des `conversationId` uniques :

- **Messagerie visiteur** : Route publique pour utilisateurs non authentifiés ✅
- **Messagerie client/admin** : Interface unifiée après authentification ✅
- **Conversations génériques** : Un seul type de conversation avec `conversationId` ✅
- **Support visiteurs** : Champs `visitorEmail` et `visitorName` pour non-connectés ✅
- **Administration** : Interface admin avec comptage messages non lus ✅

### **Architecture technique**

#### **Modèle de données simplifié**

```typescript
// Message unifié avec conversationId
Message {
  id: string (UUID)
  conversationId: string (UUID) // Regroupe les messages d'une même conversation
  senderId?: string // Optionnel: ID de l'utilisateur connecté
  receiverId?: string // Toujours un admin pour le premier message
  visitorEmail?: string // Pour les visiteurs non connectés
  visitorName?: string // Pour les visiteurs non connectés
  subject?: string
  content: string
  type: "USER_MESSAGE" | "SYSTEM_MESSAGE" | "ADMIN_MESSAGE"
  statut: "BROUILLON" | "ENVOYE" | "DELIVRE" | "LU" | "ARCHIVE"
  isRead: boolean
  isArchived: boolean
  isPinned: boolean
  parentId?: string // Pour les réponses
  createdAt: DateTime
  updatedAt: DateTime
}
```

### **Routes Messages (`/messages`)**

#### **1. POST /messages/visitor - Message visiteur (PUBLIC)**

```http
POST /messages/visitor
Content-Type: application/json

{
  "visitorName": "Jean Dupont",
  "visitorEmail": "jean@example.com",
  "subject": "Demande de devis",
  "content": "Bonjour, j'aimerais un devis pour..."
}

# Response: 201
{
  "message": "Message envoyé avec succès",
  "conversationId": "conv-123"
}
```

#### **2. POST /messages/conversations - Créer une conversation**

```http
POST /messages/conversations
Authorization: Bearer token
Content-Type: application/json

{
  "content": "Contenu du premier message",
  "subject": "Sujet de la conversation"
}

# Response: 201
{
  "message": "Conversation créée avec succès",
  "conversationId": "conv-456",
  "message": {
    "id": "msg-789",
    "conversationId": "conv-456",
    "content": "Contenu du premier message",
    "senderId": "user-123",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### **3. GET /messages/conversations - Liste des conversations**

```http
GET /messages/conversations?page=1&limit=20
Authorization: Bearer token

# Response: 200
{
  "conversations": [
    {
      "conversationId": "conv-456",
      "lastMessage": {
        "content": "Dernier message...",
        "createdAt": "2024-01-15T10:30:00Z"
      },
      "unreadCount": 2,
      "participants": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

#### **4. GET /messages/conversations/:id - Messages d'une conversation**

```http
GET /messages/conversations/conv-456?page=1&limit=50
Authorization: Bearer token

# Response: 200
{
  "messages": [
    {
      "id": "msg-789",
      "content": "Contenu du message",
      "senderId": "user-123",
      "sender": {
        "prenom": "Jean",
        "nom": "Dupont"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "isRead": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5,
    "totalPages": 1
  }
}
```

#### **5. POST /messages/conversations/:id - Ajouter un message**

```http
POST /messages/conversations/conv-456
Authorization: Bearer token
Content-Type: application/json

{
  "content": "Nouveau message dans la conversation"
}

# Response: 201
{
  "message": "Message ajouté avec succès",
  "data": {
    "id": "msg-790",
    "conversationId": "conv-456",
    "content": "Nouveau message dans la conversation",
    "senderId": "user-123",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

### **Routes Admin Messagerie (`/admin/messages`)**

#### **1. GET /admin/messages/unread-count - Comptage messages non lus**

```http
GET /admin/messages/unread-count
Authorization: Bearer admin-token

# Response: 200
{
  "unreadCount": 23
}
```

#### **2. GET /admin/messages - Vue globale admin**

```http
GET /admin/messages?page=1&limit=100&search=visitor&isRead=false
Authorization: Bearer admin-token

# Response: 200
{
  "messages": [
    {
      "id": "msg-789",
      "conversationId": "conv-456",
      "content": "Message d'un visiteur",
      "visitorName": "Jean Dupont",
      "visitorEmail": "jean@example.com",
      "createdAt": "2024-01-15T10:30:00Z",
      "isRead": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 45,
    "totalPages": 1
  }
}
```

### **Sécurité et validation**

- **Rate limiting** : 50 messages/heure par utilisateur
- **Validation contenu** : Maximum 10,000 caractères
- **Authentification** : JWT requis sauf pour `/messages/visitor`
- **RGPD** : Soft delete par défaut, hard delete admin uniquement

## 🎯 **Webhook Stripe - Architecture Modulaire 2025** ✅ PRODUCTION READY

### Configuration avancée

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

### ⚡ Fonctionnalités 2025

- **Architecture modulaire** : Routeur séparé + services dédiés ✅
- **Facturation automatique** : Génération PDF + upload S3 ✅
- **Logs structurés** : Traçabilité complète + monitoring ✅
- **Tests complets** : 285+ lignes de tests unitaires/intégration ✅
- **Gestion d'erreurs robuste** : Validation signatures + fallbacks ✅

## 🧾 **Système de Facturation Automatique** ✅ PRODUCTION READY

### **Nouveautés 2025 - Module Admin Factures Complet**

- **7 nouveaux endpoints admin** factures avec filtres/pagination ⚡ NOUVEAU
- **Interface admin complète** : Statistiques + gestion + PDF ⚡ NOUVEAU
- **Génération PDF automatique** avec templates professionnels ✅
- **Upload AWS S3 sécurisé** avec gestion d'erreurs ✅
- **Tests d'intégration validés** : 386 lignes de tests ✅

### Modèle Prisma Invoice

```prisma
model Invoice {
  id         String        @id @default(uuid())
  number     String        @unique  // Numéro de facture unique
  commande   Commande      @relation(fields: [commandeId], references: [id])
  commandeId String
  amount     Int           // Montant en centimes
  taxAmount  Int?          // Montant TVA
  status     InvoiceStatus @default(GENERATED)
  issuedAt   DateTime      @default(now())
  dueAt      DateTime      // Date d'échéance
  paidAt     DateTime?     // Date de paiement
  pdfUrl     String?       // URL du PDF sur S3
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
}

enum InvoiceStatus {
  GENERATED  // Générée
  SENT       // Envoyée
  PAID       // Payée
  OVERDUE    // Échue
  CANCELLED  // Annulée
}
```

### Service InvoiceService

- **`generateInvoicePDF()`** : Génère un PDF professionnel avec PDFKit
- **`uploadInvoicePdf()`** : Upload sur AWS S3 avec gestion d'erreurs
- **`processInvoiceForCommande()`** : Processus complet de facturation

### MailerService - Email Centralisé

**🆕 Architecture événementielle complète** remplace l'ancienne approche manuelle :

**Ancien système ❌ :**
```typescript
// Code dupliqué dans chaque contrôleur
await MailerService.sendEmail({
  to: "admin@example.com",
  subject: "Nouveau paiement",
  template: "admin-payment.hbs",
  variables: { amount }
});
```

**Nouveau système ✅ :**
```typescript
// Un seul appel - email automatique !
await createAdminNotification(
  "Nouveau paiement reçu",
  `Paiement de ${amount}€ reçu`,
  NotificationType.PAYMENT,
  NotificationPriority.HAUTE
);
// → Interface + Email automatique avec template approprié
```

**Fonctionnalités :**
- **SendGrid** intégré pour l'envoi d'emails
- **18 templates HTML professionnels** avec Handlebars
- **Queue asynchrone** pour performance optimale
- **Gestion d'erreurs complète** avec retry automatique
- **Templates centralisés** pour maintenance facile
- **Opt-out utilisateurs** via préférences JSON
- **Confirmation visiteurs** pour contact/échantillons

### Routes factures client (`/invoices`) - ✅ PRODUCTION READY

Routes pour consulter et télécharger les factures générées automatiquement :

### Routes factures admin (`/admin/factures`) - ⚡ NOUVEAU 2025

Interface administrative complète pour la gestion des factures :

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

# Routes admin factures ⚡ NOUVEAU
GET /admin/factures/stats
GET /admin/factures?page=1&limit=10&search=client&statut=PAID&sortBy=amount&sortOrder=desc
GET /admin/factures/:id
PUT /admin/factures/:id → { "statut": "PAID" | "GENERATED" | "OVERDUE" }
DELETE /admin/factures/:id
POST /admin/factures/:id/reminder → Envoi rappel email
GET /admin/factures/:id/pdf → Téléchargement PDF admin (génération automatique)
GET /admin/factures/:id/download → Téléchargement direct PDF avec headers optimisés
```

#### Caractéristiques techniques

- **Pagination** : Limite de 50 factures par page maximum
- **Sécurité** : Vérification que la facture appartient à l'utilisateur connecté
- **Téléchargement** : Streaming direct depuis S3 ou fallback redirection URL
- **Format montant** : En centimes (base) et formaté avec devise (affichage)
- **Tri** : Les factures les plus récentes en premier
- **Interface admin** : Gestion complète avec statistiques temps réel ⚡ NOUVEAU
- **Filtres avancés** : Recherche par client, statut, montant, dates ⚡ NOUVEAU
- **Génération PDF** : PDFKit avec template professionnel A4 portrait ⚡ NOUVEAU
- **Stockage S3** : URLs signées 7 jours, ACL privé, metadata complète ⚡ NOUVEAU
- **Optimisations** : Cache S3, génération à la demande, background upload ⚡ NOUVEAU

### Événements Gérés

#### **checkout.session.completed**

- Met à jour `paymentStatus: "paid"`
- Change le statut de commande vers `EN_COURS`
- Génération automatique de notification
- Log détaillé avec informations client

#### **payment_intent.payment_failed**

- Met à jour `paymentStatus: "failed"`
- Génération automatique de notification d'erreur
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

## 📋 **Modules Admin - État 2025 (9/9 modules production-ready)**

### 🎯 **Vue d'ensemble - Intégration Espace Admin**

**✅ 9 modules terminés et opérationnels :**

- **AdminUtilisateurs** : 7 endpoints + tests + sécurité RGPD ✅
- **AdminCommandes** : 4 endpoints + filtres + statistiques ✅
- **AdminFactures** : 7 endpoints + stats + PDF ✅
- **AdminFAQ** : 5 endpoints + filtres ✅
- **AdminTarifs** : 5 endpoints + filtres ✅
- **AdminPages** : 4 endpoints + CMS pages statiques ✅
- **AdminStatistiques** : 1 endpoint + données réelles ✅ **NOUVEAU**
- **AdminMessagerie** : 2 endpoints + comptage messages non lus ✅
- **AdminNotifications** : 6 endpoints + génération automatique ✅ **NOUVEAU**

### 📋 **Module AdminCommandes - Architecture Complète**

Module complet pour la gestion administrative des commandes avec **architecture backend opérationnelle** et tests validés.

### Service AdminCommandeService

```typescript
export class AdminCommandeService {
  /**
   * Récupère les commandes avec filtres, pagination et statistiques
   */
  static async getCommandes(
    page: number = 1,
    limit: number = 10,
    filters: CommandeFilters = {},
    prisma: PrismaClient = defaultPrisma
  ): Promise<GetCommandesResponse>;

  /**
   * Met à jour le statut d'une commande
   */
  static async updateCommandeStatut(
    id: string,
    statut: StatutCommande,
    prisma: PrismaClient = defaultPrisma
  ): Promise<any>;

  /**
   * Supprime définitivement une commande
   */
  static async deleteCommande(
    id: string,
    prisma: PrismaClient = defaultPrisma
  ): Promise<void>;

  /**
   * Récupère une commande par ID avec données détaillées
   */
  static async getCommandeById(
    id: string,
    prisma: PrismaClient = defaultPrisma
  ): Promise<any>;
}
```

### Interfaces TypeScript

```typescript
export interface CommandeFilters {
  search?: string; // Recherche dans ID ou email client
  statut?: StatutCommande; // Filtrage par statut
  clientId?: string; // Filtrage par utilisateur
  dateFrom?: Date; // Date de début
  dateTo?: Date; // Date de fin
}

export interface CommandeStats {
  total: number;
  byStatut: Record<StatutCommande, number>;
}

export interface GetCommandesResponse {
  data: any[];
  stats: CommandeStats;
  page: number;
  totalPages: number;
}
```

### Tests Validés

**Tests unitaires** (`adminCommandeService.test.ts`) - **13 tests** :

- ✅ getCommandes avec différents filtres
- ✅ Pagination et calcul des statistiques
- ✅ updateCommandeStatut avec validation
- ✅ deleteCommande avec vérification existence
- ✅ Gestion d'erreurs et cas edge

**Tests d'intégration** (`adminCommandeEndpoints.test.ts`) - **15 tests** :

- ✅ GET /admin/commandes avec authentification JWT
- ✅ PUT /admin/commandes/:id avec validation statut
- ✅ DELETE /admin/commandes/:id avec autorisation ADMIN
- ✅ Filtres et pagination en conditions réelles
- ✅ Codes d'erreur HTTP appropriés

### Fonctionnalités Avancées

**Filtres intelligents :**

- **Recherche textuelle** : ID commande ou email client (insensible casse)
- **Filtrage par statut** : Validation enum côté serveur
- **Plages de dates** : Parsing automatique format ISO
- **Pagination optimisée** : Skip/take Prisma avec calcul totalPages

**Statistiques temps réel :**

- **Total filtré** : Nombre de commandes correspondant aux critères
- **Répartition par statut** : Comptage pour chaque StatutCommande
- **Requêtes parallèles** : Optimisation performance avec Promise.all

**Logs de debugging :**

- **Traçabilité complète** : Paramètres, filtres, résultats
- **Monitoring problèmes** : Identification des bugs frontend
- **Format structuré** : JSON avec métadonnées pour analyse

## ⚡ **Nouveaux Modules 2025 - FAQ et Tarifs Dynamiques**

### 🎯 **Module AdminFAQ - Base de Connaissance** ✅ PRODUCTION READY

```http
# Statistiques FAQ
GET /admin/faq/stats → { total, visibles, categories }

# Liste paginée avec filtres
GET /admin/faq?page=1&limit=10&search=question&visible=true&categorie=GENERAL
→ { data: [], pagination: { ... } }

# CRUD complet
GET /admin/faq/:id → Détails d'une FAQ
POST /admin/faq → { question, answer, categorie, visible, ordre }
PUT /admin/faq/:id → Mise à jour complète
DELETE /admin/faq/:id → Suppression FAQ

# Route publique pour frontend
GET /faq?visible=true&categorie=GENERAL → FAQ publiques
```

### 🏷️ **Module AdminTarifs - Configuration Prix** ✅ PRODUCTION READY

```http
# Statistiques tarifs
GET /admin/tarifs/stats/overview → { total, actifs, typesServices }

# Liste paginée avec filtres
GET /admin/tarifs?page=1&limit=10&search=nom&actif=true&typeService=CORRECTION
→ { data: [], pagination: { ... } }

# CRUD complet
GET /admin/tarifs/:id → Détails d'un tarif
POST /admin/tarifs → { nom, description, prix, typeService, actif, ordre }
PUT /admin/tarifs/:id → Mise à jour complète
DELETE /admin/tarifs/:id → Suppression tarif

# Route publique pour frontend (synchronisation temps réel)
GET /tarifs?actif=true → Tarifs publics pour calculateur
```

### 📞 **Module Consultations - Réservation d'Appels** ✅ NOUVEAU JUILLET 2025

```http
# Réservation de consultation (public)
POST /consultations/book
Content-Type: application/json

{
  "firstName": "Jean",
  "lastName": "Dupont", 
  "email": "jean@example.com",
  "phone": "06 12 34 56 78",
  "date": "2025-07-15",
  "time": "14:00",
  "message": "Je souhaite discuter de mon manuscrit",
  "requestedDateTime": "2025-07-15 14:00",
  "source": "landing_page"
}

# Response: 201
{
  "success": true,
  "message": "Demande de consultation envoyée avec succès",
  "data": {
    "messageId": "uuid",
    "requestedDateTime": "2025-07-15 14:00"
  }
}

# Créneaux disponibles (public)
GET /consultations/available-slots?date=2025-07-15

# Response: 200
{
  "success": true,
  "date": "2025-07-15",
  "slots": [
    { "time": "09:00", "available": true },
    { "time": "09:30", "available": true },
    { "time": "10:00", "available": false },
    // ... autres créneaux
  ]
}

# Liste des demandes de consultation (admin uniquement)
GET /consultations/requests
Authorization: Bearer admin-token

# Marquer une demande comme traitée (admin uniquement)
PUT /consultations/requests/:messageId
Authorization: Bearer admin-token
Content-Type: application/json

{
  "status": "processed",
  "adminNote": "Appel confirmé par email"
}
```

### 📊 **Module AdminStatistiques - Analytics Temps Réel** ✅ NOUVEAU 2025

```http
# Statistiques admin avec données réelles
GET /admin/stats
Authorization: Bearer admin-token

# Response: 200
{
  "chiffreAffairesMois": 12500, // CA mensuel en centimes
  "evolutionCA": 15.2, // Evolution vs mois précédent en %
  "nouvellesCommandesMois": 8,
  "evolutionCommandes": 33.3,
  "nouveauxClientsMois": 5,
  "evolutionClients": -10.0,
  "derniersPaiements": [...], // 5 paiements les plus récents
  "satisfactionMoyenne": 4.6, // Note sur 5
  "nombreAvisTotal": 142,
  "resumeMois": {
    "periode": "janvier 2025",
    "totalCA": 12500,
    "totalCommandes": 8,
    "totalClients": 5
  }
}
```

### 🔔 **Module Notifications Email Centralisé** ✅ PRODUCTION-READY 2025

**🆕 Architecture Événementielle Complète** avec système d'emails automatiques centralisé

#### **📧 Système d'emails automatiques**

**Architecture EventBus + Listeners + Queue :**
- **EventBus** (`src/events/eventBus.ts`) : Émetteur d'événements Node.js
- **Listeners** : 
  - `adminNotificationEmailListener.ts` : Écoute `admin.notification.created`
  - `userNotificationEmailListener.ts` : Écoute `user.notification.created`
- **Queue** (`src/queues/emailQueue.ts`) : Traitement asynchrone des emails
- **Templates** (`src/emails/templates/*.hbs`) : 18 templates HTML professionnels

**🎯 Zero code duplication :** Tous les appels à `createAdminNotification()` ou `createUserNotification()` génèrent automatiquement :
1. Une notification dans l'interface (clochette)
2. Un email envoyé automatiquement

#### **📬 Templates disponibles**

**Admin (9 templates) :**
- `admin-message.hbs` : Nouveau message client/visiteur
- `admin-payment.hbs` : Paiement reçu
- `admin-order.hbs` : Nouvelle commande
- `admin-system-alert.hbs` : Alerte système
- `admin-error.hbs` : Erreur critique
- `admin-warning.hbs` : Avertissement
- `admin-success.hbs` : Succès opération
- `admin-info.hbs` : Information générale
- `admin-consultation.hbs` : Nouvelle consultation

**Utilisateurs (9 templates) :**
- `message-user.hbs` : Message reçu
- `payment-user.hbs` : Confirmation paiement
- `order-user.hbs` : Commande traitée
- Etc. (même logique que admin)

**Visiteurs (2 templates) :**
- `visitor-contact-confirmation.hbs` : Confirmation contact
- `visitor-sample-confirmation.hbs` : Confirmation échantillon gratuit

```http
# Interface notifications (API REST classique)
GET /notifications?page=1&limit=20&unread=false
Authorization: Bearer token

# Compteur de notifications non lues
GET /notifications/unread-count
Authorization: Bearer token

# Marquer une notification comme lue
PATCH /notifications/:id/read
Authorization: Bearer token

# Marquer toutes les notifications comme lues
PATCH /notifications/read-all
Authorization: Bearer token

# Supprimer une notification
DELETE /notifications/:id
Authorization: Bearer token
```

#### **🔧 Usage développeur**

```typescript
// Dans un contrôleur - l'email est automatique !
await createAdminNotification(
  "Nouveau paiement reçu",
  `${customerName} a payé ${amount}€`,
  NotificationType.PAYMENT,
  NotificationPriority.HAUTE,
  "/admin/invoices",
  { customerName, amount, commandeTitle }
);
// → Génère automatiquement :
// 1. Notification interface admin
// 2. Email à ADMIN_EMAIL avec template admin-payment.hbs

// Pour les utilisateurs
await createUserNotification(
  userId,
  "Commande traitée",
  "Votre commande a été traitée avec succès",
  NotificationType.ORDER,
  NotificationPriority.NORMALE,
  "/dashboard/orders"
);
// → Génère automatiquement :
// 1. Notification interface utilisateur
// 2. Email avec template order-user.hbs (si opt-in)
```

#### **⚙️ Préférences utilisateur**

```json
// Champ preferences dans User
{
  "emailNotifications": true  // Opt-out possible
}
```

#### **🚀 Avantages**

- **DRY** : Plus de duplication `MailerService.sendEmail()` dans les contrôleurs
- **Zéro oubli** : Tout appel génère automatiquement un email
- **Templates centralisés** : Design cohérent, maintenance facile
- **Extensible** : Ajouter un type = ajouter un template
- **Performance** : Queue asynchrone, pas de blocage
- **Robuste** : Gestion d'erreurs, retry automatique

### Routes admin principales (`/admin`) - **65+ ENDPOINTS DISPONIBLES**

```http
# Statistiques générales (pour AdminStatistiques) - ✅ MODULE COMPLET OPÉRATIONNEL
GET /admin/stats
Authorization: Bearer admin_token
# → Statistiques temps réel avec données Prisma

# Gestion utilisateurs (pour AdminUtilisateurs) - ✅ MODULE COMPLET OPÉRATIONNEL
GET /admin/users?page=1&limit=10&search=email&role=USER&isActive=true
Authorization: Bearer admin_token
GET /admin/users/stats
Authorization: Bearer admin_token
GET /admin/users/:id
Authorization: Bearer admin_token
POST /admin/users
Authorization: Bearer admin_token
PATCH /admin/users/:id
Authorization: Bearer admin_token
PATCH /admin/users/:id/toggle-status
Authorization: Bearer admin_token
DELETE /admin/users/:id
Authorization: Bearer admin_token

# Gestion commandes (pour AdminCommandes) - ✅ MODULE COMPLET OPÉRATIONNEL
GET /admin/commandes?page=1&limit=10&search=jean&statut=EN_COURS&clientId=uuid&dateFrom=2025-01-01&dateTo=2025-01-31
Authorization: Bearer admin_token
# Réponse: { data: [], stats: { total, byStatut }, page, totalPages, filters }

GET /admin/commandes/:id
Authorization: Bearer admin_token
# Détails complets d'une commande avec relations (user, files, invoices)

PUT /admin/commandes/:id
Authorization: Bearer admin_token
Body: { "statut": "EN_COURS" | "TERMINE" | "ANNULEE" | "SUSPENDUE" | "EN_ATTENTE" }

DELETE /admin/commandes/:id
Authorization: Bearer admin_token
# Suppression définitive d'une commande avec validation

# Gestion factures (pour AdminFactures) - ✅ MODULE COMPLET OPÉRATIONNEL
GET /admin/factures/stats
Authorization: Bearer admin_token
GET /admin/factures?page=1&limit=10&search=client&statut=PAID
Authorization: Bearer admin_token
GET /admin/factures/:id
Authorization: Bearer admin_token
PUT /admin/factures/:id
Authorization: Bearer admin_token
DELETE /admin/factures/:id
Authorization: Bearer admin_token
POST /admin/factures/:id/reminder
Authorization: Bearer admin_token
GET /admin/factures/:id/pdf
Authorization: Bearer admin_token

# Gestion FAQ (pour AdminFAQ) - ✅ MODULE COMPLET OPÉRATIONNEL
GET /admin/faq/stats
Authorization: Bearer admin_token
GET /admin/faq?page=1&limit=10&search=question&visible=true&categorie=GENERAL
Authorization: Bearer admin_token
GET /admin/faq/:id
Authorization: Bearer admin_token
POST /admin/faq
Authorization: Bearer admin_token
PUT /admin/faq/:id
Authorization: Bearer admin_token
DELETE /admin/faq/:id
Authorization: Bearer admin_token

# Gestion tarifs (pour AdminTarifs) - ✅ MODULE COMPLET OPÉRATIONNEL
GET /admin/tarifs/stats/overview
Authorization: Bearer admin_token
GET /admin/tarifs?page=1&limit=10&search=nom&actif=true&typeService=CORRECTION
Authorization: Bearer admin_token
GET /admin/tarifs/:id
Authorization: Bearer admin_token
POST /admin/tarifs
Authorization: Bearer admin_token
PUT /admin/tarifs/:id
Authorization: Bearer admin_token
DELETE /admin/tarifs/:id
Authorization: Bearer admin_token

# Gestion pages (pour AdminPages) - ✅ MODULE COMPLET OPÉRATIONNEL
GET /admin/pages?page=1&limit=10&search=titre&statut=PUBLIEE
Authorization: Bearer admin_token
GET /admin/pages/:id
Authorization: Bearer admin_token
POST /admin/pages
Authorization: Bearer admin_token
PATCH /admin/pages/:id
Authorization: Bearer admin_token
DELETE /admin/pages/:id
Authorization: Bearer admin_token

# Messagerie admin (pour AdminMessagerie) - ✅ MODULE COMPLET OPÉRATIONNEL
GET /admin/messages/unread-count
Authorization: Bearer admin_token
GET /admin/messages?page=1&limit=100&search=visitor&isRead=false
Authorization: Bearer admin_token
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
4. **Webhook**: `checkout.session.completed` → update `paymentStatus: "paid"` + notification
5. **Client**: Redirection vers page succès

### Pages de retour

- **Succès**: `/payment-success?session_id=cs_...`
- **Annulation**: `/payment-cancel`

## 🧪 **Tests - Architecture 2025 (87% Coverage)**

### **État des tests - Version 2025**

**📊 Métriques globales :**

- **80+ tests unitaires** répartis en 8 suites
- **5 suites d'intégration** avec base de données réelle
- **Coverage 87%+ global** avec détail par module
- **3300+ lignes de tests** tous niveaux confondus
- **Pipeline CI/CD optimisé** avec parallélisation
- **Architecture séparée** : Backend tests isolés, frontend tests unitaires/intégration séparés

### **Nouveaux tests 2025 ⚡**

**Tests backend nouveaux modules (971 lignes) :**

- `invoiceRoutes.test.ts` (416 lignes) : Tests unitaires routes factures
- `invoiceService.test.ts` (270 lignes) : Tests génération PDF
- `webhookWithInvoice.test.ts` (285 lignes) : Tests webhook + facturation
- `invoiceEndpoints.test.ts` (386 lignes) : Tests intégration factures
- `adminUserEndpoints.test.ts` (364 lignes) : Tests intégration admin users
- `adminCommandeEndpoints.test.ts` (293 lignes) : Tests intégration commandes

### Configuration Vitest et Scripts

```bash
# Backend - Tests isolés
npm test                                    # Tous les tests backend
npm run test:watch                          # Mode watch
npm test -- --coverage                     # Coverage détaillée

# Tests spécifiques nouveaux modules
npm test -- tests/unit/invoice*.test.ts
npm test -- tests/integration/admin*.test.ts

# Test API statistiques admin
node test-admin-stats.js

# Frontend - Architecture séparée (depuis frontend/)
npm run test:unit                           # Tests unitaires (CI/CD)
npm run test:integration                    # Tests intégration (local + backend)
npm run test:all                           # Tous les tests (local)
```

### Pipeline CI/CD Optimisé

```yaml
# GitHub Actions - Tests séparés
jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Test Backend
        run: npm test
        working-directory: ./backend
        
  test-frontend:
    runs-on: ubuntu-latest  
    steps:
      - name: Test Frontend Unit Only
        run: npm run test:unit
        working-directory: ./frontend
```

### Structure des tests mise à jour

```
tests/
├── unit/                          # Tests unitaires (8 suites)
│   ├── adminUserService.test.ts   # Service admin users (396 lignes)
│   ├── adminCommandeService.test.ts # Service admin commandes
│   ├── invoiceRoutes.test.ts      # Routes factures (416 lignes) ⚡ NOUVEAU
│   ├── invoiceService.test.ts     # Service factures (270 lignes) ⚡ NOUVEAU
│   ├── pdfService.test.ts         # Service PDF factures (300+ lignes) ⚡ NOUVEAU
│   ├── s3InvoiceService.test.ts   # Service S3 factures (250+ lignes) ⚡ NOUVEAU
│   ├── webhook.test.ts            # Webhook Stripe
│   └── webhookWithInvoice.test.ts # Webhook + facturation (285 lignes) ⚡ NOUVEAU
├── integration/                   # Tests d'intégration (5 suites)
│   ├── adminUserEndpoints.test.ts # Endpoints admin users (364 lignes)
│   ├── adminCommandeEndpoints.test.ts # Endpoints commandes (293 lignes)
│   └── invoiceEndpoints.test.ts   # Endpoints factures (386 lignes) ⚡ NOUVEAU
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

### **Coverage par module**

| Module                 | Unitaires | Intégration | **Coverage**       |
| ---------------------- | --------- | ----------- | ------------------ |
| **Admin Users**        | ✅        | ✅          | **95%+**           |
| **Admin Commandes**    | ✅        | ✅          | **92%+**           |
| **Admin Statistiques** | ✅        | ✅          | **90%+** ⚡ NOUVEAU |
| **Notifications**      | ✅        | ✅          | **88%+** ⚡ NOUVEAU |
| **Factures**           | ✅        | ✅          | **88%+** ⚡ NOUVEAU |
| **Webhook**            | ✅        | ✅          | **90%+**           |
| **Messagerie**         | ✅        | ✅          | **85%+**           |
| **Auth**               | ✅        | ✅          | **88%+**           |
| **Paiements**          | ✅        | ✅          | **87%+**           |
| **Global**             | **80+ tests** | **5 suites** | **87%+**       |

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

# Emails et notifications (NOUVEAU SYSTÈME CENTRALISÉ)
SENDGRID_API_KEY="SG.xxx..."                    # Clé API SendGrid
FROM_EMAIL="noreply@staka-livres.com"           # Email expéditeur par défaut
FROM_NAME="Staka Livres"                        # Nom expéditeur
SUPPORT_EMAIL="support@staka-livres.fr"         # Email support client
ADMIN_EMAIL="admin@staka-livres.fr"             # Email notifications admin centralisées
APP_URL="http://localhost:3001"                 # URL frontend pour liens emails

# AWS S3 (optionnel)
AWS_ACCESS_KEY_ID="your_aws_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret"
AWS_REGION="eu-west-3"
AWS_S3_BUCKET="staka-livres-files"
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
  "timestamp": "2025-07-10T14:30:00.000Z"
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

## 🚀 Déploiement - État Production 2025

### **Status Production Ready ✅**

**Modules opérationnels en production :**

- ✅ **9/9 modules admin** terminés et testés
- ✅ **65+ endpoints API** documentés et validés
- ✅ **Système de notifications** temps réel avec génération automatique
- ✅ **Système de statistiques** admin avec données réelles
- ✅ **Système de facturation** avec PDF et S3
- ✅ **Messagerie complète** avec administration
- ✅ **Tests 87% coverage** avec CI/CD automatisé et architecture séparée
- ✅ **Architecture Docker** optimisée et scalable

### Production checklist

- [x] Variables d'environnement sécurisées
- [x] JWT_SECRET complexe et secret
- [x] Clés Stripe de production
- [x] SSL/HTTPS activé
- [x] Rate limiting configuré (messagerie)
- [x] Logs centralisés et structurés ⚡ NOUVEAU
- [x] Monitoring/alertes (Webhook + API)
- [x] Backup base de données
- [x] Tests 87% coverage passants ⚡ NOUVEAU
- [x] Architecture CI/CD optimisée (tests séparés) ⚡ NOUVEAU
- [x] Documentation API complète ⚡ NOUVEAU
- [x] Facturation automatique S3 ⚡ NOUVEAU
- [x] Système notifications temps réel ⚡ NOUVEAU
- [x] Statistiques admin temps réel ⚡ NOUVEAU

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

# Corriger le rôle admin (si nécessaire)
node fix-admin-role.js

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

# Test API statistiques admin
node test-admin-stats.js
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

# Corriger rôle admin
docker exec -w /app staka_backend node fix-admin-role.js
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

**"Admin user has role USER instead of ADMIN"**

```bash
# Corriger le rôle admin
docker exec -w /app staka_backend node fix-admin-role.js
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
docker exec -w /app staka_backend node fix-admin-role.js
```

## 📚 Resources

### Documentation

- [Express.js](https://expressjs.com/)
- [Prisma ORM](https://prisma.io/docs)
- [Stripe API](https://stripe.com/docs/api)
- [JWT.io](https://jwt.io/)

### Guides Techniques

- [📄 Guide Génération PDF Factures](PDF_INVOICE_GENERATION.md) - Génération, stockage S3 et téléchargement
- [💳 Guide Facturation Stripe](BILLING_AND_INVOICES.md) - Intégration paiements et facturation
- [📊 Guide Base de Données](Base-de-donnees-guide.md) - Modèles Prisma et optimisations

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

## 🎯 **Intégration Espace Admin - État Actuel 2025**

### ✅ **Modules Opérationnels (9/9 modules terminés)**

L'espace admin frontend est maintenant **complet avec données réelles**. **9 modules backend sont production-ready** :

#### **1. AdminStatistiques** - Analytics Temps Réel ✅ **NOUVEAU PRODUCTION READY**

```typescript
GET /admin/stats → StatistiquesAdmin avec calculs Prisma réels
// Chiffre d'affaires, évolutions, derniers paiements, satisfaction
```

#### **2. AdminNotifications** - Notifications Temps Réel ✅ **NOUVEAU PRODUCTION READY**

```typescript
GET /notifications → Liste paginée avec filtres
GET /notifications/unread-count → Compteur temps réel
PATCH /notifications/:id/read → Marquer comme lu
DELETE /notifications/:id → Supprimer notification
// Génération automatique pour tous événements système
```

#### **3. AdminUtilisateurs** - Gestion Utilisateurs ✅ **PRODUCTION READY**

```typescript
GET /admin/users/stats → { total, actifs, inactifs, admin, users, recents }
GET /admin/users?page=1&limit=10&search=email&role=USER&isActive=true
GET /admin/users/:id → Détails utilisateur complets
POST /admin/users → Création avec validation RGPD
PATCH /admin/users/:id → Mise à jour profil
PATCH /admin/users/:id/toggle-status → Activer/désactiver
DELETE /admin/users/:id → Suppression RGPD complète
```

#### **4. AdminCommandes** - Gestion Commandes ✅ **PRODUCTION READY**

```typescript
GET /admin/commandes?page=1&limit=10&search=jean&statut=EN_COURS&clientId=uuid&dateFrom=2025-01-01&dateTo=2025-01-31
→ { data: [], stats: { total, byStatut }, page, totalPages, filters }
GET /admin/commandes/:id → Détails complets avec relations
PUT /admin/commandes/:id → { "statut": "EN_COURS" | "TERMINE" | "ANNULEE" | "SUSPENDUE" | "EN_ATTENTE" }
DELETE /admin/commandes/:id → Suppression définitive avec validation
```

#### **5. AdminFactures** - Interface Facturation ✅ **PRODUCTION READY**

```typescript
GET /admin/factures/stats → { total, paid, unpaid, overdue, totalRevenue }
GET /admin/factures?page=1&limit=10&search=client&statut=PAID
GET /admin/factures/:id → Détails facture avec client et commande
PUT /admin/factures/:id → { "statut": "PAID" | "UNPAID" }
POST /admin/factures/:id/reminder → Envoi rappel de paiement
GET /admin/factures/:id/pdf → Téléchargement PDF sécurisé
DELETE /admin/factures/:id → Suppression facture
```

#### **6. AdminFAQ** - Base de Connaissance ✅ **PRODUCTION READY**

```typescript
GET /admin/faq/stats → { total, visibles, categories }
GET /admin/faq?page=1&limit=10&search=question&visible=true&categorie=GENERAL
GET /admin/faq/:id → Détails d'une FAQ
POST /admin/faq → { question, reponse, categorie, isActive, sortOrder }
PUT /admin/faq/:id → Mise à jour complète
DELETE /admin/faq/:id → Suppression FAQ
```

#### **7. AdminTarifs** - Configuration Prix ✅ **PRODUCTION READY**

```typescript
GET /admin/tarifs/stats/overview → { total, actifs, typesServices }
GET /admin/tarifs?page=1&limit=10&search=nom&actif=true&typeService=CORRECTION
GET /admin/tarifs/:id → Détails d'un tarif
POST /admin/tarifs → { nom, description, prix, typeService, actif, ordre }
PUT /admin/tarifs/:id → Mise à jour complète
DELETE /admin/tarifs/:id → Suppression tarif
```

#### **8. AdminPages** - CMS Pages Statiques ✅ **PRODUCTION READY**

```typescript
GET /admin/pages?page=1&limit=10&search=titre&statut=PUBLIEE
GET /admin/pages/:id → Détails d'une page
POST /admin/pages → { titre, contenu, slug, description, type, statut }
PATCH /admin/pages/:id → Mise à jour page
DELETE /admin/pages/:id → Suppression page
```

#### **9. AdminMessagerie** - Messagerie Admin ✅ **PRODUCTION READY**

```typescript
GET /admin/messages/unread-count → { unreadCount }
GET /admin/messages?page=1&limit=100&search=visitor&isRead=false
→ { messages: [], pagination } avec support visiteurs et utilisateurs
```

### 🎯 **Frontend Prêt pour Intégration**

- ✅ **API services configurés** : `adminAPI.ts` avec structure complète
- ✅ **Types TypeScript** : Interfaces pour toutes les entités dans `shared.ts`
- ✅ **UI Components** : 9 pages admin avec états loading/error/empty
- ✅ **Architecture modulaire** : Services facilement remplaçables par vrais appels API
- ✅ **Messagerie complète** : Interface admin fonctionnelle avec API backend
- ✅ **Notifications temps réel** : Système complet avec génération automatique
- ✅ **Statistiques temps réel** : Données réelles depuis MySQL/Prisma

### 📊 **Bilan d'Avancement Actuel**

**✅ Terminé (100% - 9/9 modules)** :

- **AdminStatistiques** : 1 endpoint + données réelles Prisma ⚡ NOUVEAU
- **AdminNotifications** : 6 endpoints + génération automatique ⚡ NOUVEAU
- **AdminUtilisateurs** : 7 endpoints + tests + sécurité RGPD
- **AdminCommandes** : 4 endpoints + filtres + statistiques
- **AdminFactures**: 8 endpoints + stats + génération PDF avancée ([Guide PDF](PDF_INVOICE_GENERATION.md))
- **AdminFAQ**: 5 endpoints + filtres
- **AdminTarifs**: 5 endpoints + filtres
- **AdminPages**: 4 endpoints + CMS pages statiques
- **AdminMessagerie** : 2 endpoints + comptage messages non lus

---

## 🎯 **Bilan 2025 - Backend Production Ready**

### **📊 Métriques finales**

- **✅ 66+ endpoints API** dont 46+ admin opérationnels
- **✅ 9/9 modules admin** production-ready (100% complétude)
- **✅ Tests 87% coverage** : 80+ unitaires, 5 suites intégration, architecture CI/CD optimisée
- **✅ 3300+ lignes de tests** validés en conditions réelles
- **✅ Architecture Docker** optimisée avec CI/CD

### **🚀 Fonctionnalités clés déployées**

- **Système de notifications temps réel** avec génération automatique ✅ NOUVEAU
- **Système de statistiques admin** avec données réelles Prisma ✅ NOUVEAU
- **Système de facturation automatique** avec PDF + S3 ✅
- **Interface admin messagerie** avec comptage messages non lus ✅
- **Modules FAQ et Tarifs** avec synchronisation temps réel ✅
- **Module Pages CMS** avec gestion contenu statique ✅
- **Webhook Stripe** architecture modulaire + monitoring ✅
- **Sécurité RGPD** complète avec suppression en cascade ✅
- **Anti-spam messagerie** avec rate limiting intelligent ✅

### **🎉 Développements Finalisés (100%)**

**Tous les modules admin sont maintenant terminés et opérationnels** avec scripts de test automatisés.

---

**Backend Staka Livres** - API REST moderne pour plateforme de correction de livres

**🎯 Version Janvier 2025 : 100% production-ready, 70+ endpoints, architecture scalable complète**

## Module Admin Users - ✅ PRODUCTION READY (v2024.06)

### 🚀 Vue d'ensemble

Module CRUD complet pour la gestion des utilisateurs admin **100% fonctionnel** et **testé en production** avec Docker. Intégration frontend/backend complète avec sécurité JWT, conformité RGPD et tests automatisés.

#### 🏗️ Architecture technique

- **Service** : `AdminUserService` - Logique métier avec méthodes statiques
- **Contrôleur** : `AdminUserController` - Validation et gestion HTTP
- **Routes** : `/admin/users/*` - 7 endpoints REST sécurisés
- **Tests** : Unitaires (100% couverture) + Intégration (Supertest)
- **Frontend** : `adminAPI.ts` intégré avec gestion d'erreurs

#### 🌐 Endpoints disponibles

| Endpoint                         | Méthode | Description              | Status |
| -------------------------------- | ------- | ------------------------ | ------ |
| `/admin/users/stats`             | GET     | Statistiques dashboard   | ✅     |
| `/admin/users`                   | GET     | Liste paginée + filtres  | ✅     |
| `/admin/users/:id`               | GET     | Détails utilisateur      | ✅     |
| `/admin/users`                   | POST    | Création utilisateur     | ✅     |
| `/admin/users/:id`               | PATCH   | Modification utilisateur | ✅     |
| `/admin/users/:id/toggle-status` | PATCH   | Basculer statut          | ✅     |
| `/admin/users/:id`               | DELETE  | Suppression RGPD         | ✅     |

#### 📊 Exemples d'utilisation

**Statistiques dashboard :**

```http
GET /admin/users/stats
Authorization: Bearer <admin-jwt-token>

# Response: 200
{
  "success": true,
  "data": {
    "total": 150,
    "actifs": 142,
    "inactifs": 8,
    "admin": 3,
    "users": 147,
    "recents": 12
  },
  "message": "Statistiques des utilisateurs récupérées"
}
```

**Liste avec filtres :**

```http
GET /admin/users?page=1&limit=10&search=jean&role=USER&isActive=true
Authorization: Bearer <admin-jwt-token>

# Response: 200
{
  "success": true,
  "data": [
    {
      "id": "uuid-1234",
      "prenom": "Jean",
      "nom": "Dupont",
      "email": "jean@example.com",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Création utilisateur :**

```http
POST /admin/users
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "prenom": "Marie",
  "nom": "Martin",
  "email": "marie@example.com",
  "password": "motdepasse123",
  "role": "USER",
  "isActive": true
}

# Response: 201
{
  "success": true,
  "data": {
    "id": "uuid-5678",
    "prenom": "Marie",
    "nom": "Martin",
    "email": "marie@example.com",
    "role": "USER",
    "isActive": true,
    "createdAt": "2025-01-01T11:00:00.000Z"
  },
  "message": "Utilisateur Marie Martin créé avec succès"
}
```

#### 🔐 Sécurité validée

**Authentification & Autorisations :**

- ✅ JWT Admin obligatoire sur tous endpoints
- ✅ Middleware `requireRole('ADMIN')` appliqué
- ✅ Protection dernier admin actif (suppression/désactivation)
- ✅ Validation email unique avec contrainte DB

**Validation données :**

- ✅ Email format validé + unicité
- ✅ Mots de passe 8+ caractères + hashage bcryptjs
- ✅ Noms minimum 2 caractères
- ✅ Rôles enum strict (USER|ADMIN)

#### 🗑️ Suppression RGPD conforme

Transaction Prisma complète respectant l'ordre des dépendances :

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Notifications liées à l'utilisateur
  await tx.notification.deleteMany({ where: { userId } });

  // 2. Moyens de paiement
  await tx.paymentMethod.deleteMany({ where: { userId } });

  // 3. Tickets de support
  await tx.supportTicket.deleteMany({ where: { userId } });

  // 4. Messages envoyés/reçus
  await tx.message.deleteMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
  });

  // 5. Fichiers uploadés
  await tx.file.deleteMany({ where: { userId } });

  // 6. Commandes et factures
  await tx.commande.deleteMany({ where: { userId } });

  // 7. Utilisateur principal
  await tx.user.delete({ where: { id: userId } });
});
```

#### 📋 Filtres et pagination

```typescript
interface UsersFilters {
  page: number; // Numéro de page (défaut: 1)
  limit: number; // Éléments par page (défaut: 10, max: 100)
  search?: string; // Recherche insensible casse (nom/prénom/email)
  role?: Role; // Filtrer par rôle (USER|ADMIN)
  isActive?: boolean; // Filtrer par statut actif (true/false)
}

// Utilisation optimisée Prisma
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
  where: {
    OR: search
      ? [
          { prenom: { contains: search, mode: "insensitive" } },
          { nom: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ]
      : undefined,
    role: role || undefined,
    isActive: isActive !== undefined ? isActive : undefined,
  },
  select: {
    id: true,
    prenom: true,
    nom: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  },
  orderBy: { createdAt: "desc" },
});
```

#### 🧪 Tests automatisés validés

**Tests unitaires** (`adminUserService.test.ts`) :

- ✅ Mocks Prisma et bcryptjs configurés
- ✅ Couverture 100% méthodes service
- ✅ Tests cas d'erreur (dernier admin, email dupliqué)
- ✅ Validation règles métier et sécurité

**Tests d'intégration** (`adminUserEndpoints.test.ts`) :

- ✅ Base de données réelle avec Supertest
- ✅ Authentification JWT testée
- ✅ Workflow CRUD complet validé
- ✅ Autorisations admin vs user

#### 🐳 Validation Docker production

**Tests effectués en conditions réelles :**

```bash
# ✅ Stack complète démarrée
docker-compose up --build -d

# ✅ Tests API avec cURL
POST /auth/login → Token admin récupéré
GET /admin/users/stats → Statistiques réelles
GET /admin/users → Pagination + 3 utilisateurs
POST /admin/users → "Sophie Dubois" créée
PATCH /admin/users/:id/toggle-status → Statut basculé
DELETE /admin/users/:id → Suppression RGPD confirmée
```

#### ⚡ Performance optimisée

- **Temps de réponse** : < 100ms requêtes simples
- **Pagination Prisma** : `skip`/`take` au lieu d'offset
- **Transactions RGPD** : Suppression complète < 500ms
- **Index DB** : Email unique avec index automatique
- **Connection pooling** : Gestion optimale connexions

#### 🔗 Intégration frontend

```typescript
// Service adminAPI.ts intégré avec nouveaux endpoints
const stats = await adminAPI.getUserStats(); // ✅
const users = await adminAPI.getUsers(1, 10, "", "USER", true); // ✅
const user = await adminAPI.getUserById(id); // ✅
const created = await adminAPI.createUser(userData); // ✅
const updated = await adminAPI.updateUser(id, updates); // ✅
const toggled = await adminAPI.toggleUserStatus(id); // ✅
await adminAPI.deleteUser(id); // ✅
```

#### 📈 Métriques de livraison

**Status** : ✅ **PRODUCTION READY**  
**Endpoints** : 7/7 fonctionnels avec tests passants  
**Performance** : < 2s chargement, < 100ms API  
**Sécurité** : JWT + RBAC + RGPD + Audit logs  
**Tests** : 100% réussis (unitaires + intégration + Docker)

#### 🎯 Logs d'audit automatiques

```typescript
// Exemples de logs générés
console.log(`🔐 [ADMIN AUDIT] ${adminEmail} - ${action} ${details}`);

// Logs réels :
// 🔐 [ADMIN AUDIT] admin@staka.com - GET_USERS {"page":1,"limit":10}
// 🔐 [ADMIN AUDIT] admin@staka.com - CREATE_USER_SUCCESS - User: uuid-1234 {"email":"marie@example.com","role":"USER"}
// 🔐 [ADMIN AUDIT] admin@staka.com - DELETE_USER_SUCCESS - User: uuid-5678 (RGPD)
```

#### ⚠️ Gestion d'erreurs standardisée

```typescript
// Réponses succès
{
  "success": true,
  "data": T,
  "message": "Description action",
  "pagination"?: PaginationInfo
}

// Réponses erreur
{
  "success": false,
  "error": "Type erreur",
  "message": "Description détaillée",
  "details"?: ValidationError[]
}

// Codes HTTP
200/201 - Succès | 400 - Validation | 401 - Auth | 403 - Admin requis
404 - Non trouvé | 409 - Conflit email | 500 - Erreur serveur
```

#### 📚 Documentation complète

Voir `docs/INTEGRATION_ADMIN_USERS_COMPLETE.md` pour :

- Guide API détaillé avec exemples
- Architecture technique complète
- Tests de validation Docker
- Guide de déploiement production

---

**Module Admin Users** - Intégration frontend/backend **100% opérationnelle** et prête pour la production