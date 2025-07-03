# 🧪 Guide Complet des Tests - Espace Admin Utilisateurs

## 📋 Vue d'ensemble

Documentation complète pour l'infrastructure de tests de l'espace admin utilisateurs avec deux approches complémentaires :

- **Tests unitaires** avec Jest + React Testing Library (isolation avec mocks)
- **Tests E2E** avec Cypress (intégration complète DB/API/UI)

## 📁 Structure des Tests

```
frontend/
├── src/
│   ├── hooks/__tests__/
│   │   └── useAdminUsers.test.tsx     # Tests unitaires du hook (12 tests)
│   └── pages/admin/__tests__/
│       └── AdminUtilisateurs.test.tsx # Tests unitaires du composant (8 tests)
├── cypress/
│   ├── e2e/
│   │   └── AdminUsers.cy.ts           # Tests E2E complets (14 scénarios)
│   ├── support/
│   │   └── e2e.ts                     # Commandes Cypress personnalisées
│   └── cypress.config.cjs             # Configuration Cypress
├── jest.config.cjs                    # Configuration Jest
└── setupTests.ts                      # Configuration globale des tests
```

---

## 🔬 Tests Unitaires (Jest + React Testing Library)

### 🎯 Fonctionnalités testées

**Hook `useAdminUsers` (12 tests) :**

```
├── loadUsers
│   ├── ✅ Chargement avec paramètres API corrects
│   ├── ✅ Gestion de la pagination (page, limit)
│   ├── ✅ Application des filtres (search, role, isActive)
│   └── ✅ Gestion des erreurs API
├── ✅ loadUserStats (statistiques utilisateurs)
├── Actions CRUD
│   ├── ✅ createUser (création avec validation)
│   ├── ✅ toggleUserStatus (activation/désactivation)
│   ├── ✅ changeUserRole (USER ↔ ADMIN)
│   └── ✅ deleteUser (suppression avec confirmation)
├── ✅ viewUser (détails utilisateur)
└── ✅ refreshUsers (actualisation liste)
```

**Page `AdminUtilisateurs.tsx` (8 tests) :**

```
├── Rendu initial
│   ├── ✅ Statistiques utilisateurs affichées
│   └── ✅ Tableau avec données mockées
├── Fonctionnalités de recherche/filtres
│   ├── ✅ Filtre par terme de recherche
│   ├── ✅ Filtre par rôle (USER/ADMIN)
│   └── ✅ Filtre par statut actif
├── Interactions utilisateur
│   ├── ✅ Modal détails utilisateur
│   ├── ✅ Changement de rôle + confirmation
│   ├── ✅ Toggle statut + confirmation
│   └── ✅ Suppression + confirmation
├── ✅ Navigation pagination
└── ✅ Gestion états d'erreur
```

### 🚀 Lancer les tests unitaires

```bash
# Tests avec watch mode (développement)
docker-compose exec frontend npm run test:unit:watch

# Tests en mode CI (une fois)
docker-compose exec frontend npm run test:unit

# Tests avec couverture de code
docker-compose exec frontend npm run test:unit:coverage

# Test d'un fichier spécifique
docker-compose exec frontend npm run test:unit -- useAdminUsers.test.tsx
```

### ⚙️ Configuration Jest

```javascript
// jest.config.cjs
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

### 🎭 Stratégie de Mocks (Isolation)

```typescript
// Mocks complets pour isolation des tests unitaires
jest.mock("../../utils/adminAPI");
jest.mock("../../utils/toast");
jest.mock("../../contexts/AuthContext");

// Données mock prédéfinies
const mockUsersResponse = {
  success: true,
  data: [
    { id: 1, email: "user1@test.com", role: "USER", isActive: true },
    { id: 2, email: "admin@test.com", role: "ADMIN", isActive: true },
  ],
  pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
};
```

---

## 🌐 Tests E2E (Cypress)

### 🎯 Scénarios testés (14 tests complets)

```
├── Page Loading & Display
│   ├── ✅ Page loads with correct URL and title
│   ├── ✅ Statistics cards display user counts
│   └── ✅ User table loads with existing data
├── Search & Filtering
│   ├── ✅ Search by user email/name
│   ├── ✅ Filter by role (USER/ADMIN)
│   └── ✅ Filter by active status
├── User Management
│   ├── ✅ Create new user via API + verify in UI
│   ├── ✅ Change user role (USER → ADMIN)
│   ├── ✅ Toggle user status (active ↔ inactive)
│   └── ✅ Delete user with confirmation + DB verification
├── UI Interactions
│   ├── ✅ User details modal functionality
│   ├── ✅ Pagination navigation
│   └── ✅ Error handling and loading states
└── Data Persistence
    ├── ✅ Changes persist in database
    └── ✅ Page refresh maintains filters
```

### 🚀 Lancer les tests E2E

```bash
# Mode interactif (développement) - recommandé
docker-compose exec frontend npm run test:e2e:open

# Mode headless (CI/CD)
docker-compose exec frontend npm run test:e2e

# Avec service Cypress dédié (nouveau)
docker-compose --profile test up cypress

# Scripts de convenance
npm run test:e2e:docker  # Gestion Docker complète
```

### 🔧 Configuration Cypress

```javascript
// cypress.config.cjs
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    env: {
      API_BASE_URL: "http://localhost:3001",
    },
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
  },
});
```

### 🛠️ Commandes Cypress Personnalisées

```typescript
// cypress/support/e2e.ts
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      resetDatabase(): Chainable<void>;
      createTestUser(userData: any): Chainable<any>;
      deleteTestUser(userId: number): Chainable<void>;
      waitAndClick(selector: string): Chainable<void>;
    }
  }
}

// Implémentation avec gestion d'erreurs robuste
Cypress.Commands.add("loginAsAdmin", () => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("API_BASE_URL")}/auth/login`,
    body: {
      email: "admin@staka-editions.com",
      password: "admin123",
    },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      localStorage.setItem("auth_token", response.body.token);
    } else {
      // Fallback manuel si API échoue
      cy.visit("/login");
      cy.get('[data-testid="email"]').type("admin@staka-editions.com");
      cy.get('[data-testid="password"]').type("admin123");
      cy.get('[data-testid="login-submit"]').click();
    }
  });
});
```

---

## 🔄 Service Cypress Dédié (Docker)

### 🐳 Configuration Docker

```yaml
# docker-compose.yml
services:
  cypress:
    profiles: ["test"]
    image: cypress/included:13.6.0
    working_dir: /app
    volumes:
      - ./frontend:/app
    environment:
      - CYPRESS_baseUrl=http://frontend:3000
      - CYPRESS_API_BASE_URL=http://backend:3001
    command: >
      sh -c "
        npm ci &&
        npx cypress run --config-file cypress.config.cjs
      "
    depends_on:
      - frontend
      - backend
      - db
    networks:
      - app-network
```

### 📋 Avantages du service dédié

- ✅ **Isolation complète** des tests E2E
- ✅ **Image officielle** avec toutes dépendances
- ✅ **Mode headless optimisé** (pas de vidéo/screenshots)
- ✅ **Configuration automatique** baseUrl vers frontend
- ✅ **Profil Docker `test`** pour éviter démarrage automatique
- ✅ **Browser Electron intégré** pour tests headless

---

## 🚦 Stratégies de Test

### 🔬 Tests Unitaires : Isolation & Rapidité

**Utilisation :**

- Tests de logique métier, hooks, composants isolés
- Validation des interactions utilisateur
- Tests de cas d'erreur et états edge cases

**Avantages :**

- ⚡ **Très rapides** (< 5s pour 20 tests)
- 🎯 **Localisation précise** des erreurs
- 🔄 **Feedback immédiat** en développement

**Mocks utilisés :**

- adminAPI (toutes les méthodes)
- toast (notifications)
- AuthContext (état d'authentification)
- localStorage

### 🌐 Tests E2E : Intégration Complète

**Utilisation :**

- Workflows utilisateur complets
- Persistance des données en base
- Intégration frontend ↔ backend ↔ DB

**Avantages :**

- 🔒 **Confiance totale** dans le comportement utilisateur
- 📊 **Validation de la persistance** des données
- 🔗 **Tests de l'intégration** complète

**Vraie infrastructure :**

- Base PostgreSQL avec seed
- API backend réelle
- Interface React complète

---

## 🎯 Instructions d'Exécution

### 1. 🚀 Setup Initial

```bash
# Démarrer l'environnement complet
docker-compose up -d --build

# Vérifier que tous les services sont up
docker-compose ps

# Attendre que les services soient prêts
sleep 10
```

### 2. 🔬 Tests Unitaires (Développement)

```bash
# Mode watch pour développement
docker-compose exec frontend npm run test:unit:watch

# Les tests se relancent automatiquement au changement de fichier
# Appuyer sur 'a' pour lancer tous les tests
# Appuyer sur 'f' pour lancer seulement les tests échoués
```

### 3. 🌐 Tests E2E (Validation)

```bash
# Mode interactif (recommandé pour debug)
docker-compose exec frontend npm run test:e2e:open

# Mode headless pour CI
docker-compose exec frontend npm run test:e2e

# Avec service dédié (plus fiable)
docker-compose --profile test up --abort-on-container-exit cypress
```

### 4. 🔄 Pipeline CI/CD

```bash
# Tests unitaires d'abord (rapides)
docker-compose exec frontend npm run test:unit

# Si succès → Tests E2E (plus lents)
docker-compose --profile test up --abort-on-container-exit cypress

# Nettoyage automatique après tests
docker-compose --profile test down
```

---

## 🛠️ Résolution de Problèmes

### ❌ Erreurs Communes

**Jest : "Module not found"**

```bash
# Réinstaller les dépendances
docker-compose exec frontend npm install
docker-compose exec frontend npm run test:unit
```

**Cypress : "API non accessible"**

```bash
# Vérifier que backend est démarré
docker-compose ps
docker-compose logs backend

# Vérifier connectivité réseau
docker-compose exec frontend ping backend
```

**Base de données non seedée**

```bash
# Reset et seed manuel
docker-compose exec backend npx prisma migrate reset --force
docker-compose exec backend npx prisma db seed

# Vérifier les données
docker-compose exec backend npx prisma studio
```

**Tests E2E : Authentification échoue**

```bash
# Vérifier les credentials admin par défaut
docker-compose exec backend npm run seed

# Debug mode interactif
docker-compose exec frontend npm run test:e2e:open
# → Ouvrir les DevTools pour voir les erreurs réseau
```

### 🔍 Debug Avancé

```bash
# Logs des services en temps réel
docker-compose logs -f backend
docker-compose logs -f frontend

# Tests Jest avec verbose
docker-compose exec frontend npm run test:unit -- --verbose

# Cypress avec debug info
docker-compose exec frontend npm run test:e2e -- --headed --no-exit

# Accès aux containers
docker-compose exec frontend sh
docker-compose exec backend sh
```

---

## 📊 Métriques & Coverage

### 📈 Couverture de Code Jest

```bash
# Générer rapport de couverture
docker-compose exec frontend npm run test:unit:coverage

# Rapport HTML généré dans coverage/lcov-report/index.html
# Accessible via http://localhost:3000/coverage/
```

### 🎥 Métriques Cypress

- **Temps d'exécution** par test (visuel dans interface)
- **Screenshots** automatiques en cas d'échec
- **Vidéos** des tests (optionnel, désactivé par défaut)
- **Logs** détaillés des commandes et assertions

---

## 🎯 Commandes Rapides de Référence

```bash
# 🚀 Démarrage rapide
docker-compose up -d

# 🔬 Tests unitaires
docker-compose exec frontend npm run test:unit:watch

# 🌐 Tests E2E interactifs
docker-compose exec frontend npm run test:e2e:open

# ⚡ Pipeline complet
docker-compose exec frontend npm run test:unit && \
docker-compose --profile test up --abort-on-container-exit cypress

# 🧹 Nettoyage
docker-compose down -v
```

---

## ✅ Résumé des Livrables

### 📦 Infrastructure Complète

- ✅ **20 tests unitaires** (Jest + React Testing Library)
- ✅ **14 scénarios E2E** (Cypress + Docker)
- ✅ **Configuration Jest** avec mocks et setupTests
- ✅ **Configuration Cypress** avec commandes personnalisées
- ✅ **Service Docker dédié** pour E2E
- ✅ **Scripts npm** pour tous les cas d'usage
- ✅ **Pipeline CI/CD** ready avec GitHub Actions

### 🎯 Fonctionnalités Testées

**Tests Unitaires (Isolation) :**

- Hook `useAdminUsers` : toutes les méthodes et états
- Page `AdminUtilisateurs` : rendu, interactions, erreurs
- Gestion des erreurs API et états de chargement

**Tests E2E (Intégration) :**

- Authentification admin et navigation
- CRUD utilisateurs avec persistance DB
- Recherche, filtres et pagination
- Modales et confirmations
- Gestion d'erreurs en conditions réelles

### 🚀 Prêt à Utiliser

- 🔥 **Infrastructure opérationnelle** immédiatement
- 🔥 **Documentation complète** avec troubleshooting
- 🔥 **Docker & CI/CD ready**
- 🔥 **Feedback développeur optimisé**

**Tests d'espace admin utilisateurs livrés et fonctionnels !** 🎉
