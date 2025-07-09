# 📚 Staka Livres - Plateforme de Correction de Manuscrits

## 🎯 Présentation du Projet

**Staka Livres** est une plateforme web moderne dédiée aux **services de correction et d'édition de manuscrits**. L'application offre une expérience complète aux auteurs, de la découverte des services jusqu'à la gestion avancée de leurs projets éditoriaux, avec un système d'authentification sécurisé, un espace d'administration complet et un **système de facturation automatique avec React Query**.

### 🌟 **Vision**

Démocratiser l'accès aux services éditoriaux professionnels en offrant une plateforme intuitive, transparente et efficace pour tous les auteurs, qu'ils soient débutants ou confirmés.

### 🎨 **Interface Moderne**

- **Landing Page production-ready** : 14 composants React (2400+ lignes) avec hook usePricing
- **Tarifs dynamiques** : Synchronisation temps réel admin → landing via React Query
- **Système d'authentification** sécurisé avec JWT
- **Page d'inscription** avec validation complète
- **Dashboard client** avec gestion complète des projets
- **Système de facturation** intelligent avec React Query et cache optimisé
- **Espace administrateur** moderne et intuitif avec mode démo professionnel
- **Design responsive** mobile-first avec animations fluides
- **UX premium** avec micro-interactions et feedback temps réel

### 🎨 **Landing Page Production-Ready (14 Composants)**

- **Architecture complète** : 14 composants React spécialisés (2400+ lignes total)
- **PricingCalculator dynamique** : Hook usePricing avec tarification depuis API et synchronisation temps réel
- **Packs dynamiques** : Construction intelligente des offres depuis tarifs actifs avec fallbacks
- **Composants majeurs** : Hero, Navigation sticky, Services, Packs, FAQ accordéon, Contact
- **Features avancées** : Widget WhatsApp flottant, formulaires validés, animations fluides
- **Mobile-first** : Design responsive avec micro-interactions optimisées
- **SEO optimisé** : Structure sémantique HTML5 production-ready
- **Hook personnalisé** : `usePricing.ts` avec React Query et cache intelligent 5 minutes
- **Navigation intelligente** : Détection scroll, menu mobile, sticky CTA bar
- **Tarifs dynamiques** : Synchronisation admin → landing sans rechargement

---

## 📚 **Documentation Technique Complète**

Le projet dispose d'une documentation exhaustive dans le dossier `docs/` couvrant tous les aspects techniques et fonctionnels :

### 🏗️ **Architecture et Développement**

- **[Guide Backend API](docs/README-backend.md)** : Documentation complète de l'API REST avec exemples et architecture technique
- **[Guide Frontend](docs/README-frontend.md)** : Architecture React, composants et patterns de développement
- **[Guide Base de Données](docs/Base-de-donnees-guide.md)** : Documentation exhaustive des 12 modèles Prisma, relations, optimisations et troubleshooting
- **[Guide Messagerie API](docs/MESSAGES_API_GUIDE.md)** : Architecture React Query, hooks spécialisés et performance
- **[Guide Tarifs Dynamiques](docs/TARIFS_DYNAMIQUES_INTEGRATION.md)** : Intégration React Query, cache intelligent, patterns et optimisations

### 👨‍💼 **Administration et Production**

- **[Guide Admin Complet](docs/ADMIN_COMPLETE_GUIDE.md)** : Vue d'ensemble espace admin, sécurité et mode démo
- **[Guide Admin Pages API](docs/ADMIN_PAGES_API.md)** : API complète pour gestion des pages statiques
- **[Guide Admin Pages Hooks](docs/ADMIN_PAGES_HOOKS_GUIDE.md)** : Hooks React Query spécialisés pour l'administration
- **[Guide Facturation Stripe](docs/BILLING_AND_INVOICES.md)** : Intégration paiements, webhooks et gestion des factures
- **[Guide Webhooks](docs/WEBHOOK_IMPLEMENTATION.md)** : Implémentation Stripe et gestion des événements

### 🔧 **Guides Techniques Spécialisés**

- **[Solutions Erreurs](docs/SOLUTION-ERREUR-504.md)** : Résolution des problèmes courants et optimisations
- **[Demo Espace Admin](docs/Demo-espace-admin.md)** : Guide d'utilisation du mode démonstration
- **[Tests Complets](docs/TESTS_README.md)** : Guide des tests unitaires, intégration et E2E
- **[Résumé Implémentation](docs/IMPLEMENTATION_SUMMARY.md)** : Vue d'ensemble technique du projet

### 📊 **Métriques et Validation**

- Tests Docker validés avec résultats de production
- Architecture backend complète avec 40+ endpoints
- Système de messagerie React Query (1000+ lignes de hooks optimisés)
- Module Admin complet production-ready avec 9 pages fonctionnelles

---

## 🔐 Fonctionnalités Développées

### 🚀 **Système d'Authentification Complet**

- **Inscription sécurisée** avec validation des données
- **Connexion JWT** avec tokens de 7 jours
- **Hachage bcrypt** des mots de passe (12 rounds)
- **Gestion des rôles** : USER, ADMIN, CORRECTOR
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
- **AdminUtilisateurs** : **✅ REFACTORISÉ COMPLET** - Architecture modulaire avec hooks personnalisés et composants réutilisables
  - **useAdminUsers** : Hook centralisé pour logique API et gestion d'états
  - **useDebouncedSearch** : Hook de recherche optimisée avec debounce
  - **UserTable** : Composant table générique avec accessibilité WCAG complète
  - **SearchAndFilters** : Composants de recherche et filtres avec états visuels
  - **ConfirmationModals** : Modales RGPD avec conséquences détaillées
- **AdminCommandes** : **✅ REFACTORISÉ COMPLET** - Suivi projets avec changement de statuts et modale de détails moderne
  - **CommandeDetailed** : Type étendu avec toutes les données (montant, priorité, fichiers, statistiques)
  - **Modale moderne XL** : Design gradient avec sections visuellement distinctes et actions rapides
  - **Backend enrichi** : Service `getCommandeById()` avec toutes les relations Prisma
- **AdminFactures** : Interface facturation avec téléchargement PDF et actions
- **AdminMessagerie** : Interface messagerie avancée avec hooks React Query spécialisés
- **AdminFAQ** : Gestion base de connaissance avec réorganisation
- **AdminTarifs** : Configuration prix et services avec calculs automatiques
- **AdminPages** : CMS pour pages statiques avec preview et SEO
- **AdminStatistiques** : Analytics avancées avec graphiques mockés
- **Design moderne** : Sidebar sombre, animations fluides, responsive
- **Module Admin Users** : Architecture backend complète (AdminUserService, AdminUserController)
- **Tests validés** : Tests Docker complets avec résultats de production
- **Mock data réalistes** : Données complètes prêtes pour API
- **Architecture API-ready** : Services facilement remplaçables
- **Composants réutilisables** : Génériques pour extension à d'autres projets Staka

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

### 💰 **Système de Tarifs Dynamiques avec React Query (2025)**

- **Hook usePricing()** : Hook principal avec React Query et cache intelligent 5 minutes
- **Synchronisation temps réel** : Admin → Landing Page sans rechargement
- **PricingCalculator dynamique** : Génération automatique des cartes tarifs depuis API
- **Packs dynamiques** : Construction intelligente des offres depuis tarifs actifs
- **Composants UI réutilisables** : `Loader` et `ErrorMessage` avec variants et retry
- **Gestion d'erreurs robuste** : Fallbacks automatiques sur données par défaut
- **Cache partagé** : Un seul appel API pour tous les composants landing
- **Invalidation intelligente** : `useTarifInvalidation()` pour synchronisation admin
- **Tests complets** : 10 tests unitaires + 5 tests E2E Cypress validés
- **Architecture production** : `queryKey: ["tarifs", "public"]` avec invalidation croisée
- **UX optimisée** : États de chargement, messages d'erreur, boutons retry
- **Performance** : Cache partagé, déduplication requêtes, background refresh

### 📊 **API Backend Robuste (40+ Endpoints)**

- **Routes d'authentification** : /auth/register, /auth/login, /auth/me
- **Routes admin utilisateurs** : **7 endpoints production** `/admin/users/*` avec CRUD complet et suppression RGPD
- **Routes admin commandes** : ✅ Module complet (GET /admin/commandes avec filtres, GET /admin/commandes/:id détaillé, PUT /admin/commandes/:id, DELETE /admin/commandes/:id)
- **Routes admin factures** : Gestion complète des factures avec PDF et actions
- **Routes admin FAQ** : CRUD complet pour base de connaissance
- **Routes admin tarifs** : Configuration dynamique des prix et services
- **Routes admin pages** : CMS pour pages statiques avec SEO
- **Routes client commandes** : POST /commandes, GET /commandes
- **Routes de facturation** : GET /invoices, GET /invoices/:id, GET /invoices/:id/download
- **Routes de paiement Stripe** : POST /payments/create-checkout-session, GET /payments/status, POST /payments/webhook
- **Routes messagerie** : API complète avec threading et support requests
- **Architecture backend** : Services avec méthodes statiques optimisées, Contrôleurs avec validation stricte
- **Sécurité production** : JWT Admin obligatoire, validation Zod, hashage bcrypt 12 rounds, protection dernier admin
- **Middleware de rôles** avec RequireAdmin
- **Gestion d'erreurs** centralisée avec logs
- **Données de fallback** en cas d'indisponibilité DB

### 🗄️ **Base de Données Complète (12 Modèles)**

- **User** : UUID, rôles (USER/ADMIN/CORRECTOR), statut actif, avatar, contacts
- **Commande** : statuts, priorités, échéances, notes client/correcteur
- **Message** : messagerie unifiée (projet + support) avec threading
- **MessageAttachment** : pièces jointes messages avec relations
- **SupportRequest** : tickets de support avec SLA et assignation
- **File** : système de fichiers avec types, permissions, sécurité
- **Invoice** : facturation automatique avec numérotation et PDF
- **PaymentMethod** : moyens de paiement Stripe avec chiffrement
- **Notification** : système de notifications avec types et priorités
- **Page** : CMS pour contenu éditorial avec SEO
- **FAQ** : Questions fréquemment posées avec catégorisation
- **Tarif** : ✅ Modèle de tarification flexible (NEW)

**Relations RGPD** : Cascade DELETE, contraintes FK, soft delete  
**Performance** : Index optimisés, requêtes type-safe Prisma  
**Documentation** : [Guide complet Base de Données](docs/Base-de-donnees-guide.md)

---

## 🏗️ Architecture Monorepo

### 📁 **Structure du Projet Mise à Jour**

```
Staka-livres/
├── backend/                 # API Node.js + Express + Prisma
│   ├── src/
│   │   ├── server.ts       # Point d'entrée principal
│   │   ├── app.ts          # Configuration Express
│   │   ├── controllers/    # Contrôleurs API (12 contrôleurs)
│   │   │   ├── authController.ts      # Authentification
│   │   │   ├── adminController.ts     # Administration générale
│   │   │   ├── adminUserController.ts # Gestion utilisateurs admin
│   │   │   ├── adminCommandeController.ts  # Gestion commandes admin
│   │   │   ├── adminFactureController.ts   # Gestion factures admin
│   │   │   ├── adminPageController.ts      # Gestion pages admin
│   │   │   ├── faqController.ts            # Gestion FAQ
│   │   │   ├── commandeClientController.ts # Commandes client
│   │   │   ├── commandeController.ts       # Commandes générales
│   │   │   ├── messagesController.ts       # Messagerie avancée
│   │   │   └── paymentController.ts        # Paiements Stripe
│   │   ├── routes/         # Routes Express (11 fichiers)
│   │   │   ├── auth.ts     # Routes authentification
│   │   │   ├── admin.ts    # Routes administration générale
│   │   │   ├── admin/      # Routes admin spécialisées (6 fichiers)
│   │   │   │   ├── users.ts       # Routes admin utilisateurs
│   │   │   │   ├── commandes.ts   # Routes admin commandes
│   │   │   │   ├── factures.ts    # Routes admin factures
│   │   │   │   ├── faq.ts         # Routes admin FAQ
│   │   │   │   ├── tarifs.ts      # Routes admin tarifs
│   │   │   │   └── pages.ts       # Routes admin pages
│   │   │   ├── commandes.ts # Routes commandes client
│   │   │   ├── invoice.ts  # Routes facturation
│   │   │   ├── payments.ts # Routes paiements Stripe
│   │   │   ├── messages.ts # Routes messagerie
│   │   │   ├── faq.ts      # Routes FAQ publiques
│   │   │   ├── pages.ts    # Routes pages statiques
│   │   │   └── tarifs.ts   # Routes tarifs publics
│   │   ├── middleware/     # Middlewares Express
│   │   │   ├── auth.ts     # Middleware JWT
│   │   │   └── requireRole.ts # Middleware rôles
│   │   ├── services/       # Services métier
│   │   │   ├── adminCommandeService.ts  # Service admin commandes
│   │   │   ├── adminUserService.ts      # Service admin utilisateurs
│   │   │   ├── stripeService.ts         # Service Stripe
│   │   │   ├── invoiceService.ts        # Service factures
│   │   │   └── pageService.ts           # Service pages
│   │   ├── utils/          # Utilitaires
│   │   │   ├── token.ts    # Gestion tokens JWT
│   │   │   └── mailer.ts   # Service email
│   │   ├── config/         # Configuration
│   │   └── types/          # Types TypeScript
│   ├── prisma/
│   │   ├── schema.prisma   # Schéma base de données (12 modèles)
│   │   ├── migrations/     # Migrations appliquées
│   │   └── seed.ts         # Données de test
│   ├── tests/              # Tests backend avec Jest
│   │   ├── unit/           # Tests unitaires
│   │   └── integration/    # Tests d'intégration
│   ├── package.json        # Dépendances backend
│   ├── Dockerfile          # Container backend
│   ├── nodemon.json        # Config nodemon
│   └── tsconfig.json       # Config TypeScript
├── frontend/                # Application React + Vite + React Query
│   ├── src/
│   │   ├── app.tsx         # App React principale
│   │   ├── main.tsx        # Point d'entrée avec QueryClientProvider
│   │   ├── components/     # Composants React
│   │   │   ├── admin/      # Composants administration (6 composants refactorisés)
│   │   │   │   ├── AdminLayout.tsx    # Layout admin moderne
│   │   │   │   ├── DemoModeProvider.tsx    # Mode démo (453 lignes)
│   │   │   │   ├── RequireAdmin.tsx        # Sécurité multi-niveaux
│   │   │   │   ├── StatCard.tsx       # Cartes statistiques
│   │   │   │   ├── CommandeStatusSelect.tsx # Sélecteur statut
│   │   │   │   ├── UserTable.tsx      # Table générique avec accessibilité WCAG (~400 lignes)
│   │   │   │   ├── SearchAndFilters.tsx   # Interface recherche et filtres (~300 lignes)
│   │   │   │   └── ConfirmationModals.tsx # Modales RGPD avec conséquences détaillées
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
│   │   │   │   ├── PricingCalculator.tsx   # Calculateur avancé (492 lignes)
│   │   │   │   ├── Navigation.tsx          # Navigation sticky (204 lignes)
│   │   │   │   ├── Hero.tsx                # Section hero (106 lignes)
│   │   │   │   ├── Services.tsx            # Services proposés (209 lignes)
│   │   │   │   ├── Packs.tsx               # Packs dynamiques (389 lignes)
│   │   │   │   ├── FAQ.tsx                 # FAQ accordéon (214 lignes)
│   │   │   │   ├── Contact.tsx             # Formulaire contact (244 lignes)
│   │   │   │   ├── About.tsx               # Section à propos (158 lignes)
│   │   │   │   ├── Blog.tsx                # Section blog (170 lignes)
│   │   │   │   ├── Excellence.tsx          # Section excellence (154 lignes)
│   │   │   │   ├── FreeSample.tsx          # Échantillon gratuit (330 lignes)
│   │   │   │   ├── Testimonials.tsx        # Témoignages (133 lignes)
│   │   │   │   ├── TrustIndicators.tsx     # Indicateurs confiance (61 lignes)
│   │   │   │   └── Footer.tsx              # Pied de page (306 lignes)
│   │   │   ├── modals/     # Modales
│   │   │   ├── messages/   # Architecture messagerie complète
│   │   │   │   ├── ConversationList.tsx   # Liste conversations
│   │   │   │   ├── MessageThread.tsx      # Thread de messages
│   │   │   │   └── MessageItem.tsx        # Affichage message
│   │   │   ├── project/    # Gestion projets
│   │   │   └── common/     # Composants communs
│   │   ├── hooks/          # Hooks React Query spécialisés (10 hooks)
│   │   │   ├── useInvoices.ts         # Hooks facturation (existant)
│   │   │   ├── useMessages.ts         # Messagerie client (654 lignes)
│   │   │   ├── useAdminMessages.ts    # Messagerie admin (321 lignes)
│   │   │   ├── useAdminUsers.ts       # Gestion centralisée utilisateurs admin (256 lignes)
│   │   │   ├── useAdminCommandes.ts   # Gestion commandes admin (355 lignes)
│   │   │   ├── useAdminFactures.ts    # Gestion factures admin (232 lignes)
│   │   │   ├── useAdminPages.ts       # Gestion pages admin (215 lignes)
│   │   │   ├── useDebouncedSearch.ts  # Hook de recherche optimisée avec debounce (83 lignes)
│   │   │   ├── useIntersectionObserver.ts # Pagination infinie (44 lignes)
│   │   │   └── useTarifInvalidation.ts    # Invalidation tarifs (78 lignes)
│   │   ├── pages/          # Pages React
│   │   │   ├── admin/      # Pages administration (9 pages complètes)
│   │   │   │   ├── AdminDashboard.tsx    # Tableau de bord avec KPIs (280 lignes)
│   │   │   │   ├── AdminUtilisateurs.tsx # Gestion CRUD utilisateurs (625 lignes)
│   │   │   │   ├── AdminCommandes.tsx    # Gestion commandes avec statuts (964 lignes)
│   │   │   │   ├── AdminFactures.tsx     # Interface facturation avancée (1177 lignes)
│   │   │   │   ├── AdminFAQ.tsx          # Gestion FAQ et base connaissance (1130 lignes)
│   │   │   │   ├── AdminTarifs.tsx       # Configuration prix et services (1229 lignes)
│   │   │   │   ├── AdminPages.tsx        # CMS pages statiques avec SEO (180 lignes)
│   │   │   │   ├── AdminStatistiques.tsx # Analytics et métriques avancées (394 lignes)
│   │   │   ├── BillingPage.tsx       # Page facturation React Query
│   │   │   ├── LoginPage.tsx         # Page connexion
│   │   │   ├── SignupPage.tsx        # Page inscription
│   │   │   ├── DashboardPage.tsx     # Dashboard client
│   │   │   ├── MessagesPage.tsx      # Page messagerie client
│   │   │   ├── ProjectsPage.tsx      # Page projets client
│   │   │   ├── FilesPage.tsx         # Page fichiers
│   │   │   ├── HelpPage.tsx          # Page aide
│   │   │   ├── ProfilPage.tsx        # Page profil utilisateur
│   │   │   ├── SettingsPage.tsx      # Page paramètres
│   │   │   ├── PaymentSuccessPage.tsx # Page succès paiement
│   │   │   ├── PaymentCancelPage.tsx  # Page annulation paiement
│   │   │   ├── LandingPage.tsx       # Page d'accueil
│   │   │   └── pages/                 # Pages dynamiques
│   │   │       └── [slug].tsx         # Pages statiques CMS
│   │   ├── contexts/       # Contextes React
│   │   │   └── AuthContext.tsx       # Contexte authentification
│   │   ├── utils/          # Utilitaires frontend
│   │   │   ├── auth.ts     # Utils authentification
│   │   │   ├── adminAPI.ts # API administration
│   │   │   ├── api.ts      # Services API factures
│   │   │   └── toast.ts    # Notifications toast
│   │   ├── types/          # Types TypeScript
│   │   │   ├── shared.ts      # Types partagés locaux avec CommandeDetailed
│   │   │   └── messages.ts    # Types messagerie
│   │   └── styles/         # Styles CSS globaux
│   ├── package.json        # Dépendances frontend + @tanstack/react-query@5.81.5
│   ├── Dockerfile          # Container frontend
│   ├── vite.config.ts      # Config Vite avec optimizeDeps
│   └── tailwind.config.js  # Config Tailwind
├── shared/                  # Types et utils partagés
│   ├── types/
│   │   └── index.ts        # Types communs compilés
│   ├── dist/               # Types compilés ES Module
│   ├── tsconfig.json       # Config compilation partagée
│   └── package.json        # Dépendances partagées
├── docs/                    # Documentation complète (15 fichiers)
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
- **Zod** : Validation de schémas TypeScript
- **PDFKit** : Génération de PDF pour factures
- **SendGrid** : Service d'envoi d'emails
- **AWS S3** : Stockage de fichiers

### 🎨 **Frontend (React + React Query)**

- **React 18** : Framework JavaScript moderne avec hooks
- **TypeScript** : Typage statique pour la robustesse
- **Vite** : Build tool ultra-rapide avec HMR et optimizeDeps
- **@tanstack/react-query v5** : Cache intelligent et gestion d'état serveur
- **Tailwind CSS** : Framework CSS utility-first
- **React Context API** : Gestion d'état authentification
- **React Router DOM** : Navigation SPA
- **Framer Motion** : Animations fluides et micro-interactions
- **FontAwesome** : Icônes vectorielles
- **React Dropzone** : Upload de fichiers drag & drop
- **Axios** : Client HTTP pour API calls
- **Vitest** : Framework de tests unitaires
- **Cypress** : Tests E2E automatisés

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

### ✅ **Version Actuelle (Janvier 2025)**

**🎯 Architecture Backend Complète (12 Contrôleurs + 40+ Endpoints) :**

- ✅ **12 contrôleurs spécialisés** : authController, adminController, adminUserController, adminCommandeController, adminFactureController, adminPageController, faqController, commandeClientController, commandeController, messagesController, paymentController
- ✅ **40+ endpoints REST** : Authentification, administration complète, commandes, factures, messagerie, paiements, FAQ, pages, tarifs
- ✅ **Services métier** : adminCommandeService, adminUserService, stripeService, invoiceService, pageService
- ✅ **Middleware de sécurité** : JWT, rôles, validation Zod
- ✅ **Tests complets** : Unitaires et intégration avec Jest
- ✅ **Logging avancé** : Winston avec niveaux et rotation

**🎯 Espace Admin Complet Finalisé (9 Pages Production-Ready) :**

- ✅ **AdminDashboard** : Vue d'ensemble avec KPIs et statistiques temps réel (280 lignes)
- ✅ **AdminUtilisateurs** : Gestion CRUD utilisateurs avec architecture modulaire (625 lignes)
- ✅ **AdminCommandes** : Suivi projets avec statuts et modale de détails moderne (964 lignes)
- ✅ **AdminFactures** : Interface facturation avancée avec PDF (1177 lignes)
- ✅ **AdminFAQ** : Gestion base de connaissance avec réorganisation (1130 lignes)
- ✅ **AdminTarifs** : Configuration prix et services avec calculs automatiques (1229 lignes)
- ✅ **AdminPages** : CMS pour pages statiques avec SEO (180 lignes)
- ✅ **AdminStatistiques** : Analytics et métriques avancées (394 lignes)
- ✅ **Composants réutilisables** : AdminLayout, DemoModeProvider, RequireAdmin, StatCard, UserTable, SearchAndFilters, ConfirmationModals

**🎯 Système de Messagerie Avancé (1000+ Lignes de Hooks) :**

- ✅ **useMessages.ts** : Hook principal 654 lignes avec 15+ hooks spécialisés
- ✅ **useAdminMessages.ts** : Hook admin 321 lignes avec 12+ hooks modération
- ✅ **MessagesPage.tsx** : Interface client avec optimistic updates et cache intelligent
- ✅ **AdminMessagerie.tsx** : Interface admin avec filtres, recherche, actions masse
- ✅ **API complète** : Messages avec threading, support requests, métadonnées avancées
- ✅ **Performance** : Pagination infinie, invalidation croisée, retry automatique

**💰 Système de Tarifs Dynamiques Complet (2025) :**

- ✅ **Hook usePricing()** : Intégration React Query avec cache 5 minutes et invalidation automatique
- ✅ **PricingCalculator refactorisé** : Génération dynamique des cartes tarifs depuis API (492 lignes)
- ✅ **Packs refactorisé** : Construction intelligente des offres depuis tarifs actifs avec fallbacks (389 lignes)
- ✅ **Synchronisation temps réel** : Admin → Landing Page sans rechargement via invalidation cache
- ✅ **useTarifInvalidation()** : Hook spécialisé pour synchronisation admin avec méthodes avancées
- ✅ **Tests complets** : 10 tests Vitest + 5 tests E2E Cypress validés
- ✅ **Architecture production** : `queryKey: ["tarifs", "public"]` avec cache partagé et déduplication

**🎨 Landing Page Production-Ready (14 Composants - 2400+ Lignes) :**

- ✅ **14 composants React spécialisés** : Hero, Navigation, Services, Packs, FAQ, Contact, About, Blog, Excellence, FreeSample, Testimonials, TrustIndicators, Footer
- ✅ **Hook usePricing.ts** : Tarification dynamique avec React Query (440 lignes)
- ✅ **PricingCalculator** : Calculateur avancé avec génération automatique (492 lignes)
- ✅ **Navigation sticky** : Détection scroll, menu mobile, sticky CTA bar (204 lignes)
- ✅ **Design responsive** : Mobile-first avec micro-interactions optimisées
- ✅ **SEO optimisé** : Structure sémantique HTML5 production-ready
- ✅ **Performance** : Cache partagé, déduplication requêtes, background refresh

**🗄️ Base de Données Complète (12 Modèles) :**

- ✅ **12 modèles de données complets** : User, Commande, File, Message, MessageAttachment, SupportRequest, PaymentMethod, Invoice, Notification, Page, FAQ, Tarif
- ✅ **Schéma Prisma robuste** : Relations RGPD, contraintes FK, index performance
- ✅ **Migrations corrigées** : Déploiement automatique sans erreurs
- ✅ **Support Request Integration** : Messagerie unifiée projet + support
- ✅ **Documentation complète** : Guide détaillé dans `docs/Base-de-donnees-guide.md`

**🔧 Infrastructure Docker Stabilisée :**

- ✅ Configuration MySQL 8.4+ corrigée (`--mysql-native-password=ON`)
- ✅ Base de données persistante avec migrations automatiques
- ✅ Prisma Studio accessible sur port 5555
- ✅ Variables d'environnement sécurisées

**🚀 Intégration Stripe Complète :**

- ✅ API de paiement fonctionnelle avec sessions Stripe
- ✅ Prix dynamique sans dépendance aux produits pré-créés
- ✅ Webhooks configurés pour mise à jour automatique des statuts
- ✅ Gestion des erreurs et logging complet

**📊 Données de Test Opérationnelles :**

- ✅ Seed automatique avec comptes admin/user/correcteur
- ✅ Commandes de test avec différents statuts de paiement
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

# SendGrid (optionnel)
SENDGRID_API_KEY="VOTRE_CLE_SENDGRID"

# AWS S3 (optionnel)
AWS_ACCESS_KEY_ID="VOTRE_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="VOTRE_SECRET_KEY"
AWS_REGION="eu-west-3"
AWS_S3_BUCKET="staka-livres-files"
```

**4. Installation et démarrage :**

```bash
# Installation des dépendances
npm run install:all

# Démarrage avec Docker (recommandé)
npm run docker:dev

# Ou démarrage local
npm run dev
```

**5. Accès aux services :**

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Prisma Studio** : http://localhost:5555
- **Base de données** : localhost:3306

### 🧪 **Tests et Validation**

```bash
# Tests backend
npm run test:backend

# Tests frontend
cd frontend && npm run test

# Tests E2E Cypress
cd frontend && npm run test:e2e

# Linting
npm run lint --workspace=frontend
```

**Consulter la documentation spécialisée selon vos besoins de développement ou d'administration.**
