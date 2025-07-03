# Hook useAdminFactures

Hook React Query v3 pour la gestion des factures dans l'espace admin de Staka Livres.

## Installation et Prérequis

✅ **React Query v3.39.3** - Déjà installé  
✅ **QueryClientProvider** - Déjà configuré dans `main.tsx`  
✅ **Types TypeScript** - `Invoice` et `InvoiceStats` ajoutés  
✅ **API Functions** - `adminAPI.getFactures()`, `getFactureStats()`, etc.

## Hooks Disponibles

### 📋 `useAdminFactures(params)`

Récupère la liste paginée des factures avec filtres.

```tsx
const { data, isLoading, error } = useAdminFactures({
  page: 1,
  limit: 10,
  search: "INV-2025",
  status: "PAID",
});
```

### 📊 `useFactureStats()`

Récupère les statistiques globales des factures.

```tsx
const { data: stats, isLoading } = useFactureStats();
// stats: { total, payees, enAttente, montantTotal, etc. }
```

### 📄 `useDownloadFacture()`

Télécharge le PDF d'une facture (téléchargement automatique).

```tsx
const downloadMutation = useDownloadFacture();

const handleDownload = (id: string) => {
  downloadMutation.mutate(id);
};
```

### 📨 `useSendReminder()`

Envoie un rappel de paiement pour une facture.

```tsx
const reminderMutation = useSendReminder();

const handleReminder = (id: string) => {
  reminderMutation.mutate(id);
};
```

### 🗑️ `useDeleteFacture()`

Supprime définitivement une facture.

```tsx
const deleteMutation = useDeleteFacture();

const handleDelete = (id: string) => {
  if (confirm("Supprimer cette facture ?")) {
    deleteMutation.mutate(id);
  }
};
```

### ⚙️ Hooks Utilitaires

#### `useFactureDetails(id)`

Récupère les détails d'une facture spécifique.

#### `useUpdateFactureStatus()`

Met à jour le statut d'une facture.

#### `useInvalidateFactures()`

Invalide manuellement le cache React Query.

#### `usePrefetchFacture()`

Précharge une facture pour l'optimisation UX.

## Exemple d'Utilisation Complète

```tsx
import React, { useState } from "react";
import {
  useAdminFactures,
  useFactureStats,
  useDownloadFacture,
  useSendReminder,
  useDeleteFacture,
} from "../hooks/useAdminFactures";

function AdminFactures() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // 📋 Données
  const {
    data: facturesData,
    isLoading,
    error,
  } = useAdminFactures({
    page,
    limit: 10,
    search,
    status: "PAID",
  });

  const { data: stats } = useFactureStats();

  // 🔧 Mutations
  const downloadMutation = useDownloadFacture();
  const reminderMutation = useSendReminder();
  const deleteMutation = useDeleteFacture();

  // 📝 Handlers
  const handleDownload = (id: string) => {
    downloadMutation.mutate(id, {
      onSuccess: () => console.log("✅ PDF téléchargé"),
      onError: (error) => console.error("❌ Erreur:", error),
    });
  };

  const handleSendReminder = (id: string) => {
    reminderMutation.mutate(id, {
      onSuccess: () => console.log("✅ Rappel envoyé"),
      onError: (error) => console.error("❌ Erreur:", error),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr ?")) {
      deleteMutation.mutate(id, {
        onSuccess: () => console.log("✅ Facture supprimée"),
        onError: (error) => console.error("❌ Erreur:", error),
      });
    }
  };

  return (
    <div>
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div>Total: {stats.total}</div>
          <div>Payées: {stats.payees}</div>
          <div>En attente: {stats.enAttente}</div>
          <div>Montant: {stats.montantTotalFormate}</div>
        </div>
      )}

      {/* Filtres */}
      <input
        type="text"
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Liste */}
      {isLoading && <div>Chargement...</div>}
      {error && <div>Erreur: {error.message}</div>}

      {facturesData?.data?.map((facture) => (
        <div key={facture.id} className="border p-4 mb-2">
          <h3>{facture.numero}</h3>
          <p>Montant: {facture.montantFormate}</p>
          <p>Statut: {facture.statut}</p>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleDownload(facture.id)}
              disabled={downloadMutation.isLoading}
            >
              📄 PDF
            </button>

            <button
              onClick={() => handleSendReminder(facture.id)}
              disabled={reminderMutation.isLoading}
            >
              📨 Rappel
            </button>

            <button
              onClick={() => handleDelete(facture.id)}
              disabled={deleteMutation.isLoading}
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {facturesData?.pagination && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1}>
            Précédent
          </button>
          <span>
            Page {page} sur {facturesData.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= facturesData.pagination.totalPages}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
```

## Configuration React Query

Le hook utilise les configurations suivantes :

```tsx
// Configuration automatique dans les hooks
{
  keepPreviousData: true,     // Garde les données pendant pagination
  staleTime: 2 * 60 * 1000,   // 2 minutes de fraîcheur
  cacheTime: 5 * 60 * 1000,   // 5 minutes en cache
  retry: 2,                   // 2 tentatives en cas d'erreur
  refetchOnWindowFocus: false // Pas de rechargement au focus
}
```

## Gestion d'Erreurs

Toutes les mutations incluent une gestion d'erreur automatique avec des logs console.

## Cache et Invalidation

- ✅ **Invalidation automatique** : Les mutations invalident automatiquement le cache
- ✅ **Cache optimisé** : `keepPreviousData` pour une UX fluide
- ✅ **Clés de cache organisées** :
  - `['admin-factures', params]` - Liste paginée
  - `'admin-facture-stats'` - Statistiques globales
  - `['admin-facture', id]` - Détails d'une facture

## Types TypeScript

```tsx
interface AdminFacturesParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

type Invoice = Facture; // Alias pour compatibilité
type InvoiceStats = FactureStats;
```

## API Backend Utilisée

Le hook utilise les fonctions suivantes d'`adminAPI.ts` :

- `getFactures(page, limit, status, search)` - Liste paginée
- `getFactureStats()` - Statistiques globales
- `getFactureById(id)` - Détails d'une facture
- `getFacturePdf(id)` - Téléchargement PDF ⚡ **NOUVEAU**
- `sendFactureReminder(id)` - Envoi de rappel
- `deleteFacture(id)` - Suppression
- `updateFacture(id, data)` - Mise à jour

---

**🎯 Hook prêt à l'emploi ! React Query v3 + API réelle + TypeScript + Gestion d'erreurs**
