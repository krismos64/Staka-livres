# 🧾 Système de Facturation et de Factures - Guide Complet

## 📋 **Vue d'ensemble**

Ce document est le guide de référence complet pour le système de facturation de Staka Livres. Il couvre l'architecture backend, l'intégration frontend pour les clients et l'espace d'administration.

---

## 🏛️ **Partie 1 : Architecture Backend**

Le système de facturation automatique génère, stocke et envoie des factures PDF lors des paiements Stripe réussis.

### **Architecture Globale**

```
Webhook Stripe → Mise à jour Commande → Génération PDF → Upload S3 → Envoi Email
```

### **Modèle de Données Prisma (`Invoice`)**

```prisma
model Invoice {
  id         String        @id @default(uuid())
  commandeId String
  number     String        @unique @db.VarChar(50)
  amount     Int
  taxAmount  Int           @default(0)
  pdfUrl     String        @db.VarChar(500)
  status     InvoiceStatus @default(GENERATED)
  issuedAt   DateTime?
  dueAt      DateTime?
  paidAt     DateTime?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  commande   Commande      @relation(fields: [commandeId], references: [id], onDelete: Cascade)
  // ...
}

enum InvoiceStatus {
  GENERATED, SENT, PAID, OVERDUE, CANCELLED
}
```

### **Processus de Facturation Automatique**

1.  **Déclenchement** : via le webhook `checkout.session.completed`.
2.  **Génération PDF** : Le `InvoiceService` crée un PDF avec un numéro unique (`FACT-YYYY-XXXXXX`).
3.  **Upload S3** : Le PDF est stocké sur un bucket S3 sécurisé.
4.  **Enregistrement DB** : Une nouvelle entrée `Invoice` est créée dans la base de données.
5.  **Notification Client** : Un email avec la facture est envoyé via `MailerService`.

### **API Endpoints**

Le backend expose des endpoints REST sécurisés par JWT pour les clients et les administrateurs.

---

## 🖥️ **Partie 2 : Espace Client (`BillingPage`)**

La page de facturation client est construite avec React, TypeScript et `@tanstack/react-query` pour une expérience utilisateur réactive et performante.

### **Structure des Composants**

- `BillingPage.tsx`: Orchestre la page.
- `CurrentInvoiceCard.tsx`: Affiche la facture à payer.
- `InvoiceHistoryCard.tsx`: Liste l'historique.
- `PaymentMethodsCard.tsx`: Gère les moyens de paiement.
- `...` et d'autres composants de support.

### **Hooks React Query (`useInvoices.ts`)**

Le hook `useInvoices` gère la récupération des données de factures pour le client.

```typescript
// frontend/src/hooks/useInvoices.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchInvoice,
  fetchInvoices,
  InvoiceAPI,
  InvoicesResponse,
} from "../utils/api";

// Récupère la liste paginée des factures
export function useInvoices(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["invoices", page, limit],
    queryFn: () => fetchInvoices(page, limit),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Récupère les détails d'une facture
export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: () => fetchInvoice(id),
    enabled: !!id,
  });
}

// Invalide le cache après une action (ex: paiement)
export function useInvalidateInvoices() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };
}
```

### **Intégration**

La `BillingPage` utilise ces hooks pour afficher les données, gérer les états de chargement, les erreurs et fournir des fonctionnalités comme le téléchargement de PDF.

---

## 👨‍💻 **Partie 3 : Espace Administration (`AdminFactures`)**

L'interface d'administration des factures utilise un ensemble de hooks dédiés pour le CRUD complet et la gestion des statistiques.

### **Hooks React Query (`useAdminFactures.ts`)**

Ce fichier centralise toute la logique de récupération et de mutation des données de factures pour l'admin.

```typescript
// frontend/src/hooks/useAdminFactures.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "../utils/adminAPI";

// Interface pour les paramètres de recherche
export interface AdminFacturesParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

// Récupère la liste des factures pour l'admin
export function useAdminFactures(params: AdminFacturesParams) {
  return useQuery({
    queryKey: ["admin-factures", params],
    queryFn: () =>
      adminAPI.getFactures(
        params.page,
        params.limit,
        params.status,
        params.search
      ),
    keepPreviousData: true,
  });
}

// Récupère les statistiques
export function useFactureStats() {
  return useQuery({
    queryKey: ["admin-facture-stats"],
    queryFn: () => adminAPI.getFactureStats(),
    staleTime: 5 * 60 * 1000,
  });
}

// Mutation pour supprimer une facture
export function useDeleteFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminAPI.deleteFacture(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-factures"] });
      queryClient.invalidateQueries({ queryKey: ["admin-facture-stats"] });
    },
  });
}

// Mutation pour envoyer un rappel de paiement
export function useSendReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminAPI.sendFactureReminder(id),
    onSuccess: () => {
      // Optionnel: afficher un toast de succès
    },
  });
}

// Autres hooks (get by id, update, download...)
// ...
```

### **Exemple d'Implémentation dans une page Admin**

```tsx
function AdminFacturesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminFactures({ page, limit: 10 });
  const deleteMutation = useDeleteFacture();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>{/* Affichage des factures et des actions (supprimer, etc.) */}</div>
  );
}
```

## ✅ **Conclusion**

Ce système de facturation est une feature robuste et complète. Cette documentation centralisée assure que toutes les parties prenantes (développeurs backend et frontend) aient une source de vérité unique, à jour et facile à maintenir.
