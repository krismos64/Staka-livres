# Tests E2E Cypress - Staka Livres

Ce dossier contient tous les tests End-to-End (E2E) pour l'application Staka Livres, utilisant Cypress pour valider le workflow complet de l'application.

## 🎯 Objectifs des Tests E2E

Les tests E2E valident le parcours utilisateur complet depuis la création d'un projet jusqu'à la livraison finale, en passant par :
- Authentification utilisateur
- Création et configuration de projets
- Processus de paiement Stripe
- Workflow administrateur
- Génération de factures
- Système de notifications

## 📁 Structure des Dossiers

```
cypress/
├── e2e/                     # Tests E2E
│   ├── ClientWorkflow.cy.ts # Test du workflow complet client
│   ├── AdminUsers.cy.ts     # Tests de gestion des utilisateurs
│   └── ...autres tests
├── fixtures/                # Fichiers de test (données mock)
│   ├── test-manuscript.docx # Manuscrit fictif pour les uploads
│   └── ...autres fixtures
├── support/                 # Helpers et commandes personnalisées
│   ├── e2e.ts              # Commandes Cypress personnalisées
│   └── component.ts        # Support pour tests de composants
└── README.md               # Cette documentation
```

## 🚀 Tests Principaux

### 1. ClientWorkflow.cy.ts

**Test le plus important** : Valide le workflow complet de l'application.

#### Scénarios couverts :
- ✅ **Workflow Principal** : Utilisateur → Création projet → Paiement → Admin traite → Livraison
- ✅ **Échec de Paiement** : Gestion des erreurs Stripe et maintien du statut EN_ATTENTE
- ✅ **Workflow Admin** : Changements de statut et notifications avancées

#### Étapes du test principal :
1. **Connexion Utilisateur** : Authentification via API ou interface
2. **Création Projet** : Formulaire complet avec upload de fichier
3. **Processus Paiement** : Simulation Stripe avec cartes de test
4. **Vérification Admin** : Changement de statut EN_COURS → TERMINÉ
5. **Validation Client** : Téléchargement disponible et facture générée

### 2. AdminUsers.cy.ts

Tests de gestion des utilisateurs dans l'espace administrateur :
- Affichage et recherche d'utilisateurs
- Modification des rôles (USER ↔ ADMIN)
- Activation/désactivation de comptes
- Suppression d'utilisateurs

## 🛠️ Commandes Personnalisées

Les commandes suivantes sont disponibles dans tous les tests :

### Authentification
```typescript
cy.loginAsUser()          // Connexion utilisateur standard
cy.loginAsAdmin()         // Connexion administrateur
cy.logout()               // Déconnexion
```

### Gestion des Données
```typescript
cy.resetDatabase()        // Réinitialisation base de données
cy.createTestUser(data)   // Création utilisateur via API
cy.deleteTestUser(id)     // Suppression utilisateur
```

### Paiements Stripe
```typescript
cy.simulateStripePayment()        // Paiement réussi (4242...)
cy.simulateStripePaymentFailure() // Échec paiement (4000...0002)
```

### Projets
```typescript
cy.createPaidProject(title)       // Création projet payé via API
```

### Utilitaires
```typescript
cy.waitAndClick(selector)         // Attendre + cliquer élément
```

## ⚙️ Configuration

### cypress.config.cjs
```javascript
{
  baseUrl: "http://localhost:5173",        // Frontend dev
  env: {
    API_BASE_URL: "http://localhost:3001"  // Backend API
  }
}
```

### Variables d'Environnement
- `CYPRESS_baseUrl` : URL du frontend (défaut: localhost:5173)
- `CYPRESS_API_BASE_URL` : URL de l'API backend (défaut: localhost:3001)

## 🏃‍♂️ Exécution des Tests

### Prérequis
1. **Démarrer l'environnement Docker** :
   ```bash
   npm run dev:watch
   ```
   
2. **Attendre que tous les services soient en ligne** (backend + frontend + base)

### Commandes d'Exécution

```bash
# Tous les tests E2E
npm run test:e2e

# Test spécifique (workflow complet)
npx cypress run --spec cypress/e2e/ClientWorkflow.cy.ts

# Mode interactif (pour debug)
npm run test:e2e:open

# Avec Docker (environnement isolé)
npm run test:e2e:docker
```

### Validation des Tests (sans exécution)

```bash
# Valider la structure des tests sans les exécuter
node validate-e2e-test.cjs
```

## 🔧 Développement des Tests

### Bonnes Pratiques

1. **Sélecteurs** : Utiliser `data-cy` attributes pour les éléments testés
   ```html
   <button data-cy="create-project-submit">Créer</button>
   ```

2. **Attentes** : Toujours utiliser des timeouts appropriés
   ```typescript
   cy.contains("Résultat", { timeout: 10000 }).should("be.visible");
   ```

3. **Isolation** : Chaque test doit être indépendant
   ```typescript
   beforeEach(() => {
     cy.resetDatabase();
   });
   ```

4. **Mock des Services Externes** : Stripe, S3, etc.
   ```typescript
   // Cartes de test Stripe
   // Succès: 4242424242424242
   // Échec: 4000000000000002
   ```

### Structure d'un Test Type

```typescript
describe("Mon Feature - Tests E2E", () => {
  beforeEach(() => {
    cy.resetDatabase();
  });

  it("devrait faire quelque chose d'important", () => {
    // 1. Setup
    cy.loginAsUser();
    
    // 2. Action
    cy.visit("/ma-page");
    cy.get('[data-cy="mon-bouton"]').click();
    
    // 3. Vérification
    cy.contains("Succès").should("be.visible");
  });
});
```

## 🐛 Debugging

### Logs Utiles
```typescript
cy.log("🔵 ÉTAPE 1: Description de l'étape");
```

### Captures d'Écran
Les captures d'écran sont automatiques en cas d'échec (configuré dans `cypress.config.cjs`).

### Mode Interactif
```bash
npx cypress open
```

## 📊 Métriques et Couverture

- **Objectif de couverture** : >90% des workflows critiques
- **Tests actuels** : Workflow complet + Admin + Edge cases
- **Temps d'exécution** : ~3-5 minutes pour tous les tests

## 🚨 Troubleshooting

### Problèmes Courants

1. **"Server not running"** : Vérifier que `npm run dev:watch` fonctionne
2. **Tests qui traînent** : Augmenter les timeouts dans `cypress.config.cjs`
3. **Problèmes d'authentification** : Vérifier les credentials dans `cy.loginAsUser()`
4. **Échecs aléatoires** : Ajouter des `cy.wait()` appropriés

### Commandes de Debug

```bash
# Voir les logs Docker
docker compose logs backend
docker compose logs frontend

# Vérifier l'état des services
docker compose ps

# Nettoyer les containers
docker compose down -v && docker compose up --build
```

## 🎯 Prochaines Améliorations

- [ ] Tests de régression pour les bugs critiques
- [ ] Tests de performance (temps de chargement)
- [ ] Tests d'accessibilité (a11y)
- [ ] Tests de responsivité mobile
- [ ] Intégration CI/CD avec rapports détaillés

---

**Note** : Ces tests E2E constituent la validation finale de l'application. Ils doivent être maintenus à jour avec chaque nouvelle fonctionnalité critique.