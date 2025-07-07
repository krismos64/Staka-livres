# 🧪 Guide Complet - Tests Tarifs Dynamiques

## 📋 Vue d'Ensemble

Ce guide permet de valider complètement l'intégration des **tarifs dynamiques** avec :

- ✅ Tests unitaires Vitest (invalidation cache, synchronisation, erreurs)
- ✅ Tests E2E Cypress (admin → landing sync)
- ✅ Couverture de code
- ✅ Validation QA complète

---

## 🚀 Étape 1 : Préparation de l'Environnement

### 1.1 Naviguez dans le répertoire frontend

```bash
cd frontend
```

### 1.2 Vérifiez les dépendances

```bash
# Installer/mettre à jour les dépendances si nécessaire
npm install

# Vérifier que vitest et cypress sont installés
npm list vitest cypress
```

### 1.3 Vérifiez les fixtures Cypress

```bash
# Les fixtures doivent être présentes
ls -la cypress/fixtures/
# Devrait afficher :
# - tarifs-initial.json
# - admin-tarifs.json
```

---

## 🧪 Étape 2 : Tests Unitaires Vitest

### 2.1 Lancer tous les tests unitaires liés aux tarifs

```bash
# Tests spécifiques aux tarifs avec coverage
npx vitest run src/__tests__/tarifsInvalidation.test.tsx --coverage

# Alternative : lancer tous les tests unitaires
npm run test:run

# Mode watch pour développement
npm run test -- src/__tests__/tarifsInvalidation.test.tsx --watch
```

### 2.2 Lancer avec coverage détaillée

```bash
# Coverage complète du projet
npm run test:coverage

# Coverage spécifique aux composants tarifs
npx vitest run --coverage --coverage.include="**/landing/**" --coverage.include="**/ui/**"
```

### 2.3 Interface UI interactive (optionnel)

```bash
# Interface graphique Vitest
npm run test:ui
# Puis ouvrir http://localhost:51204
```

---

## 🌐 Étape 3 : Tests E2E Cypress

### 3.1 Préparation de l'environnement

```bash
# Assurez-vous que le backend est démarré
# Dans un autre terminal :
cd ../backend
npm run dev

# OU avec Docker (si configuré)
cd ../
docker-compose up -d backend
```

### 3.2 Mode interactif (recommandé pour debug)

```bash
# Ouvrir Cypress en mode graphique
npm run test:e2e:open

# Dans l'interface Cypress :
# 1. Cliquer sur "E2E Testing"
# 2. Choisir "Chrome" comme navigateur
# 3. Cliquer sur "tarifsSync.cy.ts"
```

### 3.3 Mode headless (CI/CD)

```bash
# Lancer tous les tests E2E
npm run test:e2e

# Lancer uniquement les tests tarifs
npx cypress run --spec "cypress/e2e/tarifsSync.cy.ts"

# Avec video et screenshots
npx cypress run --spec "cypress/e2e/tarifsSync.cy.ts" --record --video
```

### 3.4 Mode Docker (si configuré)

```bash
# Tests E2E avec environment Docker complet
npm run test:e2e:docker
```

---

## 📊 Étape 4 : Résultats Attendus

### 4.1 Tests Unitaires Vitest - Succès

```bash
✓ Tests: 8 passed
✓ Duration: ~2-5 seconds

✓ PricingCalculator
  ✓ devrait afficher les tarifs initiaux
  ✓ devrait se mettre à jour après invalidation des tarifs
  ✓ devrait gérer les erreurs avec un bouton retry

✓ Packs
  ✓ devrait afficher les packs générés depuis les tarifs
  ✓ devrait se mettre à jour après invalidation des tarifs
  ✓ devrait afficher les packs par défaut en cas d'erreur

✓ Synchronisation entre composants
  ✓ les deux composants devraient se mettre à jour simultanément

✓ Performance et cache
  ✓ devrait partager le cache entre les composants
```

### 4.2 Coverage Attendue

```bash
File                           | % Stmts | % Branch | % Funcs | % Lines
-------------------------------|---------|----------|---------|--------
src/components/ui/Loader.tsx        | 95+   | 90+    | 100   | 95+
src/components/ui/ErrorMessage.tsx  | 95+   | 85+    | 100   | 95+
src/components/landing/PricingCalculator.tsx | 90+ | 80+ | 95+ | 90+
src/components/landing/Packs.tsx            | 90+ | 80+ | 95+ | 90+

Overall Coverage: 90%+
```

### 4.3 Tests E2E Cypress - Succès

```bash
✓ cypress/e2e/tarifsSync.cy.ts

✓ devrait synchroniser un changement de tarif entre admin et landing (15s)
✓ devrait gérer l'activation/désactivation d'un tarif (8s)
✓ devrait gérer les erreurs de façon gracieuse (5s)
✓ devrait maintenir la synchronisation lors de changements multiples (20s)
✓ devrait fonctionner avec React Query cache (10s)

5 passing (58s)
```

---

## 🚨 Étape 5 : Debug en Cas d'Échec

### 5.1 Tests Unitaires qui Échouent

#### Mock API ne fonctionne pas

```bash
# Vérifier les mocks
cat src/__tests__/tarifsInvalidation.test.tsx | grep -A 10 "vi.mock"

# Vérifier l'import de l'API
cat src/utils/api.ts | grep "fetchTarifs"
```

#### React Query ne s'initialise pas

```bash
# Vérifier la version de React Query
npm list @tanstack/react-query

# Logs de debug (ajouter dans le test)
console.log("QueryClient:", queryClient.getQueryCache().getAll());
```

#### Timeout des tests

```bash
# Augmenter le timeout dans vite.config.ts
# test: { testTimeout: 15000 }

# Relancer avec plus de temps
npx vitest run --testTimeout=15000
```

### 5.2 Tests E2E qui Échouent

#### Backend non démarré

```bash
# Vérifier que le backend répond
curl http://localhost:3001/api/tarifs

# Démarrer le backend si nécessaire
cd ../backend && npm run dev
```

#### Sélecteurs Cypress incorrects

```bash
# Vérifier les data-testid dans les composants
grep -r "data-testid" src/components/admin/
grep -r "data-testid" src/components/landing/

# Test avec des sélecteurs plus robustes
cy.contains("text-content").should("be.visible")
```

#### Configuration baseUrl incorrecte

```bash
# Vérifier cypress.config.cjs
cat cypress.config.cjs | grep baseUrl

# Tester manuellement l'URL
curl http://host.docker.internal:3000
```

### 5.3 Logs de Debug Utiles

```bash
# Mode verbose Vitest
npx vitest run --reporter=verbose

# Mode debug Cypress
npx cypress run --spec "cypress/e2e/tarifsSync.cy.ts" --headed --no-exit

# Logs réseau Cypress
# Dans le test, ajouter : cy.intercept("*").as("allCalls")
```

---

## ✅ Étape 6 : Checklist Validation QA

### 6.1 Tests Automatisés ✅

- [ ] **Tests unitaires Vitest passent** (8/8 tests)
- [ ] **Coverage > 90%** sur composants tarifs
- [ ] **Tests E2E Cypress passent** (5/5 tests)
- [ ] **Aucun warning/error** dans les logs

### 6.2 Tests Manuels - Landing Page ✅

- [ ] **PricingCalculator affiche les tarifs dynamiques**

  - Vérifier que les cartes de tarification se chargent
  - Les prix correspondent aux données admin
  - Les loading states fonctionnent

- [ ] **Packs affiche les offres dynamiques**

  - Les 3 packs sont générés depuis les tarifs
  - Fallback sur packs par défaut si erreur
  - Interface responsive mobile/desktop

- [ ] **Gestion d'erreurs**
  - Messages d'erreur s'affichent si API down
  - Boutons "Réessayer" fonctionnent
  - Fallbacks automatiques activés

### 6.3 Tests Manuels - Synchronisation Admin ✅

- [ ] **Modification d'un tarif en admin**

  - Aller sur `/admin/tarifs`
  - Modifier le prix d'un tarif
  - Sauvegarder
  - Aller sur `/` (landing)
  - Vérifier que le nouveau prix s'affiche

- [ ] **Activation/Désactivation**

  - Désactiver un tarif en admin
  - Vérifier qu'il disparaît de la landing
  - Réactiver et vérifier qu'il réapparaît

- [ ] **Changements multiples**
  - Modifier plusieurs tarifs rapidement
  - Vérifier que tous les changements sont reflétés

### 6.4 Tests Performance ✅

- [ ] **Temps de synchronisation < 2s**

  - Modifier en admin
  - Chronométrer jusqu'à l'affichage landing

- [ ] **Cache partagé fonctionne**

  - Un seul appel API pour PricingCalculator + Packs
  - Pas de duplication des requêtes

- [ ] **Invalidation précise**
  - Seule la clé `["tarifs", "public"]` est invalidée
  - Autres caches restent intacts

---

## 🎯 Étape 7 : Commandes Rapides (Copy-Paste)

### Tests Complets en Une Fois

```bash
#!/bin/bash
# Script de validation complète

echo "🧪 Lancement des tests tarifs dynamiques..."

cd frontend

echo "📋 1. Tests unitaires Vitest..."
npm run test:run -- src/__tests__/tarifsInvalidation.test.tsx

echo "📊 2. Coverage..."
npm run test:coverage -- src/__tests__/tarifsInvalidation.test.tsx

echo "🌐 3. Tests E2E Cypress..."
npx cypress run --spec "cypress/e2e/tarifsSync.cy.ts"

echo "✅ Tests terminés !"
```

### Reset/Nettoyage

```bash
# Reset des caches
rm -rf node_modules/.vite
rm -rf coverage
rm -rf cypress/videos cypress/screenshots

# Reinstall clean
npm ci
```

### Tests en Mode Watch (Développement)

```bash
# Terminal 1 : Tests unitaires en watch
npm run test -- --watch src/__tests__/tarifsInvalidation.test.tsx

# Terminal 2 : Cypress interactif
npm run test:e2e:open

# Terminal 3 : Backend dev
cd ../backend && npm run dev
```

---

## 🎉 Résumé des Validations

Une fois tous les tests passés, vous devriez avoir :

✅ **8 tests unitaires** validant l'invalidation de cache  
✅ **5 tests E2E** validant la synchro admin → landing  
✅ **Coverage > 90%** sur les composants tarifs  
✅ **Synchronisation < 2s** en conditions réelles  
✅ **Fallbacks automatiques** en cas d'erreur  
✅ **UX optimisée** avec loading states

🎯 **L'intégration des tarifs dynamiques est 100% fonctionnelle et prête pour la production !**

---

## 📞 Support

En cas de problème :

1. **Vérifiez les logs** avec les commandes debug ci-dessus
2. **Relancez** avec `npm ci` puis les tests
3. **Validez l'environnement** (backend démarré, fixtures présentes)
4. **Testez manuellement** la synchronisation admin → landing

**Les tarifs dynamiques transforment instantanément vos modifications admin en expérience utilisateur optimisée ! 🚀**
