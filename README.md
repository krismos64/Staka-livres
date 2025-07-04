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

## 📚 **Documentation Technique Complète**

Le projet dispose d'une documentation exhaustive dans le dossier `docs/` couvrant tous les aspects techniques et fonctionnels :

### 🏗️ **Architecture et Développement**

- **[Guide Backend API](docs/README-backend.md)** : Documentation complète de l'API REST avec exemples et architecture technique
- **[Guide Components](docs/README-components.md)** : Documentation des composants React avec patterns et bonnes pratiques
- **[Guide Pages](docs/README-pages.md)** : Architecture des pages avec détails d'implémentation et flows utilisateur
- **[Guide Landing Page](docs/README-landingpage.md)** : Documentation des 14 composants marketing et hooks spécialisés
- **[Guide Styles](docs/README-style.md)** : Système de design, Tailwind CSS et guidelines visuelles

### 🗄️ **Base de Données et Intégrations**

- **[Guide Base de Données](docs/Base-de-donnees-guide.md)** : Documentation exhaustive des 11 modèles Prisma, relations, optimisations et troubleshooting
- **[Guide Messagerie API](docs/MESSAGES_API_GUIDE.md)** : Architecture React Query, hooks spécialisés et performance
- **[Guide React Query](docs/README-REACT-QUERY.md)** : Intégration cache intelligent, patterns et optimisations

### 👨‍💼 **Administration et Production**

- **[Guide Admin Complet](docs/ADMIN_COMPLETE_GUIDE.md)** : Vue d'ensemble espace admin, sécurité et mode démo
- **[Guide Admin Users Production](docs/INTEGRATION_ADMIN_USERS_COMPLETE.md)** : Module CRUD complet avec backend opérationnel et tests Docker
- **[Guide Facturation Stripe](docs/BILLING_README.md)** : Intégration paiements, webhooks et gestion des factures
- **[Guide Système de Factures](docs/INVOICE_SYSTEM.md)** : Architecture facturation automatique et PDF
- **[Guide Webhooks](docs/WEBHOOK_IMPLEMENTATION.md)** : Implémentation Stripe et gestion des événements

### 🔧 **Guides Techniques Spécialisés**

- **[Solutions Erreurs](docs/SOLUTION-ERREUR-504.md)** : Résolution des problèmes courants et optimisations
- **[Demo Espace Admin](docs/Demo-espace-admin.md)** : Guide d'utilisation du mode démonstration

### 📊 **Métriques et Validation**

- Tests Docker validés avec résultats de production
- Architecture backend complète avec 35+ endpoints
- Système de messagerie React Query (1000+ lignes de hooks optimisés)
- Module Admin Users production-ready avec suppression RGPD

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
- **AdminLogs** : Timeline d'audit avec filtres et métadonnées
- **Design moderne** : Sidebar sombre, animations fluides, responsive
- **Module Admin Users** : Architecture backend complète (AdminUserService, AdminUserController)
- **Tests validés** : Tests Docker complets avec résultats de production
- **Mock data réalistes** : Données complètes prêtes pour API
- **Architecture API-ready** : Services facilement remplaçables
- **Composants réutilisables** : Génériques pour extension à d'autres projets Staka

📖 **Documentation technique complète** : [Guide Admin Users Production](docs/INTEGRATION_ADMIN_USERS_COMPLETE.md)

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
- **Routes admin utilisateurs** : **7 endpoints production** `/admin/users/*` avec CRUD complet et suppression RGPD
- **Routes admin commandes** : ✅ Module complet (GET /admin/commandes avec filtres, GET /admin/commandes/:id détaillé, PUT /admin/commandes/:id, DELETE /admin/commandes/:id)
- **Routes client commandes** : POST /commandes, GET /commandes
- **Routes de facturation** : GET /invoices, GET /invoices/:id, GET /invoices/:id/download
- **Routes de paiement Stripe** : POST /payments/create-checkout-session, GET /payments/status, POST /payments/webhook
- **Architecture backend** : AdminUserService avec méthodes statiques optimisées, AdminUserController avec validation stricte
- **Sécurité production** : JWT Admin obligatoire, validation Joi, hashage bcrypt 12 rounds, protection dernier admin
- **Middleware de rôles** avec RequireAdmin
- **Gestion d'erreurs** centralisée avec logs
- **Données de fallback** en cas d'indisponibilité DB

📖 **Documentation API complète** : [Guide Backend](docs/README-backend.md)

### 🗄️ **Base de Données Complète (11 Modèles)**

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
│   │   ├── controllers/    # Contrôleurs API
│   │   │   ├── authController.ts      # Authentification
│   │   │   ├── adminController.ts     # Administration
│   │   │   ├── adminCommandeController.ts  # ✅ Gestion commandes admin (NEW)
│   │   │   ├── commandeClientController.ts # Commandes client
│   │   │   └── paymentController.ts   # Paiements Stripe
│   │   ├── routes/         # Routes Express
│   │   │   ├── auth.ts     # Routes authentification
│   │   │   ├── admin.ts    # Routes administration
│   │   │   ├── admin/
│   │   │   │   ├── commandes.ts # ✅ Routes admin commandes (NEW)
│   │   │   │   ├── users.ts    # ✅ Routes admin utilisateurs (NEW)
│   │   │   │   ├── factures.ts # ✅ Routes admin factures (NEW)
│   │   │   │   ├── faq.ts      # ✅ Routes admin FAQ (NEW)
│   │   │   │   └── tarifs.ts   # ✅ Routes admin tarifs (NEW)
│   │   │   ├── commandes.ts # Routes commandes client
│   │   │   ├── invoice.ts  # Routes facturation
│   │   │   └── payments.ts # Routes paiements Stripe
│   │   ├── middleware/     # Middlewares Express
│   │   │   ├── auth.ts     # Middleware JWT
│   │   │   └── requireRole.ts # Middleware rôles
│   │   ├── services/       # Services métier
│   │   │   ├── adminCommandeService.ts  # ✅ Service admin commandes (NEW)
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
│   │   ├── unit/           # Tests unitaires
│   │   │   └── adminCommandeService.test.ts  # ✅ Tests service (13 tests)
│   │   └── integration/    # Tests d'intégration
│   │       └── adminCommandeEndpoints.test.ts # ✅ Tests endpoints (15 tests)
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
│   │   │   ├── useAdminUsers.ts       # Gestion centralisée utilisateurs admin (~400 lignes)
│   │   │   ├── useDebouncedSearch.ts  # Hook de recherche optimisée avec debounce
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
│   │   │   ├── shared.ts      # Types partagés locaux avec CommandeDetailed
│   │   │   └── messages.ts    # Types messagerie
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

### ✅ **Version Actuelle (Janvier 2025)**

**🎯 Module AdminCommandes Complet Développé :**

- ✅ **AdminCommandeService** : Service complet avec méthodes `getCommandes()` et `getCommandeById()` incluant filtres avancés, calcul de statistiques par statut, et récupération détaillée avec toutes les relations
- ✅ **AdminCommandeController** : Contrôleur avec gestion d'erreurs complète, validation des entrées et logs de debugging
- ✅ **Routes AdminCommandes** : 4 endpoints REST protégés (`GET /admin/commandes`, `GET /admin/commandes/:id`, `PUT /admin/commandes/:id`, `DELETE /admin/commandes/:id`)
- ✅ **Tests complets** : 13 tests unitaires + 15 tests d'intégration validés avec authentification JWT et autorisation ADMIN
- ✅ **Logs de debugging** : Système complet de logs pour traçabilité des requêtes et filtres appliqués
- ✅ **Modale de détails moderne** : Interface XL avec design élégant, toutes les données disponibles et actions rapides

**🗄️ Base de Données Complète Opérationnelle :**

- ✅ **11 modèles de données complets** : User, Commande, File, Message, SupportRequest, PaymentMethod, Invoice, Notification, Page, MessageAttachment, Tarif
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

**🔧 Résolution Problèmes Frontend :**

- ✅ Configuration `optimizeDeps` dans vite.config.ts
- ✅ Force re-optimization des dépendances React Query
- ✅ Nettoyage cache Vite automatique
- ✅ Build TypeScript fonctionnel sans erreurs
- ✅ **Correction Tailwind CDN** : Suppression du CDN en faveur de PostCSS avec configuration personnalisée
- ✅ **Résolution "exports is not defined"** : Configuration modules ES6 pour types partagés
- ✅ **Types partagés optimisés** : Utilisation directe des fichiers TypeScript source

**🚀 Performance et UX Optimisées :**

- ✅ Navigation instantanée grâce au cache React Query
- ✅ Background refresh silencieux des données
- ✅ Retry automatique et déduplication des requêtes
- ✅ Toasts d'erreurs intelligents et EmptyState
- ✅ Disabled states pour boutons pendant chargement

**🏗️ Refactorisation AdminUtilisateurs Complète (2025) :**

- ✅ **Architecture modulaire** : 5 nouveaux composants/hooks réutilisables créés
- ✅ **useAdminUsers.ts** : Hook centralisé pour logique API et gestion d'états (~400 lignes)
- ✅ **useDebouncedSearch.ts** : Hook de recherche optimisée avec debounce configurable
- ✅ **UserTable.tsx** : Composant table générique avec accessibilité WCAG 2.1 complète
- ✅ **SearchAndFilters.tsx** : Interface de recherche et filtres avec UX optimisée
- ✅ **ConfirmationModals.tsx** : Modales RGPD avec conséquences détaillées
- ✅ **Performance optimisée** : Réduction 80% appels API, mises à jour optimistes, cache intelligent
- ✅ **Accessibilité native** : Navigation clavier, rôles ARIA, screen readers, focus management
- ✅ **TypeScript strict** : Interfaces complètes et typage robuste pour maintenance
- ✅ **Composants génériques** : Réutilisables pour autres entités (commandes, factures, messages)

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

# Linting ESLint
npm run lint --workspace=frontend

**Consulter la documentation spécialisée selon vos besoins de développement ou d'administration.**
```
