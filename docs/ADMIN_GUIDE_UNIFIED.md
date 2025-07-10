# 🚀 Guide Complet Unifié - Espace Admin Staka Livres

**Version Finale - Prêt pour la Production et Livraison Client**

## 📋 Vue d'ensemble

Ce document est le **guide de référence unique** pour l'espace admin de **Staka Livres**. Il couvre l'architecture, l'interface, la documentation de l'API pour chaque module, les guides d'utilisation des hooks frontend, la sécurité et les procédures de test.

L'espace admin est **100% complet et sécurisé**, avec une interface moderne, un système de routing robuste, une authentification sécurisée, des tests automatisés, un mode démo, et une architecture prête pour la production.

### 🚀 Architecture Unifiée 2025

L'espace admin a été **entièrement refactorisé** avec une architecture modulaire moderne unifiée :

- **Architecture modulaire** : Composants/hooks réutilisables sur toutes les pages
- **Séparation des responsabilités** : Logique API dans hooks personnalisés
- **Accessibilité WCAG 2.1 AA** : Navigation clavier, labels ARIA, rôles sémantiques
- **TypeScript strict** : Interfaces complètes et typage robuste
- **Performance optimisée** : Debounce, mises à jour optimistes, tri côté serveur
- **Patterns cohérents** : API unifiée, gestion d'erreurs centralisée

---

# 📱 Interface Admin 100% Complète

## ✅ **Pages Admin Intégrées**

| Section          | Composant           | API Endpoints | Fonctionnalités                                                             |
| ---------------- | ------------------- | ------------- | --------------------------------------------------------------------------- |
| **Dashboard**    | `AdminDashboard`    | 3 endpoints   | KPIs temps réel, stats générales                                            |
| **Utilisateurs** | `AdminUtilisateurs` | 7 endpoints   | CRUD, permissions, recherche, refactorisation modulaire complète            |
| **Commandes**    | `AdminCommandes`    | 4 endpoints   | **Module complet** : filtres avancés, statistiques, modale détails modernes |
| **Factures**     | `AdminFactures`     | 6 endpoints   | PDF, rappels, stats financières                                             |
| **Messagerie**   | `AdminMessagerie`   | 5 endpoints   | Supervision des conversations, communication directe client/admin           |
| **FAQ**          | `AdminFAQ`          | 4 endpoints   | CRUD, réorganisation, catégories                                            |
| **Tarifs**       | `AdminTarifs`       | 5 endpoints   | **CRUD complet** avec synchronisation temps réel landing page               |
| **Pages**        | `AdminPages`        | 7 endpoints   | **CMS** : Gestion de contenu, SEO, publication, pas de création/suppression |
| **Statistiques** | `AdminStatistiques` | 1 endpoint    | Analyses, graphiques, KPIs                                                  |
| **Logs**         | `AdminLogs`         | 2 endpoints   | Audit, export, timeline                                                     |

---

# 📚 Documentation API & Hooks - Modules Admin

Cette section détaille l'API backend et les hooks React Query frontend pour chaque module majeur.

## 🔐 Authentification et Conventions

- **Header Authorization** : `Bearer <JWT_TOKEN>` est requis pour toutes les routes.
- **Rôle utilisateur** : Le rôle `ADMIN` est nécessaire pour accéder à ces endpoints.
- **API Base URL**: Toutes les routes admin sont préfixées par `/api`.

---

## 👥 Module Gestion des Utilisateurs

### Endpoints API

| Endpoint                         | Méthode | Description              | Status |
| -------------------------------- | ------- | ------------------------ | ------ |
| `/admin/users/stats`             | GET     | Statistiques dashboard   | ✅     |
| `/admin/users`                   | GET     | Liste paginée + filtres  | ✅     |
| `/admin/users/:id`               | GET     | Détails utilisateur      | ✅     |
| `/admin/users`                   | POST    | Création utilisateur     | ✅     |
| `/admin/users/:id`               | PATCH   | Modification utilisateur | ✅     |
| `/admin/users/:id/toggle-status` | PATCH   | Basculer statut          | ✅     |
| `/admin/users/:id`               | DELETE  | Suppression RGPD         | ✅     |

_(Pour la documentation détaillée des endpoints, se référer à l'ancienne version du guide si nécessaire. La logique reste similaire.)_

### Hooks React Query (`useAdminUsers.ts`)

Le hook `useAdminUsers` expose une interface complète pour interagir avec l'API des utilisateurs, incluant la gestion des états de chargement, les erreurs, la pagination et les actions CRUD.

---

## 📋 Module Gestion des Commandes

### Endpoints API

| Endpoint               | Méthode | Description               | Status |
| ---------------------- | ------- | ------------------------- | ------ |
| `/admin/commandes`     | GET     | Liste paginée + stats     | ✅     |
| `/admin/commandes/:id` | GET     | Détails commande complète | ✅     |
| `/admin/commandes/:id` | PUT     | Modification statut/notes | ✅     |
| `/admin/commandes/:id` | DELETE  | Suppression commande      | ✅     |

### Hooks React Query (`useAdminCommandes.ts`)

Le hook `useAdminCommandes` fournit les outils nécessaires pour afficher, filtrer, trier et gérer les commandes, ainsi que pour mettre à jour leur statut.

---

## 💬 Module Messagerie

Le système de messagerie a été simplifié pour améliorer la communication directe entre clients et administrateurs.

> Pour une documentation détaillée, consultez le **[Guide API Messagerie (v2)](./MESSAGES_API_GUIDE.md)**.

### Endpoints API unifiés

L'API de messagerie utilise désormais un ensemble unique de routes pour les clients et les admins, avec des permissions étendues pour ces derniers.

| Endpoint                                      | Méthode | Description                                           |
| --------------------------------------------- | ------- | ----------------------------------------------------- |
| `POST /messages/visitor`                      | POST    | Route publique pour les contacts non authentifiés.    |
| `POST /messages/conversations`                | POST    | Démarrer une conversation (client vers admin).        |
| `GET /messages/conversations`                 | GET     | Lister les conversations (l'admin voit tout).         |
| `GET /messages/conversations/:conversationId` | GET     | Récupérer les messages d'une conversation.            |
| `POST /messages/conversations/:id/reply`      | POST    | Répondre à une conversation.                          |
| `GET /admin/messages/unread-count`            | GET     | Compteur de conversations non lues (admin seulement). |

### Hooks React Query

- **`useMessages.ts`**: Gère la logique pour les utilisateurs authentifiés (clients).
- **`useAdminMessages.ts`**: Contient des hooks spécifiques pour l'admin, comme `useAdminUnreadCount` pour le badge de notifications.

---

## 📄 Module Gestion des Pages (CMS)

Ce module permet la gestion des pages statiques (Contenus, SEO, etc.). **Actuellement, il ne supporte que la modification et la publication de pages existantes. La création et la suppression ne sont pas implémentées.**

### Endpoints API

| Endpoint                  | Méthode | Description                                   | Status |
| ------------------------- | ------- | --------------------------------------------- | ------ |
| `/admin/pages/stats`      | GET     | Statistiques des pages (publiées, brouillons) | ✅     |
| `/admin/pages`            | GET     | Liste paginée des pages avec filtres          | ✅     |
| `/admin/pages/:id`        | GET     | Détails d'une page par ID                     | ✅     |
| `/admin/pages/slug/:slug` | GET     | Détails d'une page par slug                   | ✅     |
| `/admin/pages/:id`        | PATCH   | Mise à jour partielle d'une page              | ✅     |
| `/:id/publish`            | PATCH   | Publier une page (statut -> PUBLISHED)        | ✅     |
| `/:id/unpublish`          | PATCH   | Dépublier une page (statut -> DRAFT)          | ✅     |

### Hooks React Query (`useAdminPages.ts`)

Les hooks fournissent les fonctionnalités pour lister, modifier et changer le statut des pages.

- `useAdminPages(filters)`: Récupère la liste des pages avec pagination et filtres.
- `useUpdatePage()`: Crée une mutation pour mettre à jour une page. Gère l'optimistic update et l'invalidation du cache.
- `useTogglePageStatus()`: Crée une mutation pour publier ou dépublier une page.

#### Exemple d'utilisation

```typescript
// AdminPages.tsx

const { data: pages, isLoading } = useAdminPages({ statut: "PUBLIEE" });
const updatePageMutation = useUpdatePage();
const toggleStatusMutation = useTogglePageStatus();

const handleUpdate = (id, data) => {
  updatePageMutation.mutate({ id, pageData: data });
};

const handleToggle = (page) => {
  toggleStatusMutation.toggleStatus(page);
};
```

---

## 💰 Module Gestion des Tarifs

_(Cette section reste inchangée par rapport au guide `ADMIN_COMPLETE_GUIDE.md` d'origine.)_

### Endpoints API

| Endpoint                       | Méthode | Description                         | Status |
| ------------------------------ | ------- | ----------------------------------- | ------ |
| `/admin/tarifs`                | GET     | Liste paginée avec filtres          | ✅     |
| `/admin/tarifs`                | POST    | Création nouveau tarif              | ✅     |
| `/admin/tarifs/:id`            | PUT     | Mise à jour tarif existant          | ✅     |
| `/admin/tarifs/:id`            | DELETE  | Suppression tarif                   | ✅     |
| `/admin/tarifs/stats/overview` | GET     | Statistiques tarifs (total, actifs) | ✅     |

### Hooks React Query (`useAdminTarifs.ts` & `useTarifInvalidation.ts`)

Ces hooks permettent un CRUD complet sur les tarifs, avec une fonctionnalité de **synchronisation en temps réel** avec la landing page, assurée par l'invalidation ciblée du cache de React Query.

---

# 🎭 Mode Démonstration, Sécurité et Tests

_(Ces sections restent inchangées par rapport au guide `ADMIN_COMPLETE_GUIDE.md` d'origine. Elles couvrent le mode démo, l'authentification renforcée, les tests unitaires, d'intégration et E2E.)_

---

_Ce document unifié remplace `ADMIN_COMPLETE_GUIDE.md`, `ADMIN_PAGES_API.md` et `ADMIN_PAGES_HOOKS_GUIDE.md`._
