# Page de Facturation - Staka Éditions

## Architecture de la page de facturation

La page de facturation a été modernisée selon une architecture modulaire avec composants réutilisables, fidèle à la maquette HTML originale.

## Structure des composants

### 📁 src/pages/BillingPage.tsx

**Composant principal** qui orchestre toute la logique de facturation :

- **Gestion d'état centralisée** : factures, moyens de paiement, modales
- **Handlers uniformisés** : paiement, téléchargement, gestion des cartes
- **Types TypeScript stricts** : Interface clara pour factures, cartes, stats
- **Empty state intelligent** : affichage conditionnel si pas de données
- **Mock data prête pour API** : structure compatible backend

### 🏗️ Composants modulaires

#### `CurrentInvoiceCard`

- Affiche la facture en cours avec détails complets
- Actions principales : Payer, Télécharger, Voir détails
- Gestion des statuts avec badges colorés
- États de loading pour paiement en cours
- **Accessibilité** : ARIA labels, navigation clavier

#### `InvoiceHistoryCard`

- Liste l'historique avec interactions hover
- Actions rapides au survol (télécharger, détails)
- Tri et filtrage prêts pour extension
- **Performance** : virtualisation possible pour gros volumes

#### `PaymentMethodsCard`

- Gestion complète des moyens de paiement
- Ajout/suppression de cartes avec confirmations
- Icônes dynamiques selon type de carte (Visa, Mastercard, Amex)
- **Sécurité** : indicateurs de chiffrement SSL

#### `AnnualSummaryCard`

- Statistiques annuelles avec progression VIP
- Animations pour les métriques importantes
- Barre de progression vers le statut VIP
- **Gamification** : encouragement à utiliser plus de services

#### `SupportCard`

- Options de contact multiples (chat, FAQ, téléphone)
- Informations de disponibilité
- Badge de satisfaction client
- **UX** : accès rapide au support depuis facturation

### 🎭 Modales interactives

#### `InvoiceDetailsModal`

- Détails complets d'une facture avec tableau itemisé
- Gestion de l'échappement clavier (Esc)
- Actions contextuelles selon statut
- **Responsive** : s'adapte mobile/tablette

#### `PaymentModal`

- Simulation complète de l'intégration Stripe
- Formulaire de nouvelle carte avec validation temps réel
- Sélection entre cartes existantes
- **Sécurité simulée** : formatage automatique, validation CVV
- Conditions générales intégrées

## 🎨 Design System

### Animations et transitions

- `animate-fade-in` : apparition fluide des éléments
- `animate-slide-in` : entrée des modales
- Hover effects : lift sur les cartes, changements de couleur
- Loading states : spinners et barres de progression

### Couleurs sémantiques

- **Vert** : statuts payés, succès, économies
- **Orange** : en attente de paiement
- **Rouge** : erreurs, rejets, suppressions
- **Bleu** : actions principales, liens, traitements

### Responsive

- **Desktop** : layout 3 colonnes (factures + sidebar)
- **Tablette** : layout 2 colonnes adaptées
- **Mobile** : stack vertical avec priorité contenu

## 🔧 Intégrations

### TypeScript

- **Types exportés** : réutilisables dans d'autres pages
- **Interfaces strictes** : validation à la compilation
- **Props typées** : autocomplétion et erreurs préventives

### Toast System

- Hook `useToasts()` pour notifications uniformes
- Types prédéfinis : success, error, warning, info
- Auto-dismiss configurable
- **Queue management** : gestion des notifications multiples

### Données mock

- **Structure API-ready** : facile à connecter au backend
- **IDs cohérents** : pour les relations entre entités
- **Dates formatées** : standards français
- **Montants** : avec symbole € et formatage

## 🚀 Fonctionnalités implémentées

### ✅ Core Features

- [x] Affichage facture en cours avec actions
- [x] Historique des factures interactif
- [x] Gestion des moyens de paiement
- [x] Statistiques annuelles avec progression VIP
- [x] Support intégré avec informations de contact

### ✅ UX/UI Advanced

- [x] Empty state élégant si pas de factures
- [x] Modales détails avec navigation clavier
- [x] Processus de paiement simulé (Stripe-like)
- [x] Animations fluides et microinteractions
- [x] Responsive complet desktop/tablet/mobile

### ✅ Developer Experience

- [x] Architecture modulaire et réutilisable
- [x] Types TypeScript exhaustifs
- [x] Gestion d'état centralisée
- [x] Handlers prêts pour intégration API
- [x] Code documenté et commenté

## 🔄 Prochaines étapes

### Intégrations backend

1. **API Stripe** : remplacer les simulations par vraies intégrations
2. **Endpoints factures** : récupération, création, mise à jour
3. **Gestion paiements** : webhooks Stripe, confirmations 3D Secure
4. **Notifications** : emails de confirmation, rappels d'échéance

### Fonctionnalités avancées

1. **Filtres et tri** : par date, montant, projet, statut
2. **Export PDF** : génération côté serveur des factures
3. **Récurrence** : abonnements et paiements automatiques
4. **Multi-devises** : support international

### Performance

1. **Virtualisation** : pour l'historique de nombreuses factures
2. **Mise en cache** : optimisation des requêtes répétées
3. **Lazy loading** : chargement progressif des composants

## 📝 Notes techniques

- **Stripe Elements** : intégration recommandée pour production
- **Webhooks** : nécessaires pour synchroniser les statuts de paiement
- **PCI Compliance** : obligatoire pour traitement des cartes
- **RGPD** : attention aux données de paiement stockées

## 🎯 Philosophie de conception

Cette page de facturation suit les principes de **design progressif** :

1. **Fonctionnel d'abord** : toutes les actions essentielles disponibles
2. **Ensuite esthétique** : animations et polish qui enrichissent
3. **Accessible par défaut** : navigation clavier, ARIA, contrastes
4. **Mobile-friendly** : pensé responsive dès la conception

La structure modulaire permet une **évolution incrémentale** : chaque composant peut être amélioré indépendamment sans casser l'ensemble.

# Système de Facturation Frontend

Ce dossier contient tous les composants et la logique pour la gestion des factures côté client.

## 📋 Vue d'ensemble

Le système de facturation a été migré des mocks vers une intégration API complète avec le backend `/invoices`.

### Composants principaux

- **`BillingPage.tsx`** : Page principale orchestrant l'affichage des factures
- **`CurrentInvoiceCard.tsx`** : Affichage de la facture en cours (non payée)
- **`InvoiceHistoryCard.tsx`** : Historique des factures payées
- **`InvoiceDetailsModal.tsx`** : Modal de détails d'une facture
- **`AnnualSummaryCard.tsx`** : Résumé annuel des dépenses
- **`PaymentMethodsCard.tsx`** : Gestion des moyens de paiement
- **`PaymentModal.tsx`** : Modal de paiement Stripe
- **`SupportCard.tsx`** : Assistance et support client

## 🔌 Intégration API Factures (NOUVEAU)

### Endpoints utilisés

L'application utilise maintenant les vrais endpoints du backend :

```typescript
// Liste paginée des factures
GET /invoices?page=1&limit=10
Authorization: Bearer JWT_TOKEN

// Détails d'une facture
GET /invoices/:id
Authorization: Bearer JWT_TOKEN

// Téléchargement PDF sécurisé
GET /invoices/:id/download
Authorization: Bearer JWT_TOKEN
```

### Services API

Fichier `src/utils/api.ts` enrichi avec :

```typescript
// Types de données API
export interface InvoiceAPI {
  id: string;
  amount: number;
  amountFormatted: string;
  createdAt: string;
  pdfUrl: string;
  commande: {
    id: string;
    titre: string;
    statut: string;
    createdAt: string;
    description?: string;
  };
}

// Fonctions d'appel API
export async function fetchInvoices(
  page = 1,
  limit = 10
): Promise<InvoicesResponse>;
export async function fetchInvoice(id: string): Promise<InvoiceAPI>;
export async function downloadInvoice(id: string): Promise<Blob>;
```

### Hook React Query

Fichier `src/hooks/useInvoices.ts` (prêt pour intégration future) :

```typescript
// Hook pour la liste des factures avec cache
export function useInvoices(page = 1, limit = 10);

// Hook pour une facture spécifique
export function useInvoice(id: string);

// Hook pour invalider le cache (après paiement)
export function useInvalidateInvoices();

// Hook pour précharger une facture (optimisation UX)
export function usePrefetchInvoice();
```

## 🔄 Transformation des données

### Mapping API vers UI

La fonction `mapInvoiceApiToInvoice()` dans `BillingPage.tsx` transforme les données de l'API backend vers le format attendu par l'interface :

```typescript
// Données API → Données UI
InvoiceAPI {
  amount: 59900,                    // centimes
  amountFormatted: "599.00 €",     // formaté
  commande: { statut: "TERMINE" }  // backend
}
↓
Invoice {
  total: "599.00 €",               // formaté
  status: "paid",                   // UI
  items: [...],                     // restructuré
}
```

## 📥 Téléchargement de factures

### Implémentation

Le téléchargement de factures utilise l'API `/invoices/:id/download` avec :

1. **Authentification JWT** obligatoire
2. **Streaming Blob** pour gérer les gros fichiers
3. **Téléchargement automatique** via `URL.createObjectURL()`
4. **Gestion d'erreurs** avec toasts informatifs

```typescript
const handleDownloadInvoice = async (invoiceId: string) => {
  try {
    const blob = await downloadInvoice(invoiceId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facture-${invoiceId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showToast("error", "Erreur téléchargement", error.message);
  }
};
```

## 🎯 États de l'application

### Gestion du loading

- **Spinner** pendant le chargement des factures
- **Skeleton UI** pour les transitions fluides
- **Pagination** avec `keepPreviousData` (React Query)

### États vides

- **Aucune facture** : Affichage EmptyState avec CTA vers commandes
- **Erreur API** : Toast d'erreur avec message explicite
- **Connexion requise** : Redirection automatique vers login

## 🔧 Configuration Docker

### Développement

```bash
# Installer les dépendances
docker exec -it staka_frontend npm install

# Démarrer le serveur de dev avec hot reload
docker exec -it staka_frontend npm run dev

# Accès : http://localhost:3000/billing
```

### Variables d'environnement

Le frontend se connecte automatiquement au backend via :

```typescript
const API_BASE_URL = "http://localhost:3001";
```

## 🧪 Tests et validation

### Tests manuels

1. **Navigation** vers `/billing`
2. **Chargement** des factures depuis l'API
3. **Téléchargement** d'une facture PDF
4. **Pagination** si plus de 10 factures
5. **Gestion d'erreurs** (token expiré, réseau, etc.)

### Tests avec données

```bash
# Backend doit être lancé avec des factures en base
docker exec -it staka_backend npm run db:seed

# Puis tester l'interface
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3001/invoices"
```

## 🚀 Performance et UX

### Optimisations

- **Cache React Query** : 5 minutes de fraîcheur
- **Pagination** : Garde les données précédentes
- **Préchargement** : Hover sur facture = prefetch détails
- **Debounce** : Évite les appels API répétés

### Expérience utilisateur

- **Feedback immédiat** : Toasts pour toutes les actions
- **États de chargement** : Spinners et disabled states
- **Accessibilité** : ARIA labels et navigation clavier
- **Responsive** : Adapté mobile et desktop

## 🔮 Améliorations futures

### Fonctionnalités prévues

1. **React Query** complet (cache, mutations, synchronisation)
2. **Pagination infinie** pour l'historique
3. **Recherche et filtres** (date, montant, statut)
4. **Export batch** de plusieurs factures
5. **Notifications en temps réel** pour nouvelles factures

### Intégrations

1. **Socket.io** pour les mises à jour temps réel
2. **Service Worker** pour le cache offline
3. **Analytics** pour le suivi des téléchargements
4. **Impression** directe des factures

---

## 🐛 Dépannage

### Erreurs communes

**"Token invalide"** : Vérifier localStorage.auth_token
**"Facture non trouvée"** : Vérifier l'ID et la propriété
**"Erreur téléchargement"** : Vérifier la connexion réseau

### Debug

```javascript
// Dans la console du navigateur
localStorage.getItem("auth_token"); // Vérifier token
fetch("/api/invoices"); // Tester API directement
```

Cette intégration remplace complètement les mocks et offre une expérience de facturation robuste et sécurisée ! 🎉
