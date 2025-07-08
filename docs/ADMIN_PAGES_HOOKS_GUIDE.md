# Guide d'utilisation des hooks React Query pour les pages admin

## Vue d'ensemble

Ce guide documente l'implémentation des hooks React Query pour la gestion des pages statiques dans l'espace admin de Staka-livres.

## Architecture

### Backend

- **Routes** : `/admin/pages` (CRUD complet)
- **Contrôleur** : `adminPageController.ts`
- **Service** : `pageService.ts` (Prisma)
- **Validation** : Zod schemas
- **Sécurité** : JWT + rôle ADMIN requis

### Frontend

- **Hooks** : `useAdminPages.ts` (React Query v5)
- **API** : `adminAPI.ts` (méthodes pages)
- **Composant** : `AdminPages.tsx` (interface utilisateur)

## Hooks disponibles

### 1. useAdminPages - Liste des pages

```typescript
const {
  data: pages,
  isLoading,
  error,
  refetch,
} = useAdminPages({
  search: "recherche",
  statut: StatutPage.PUBLIEE,
  page: 1,
  limit: 10,
});
```

**Paramètres :**

- `search` : Recherche dans titre/slug
- `statut` : Filtre par statut (PUBLIEE, BROUILLON, ARCHIVEE)
- `page` : Numéro de page (pagination)
- `limit` : Nombre d'éléments par page

**Retour :**

- `data` : Tableau des pages
- `isLoading` : État de chargement
- `error` : Erreur éventuelle
- `refetch` : Fonction de rechargement

### 2. useCreatePage - Création de page

```typescript
const createPageMutation = useCreatePage();

createPageMutation.mutate(
  {
    titre: "Ma page",
    slug: "ma-page",
    contenu: "<p>Contenu HTML</p>",
    description: "Description SEO",
    statut: StatutPage.BROUILLON,
  },
  {
    onSuccess: () => {
      // Page créée avec succès
    },
    onError: (error) => {
      // Gestion erreur
    },
  }
);
```

**Fonctionnalités :**

- ✅ Optimistic update (mise à jour immédiate de l'UI)
- ✅ Invalidation automatique du cache
- ✅ Gestion des erreurs avec toasts
- ✅ Toast de succès automatique

### 3. useUpdatePage - Modification de page

```typescript
const updatePageMutation = useUpdatePage();

updatePageMutation.mutate({
  id: "page-id",
  pageData: {
    titre: "Nouveau titre",
    contenu: "Nouveau contenu",
  },
});
```

**Fonctionnalités :**

- ✅ Mise à jour optimiste du cache
- ✅ Invalidation des listes et détails
- ✅ Gestion des erreurs

### 4. useDeletePage - Suppression de page

```typescript
const deletePageMutation = useDeletePage();

deletePageMutation.mutate("page-id", {
  onSuccess: () => {
    // Page supprimée
  },
});
```

**Fonctionnalités :**

- ✅ Suppression optimiste de l'UI
- ✅ Nettoyage du cache
- ✅ Toast de confirmation

### 5. useTogglePageStatus - Publication/Dépublication

```typescript
const toggleStatusMutation = useTogglePageStatus();

toggleStatusMutation.toggleStatus(page);
```

**Fonctionnalités :**

- ✅ Bascule automatique PUBLIEE ↔ BROUILLON
- ✅ Mise à jour optimiste
- ✅ Toast contextuel (publiée/dépubliée)

### 6. usePageStats - Statistiques

```typescript
const stats = usePageStats(pages);

// stats = {
//   total: 10,
//   publiees: 5,
//   brouillons: 3,
//   archivees: 2
// }
```

## Exemple d'intégration complète

```typescript
import React, { useState } from "react";
import {
  useAdminPages,
  useCreatePage,
  useUpdatePage,
  useDeletePage,
  useTogglePageStatus,
  usePageStats,
} from "../../hooks/useAdminPages";

const AdminPages: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<StatutPage | "tous">("tous");

  // Hooks React Query
  const {
    data: pages = [],
    isLoading,
    error,
    refetch,
  } = useAdminPages({
    search: search || undefined,
    statut: statut !== "tous" ? statut : undefined,
  });

  const createPageMutation = useCreatePage();
  const updatePageMutation = useUpdatePage();
  const deletePageMutation = useDeletePage();
  const toggleStatusMutation = useTogglePageStatus();

  // Statistiques calculées
  const stats = usePageStats(pages);

  // Actions
  const handleCreate = (pageData) => {
    createPageMutation.mutate(pageData);
  };

  const handleUpdate = (id, pageData) => {
    updatePageMutation.mutate({ id, pageData });
  };

  const handleDelete = (id) => {
    deletePageMutation.mutate(id);
  };

  const handleToggleStatus = (page) => {
    toggleStatusMutation.toggleStatus(page);
  };

  return <div>{/* Interface utilisateur */}</div>;
};
```

## Gestion du cache

### Clés de cache

```typescript
export const pageKeys = {
  all: ["pages"] as const,
  lists: () => [...pageKeys.all, "list"] as const,
  list: (params) => [...pageKeys.lists(), params] as const,
  details: () => [...pageKeys.all, "detail"] as const,
  detail: (id) => [...pageKeys.details(), id] as const,
};
```

### Invalidation automatique

- **Création** : Invalide toutes les listes
- **Modification** : Invalide listes + détail spécifique
- **Suppression** : Invalide listes + supprime détail
- **Publication** : Invalide listes + détail

### Mise à jour optimiste

- Les mutations mettent à jour le cache immédiatement
- En cas d'erreur, le cache est restauré automatiquement
- L'UI reste réactive pendant les opérations

## Gestion des erreurs

### Toasts automatiques

- ✅ Succès : "Page créée/modifiée/supprimée avec succès"
- ❌ Erreur : Message d'erreur spécifique
- 🔄 Publication : "Page publiée/dépubliée"

### Callbacks personnalisés

```typescript
createPageMutation.mutate(pageData, {
  onSuccess: (newPage) => {
    // Action personnalisée
  },
  onError: (error) => {
    // Gestion erreur personnalisée
  },
});
```

## Configuration React Query

```typescript
// main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});
```

### Paramètres spécifiques aux pages

- **useAdminPages** : `staleTime: 2min`, `gcTime: 10min`
- **useAdminPage** : `staleTime: 5min`, `gcTime: 15min`

## Tests

### Tests unitaires

```typescript
// __tests__/useAdminPages.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useAdminPages } from "../useAdminPages";

test("useAdminPages charge les pages", async () => {
  const { result } = renderHook(() => useAdminPages());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.data).toBeDefined();
});
```

### Tests d'intégration

```typescript
// tests/integration/adminPages.test.ts
test("CRUD complet des pages", async () => {
  // Test création
  // Test modification
  // Test suppression
  // Test publication
});
```

## Bonnes pratiques

### 1. Gestion des états de loading

```typescript
const isLoading =
  createPageMutation.isPending ||
  updatePageMutation.isPending ||
  deletePageMutation.isPending;
```

### 2. Validation des données

```typescript
const handleSave = () => {
  if (!editingPage.titre || !editingPage.slug) {
    showToast("error", "Champs requis manquants");
    return;
  }
  // Mutation...
};
```

### 3. Optimistic updates

- Toujours mettre à jour le cache localement
- Gérer les erreurs avec rollback automatique
- Maintenir la cohérence des données

### 4. Gestion des erreurs réseau

- Retry automatique configuré
- Messages d'erreur utilisateur-friendly
- Fallback en cas d'échec

## Évolutions futures

### Fonctionnalités prévues

- [ ] Pagination avancée (infinite scroll)
- [ ] Recherche en temps réel
- [ ] Filtres multiples
- [ ] Tri personnalisable
- [ ] Export des pages
- [ ] Historique des modifications

### Optimisations

- [ ] Cache persistant (localStorage)
- [ ] Synchronisation offline
- [ ] Prefetching intelligent
- [ ] Compression des données

## Support

Pour toute question ou problème :

1. Consulter les logs backend (`docker-compose logs backend`)
2. Vérifier les erreurs console frontend
3. Tester les routes API directement
4. Consulter la documentation Prisma
