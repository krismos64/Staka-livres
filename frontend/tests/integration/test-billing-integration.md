# Test d'Intégration - Système de Facturation avec React Query

## 🎯 Objectif

Valider l'intégration complète entre :

- **Backend** : API `/invoices` + génération PDF + webhook Stripe
- **Frontend** : React Query + téléchargement PDF + UX optimisée

## 🚀 Étapes de Test

### 1. Préparation de l'environnement

```bash
# Vérifier que tous les conteneurs sont actifs
docker ps | grep staka

# Résultat attendu :
# staka_frontend    Up 2 hours    0.0.0.0:3000->3000/tcp
# staka_backend     Up 35 minutes 0.0.0.0:3001->3001/tcp
# staka_db          Up 2 hours    0.0.0.0:3306->3306/tcp
```

### 2. Test API Backend (sans authentification)

```bash
# Test endpoint de santé
curl http://localhost:3001/health

# Test endpoints factures (attendu : 401 Unauthorized)
curl http://localhost:3001/invoices
curl http://localhost:3001/invoices/123
curl http://localhost:3001/invoices/123/download
```

### 3. Test Frontend de base

```bash
# Accès page d'accueil
curl -s http://localhost:3000 | grep "Staka Éditions"

# Test en navigateur
open http://localhost:3000
```

**Vérifications manuelles :**

- ✅ Page d'accueil se charge
- ✅ Navigation vers `/billing` fonctionne
- ✅ Console DevTools sans erreurs critiques

### 4. Test Intégration React Query

**Aller sur http://localhost:3000/billing**

#### 4.1 Test sans authentification

**Résultat attendu :**

- ✅ Spinner de chargement s'affiche
- ✅ Erreur 401/403 capturée par React Query
- ✅ Toast d'erreur affiché : "Token invalide" ou "Impossible de charger"
- ✅ État vide ou redirection vers login

#### 4.2 Test avec token JWT valide

```bash
# Générer un token de test (backend doit être configuré)
# Option 1 : Login via l'interface
# Option 2 : Token de développement

# Injecter dans localStorage via console navigateur :
localStorage.setItem('auth_token', 'YOUR_JWT_TOKEN_HERE');
```

**Puis recharger `/billing` :**

**Résultat attendu :**

- ✅ `useInvoices()` déclenché automatiquement
- ✅ Appel GET `/invoices?page=1&limit=20`
- ✅ Loading state → `isLoading = true`
- ✅ Données reçues → `data.invoices[]`
- ✅ Transformation `mapInvoiceApiToInvoice()`
- ✅ Séparation pending/paid
- ✅ Affichage `CurrentInvoiceCard` + `InvoiceHistoryCard`

### 5. Test Fonctionnalités Factures

#### 5.1 Test affichage des factures

**Vérifications :**

- ✅ Factures pending dans "Facture en cours"
- ✅ Factures paid dans "Historique"
- ✅ Montants formatés correctement
- ✅ Dates en français
- ✅ Statuts cohérents

#### 5.2 Test détails d'une facture

**Actions :**

1. Cliquer sur "Détails" d'une facture
2. Observer le réseau dans DevTools

**Résultat attendu :**

- ✅ `useInvoice(id)` déclenché
- ✅ Appel GET `/invoices/:id`
- ✅ Modal affichée avec données détaillées

#### 5.3 Test téléchargement PDF

**Actions :**

1. Cliquer sur "Télécharger PDF"
2. Observer réseau + téléchargements

**Résultat attendu :**

- ✅ Toast "Préparation de votre facture PDF"
- ✅ Appel GET `/invoices/:id/download`
- ✅ Response content-type: application/pdf
- ✅ Blob créé et téléchargement déclenché
- ✅ Fichier `facture-[id].pdf` téléchargé
- ✅ Toast "Votre facture PDF a été téléchargée"

### 6. Test React Query Cache

#### 6.1 Test cache et performance

**Actions :**

1. Charger `/billing` (premier appel API)
2. Naviguer vers une autre page
3. Revenir sur `/billing` immédiatement

**Résultat attendu :**

- ✅ Premier chargement : `isLoading = true`
- ✅ Retour immédiat : données du cache affichées instantanément
- ✅ `isFetching = true` en arrière-plan si stale
- ✅ Mise à jour silencieuse si nouvelles données

#### 6.2 Test pagination

**Actions :**

1. Cliquer "Charger plus de factures" (si disponible)

**Résultat attendu :**

- ✅ `isFetching = true` (pas `isLoading`)
- ✅ Appel GET `/invoices?page=2&limit=20`
- ✅ `keepPreviousData = true` → anciennes factures restent affichées
- ✅ Nouvelles factures ajoutées à la liste

### 7. Test Gestion d'Erreurs

#### 7.1 Test erreur réseau

**Actions :**

1. Couper la connexion réseau
2. Recharger `/billing`

**Résultat attendu :**

- ✅ React Query retry automatique (2 fois)
- ✅ Toast d'erreur affiché après échec
- ✅ État d'erreur géré gracieusement

#### 7.2 Test token expiré

**Actions :**

1. Utiliser un token JWT expiré
2. Essayer de télécharger une facture

**Résultat attendu :**

- ✅ Erreur 401 capturée
- ✅ Toast "Token invalide" ou équivalent
- ✅ Pas de crash de l'application

### 8. Test Performance et UX

#### 8.1 Test temps de chargement

**Mesures attendues :**

- ✅ Premier chargement < 2s
- ✅ Navigation cache < 100ms
- ✅ Téléchargement PDF < 5s

#### 8.2 Test responsive design

**Vérifications :**

- ✅ Mobile (320px) : layout adapté
- ✅ Tablet (768px) : grille ajustée
- ✅ Desktop (1024px+) : vue complète

### 9. Test DevTools React Query

#### 9.1 Installation DevTools (optionnel)

```bash
# Si pas encore installé
docker exec -it staka_frontend npm install react-query/devtools-dev
```

**Configuration dans App.tsx :**

```typescript
import { ReactQueryDevtools } from "react-query/devtools";

function App() {
  return (
    <>
      <YourAppComponents />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

#### 9.2 Inspection du cache

**Actions :**

1. Ouvrir les DevTools React Query
2. Observer les queries

**Vérifications :**

- ✅ Query `["invoices", 1, 20]` visible
- ✅ Status : success/loading/error
- ✅ Cache times configurés correctement
- ✅ Manual refetch fonctionne

## ✅ Checklist de Validation

### Backend API

- [ ] Endpoints `/invoices` fonctionnels
- [ ] Authentification JWT requise
- [ ] Téléchargement PDF stream
- [ ] Gestion d'erreurs appropriée

### Frontend React Query

- [ ] Configuration `QueryClient` correcte
- [ ] Hooks `useInvoices` et `useInvoice` fonctionnels
- [ ] Cache et invalidation opérationnels
- [ ] États loading/error gérés

### Intégration End-to-End

- [ ] Chargement automatique des factures
- [ ] Téléchargement PDF fonctionnel
- [ ] Gestion d'erreurs robuste
- [ ] Performance acceptable

### UX et Accessibilité

- [ ] Toasts informatifs
- [ ] Spinners pendant chargement
- [ ] États vides gérés
- [ ] Navigation clavier possible

## 🐛 Problèmes Fréquents

### "Cannot read property 'invoices'"

**Cause :** Type `InvoicesResponse` incorrect
**Solution :** Vérifier l'interface dans `api.ts`

### "Query not enabled"

**Cause :** Condition `enabled: !!id` non respectée
**Solution :** Vérifier que `selectedInvoiceId` n'est pas null

### "403 Forbidden"

**Cause :** Token JWT expiré ou invalide
**Solution :** Renouveler le token ou tester avec un token valide

### PDF ne se télécharge pas

**Cause :** Backend non configuré ou erreur S3
**Solution :** Vérifier logs backend et configuration AWS

## 🎉 Succès Attendu

Si tous les tests passent, tu auras :

✅ **Système de facturation complet** avec React Query
✅ **Performance optimisée** avec cache intelligent
✅ **UX fluide** avec gestion d'états robuste
✅ **Téléchargement PDF** sécurisé et fonctionnel
✅ **Gestion d'erreurs** gracieuse
✅ **Code maintenable** avec hooks réutilisables

**🚀 Ready for Production !**
