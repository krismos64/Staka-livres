# 📚 Staka Livres - Plateforme de Correction de Manuscrits

![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Status](https://img.shields.io/badge/Status-Production%20Deployed-brightgreen)
![Live](https://img.shields.io/badge/Live-livrestaka.fr-blue)
![Tests](https://img.shields.io/badge/Tests-96%25%20E2E%20Success-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Multi%20Arch-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)

## 🎯 **Vue d'ensemble du projet**

**Staka Livres** est une plateforme web **enterprise-grade** dédiée aux **services de correction et d'édition de manuscrits**. Cette application monorepo sophistiquée offre une expérience complète aux auteurs avec authentification sécurisée, administration avancée, paiements Stripe intégrés et système de messagerie temps réel.

**✨ Version Production - 5 Août 2025** : Application déployée en production sur [livrestaka.fr](https://livrestaka.fr/) avec infrastructure de tests enterprise-grade (34 tests E2E Cypress + 57 tests backend), architecture Docker optimisée, **système de fichiers local unifié** (AWS S3 complètement supprimé), système de notifications centralisé avec EventBus, et composant FloatingBubbles interactif.

### 📊 **Métriques du Projet (5 Août 2025)**

| Composant                  | Détail                                 | Statut           |
| -------------------------- | -------------------------------------- | ---------------- |
| **📁 Contrôleurs Backend** | 26 contrôleurs + unifiedFileController (AWS S3 supprimé) | ✅ Production    |
| **🌐 Endpoints API**       | 70+ endpoints REST sécurisés           | ✅ Fonctionnels  |
| **⚛️ Composants React**    | 79 composants modulaires + SEO optimisé | ✅ Optimisés     |
| **📄 Pages Frontend**      | 34 pages complètes + landing optimisée | ✅ Responsive    |
| **🧪 Tests Backend**       | 57 tests Vitest (couverture optimisée) | ✅ Robustes      |
| **🧪 Tests Frontend**      | 6 tests unitaires + architecture séparée | ✅ Optimisés     |
| **🔍 Tests E2E Cypress**   | 34 tests Cypress + architecture robuste | ✅ Enterprise    |
| **🗄️ Modèles BDD**         | 15 modèles interconnectés              | ✅ Complets      |
| **📚 Documentation**       | Guide unifié + 16 guides spécialisés   | ✅ Exhaustive    |
| **🐳 Infrastructure**      | Docker multi-arch ARM64/x86            | ✅ Production    |
| **⚙️ Scripts Automatisés** | Reset dev, build multi-arch, deploy    | ✅ Opérationnels |
| **🔒 Sécurité**            | RGPD + Audit logs + JWT                | ✅ Conforme      |
| **🔔 Notifications**       | EventBus centralisé + 22 templates email | ✅ Automatisées  |

### 🌟 **Fonctionnalités Principales**

#### 🏗️ **Architecture Enterprise**

- **Monorepo TypeScript** moderne avec workspace npm
- **Backend Node.js/Express** avec Prisma ORM et MySQL 8
- **Frontend React 18** avec Vite, React Query et Tailwind CSS
- **Infrastructure Docker** multi-architecture avec volumes isolés (résout erreurs Rollup)
- **CI/CD optimisé** avec tests séparés unitaires/intégration
- **Scripts automatisés** : build multi-arch, déploiement VPS, reset développement

#### 🔐 **Sécurité & Authentification**

- **JWT authentification** avec rôles (USER/ADMIN/CORRECTOR)
- **Système d'audit complet** avec traçabilité des actions
- **Conformité RGPD** : suppression compte + export données
- **Réinitialisation mot de passe** sécurisée avec tokens
- **Rate limiting** et protection contre les attaques

#### 💳 **Paiements & Facturation**

- **Intégration Stripe complète** avec webhooks (✅ **PRODUCTION OPÉRATIONNELLE**)
- **Facturation automatique** avec génération PDF
- **Moyens de paiement** avec gestion cartes défaut
- **Statistiques revenus** et suivi performances
- **Tests paiement enterprise-grade** (34 tests E2E Cypress)
- **✅ CORRECTIF PRODUCTION 30 JUILLET** : Paiements Stripe réels fonctionnels

#### 💬 **Communication & Support**

- **Messagerie temps réel** avec threading avancé
- **Système notifications centralisé** avec EventBus et listeners automatiques
- **Emails automatiques** : 22 templates HTML par type de notification
- **Support client intégré** via formulaires publics
- **Réservation consultations** depuis landing/espace client
- **Architecture événementielle** : zéro oubli d'envoi d'emails

#### 📊 **Administration & Analytics**

- **Espace admin complet** (10 pages spécialisées)
- **Dashboard statistiques** avec données temps réel
- **Gestion utilisateurs** avec CRUD et recherche avancée
- **Suivi commandes** avec changement statuts
- **Mode démonstration** professionnel pour prospects

#### 🎨 **Interface Utilisateur Moderne**

- **Landing page optimisée** (15 composants production-ready)
- **Composant FloatingBubbles** interactif avec équipe d'experts
- **Tarification dynamique** avec synchronisation Stripe
- **Design responsive** mobile-first avec animations
- **Upload fichiers** avec progression et **stockage local unifié** (AWS S3 supprimé)
- **Navigation intelligente** avec persistance choix
- **Composants SEO optimisés** avec meta descriptions et structured data

---

## 🏗️ **Architecture Technique**

### 📁 **Structure Monorepo**

```
Staka-livres/
├── backend/                 # API Node.js + Express + Prisma
│   ├── src/
│   │   ├── controllers/     # 26 contrôleurs + unifiedFileController (stockage local)
│   │   ├── routes/         # Routes REST avec middleware
│   │   ├── services/       # Logique métier
│   │   ├── events/         # EventBus centralisé pour notifications
│   │   ├── listeners/      # Listeners automatiques emails admin/user
│   │   ├── queues/         # Queue emails asynchrone
│   │   ├── emails/         # Templates HTML (22 templates)
│   │   ├── deprecated-aws/ # Ancien code AWS S3 (non utilisé)
│   │   ├── uploads/        # Stockage local des fichiers
│   │   └── tests/          # 57 tests Vitest (couverture optimisée)
│   └── prisma/             # Schéma BDD + migrations
├── frontend/               # React 18 + Vite + React Query
│   ├── src/
│   │   ├── components/     # 79 composants modulaires + SEO optimisés
│   │   │   └── landing/    # 15 composants landing optimisés
│   │   │       └── FloatingBubbles.tsx # Équipe experts interactif
│   │   ├── pages/         # 34 pages complètes + blog SEO
│   │   ├── hooks/         # 33 hooks React Query + useLocalUpload (S3 supprimé)
│   │   └── tests/         # Tests unitaires CI/CD séparés
│   ├── tests/             # Tests intégration (local uniquement)
│   └── cypress/           # Tests E2E (34 tests Cypress)
├── shared/                # Types TypeScript partagés
├── docs/                  # Documentation complète (15 guides)
└── docker-compose.yml     # Orchestration multi-services
```

### 🛠️ **Stack Technique**

#### Backend (Node.js + TypeScript)

- **Node.js 18.20.2** + **TypeScript 5.8.3**
- **Express 4.18.2** + **Prisma ORM 6.10.1**
- **MySQL 8.4+** avec optimisations performance
- **JWT** + **bcryptjs** (12 rounds) + **Zod validation**
- **Stripe 18.2.1** + **Stockage local multer** (AWS S3 supprimé)
- **SendGrid 8.1.5** + **PDFKit** pour facturation
- **Vitest 3.2.4** pour tests unitaires/intégration

#### Frontend (React + TypeScript)

- **React 18.2.0** + **TypeScript 5.3.3**
- **Vite 6.3.5** + **@tanstack/react-query 5.81.5**
- **Tailwind CSS 3.4.17** + **Framer Motion 12.23.0**
- **React Router DOM 6.30.1** + **Axios 1.10.0**
- **Vitest 3.2.4** + **Cypress 14.5.1** pour tests
- **Lucide React 0.525.0** pour icônes

#### Infrastructure & DevOps

- **Docker Buildx** multi-architecture (ARM64/x86)
- **Nginx 1.25-alpine** avec proxy API optimisé
- **MySQL 8.4+** avec native password
- **Prisma Migrate** avec audit trail complet

---

## 🧪 **Infrastructure de Tests Enterprise (Juillet 2025)**

### 🏆 **Infrastructure Tests E2E Cypress (34 Tests)**

**Architecture robuste** : Infrastructure de tests Cypress avec couverture complète des fonctionnalités critiques déployées en production.

### 🎯 **Tests E2E Production-Ready**

```bash
# Tests Cypress E2E complets
npm run test:e2e          # Suite complète des 34 tests
npm run test:e2e:open     # Interface interactive Cypress

# Validation fonctionnalités critiques
- Authentification & rôles utilisateur
- Administration complète (10 pages)  
- Paiements Stripe & facturation
- Messagerie temps réel
- Upload fichiers & gestion projets
- Landing page & formulaires publics
```

### 📊 **Couverture Tests Complete**

| Type Tests           | Nombre | Couverture  | Statut           |
| -------------------- | ------ | ----------- | ---------------- |
| **Tests E2E Cypress** | 34     | Fonctionnel | ✅ Production    |
| **Tests Backend**     | 57     | Optimisée   | ✅ Robuste       |
| **Tests Frontend**    | 6      | Unitaire CI/CD | ✅ Optimisé      |
| **TOTAL**            | **97** | **Complet** | **✅ Déployé**   |

---

## 🚀 **Démarrage Rapide**

### ⚡ **Installation Express**

```bash
# 1. Cloner le projet
git clone <repository-url>
cd Staka-livres

# 2. Configuration environnement
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos clés

# 3. Installation et démarrage
npm run install:all
npm run docker:dev

# 4. Accès services
# Frontend : http://localhost:3001 (Nginx + Vite proxy)
# Backend API : http://localhost:3000 (Express + nodemon)
# Base de données : MySQL sur port 3306
```

### 🐳 **Infrastructure Docker Optimisée**

**✅ Problème Rollup ARM64/x64 résolu** avec volumes isolés et image Debian Bookworm :

```bash
# Reset complet de l'environnement dev (recommandé si problèmes)
./scripts/dev-reset.sh

# Reset frontend uniquement (plus rapide)
./scripts/dev-reset.sh --frontend-only

# Build et déploiement automatisés
./scripts/docker-build.sh v1.4.0 --push        # Build multi-arch + push
./scripts/deploy-vps.sh v1.4.0                 # Déploiement VPS avec sauvegarde
```

**Architecture dev/prod séparée** :

- `docker-compose.dev.yml` : Hot-reload, volumes nommés, proxy Vite
- `docker-compose.prod.yml` : Images registry, SSL, monitoring
- Scripts automatisés : build multi-arch, déploiement, reset

### 🔑 **Comptes de Test**

```bash
# Admin (accès complet)
admin@test.com / password

# Utilisateur standard
user@test.com / password

# Correcteur
corrector@test.com / password
```

### ⚙️ **Variables d'Environnement Essentielles**

```env
# Base de données
DATABASE_URL="mysql://staka:staka@db:3306/stakalivres"

# Authentification
JWT_SECRET="dev_secret_key_change_in_production"
FRONTEND_URL="http://localhost:3001"
PORT=3000

# Stripe (OBLIGATOIRE pour paiements) - ✅ PRODUCTION OPÉRATIONNELLE
STRIPE_SECRET_KEY="sk_live_VOTRE_CLE_PRODUCTION"  # Clé production (sk_live_*)
STRIPE_WEBHOOK_SECRET="whsec_VOTRE_SECRET"        # Webhook : /payments/webhook

# Emails (OBLIGATOIRE pour notifications)
SENDGRID_API_KEY="SG.VOTRE_CLE"
FROM_EMAIL="votre-email-verifie@domaine.com"
FROM_NAME="Staka Livres"
SUPPORT_EMAIL="support@votre-domaine.com"
ADMIN_EMAIL="admin@votre-domaine.com"

# Stockage des fichiers (local uniquement - AWS S3 complètement supprimé)
# Les fichiers sont automatiquement stockés dans /backend/uploads/
# Configuration multer automatique par type :
# - /uploads/projects/ : fichiers de projets
# - /uploads/orders/ : fichiers de commandes  
# - /uploads/messages/ : pièces jointes messages
# Plus aucune configuration AWS nécessaire
```

### 🧪 **Tests et Validation**

```bash
# Tests backend complets
npm run test:backend

# Tests frontend (architecture séparée)
cd frontend
npm run test:unit        # CI/CD optimisé
npm run test:integration # Local avec backend
npm run test:all         # Suite complète

# Tests E2E Cypress (34 tests complets)
npm run test:e2e         # Suite complète (34 tests)
npm run test:e2e:open    # Interface interactive Cypress

# Tests spécialisés par fonctionnalité
npm run test:e2e:payment # Tests paiement complets
npm run test:e2e:admin   # Tests administration
```

### 🐳 **Docker Multi-Architecture**

```bash
# Développement local
npm run docker:dev

# Production
npm run docker:prod

# Build multi-arch (ARM64/x86)
npm run docker:build

# Build avec options
./scripts/docker-build.sh 1.2.0 --push
./scripts/docker-build.sh dev --target frontend
./scripts/docker-build.sh latest --platform linux/arm64

# Résolution problèmes
docker system prune -a
docker compose build --no-cache
```

---

## 🔐 **Fonctionnalités Avancées**

### 🛡️ **Sécurité & Conformité**

#### **Authentification Renforcée**

- JWT tokens sécurisés (7 jours expiration)
- Politique mots de passe RGPD/CNIL conforme
- Réinitialisation avec tokens SHA-256 à usage unique
- Rate limiting (5 tentatives/heure par IP)
- Audit complet des événements sécurité

#### **Conformité RGPD Complète**

- **Suppression compte** : `DELETE /users/me` avec anonymisation
- **Export données** : `GET /users/me/export` avec envoi email
- **Audit logs** : Traçabilité `USER_DELETED`, `USER_DATA_EXPORTED`
- **Templates légaux** : Emails confirmations avec données JSON/CSV

#### **Système d'Audit Enterprise**

- Interface `/admin/audit-logs` avec filtres avancés
- 4 niveaux sévérité : LOW, MEDIUM, HIGH, CRITICAL
- Export CSV/JSON sécurisé avec filtres appliqués
- Logging actions admin + accès aux logs
- Rétention configurable avec nettoyage automatique

### 💳 **Système de Paiement Avancé**

#### **Intégration Stripe Complète** ✅ **PRODUCTION RÉSOLUE 30 JUILLET 2025**

- Sessions checkout dynamiques sans produits pré-créés ✅ **OPÉRATIONNEL**
- Webhooks sécurisés avec signature validation ✅ **CONFIGURÉ : `https://livrestaka.fr/payments/webhook`**
- Gestion moyens paiement avec cartes par défaut ✅ **FONCTIONNEL**
- Facturation automatique avec génération PDF A4 ✅ **INTÉGRÉ**
- Statistiques revenus et évolutions mensuelles ✅ **DISPONIBLE**

**🔧 CORRECTIFS APPLIQUÉS** :
- Mode Stripe production activé (plus de mode mock)
- Configuration nginx webhook `/payments/webhook` ajoutée  
- Variables d'environnement production mises à jour
- Tests de validation Stripe complets effectués

#### **Tests Paiement Enterprise**

- **34 tests Cypress** couvrant tous les scénarios
- Tests critiques (< 2min) pour CI/CD
- Tests intégration webhooks complets
- Simulation erreurs : API down, cartes refusées, timeouts
- Workflow E2E client → paiement → facture → livraison

### 🔔 **Notifications Centralisées**

#### **Architecture Événementielle**

- **EventBus centralisé** avec listeners spécialisés
- **Double notification** : Interface clochette + Email automatique
- **Queue asynchrone** pour traitement emails
- **26 templates HTML** professionnels par type

#### **Système Multi-Cible**

- **Architecture EventBus** : `admin.notification.created` → email automatique
- **22 templates HTML** par type de notification (MESSAGE, PAYMENT, ORDER, etc.)
- **Listeners spécialisés** : adminNotificationEmailListener, userNotificationEmailListener
- **Queue asynchrone** : traitement emails sans bloquer l'API
- **Zéro oubli** : chaque `createAdminNotification()` génère automatiquement un email

### 📞 **Support Client Intégré**

#### **Réservation Consultations**

- Modal simplifiée depuis landing + espace client
- Workflow automatisé → messagerie admin
- Créneaux 7 jours ouvrés avec validation temps
- Intégration messagerie avec thread par email

#### **Formulaires Publics**

- Contact public : `POST /public/contact` sans auth
- Échantillon gratuit avec upload fichier
- Workflow auto : Formulaire → Messagerie → Email support
- Templates HTML riches avec métadonnées complètes

### 📊 **Administration Enterprise**

#### **Espace Admin Complet (10 pages)**

- **Dashboard** : KPIs temps réel avec évolutions
- **Utilisateurs** : CRUD avec recherche avancée
- **Commandes** : Suivi avec changement statuts
- **Facturation** : Interface PDF avec téléchargement
- **Statistiques** : Données réelles avec calculs Prisma
- **Audit Logs** : Supervision sécurisée avec export
- **Messagerie** : Interface thread avec modération
- **FAQ/Tarifs/Pages** : CMS complet avec SEO

#### **Mode Démonstration Professionnel**

- Timer session avec actions Rafraîchir/Reset/Prolonger
- Données fictives cohérentes (25 commandes + 20 factures)
- Basculement intelligent données réelles ↔ demo
- Configuration URL : `?demo=true&duration=60&readonly=true`

### 🎨 **Interface Utilisateur Moderne**

#### **Landing Page Optimisée**

- **15 composants** production-ready avec animations
- **Composant FloatingBubbles** : Équipe d'experts interactif avec 9 photos
- **Hero section** avec dégradé bleu professionnel
- **Tarification dynamique** synchronisée avec Stripe
- **Formulaires de contact** avec validation temps réel
- **Design responsive** mobile-first avec Tailwind CSS

#### **Expérience Utilisateur Avancée**

- **Navigation intelligente** avec persistance choix
- **Upload fichiers** avec progression et **stockage local unifié**
- **Notifications toast** pour feedback immédiat
- **Modals interactives** pour actions critiques
- **Animations Framer Motion** pour fluidité

---

## 📊 **Impact Business & ROI**

### 🏆 **Gains Quantifiés**

#### **Qualité & Fiabilité**

- **Qualité production** optimisée avec tests E2E
- **Détection précoce** des régressions
- **Validation automatique** des workflows critiques
- **Prévention proactive** des bugs

#### **Productivité Équipe**

- **Confiance déploiement** avec validation automatique
- **UX optimisée** réduisant le support client
- **Documentation exhaustive** pour onboarding dev
- **Pipeline CI/CD** optimisé

#### **Business Continuity**

- **Production stable** déployée sur livrestaka.fr
- **Paiements sécurisés** Stripe en production
- **Conformité RGPD** complète
- **Architecture scalable** testée

---

## 📚 **Documentation Complète**

### 🏗️ **Architecture & Développement**

- **[Guide Backend API](docs/README-backend.md)** : 124+ endpoints avec exemples
- **[Guide Frontend](docs/README-frontend.md)** : 79 composants + 33 hooks + SEO complet
- **[Guide Base de Données](docs/Base-de-donnees-guide.md)** : 15 modèles Prisma optimisés
- **[Tests Complets](docs/TESTS_COMPLETE_GUIDE.md)** : Architecture 3 niveaux unifiée

### 👨‍💼 **Administration & Production**

- **[Guide Admin Unifié](docs/ADMIN_GUIDE_UNIFIED.md)** : 10 pages + mode démo
- **[Guide Facturation](docs/INVOICE_SYSTEM_COMPLETE.md)** : Stripe + PDF + statistiques
- **[Guide Webhooks](docs/WEBHOOK_IMPLEMENTATION.md)** : Événements Stripe complets
- **[Docker Workflow](docs/docker-workflow.md)** : Guide dev → prod + déploiement complet

### 🔧 **Guides Techniques Spécialisés**

- **[Système Tarifs](docs/SYSTEME_TARIFS_COMPLET.md)** : Tarification dynamique
- **[Messagerie API](docs/MESSAGES_API_GUIDE.md)** : Communication temps réel
- **[Reset Mot de Passe](docs/PASSWORD_RESET_GUIDE.md)** : Sécurité utilisateur
- **[Consultation Booking](docs/CONSULTATION_BOOKING_GUIDE.md)** : Réservation consultations
- **[Échantillon Gratuit](docs/FREE_SAMPLE_SYSTEM_GUIDE.md)** : Workflow échantillons
- **[RGPD Contact](docs/RGPD_CONTACT_GUIDE.md)** : Conformité légale
- **[Gestion Fichiers](docs/project-files-guide.md)** : Upload et stockage local
- **[Migration Fichiers](docs/FILE_MANAGEMENT_MIGRATION.md)** : AWS S3 → Stockage local

---

## 🎯 **Roadmap & Évolutions**

### ✅ **Version Production Déployée - 5 Août 2025**

- **Application en production** : Déployée sur [livrestaka.fr](https://livrestaka.fr/)
- **Infrastructure tests robuste** : 34 tests E2E Cypress + 57 tests backend (couverture optimisée)
- **Validation complète** : Tous workflows critiques testés et opérationnels
- **Documentation exhaustive** : 16 guides spécialisés mis à jour
- **Architecture scalable** : Prête pour croissance commerciale
- **Support production** : Monitoring et maintenance opérationnels
- **Migration AWS S3** : Stockage local unifié complètement opérationnel
- **Notifications centralisées** : EventBus avec emails automatiques fonctionnel

#### 🎯 **CORRECTIF CRITIQUE STRIPE - 30 JUILLET 2025** (✅ **RÉSOLU**)

**✅ PROBLÈME RÉSOLU** : Paiements Stripe maintenant **100% opérationnels** en production

**Corrections appliquées** :
- **Mode Stripe production** : Activation réelle des clés `sk_live_*` (fin du mode mock)
- **Webhook configuré** : `https://livrestaka.fr/payments/webhook` opérationnel  
- **Routes nginx** : Proxy `/payments/webhook` vers backend ajouté
- **Variables production** : `.env.prod` mis à jour avec secrets Stripe valides
- **Validation complète** : Tests de bout en bout Stripe → Backend → Webhook confirmés

**Impact** : Les clients peuvent maintenant effectuer de **vrais paiements** sur livrestaka.fr

### 🔮 **Q3 2025 : Extensions**

- [ ] Tests cross-browser (Chrome, Firefox, Safari)
- [ ] Tests mobile natifs (iOS, Android via Appium)
- [ ] Tests performance (Lighthouse CI intégré)
- [ ] Tests accessibilité (axe-core automation)
- [ ] Landing page A/B testing
- [ ] Analytics avancées (Google Analytics 4)

### 🚀 **Q4 2025 : Scale Enterprise**

- [ ] Tests de charge pour validation performance
- [ ] Tests sécurité automatisés avancés
- [ ] Visual regression tests 
- [ ] Optimisation pipeline CI/CD
- [ ] Extensions fonctionnelles selon feedback client
- [ ] Multi-tenant architecture si nécessaire

---

## 🎉 **État du Projet**

**✅ Application Production Déployée - 5 Août 2025**

🏆 **Plateforme en production** sur [livrestaka.fr](https://livrestaka.fr/) avec infrastructure robuste et tests complets validés.

🚀 **Déploiement réussi** : Tous les workflows critiques opérationnels, système de tests E2E Cypress fonctionnel, architecture Docker optimisée.

🔬 **Qualité production** : 34 tests E2E Cypress + 57 tests backend (couverture optimisée), validation continue des fonctionnalités.

🎯 **Améliorations récentes** : Migration AWS S3 → stockage local unifié complète, système de notifications centralisé avec EventBus opérationnel.

🎯 **Mission accomplie** : Application enterprise-grade déployée avec documentation exhaustive et support opérationnel.

**➡️ Plateforme prête pour croissance commerciale et développement continu !** 🌟

---

## 🛠️ **Scripts Disponibles**

### 📦 **Installation & Setup**

```bash
npm run install:all     # Installation toutes dépendances
```

### 🚀 **Développement**

```bash
npm run dev            # Lancement stack complète Docker
npm run dev:watch      # Mode hot-reload avec nodemon + Vite
npm run dev:frontend   # Frontend uniquement (port 3000)
npm run dev:backend    # Backend uniquement (port 3000)
```

### 🏗️ **Build & Production**

```bash
npm run build          # Build complet backend + frontend
npm run build:frontend # Build frontend uniquement
npm run build:backend  # Build backend uniquement
```

### 🧪 **Tests**

```bash
npm run test           # Tests backend complets
npm run test:backend   # Tests backend avec couverture
```

### 🐳 **Docker**

```bash
npm run docker:dev     # Stack développement
npm run docker:prod    # Stack production
npm run docker:build   # Build multi-architecture
npm run docker:build:push # Build + push registry
```

### 🚀 **Déploiement**

```bash
npm run deploy:vps     # Déploiement VPS automatisé
npm run deploy:vps:dry # Simulation déploiement

# Migration base de données
npm run migrate:db             # Migration complète
npm run migrate:db:schema      # Migration schéma uniquement  
npm run migrate:db:dry         # Simulation migration
npm run migrate:db:reverse     # Rollback migration
npm run migrate:db:reverse:dry # Simulation rollback
```

---

### 👨‍💻 **Développeur**

**👨‍💻 Développé par** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/) - Développeur full-stack spécialisé

### 📧 **Contact & Support**

- **Email production** : contact@staka.fr
- **Site web** : [livrestaka.fr](https://livrestaka.fr/)
- **Documentation** : Consultez le dossier `/docs/`

---

**🏆 Staka Livres - Plateforme professionnelle de correction de manuscrits** 📚✨
