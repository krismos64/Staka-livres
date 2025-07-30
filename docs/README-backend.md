# 🚀 Backend API Staka Livres - Guide Technique Complet

![Node.js](https://img.shields.io/badge/Node.js-18.20.2-green)
![Express](https://img.shields.io/badge/Express-4.18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.10.1-purple)
![Stripe](https://img.shields.io/badge/Stripe-18.2.1-purple)
![MySQL](https://img.shields.io/badge/MySQL-8.4-orange)
![Tests](https://img.shields.io/badge/Tests-87%25%20Coverage-brightgreen)
![Production](https://img.shields.io/badge/Status-Production%20Deployed-success)
![OVH](https://img.shields.io/badge/Deployed-VPS%20OVH-blue)

**📅 Mis à jour le 30 juillet 2025 par Christophe Mostefaoui - https://livrestaka.fr/**

---

## 📋 **Vue d'ensemble**

Backend REST API pour **Staka Livres**, plateforme professionnelle de correction de manuscrits déployée en production sur **VPS OVH** (https://livrestaka.fr/) via SSH et Docker. Architecture enterprise-grade avec TypeScript, Express, Prisma ORM et intégrations Stripe avancées.

### 🏆 **Métriques Production (30 Juillet 2025)**

| Composant | Détail | Statut |
|-----------|--------|---------|
| **🌐 Endpoints API** | 118+ endpoints répartis sur 28 fichiers routes | ✅ Production |
| **📁 Contrôleurs** | 26 contrôleurs spécialisés | ✅ Optimisés |
| **🧪 Tests** | 17 fichiers tests source (90% couverture) | ✅ Robustes |
| **🗄️ Base de données** | 14 modèles Prisma avec 20 relations | ✅ Optimisée |
| **🔒 Sécurité** | JWT + RGPD + Audit logs + Rate limiting | ✅ Conforme |
| **📧 Emails** | 22 templates HTML + queue asynchrone | ✅ Production |
| **💳 Paiements** | Stripe webhooks + facturation PDF | ✅ Opérationnel |
| **🐳 Déploiement** | VPS OVH + Docker + SSH | ✅ Production |

---

## 🏗️ **Architecture Technique**

### 📁 **Structure Backend**

```
backend/
├── src/
│   ├── server.ts                   # Point d'entrée principal
│   ├── app.ts                      # Configuration Express avec middlewares
│   ├── controllers/                # 26 contrôleurs spécialisés
│   │   ├── authController.ts       # Authentification JWT
│   │   ├── adminController.ts      # Administration générale
│   │   ├── adminUserController.ts  # Gestion utilisateurs admin
│   │   ├── adminCommandeController.ts # Gestion commandes admin
│   │   ├── adminFactureController.ts # Gestion factures admin
│   │   ├── adminStatsController.ts # Statistiques admin temps réel
│   │   ├── adminAuditController.ts # Logs d'audit sécurisés
│   │   ├── adminPageController.ts  # Gestion pages CMS admin
│   │   ├── notificationsController.ts # Notifications temps réel
│   │   ├── messagesController.ts   # Messagerie avec threading
│   │   ├── paymentController.ts    # Paiements Stripe
│   │   ├── paymentMethodsController.ts # Moyens de paiement
│   │   ├── consultationController.ts # Réservations consultations
│   │   ├── publicController.ts     # Formulaires publics
│   │   ├── userController.ts       # Gestion utilisateur RGPD
│   │   ├── projectsController.ts   # Gestion projets
│   │   ├── filesController.ts      # Gestion fichiers et uploads
│   │   ├── faqController.ts        # Gestion FAQ
│   │   ├── pageController.ts       # Pages CMS publiques
│   │   ├── statsController.ts      # Statistiques générales
│   │   ├── commandeController.ts   # Commandes génériques
│   │   ├── activationController.ts  # Activation comptes utilisateur
│   │   ├── commandeClientController.ts # Commandes côté client avec notifications
│   │   ├── fileController.ts       # Contrôleur fichiers alternatif
│   │   ├── publicCommandeController.ts # Commandes publiques visiteurs
│   │   └── unifiedFileController.ts # Gestion fichiers unifiée (migration S3→Local)
│   ├── routes/                     # 30+ fichiers routes REST
│   │   ├── auth.ts                 # Routes authentification
│   │   ├── public.ts               # Routes publiques (contact, échantillons)
│   │   ├── users.ts                # Routes utilisateur RGPD
│   │   ├── admin/                  # Routes administration (8 fichiers)
│   │   │   ├── users.ts            # Gestion utilisateurs admin
│   │   │   ├── commandes.ts        # Gestion commandes admin
│   │   │   ├── factures.ts         # Gestion factures admin
│   │   │   ├── stats.ts            # Statistiques admin
│   │   │   ├── audit.ts            # Logs d'audit
│   │   │   ├── pages.ts            # Gestion pages CMS
│   │   │   ├── faq.ts              # Gestion FAQ admin
│   │   │   └── tarifs.ts           # Gestion tarifs admin
│   │   ├── messages.ts             # Messagerie et support
│   │   ├── notifications.ts        # Système notifications
│   │   ├── payments.ts             # Paiements Stripe
│   │   ├── paymentMethods.ts       # Moyens de paiement
│   │   ├── consultations.ts        # Réservations consultations
│   │   ├── projects.ts             # Gestion projets
│   │   ├── files.ts                # Upload/download fichiers
│   │   ├── invoice.ts              # Facturation
│   │   ├── faq.ts                  # FAQ publique
│   │   ├── pages.ts                # Pages CMS publiques
│   │   ├── stats.ts                # Statistiques publiques
│   │   ├── tarifs.ts               # Tarifs publics
│   │   ├── commandes.ts            # Commandes publiques
│   │   ├── adminStats.ts           # Statistiques admin dédiées
│   │   ├── admin.ts                # Routes admin principales
│   │   ├── dev.ts                  # Routes développement
│   │   ├── unifiedFiles.ts         # Routes fichiers unifiées
│   │   └── payments/
│   │       ├── webhook.ts          # Webhooks Stripe
│   │       └── dev-webhook-simulate.ts # Simulation webhooks dev
│   ├── services/                   # Logique métier (16 services)
│   │   ├── adminUserService.ts     # Service gestion utilisateurs
│   │   ├── adminCommandeService.ts # Service gestion commandes
│   │   ├── adminStatsService.ts    # Service statistiques admin
│   │   ├── auditService.ts         # Service logs d'audit
│   │   ├── stripeService.ts        # Service Stripe
│   │   ├── invoiceService.ts       # Service facturation PDF
│   │   ├── activationEmailService.ts # Service emails activation
│   │   ├── welcomeEmailService.ts     # Service emails bienvenue
│   │   ├── welcomeConversationService.ts # Service conversations accueil
│   │   ├── projectService.ts       # Service gestion projets
│   │   ├── userService.ts          # Service utilisateurs
│   │   ├── pageService.ts          # Service pages CMS
│   │   ├── passwordResetService.ts # Service réinitialisation mots de passe
│   │   ├── tarifStripeSync.ts      # Service synchronisation tarifs Stripe
│   │   ├── pdf.ts                  # Service génération PDF
│   │   └── demoService.ts          # Service mode démo
│   ├── events/                     # Architecture événementielle
│   │   └── eventBus.ts             # EventBus centralisé
│   ├── listeners/                  # Listeners emails automatiques
│   │   ├── adminNotificationEmailListener.ts # Emails admin
│   │   ├── userNotificationEmailListener.ts  # Emails utilisateurs
│   │   └── clientNotificationEmailListener.ts # Emails clients
│   ├── queues/                     # Queue asynchrone
│   │   └── emailQueue.ts           # Traitement emails Handlebars + SendGrid
│   ├── emails/                     # Templates HTML professionnels
│   │   └── templates/              # 25 templates (admin/users/visitors/activation)
│   ├── middleware/                 # Middlewares Express
│   │   ├── auth.ts                 # Middleware JWT
│   │   ├── requireRole.ts          # Middleware rôles (ADMIN/USER/CORRECTOR)
│   │   ├── rateLimiter.ts          # Middleware rate limiting personnalisé
│   │   └── fileUpload.ts           # Middleware upload fichiers
│   ├── utils/                      # Utilitaires
│   │   ├── token.ts                # Gestion tokens JWT
│   │   └── mailer.ts               # Service SendGrid
│   ├── validators/                 # Validation schémas
│   │   └── authValidators.ts       # Validateurs authentification
│   ├── types/                      # Types TypeScript
│   │   ├── adminStats.ts           # Types statistiques admin
│   │   └── projectFiles.ts         # Types fichiers projets
│   ├── models/                     # Modèles métier
│   │   ├── projectModel.ts         # Modèle projets
│   │   └── projectFileModel.ts     # Modèle fichiers projets
│   ├── config/                     # Configuration
│   │   └── config.ts               # Variables environnement
│   ├── deprecated-aws/             # Code AWS S3 déprécié (migration terminée)
│   │   ├── tests/                  # 7 tests AWS S3 désactivés
│   │   └── ... (services S3 legacy)
│   └── __tests__/                  # Tests (17 fichiers - 90% couverture)
│       ├── controllers/            # Tests contrôleurs (3 tests)
│       ├── services/               # Tests services (2 tests)
│       ├── integration/            # Tests intégration (2 tests)
│       ├── listeners/              # Tests listeners (2 tests)
│       ├── queues/                 # Tests queue emails (1 test)
│       └── setup.ts                # Configuration globale tests
├── prisma/
│   ├── schema.prisma               # Schéma BDD (15 modèles)
│   ├── migrations/                 # Migrations versionnées
│   └── seed.ts                     # Données de test
├── Dockerfile                      # Container production
├── package.json                    # Dépendances et scripts
└── tsconfig.json                   # Configuration TypeScript strict
```

### 🛠️ **Stack Technique**

#### **Runtime & Framework**
- **Node.js 18.20.2** : Runtime JavaScript avec support ES2022
- **Express 4.18.2** : Framework web minimaliste et performant
- **TypeScript 5.8.3** : Typage statique strict pour robustesse

#### **Base de Données & ORM**
- **MySQL 8.4+** : Base de données relationnelle avec native password
- **Prisma ORM 6.10.1** : ORM moderne avec client TypeScript généré
- **Prisma Migrate** : Gestion migrations avec rollback sécurisé

#### **Sécurité & Authentification**
- **JWT (jsonwebtoken 9.0.2)** : Tokens sécurisés 7 jours expiration
- **bcryptjs 2.4.3** : Hachage mots de passe (12 rounds)
- **Helmet 7.1.0** : Sécurisation headers HTTP
- **Express Rate Limit 7.1.5** : Protection contre attaques

#### **Validation & API**
- **Zod 3.22.4** : Validation schémas TypeScript côté serveur
- **CORS** : Configuration cross-origin sécurisée
- **Express Validator** : Validation entrées utilisateur

#### **Intégrations Externes**
- **Stripe 18.2.1** : Plateforme paiement avec webhooks
- **SendGrid 8.1.5** : Service emails transactionnels
- **PDF-lib 1.17.1** : Génération factures PDF A4
- **Multer 2.0.1** : Upload fichiers local (migration S3→Local terminée)

#### **Tests & Monitoring**
- **Vitest 3.2.4** : Framework tests unitaires ultra-rapide
- **Supertest** : Tests endpoints API
- **Winston 3.11.0** : Logging structuré avec rotation

---

## 🌐 **API Endpoints (118+ endpoints)**

### 🔐 **Authentification** (`/auth`)

```typescript
POST   /auth/register              # Inscription utilisateur
POST   /auth/login                 # Connexion JWT
GET    /auth/me                    # Profil utilisateur actuel
POST   /auth/activate              # Activation compte utilisateur
POST   /auth/request-password-reset # Demande réinitialisation mot de passe
POST   /auth/reset-password        # Réinitialisation avec token
```

**Sécurité :**
- Hachage bcrypt 12 rounds
- JWT expiration 7 jours
- Rate limiting 5 tentatives/heure
- Tokens réinitialisation SHA-256 usage unique

### 👤 **Utilisateurs RGPD** (`/users`)

```typescript
GET    /users/me                   # Profil utilisateur
PUT    /users/me                   # Modification profil
DELETE /users/me                   # Suppression compte (anonymisation)
GET    /users/me/export            # Export données RGPD (email)
```

**Conformité RGPD :**
- Suppression avec anonymisation cascade
- Export JSON/CSV envoyé par email
- Audit automatique actions sensibles
- Templates légaux professionnels

### 🌍 **Routes Publiques** (`/public`)

```typescript
POST   /public/contact             # Formulaire contact sans auth
POST   /public/free-sample         # Demande échantillon gratuit
GET    /public/faq                 # FAQ publique
GET    /public/pages/:slug         # Pages CMS publiques  
GET    /public/tarifs              # Tarifs publics (landing page)
```

**Fonctionnalités :**
- Validation stricte sans authentification
- Intégration messagerie automatique
- Emails confirmation visiteurs
- Cache intelligent pour performance

### 👨‍💼 **Administration** (`/admin/*`)

#### **Gestion Utilisateurs** (`/admin/users`)
```typescript
GET    /admin/users                # Liste utilisateurs (pagination + filtres)
GET    /admin/users/:id            # Détails utilisateur
PUT    /admin/users/:id            # Modification utilisateur admin
DELETE /admin/users/:id            # Suppression utilisateur admin
PUT    /admin/users/:id/role       # Changement rôle utilisateur
PUT    /admin/users/:id/status     # Activation/désactivation compte
GET    /admin/users/stats          # Statistiques utilisateurs
```

#### **Gestion Commandes** (`/admin/commandes`)
```typescript
GET    /admin/commandes            # Liste commandes (filtres + pagination)
GET    /admin/commandes/:id        # Détails commande complète
PUT    /admin/commandes/:id        # Modification commande
PUT    /admin/commandes/:id/status # Changement statut commande
DELETE /admin/commandes/:id        # Suppression commande
GET    /admin/commandes/stats      # Statistiques commandes
```

#### **Gestion Factures** (`/admin/factures`)
```typescript
GET    /admin/factures             # Liste factures
GET    /admin/factures/:id         # Détails facture
GET    /admin/factures/:id/pdf     # Téléchargement PDF facture
PUT    /admin/factures/:id/status  # Changement statut facture
POST   /admin/factures/:id/send    # Envoi facture par email
```

#### **Statistiques Admin** (`/admin/stats`)
```typescript
GET    /admin/stats                # Dashboard statistiques temps réel
GET    /admin/stats/monthly        # Statistiques mensuelles (12 mois)
GET    /admin/stats/revenue        # Évolution chiffre affaires
GET    /admin/stats/users          # Croissance utilisateurs
GET    /admin/stats/orders         # Performance commandes
```

#### **Audit Logs** (`/admin/audit`)
```typescript
GET    /admin/audit                # Liste logs audit (filtres avancés)
GET    /admin/audit/stats          # Statistiques logs par sévérité
GET    /admin/audit/export         # Export CSV/JSON logs filtrés
DELETE /admin/audit/cleanup        # Nettoyage logs (rétention)
```

### 💳 **Paiements Stripe** (`/payments`)

```typescript
POST   /payments/create-checkout-session  # Création session Stripe
GET    /payments/status/:sessionId        # Vérification statut paiement
POST   /payments/webhook                  # Webhooks Stripe sécurisés
GET    /payments/methods                  # Moyens de paiement utilisateur
PUT    /payments/methods/:id/default      # Définir carte par défaut
DELETE /payments/methods/:id              # Supprimer moyen paiement
```

**Fonctionnalités Avancées :**
- Sessions dynamiques sans produits pré-créés
- Webhooks signature validation
- Gestion cartes défaut automatique
- Facturation PDF automatique
- Retry logic pour webhooks échoués

### 💬 **Messagerie** (`/messages`)

```typescript
GET    /messages                   # Conversations utilisateur
GET    /messages/:conversationId   # Messages conversation
POST   /messages                   # Nouveau message
PUT    /messages/:id/read          # Marquer lu
PUT    /messages/:id/archive       # Archiver message
DELETE /messages/:id               # Suppression logique
GET    /messages/search            # Recherche messages
```

**Architecture Avancée :**
- Threading conversations par utilisateur
- Support pièces jointes multiples
- Intégration notifications temps réel
- Pagination optimisée avec cache

### 🔔 **Notifications** (`/notifications`)

```typescript
GET    /notifications              # Notifications utilisateur
PUT    /notifications/:id/read     # Marquer notification lue
PUT    /notifications/read-all     # Marquer toutes lues
DELETE /notifications/:id          # Supprimer notification
GET    /notifications/unread-count # Compteur non lues (polling)
POST   /notifications/admin        # Création notification admin
```

**Système Centralisé :**
- Polling 15 secondes interface
- Double notification (clochette + email)
- Templates HTML par type événement
- Queue asynchrone pour emails

### 📞 **Consultations** (`/consultations`)

```typescript
POST   /consultations/book         # Réservation consultation (public)
GET    /consultations/available-slots # Créneaux disponibles
GET    /consultations/requests     # Demandes admin
PUT    /consultations/requests/:id # Traitement demande admin
```

**Workflow Automatisé :**
- Modal simplifiée landing + espace client
- Intégration messagerie admin automatique
- Créneaux 7 jours ouvrés validation
- Notifications temps réel équipe

### 📊 **Projets & Fichiers** (`/projects`, `/files`, `/unifiedFiles`)

```typescript
GET    /projects                   # Projets utilisateur
GET    /projects/:id/files         # Fichiers projet
POST   /files/upload               # Upload fichier local (migration S3→Local)
GET    /files/:id/download         # Téléchargement sécurisé
DELETE /files/:id                  # Suppression fichier
POST   /unifiedFiles/upload        # Upload unifié avec métadonnées
GET    /unifiedFiles/:id           # Récupération fichier unifié
```

**Gestion Stockage Local :**
- Upload local dans `/uploads/` avec Multer
- Validation ownership fichiers
- Progression temps réel frontend
- Audit trail uploads/downloads
- Migration S3→Local terminée (juillet 2025)

---

## 🔒 **Sécurité & Conformité**

### 🛡️ **Authentification & Autorisation**

#### **JWT Sécurisé**
```typescript
// Configuration JWT
{
  expiresIn: "7d",           // Expiration 7 jours
  algorithm: "HS256",        // Algorithme sécurisé
  issuer: "staka-livres",    // Émetteur validé
  audience: "staka-users"    // Audience contrôlée
}
```

#### **Rôles & Permissions**
```typescript
enum Role {
  USER      = "USER",      // Utilisateur standard
  ADMIN     = "ADMIN",     // Administrateur complet
  CORRECTOR = "CORRECTOR"  // Correcteur spécialisé
}

// Middleware protection
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

### 🔐 **Protection Avancée**

#### **Rate Limiting**
```typescript
// Protection par endpoint
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 heure
  max: 5,                    // 5 tentatives max
  message: 'Trop de tentatives de connexion'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes  
  max: 100,                  // 100 requêtes max
  standardHeaders: true,
  legacyHeaders: false
});
```

#### **Validation Stricte**
```typescript
// Schema Zod exemple
const createUserSchema = z.object({
  prenom: z.string().min(2).max(50),
  nom: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string()
    .min(12, "12 caractères minimum")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Majuscule + minuscule + chiffre requis")
});
```

### 🏛️ **Conformité RGPD**

#### **Droits Utilisateurs**
```typescript
// Suppression compte avec anonymisation
const deleteUserAccount = async (userId: string) => {
  await prisma.$transaction([
    // Anonymisation données personnelles
    prisma.user.update({
      where: { id: userId },
      data: {
        prenom: 'Utilisateur',
        nom: 'Supprimé',
        email: `deleted-${Date.now()}@example.com`,
        isActive: false
      }
    }),
    // Conservation données facturations (obligation légale)
    // Suppression cascade messages, notifications, etc.
  ]);
  
  // Audit automatique
  await auditService.log(
    adminEmail,
    'USER_DELETED',
    'user',
    userId,
    'Suppression compte utilisateur RGPD'
  );
};
```

#### **Export Données**
```typescript
// Export complet données utilisateur
const exportUserData = async (userId: string) => {
  const userData = {
    profile: await prisma.user.findUnique({ where: { id: userId } }),
    commandes: await prisma.commande.findMany({ where: { userId } }),
    messages: await prisma.message.findMany({ where: { senderId: userId } }),
    notifications: await prisma.notification.findMany({ where: { userId } }),
    factures: await prisma.invoice.findMany({ where: { commande: { userId } } })
  };
  
  // Envoi par email sécurisé
  await sendExportEmail(user.email, userData);
};
```

### 📋 **Audit Logs Enterprise**

#### **Traçabilité Complète avec Actions Standardisées**
```typescript
// 40+ Actions d'audit standardisées
export const AUDIT_ACTIONS = {
  // Authentification (8 actions)
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
  PASSWORD_RESET_FAILED: 'PASSWORD_RESET_FAILED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Gestion utilisateurs (7 actions)
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_DATA_EXPORTED: 'USER_DATA_EXPORTED',
  USER_MESSAGE_SUPPORT_EMAIL_SENT: 'USER_MESSAGE_SUPPORT_EMAIL_SENT',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  
  // Gestion commandes/factures/paiements (12 actions)
  COMMAND_CREATED: 'COMMAND_CREATED',
  COMMAND_UPDATED: 'COMMAND_UPDATED',
  COMMAND_DELETED: 'COMMAND_DELETED',
  COMMAND_STATUS_CHANGED: 'COMMAND_STATUS_CHANGED',
  INVOICE_ACCESSED: 'INVOICE_ACCESSED',
  INVOICE_DOWNLOADED: 'INVOICE_DOWNLOADED',
  INVOICE_SENT: 'INVOICE_SENT',
  INVOICE_CANCELLED: 'INVOICE_CANCELLED',
  PAYMENT_SESSION_CREATED: 'PAYMENT_SESSION_CREATED',
  PAYMENT_STATUS_CHECKED: 'PAYMENT_STATUS_CHECKED',
  PAYMENT_WEBHOOK_RECEIVED: 'PAYMENT_WEBHOOK_RECEIVED',
  
  // Sécurité (4 actions)
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  SECURITY_BREACH: 'SECURITY_BREACH'
};

// Niveaux de sévérité avec icônes
enum AuditSeverity {
  LOW      = "LOW",      // 🔷 Actions routinières
  MEDIUM   = "MEDIUM",   // 🔶 Actions importantes
  HIGH     = "HIGH",     // 🔴 Actions sensibles
  CRITICAL = "CRITICAL"  // 🚨 Actions critiques sécurité
}

// Types de cibles
enum AuditTargetType {
  user     = "user",     // Actions utilisateurs
  command  = "command",  // Actions commandes
  invoice  = "invoice",  // Actions factures
  payment  = "payment",  // Actions paiements
  file     = "file",     // Actions fichiers
  auth     = "auth",     // Actions authentification
  system   = "system"    // Actions système
}

// Service centralisé avec méthodes spécialisées
await AuditService.logAdminAction(
  adminEmail,
  AUDIT_ACTIONS.USER_ROLE_CHANGED,
  'user',
  targetUserId,
  { oldRole, newRole, targetUserId },
  req.ip,
  req.get('user-agent'),
  'HIGH'
);

// Logs spécialisés avec métadonnées enrichies
await AuditService.logFileAccess(userEmail, fileId, 'download', req.ip);
await AuditService.logInvoiceAccess(userEmail, invoiceId, 'access', req.ip);
await AuditService.logPaymentOperation(userEmail, sessionId, 'create', amount);
await AuditService.logSecurityEvent(email, 'UNAUTHORIZED_ACCESS', details);
```

#### **Middleware d'Audit Automatique**
```typescript
// Middleware pour audit automatique des routes sensibles
export const auditMiddleware = (action: string, targetType: AuditTargetType, severity = 'MEDIUM') => {
  return async (req: any, res: any, next: any) => {
    const userEmail = req.user?.email || 'unknown';
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    const targetId = req.params.id || req.params.sessionId;
    
    await AuditService.logAdminAction(
      userEmail, action, targetType, targetId,
      {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body ? Object.keys(req.body) : undefined
      },
      ipAddress, userAgent, severity
    );
    
    next();
  };
};

// Usage sur routes sensibles
router.delete('/admin/users/:id', 
  requireRole('ADMIN'),
  auditMiddleware('USER_DELETED', 'user', 'HIGH'),
  adminUserController.deleteUser
);
```

---

## 💳 **Système de Paiement Stripe**

### 🏗️ **Architecture Paiement**

#### **Sessions Dynamiques**
```typescript
// Création session sans produits pré-créés
const createCheckoutSession = async (commandeId: string, userId: string) => {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { user: true }
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: commande.user.email,
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: commande.titre,
          description: commande.description
        },
        unit_amount: commande.amount * 100  // Centimes
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/payment/cancel`,
    metadata: {
      commandeId,
      userId
    }
  });

  // Sauvegarde session ID
  await prisma.commande.update({
    where: { id: commandeId },
    data: { stripeSessionId: session.id }
  });

  return session;
};
```

#### **Webhooks Sécurisés**
```typescript
// Traitement webhooks avec signature validation
const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    // Validation signature Stripe
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
```

### 💰 **Facturation Automatique**

#### **Génération PDF**
```typescript
// Service génération facture PDF A4
const generateInvoicePDF = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { commande: { include: { user: true } } }
  });

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  // En-tête avec logo
  doc.image('assets/logo.png', 50, 45, { width: 100 });
  doc.fontSize(16).text('FACTURE', 400, 50);
  doc.fontSize(12).text(`N° ${invoice.number}`, 400, 70);
  
  // Informations client
  doc.text('Facturé à:', 50, 150);
  doc.text(`${invoice.commande.user.prenom} ${invoice.commande.user.nom}`, 50, 170);
  doc.text(invoice.commande.user.email, 50, 190);
  
  // Tableau détaillé
  const tableTop = 250;
  doc.text('Description', 50, tableTop);
  doc.text('Montant HT', 300, tableTop);
  doc.text('TVA 20%', 400, tableTop);
  doc.text('Total TTC', 450, tableTop);
  
  // Ligne commande
  doc.text(invoice.commande.titre, 50, tableTop + 30);
  doc.text(`${(invoice.amount - invoice.taxAmount).toFixed(2)} €`, 300, tableTop + 30);
  doc.text(`${invoice.taxAmount.toFixed(2)} €`, 400, tableTop + 30);
  doc.text(`${invoice.amount.toFixed(2)} €`, 450, tableTop + 30);
  
  // Upload S3 sécurisé
  const buffer = await streamToBuffer(doc);
  const key = `invoices/${invoice.id}/${invoice.number}.pdf`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
    ACL: 'private',  // Accès privé uniquement
    Metadata: {
      invoiceId: invoice.id,
      userId: invoice.commande.userId,
      generatedAt: new Date().toISOString()
    }
  }));

  // Mise à jour URL facture
  const pdfUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { pdfUrl, status: 'GENERATED' }
  });

  return pdfUrl;
};
```

---

## 📧 **Système d'Emails Centralisé**

### 🏗️ **Architecture Événementielle**

#### **EventBus & Listeners**
```typescript
// EventBus centralisé
import { EventEmitter } from 'events';

class AppEventBus extends EventEmitter {
  private static instance: AppEventBus;
  
  static getInstance(): AppEventBus {
    if (!AppEventBus.instance) {
      AppEventBus.instance = new AppEventBus();
    }
    return AppEventBus.instance;
  }
}

export const eventBus = AppEventBus.getInstance();

// Listener admin automatique
eventBus.on('admin.notification.created', async (notification) => {
  const template = `admin-${notification.type.toLowerCase()}.hbs`;
  
  await emailQueue.add('send-admin-email', {
    to: process.env.ADMIN_EMAIL,
    template,
    data: {
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      priority: notification.priority,
      createdAt: notification.createdAt
    }
  });
});
```

#### **Queue Emails Asynchrone**
```typescript
// Queue processing avec Handlebars + SendGrid
const emailQueue = {
  async add(jobType: string, data: any) {
    try {
      const { to, template, data: templateData } = data;
      
      // Compilation template Handlebars
      const templatePath = path.join(__dirname, 'emails/templates', template);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = Handlebars.compile(templateSource);
      const html = compiledTemplate(templateData);
      
      // Envoi via SendGrid
      await sgMail.send({
        to,
        from: {
          email: process.env.FROM_EMAIL!,
          name: process.env.FROM_NAME || 'Staka Livres'
        },
        subject: templateData.title || 'Notification Staka Livres',
        html,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      });
      
      console.log(`✅ Email envoyé: ${template} → ${to}`);
    } catch (error) {
      console.error(`❌ Erreur envoi email:`, error);
      // Retry logic ici
    }
  }
};
```

### 📬 **Templates Professionnels**

#### **22 Templates HTML Responsive**
```handlebars
<!-- admin-message.hbs - Exemple template admin -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header avec logo -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb;">📚 Staka Livres</h1>
      <h2 style="color: #1f2937;">{{title}}</h2>
    </div>
    
    <!-- Contenu principal -->
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 16px;">{{message}}</p>
      
      {{#if actionUrl}}
      <div style="text-align: center; margin-top: 20px;">
        <a href="{{actionUrl}}" 
           style="display: inline-block; background: #2563eb; color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                  font-weight: bold;">
          Voir les détails
        </a>
      </div>
      {{/if}}
    </div>
    
    <!-- Métadonnées -->
    <div style="font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px;">
      <p><strong>Priorité:</strong> {{priority}}</p>
      <p><strong>Date:</strong> {{formatDate createdAt}}</p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; 
                border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      <p>Staka Livres - Plateforme de correction professionnelle</p>
      <p>Cet email a été généré automatiquement par le système.</p>
    </div>
  </div>
</body>
</html>
```

---

## ⚡ **Architecture Événementielle & Services Avancés**

### 🎯 **EventBus Centralisé**

Le backend utilise une architecture événementielle moderne pour découpler les services et automatiser les workflows :

```typescript
// EventBus singleton pattern
import { EventEmitter } from 'events';

class AppEventBus extends EventEmitter {
  private static instance: AppEventBus;
  
  static getInstance(): AppEventBus {
    if (!AppEventBus.instance) {
      AppEventBus.instance = new AppEventBus();
    }
    return AppEventBus.instance;
  }
}

export const eventBus = AppEventBus.getInstance();

// Événements disponibles
eventBus.emit('admin.notification.created', notification);
eventBus.emit('user.notification.created', notification);
eventBus.emit('payment.completed', paymentData);
eventBus.emit('invoice.generated', invoiceData);
```

### 🎧 **Listeners Automatiques**

#### **Admin Notification Listener**
```typescript
// adminNotificationEmailListener.ts
eventBus.on('admin.notification.created', async (notification) => {
  const template = `admin-${notification.type.toLowerCase()}.hbs`;
  
  await emailQueue.add('send-admin-email', {
    to: process.env.ADMIN_EMAIL,
    template,
    data: {
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      actionUrl: notification.actionUrl
    }
  });
});
```

#### **User Notification Listener**
```typescript
// userNotificationEmailListener.ts
eventBus.on('user.notification.created', async (notification) => {
  const template = `${notification.type.toLowerCase()}-user.hbs`;
  
  await emailQueue.add('send-user-email', {
    to: notification.user.email,
    template,
    data: notification
  });
});
```

### 📬 **Queue Emails Asynchrone**

Le système de queue traite les emails de manière asynchrone pour optimiser les performances :

```typescript
// emailQueue.ts - Traitement intelligent des emails
export const emailQueue = {
  async add(jobType: string, data: EmailJobData) {
    try {
      const { to, template, data: templateData } = data;
      
      // Compilation Handlebars avec helpers personnalisés
      const compiledTemplate = await compileTemplate(template, {
        formatDate: (date: Date) => new Intl.DateTimeFormat('fr-FR').format(date),
        formatPrice: (price: number) => `${price.toFixed(2)} €`,
        capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
      });
      
      const html = compiledTemplate(templateData);
      
      // Envoi via SendGrid avec retry logic
      await sendEmailWithRetry({
        to,
        from: {
          email: process.env.FROM_EMAIL!,
          name: process.env.FROM_NAME || 'Staka Livres'
        },
        subject: templateData.title || 'Notification Staka Livres',
        html,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      });
      
      console.log(`✅ Email envoyé: ${template} → ${to}`);
    } catch (error) {
      console.error(`❌ Erreur envoi email:`, error);
      // Retry logic avec backoff exponentiel
      await scheduleRetry(jobType, data, error);
    }
  }
};
```

### 🔧 **Services Métier Avancés**

#### **AuditService - Traçabilité Enterprise**
```typescript
// auditService.ts - Logs d'audit automatiques
export const auditService = {
  async log(
    userEmail: string,
    action: string,
    targetType: AuditTargetType,
    targetId: string,
    description: string,
    severity: AuditSeverity = 'MEDIUM',
    metadata?: Record<string, any>
  ) {
    await prisma.auditLog.create({
      data: {
        userEmail,
        action,
        targetType,
        targetId,
        description,
        severity,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: new Date()
      }
    });
    
    // Auto-création notification admin pour actions critiques
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      eventBus.emit('admin.notification.created', {
        title: `Action sensible détectée`,
        message: `${userEmail} a effectué: ${action}`,
        type: 'WARNING',
        priority: 'HAUTE',
        actionUrl: `/admin/audit?filter=${targetId}`
      });
    }
  }
};
```

#### **InvoiceService - Facturation PDF**
```typescript
// invoiceService.ts - Génération factures avec S3
export const invoiceService = {
  async generatePDF(invoiceId: string): Promise<string> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { commande: { include: { user: true } } }
    });

    // Génération PDF avec PDFKit
    const pdfBuffer = await createInvoicePDF(invoice);
    
    // Upload sécurisé vers S3
    const s3Key = `invoices/${invoice.id}/${invoice.number}.pdf`;
    const uploadResult = await s3InvoiceService.uploadPDF(s3Key, pdfBuffer);
    
    // Mise à jour URL dans BDD
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { 
        pdfUrl: uploadResult.url,
        status: 'GENERATED' 
      }
    });
    
    // Audit automatique
    await auditService.log(
      'system',
      'INVOICE_PDF_GENERATED',
      'invoice',
      invoiceId,
      `Facture PDF générée: ${invoice.number}`
    );
    
    return uploadResult.url;
  }
};
```

#### **AdminStatsService - Analytiques Temps Réel**
```typescript
// adminStatsService.ts - Dashboard metrics
export const adminStatsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    // Requêtes optimisées avec agrégations Prisma
    const [
      totalUsers,
      activeOrders,
      monthlyRevenue,
      pendingMessages
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.commande.count({ where: { status: 'IN_PROGRESS' } }),
      getMonthlyRevenue(),
      prisma.message.count({ where: { isRead: false, isAdminMessage: false } })
    ]);
    
    return {
      users: { total: totalUsers, growth: await getUserGrowth() },
      orders: { active: activeOrders, completed: await getCompletedOrders() },
      revenue: { monthly: monthlyRevenue, trend: await getRevenueTrend() },
      messages: { pending: pendingMessages, response_time: await getAvgResponseTime() }
    };
  }
};
```

### 🔄 **Avantages Architecture Événementielle**

1. **Découplage** : Services indépendants communiquant via événements
2. **Extensibilité** : Ajout facile de nouveaux listeners sans modifier l'existant
3. **Fiabilité** : Queue asynchrone avec retry logic et gestion d'erreurs
4. **Monitoring** : Traçabilité complète des événements et actions
5. **Performance** : Traitement asynchrone des tâches non-critiques
6. **Maintenabilité** : Code modulaire et testable en isolation

---

## 🧪 **Tests & Qualité**

### 📊 **Coverage & Métriques**

```bash
# Tests backend complets
npm run test:ci          # Tests unitaires (87% coverage)
npm run test:coverage    # Rapport détaillé Istanbul
npm run test:watch       # Mode développement
npm run test:s3         # Tests S3 conditionnels

# Résultats actuels (30 juillet 2025)
Files        : 17 (tests source)
Statements   : 90.0%
Branches     : 87.5%  
Functions    : 92.1%
Lines        : 90.3%
```

### 🧩 **Structure Tests**

#### **Tests Unitaires** (`tests/unit/` et `src/__tests__/`)
```typescript
// Exemple test contrôleur avec mocks
describe('AuthController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Prisma mocks
    mockPrismaClient.user.findUnique.mockReset();
  });

  it('should login user with valid credentials', async () => {
    // Arrange
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'USER'
    };
    mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

    // Act
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

#### **Tests Intégration** (`tests/integration/` et `src/__tests__/integration/`)
```typescript
// Tests endpoints avec vraie base de données
describe('Admin Users Endpoints Integration', () => {
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Setup admin token
    const adminUser = await createTestAdmin();
    adminToken = generateTestToken(adminUser);
  });

  it('should create user with admin privileges', async () => {
    const userData = {
      prenom: 'Test',
      nom: 'User',
      email: 'test@example.com',
      password: 'SecurePass123!'
    };

    const response = await request(app)
      .post('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(userData.email);
    
    testUserId = response.body.user.id;
  });
});
```

### 🔧 **Tests S3 Conditionnels**

```typescript
// Helper pour tests S3 optionnels
import { hasValidAwsCreds, skipIfNoAws } from '../test-helpers/utils';

describe('S3 Invoice Service', () => {
  skipIfNoAws('should upload invoice PDF to S3', async () => {
    const invoiceId = 'test-invoice-123';
    const pdfBuffer = Buffer.from('test pdf content');
    
    const result = await s3InvoiceService.uploadPDF(invoiceId, pdfBuffer);
    
    expect(result.url).toContain('amazonaws.com');
    expect(result.key).toContain('invoices/');
  });

  // Ce test run toujours (avec mock)
  it('should generate PDF content correctly', async () => {
    const mockInvoice = { /* ... */ };
    const pdfContent = await generateInvoicePDF(mockInvoice);
    
    expect(pdfContent).toBeInstanceOf(Buffer);
    expect(pdfContent.length).toBeGreaterThan(0);
  });
});
```

---

## 🐳 **Déploiement OVH Cloud**

### 🏗️ **Architecture Production**

#### **Infrastructure OVH**
```bash
# Serveur OVH Cloud
- Instance: VPS SSD 3
- CPU: 2 vCores
- RAM: 4 GB
- Stockage: 40 GB SSD
- Bande passante: 250 Mbps
- OS: Ubuntu 22.04 LTS

# Base de données
- MySQL 8.4 Community
- Configuration: my.cnf optimisée
- Backup quotidien automatique
- Monitoring performance
```

#### **Docker Production**
```dockerfile
# Dockerfile backend optimisé
FROM node:18.20.2-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18.20.2-alpine AS production

RUN apk add --no-cache openssl1.1-compat

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
```

#### **Docker Compose Production**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    restart: unless-stopped
    depends_on:
      - db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: mysql:8.4
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=stakalivres
      - MYSQL_USER=staka
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql.cnf:/etc/mysql/conf.d/custom.cnf
    ports:
      - "3306:3306"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mysql_data:
```

### 📡 **Déploiement SSH**

#### **Script Déploiement Automatisé**
```bash
#!/bin/bash
# deploy.sh - Script déploiement OVH

set -e

# Variables
SERVER="your-server.ovh.net"
USER="ubuntu"
APP_DIR="/opt/staka-livres"

echo "🚀 Déploiement Staka Livres sur OVH..."

# 1. Upload code via rsync
echo "📤 Upload des fichiers..."
rsync -avz --exclude node_modules --exclude .git . ${USER}@${SERVER}:${APP_DIR}/

# 2. Commandes sur serveur distant
ssh ${USER}@${SERVER} << 'REMOTE_COMMANDS'
cd /opt/staka-livres

# Build et restart services
echo "🔨 Build de l'application..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "🔄 Restart des services..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Vérification santé
echo "🏥 Vérification santé des services..."
sleep 10
curl -f http://localhost:3000/health || exit 1

echo "✅ Déploiement terminé avec succès!"
REMOTE_COMMANDS

echo "🎉 Application déployée sur https://your-domain.com"
```

#### **Configuration Nginx**
```nginx
# nginx.conf - Proxy reverse optimisé
upstream backend {
    server backend:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Proxy vers backend
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend statique
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logs
    access_log /var/log/nginx/staka_access.log;
    error_log /var/log/nginx/staka_error.log;
}
```

### 📊 **Monitoring Production**

#### **Health Checks**
```typescript
// Endpoint santé complet
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'checking...',
      stripe: 'checking...',
      sendgrid: 'checking...',
      s3: 'checking...'
    }
  };

  try {
    // Test base de données
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'ok';
  } catch (error) {
    health.services.database = 'error';
    health.status = 'error';
  }

  // Test autres services...
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

#### **Logs Structurés**
```typescript
// Configuration Winston production
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'staka-backend' },
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/staka/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '/var/log/staka/combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

---

## 🛠️ **Scripts & Commandes**

### 📦 **Scripts NPM**

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "dev:watch": "nodemon src/server.ts",
    "build": "docker compose run --rm app npm run build:ci",
    "build:ci": "tsc -p tsconfig.build.json",
    "build:secrets": "tsc -p tsconfig.scripts.json",
    "build:scripts": "tsc -p tsconfig.scripts.json",
    "start": "node dist/server.js",
    "test": "docker compose run --rm app npm run test:ci",
    "test:ci": "vitest run --coverage",
    "test:s3": "docker compose run --rm -e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} app npm run test:s3:ci",
    "test:s3:ci": "vitest run --testPathPattern='integration/s3'",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "audit:docker": "docker compose run --rm app npm audit --production",
    "prune:prod": "npm prune --production",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "prisma:seed": "ts-node prisma/seed.ts",
    "stripe:sync-all": "ts-node scripts/sync-tarifs-stripe.ts",
    "stripe:sync-dry": "ts-node scripts/sync-tarifs-stripe.ts --dry-run",
    "stripe:sync-verbose": "ts-node scripts/sync-tarifs-stripe.ts --verbose",
    "secrets:generate": "npm run build:secrets && node dist/generateSecrets.js",
    "secrets:help": "npm run build:secrets && node dist/generateSecrets.js --help",
    "secrets:dry-run": "npm run build:secrets && node dist/generateSecrets.js --dry-run"
  }
}
```

### 🗄️ **Commandes Base de Données**

```bash
# Migrations Prisma
docker compose run --rm app npm run db:migrate
docker compose run --rm app npm run db:generate

# Seed données test
docker compose run --rm app npm run prisma:seed

# Prisma Studio (interface graphique)
npx prisma studio

# Reset complet base (ATTENTION: supprime toutes les données)
npx prisma migrate reset

# Introspection base existante
npx prisma db pull
```

### 💳 **Synchronisation Stripe**

```bash
# Synchronisation complète tarifs → Stripe
docker compose run --rm app npm run stripe:sync-all

# Mode dry-run (simulation)
docker compose run --rm app npm run stripe:sync-dry

# Mode verbose (logs détaillés)
docker compose run --rm app npm run stripe:sync-verbose

# Vérification webhooks Stripe
stripe listen --forward-to localhost:3000/payments/webhook
```

### 🔐 **Gestion Secrets Production**

```bash
# Génération secrets production automatisée
docker compose run --rm app npm run secrets:generate

# Mode aide (voir options disponibles)
docker compose run --rm app npm run secrets:help

# Mode dry-run (simulation génération)
docker compose run --rm app npm run secrets:dry-run

# Build scripts utilitaires
docker compose run --rm app npm run build:secrets
docker compose run --rm app npm run build:scripts
```

---

## 🔍 **Troubleshooting**

### 🐛 **Problèmes Courants**

#### **Erreurs Base de Données**
```bash
# Error: Can't reach database server
- Vérifier docker compose up db
- Vérifier variables DATABASE_URL
- Vérifier réseau Docker

# Error: Migration failed
- docker compose down
- docker volume rm staka-livres_mysql-data
- docker compose up -d db
- npm run db:migrate
```

#### **Erreurs Stripe**
```bash
# Error: Invalid webhook signature
- Vérifier STRIPE_WEBHOOK_SECRET
- Vérifier endpoint webhook configuré
- Tester avec stripe CLI : stripe listen

# Error: Payment method not found
- Vérifier customer Stripe exists
- Vérifier payment method attached
- Check logs Stripe Dashboard
```

#### **Erreurs S3/AWS**
```bash
# Error: Access denied
- Vérifier AWS credentials
- Vérifier bucket policy
- Vérifier région AWS_REGION

# Tests S3 skippés
- Normal si AWS_ACCESS_KEY_ID commence par "test-"
- Pour tests réels: export AWS_ACCESS_KEY_ID=real_key
```

### 📊 **Monitoring & Debug**

#### **Logs Utiles**
```bash
# Logs application temps réel
docker compose logs -f backend

# Logs base de données
docker compose logs -f db

# Logs spécifiques
docker compose logs backend | grep ERROR
docker compose logs backend | grep STRIPE

# Stats containers
docker stats
```

#### **Performance**
```bash
# Métriques Node.js
GET /health                    # Health check complet
GET /metrics                   # Métriques Prometheus (si activé)

# Analyse base de données
SHOW PROCESSLIST;              # Requêtes en cours
EXPLAIN SELECT ...;            # Plan exécution requête
SHOW INDEX FROM table_name;    # Index disponibles
```

---

## 📚 **Documentation Complémentaire**

### 🏗️ **Guides Techniques**
- **[Guide Base de Données](Base-de-donnees-guide.md)** : Schéma complet 15 modèles Prisma
- **[Tests Complets](TESTS_COMPLETE_GUIDE.md)** : Architecture tests 3 niveaux
- **[Guide Admin](ADMIN_GUIDE_UNIFIED.md)** : Espace administration complet
- **[Guide Webhooks](WEBHOOK_IMPLEMENTATION.md)** : Intégration Stripe avancée

### 🔧 **Ressources Externes**
- **[Prisma Documentation](https://prisma.io/docs)** : Guide ORM complet
- **[Stripe API Reference](https://stripe.com/docs/api)** : Documentation paiements
- **[Express.js Guide](https://expressjs.com/)** : Framework web Node.js
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** : Typage statique

---

## 👨‍💻 **Développement & Maintenance**

### 🔄 **Workflow Développement**

1. **Développement local**
   ```bash
   npm run install:all
   npm run docker:dev
   npm run dev:watch  # Hot reload
   ```

2. **Tests avant commit**
   ```bash
   npm run test:ci          # Backend
   cd frontend && npm run test:unit  # Frontend
   npm run lint
   ```

3. **Déploiement production**
   ```bash
   ./deploy.sh              # Script automatisé
   # Vérification post-déploiement
   curl -f https://your-domain.com/api/health
   ```

### 📝 **Standards Code**

- **TypeScript strict** : `noImplicitAny`, `strictNullChecks`
- **ESLint** : Configuration Airbnb + customizations
- **Prettier** : Formatage automatique
- **Conventional Commits** : Messages commit structurés
- **Tests obligatoires** : Coverage minimum 80%

### 🚀 **Performance**

- **Prisma optimisé** : Requêtes avec `include` sélectif
- **Cache Redis** : Sessions et queries fréquentes
- **CDN CloudFlare** : Assets statiques et API cache
- **Connection pooling** : MySQL optimisé
- **Monitoring APM** : New Relic/DataDog integration

---

---

## 🎉 **Résumé de l'Évolution 2025**

### 📈 **Nouvelles Fonctionnalités Production (30 Juillet 2025)**

1. **Architecture Événementielle Complète**
   - EventBus centralisé singleton avec émission d'événements
   - 2 listeners automatiques (admin + utilisateurs) pour emails
   - Queue asynchrone avec retry logic et gestion d'erreurs avancée

2. **Système d'Audit Enterprise**
   - 40+ actions d'audit standardisées avec constantes typées
   - 4 niveaux de sévérité avec icônes visuelles (🔷🔶🔴🚨)
   - Middleware automatique pour routes sensibles
   - Logs enrichis avec IP, User-Agent et métadonnées

3. **Templates Emails Professionnels**
   - 22 templates HTML responsive Handlebars
   - Helpers personnalisés (formatDate, formatPrice, capitalize)
   - Templates admin (9) + utilisateurs (9) + visiteurs (4)
   - Tracking ouvertures et clics intégré SendGrid

4. **Services Métier Avancés**
   - AuditService avec méthodes spécialisées par domaine
   - AdminStatsService avec agrégations Prisma optimisées
   - InvoiceService avec génération PDF et upload S3
   - PasswordResetService avec logs d'audit intégrés

5. **Scripts de Production Optimisés**
   - Scripts secrets automatisés (generate, dry-run, help)
   - Build scripts séparés (ci, secrets, scripts)
   - Tests S3 conditionnels avec skip intelligent
   - Synchronisation Stripe avec mode verbose

6. **Migration S3→Local Terminée (Juillet 2025)**
   - Variables AWS supprimées du `.env.example`
   - Upload local avec Multer dans `/uploads/`
   - Service `unifiedFileController` pour stockage unifié
   - Tests S3 désactivés avec helper `skipIfNoAws`
   - Code AWS déplacé dans `/deprecated-aws/`

7. **Système d'Activation Utilisateur**
   - `activationController.ts` pour activation comptes
   - `activationEmailService.ts` pour emails activation
   - Templates emails activation dédiés
   - Workflow activation avec tokens sécurisés

### 🔢 **Métriques Finales (30 Juillet 2025)**

- **API** : 118+ endpoints sur 30+ fichiers routes
- **Contrôleurs** : 26 contrôleurs spécialisés (+3 nouveaux)
- **Tests** : 17 fichiers tests source (90% couverture)
- **Services** : 16 services métier (+2 nouveaux)
- **Templates** : 25 templates emails HTML (+3 activation)
- **Scripts** : 29 scripts npm optimisés (+9 secrets/build)
- **Audit** : 40+ actions standardisées
- **Migration** : S3→Local terminée (juillet 2025)

---

**✨ Développé par Christophe Mostefaoui - Version Production 30 Juillet 2025**  
**🌐 Site Web :** https://livrestaka.fr/ | **👨‍💻 Développeur :** https://christophe-dev-freelance.fr/ | **📧 Contact :** contact@staka.fr  
**🏗️ Architecture enterprise-grade déployée sur VPS OVH**  
**🚀 API REST 118+ endpoints production-ready avec 90% coverage tests**  
**📧 Système notifications centralisé avec 25 templates email professionnels**  
**🎯 Architecture événementielle avec EventBus, listeners et queues asynchrones**  
**🔍 Système d'audit enterprise avec 40+ actions standardisées et middleware automatique**  
**📦 Migration S3→Local terminée - Stockage fichiers unifié optimisé**