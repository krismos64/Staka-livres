# API Gestion des Pages Statiques - Documentation Admin

## 📄 Vue d'ensemble

Ce module permet la gestion complète des pages statiques dans l'espace admin de Staka Livres. Il respecte les conventions de sécurité (JWT, rôle admin) et s'aligne strictement avec le modèle Prisma `Page`.

## 🔐 Sécurité

- **Authentification JWT** obligatoire sur toutes les routes
- **Rôle ADMIN** requis pour tous les endpoints
- **Validation stricte** des entrées avec gestion des erreurs
- **Logs d'audit** pour toutes les actions administratives

## 📋 Endpoints disponibles

### GET /admin/pages/stats

Récupère les statistiques des pages.

**Réponse :**

```json
{
  "success": true,
  "data": {
    "total": 15,
    "published": 8,
    "draft": 5,
    "archived": 1,
    "scheduled": 1
  },
  "message": "Statistiques récupérées avec succès"
}
```

### GET /admin/pages

Liste paginée des pages avec filtres.

**Paramètres de requête :**

- `page` (number, défaut: 1) - Numéro de page
- `limit` (number, défaut: 10, max: 100) - Éléments par page
- `search` (string) - Recherche dans titre, slug, contenu
- `status` (PageStatus) - Filtre par statut
- `type` (PageType) - Filtre par type
- `category` (string) - Filtre par catégorie
- `isPublic` (boolean) - Filtre par visibilité
- `sortBy` (string) - Champ de tri
- `sortDirection` (asc|desc) - Direction du tri

**Réponse :**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Titre de la page",
      "slug": "titre-de-la-page",
      "content": "Contenu HTML",
      "excerpt": "Extrait",
      "type": "PAGE",
      "status": "PUBLISHED",
      "metaTitle": "Meta title",
      "metaDescription": "Meta description",
      "metaKeywords": "keywords",
      "category": "Catégorie",
      "tags": "tag1,tag2",
      "sortOrder": 0,
      "isPublic": true,
      "requireAuth": false,
      "publishedAt": "2025-01-15T10:30:00Z",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  },
  "message": "10 pages récupérées"
}
```

### GET /admin/pages/:id

Récupère les détails d'une page par ID.

**Paramètres :**

- `id` (string) - ID de la page

**Réponse :**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Titre de la page",
    "slug": "titre-de-la-page",
    "content": "Contenu HTML",
    "excerpt": "Extrait",
    "type": "PAGE",
    "status": "PUBLISHED",
    "metaTitle": "Meta title",
    "metaDescription": "Meta description",
    "metaKeywords": "keywords",
    "category": "Catégorie",
    "tags": "tag1,tag2",
    "sortOrder": 0,
    "isPublic": true,
    "requireAuth": false,
    "publishedAt": "2025-01-15T10:30:00Z",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  },
  "message": "Page récupérée avec succès"
}
```

### GET /admin/pages/slug/:slug

Récupère les détails d'une page par slug.

**Paramètres :**

- `slug` (string) - Slug de la page

**Réponse :** Identique à GET /admin/pages/:id

### POST /admin/pages

Crée une nouvelle page.

**Body :**

```json
{
  "title": "Titre de la page",
  "slug": "titre-de-la-page",
  "content": "Contenu HTML",
  "excerpt": "Extrait (optionnel)",
  "type": "PAGE",
  "status": "DRAFT",
  "metaTitle": "Meta title (optionnel)",
  "metaDescription": "Meta description (optionnel)",
  "metaKeywords": "keywords (optionnel)",
  "category": "Catégorie (optionnel)",
  "tags": "tag1,tag2 (optionnel)",
  "sortOrder": 0,
  "isPublic": true,
  "requireAuth": false
}
```

**Réponse :**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Titre de la page",
    "slug": "titre-de-la-page",
    "content": "Contenu HTML",
    "excerpt": "Extrait",
    "type": "PAGE",
    "status": "DRAFT",
    "metaTitle": "Meta title",
    "metaDescription": "Meta description",
    "metaKeywords": "keywords",
    "category": "Catégorie",
    "tags": "tag1,tag2",
    "sortOrder": 0,
    "isPublic": true,
    "requireAuth": false,
    "publishedAt": null,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  },
  "message": "Page créée avec succès"
}
```

### PUT /admin/pages/:id

Met à jour complètement une page existante.

**Paramètres :**

- `id` (string) - ID de la page

**Body :** Identique à POST /admin/pages

**Réponse :** Identique à POST /admin/pages

### PATCH /admin/pages/:id

Met à jour partiellement une page existante.

**Paramètres :**

- `id` (string) - ID de la page

**Body :** Champs partiels à mettre à jour

**Réponse :** Identique à PUT /admin/pages/:id

### PATCH /admin/pages/:id/publish

Publie une page (change le statut en PUBLISHED).

**Paramètres :**

- `id` (string) - ID de la page

**Réponse :**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Titre de la page",
    "slug": "titre-de-la-page",
    "status": "PUBLISHED",
    "publishedAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  },
  "message": "Page publiée avec succès"
}
```

### PATCH /admin/pages/:id/unpublish

Dépublie une page (change le statut en DRAFT).

**Paramètres :**

- `id` (string) - ID de la page

**Réponse :**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Titre de la page",
    "slug": "titre-de-la-page",
    "status": "DRAFT",
    "publishedAt": null,
    "updatedAt": "2025-01-15T10:30:00Z"
  },
  "message": "Page dépubliée avec succès"
}
```

### DELETE /admin/pages/:id

Supprime définitivement une page.

**Paramètres :**

- `id` (string) - ID de la page

**Réponse :**

```json
{
  "success": true,
  "message": "Page supprimée avec succès"
}
```

## 🚨 Codes d'erreur

### 400 - Bad Request

- Paramètres de pagination invalides
- Données de validation invalides
- Statut ou type invalide

### 401 - Unauthorized

- Token JWT manquant ou invalide

### 403 - Forbidden

- Rôle insuffisant (non-admin)

### 404 - Not Found

- Page non trouvée

### 409 - Conflict

- Slug déjà utilisé

### 500 - Internal Server Error

- Erreur interne du serveur

## 📊 Types et énumérations

### PageType

```typescript
enum PageType {
  PAGE = "PAGE",
  FAQ = "FAQ",
  BLOG = "BLOG",
  LEGAL = "LEGAL",
  HELP = "HELP",
  LANDING = "LANDING",
}
```

### PageStatus

```typescript
enum PageStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
  SCHEDULED = "SCHEDULED",
}
```

## 🔍 Validation des données

### Règles de validation

- **title** : Requis, 1-255 caractères
- **slug** : Requis, 1-255 caractères, format `a-z0-9-`
- **content** : Requis, minimum 1 caractère
- **metaTitle** : Optionnel, max 255 caractères
- **category** : Optionnel, max 100 caractères
- **sortOrder** : Optionnel, nombre positif

### Exemple d'erreur de validation

```json
{
  "success": false,
  "error": "Données invalides",
  "message": "Veuillez corriger les erreurs suivantes",
  "details": [
    "Le titre est requis et doit faire au moins 1 caractère",
    "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets"
  ]
}
```

## 🔄 Alignement avec le frontend

Le module est compatible avec l'interface `PageStatique` du frontend :

```typescript
interface PageStatique {
  id: string;
  titre: string; // Mappé vers title
  slug: string;
  contenu: string; // Mappé vers content
  description?: string; // Mappé vers excerpt
  statut: StatutPage; // Mappé vers status
  createdAt: string;
  updatedAt: string;
}
```

### Mapping des champs

- `title` ↔ `titre`
- `content` ↔ `contenu`
- `excerpt` ↔ `description`
- `status` ↔ `statut`

## 📝 Logs d'audit

Toutes les actions sont loggées avec le format :

```
📄 [ADMIN_PAGE_AUDIT] admin@example.com - ACTION - Page: uuid
```

### Actions loggées

- `GET_PAGES` - Consultation de la liste
- `GET_PAGE_BY_ID` - Consultation d'une page
- `CREATE_PAGE` - Création
- `UPDATE_PAGE` - Modification
- `DELETE_PAGE` - Suppression
- `PUBLISH_PAGE` - Publication
- `UNPUBLISH_PAGE` - Dépublier

## 🧪 Tests

Le module inclut des tests pour :

- Validation des données
- Gestion des erreurs
- Logs d'audit
- Sécurité (JWT, rôles)

## 🔧 Intégration

### Ajout dans le serveur

Les routes sont automatiquement exposées via :

```typescript
// backend/src/routes/admin.ts
router.use("/pages", pagesRoutes);
```

### Middleware appliqué

- `authenticateToken` - Vérification JWT
- `requireRole(Role.ADMIN)` - Vérification rôle admin

## 📚 Utilisation

### Exemple de création de page

```bash
curl -X POST http://localhost:3001/admin/pages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "À propos",
    "slug": "a-propos",
    "content": "<h1>À propos de Staka Livres</h1><p>Notre histoire...</p>",
    "type": "PAGE",
    "status": "DRAFT"
  }'
```

### Exemple de publication

```bash
curl -X PATCH http://localhost:3001/admin/pages/PAGE_ID/publish \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
