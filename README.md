# 📚 Staka Livres - Plateforme de Correction de Manuscrits

## 🎯 Présentation du Projet

**Staka Livres** est une plateforme web moderne dédiée aux **services de correction et d'édition de manuscrits**. L'application offre une expérience complète aux auteurs, de la découverte des services jusqu'à la gestion avancée de leurs projets éditoriaux, avec un système d'authentification sécurisé, un espace d'administration complet et un **système de facturation automatique avec React Query**.

### 🌟 **Vision**

Démocratiser l'accès aux services éditoriaux professionnels en offrant une plateforme intuitive, transparente et efficace pour tous les auteurs, qu'ils soient débutants ou confirmés.

### 🎨 **Interface Moderne**

- **Landing Page production-ready** : 14 composants React (2400+ lignes) avec hook usePricing
- **Système d'authentification** sécurisé avec JWT
- **Page d'inscription** avec validation complète
- **Dashboard client** avec gestion complète des projets
- **Système de facturation** intelligent avec React Query et cache optimisé
- **Espace administrateur** moderne et intuitif avec mode démo professionnel
- **Design responsive** mobile-first avec animations fluides
- **UX premium** avec micro-interactions et feedback temps réel

### 🎨 **Landing Page Production-Ready (14 Composants)**

- **Architecture complète** : 14 composants React spécialisés (2400+ lignes total)
- **PricingCalculator** : Hook usePricing avec tarification dégressive intelligente
- **Composants majeurs** : Hero, Navigation sticky, Services, Packs, FAQ accordéon, Contact
- **Features avancées** : Widget WhatsApp flottant, formulaires validés, animations fluides
- **Mobile-first** : Design responsive avec micro-interactions optimisées
- **SEO optimisé** : Structure sémantique HTML5 production-ready
- **Hook personnalisé** : `usePricing.ts` avec logique métier tarification
- **Navigation intelligente** : Détection scroll, menu mobile, sticky CTA bar

---

## 🔐 Fonctionnalités Développées

### 🚀 **Système d'Authentification Complet**

- **Inscription sécurisée** avec validation des données
- **Connexion JWT** avec tokens de 7 jours
- **Hachage bcrypt** des mots de passe (12 rounds)
- **Gestion des rôles** : USER et ADMIN
- **Middleware d'authentification** pour routes protégées
- **Gestion des sessions** avec localStorage
- **Redirection intelligente** selon le rôle utilisateur

### 💳 **Système de Facturation Automatique (React Query)**

- **API complète** : `fetchInvoices()`, `fetchInvoice()`, `downloadInvoice()` avec auth
- **Hooks React Query** : `useInvoices()`, `useInvoice()`, `useInvalidateInvoices()`
- **Cache intelligent** : 5-10 minutes avec invalidation automatique
- **États optimisés** : `isLoading`, `isFetching`, `error` gérés automatiquement
- **Pagination fluide** : `keepPreviousData` pour éviter les blancs UI
- **Téléchargement PDF** : Blob API avec trigger automatique
- **Gestion d'erreurs** : Retry automatique et toasts informatifs
- **Performance** : Navigation instantanée grâce au cache

### 👨‍💼 **Espace Administrateur Complet (9 Pages)**

- **AdminDashboard** : Vue d'ensemble avec KPIs et statistiques temps réel
- **AdminUtilisateurs** : Gestion CRUD complète avec recherche et filtres
- **AdminCommandes** : Suivi projets avec changement de statuts
- **AdminFactures** : Interface facturation avec téléchargement PDF et actions
- **AdminMessagerie** : Interface messagerie avancée avec hooks React Query spécialisés
- **AdminFAQ** : Gestion base de connaissance avec réorganisation
- **AdminTarifs** : Configuration prix et services avec calculs automatiques
- **AdminPages** : CMS pour pages statiques avec preview et SEO
- **AdminStatistiques** : Analytics avancées avec graphiques mockés
- **AdminLogs** : Timeline d'audit avec filtres et métadonnées
- **Design moderne** : Sidebar sombre, animations fluides, responsive
- **Mock data réalistes** : Données complètes prêtes pour API
- **Architecture API-ready** : Services facilement remplaçables

### 🎭 **Mode Démonstration Admin Complet**

- **DemoModeProvider** : Context React avec gestion session timer (453 lignes)
- **MockDataService** : Service données fictives avec API complète et pagination
- **Bannière interactive** : Timer temps réel, actions Rafraîchir/Reset/Prolonger/Quitter
- **Configuration URL** : `?demo=true&duration=60&readonly=true` avec détection automatique
- **API adaptative** : Basculement intelligent entre données réelles et fictives
- **Tests automatisés** : `window.testDemoMode()` + `DemoModeTestSuite` avec validation complète
- **Cas d'usage** : Démonstrations client, formation équipe, tests fonctionnels sans risque
- **25 commandes + 20 factures + 10 utilisateurs** : Données cohérentes avec relations

### 📬 **Système de Messagerie Avancé avec React Query**

- **useMessages.ts** : Hook principal 654 lignes avec 15+ hooks spécialisés
- **useAdminMessages.ts** : Hook admin 321 lignes avec 12+ hooks modération
- **MessagesPage.tsx** : Interface client avec optimistic updates et cache intelligent
- **AdminMessagerie.tsx** : Interface admin avec filtres, recherche, actions masse
- **API complète** : Messages avec threading, support requests, métadonnées avancées
- **Performance** : Pagination infinie, invalidation croisée, retry automatique
- **Hooks avancés** : `useInfiniteQuery`, `useMutation`, cache 30s-5min, `useSendMessage`
- **Architecture** : 3 composants + 2 suites hooks React Query (1000+ lignes total)

### 📊 **API Backend Robuste**

- **Routes d'authentification** : /auth/register, /auth/login, /auth/me
- **Routes admin utilisateurs** : GET /admin/users, GET /admin/user/:id
- **Routes admin commandes** : GET /admin/commandes, PATCH /admin/commande/:id
- **Routes client commandes** : POST /commandes, GET /commandes
- **Routes de facturation** : GET /invoices, GET /invoices/:id, GET /invoices/:id/download
- **Routes de paiement Stripe** : POST /payments/create-checkout-session, GET /payments/status, POST /payments/webhook
- **Middleware de rôles** avec RequireAdmin
- **Gestion d'erreurs** centralisée avec logs
- **Données de fallback** en cas d'indisponibilité DB

### 🗄️ **Base de Données Complète (10 Modèles)**

- **User** : UUID, rôles, statut actif, avatar, contacts
- **Commande** : statuts, priorités, échéances, notes client/correcteur
- **Message** : messagerie unifiée (projet + support) avec threading
- **SupportRequest** : tickets de support avec SLA et assignation
- **File** : système de fichiers avec types, permissions, sécurité
- **Invoice** : facturation automatique avec numérotation et PDF
- **PaymentMethod** : moyens de paiement Stripe avec chiffrement
- **Notification** : système de notifications avec types et priorités
- **Page** : CMS pour contenu éditorial avec SEO
- **MessageAttachment** : pièces jointes messages avec relations

**Relations RGPD** : Cascade DELETE, contraintes FK, soft delete  
**Performance** : Index optimisés, requêtes type-safe Prisma  
**Documentation** : Guide complet dans `docs/Base-de-donnees-guide.md`

---

## 🏗️ Architecture Monorepo

### 📁 **Structure du Projet Mise à Jour**

```
Staka-livres/
├── backend/                 # API Node.js + Express + Prisma
│   ├── src/
│   │   ├── server.ts       # Point d'entrée principal
│   │   ├── controllers/    # Contrôleurs API
│   │   │   ├── authController.ts      # Authentification
│   │   │   ├── adminController.ts     # Administration
│   │   │   ├── commandeController.ts  # Gestion commandes admin
│   │   │   ├── commandeClientController.ts # Commandes client
│   │   │   └── paymentController.ts   # Paiements Stripe
│   │   ├── routes/         # Routes Express
│   │   │   ├── auth.ts     # Routes authentification
│   │   │   ├── admin.ts    # Routes administration
│   │   │   ├── commandes.ts # Routes commandes
│   │   │   ├── invoice.ts  # Routes facturation
│   │   │   └── payments.ts # Routes paiements Stripe
│   │   ├── middleware/     # Middlewares Express
│   │   │   ├── auth.ts     # Middleware JWT
│   │   │   └── requireRole.ts # Middleware rôles
│   │   ├── services/       # Services métier
│   │   │   ├── stripeService.ts    # Service Stripe
│   │   │   └── invoiceService.ts   # Service factures
│   │   ├── utils/          # Utilitaires
│   │   │   ├── token.ts    # Gestion tokens JWT
│   │   │   └── mailer.ts   # Service email
│   │   ├── config/         # Configuration
│   │   └── types/          # Types TypeScript
│   ├── prisma/
│   │   ├── schema.prisma   # Schéma base de données
│   │   ├── migrations/     # Migrations appliquées
│   │   └── seed.ts         # Données de test
│   ├── tests/              # Tests backend avec Jest
│   ├── package.json        # Dépendances backend
│   ├── Dockerfile          # Container backend
│   ├── nodemon.json        # Config nodemon
│   └── tsconfig.json       # Config TypeScript
├── frontend/                # Application React + Vite + React Query
│   ├── src/
│   │   ├── app.tsx         # App React principale
│   │   ├── main.tsx        # Point d'entrée avec QueryClientProvider
│   │   ├── components/     # Composants React
│   │   │   ├── admin/      # Composants administration
│   │   │   │   ├── AdminLayout.tsx    # Layout admin moderne
│   │   │   │   ├── DemoModeProvider.tsx    # Mode démo (453 lignes)
│   │   │   │   ├── RequireAdmin.tsx        # Sécurité multi-niveaux
│   │   │   │   ├── StatCard.tsx       # Cartes statistiques
│   │   │   │   └── CommandeStatusSelect.tsx # Sélecteur statut
│   │   │   ├── billing/    # Composants facturation React Query
│   │   │   │   ├── CurrentInvoiceCard.tsx     # Facture courante
│   │   │   │   ├── InvoiceHistoryCard.tsx     # Historique factures
│   │   │   │   ├── InvoiceDetailsModal.tsx    # Détails facture
│   │   │   │   ├── PaymentMethodsCard.tsx     # Moyens de paiement
│   │   │   │   ├── PaymentModal.tsx           # Modal paiement
│   │   │   │   ├── AnnualSummaryCard.tsx      # Résumé annuel
│   │   │   │   └── SupportCard.tsx            # Support client
│   │   │   ├── forms/      # Formulaires
│   │   │   │   ├── LoginForm.tsx      # Formulaire connexion
│   │   │   │   └── SignupForm.tsx     # Formulaire inscription
│   │   │   ├── layout/     # Layout et navigation
│   │   │   ├── landing/    # 14 composants production-ready (2400+ lignes)
│   │   │   │   ├── hooks/usePricing.ts     # Hook tarification
│   │   │   │   ├── PricingCalculator.tsx   # Calculateur avancé (338 lignes)
│   │   │   │   ├── Navigation.tsx          # Navigation sticky (204 lignes)
│   │   │   │   ├── Hero.tsx                # Section hero (106 lignes)
│   │   │   │   └── [10 autres composants]  # Services, Packs, FAQ, Contact...
│   │   │   ├── modals/     # Modales
│   │   │   ├── messages/   # Architecture messagerie complète
│   │   │   │   ├── ConversationList.tsx   # Liste conversations
│   │   │   │   ├── MessageThread.tsx      # Thread de messages
│   │   │   │   └── MessageItem.tsx        # Affichage message
│   │   │   ├── project/    # Gestion projets
│   │   │   └── common/     # Composants communs
│   │   ├── hooks/          # Hooks React Query spécialisés
│   │   │   ├── useInvoices.ts         # Hooks facturation (existant)
│   │   │   ├── useMessages.ts         # Messagerie client (654 lignes)
│   │   │   ├── useAdminMessages.ts    # Messagerie admin (321 lignes)
│   │   │   └── useIntersectionObserver.ts # Pagination infinie
│   │   ├── pages/          # Pages React
│   │   │   ├── admin/      # Pages administration (9 pages complètes)
│   │   │   │   ├── AdminDashboard.tsx    # Tableau de bord avec KPIs
│   │   │   │   ├── AdminUtilisateurs.tsx # Gestion CRUD utilisateurs
│   │   │   │   ├── AdminCommandes.tsx    # Gestion commandes avec statuts
│   │   │   │   ├── AdminFactures.tsx     # Interface facturation avancée
│   │   │   │   ├── AdminFAQ.tsx          # Gestion FAQ et base connaissance
│   │   │   │   ├── AdminTarifs.tsx       # Configuration prix et services
│   │   │   │   ├── AdminPages.tsx        # CMS pages statiques avec SEO
│   │   │   │   ├── AdminStatistiques.tsx # Analytics et métriques avancées
│   │   │   │   └── AdminLogs.tsx         # Timeline audit et logs système
│   │   │   ├── BillingPage.tsx       # Page facturation React Query
│   │   │   ├── LoginPage.tsx         # Page connexion
│   │   │   └── SignupPage.tsx        # Page inscription
│   │   ├── contexts/       # Contextes React
│   │   │   └── AuthContext.tsx       # Contexte authentification
│   │   ├── utils/          # Utilitaires frontend
│   │   │   ├── auth.ts     # Utils authentification
│   │   │   ├── adminAPI.ts # API administration
│   │   │   ├── api.ts      # Services API factures
│   │   │   └── toast.ts    # Notifications toast
│   │   ├── types/          # Types TypeScript
│   │   │   └── shared.ts   # Types partagés locaux
│   │   └── styles/         # Styles CSS globaux
│   ├── package.json        # Dépendances frontend + react-query@3.39.3
│   ├── Dockerfile          # Container frontend
│   ├── vite.config.ts      # Config Vite avec optimizeDeps
│   └── tailwind.config.js  # Config Tailwind
├── shared/                  # Types et utils partagés
│   ├── types/
│   │   └── index.ts        # Types communs compilés
│   ├── dist/               # Types compilés ES Module
│   ├── tsconfig.json       # Config compilation partagée
│   └── package.json        # Dépendances partagées
├── docker-compose.yml       # Orchestration Docker avec volumes
├── .dockerignore           # Exclusions Docker
├── package.json            # Config workspace racine
└── README.md               # Cette documentation
```

---

## 🛠️ Technologies Utilisées

### 🚀 **Backend (Node.js)**

- **Node.js 18** : Runtime JavaScript moderne
- **Express.js** : Framework web minimaliste
- **TypeScript** : Typage statique pour la robustesse
- **Prisma ORM** : Modélisation et requêtes type-safe
- **MySQL 8** : Base de données relationnelle
- **JWT (jsonwebtoken)** : Authentification sécurisée
- **bcryptjs** : Hachage des mots de passe (12 rounds)
- **cors** : Gestion des requêtes cross-origin
- **helmet** : Sécurité HTTP
- **winston** : Logging avancé
- **nodemon** : Rechargement automatique en dev
- **ts-node** : Exécution TypeScript directe
- **Stripe** : Plateforme de paiement sécurisée
- **Jest** : Framework de tests unitaires et d'intégration

### 🎨 **Frontend (React + React Query)**

- **React 18** : Framework JavaScript moderne avec hooks
- **TypeScript** : Typage statique pour la robustesse
- **Vite** : Build tool ultra-rapide avec HMR et optimizeDeps
- **React Query v3** : Cache intelligent et gestion d'état serveur
- **Tailwind CSS** : Framework CSS utility-first
- **React Context API** : Gestion d'état authentification
- **Animations CSS** : Transitions fluides et micro-interactions

### 🗄️ **Base de Données**

- **MySQL 8** : Base de données principale
- **Prisma Client** : ORM type-safe
- **Prisma Migrate** : Gestion des migrations
- **Seed Data** : Comptes de test préchargés

### 🐳 **DevOps et Déploiement**

- **Docker** : Conteneurisation des services
- **Docker Compose** : Orchestration multi-services avec volumes
- **npm workspaces** : Gestion monorepo
- **Nginx** : Serveur web (frontend en prod)
- **ngrok** : Tunnel sécurisé pour webhooks Stripe en développement

---

## 📋 **Changelog Récent**

### ✅ **Version Actuelle (Juin 2025)**

**🗄️ Base de Données Complète Opérationnelle :**

- ✅ **10 modèles de données complets** : User, Commande, File, Message, SupportRequest, PaymentMethod, Invoice, Notification, Page, MessageAttachment
- ✅ **Schéma Prisma robuste** : Relations RGPD, contraintes FK, index performance
- ✅ **Migrations corrigées** : Déploiement automatique sans erreurs
- ✅ **Support Request Integration** : Messagerie unifiée projet + support
- ✅ **Documentation complète** : Guide détaillé dans `docs/Base-de-donnees-guide.md`

**🎯 Espace Admin Complet Finalisé :**

- ✅ **9 pages admin complètes** : Dashboard, Utilisateurs, Commandes, Factures, FAQ, Tarifs, Pages, Statistiques, Logs
- ✅ **AdminLayout moderne** : Sidebar sombre avec navigation fluide et animations
- ✅ **Mock data réalistes** : Données complètes pour tous les modules admin
- ✅ **Composants réutilisables** : LoadingSpinner, Modal, ConfirmationModal
- ✅ **Interface production-ready** : Design moderne avec UX soignée
- ✅ **Architecture API-ready** : Structure prête pour intégration backend

**🎯 Intégration React Query Complète :**

- ✅ React Query v3.39.3 installé et configuré avec QueryClientProvider
- ✅ Hooks `useInvoices()`, `useInvoice()`, `useInvalidateInvoices()` fonctionnels
- ✅ Cache intelligent 5-10 minutes avec invalidation automatique
- ✅ États optimisés : `isLoading`, `isFetching`, `error` gérés automatiquement
- ✅ Pagination fluide avec `keepPreviousData`
- ✅ Téléchargement PDF via blob API avec trigger automatique
- ✅ BillingPage refactorisée : suppression des fetch manuels

**🔧 Résolution Erreur 504 Vite :**

- ✅ Configuration `optimizeDeps` dans vite.config.ts
- ✅ Force re-optimization des dépendances React Query
- ✅ Nettoyage cache Vite automatique
- ✅ Build TypeScript fonctionnel sans erreurs

**🚀 Performance et UX Optimisées :**

- ✅ Navigation instantanée grâce au cache React Query
- ✅ Background refresh silencieux des données
- ✅ Retry automatique et déduplication des requêtes
- ✅ Toasts d'erreurs intelligents et EmptyState
- ✅ Disabled states pour boutons pendant chargement

**🐳 Infrastructure Docker Stabilisée :**

- ✅ Configuration MySQL 8.4+ corrigée (`--mysql-native-password=ON`)
- ✅ Base de données persistante avec migrations automatiques
- ✅ Prisma Studio accessible sur port 5555
- ✅ Variables d'environnement sécurisées

**🔧 Corrections Techniques Majeures :**

- ✅ **Champ Invoice.number** : Correction erreur TypeScript sur facturation
- ✅ **Colonne supportRequestId** : Ajoutée avec index et contraintes FK
- ✅ **Export server.ts** : Ajout export default pour compatibilité tests
- ✅ **Migrations nettoyées** : Suppression dossiers vides causant échecs
- ✅ **Troubleshooting complet** : Guide résolution 8 problèmes courants

**🚀 Intégration Stripe Complète :**

- ✅ API de paiement fonctionnelle avec sessions Stripe
- ✅ Prix dynamique (468€) sans dépendance aux produits pré-créés
- ✅ Webhooks configurés pour mise à jour automatique des statuts
- ✅ Gestion des erreurs et logging complet

**📊 Données de Test Opérationnelles :**

- ✅ Seed automatique avec comptes admin/user
- ✅ 3 commandes de test avec différents statuts de paiement
- ✅ Structure complète User ↔ Commande ↔ Invoice avec champs Stripe
- ✅ **Prisma Studio** : Interface d'administration sur http://localhost:5555

---

## 🚀 **Démarrage Rapide**

### ⚡ **Installation et Configuration**

**Prérequis :**

- Docker et Docker Compose installés
- Node.js 18+ (pour développement local)
- Git

**1. Cloner le projet :**

```bash
git clone <repository-url>
cd Staka-livres
```

**2. Configuration de l'environnement :**

```bash
# Créer le fichier de configuration backend
touch backend/.env
```

**3. Configurer les variables d'environnement dans `backend/.env` :**

```env
# Base de données
DATABASE_URL="mysql://staka:staka@db:3306/stakalivres"

# Authentification JWT
JWT_SECRET="dev_secret_key_change_in_production"
NODE_ENV="development"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
PORT=3001

# Configuration Stripe (remplacer par vos vraies clés)
STRIPE_SECRET_KEY="sk_test_VOTRE_CLE_SECRETE_STRIPE"
STRIPE_WEBHOOK_SECRET="whsec_VOTRE_WEBHOOK_SECRET"
```

**4. Lancer l'application avec Docker :**

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier le statut des conteneurs
docker-compose ps
```

**5. Initialiser la base de données :**

```bash
# Appliquer les migrations
docker exec -it staka_backend npx prisma migrate deploy

# Générer le client Prisma
docker exec -it staka_backend npx prisma generate

# Créer les données de test
docker exec -it staka_backend npm run db:seed
```

### 🌐 **Accès aux Services**

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Prisma Studio** : http://localhost:5555
- **Base de données** : localhost:3306

### 👤 **Comptes de Test**

**Administrateur :**

- Email : `admin@staka-editions.com`
- Mot de passe : `admin123`

**Utilisateur :**

- Email : `user@example.com`
- Mot de passe : `user123`

### 🗄️ **Interface d'Administration Base de Données**

**Prisma Studio** : http://localhost:5555

- **Navigation** : Parcourir tous les modèles (User, Commande, Message, SupportRequest, etc.)
- **Visualisation** : Voir les données avec relations
- **Édition** : Modifier/Créer/Supprimer des enregistrements
- **Export** : Exporter les données au format JSON
- **Guide complet** : Consulter `docs/Base-de-donnees-guide.md`

### 💳 **Test du Système de Facturation**

1. **Se connecter** avec un compte utilisateur
2. **Naviguer vers** : http://localhost:3000/billing
3. **Observer** : Chargement instantané avec React Query
4. **Tester** : Pagination "Charger plus", détails factures, téléchargement PDF
5. **Console navigateur** : Voir les requêtes React Query en action

---

## 💳 **Configuration Stripe**

### 🔧 **Configuration Initiale**

1. **Créer un compte Stripe** sur https://stripe.com
2. **Récupérer les clés API** dans le Dashboard > Developers > API Keys
3. **Mettre à jour le fichier `.env`** avec vos vraies clés

### 🧪 **Mode Test**

Le système utilise automatiquement :

- **Prix dynamique** : 468€ pour les corrections de manuscrit
- **Cartes de test Stripe** : 4242 4242 4242 4242
- **Webhooks** : Configuration automatique en développement

### 📊 **Données de Test**

La base contient 3 commandes de test :

- **Commande payée** : "Relecture essai - Philosophie" (statut: TERMINE)
- **Commande non payée** : "Correction manuscrit - Romance" (statut: EN_ATTENTE)
- **Commande en cours** : "Correction nouvelles - SF" (statut: EN_COURS)

---

## 🔧 **Troubleshooting**

### ❗ **Problèmes Courants et Solutions**

#### **1. Erreur "Property 'number' is missing" sur Invoice**

```bash
# Problème : Champ number manquant dans création facture
# Solution : Vérifier que toutes les créations d'Invoice incluent :
const invoice = await prisma.invoice.create({
  data: {
    commandeId,
    number: `FACT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
    amount: 59900,
    pdfUrl,
    status: "GENERATED",
    issuedAt: new Date(),
  },
});
```

#### **2. Erreur "Column supportRequestId does not exist"**

```bash
# Solution : Ajouter la colonne manuellement
docker exec -it staka_db mysql -u staka -pstaka stakalivres -e "ALTER TABLE messages ADD COLUMN supportRequestId VARCHAR(191) NULL;"

# Créer l'index et la contrainte
docker exec -it staka_db mysql -u staka -pstaka stakalivres -e "CREATE INDEX messages_supportRequestId_idx ON messages(supportRequestId); ALTER TABLE messages ADD CONSTRAINT messages_supportRequestId_fkey FOREIGN KEY (supportRequestId) REFERENCES support_requests(id) ON DELETE SET NULL;"

# Régénérer le client Prisma
docker exec -it staka_backend npx prisma generate
```

#### **3. Erreur "Could not find migration file"**

```bash
# Solution : Supprimer les dossiers de migration vides
rm -rf backend/prisma/migrations/[dossier-vide]

# Redéployer les migrations
docker exec -it staka_backend npx prisma migrate deploy
```

#### **4. Backend qui crash au démarrage**

```bash
# Diagnostic : Vérifier les logs
docker logs staka_backend --tail 50

# Solutions communes :
docker exec -it staka_backend npx prisma generate
docker-compose restart backend
```

#### **5. Erreur de connexion "ERR_CONNECTION_RESET"**

```bash
# Vérifications :
curl -X GET http://localhost:3001/health
docker exec -it staka_backend netstat -tlnp | grep 3001
docker exec -it staka_backend env | grep -E "PORT|DATABASE_URL"
```

#### **6. React Query ne Cache pas**

```bash
# Vérifier dans la console navigateur :
window.__REACT_QUERY_CLIENT__
# Si undefined, vérifier que QueryClientProvider est bien configuré dans main.tsx
```

**📚 Guide Complet** : Consulter `docs/Base-de-donnees-guide.md` section Troubleshooting pour 8 problèmes supplémentaires avec solutions détaillées.

### 🔍 **Commandes Utiles de Debug**

```bash
# État de tous les services
docker-compose ps

# Logs de tous les services
docker-compose logs

# Logs d'un service spécifique
docker logs staka_backend
docker logs staka_db
docker logs staka_frontend

# Entrer dans un conteneur pour debug
docker exec -it staka_backend bash
docker exec -it staka_frontend sh

# Vérifier React Query dans le navigateur
# Console : window.__REACT_QUERY_CLIENT__.getQueryCache()

# Réinitialisation complète
docker-compose down -v
docker system prune -f
docker-compose up -d
```

### 📊 **Vérification de l'État**

**Services actifs :**

- ✅ Frontend : http://localhost:3000 (avec React Query)
- ✅ Backend API : http://localhost:3001/health
- ✅ Prisma Studio : http://localhost:5555
- ✅ Base MySQL : port 3306

**Comptes de test :**

- ✅ Admin : admin@staka-editions.com / admin123
- ✅ User : user@example.com / user123

**React Query :**

- ✅ Cache 5-10 minutes configuré
- ✅ Hooks `useInvoices()`, `useInvoice()` fonctionnels
- ✅ États `isLoading`, `isFetching`, `error` gérés
- ✅ Téléchargement PDF opérationnel

---

## 🔐 API Endpoints Disponibles

### 🚪 **Authentification**

```bash
# Inscription d'un nouvel utilisateur
POST /auth/register
Body: { prenom, nom, email, password }

# Connexion avec JWT
POST /auth/login
Body: { email, password }

# Récupérer profil utilisateur (protégé)
GET /auth/me
Headers: Authorization: Bearer <jwt_token>
```

### 💳 **Facturation (React Query)**

```bash
# Liste des factures paginée
GET /invoices?page=1&limit=20
Headers: Authorization: Bearer <jwt_token>
# Utilisé par useInvoices(page, limit)

# Détail d'une facture
GET /invoices/:id
Headers: Authorization: Bearer <jwt_token>
# Utilisé par useInvoice(id)

# Télécharger PDF d'une facture
GET /invoices/:id/download
Headers: Authorization: Bearer <jwt_token>
# Utilisé par downloadInvoice(id) → Blob
```

### 👨‍💼 **Administration (Role: ADMIN)**

```bash
# Statistiques utilisateurs
GET /admin/users/stats
Headers: Authorization: Bearer <admin_token>

# Liste des utilisateurs (pagination)
GET /admin/users?page=1&limit=10
Headers: Authorization: Bearer <admin_token>

# Détail d'un utilisateur
GET /admin/user/:id
Headers: Authorization: Bearer <admin_token>

# Statistiques commandes
GET /admin/commandes/stats
Headers: Authorization: Bearer <admin_token>

# Liste des commandes (pagination, tri, filtres)
GET /admin/commandes?page=1&limit=10&sortBy=createdAt&order=desc
Headers: Authorization: Bearer <admin_token>

# Détail d'une commande
GET /admin/commande/:id
Headers: Authorization: Bearer <admin_token>

# Modifier le statut d'une commande
PATCH /admin/commande/:id
Headers: Authorization: Bearer <admin_token>
Body: { statut: "EN_COURS" }
```

### 📝 **Commandes Client (Role: USER)**

```bash
# Créer une nouvelle commande
POST /commandes
Headers: Authorization: Bearer <user_token>
Body: { titre, description?, fichierUrl? }

# Mes commandes
GET /commandes
Headers: Authorization: Bearer <user_token>

# Détail d'une de mes commandes
GET /commandes/:id
Headers: Authorization: Bearer <user_token>
```

### 💳 **Paiements Stripe (Role: USER)**

```bash
# Créer une session de paiement
POST /payments/create-checkout-session
Headers: Authorization: Bearer <user_token>
Body: { commandeId: "uuid", priceId: "price_correction_standard" }
# Note: Le priceId est ignoré en faveur d'un prix dynamique de 468€

# Vérifier le statut d'un paiement
GET /payments/status/:sessionId
Headers: Authorization: Bearer <user_token>

# Webhook Stripe (appelé automatiquement par Stripe)
POST /payments/webhook
Headers: stripe-signature: <signature>
Body: <stripe_event_data>
```

---

## 🗄️ Configuration Base de Données

### 🔧 **Prisma Setup**

```bash
# Dans le container backend ou localement
cd backend

# Génération du client Prisma
npx prisma generate

# Appliquer les migrations existantes
npx prisma db push

# Charger les données de test
npx prisma db seed

# Interface d'administration Prisma Studio
npx prisma studio
```

### 📊 **Variables d'Environnement Backend**

```env
# backend/.env
DATABASE_URL="mysql://root:root@db:3306/stakalivres"
JWT_SECRET="dev_secret_key_change_in_production"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
PORT=3001
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 🎨 **Variables d'Environnement Frontend**

```env
# frontend/.env (optionnel)
VITE_API_URL=http://localhost:3001
VITE_APP_NAME="Staka Livres"
VITE_WHATSAPP_NUMBER="+33615078152"
VITE_CONTACT_EMAIL="contact@staka-editions.com"
```

---

## 🎯 Scripts NPM Disponibles

### 🏠 **Scripts Workspace Racine**

```bash
# Développement concurrent (frontend + backend)
npm run dev

# Développement séparé
npm run dev:frontend
npm run dev:backend

# Build production
npm run build
npm run build:frontend
npm run build:backend

# Build code partagé
npm run build -w @staka/shared

# Tests
npm run test
npm run test:backend

# Docker
npm run docker:dev
npm run docker:prod
```

### 🚀 **Scripts Backend**

```bash
# Développement avec nodemon + ts-node
npm run dev --workspace=backend

# Build TypeScript vers dist/
npm run build --workspace=backend

# Démarrage production (après build)
npm run start --workspace=backend

# Tests Jest
npm run test --workspace=backend
npm run test:watch --workspace=backend

# Prisma
npm run db:migrate --workspace=backend
npm run db:generate --workspace=backend
npm run db:seed --workspace=backend
npm run db:studio --workspace=backend
```

### 🎨 **Scripts Frontend**

```bash
# Serveur dev Vite avec HMR + React Query
npm run dev --workspace=frontend

# Build production optimisé
npm run build --workspace=frontend

# Prévisualisation du build
npm run preview --workspace=frontend

# Linting ESLint
npm run lint --workspace=frontend
```

---

## 🐳 Gestion Docker

### 🔧 **Services Docker Compose**

- **frontend** : Application React (Vite dev server + React Query)
- **backend** : API Node.js (nodemon + ts-node)
- **db** : Base MySQL 8

### 📊 **Volumes Docker Configurés**

```yaml
# docker-compose.yml volumes synchronisés
volumes:
  - ./frontend:/app/frontend # Frontend hot reload
  - ./backend:/app/backend # Backend hot reload
  - ./shared:/app/shared # Types partagés
```

### 📊 **Commandes Docker Utiles**

```bash
# Rebuild un service spécifique
docker-compose build backend
docker-compose build frontend

# Logs en temps réel
docker-compose logs -f
docker-compose logs -f backend

# Redémarrage des services
docker-compose restart
docker-compose restart backend

# Accès shell dans un container
docker-compose exec backend sh
docker-compose exec frontend sh

# Base de données
docker-compose exec db mysql -u root -p stakalivres

# Nettoyage complet
docker-compose down -v --rmi all
docker system prune -af
```

---

## 🛠 Débogage et Tests

### 🧪 **Tests Backend Disponibles**

```bash
# Tests des contrôleurs d'authentification
npm run test --workspace=backend -- auth

# Tests des routes admin
npm run test --workspace=backend -- admin

# Tests des middlewares
npm run test --workspace=backend -- middleware

# Tests du système de facturation
npm run test --workspace=backend -- invoice

# Coverage des tests
npm run test:coverage --workspace=backend
```

### 🎯 **Tests React Query Frontend**

```bash
# Dans la console du navigateur sur http://localhost:3000/billing
# Script de test automatisé disponible :

# Vérifier que React Query est chargé
window.__REACT_QUERY_CLIENT__

# Vérifier le cache des factures
window.__REACT_QUERY_CLIENT__.getQueryCache()

# Invalider le cache manuellement
window.__REACT_QUERY_CLIENT__.invalidateQueries(['invoices'])

# Tests des hooks
console.log('État useInvoices:', { data, isLoading, error, isFetching });
```

### 📊 **API Testing avec curl**

```bash
# Test d'inscription
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"prenom":"Test","nom":"User","email":"test@example.com","password":"password123"}'

# Test de connexion
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@staka-editions.com","password":"admin123"}'

# Test liste factures React Query (remplacer <token>)
curl -X GET "http://localhost:3001/invoices?page=1&limit=20" \
  -H "Authorization: Bearer <jwt_token>"

# Test détail facture
curl -X GET http://localhost:3001/invoices/invoice-uuid \
  -H "Authorization: Bearer <jwt_token>"

# Test téléchargement PDF
curl -X GET http://localhost:3001/invoices/invoice-uuid/download \
  -H "Authorization: Bearer <jwt_token>" \
  --output facture.pdf

# Test création session de paiement (remplacer <user_token>)
curl -X POST http://localhost:3001/payments/create-checkout-session \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"commandeId":"commande-uuid","priceId":"price_1234..."}'
```

### ❌ **Erreurs Fréquentes et Solutions**

#### **1. `Cannot read properties of undefined (reading 'invoices')`**

**Problème** : React Query retourne undefined pendant le chargement

```typescript
// Solution : Vérification conditionnelle dans useEffect
useEffect(() => {
  if (invoicesData?.invoices) {
    // Traitement des données
  }
}, [invoicesData]);
```

#### **2. `Failed to load resource: 504 Outdated Optimize Dep`**

**Problème** : Cache Vite obsolète après installation React Query

```bash
# Solution appliquée dans vite.config.ts :
optimizeDeps: {
  include: ["react-query"],
  force: true,
}

# Commandes de résolution :
docker exec -it staka_frontend rm -rf /app/node_modules/.vite
docker restart staka_frontend
```

#### **3. `Query not enabled` dans React Query**

**Problème** : Hook useInvoice appelé sans ID

```typescript
// Solution : Condition enabled
const { data } = useInvoice(selectedInvoiceId || "", {
  enabled: !!selectedInvoiceId,
});
```

#### **4. `The requested module does not provide an export named 'StatutCommande'`**

**Problème** : Module partagé non compilé

```bash
# Solution : Compiler le code partagé
npm run build -w @staka/shared
# Puis redémarrer Docker
docker-compose restart frontend
```

#### **5. Navigation lente malgré React Query**

**Problème** : Cache non configuré ou invalidé trop souvent

```typescript
// Vérifier la configuration QueryClient dans main.tsx :
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
    },
  },
});
```

---

## 💳 Configuration Stripe Complète

### 🔧 **Installation et Setup**

#### **1. Compte Stripe**

1. Créer un compte sur [stripe.com](https://dashboard.stripe.com/register)
2. Récupérer les clés API dans **Développeurs > Clés API**
   - **Clé publique** : `pk_test_...` (pour le frontend)
   - **Clé secrète** : `sk_test_...` (pour le backend)

#### **2. Configuration Webhooks**

1. Aller dans **Développeurs > Webhooks**
2. **Ajouter un endpoint** avec ton URL ngrok :
   ```
   https://1234-abcd.ngrok.io/payments/webhook
   ```
3. **Événements à écouter** :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copier la **clé de signature webhook** : `whsec_...`

#### **3. Variables d'Environnement Stripe**

```env
# backend/.env
STRIPE_SECRET_KEY="sk_test_votre_cle_secrete_ici"
STRIPE_WEBHOOK_SECRET="whsec_votre_signature_webhook_ici"
```

### 🚀 **Utilisation API Stripe**

#### **Workflow de Paiement**

1. **Créer session** : `POST /payments/create-checkout-session`
2. **Rediriger client** vers `session.url`
3. **Stripe traite** le paiement
4. **Webhook confirmé** : commande passée à "EN_COURS"
5. **React Query invalide** le cache des factures automatiquement
6. **Client redirigé** vers page de succès

### 🧪 **Tests Stripe**

#### **Cartes de Test**

```bash
# Succès
4242 4242 4242 4242

# Échec
4000 0000 0000 0002

# 3D Secure
4000 0027 6000 3184
```

#### **Test Complet**

```bash
# 1. Créer une commande
POST /commandes
Body: { titre: "Mon Livre", description: "Roman" }

# 2. Créer session paiement
POST /payments/create-checkout-session
Body: { commandeId: "uuid", priceId: "price_..." }

# 3. Payer avec carte de test
# 4. Observer dans React Query : cache invalidé automatiquement
# 5. Vérifier statut dans BillingPage
```

---

## 📊 Métriques du Projet Actualisées

### 📈 **Architecture Monorepo avec React Query**

- **Services** : 3 services Docker (frontend, backend, db)
- **Workspaces** : 3 packages npm (frontend, backend, shared)
- **Lignes de code** : ~16,000 lignes TypeScript/React
- **Composants** : 80+ composants React réutilisables
- **Hooks React Query** : 12 hooks spécialisés (facturation + messagerie + pagination)
- **Pages admin** : 9 interfaces complètes + mode démo professionnel
- **Landing components** : 14 composants production-ready (2400+ lignes)
- **API Endpoints** : 35+ endpoints REST avec sécurité JWT + Stripe
- **Tables DB** : 10 modèles complets avec relations RGPD
- **Tests** : 48 tests facturation + tests démo automatisés
- **Architecture messagerie** : 1000+ lignes React Query (useMessages + useAdminMessages)
- **Mode démonstration** : DemoModeProvider + MockDataService + tests complets
- **Paiements** : Intégration Stripe complète avec webhooks
- **Architecture API-ready** : Mock services facilement remplaçables
- **Prisma Studio** : Interface d'administration base de données
- **Documentation** : Guide complet base de données (32KB)

### ⚡ **Performance et Sécurité avec React Query**

- **JWT Security** : Tokens 7 jours avec middleware protection
- **Password Security** : bcrypt avec 12 rounds de hachage
- **Cache intelligent** : 5-10 minutes avec invalidation automatique
- **Navigation** : Instantanée grâce au cache React Query
- **Hot Reload** : <100ms avec Vite HMR + nodemon optimisé
- **Database** : Prisma ORM avec requêtes optimisées
- **Frontend** : Animations CSS et micro-interactions fluides
- **UX States** : Loading, error, empty gérés automatiquement

### 🎯 **Fonctionnalités Opérationnelles**

- **Authentification** : Inscription/Connexion complète
- **Gestion des rôles** : USER/ADMIN avec restrictions
- **Espace admin complet** : 9 pages avec interfaces moderne + mode démo professionnel
- **Facturation React Query** : Cache, pagination, téléchargement PDF
- **Messagerie avancée** : React Query avec hooks spécialisés (1000+ lignes)
- **Landing Page** : 14 composants production-ready avec calculateur pricing
- **Mode démonstration** : Système complet pour démonstrations client
- **Dashboard** : Statistiques temps réel avec fallback
- **Responsive Design** : Mobile-first avec Tailwind CSS + animations fluides
- **Data Validation** : Frontend + Backend avec TypeScript
- **Paiements Stripe** : Sessions, webhooks et gestion des statuts

---

## 🤝 Contribution et Développement

### 🔄 **Workflow de Développement Mis à Jour**

1. **Fork** du repository
2. **Installation** : `npm install` + `npm run build -w @staka/shared`
3. **Développement** : `docker-compose up --build`
4. **Tests React Query** : Naviguer vers `/billing` et observer le cache
5. **Tests API** : curl ou Postman avec tokens JWT
6. **Tests Frontend** : Comptes admin/user de test
7. **Build** : `npm run build` (frontend + backend + shared)
8. **Pull Request** avec description détaillée

### 📝 **Standards de Code**

- **TypeScript** : Strict mode activé avec interfaces partagées
- **React + React Query** : Hooks avec cache intelligent
- **Express** : Middleware pattern avec validation
- **Prisma** : Modèles avec relations et énumérations
- **Security** : JWT + bcrypt + validation des entrées
- **UX** : Design moderne avec animations et états optimisés

### 🧪 **Tests et Qualité**

```bash
# Tests backend complets (auth + admin + commandes + factures)
npm run test --workspace=backend

# Tests d'intégration API
npm run test:integration --workspace=backend

# Tests React Query (manuel dans navigateur)
# http://localhost:3000/billing
# Console : window.__REACT_QUERY_CLIENT__.getQueryCache()

# Type checking strict
npx tsc --noEmit --workspace=backend
npx tsc --noEmit --workspace=frontend
npx tsc --workspace=shared

# Build validation complète
npm run build && echo "✅ Build successful"
```

---

## 🎯 Prochaines Étapes

### 🚧 **Développement à Venir**

- **React Query Mutations** : `useMutation` pour actions utilisateur (paiement, statuts)
- **React Query DevTools** : Debug interface pour développement
- **Upload de Fichiers** : Multer + stockage sécurisé pour manuscrits
- **Messagerie Temps Réel** : WebSockets avec Socket.io + invalidation cache
- **Notifications** : Email + notifications push avec mise à jour cache
- **Workflow Commandes** : Assignation correcteurs + suivi temps réel
- **Reporting Avancé** : Graphiques avec données cachées
- **Abonnements** : Plans récurrents avec Stripe Subscriptions

### 📦 **Améliorations Techniques**

- **Tests Frontend** : Jest + React Testing Library + Mock React Query
- **API Documentation** : Swagger/OpenAPI automatique
- **Rate Limiting** : Protection DDoS + cache Redis
- **Monitoring** : Logs centralisés + métriques performance React Query
- **CI/CD** : GitHub Actions avec déploiement automatique
- **Real-time** : WebSockets avec invalidation cache intelligente

### 🌐 **Déploiement Production**

- **Docker Multi-stage** : Builds optimisés pour production
- **Nginx Reverse Proxy** : Load balancing + SSL termination
- **SSL/TLS** : Certificats Let's Encrypt automatiques
- **Database** : MySQL production avec réplication
- **CDN** : Assets statiques optimisés + cache React Query persistant

---

## 🏆 Conclusion

**Staka Livres** est maintenant une plateforme complète avec authentification sécurisée, espace d'administration moderne, **système de facturation intelligent avec React Query** et API robuste. L'architecture monorepo avec Docker facilite le développement et garantit la cohérence entre les environnements.

### ✅ **Fonctionnalités Opérationnelles**

- **✅ Authentification JWT** : Inscription/Connexion sécurisée
- **✅ Gestion des rôles** : USER/ADMIN avec protection routes
- **✅ Système de facturation React Query** : Cache intelligent, pagination fluide, téléchargement PDF
- **✅ Architecture messagerie complète** : 1000+ lignes React Query avec hooks spécialisés
- **✅ Landing Page production-ready** : 14 composants React avec calculateur pricing
- **✅ Mode démonstration admin** : Système complet pour démonstrations client
- **✅ Espace admin moderne** : 9 pages + DemoModeProvider + MockDataService
- **✅ API REST complète** : 35+ endpoints avec middleware sécurité
- **✅ Base de données** : 10 modèles Prisma avec relations RGPD
- **✅ Interface responsive** : Design moderne mobile-first + animations fluides
- **✅ Paiements Stripe** : API complète avec webhooks et sessions

### 🎯 **Architecture Technique Validée**

- **✅ Monorepo** : 3 workspaces npm avec types partagés
- **✅ Docker** : Environnement développement avec volumes synchronisés
- **✅ TypeScript** : Type safety frontend + backend + shared
- **✅ React Query v3** : Cache intelligent 5-10 min avec hooks optimisés
- **✅ Vite optimisé** : Configuration `optimizeDeps` pour performance
- **✅ Hot Reload** : Développement rapide Vite + nodemon
- **✅ Security** : JWT + bcrypt + validation + CORS

### 🚀 **Performance React Query**

- **✅ Navigation instantanée** : Grâce au cache intelligent (facturation + messagerie)
- **✅ Background refresh** : Mise à jour silencieuse des données
- **✅ États optimisés** : `isLoading`, `isFetching`, `error` automatiques sur tous hooks
- **✅ Pagination fluide** : `keepPreviousData` + `useInfiniteQuery` pour messagerie
- **✅ Optimistic updates** : Messages envoyés avec rollback automatique
- **✅ Invalidation croisée** : Sync user/admin messagerie automatique
- **✅ Cache spécialisé** : 30s messagerie, 5-10min facturation
- **✅ Retry automatique** : 2 tentatives avec gestion d'erreurs
- **✅ Téléchargement PDF** : Blob API avec trigger automatique

Cette base solide avec **React Query intégré** (facturation + messagerie 1000+ lignes), **Landing Page production-ready** (14 composants), **Mode démonstration complet**, **Stripe fonctionnel** et **base de données complète (10 modèles)** est prête pour l'ajout des fonctionnalités métier avancées (mutations, upload fichiers, messagerie temps réel, abonnements) et le déploiement en production avec une architecture scalable et maintenable.

## 📚 **Documentation Complète**

- **README.md** : Guide général du projet (ce fichier)
- **docs/Base-de-donnees-guide.md** : Guide ultra détaillé de la base de données (32KB)
  - 10 modèles documentés avec exemples
  - Prisma Studio et commandes Docker
  - Troubleshooting 8 problèmes courants
  - Métriques et optimisations
  - Checklist de vérification complète

Consulter la documentation spécialisée selon vos besoins de développement ou d'administration.
