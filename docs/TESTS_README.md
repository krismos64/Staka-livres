# 🧪 Guide Complet des Tests - Staka Livres

## 📋 Vue d'ensemble

Documentation complète pour l'infrastructure de tests du projet **Staka Livres**, couvrant le frontend et le backend avec des stratégies complémentaires.

---

## 🏗️ Architecture des Tests

```
.
├── backend/
│   └── tests/
│       ├── integration/ # Tests API complets (Supertest + Prisma)
│       │   ├── adminCommandeEndpoints.test.ts
│       │   └── adminUserEndpoints.test.ts
│       └── unit/        # Tests unitaires (Jest)
│           ├── adminCommandeService.test.ts
│           └── adminUserService.test.ts
└── frontend/
    ├── src/
    │   ├── hooks/__tests__/
    │   │   ├── useAdminUsers.test.tsx      # Tests unitaires hook utilisateurs
    │   │   └── useAdminCommandes.test.ts   # Tests unitaires hook commandes (NOUVEAU)
    │   └── pages/admin/__tests__/
    │       └── AdminUtilisateurs.test.tsx  # Tests unitaires composant page
    └── cypress/
        └── e2e/
            └── AdminUsers.cy.ts            # Tests E2E UI
```

---

## 🖥️ Tests Frontend

### 🔬 Tests Unitaires (Jest + React Testing Library)

#### **🎯 Fonctionnalités testées**

**Hook `useAdminUsers` (12 tests) :**

- Chargement, pagination et filtres des utilisateurs.
- Gestion des statistiques.
- Actions CRUD (création, toggle statut, suppression).

**Hook `useAdminCommandes` (15+ tests) - NOUVEAU :**

- Chargement, pagination et filtres des commandes.
- Mise à jour du statut d'une commande (avec optimistic update).
- Suppression d'une commande.
- Gestion des notes.
- Gestion fine des états de chargement et des erreurs.

**Page `AdminUtilisateurs.tsx` (8 tests) :**

- Rendu initial et affichage des données mockées.
- Interactions utilisateur (filtres, modales, suppression).
- Pagination et gestion des erreurs.

#### **🚀 Lancer les tests unitaires frontend**

```bash
# Lancer tous les tests unitaires en mode watch
docker-compose exec frontend npm run test:unit:watch

# Lancer une seule fois (pour CI)
docker-compose exec frontend npm run test:unit

# Obtenir la couverture de code
docker-compose exec frontend npm run test:unit:coverage
```

### 🌐 Tests E2E (Cypress)

#### **🎯 Scénarios testés (14 scénarios)**

Les tests E2E valident le parcours complet de l'administrateur pour la gestion des utilisateurs, de la connexion à la suppression, en interagissant avec une vraie base de données.

- Connexion et affichage du tableau de bord.
- CRUD complet sur un utilisateur de test.
- Recherche, filtres et pagination.
- Persistance des données après rechargement.

#### **🚀 Lancer les tests E2E**

```bash
# Mode interactif (recommandé pour le développement)
docker-compose exec frontend npm run test:e2e:open

# Mode headless (pour CI)
docker-compose exec frontend npm run test:e2e
```

---

## ⚙️ Tests Backend

### 🔬 Tests Unitaires (Jest)

Les tests unitaires du backend se concentrent sur la logique métier des `Services`, en isolant la base de données avec des mocks de Prisma.

- **`adminUserService.test.ts`**: Valide la logique de création, modification, suppression des utilisateurs et la gestion des cas particuliers (ex: dernier admin).
- **`adminCommandeService.test.ts`**: Valide la logique de filtrage des commandes, le calcul des statistiques et la mise à jour des statuts.

### 🔗 Tests d'Intégration (Jest + Supertest)

Ces tests vérifient le comportement des endpoints de l'API de bout en bout, en utilisant une base de données de test réelle.

- **`adminUserEndpoints.test.ts`**: Simule des appels HTTP sur les routes `/admin/users` et vérifie les codes de statut, les réponses et les modifications en base de données.
- **`adminCommandeEndpoints.test.ts`**: Fait de même pour les routes `/admin/commandes`.

### 🚀 Lancer les tests backend

```bash
# Lancer tous les tests du backend (unitaires + intégration)
docker-compose exec backend npm test

# Lancer un fichier de test spécifique
docker-compose exec backend npm test -- tests/unit/adminUserService.test.ts
```

---

## 🚦 Stratégie Globale et CI/CD

Le pipeline de CI devrait exécuter les tests dans cet ordre :

1.  **Tests Unitaires Backend** (rapides)
2.  **Tests Unitaires Frontend** (rapides)
3.  **Tests d'Intégration Backend**
4.  **Tests E2E Frontend** (plus lents, mais valident l'intégration complète)

```bash
# Exemple de script pour CI
npm run test:backend && \
npm run test:frontend:unit && \
npm run test:frontend:e2e
```
