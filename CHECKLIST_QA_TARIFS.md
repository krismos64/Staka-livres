# ✅ Checklist QA - Tarifs Dynamiques

## 🚀 Tests Automatisés (5 min)

### Scripts Ready-to-Copy

```bash
# Dans le répertoire frontend/
cd frontend

# 1. Tests unitaires + coverage (2 min)
npm run test:run -- src/__tests__/tarifsInvalidation.test.tsx
npm run test:coverage -- src/__tests__/tarifsInvalidation.test.tsx

# 2. Tests E2E (3 min)
npx cypress run --spec "cypress/e2e/tarifsSync.cy.ts"

# OU script tout-en-un
./test-tarifs-dynamiques.sh
```

### Résultats Attendus ✅

- [ ] **8 tests unitaires** passent (PricingCalculator, Packs, synchronisation)
- [ ] **Coverage > 90%** sur composants ui/ et landing/
- [ ] **5 tests E2E** passent (sync admin→landing, erreurs, cache)
- [ ] **Durée totale < 60s** pour E2E

---

## 🔍 Tests Manuels Rapides (3 min)

### 1. Synchronisation Admin → Landing

```bash
# Terminal 1: Démarrer le backend
cd backend && npm run dev

# Terminal 2: Démarrer le frontend
cd frontend && npm run dev
```

**Étapes:**

- [ ] Aller sur `http://localhost:3000/admin/tarifs`
- [ ] Modifier le prix d'un tarif (ex: 2€ → 2.50€)
- [ ] Sauvegarder ✅
- [ ] Aller sur `http://localhost:3000/` (landing)
- [ ] **Vérifier:** le nouveau prix s'affiche (2.50€)
- [ ] **Timing:** synchronisation < 2 secondes

### 2. Gestion d'Erreurs

- [ ] Stopper le backend (`Ctrl+C`)
- [ ] Recharger la landing page
- [ ] **Vérifier:** messages d'erreur avec boutons "Réessayer"
- [ ] **Vérifier:** fallbacks automatiques (tarifs par défaut)
- [ ] Redémarrer backend + cliquer "Réessayer" → données se rechargent

### 3. Mobile/Responsive

- [ ] Ouvrir DevTools → mode mobile
- [ ] **Vérifier:** PricingCalculator responsive
- [ ] **Vérifier:** Packs responsive (3 colonnes → 1 colonne)
- [ ] **Vérifier:** Boutons et loaders s'affichent correctement

---

## 📱 Tests Cross-Browser (2 min)

### Desktop

- [ ] **Chrome** (principal) ✅
- [ ] **Firefox** (secondaire)
- [ ] **Safari** (si macOS)

### Mobile

- [ ] **iPhone Safari** (DevTools simulation)
- [ ] **Android Chrome** (DevTools simulation)

---

## ⚡ Performance & UX (2 min)

### Métriques à Valider

- [ ] **Temps de chargement initial** < 2s
- [ ] **Synchronisation admin→landing** < 2s
- [ ] **Pas de flash/scintillement** lors des mises à jour
- [ ] **Loading states fluides** (spinners, messages)
- [ ] **Transitions smooth** entre états

### DevTools Network

- [ ] Ouvrir DevTools → Network
- [ ] **Vérifier:** Un seul appel `/api/tarifs` par page
- [ ] **Vérifier:** Pas de doublons d'appels
- [ ] **Vérifier:** Cache React Query fonctionne

---

## 🔧 Debug Rapide si Échec

### Tests Unitaires Échouent

```bash
# Mode watch interactif
npm run test -- src/__tests__/tarifsInvalidation.test.tsx --watch

# Vérifier les mocks
grep -A 5 "vi.mock" src/__tests__/tarifsInvalidation.test.tsx
```

### Tests E2E Échouent

```bash
# Mode interactif avec browser visible
npm run test:e2e:open

# Vérifier backend actif
curl http://localhost:3001/api/tarifs
```

### Synchronisation Admin→Landing KO

1. **Vérifier:** Token admin valide (localStorage)
2. **Vérifier:** API admin accessible (`/api/admin/tarifs`)
3. **Vérifier:** `invalidateQueries(["tarifs","public"])` appelé
4. **DevTools:** Network → voir requête refetch après modification

---

## 🎯 Critères de Validation PASS/FAIL

### ✅ PASS (Prêt Production)

- Tests automatisés: 13/13 ✅
- Synchronisation < 2s ✅
- Gestion d'erreurs robuste ✅
- Responsive mobile ✅
- Performance optimale ✅

### ❌ FAIL (Besoin fix)

- Un test automatisé échoue
- Synchronisation > 5s ou inexistante
- Erreurs console/réseau
- UI cassée sur mobile
- Loading states manquants

---

## 📋 Rapport Final (Template)

```markdown
## QA Tarifs Dynamiques - [DATE]

### ✅ Tests Automatisés

- Tests unitaires: 8/8 ✅
- Coverage: 92% ✅
- Tests E2E: 5/5 ✅

### ✅ Tests Manuels

- Synchronisation admin→landing: ✅ (1.2s)
- Gestion d'erreurs: ✅
- Responsive: ✅
- Cross-browser: ✅ Chrome/Firefox

### ⚡ Performance

- Chargement initial: 1.8s ✅
- Sync admin→landing: 1.2s ✅
- Cache partagé: ✅

### 🎯 Verdict: PASS ✅

Tarifs dynamiques prêts pour production.
```

---

**🚀 Total temps validation: ~12 minutes**  
**🎯 Intégration des tarifs dynamiques 100% validée !**
