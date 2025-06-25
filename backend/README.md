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
│   │   └── paymentController.ts   # Paiements Stripe
│   ├── middleware/           # Middlewares de sécurité
│   │   ├── auth.ts               # Authentification JWT
│   │   └── requireRole.ts        # Contrôle d'accès par rôle
│   ├── routes/              # Définition des routes
│   │   ├── auth.ts              # Routes d'authentification
│   │   ├── admin.ts             # Routes administrateur
│   │   ├── commandes.ts         # Routes commandes client
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

## 🎯 **Webhook Stripe - Nouveau Système**

### Configuration

Le nouveau système de webhook Stripe est implémenté avec une architecture modulaire et robuste :

````typescript
// Routeur séparé : src/routes/payments/webhook.ts
// Body parser raw configuré dans server.ts AVANT express.json()
app.use(
  "/payments/webhook",
  bodyParser.raw({ type: "application/json" }),
  webhookRoutes
);

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
````

### Service InvoiceService

- **`generateInvoicePDF()`** : Génère un PDF professionnel avec PDFKit
- **`uploadInvoicePdf()`** : Upload sur AWS S3 avec gestion d'erreurs
- **`processInvoiceForCommande()`** : Processus complet de facturation

### MailerService

- **SendGrid** intégré pour l'envoi d'emails
- Templates HTML responsives
- Gestion des erreurs et fallback

````

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
````

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

### Routes admin (`/admin`)

```http
# Statistiques générales
GET /admin/stats
Authorization: Bearer admin_token

# Liste des utilisateurs
GET /admin/users
Authorization: Bearer admin_token

# Détail utilisateur
GET /admin/user/:id
Authorization: Bearer admin_token

# Liste des commandes
GET /admin/commandes
Authorization: Bearer admin_token

# Mettre à jour statut commande
PATCH /admin/commande/:id
Authorization: Bearer admin_token
Content-Type: application/json

{
  "statut": "EN_COURS"
}
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
│   └── paymentController.test.ts
├── routes/
│   ├── auth.test.ts
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

**Backend Staka Livres** - API REST moderne pour plateforme de correction de livres
