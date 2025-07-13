# 📚 Staka Livres - Plateforme de Correction de Manuscrits

## 🎯 Présentation du Projet

**Staka Livres** est une plateforme web moderne et production-ready dédiée aux **services de correction et d'édition de manuscrits**. Cette application monorepo sophistiquée offre une expérience complète aux auteurs, de la découverte des services jusqu'à la gestion avancée de leurs projets éditoriaux, avec un système d'authentification sécurisé, un espace d'administration complet et un **système de facturation automatique avec React Query**.

### 📊 **Métriques du Projet (Juillet 2025)**

- **200,000+ lignes de code** TypeScript/JavaScript
- **130+ composants React** modulaires et réutilisables avec TypeScript
- **20+ contrôleurs backend** spécialisés (dont consultationController)
- **54+ endpoints REST API** sécurisés avec Zod validation
- **13 modèles de base de données** avec relations RGPD complètes
- **Système d'audit sécurisé** avec traçabilité complète et export
- **200+ tests automatisés** (Jest, Vitest, Cypress)
- **16+ guides de documentation** complets et à jour (dont CONSULTATION_BOOKING_GUIDE.md)
- **87%+ de couverture de tests** validée
- **10 pages admin** entièrement fonctionnelles
- **14+ composants landing page** production-ready
- **Support multi-architecture** Docker (ARM64/x86)

### 🌟 **Vision**

Démocratiser l'accès aux services éditoriaux professionnels en offrant une plateforme intuitive, transparente et efficace pour tous les auteurs, qu'ils soient débutants ou confirmés.

### 🏆 **Caractéristiques Clés**

- **Architecture monorepo** moderne avec TypeScript
- **Système d'authentification JWT** avec rôles (USER/ADMIN/CORRECTOR)
- **Paiements Stripe** avec synchronisation automatique et génération de factures PDF
- **Messagerie temps réel** avec pièces jointes, archivage et support unifié
- **Upload de fichiers projet** avec S3 presigned URLs et suivi de progression
- **Notifications push** avec polling intelligent temps réel
- **Interface admin complète** avec 10 pages spécialisées et audit logs
- **Système d'audit sécurisé** avec logs admin et traçabilité complète
- **Tarification dynamique** avec synchronisation Stripe automatique et cache React Query
- **Synchronisation Stripe automatique** pour tous les tarifs avec script CLI
- **Conformité RGPD** avec suppression en cascade et export de données
- **Infrastructure Docker multi-architecture** avec MySQL 8 et support ARM64/x86
- **Tests complets** avec couverture 87%+ et CI/CD
- **Support multi-plateforme** avec build Docker optimisé ARM64 et x86

### 🎨 **Interface Moderne**

- **Landing Page production-ready** : 14 composants React (2400+ lignes) avec hook usePricing
- **Tarifs dynamiques** : Synchronisation temps réel admin → landing → Stripe via React Query
- **Système d'authentification** sécurisé avec JWT
- **Page d'inscription** avec validation complète
- **Dashboard client** avec gestion complète des projets
- **Système de facturation** intelligent avec React Query et cache optimisé
- **Espace administrateur** moderne et intuitif avec mode démo professionnel
- **Système de notifications** temps réel pour clients et administrateurs
- **Système d'audit complet** avec interface dédiée pour supervision sécuritaire
- **Design responsive** mobile-first avec animations fluides
- **UX premium** avec micro-interactions et feedback temps réel

### 🔐 **Système d'Audit Sécurisé (NOUVEAU)**

- **Traçabilité complète** : Tous les logs d'administration enregistrés automatiquement
- **Interface dédiée** : Page `/admin/audit-logs` avec filtres avancés et pagination
- **Niveaux de sévérité** : LOW, MEDIUM, HIGH, CRITICAL avec codes couleur
- **Types de cibles** : user, command, invoice, payment, file, auth, system
- **Export sécurisé** : CSV et JSON avec filtres appliqués
- **RBAC strict** : Accès exclusif aux administrateurs avec authentification multi-niveaux
- **Recherche avancée** : Par admin, action, date, sévérité avec debouncing
- **API sécurisée** : 4 endpoints avec logging des accès aux logs
- **Nettoyage automatique** : Rétention configurable avec confirmation

### 🔔 **Système de Notifications Temps Réel**

- **Notifications en temps réel** : Polling automatique toutes les 15 secondes
- **Cloches intelligentes** : Badges avec compteurs non-lus et détection admin/client
- **Menu déroulant moderne** : Actions rapides (lire, supprimer, naviguer)
- **Pages dédiées** : Interface complète avec filtres et pagination
- **Génération automatique** : Messages, paiements, inscriptions, événements système
- **Types spécialisés** : INFO, SUCCESS, WARNING, ERROR, PAYMENT, ORDER, MESSAGE, SYSTEM
- **UX professionnelle** : Animations Framer Motion et design responsive
- **API sécurisée** : `/notifications` avec authentification et rôles

### 💬 **Système de Messagerie Temps Réel (OPTIMISÉ 2025)**

- **Architecture thread-based** : Conversations persistantes par utilisateur avec threading avancé
- **Support multi-rôles** : Visiteurs, clients connectés et administrateurs dans un système unifié
- **Pièces jointes avancées** : Upload multi-fichiers avec validation stricte (max 10 fichiers, 50MB/fichier, 100MB total)
- **Notifications automatiques** : Génération bidirectionnelle pour chaque message avec liens d'action
- **États intelligents** : Marquage lu/non-lu, archivage/désarchivage, épinglage et suppression logique
- **Pagination optimisée** : Récupération efficace avec limit/offset et tri chronologique
- **Sécurité renforcée** : Validation UUID, contrôle propriété fichiers, audit logs complets
- **6 endpoints REST** : API complète avec authentification JWT et RBAC granulaire
- **Performance** : < 100ms récupération conversations, cache React Query intelligent
- **Score de fiabilité** : 97/100 après optimisations (Janvier 2025)

### 📁 **Système d'Upload de Fichiers Projet (2025)**

- **Intégration S3 complète** : URLs présignées pour upload direct avec authentification sécurisée
- **Interface moderne** : Composants FileItem et UploadButton avec drag & drop intuitif
- **Suivi de progression** : Barre de progression temps réel avec gestion d'erreurs avancée
- **Hooks React Query** : `useUploadFile` et `useProjectFiles` avec cache intelligent 30 secondes
- **Validation stricte** : Max 20 Mo par fichier, types MIME autorisés (PDF, DOC, DOCX, TXT, JPG, PNG, ZIP, RAR)
- **Gestion d'état avancée** : Téléchargement, suppression, invalidation cache automatique
- **Sécurité renforcée** : Validation ownership projet, contrôle accès utilisateur avec audit
- **API REST complète** : 3 endpoints sécurisés avec Zod validation et gestion d'erreurs
- **Tests complets** : Mock S3, couverture ≥90% avec scénarios edge cases
- **Mode simulation** : Fonctionnement sans AWS pour développement local
- **Support Nginx** : Proxy API avec routing optimisé et cache statique

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
- **[Guide Génération PDF Factures](docs/PDF_INVOICE_GENERATION.md)** : Génération PDF professionnelle, stockage S3 sécurisé et téléchargement optimisé
- **[Guide Messagerie API](docs/MESSAGES_API_GUIDE.md)** : Architecture React Query, hooks spécialisés et performance
- **[Guide Tarifs Dynamiques](docs/TARIFS_DYNAMIQUES_INTEGRATION.md)** : Intégration React Query, cache intelligent, patterns et optimisations

### 👨‍💼 **Administration et Production**

- **[Guide Admin Unifié](docs/ADMIN_GUIDE_UNIFIED.md)** : Vue d'ensemble espace admin, sécurité et mode démo
- **[Guide Facturation Stripe](docs/BILLING_AND_INVOICES.md)** : Intégration paiements, webhooks, moyens de paiement et statistiques
- **[Guide Webhooks](docs/WEBHOOK_IMPLEMENTATION.md)** : Implémentation Stripe et gestion des événements

### 🔧 **Guides Techniques Spécialisés**

- **[Solutions Erreurs](docs/SOLUTION-ERREUR-504.md)** : Résolution des problèmes courants et optimisations
- **[Demo Espace Admin](docs/Demo-espace-admin.md)** : Guide d'utilisation du mode démonstration
- **[Tests Complets](docs/TESTS_README.md)** : Guide des tests unitaires, intégration et E2E
- **[Résumé Implémentation](docs/IMPLEMENTATION_SUMMARY.md)** : Vue d'ensemble technique du projet

### 📊 **Métriques et Validation**

- Tests Docker validés avec résultats de production
- Architecture backend complète avec 13 contrôleurs + 49+ endpoints
- Système de messagerie React Query (1000+ lignes de hooks optimisés)
- Module Admin complet production-ready avec 10 pages fonctionnelles
- Système d'audit sécurisé avec traçabilité complète
- Système de tarifs dynamiques avec synchronisation temps réel
- Système de notifications temps réel avec génération automatique

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

### 🔐 **Système d'Audit Sécurisé (NOUVEAU 2025)**

- **API Backend complète** : Controller `/admin/audit` avec 4 endpoints sécurisés (420 lignes)
- **Hooks React Query** : `useAdminAuditLogs`, `useAdminAuditStats`, `useExportAuditLogs`, `useCleanupAuditLogs`
- **Interface dédiée** : Page `AdminAuditLogs.tsx` avec filtres avancés et pagination (350+ lignes)
- **Base de données** : Modèle `AuditLog` avec enums de sévérité et types de cibles
- **Traçabilité complète** : Enregistrement automatique de toutes les actions admin
- **Niveaux de sévérité** : LOW, MEDIUM, HIGH, CRITICAL avec codes couleur
- **Types de cibles** : user, command, invoice, payment, file, auth, system
- **Filtrage avancé** : Par admin, action, date, sévérité avec recherche debounced
- **Export sécurisé** : CSV et JSON avec filtres appliqués et téléchargement automatique
- **RBAC strict** : Accès exclusif aux administrateurs avec validation multi-niveaux
- **Nettoyage automatique** : Rétention configurable avec confirmation obligatoire
- **Logging des accès** : Même l'accès aux logs est audité pour sécurité maximale

### 🔔 **Système de Notifications Temps Réel**

- **API Backend** : Controller `/notifications` avec 6 endpoints sécurisés
- **Hooks React Query** : `useNotifications`, `useNotificationBell`, `useMarkAsRead`, `useDeleteNotification`
- **Composants UI** : Cloches intelligentes avec badges et menus déroulants
- **Pages dédiées** : Interface complète client et admin avec filtres et pagination
- **Génération automatique** : Messages, paiements, inscriptions, événements système
- **Types spécialisés** : INFO, SUCCESS, WARNING, ERROR, PAYMENT, ORDER, MESSAGE, SYSTEM
- **Polling temps réel** : Refresh automatique toutes les 15 secondes
- **UX moderne** : Animations Framer Motion, responsive design, états de chargement
- **Sécurité** : Authentification requise, isolation utilisateurs, validation rôles

### 💳 **Système de Facturation Automatique avec PDF (React Query)**

- **API complète** : `fetchInvoices()`, `fetchInvoice()`, `downloadInvoice()` avec auth
- **Hooks React Query** : `useInvoices()`, `useInvoice()`, `useInvalidateInvoices()`
- **Cache intelligent** : 5-10 minutes avec invalidation automatique
- **États optimisés** : `isLoading`, `isFetching`, `error` gérés automatiquement
- **Pagination fluide** : `keepPreviousData` pour éviter les blancs UI
- **Génération PDF avancée** : Service pdf-lib v1.17.1 avec design professionnel A4 portrait
- **Stockage S3 sécurisé** : URLs signées 30 jours, ACL privé, metadata complète
- **Download endpoints** : `/admin/factures/:id/pdf` et `/admin/factures/:id/download`
- **Optimisation performance** : Cache S3, génération à la demande, background upload
- **Templates PDF** : Logo entreprise, informations client, tableau détaillé, totaux HT/TVA/TTC
- **Téléchargement direct** : Headers PDF corrects, nom de fichier formaté
- **Gestion d'erreurs** : Retry automatique et toasts informatifs
- **Performance** : Navigation instantanée grâce au cache

### 📞 **Système de Réservation de Consultations (NOUVEAU JUILLET 2025)**

- **API 4 endpoints** : POST /consultations/book (public), GET /available-slots (public), GET /requests (admin), PUT /requests/:id (admin)
- **Intégration double** : Landing page (section dédiée) + Espace client (bouton "Planifier un appel")
- **Modal ultra-simplifiée** : Nom, prénom, email, téléphone, date, heure, message optionnel
- **Workflow automatisé** : Soumission → Message admin → Notification → Confirmation email manuelle
- **Validation robuste** : Schema Zod côté backend, validation temps réel côté frontend
- **Base de données** : Nouveau type CONSULTATION_REQUEST, métadonnées JSON structurées
- **Hook React Query** : `useBookConsultation()` avec gestion d'erreurs et toasts
- **UX optimisée** : Sélection créneaux (7 jours ouvrés), états loading/succès, responsive design
- **Gestion admin** : Demandes visibles dans messagerie avec toutes les informations contextuelles
- **Documentation complète** : Guide détaillé CONSULTATION_BOOKING_GUIDE.md (650+ lignes)

### 💳 **Système de Moyens de Paiement et Statistiques (NOUVEAU 2025)**

- **API 3 endpoints** : GET /payment-methods, PUT /:id/default, DELETE /:id
- **Synchronisation Stripe** : Gestion customer.invoice_settings.default_payment_method
- **Hooks React Query** : `usePaymentMethods()`, `useSetDefaultPaymentMethod()`, `useDeletePaymentMethod()`
- **Cache intelligent** : 2 minutes pour cartes, invalidation automatique sur mutations
- **UX optimisée** : Boutons "Définir par défaut" + "Supprimer" avec confirmations
- **Sécurité renforcée** : Validation UUID, vérification propriété, soft delete
- **API Statistiques annuelles** : GET /stats/annual?year=YYYY avec agrégation
- **Calculs automatiques** : Dépenses (sum), pages corrigées (estimation), commandes (count)
- **Statut VIP automatique** : > 1000€ = 5% réduction avec message personnalisé
- **BillingPage mise à jour** : Suppression mocks, données réelles Stripe + stats live
- **Tests complets** : 200+ lignes de tests unitaires avec stubs Stripe
- **Documentation complète** : OpenAPI, BILLING_AND_INVOICES.md mis à jour

### 👨‍💼 **Espace Administrateur Complet (10 Pages)**

- **AdminDashboard** : Vue d'ensemble avec KPIs et statistiques temps réel (118 lignes)
- **AdminUtilisateurs** : **✅ REFACTORISÉ COMPLET** - Architecture modulaire avec hooks personnalisés et composants réutilisables (625 lignes)
  - **useAdminUsers** : Hook centralisé pour logique API et gestion d'états (263 lignes)
  - **useDebouncedSearch** : Hook de recherche optimisée avec debounce (83 lignes)
  - **UserTable** : Composant table générique avec accessibilité WCAG complète (541 lignes)
  - **SearchAndFilters** : Composants de recherche et filtres avec états visuels (370 lignes)
  - **ConfirmationModals** : Modales RGPD avec conséquences détaillées
- **AdminCommandes** : **✅ REFACTORISÉ COMPLET** - Suivi projets avec changement de statuts et modale de détails moderne (964 lignes)
  - **CommandeDetailed** : Type étendu avec toutes les données (montant, priorité, fichiers, statistiques)
  - **Modale moderne XL** : Design gradient avec sections visuellement distinctes et actions rapides
  - **Backend enrichi** : Service `getCommandeById()` avec toutes les relations Prisma
- **AdminFactures** : Interface facturation avec téléchargement PDF et actions (1177 lignes)
- **AdminMessagerie** : Interface messagerie avancée avec hooks React Query spécialisés (215 lignes)
- **AdminFAQ** : Gestion base de connaissance avec réorganisation (1130 lignes)
- **AdminTarifs** : Configuration prix et services avec calculs automatiques (1233 lignes)
- **AdminPages** : CMS pour pages statiques avec preview et SEO (180 lignes)
- **AdminStatistiques** : **✅ REFAIT COMPLET** - Interface simple, production-ready avec données réelles (235 lignes)
  - **API sécurisée** : `/admin/stats` avec calculs Prisma et évolutions vs mois précédent
  - **Hook React Query** : Refresh automatique toutes les 30 secondes
  - **Design moderne** : Métriques essentielles avec indicateurs d'évolution colorés
  - **Derniers paiements** : Tableau avec détails clients et montants formatés
  - **Pas de données mockées** : Tout depuis la vraie base MySQL
- **AdminAuditLogs** : **✅ NOUVEAU COMPLET** - Interface sécurisée pour supervision des activités (350+ lignes)
  - **API sécurisée** : `/admin/audit` avec 4 endpoints et logging des accès
  - **Hook React Query** : `useAdminAuditLogs` avec cache 30s et invalidation
  - **Filtres avancés** : Par admin, action, sévérité, date avec recherche debounced
  - **Export complet** : CSV/JSON avec téléchargement automatique et filtres appliqués
  - **RBAC strict** : Protection multi-niveaux avec vérification côté frontend et backend
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

### 📊 **API Backend Robuste (12 Contrôleurs + 40+ Endpoints)**

- **Routes d'authentification** : /auth/register, /auth/login, /auth/me
- **Routes admin utilisateurs** : **7 endpoints production** `/admin/users/*` avec CRUD complet et suppression RGPD
- **Routes admin commandes** : ✅ Module complet (GET /admin/commandes avec filtres, GET /admin/commandes/:id détaillé, PUT /admin/commandes/:id, DELETE /admin/commandes/:id)
- **Routes admin factures** : Gestion complète des factures avec PDF et actions
- **Routes admin FAQ** : CRUD complet pour base de connaissance
- **Routes admin tarifs** : Configuration dynamique des prix et services
- **Routes admin pages** : CMS pour pages statiques avec SEO
- **Routes admin statistiques** : ✅ **API `/admin/stats`** avec calculs réels Prisma et évolutions
- **Routes notifications** : ✅ **API `/notifications`** complète avec 6 endpoints sécurisés
- **Routes client commandes** : POST /commandes, GET /commandes
- **Routes de facturation** : GET /invoices, GET /invoices/:id, GET /invoices/:id/download
- **Routes de paiement Stripe** : POST /payments/create-checkout-session, GET /payments/status, POST /payments/webhook
- **Routes messagerie** : API complète avec threading et support requests
- **Routes consultations** : ✅ **API `/consultations`** avec 4 endpoints (réservation publique, gestion admin, créneaux) (NOUVEAU)
- **Routes FAQ publiques** : GET /faq pour base de connaissance
- **Routes pages statiques** : GET /pages/:slug pour CMS
- **Routes tarifs publics** : GET /tarifs pour landing page
- **Routes admin audit** : ✅ **API `/admin/audit`** complète avec 4 endpoints sécurisés
- **Architecture backend** : 14 contrôleurs spécialisés avec services métier optimisés (dont consultationController)
- **Sécurité production** : JWT Admin obligatoire, validation Zod, hashage bcrypt 12 rounds, protection dernier admin
- **Middleware de rôles** avec RequireAdmin
- **Gestion d'erreurs** centralisée avec logs
- **Données de fallback** en cas d'indisponibilité DB

### 🗄️ **Base de Données Complète (13 Modèles Prisma)**

- **User** : UUID, rôles (USER/ADMIN/CORRECTOR), statut actif, avatar, contacts
- **Commande** : statuts, priorités, échéances, notes client/correcteur
- **File** : système de fichiers avec types, permissions, sécurité S3
- **Message** : messagerie unifiée (projet + support + consultations) avec threading et métadonnées JSON
- **MessageAttachment** : pièces jointes messages avec relations sécurisées
- **SupportRequest** : tickets de support avec SLA et assignation
- **Invoice** : facturation automatique avec numérotation et PDF
- **PaymentMethod** : moyens de paiement Stripe avec chiffrement
- **Notification** : système de notifications avec types, priorités et expiration
- **AuditLog** : **logs d'audit sécurisés** avec traçabilité complète et export
- **Page** : CMS pour contenu éditorial avec SEO
- **FAQ** : Questions fréquemment posées avec catégorisation
- **Tarif** : Modèle de tarification flexible avec intégration Stripe

**Relations RGPD** : Cascade DELETE, contraintes FK, soft delete, audit trail  
**Performance** : Index optimisés, requêtes type-safe Prisma, connexion pooling  
**Sécurité** : Validation UUID, chiffrement données sensibles, audit complet  
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
│   │   ├── controllers/    # Contrôleurs API (13 contrôleurs)
│   │   │   ├── authController.ts              # Authentification
│   │   │   ├── adminController.ts             # Administration générale
│   │   │   ├── adminUserController.ts         # Gestion utilisateurs admin
│   │   │   ├── adminCommandeController.ts     # Gestion commandes admin
│   │   │   ├── adminFactureController.ts      # Gestion factures admin
│   │   │   ├── adminPageController.ts         # Gestion pages admin
│   │   │   ├── adminStatsController.ts        # Statistiques admin
│   │   │   ├── adminAuditController.ts        # Logs d'audit sécurisés (NOUVEAU)
│   │   │   ├── notificationsController.ts     # Notifications temps réel
│   │   │   ├── faqController.ts               # Gestion FAQ
│   │   │   ├── commandeClientController.ts    # Commandes client
│   │   │   ├── commandeController.ts          # Commandes générales
│   │   │   ├── messagesController.ts          # Messagerie avancée
│   │   │   └── paymentController.ts           # Paiements Stripe
│   │   ├── routes/         # Routes Express (14 fichiers)
│   │   │   ├── auth.ts     # Routes authentification
│   │   │   ├── admin.ts    # Routes administration générale
│   │   │   ├── adminStats.ts    # Routes statistiques admin
│   │   │   ├── notifications.ts # Routes notifications
│   │   │   ├── admin/      # Routes admin spécialisées (8 fichiers)
│   │   │   │   ├── users.ts       # Routes admin utilisateurs
│   │   │   │   ├── commandes.ts   # Routes admin commandes
│   │   │   │   ├── factures.ts    # Routes admin factures
│   │   │   │   ├── faq.ts         # Routes admin FAQ
│   │   │   │   ├── tarifs.ts      # Routes admin tarifs
│   │   │   │   ├── pages.ts       # Routes admin pages
│   │   │   │   ├── stats.ts       # Routes admin statistiques
│   │   │   │   └── audit.ts       # Routes logs d'audit (NOUVEAU)
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
│   │   │   ├── auditService.ts          # Service logs d'audit (NOUVEAU)
│   │   │   ├── stripeService.ts         # Service Stripe
│   │   │   ├── invoiceService.ts        # Service factures
│   │   │   └── pageService.ts           # Service pages
│   │   ├── utils/          # Utilitaires
│   │   │   ├── token.ts    # Gestion tokens JWT
│   │   │   └── mailer.ts   # Service email
│   │   ├── config/         # Configuration
│   │   └── types/          # Types TypeScript
│   │       ├── adminStats.ts    # Types statistiques admin (NOUVEAU)
│   │       └── notifications.ts # Types notifications (NOUVEAU)
│   ├── prisma/
│   │   ├── schema.prisma   # Schéma base de données (13 modèles)
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
│   │   │   ├── admin/      # Composants administration (9 composants refactorisés)
│   │   │   │   ├── AdminLayout.tsx         # Layout admin moderne
│   │   │   │   ├── DemoModeProvider.tsx    # Mode démo (453 lignes)
│   │   │   │   ├── RequireAdmin.tsx        # Sécurité multi-niveaux
│   │   │   │   ├── StatCard.tsx            # Cartes statistiques
│   │   │   │   ├── CommandeStatusSelect.tsx # Sélecteur statut
│   │   │   │   ├── UserTable.tsx           # Table générique avec accessibilité WCAG (541 lignes)
│   │   │   │   ├── SearchAndFilters.tsx    # Interface recherche et filtres (370 lignes)
│   │   │   │   ├── ConfirmationModals.tsx  # Modales RGPD avec conséquences détaillées
│   │   │   │   └── CommandeTable.tsx       # Table commandes avec statuts
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
│   │   │   ├── common/     # Composants communs
│   │   │   │   ├── Notifications.tsx       # Cloches notifications (NOUVEAU - 297 lignes)
│   │   │   │   └── LoadingSpinner.tsx      # Spinner de chargement
│   │   │   ├── modals/     # Modales
│   │   │   ├── messages/   # Architecture messagerie complète
│   │   │   │   ├── ConversationList.tsx   # Liste conversations
│   │   │   │   ├── MessageThread.tsx      # Thread de messages
│   │   │   │   └── MessageItem.tsx        # Affichage message
│   │   │   ├── project/    # Gestion projets
│   │   │   └── common/     # Composants communs
│   │   ├── hooks/          # Hooks React Query spécialisés (13 hooks)
│   │   │   ├── useInvoices.ts         # Hooks facturation (existant)
│   │   │   ├── useMessages.ts         # Messagerie client (654 lignes)
│   │   │   ├── useAdminMessages.ts    # Messagerie admin (321 lignes)
│   │   │   ├── useAdminUsers.ts       # Gestion centralisée utilisateurs admin (263 lignes)
│   │   │   ├── useAdminCommandes.ts   # Gestion commandes admin (359 lignes)
│   │   │   ├── useAdminFactures.ts    # Gestion factures admin (240 lignes)
│   │   │   ├── useAdminPages.ts       # Gestion pages admin (215 lignes)
│   │   │   ├── useAdminStats.ts       # Statistiques admin (49 lignes)
│   │   │   ├── useAdminAudit.ts       # Logs d'audit sécurisés (NOUVEAU - 257 lignes)
│   │   │   ├── useNotifications.ts    # Notifications temps réel (167 lignes)
│   │   │   ├── useMessages.ts         # Messagerie client (694 lignes)
│   │   │   ├── useInvoices.ts         # Facturation client (58 lignes)
│   │   │   ├── useTarifInvalidation.ts # Invalidation tarifs (78 lignes)
│   │   │   ├── useInvalidateMessages.ts # Invalidation messages (85 lignes)
│   │   │   ├── useDebouncedSearch.ts  # Hook de recherche optimisée avec debounce (83 lignes)
│   │   │   └── useIntersectionObserver.ts # Pagination infinie (44 lignes)
│   │   ├── pages/          # Pages React
│   │   │   ├── admin/      # Pages administration (10 pages complètes)
│   │   │   │   ├── AdminDashboard.tsx         # Tableau de bord avec KPIs (118 lignes)
│   │   │   │   ├── AdminUtilisateurs.tsx      # Gestion CRUD utilisateurs (625 lignes)
│   │   │   │   ├── AdminCommandes.tsx         # Gestion commandes avec statuts (964 lignes)
│   │   │   │   ├── AdminFactures.tsx          # Interface facturation avancée (1177 lignes)
│   │   │   │   ├── AdminFAQ.tsx               # Gestion FAQ et base connaissance (1130 lignes)
│   │   │   │   ├── AdminTarifs.tsx            # Configuration prix et services (1233 lignes)
│   │   │   │   ├── AdminPages.tsx             # CMS pages statiques avec SEO (180 lignes)
│   │   │   │   ├── AdminStatistiques.tsx      # Analytics production-ready (235 lignes)
│   │   │   │   ├── AdminAuditLogs.tsx         # Logs d'audit sécurisés (NOUVEAU - 350+ lignes)
│   │   │   │   └── AdminMessagerie.tsx        # Interface messagerie admin (215 lignes)
│   │   │   ├── BillingPage.tsx       # Page facturation React Query
│   │   │   ├── LoginPage.tsx         # Page connexion
│   │   │   ├── SignupPage.tsx        # Page inscription
│   │   │   ├── DashboardPage.tsx     # Dashboard client
│   │   │   ├── MessagesPage.tsx      # Page messagerie client
│   │   │   ├── NotificationsPage.tsx # Page notifications (NOUVEAU - 319 lignes)
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
├── test-admin-stats.js     # Script de test API statistiques (NOUVEAU)
├── fix-admin-role.js       # Script utilitaire correctif rôles
└── README.md               # Cette documentation
```

---

## 🛠️ Technologies Utilisées

### 🚀 **Backend (Node.js + TypeScript)**

- **Node.js 18.20.2** : Runtime JavaScript moderne avec support ARM64
- **Express.js 4.18.2** : Framework web minimaliste et robuste
- **TypeScript 5.8.3** : Typage statique strict pour la robustesse
- **Prisma ORM 6.10.1** : Modélisation et requêtes type-safe avec MySQL
- **MySQL 8.4+** : Base de données relationnelle avec native password
- **JWT (jsonwebtoken 9.0.2)** : Authentification sécurisée avec expiration
- **bcryptjs 2.4.3** : Hachage des mots de passe (12 rounds)
- **Zod 3.22.4** : Validation stricte de schémas TypeScript
- **Winston 3.11.0** : Logging avancé avec rotation
- **Stripe 18.2.1** : Plateforme de paiement sécurisée
- **AWS S3 SDK 3.837.0** : Stockage de fichiers avec presigned URLs
- **Jest 29.7.0** : Framework de tests unitaires et d'intégration
- **PDFKit 0.17.1** : Génération de PDF pour factures
- **SendGrid 8.1.5** : Service d'envoi d'emails transactionnels
- **Express Rate Limit 7.1.5** : Protection contre les attaques
- **Helmet 7.1.0** : Sécurité HTTP headers

### 🎨 **Frontend (React + TypeScript)**

- **React 18.2.0** : Framework JavaScript moderne avec Concurrent Features
- **TypeScript 5.3.3** : Typage statique strict pour la robustesse
- **Vite 5.0.8** : Build tool ultra-rapide avec HMR et optimizeDeps
- **@tanstack/react-query 5.81.5** : Cache intelligent et gestion d'état serveur
- **Tailwind CSS 3.4.17** : Framework CSS utility-first avec optimisations
- **React Router DOM 6.30.1** : Navigation SPA avec lazy loading
- **Framer Motion 12.23.0** : Animations fluides et micro-interactions
- **Lucide React 0.525.0** : Icônes vectorielles modernes et légères
- **React Dropzone 14.3.8** : Upload de fichiers drag & drop
- **React Hot Toast 2.5.2** : Notifications toast élégantes
- **Axios 1.10.0** : Client HTTP avec intercepteurs
- **Vitest 3.2.4** : Framework de tests unitaires ultra-rapide
- **Cypress 14.5.1** : Tests E2E automatisés
- **Date-fns 4.1.0** : Manipulation de dates moderne

### 🗄️ **Base de Données et ORM**

- **MySQL 8.4+** : Base de données principale avec `--mysql-native-password=ON`
- **Prisma Client 6.10.1** : ORM type-safe avec génération automatique
- **Prisma Migrate** : Gestion des migrations avec rollback
- **Seed Data** : Comptes de test préchargés avec données réalistes
- **Index optimisés** : Performance queries avec contraintes FK
- **Audit Trail** : Traçabilité complète des modifications

### 🐳 **DevOps et Déploiement Multi-Architecture**

- **Docker Buildx** : Build multi-architecture (ARM64/x86)
- **Docker Compose** : Orchestration multi-services avec volumes persistants
- **npm workspaces** : Gestion monorepo avec shared types
- **Nginx 1.25-alpine** : Serveur web production avec proxy API
- **Script de build automatisé** : `./scripts/docker-build.sh` avec options
- **Support ARM64 natif** : Optimisé pour Apple Silicon
- **ngrok** : Tunnel sécurisé pour webhooks Stripe en développement

---

## 📋 **Changelog Récent**

### ✅ **Version Actuelle (Juillet 2025) - Multi-Architecture & File Upload**

**🐳 Infrastructure Docker Multi-Architecture (NOUVEAU) :**

- ✅ **Support ARM64/x86** : Build natif pour Apple Silicon et serveurs x86
- ✅ **Script de build automatisé** : `./scripts/docker-build.sh` avec options complètes
- ✅ **Docker Buildx** : Builder dédié avec cache optimisé pour performance
- ✅ **Nginx proxy optimisé** : Routing API avec strip prefix `/api/` → backend:3001
- ✅ **Configuration sécurisée** : Headers sécurité, compression gzip, cache statique
- ✅ **Health checks** : Monitoring automatique des containers
- ✅ **Volumes persistants** : Données MySQL et uploads sécurisés

**📁 Système d'Upload de Fichiers Projet (NOUVEAU) :**

- ✅ **API REST complète** : 3 endpoints avec validation Zod et gestion d'erreurs
- ✅ **Integration S3** : URLs présignées pour upload direct sécurisé
- ✅ **Hooks React Query** : `useUploadFile` et `useProjectFiles` avec cache 30s
- ✅ **Interface moderne** : Drag & drop avec progression temps réel
- ✅ **Tests complets** : Mock S3, couverture ≥90% avec edge cases
- ✅ **Sécurité renforcée** : Validation ownership, contrôle accès, audit trail

**🔐 Système d'Audit Sécurisé (NOUVEAU) :**

- ✅ **API Backend complète** : Controller `/admin/audit` avec 4 endpoints sécurisés (420 lignes)
- ✅ **Routes authentifiées** : CRUD complet avec middleware JWT et validation RBAC stricte
- ✅ **Service AuditService** : Logging centralisé avec persistance base de données (270 lignes)
- ✅ **Hooks React Query** : 4 hooks spécialisés avec cache 30s et invalidation (257 lignes)
- ✅ **Page AdminAuditLogs** : Interface complète avec filtres avancés et pagination (350+ lignes)
- ✅ **Base de données** : Modèle `AuditLog` avec enums de sévérité et types de cibles
- ✅ **Export sécurisé** : CSV/JSON avec filtres appliqués et téléchargement automatique
- ✅ **RBAC strict** : Accès exclusif aux administrateurs avec validation multi-niveaux
- ✅ **Traçabilité complète** : Enregistrement automatique de toutes les actions admin
- ✅ **Logging des accès** : Même l'accès aux logs est audité pour sécurité maximale

**🔔 Système de Notifications Temps Réel :**

- ✅ **API Backend complète** : Controller `/notifications` avec 6 endpoints sécurisés (150+ lignes)
- ✅ **Routes authentifiées** : CRUD complet avec middleware JWT et validation rôles
- ✅ **Hooks React Query** : 4 hooks spécialisés avec polling 15s et cache intelligent (167 lignes)
- ✅ **Composant Notifications** : Cloches intelligentes avec badges et menus déroulants (297 lignes)
- ✅ **Page NotificationsPage** : Interface complète avec filtres et pagination (319 lignes)
- ✅ **Génération automatique** : Messages, paiements, inscriptions, événements système
- ✅ **Types spécialisés** : INFO, SUCCESS, WARNING, ERROR, PAYMENT, ORDER, MESSAGE, SYSTEM
- ✅ **UX moderne** : Animations Framer Motion, responsive design, états de chargement
- ✅ **Sécurité** : Authentification requise, isolation utilisateurs, routing intelligent admin/client

**📊 Page Statistiques Admin Refaite (PRODUCTION-READY) :**

- ✅ **API `/admin/stats`** : Endpoint sécurisé avec calculs Prisma et évolutions vs mois précédent (125 lignes)
- ✅ **Hook useAdminStats** : React Query avec refresh automatique toutes les 30 secondes (49 lignes)
- ✅ **AdminStatistiques refait** : Interface simple et moderne avec données réelles (235 lignes)
- ✅ **Métriques essentielles** : CA, commandes, clients, satisfaction avec indicateurs d'évolution
- ✅ **Derniers paiements** : Tableau formaté avec détails clients et montants
- ✅ **Design responsive** : Cards modernes avec icônes colorées et gradients
- ✅ **Pas de données mockées** : Tout depuis la vraie base MySQL via Prisma
- ✅ **Script de test** : `test-admin-stats.js` pour validation API complète

**🎯 Architecture Backend Complète (12 Contrôleurs + 45+ Endpoints) :**

- ✅ **13 contrôleurs spécialisés** : authController, adminController, adminUserController, adminCommandeController, adminFactureController, adminPageController, adminStatsController, notificationsController, faqController, commandeClientController, commandeController, messagesController, paymentController
- ✅ **45+ endpoints REST** : Authentification, administration complète, notifications, statistiques, commandes, factures, messagerie, paiements, FAQ, pages, tarifs
- ✅ **Services métier** : adminCommandeService, adminUserService, stripeService, invoiceService, pageService
- ✅ **Middleware de sécurité** : JWT, rôles, validation Zod
- ✅ **Tests complets** : Unitaires et intégration avec Jest
- ✅ **Logging avancé** : Winston avec niveaux et rotation
- ✅ **Système d'audit complet** : AuditService avec 50+ actions standardisées
- ✅ **Traçabilité RGPD** : Conformité totale avec audit trail complet

**🎯 Espace Admin Complet Finalisé (9 Pages Production-Ready) :**

- ✅ **AdminDashboard** : Vue d'ensemble avec KPIs et statistiques temps réel (118 lignes)
- ✅ **AdminUtilisateurs** : Gestion CRUD utilisateurs avec architecture modulaire (625 lignes)
- ✅ **AdminCommandes** : Suivi projets avec statuts et modale de détails moderne (964 lignes)
- ✅ **AdminFactures** : Interface facturation avancée avec PDF (1177 lignes)
- ✅ **AdminFAQ** : Gestion base de connaissance avec réorganisation (1130 lignes)
- ✅ **AdminTarifs** : Configuration prix et services avec calculs automatiques (1233 lignes)
- ✅ **AdminPages** : CMS pour pages statiques avec SEO (180 lignes)
- ✅ **AdminStatistiques** : Interface production-ready avec données réelles (235 lignes)
- ✅ **AdminMessagerie** : Interface messagerie admin avec hooks React Query (215 lignes)
- ✅ **Composants réutilisables** : AdminLayout, DemoModeProvider, RequireAdmin, StatCard, UserTable, SearchAndFilters, ConfirmationModals, CommandeTable

**🎯 Système de Messagerie Avancé (1000+ Lignes de Hooks) :**

- ✅ **useMessages.ts** : Hook principal 694 lignes avec 15+ hooks spécialisés
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
- ✅ **useTarifInvalidation()** : Hook spécialisé pour synchronisation admin avec méthodes avancées (78 lignes)
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
- ✅ **Modèle Notification** : Types, priorités, expiration, actions URL, métadonnées JSON
- ✅ **Schéma Prisma robuste** : Relations RGPD, contraintes FK, index performance
- ✅ **Migrations corrigées** : Déploiement automatique sans erreurs
- ✅ **Support Request Integration** : Messagerie unifiée projet + support
- ✅ **Documentation complète** : Guide détaillé dans `docs/Base-de-donnees-guide.md`

**🔧 Infrastructure Docker Stabilisée :**

- ✅ Configuration MySQL 8.4+ corrigée (`--mysql-native-password=ON`)
- ✅ Base de données persistante avec migrations automatiques
- ✅ Prisma Studio accessible sur port 5555
- ✅ Variables d'environnement sécurisées
- ✅ Scripts utilitaires : `fix-admin-role.js`, `test-admin-stats.js`

**🚀 Intégration Stripe Complète :**

- ✅ API de paiement fonctionnelle avec sessions Stripe
- ✅ Prix dynamique sans dépendance aux produits pré-créés
- ✅ Webhooks configurés pour mise à jour automatique des statuts
- ✅ Gestion des erreurs et logging complet

**📊 Données de Test Opérationnelles :**

- ✅ Seed automatique avec comptes admin/user/correcteur
- ✅ Commandes de test avec différents statuts de paiement
- ✅ Structure complète User ↔ Commande ↔ Invoice avec champs Stripe
- ✅ **Compte admin opérationnel** : admin@test.com / password avec rôle ADMIN
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

- **Frontend** : http://localhost:3001
- **Backend API** : http://localhost:3000
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

# Test API statistiques admin
node test-admin-stats.js

# Linting
npm run lint --workspace=frontend
```

### 🛠️ **Build Multi-Architecture Docker (ARM64/x86)**

Le projet supporte le build multi-architecture (ARM64/x86) pour une compatibilité complète avec Apple Silicon et serveurs x86, avec script de build automatisé.

**Développement local (Apple Silicon) :**

```bash
# Démarrage avec Docker natif ARM64
docker compose up backend db frontend -d

# Frontend local si problème Docker
cd frontend && npm run dev
```

**Build et publication multi-arch avec script optimisé :**

```bash
# Build local pour test (ARM64 + x86)
./scripts/docker-build.sh

# Build et push avec tag spécifique
./scripts/docker-build.sh 1.2.0 --push

# Build seulement le frontend
./scripts/docker-build.sh dev --target frontend

# Build avec plateforme spécifique
./scripts/docker-build.sh latest --platform linux/arm64

# Variables d'environnement
PUSH=true ./scripts/docker-build.sh v1.0.0
```

**Configuration Nginx avec routing API optimisé :**

```bash
# Le frontend inclut un proxy Nginx configuré
# Routing automatique /api/* vers backend:3001
# Strip du préfixe /api pour compatibilité
# Cache statique et compression gzip
```

**Résolution des problèmes Docker :**

```bash
# Nettoyer le cache Docker
docker system prune -a

# Forcer rebuild Rollup/ESBuild
docker compose build --no-cache frontend

# Debug multi-arch
docker buildx inspect staka-builder

# Utiliser Rosetta si nécessaire (macOS)
docker --platform linux/amd64 compose up
```

**Architecture des images optimisée :**

- **Frontend** : Build multistage (Node.js → Nginx) avec support ARM64/x86 natif
- **Backend** : Image Alpine optimisée avec dépendances natives Prisma
- **Nginx** : Configuration production avec proxy API, strip prefix, cache statique
- **Build system** : Docker Buildx avec builder dédié pour performance

Pour plus de détails, voir [Documentation Docker](docs/DEPLOYMENT_DOCKER.md).

### 🔑 **Comptes de Test**

```bash
# Admin (accès complet)
Email: admin@test.com
Password: password

# Utilisateur standard
Email: user@test.com
Password: password

# Correcteur
Email: corrector@test.com
Password: password
```

### 🛠️ **Commandes de Développement**

#### 📊 **Tableau des Ports**

| Service | Port Host | Port Interne | Usage |
|---------|-----------|--------------|-------|
| **Backend API** | 3000 | 3000 | Express + Prisma + PDF |
| **Frontend UI** | 3001 | 80 | React + Nginx (production) |
| **Vite Dev** | 5173 | 5173 | React (hot-reload dev) |
| **Prisma Studio** | 5555 | 5555 | Base de données |
| **MySQL** | 3306 | 3306 | Base de données |

```bash
# 🐳 DÉVELOPPEMENT DOCKER (RECOMMANDÉ)
npm run dev              # Mode production (backend:3000 + frontend:3001)
npm run dev:watch        # Mode dev hot-reload (backend:3000 + vite:5173)

# 🔧 BACKEND (Docker-only - PRODUCTION READY)
cd backend
npm run build            # Build TypeScript dans conteneur
npm run test             # Tests complets dans conteneur
npm run test:s3          # Tests S3 avec vraies credentials AWS
npm run audit:docker     # Audit sécurité dans conteneur

# Tests S3 avec credentials AWS
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
npm run test:s3

# 🗄️ DATABASE (via Docker)
docker compose run --rm app npm run db:migrate
docker compose run --rm app npm run db:generate
docker compose run --rm app npm run prisma:seed

# 💳 STRIPE SYNC (dans conteneur)
docker compose run --rm app npm run stripe:sync-all
docker compose run --rm app npm run stripe:sync-dry
docker compose run --rm app npm run stripe:sync-verbose

# 🎯 DÉVELOPPEMENT HOT-RELOAD
# Dev hot-reload
npm run dev:watch        # Backend nodemon + Frontend Vite
# → Backend: http://localhost:3000
# → Frontend: http://localhost:5173

# ⚙️ ENVIRONNEMENT COMPLET
docker compose up -d     # Production complète
docker compose logs -f   # Voir les logs en temps réel

# 🧪 TEST API PDF (PRODUCTION)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/admin/factures/1/download \
     --output facture_test.pdf
```

**Consulter la documentation spécialisée selon vos besoins de développement ou d'administration.**

---

## 🎉 **État du Projet**

**✅ Version Production-Ready** avec système de notifications temps réel, statistiques admin refaites, infrastructure Docker stable, et architecture backend complète de 45+ endpoints.

**🚀 Prêt pour déploiement** avec tests validés, documentation complète, infrastructure Docker multi-architecture, et système d'upload de fichiers complet.

### 🎉 **Nouvelles Fonctionnalités Récentes**

- **📞 Système de réservation de consultations** : Modal ultra-simplifiée accessible depuis landing page et espace client, avec workflow automatisé vers la messagerie admin et notifications temps réel
- **Upload de fichiers projet** avec S3 et progression temps réel
- **Support Docker ARM64/x86** natif avec script de build automatisé  
- **Routing API Nginx** optimisé avec strip prefix pour compatibilité
- **Moyens de paiement Stripe** avec gestion des cartes par défaut
- **Statistiques annuelles** pour les clients avec statut VIP automatique
- **Tests renforcés** avec couverture étendue et mocks S3
- **API Projects** avec endpoints de listage et pagination