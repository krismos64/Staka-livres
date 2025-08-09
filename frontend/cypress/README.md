# Tests E2E Cypress - Staka Livres

## 📚 Documentation Principale

**Cette documentation a été consolidée dans le guide complet des tests.**

👉 **Consultez la documentation complète et à jour** : [`/docs/TESTS_COMPLETE_GUIDE.md`](../../docs/TESTS_COMPLETE_GUIDE.md)

Le guide complet contient :
- ✅ **Architecture complète des tests E2E** (34 tests organisés en 3 niveaux)
- ✅ **Commandes Cypress personnalisées** détaillées
- ✅ **Scripts d'exécution** et configuration
- ✅ **Bonnes pratiques de développement** E2E
- ✅ **Debugging et troubleshooting** complets
- ✅ **Tests de paiement Stripe** enterprise-grade
- ✅ **Intégration CI/CD** et métriques

## 🚀 Commandes Rapides

```bash
# Tous les tests E2E
npm run test:e2e

# Mode interactif (debug)
npm run test:e2e:open

# Tests critiques uniquement
npm run test:e2e:critical

# Test workflow complet spécifique
npx cypress run --spec "cypress/e2e/legacy/ClientWorkflow.cy.ts"
```

## 🎯 Structure Actuelle

```
cypress/
├── e2e/
│   ├── critical/        # Tests critiques CI/CD (13 tests)
│   ├── smoke/           # Health checks (1 test)  
│   ├── integration/     # Tests complets (7 tests)
│   └── legacy/          # Tests organisés (13 tests)
├── fixtures/            # Données de test
├── support/            # Commandes personnalisées
└── README.md          # Ce fichier (pointe vers la doc principale)
```

---

**📖 Pour toute information détaillée, consultez le guide complet** : [`/docs/TESTS_COMPLETE_GUIDE.md`](../../docs/TESTS_COMPLETE_GUIDE.md)