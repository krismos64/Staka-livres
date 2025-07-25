# 🚀 Backend API Staka Livres - Guide Technique Complet

![Node.js](https://img.shields.io/badge/Node.js-18.20.2-green)
![Express](https://img.shields.io/badge/Express-4.18.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.10.1-purple)
![Stripe](https://img.shields.io/badge/Stripe-18.2.1-purple)
![MySQL](https://img.shields.io/badge/MySQL-8.4-orange)
![Tests](https://img.shields.io/badge/Tests-87%25%20Coverage-brightgreen)
![Production](https://img.shields.io/badge/Status-Production%20Ready-green)
![OVH](https://img.shields.io/badge/Deployed-OVH%20Cloud-blue)

**📅 Mis à jour le 25 juillet 2025 par Christophe Mostefaoui**

---

## 📋 **Vue d'ensemble**

Backend REST API pour **Staka Livres**, plateforme professionnelle de correction de manuscrits déployée en production sur **OVH Cloud** via SSH et Docker. Architecture enterprise-grade avec TypeScript, Express, Prisma ORM et intégrations Stripe avancées.

### 🏆 **Métriques Production (25 Juillet 2025)**

| Composant | Détail | Statut |
|-----------|--------|---------|
| **🌐 Endpoints API** | 139+ endpoints répartis sur 27 fichiers routes | ✅ Production |
| **📁 Contrôleurs** | 23 contrôleurs spécialisés | ✅ Optimisés |
| **🧪 Tests** | 16 fichiers tests (87% couverture) | ✅ Robustes |
| **🗄️ Base de données** | 15 modèles Prisma avec 35+ relations | ✅ Optimisée |
| **🔒 Sécurité** | JWT + RGPD + Audit logs + Rate limiting | ✅ Conforme |
| **📧 Emails** | 18 templates HTML + queue asynchrone | ✅ Production |
| **💳 Paiements** | Stripe webhooks + facturation PDF | ✅ Opérationnel |
| **🐳 Déploiement** | OVH Cloud + Docker + SSH | ✅ Production |

---

## 🏗️ **Architecture Technique**

### 📁 **Structure Backend**

```
backend/
├── src/
│   ├── server.ts                   # Point d'entrée principal
│   ├── app.ts                      # Configuration Express avec middlewares
│   ├── controllers/                # 23 contrôleurs spécialisés
│   │   ├── authController.ts       # Authentification JWT
│   │   ├── adminController.ts      # Administration générale
│   │   ├── adminUserController.ts  # Gestion utilisateurs admin
│   │   ├── adminCommandeController.ts # Gestion commandes admin
│   │   ├── adminFactureController.ts # Gestion factures admin
│   │   ├── adminStatsController.ts # Statistiques admin temps réel
│   │   ├── adminAuditController.ts # Logs d'audit sécurisés
│   │   ├── notificationsController.ts # Notifications temps réel
│   │   ├── messagesController.ts   # Messagerie avec threading
│   │   ├── paymentController.ts    # Paiements Stripe
│   │   ├── paymentMethodsController.ts # Moyens de paiement
│   │   ├── consultationController.ts # Réservations consultations
│   │   ├── publicController.ts     # Formulaires publics
│   │   ├── userController.ts       # Gestion utilisateur RGPD
│   │   └── ... (9 autres contrôleurs)
│   ├── routes/                     # 27 fichiers routes REST
│   │   ├── auth.ts                 # Routes authentification
│   │   ├── public.ts               # Routes publiques (contact, échantillons)
│   │   ├── users.ts                # Routes utilisateur RGPD
│   │   ├── admin/                  # Routes administration (7 fichiers)
│   │   │   ├── users.ts            # Gestion utilisateurs admin
│   │   │   ├── commandes.ts        # Gestion commandes admin
│   │   │   ├── factures.ts         # Gestion factures admin
│   │   │   ├── stats.ts            # Statistiques admin
│   │   │   ├── audit.ts            # Logs d'audit
│   │   │   └── ... (2 autres)
│   │   └── ... (20 autres routes)
│   ├── services/                   # Logique métier
│   │   ├── adminUserService.ts     # Service gestion utilisateurs
│   │   ├── adminCommandeService.ts # Service gestion commandes
│   │   ├── auditService.ts         # Service logs d'audit
│   │   ├── stripeService.ts        # Service Stripe
│   │   ├── invoiceService.ts       # Service facturation PDF
│   │   └── ... (autres services)
│   ├── events/                     # Architecture événementielle
│   │   └── eventBus.ts             # EventBus centralisé
│   ├── listeners/                  # Listeners emails automatiques
│   │   ├── adminNotificationEmailListener.ts # Emails admin
│   │   └── userNotificationEmailListener.ts  # Emails utilisateurs
│   ├── queues/                     # Queue asynchrone
│   │   └── emailQueue.ts           # Traitement emails Handlebars + SendGrid
│   ├── emails/                     # Templates HTML professionnels
│   │   └── templates/              # 18 templates (admin/users/visitors)
│   ├── middleware/                 # Middlewares Express
│   │   ├── auth.ts                 # Middleware JWT
│   │   └── requireRole.ts          # Middleware rôles (ADMIN/USER/CORRECTOR)
│   ├── utils/                      # Utilitaires
│   │   ├── token.ts                # Gestion tokens JWT
│   │   └── mailer.ts               # Service SendGrid
│   ├── config/                     # Configuration
│   │   └── config.ts               # Variables environnement
│   └── __tests__/                  # Tests (16 fichiers - 87% couverture)
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
- **AWS S3 SDK 3.837.0** : Stockage fichiers avec URLs présignées  
- **SendGrid 8.1.5** : Service emails transactionnels
- **PDFKit 0.17.1** : Génération factures PDF A4

#### **Tests & Monitoring**
- **Vitest 3.2.4** : Framework tests unitaires ultra-rapide
- **Supertest** : Tests endpoints API
- **Winston 3.11.0** : Logging structuré avec rotation

---

## 🌐 **API Endpoints (139+ endpoints)**

### 🔐 **Authentification** (`/auth`)

```typescript
POST   /auth/register              # Inscription utilisateur
POST   /auth/login                 # Connexion JWT
GET    /auth/me                    # Profil utilisateur actuel
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

### 📊 **Projets & Fichiers** (`/projects`, `/files`)

```typescript
GET    /projects                   # Projets utilisateur
GET    /projects/:id/files         # Fichiers projet
POST   /files/upload               # Upload fichier S3
GET    /files/:id/download         # Téléchargement sécurisé
DELETE /files/:id                  # Suppression fichier
```

**Gestion S3 Avancée :**
- URLs présignées pour upload direct
- Validation ownership fichiers
- Progression temps réel frontend
- Audit trail uploads/downloads

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

#### **Traçabilité Complète**
```typescript
enum AuditSeverity {
  LOW      = "LOW",      // Actions routinières
  MEDIUM   = "MEDIUM",   // Actions importantes
  HIGH     = "HIGH",     // Actions sensibles
  CRITICAL = "CRITICAL"  // Actions critiques sécurité
}

enum AuditTargetType {
  user     = "user",     // Actions utilisateurs
  command  = "command",  // Actions commandes
  invoice  = "invoice",  // Actions factures
  payment  = "payment",  // Actions paiements
  file     = "file",     // Actions fichiers
  auth     = "auth",     // Actions authentification
  system   = "system"    // Actions système
}

// Log automatique
await auditService.log(
  adminEmail,
  'USER_ROLE_CHANGED',
  'user',
  targetUserId,
  `Rôle changé de ${oldRole} vers ${newRole}`,
  AuditSeverity.HIGH,
  { oldRole, newRole, targetUserId }  // Métadonnées
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

#### **18 Templates HTML Responsive**
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

## 🧪 **Tests & Qualité**

### 📊 **Coverage & Métriques**

```bash
# Tests backend complets
npm run test:ci          # Tests unitaires (87% coverage)
npm run test:coverage    # Rapport détaillé Istanbul
npm run test:watch       # Mode développement
npm run test:s3         # Tests S3 conditionnels

# Résultats actuels (25 juillet 2025)
Files        : 16
Statements   : 87.3%
Branches     : 84.1%  
Functions    : 89.7%
Lines        : 87.8%
```

### 🧩 **Structure Tests**

#### **Tests Unitaires** (`src/__tests__/`)
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

#### **Tests Intégration** (`src/__tests__/integration/`)
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
    "start": "node dist/server.js",
    "test": "docker compose run --rm app npm run test:ci",
    "test:ci": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:s3": "AWS_ACCESS_KEY_ID=real_key docker compose run --rm app npm run test:s3:ci",
    "test:s3:ci": "vitest run --testPathPattern='integration/s3'",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "prisma:seed": "ts-node prisma/seed.ts",
    "stripe:sync-all": "ts-node scripts/sync-tarifs-stripe.ts",
    "stripe:sync-dry": "ts-node scripts/sync-tarifs-stripe.ts --dry-run",
    "audit:docker": "docker compose run --rm app npm audit --production"
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

**✨ Développé par Christophe Mostefaoui - Juillet 2025**  
**🏗️ Architecture enterprise-grade déployée sur OVH Cloud**  
**🚀 API REST 139+ endpoints production-ready avec 87% coverage tests**