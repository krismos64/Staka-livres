# 📚 Staka Livres - Plateforme de Correction de Manuscrits

## 🎯 Présentation du Projet

**Staka Livres** est une plateforme web moderne dédiée aux **services de correction et d'édition de manuscrits**. L'application offre une expérience complète aux auteurs, de la découverte des services jusqu'à la gestion avancée de leurs projets éditoriaux.

### 🌟 **Vision**

Démocratiser l'accès aux services éditoriaux professionnels en offrant une plateforme intuitive, transparente et efficace pour tous les auteurs, qu'ils soient débutants ou confirmés.

### 🎨 **Interface Moderne**

- **Landing Page** marketing optimisée pour la conversion
- **Dashboard client** avec gestion complète des projets
- **Design responsive** mobile-first avec animations fluides
- **UX premium** avec micro-interactions et feedback temps réel

---

## 🏗️ Architecture Monorepo

### 📁 **Structure du Projet**

```
Staka-livres/
├── backend/                 # API Node.js + Express + Prisma
│   ├── src/
│   │   ├── server.ts       # Point d'entrée principal
│   │   ├── controllers/    # Contrôleurs API
│   │   ├── routes/         # Routes Express
│   │   ├── services/       # Logique métier
│   │   ├── middleware/     # Middlewares Express
│   │   ├── config/         # Configuration
│   │   ├── types/          # Types TypeScript
│   │   └── utils/          # Utilitaires
│   ├── prisma/
│   │   └── schema.prisma   # Schéma base de données
│   ├── tests/              # Tests backend
│   ├── package.json        # Dépendances backend
│   ├── Dockerfile          # Container backend
│   ├── nodemon.json        # Config nodemon
│   └── tsconfig.json       # Config TypeScript
├── frontend/                # Application React + Vite
│   ├── src/
│   │   ├── app.tsx         # App React principale
│   │   ├── main.tsx        # Point d'entrée
│   │   ├── components/     # Composants React
│   │   │   ├── landing/    # Composants landing page
│   │   │   ├── layout/     # Layout et navigation
│   │   │   ├── forms/      # Formulaires
│   │   │   ├── modals/     # Modales
│   │   │   ├── billing/    # Facturation
│   │   │   ├── messages/   # Messagerie
│   │   │   ├── project/    # Gestion projets
│   │   │   └── common/     # Composants communs
│   │   ├── pages/          # Pages React
│   │   ├── styles/         # Styles CSS globaux
│   │   └── utils/          # Utilitaires frontend
│   ├── package.json        # Dépendances frontend
│   ├── Dockerfile          # Container frontend
│   ├── vite.config.js      # Config Vite
│   └── tailwind.config.js  # Config Tailwind
├── shared/                  # Types et utils partagés
│   ├── types/
│   │   └── index.ts        # Types communs
│   └── package.json        # Dépendances partagées
├── docker-compose.yml       # Orchestration Docker
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
- **JWT** : Authentification sécurisée
- **bcryptjs** : Hachage des mots de passe
- **cors** : Gestion des requêtes cross-origin
- **helmet** : Sécurité HTTP
- **winston** : Logging avancé
- **nodemon** : Rechargement automatique en dev
- **ts-node** : Exécution TypeScript directe

### 🎨 **Frontend (React)**

- **React 18** : Framework JavaScript moderne avec hooks
- **TypeScript** : Typage statique pour la robustesse
- **Vite** : Build tool ultra-rapide avec HMR
- **Tailwind CSS** : Framework CSS utility-first
- **Framer Motion** : Animations fluides et performantes
- **React Dropzone** : Upload de fichiers avancé

### 🗄️ **Base de Données**

- **MySQL 8** : Base de données principale
- **Prisma Client** : ORM type-safe
- **Prisma Migrate** : Gestion des migrations

### 🐳 **DevOps et Déploiement**

- **Docker** : Conteneurisation des services
- **Docker Compose** : Orchestration multi-services
- **npm workspaces** : Gestion monorepo
- **Nginx** : Serveur web (frontend en prod)

---

## 📦 Installation et Configuration

### 🔧 **Prérequis**

- **Node.js** 18+ et npm 9+
- **Docker** et Docker Compose (recommandé)
- **Git** pour le clonage du repository

### 🚀 **Installation avec Docker (Recommandée)**

#### **1. Cloner le Repository**

```bash
git clone https://github.com/votre-repo/staka-livres.git
cd Staka-livres
```

#### **2. Lancement avec Docker Compose**

```bash
# Construire et lancer tous les services
docker-compose up --build

# En arrière-plan (optionnel)
docker-compose up -d --build
```

#### **3. Accès à l'Application**

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Health Check** : http://localhost:3001/health
- **Base MySQL** : localhost:3306
- **Hot Reload** : Activé automatiquement

#### **4. Arrêt des Services**

```bash
# Arrêter les conteneurs
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v
```

### 💻 **Installation Locale (Alternative)**

#### **1. Installation des Dépendances**

```bash
# Installation workspace root + tous les packages
npm install

# Ou installation manuelle par workspace
npm install --workspace=backend
npm install --workspace=frontend
npm install --workspace=shared
```

#### **2. Configuration de l'Environnement**

```bash
# Créer le fichier d'environnement backend
cp backend/.env.example backend/.env

# Éditer les variables d'environnement
nano backend/.env
```

#### **3. Lancement en Développement**

```bash
# Lancer tous les services (concurrent)
npm run dev

# Ou lancer séparément
npm run dev:frontend    # Frontend Vite sur :3000
npm run dev:backend     # Backend Express sur :3001
```

#### **4. Build de Production**

```bash
# Build frontend + backend
npm run build

# Build séparé par workspace
npm run build:frontend
npm run build:backend
```

---

## 🗄️ Configuration Base de Données

### 🔧 **Prisma Setup**

```bash
# Dans le container backend ou localement
cd backend

# Génération du client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma db push

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
```

### 🎨 **Scripts Frontend**

```bash
# Serveur dev Vite avec HMR
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

- **frontend** : Application React (Vite dev server)
- **backend** : API Node.js (nodemon + ts-node)
- **db** : Base MySQL 8

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

# Nettoyage complet
docker-compose down -v --rmi all
docker system prune -af
```

---

## 🛠 Débogage Docker

### ❌ **Erreurs Fréquentes et Solutions**

#### **1. `sh: nodemon: not found`**

**Problème** : nodemon n'est pas installé dans le container backend

```bash
# Solution : Vérifier le Dockerfile backend
# Assurer que `RUN npm ci` installe les devDependencies
# (ne pas utiliser --only=production en dev)
```

#### **2. `Cannot find module '/app/backend/dist/server.js'`**

**Problème** : nodemon essaie d'exécuter un fichier compilé inexistant

```bash
# Solution : Vérifier nodemon.json
# Doit contenir : "exec": "ts-node src/server.ts"
```

#### **3. `No workspaces found`**

**Problème** : npm workspaces mal configuré dans Docker

```bash
# Solution : Copier package.json root avant les workspaces
# COPY package*.json ./
# COPY backend/package*.json ./backend/
```

#### **4. `Error: Cannot find module '@prisma/client'`**

**Problème** : Client Prisma non généré

```bash
# Solution : Ajouter dans Dockerfile backend
# RUN npx prisma generate
```

#### **5. `EADDRINUSE: address already in use`**

**Problème** : Ports déjà utilisés

```bash
# Solution : Vérifier les ports utilisés
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :3306  # MySQL

# Ou changer les ports dans docker-compose.yml
```

#### **6. `MySQL Connection Error`**

**Problème** : Backend ne peut pas se connecter à MySQL

```bash
# Solution : Vérifier DATABASE_URL et attendre que MySQL démarre
# Ajouter depends_on dans docker-compose.yml
# Vérifier que le nom de service "db" est correct
```

### 🔧 **Debug Avancé**

```bash
# Inspecter les logs détaillés
docker-compose logs --details backend

# Vérifier les variables d'environnement
docker-compose exec backend env

# Tester la connectivité entre services
docker-compose exec backend ping db
docker-compose exec frontend curl http://backend:3001/health

# Vérifier les volumes montés
docker-compose exec backend ls -la /app
```

---

## 📊 Métriques du Projet

### 📈 **Architecture Monorepo**

- **Services** : 3 services Docker (frontend, backend, db)
- **Workspaces** : 3 packages npm (frontend, backend, shared)
- **Lignes de code** : ~4,000 lignes TypeScript/React
- **Composants** : 50+ composants React réutilisables
- **API Endpoints** : Base REST avec middleware sécurisé

### ⚡ **Performance**

- **Docker Build** : Build en parallèle optimisé
- **Hot Reload** : <100ms avec Vite HMR + nodemon
- **Database** : Prisma ORM avec requêtes optimisées
- **Frontend** : Code splitting et lazy loading
- **Backend** : Express.js avec middleware de cache

### 🎯 **Sécurité**

- **Helmet.js** : Headers sécurisés HTTP
- **CORS** : Configuration cross-origin stricte
- **JWT** : Authentification stateless
- **bcryptjs** : Hachage sécurisé des mots de passe
- **Rate Limiting** : Protection DDoS
- **Input Validation** : Zod schemas

---

## 🤝 Contribution et Développement

### 🔄 **Workflow de Développement**

1. **Fork** du repository
2. **Installation** : `npm install` (workspaces auto)
3. **Développement** : `docker-compose up --build`
4. **Tests** : `npm run test:backend`
5. **Build** : `npm run build`
6. **Pull Request** avec description

### 📝 **Standards de Code**

- **TypeScript** : Strict mode activé
- **ESLint** : Configuration React + Node.js
- **Prettier** : Formatage automatique
- **Conventions** :
  - Naming kebab-case pour fichiers
  - PascalCase pour composants React
  - camelCase pour fonctions/variables

### 🧪 **Tests et Qualité**

```bash
# Tests backend (Jest)
npm run test --workspace=backend

# Linting frontend
npm run lint --workspace=frontend

# Build validation
npm run build

# Type checking
npx tsc --noEmit --workspace=backend
npx tsc --noEmit --workspace=frontend
```

---

## 🎯 Prochaines Étapes

### 🚧 **Développement à Venir**

- **API REST** : Endpoints complets pour CRUD projets
- **Authentification** : JWT + refresh tokens
- **Upload de Fichiers** : Multer + stockage sécurisé
- **Messagerie Temps Réel** : WebSockets avec Socket.io
- **Paiements** : Intégration Stripe
- **Notifications** : Email + push notifications

### 📦 **Déploiement Production**

- **Docker Multi-stage** : Builds optimisés
- **Nginx Reverse Proxy** : Load balancing
- **SSL/TLS** : Certificats Let's Encrypt
- **CI/CD** : GitHub Actions pipeline
- **Monitoring** : Logs centralisés + métriques

---

## 🏆 Conclusion

**Staka Livres** est une plateforme moderne construite avec une architecture monorepo robuste. La séparation claire entre frontend React, backend Node.js et base de données MySQL offre une base solide pour le développement et la maintenance.

### ✅ **Points Forts Techniques**

- **Monorepo** : Structure claire avec npm workspaces
- **Docker** : Environnement de développement consistant
- **TypeScript** : Type safety sur toute la stack
- **Prisma** : ORM moderne avec migrations automatiques
- **Hot Reload** : Développement rapide frontend + backend

### 🎯 **Usage Recommandé**

- **Développement** : `docker-compose up --build`
- **Debug** : Logs Docker + inspection containers
- **Production** : Builds optimisés multi-stage
- **Maintenance** : npm workspaces + Prisma migrations

Cette architecture garantit une expérience de développement fluide et une scalabilité future pour les fonctionnalités avancées de la plateforme éditorial.
