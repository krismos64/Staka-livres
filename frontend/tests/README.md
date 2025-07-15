# Tests Frontend

Ce dossier contient différents types de tests pour le frontend de Staka Livres.

## Types de tests

### Tests unitaires (`src/__tests__/`)
Tests isolés des composants, hooks et fonctions utilitaires.
- **Exécution**: `yarn test:unit`
- **Environnement**: Jsdom uniquement
- **Mocks**: Entièrement mockés

### Tests d'intégration (`tests/integration/`)
Tests qui interagissent avec le backend réel.
- **Exécution**: `yarn test:integration`
- **Environnement**: Nécessite backend en fonctionnement
- **Prérequis**: `docker compose up -d`

### Tests E2E (`cypress/`)
Tests bout-en-bout avec Cypress.
- **Exécution**: `yarn test:e2e`
- **Environnement**: Application complète

## Commandes

```bash
# Tests unitaires uniquement (CI/CD)
yarn test:unit

# Tests d'intégration (local avec backend)
yarn test:integration

# Tous les tests (local)
yarn test:all

# Tests E2E
yarn test:e2e

# Mode interactif
yarn test
```

## CI/CD

- **GitHub Actions**: Exécute uniquement `test:unit`
- **Tests d'intégration**: Exclus du CI (nécessitent backend)
- **Tests E2E**: Workflow séparé avec Docker

## Structure

```
tests/
├── integration/          # Tests d'intégration API
│   ├── admin-users-integration.test.ts
│   └── test-billing-integration.md
├── unit/                 # Tests unitaires complémentaires
└── README.md            # Ce fichier
```