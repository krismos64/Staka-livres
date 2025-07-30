# 📁 Guide du Système d'Upload de Fichiers Projet

![Production](https://img.shields.io/badge/Status-Production%20Deployed-brightgreen)
![Live](https://img.shields.io/badge/Live-livrestaka.fr-blue)
![Local](https://img.shields.io/badge/Storage-Local%20Only-green)
![Multer](https://img.shields.io/badge/Upload-Multer-yellow)

## 🎯 Vue d'ensemble

Le système d'upload de fichiers projet de Staka Livres permet aux utilisateurs d'uploader des documents avec **stockage local unifié** via Multer. Suite à la migration S3→Local terminée en juillet 2025, l'architecture est simplifiée et entièrement opérationnelle sans dépendances AWS. Cette implémentation moderne offre une expérience utilisateur fluide avec suivi de progression en temps réel, **déployée et opérationnelle sur [livrestaka.fr](https://livrestaka.fr/)**.

## 🏗️ Architecture

### Composants Backend

#### 1. Contrôleur Unifié (`unifiedFileController`)

```typescript
// backend/src/controllers/unifiedFileController.ts
- uploadProjectFile(): Upload direct via Multer avec validation complète
- getProjectFiles(): Récupération fichiers avec tri et pagination
- downloadFile(): Téléchargement sécurisé avec permissions
- deleteProjectFile(): Suppression physique + base de données
- getUserFiles(): Liste paginée de tous les fichiers utilisateur
```

#### 2. Contrôleur Messages (`fileController`)

```typescript
// backend/src/controllers/fileController.ts
- uploadMessageFile(): Upload pièces jointes messages
- downloadMessageFile(): Téléchargement sécurisé avec permissions
- deleteMessageFile(): Suppression physique + base de données
- listUserFiles(): Liste paginée des fichiers utilisateur
```

#### 3. Routes Unifiées

```typescript
// backend/src/routes/unifiedFiles.ts
POST   /api/files/projects/:id/upload     # Upload fichier projet
GET    /api/files/projects/:id/files      # Liste fichiers projet
GET    /api/files/download/:fileId        # Téléchargement fichier
DELETE /api/files/projects/:id/files/:fileId # Suppression fichier
GET    /api/files/user/all               # Tous fichiers utilisateur
```

#### 4. Structure de Stockage Local

```
backend/uploads/
├── projects/    # Fichiers liés aux projets (manuscrits, documents)
├── messages/    # Pièces jointes des messages support
├── orders/      # Documents des commandes payantes
└── invoices/    # Factures PDF générées automatiquement
```

> **Migration S3→Local terminée** : Plus de dépendances AWS, stockage 100% local avec 81 fichiers actuellement en production.

### Composants Frontend

#### 1. Hooks React Query

```typescript
// frontend/src/hooks/useLocalUpload.ts (remplace useUploadFile)
- Upload direct FormData via Multer (plus de S3)
- Progression temps réel simulée
- Invalidation cache automatique après upload
- Gestion d'erreurs avancée avec feedback utilisateur

// frontend/src/hooks/useProjectFiles.ts
- Récupération fichiers avec cache 30s React Query
- Hooks suppression et téléchargement
- Utilitaires formatage (taille, date, icônes types)

// frontend/src/hooks/useUserFiles.ts
- Vue globale de tous les fichiers utilisateur
- Support pagination et tri
- Intégration avec système de permissions
```

#### 2. Composants UI

```typescript
// frontend/src/components/FileUpload.tsx
- Zone drag & drop moderne avec preview
- Validation côté client (types MIME, taille)
- Barre de progression temps réel
- Icônes spécifiques par type de fichier

// frontend/src/pages/FilesPage.tsx
- FileItem: Affichage avec actions (télécharger, supprimer)
- Support fichiers admin (non supprimables par clients)
- Toast notifications avec messages explicites
- Interface responsive avec pagination
```

## 🔒 Sécurité

### Backend

- **Validation ownership**: Vérification utilisateur propriétaire du projet/fichier
- **Validation MIME types**: 20+ types autorisés (PDF, Word, Excel, images, archives)
- **Limite taille**: Maximum 20 Mo par fichier
- **Validation UUID**: Paramètres route validés avec Zod
- **Authentification JWT**: Middleware obligatoire sur toutes les routes
- **Stockage sécurisé**: Noms UUID pour éviter conflits et accès direct
- **Permissions granulaires**: Fichiers admin vs utilisateur

### Frontend

- **Token validation**: Vérification token localStorage avec refresh
- **Validation côté client**: Taille et types avant upload
- **Error boundaries**: Gestion erreurs gracieuse avec fallbacks
- **HTTPS uniquement**: Communications sécurisées backend
- **Protection CSRF**: Headers Authorization obligatoires

## 📊 Validation et Contraintes

### Types de fichiers autorisés (20+ formats)

```typescript
const allowedMimeTypes = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/rtf",
  
  // Images
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
  
  // Archives
  "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
  
  // Audio/Média
  "audio/mpeg", "audio/wav", "video/mp4"
];
```

### Limites

- **Taille maximum**: 20 Mo par fichier
- **Nom fichier**: 1-255 caractères
- **Upload simultané**: Supporté avec progression individuelle
- **Stockage**: UUID + timestamp pour éviter conflits
- **Types contextuels**: Projets, messages, commandes, factures

## 🚀 Utilisation

### 1. Upload de fichier

```typescript
import { useLocalUpload } from "../hooks/useLocalUpload";

function MyComponent() {
  const { uploadFile, progress, isUploading, error } = useLocalUpload(
    (progressEvent) => console.log(`Progress: ${progressEvent.percentage}%`),
    (fileId) => console.log(`Upload success: ${fileId}`),
    (error) => console.error(`Upload error: ${error}`)
  );

  const handleUpload = async (file: File) => {
    try {
      // Upload direct vers backend (plus de S3)
      const fileId = await uploadFile({
        projectId: "project-123",
        file,
      });
      console.log("File uploaded:", fileId);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {isUploading && <div>Progress: {progress}%</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

### 2. Récupération de fichiers

```typescript
import { useProjectFiles } from "../hooks/useProjectFiles";

function FilesList({ projectId }: { projectId: string }) {
  const { files, count, isLoading, error } = useProjectFiles(projectId);

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      <h3>Fichiers ({count})</h3>
      {files.map((file) => (
        <div key={file.id}>
          <span>{file.filename}</span>
          <span>{fileUtils.formatFileSize(file.size)}</span>
          <span>{fileUtils.formatDate(file.uploadedAt)}</span>
        </div>
      ))}
    </div>
  );
}
```

### 3. Suppression de fichier

```typescript
import { useDeleteFile } from "../hooks/useProjectFiles";

function DeleteButton({
  projectId,
  fileId,
  isAdminFile = false, // Nouveauté: fichiers admin non supprimables
}: {
  projectId: string;
  fileId: string;
  isAdminFile?: boolean;
}) {
  const { deleteFile, isDeleting } = useDeleteFile(
    projectId,
    () => alert("Fichier supprimé avec succès"),
    (error) => alert(`Erreur: ${error}`)
  );

  // Fichiers admin non supprimables par les clients
  if (isAdminFile) {
    return (
      <span className="text-orange-600 text-sm">
        📎 Fichier correcteur (non supprimable)
      </span>
    );
  }

  return (
    <button 
      onClick={() => deleteFile(fileId)} 
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800"
    >
      {isDeleting ? "Suppression..." : "🗑️ Supprimer"}
    </button>
  );
}
```

## 🔧 Configuration

### Variables d'environnement

```env
# Base de données
DATABASE_URL="mysql://staka:staka@db:3306/stakalivres"

# JWT
JWT_SECRET="dev_secret_key_change_in_production"

# Email notifications
SENDGRID_API_KEY="SG.xxx..."
FROM_EMAIL="contact@staka.fr"
FROM_NAME="Staka Livres"

# ==============================================
# AWS S3 Variables (deprecated after migration)
# Migration date: 2025-07-29
# Status: Stockage local actif - Variables AWS supprimées
# ==============================================

# DEPRECATED (migration S3→Local): AWS_ACCESS_KEY_ID="test-key"
# DEPRECATED (migration S3→Local): AWS_SECRET_ACCESS_KEY="test-secret"
# DEPRECATED (migration S3→Local): AWS_REGION="eu-west-3"
# DEPRECATED (migration S3→Local): AWS_S3_BUCKET="staka-livres-files"
```

### Migration S3→Local terminée

**Juillet 2025** : L'application fonctionne entièrement en stockage local. Les variables AWS sont conservées commentées pour référence historique. Le dossier `/deprecated-aws/` contient l'ancien code S3.

## 🧪 Tests

### Tests Backend

```bash
# Tests unitaires (architecture moderne)
cd backend && npm test -- src/__tests__/controllers/
cd backend && npm test -- src/__tests__/services/
cd backend && npm test -- src/__tests__/integration/

# Tests deprecated AWS (maintenus pour référence)
cd backend && npm test -- src/deprecated-aws/tests/

# Coverage globale
cd backend && npm run test:coverage  # 90% coverage actuel
```

### Tests Frontend

```bash
# Tests hooks (migration vers useLocalUpload)
cd frontend && npm test -- src/__tests__/hooks/useProjectFiles.test.ts
cd frontend && npm test -- src/deprecated-aws/useUploadFile.test.ts  # Ancien test S3

# Tests d'intégration
cd frontend && npm run test:integration  # Avec backend actif

# Tests E2E Cypress (34 tests production)
cd frontend && npm run test:e2e:critical  # Tests critiques
cd frontend && npm run test:e2e          # Suite complète
```

### Mocking Multer & File System

Les tests utilisent des mocks Prisma et file system pour simuler le stockage local :

```typescript
import { vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock file system operations
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn()
}));

// Mock Prisma client
const mockPrisma = {
  file: {
    create: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn()
  }
};

it("should upload file locally", async () => {
  mockPrisma.file.create.mockResolvedValue({
    id: 'file-123',
    filename: 'test.pdf',
    url: '/uploads/projects/uuid-timestamp.pdf'
  });
  
  // Test local upload logic
});
```

## 📈 Performance

### React Query Cache

- **Stale time**: 30 secondes pour les listes de fichiers
- **Garbage collection**: 5 minutes
- **Invalidation automatique**: Après upload/suppression
- **Retry logic**: 3 tentatives avec backoff exponentiel

### Optimisations Stockage Local

- **Upload direct**: FormData vers backend avec Multer
- **Noms UUID**: Éviter conflits et accès direct non autorisé
- **Dossiers contextuels**: Séparation projects/messages/orders/invoices
- **Progression simulée**: Feedback utilisateur temps réel
- **Serving optimisé**: Express.static pour downloads rapides

## 🐛 Gestion d'erreurs

### Codes d'erreur communs

| Code | Description             | Solution                    |
| ---- | ----------------------- | --------------------------- |
| 400  | Fichier trop volumineux | Réduire la taille < 20 Mo   |
| 400  | Type MIME non autorisé  | Utiliser un format supporté |
| 403  | Accès projet refusé     | Vérifier ownership projet   |
| 403  | Token invalide          | Réauthentification          |
| 500  | Erreur file system      | Vérifier permissions upload |
| 500  | Erreur Multer           | Vérifier configuration stockage |

### Stratégies de récupération

- **Retry automatique**: 3 tentatives avec délai croissant
- **Fallback gracieux**: Upload queue si backend temporairement indisponible
- **Cache persistence**: React Query maintient les données en cache
- **User feedback**: Messages d'erreur explicites avec solutions
- **Admin notifications**: Fichiers correcteur automatiquement notifiés

## 🔄 API Reference

### POST /api/files/projects/:id/upload (Upload Unifié)

Upload un fichier vers un projet avec stockage local Multer.

**Request:** Multipart form-data avec fichier + metadata

**Headers:** Authorization: Bearer {token}

**Response 201:**

```json
{
  "message": "Fichier uploadé avec succès",
  "file": {
    "id": "file-uuid",
    "filename": "manuscript.pdf",
    "storedName": "uuid-timestamp.pdf",
    "size": 2048576,
    "mimeType": "application/pdf",
    "url": "/uploads/projects/uuid-timestamp.pdf",
    "type": "DOCUMENT",
    "description": null, // ou "ADMIN_FILE: Document corrigé" si admin
    "isPublic": false,
    "createdAt": "2025-07-30T10:30:00Z"
  }
}
```

### GET /api/files/user/all

Récupère tous les fichiers de l'utilisateur (projets + messages) avec pagination.

**Query params:** `page`, `limit`

**Response 200:**

```json
{
  "success": true,
  "files": [
    {
      "id": "file-uuid",
      "filename": "manuscript.pdf",
      "storedName": "uuid-timestamp.pdf",
      "mimeType": "application/pdf",
      "size": 2048576,
      "type": "DOCUMENT",
      "description": "ADMIN_FILE: Document corrigé",
      "isAdminFile": true,
      "commandeId": "projet-123",
      "createdAt": "2025-07-30T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### GET /api/files/download/:fileId

Télécharge un fichier avec validation permissions et audit trail.

**Headers:** Authorization: Bearer {token}

**Response 200:** Stream du fichier avec headers appropriés

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="manuscript.pdf"
Content-Length: 2048576
```

### DELETE /api/files/projects/:id/files/:fileId

Supprime un fichier avec validation ownership et suppression physique.

**Restrictions:** Fichiers admin non supprimables par les clients

**Response 200:**

```json
{
  "success": true,
  "message": "Fichier supprimé avec succès"
}
```

## 🎯 Roadmap

### Fonctionnalités futures

- [ ] **Versioning**: Historique des versions de fichiers
- [ ] **Compression automatique**: Optimisation images et PDFs
- [ ] **Prévisualisation**: Aperçu PDF/images dans navigateur
- [ ] **Partage sécurisé**: URLs temporaires pour partage
- [ ] **Indexation**: Recherche contenu documents (OCR)
- [ ] **Webhooks**: Notifications externes upload/suppression
- [ ] **Backup automatique**: Sauvegarde périodique vers cloud
- [ ] **Antivirus**: Scan automatique des fichiers uploadés

### Améliorations techniques

- [ ] **CDN intégration**: Distribution globale via CloudFlare
- [ ] **Chunked upload**: Gros fichiers > 100 Mo en chunks
- [ ] **Background jobs**: Processing async documents (conversion, compression)
- [ ] **Encryption**: Chiffrement files sensibles côté serveur
- [ ] **Backup cloud**: Réplication automatique vers AWS/GCP
- [ ] **Monitoring**: Métriques upload/download avec alertes
- [ ] **Docker volumes**: Persistance optimisée en production
- [ ] **API rate limiting**: Protection contre abus uploads

---

**✨ Version Juillet 2025 - Dernière mise à jour : 30 Juillet 2025**  
**🌐 Production URL** : [livrestaka.fr](https://livrestaka.fr/)  
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)  
**📦 Migration S3→Local** : Terminée le 29 juillet 2025  
**💾 Stockage actuel** : 81 fichiers en production locale

_Documentation mise à jour le 30 juillet 2025 - Version 2.1.0 - Migration S3→Local terminée - Production déployée_
