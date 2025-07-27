# 📁 Guide du Système d'Upload de Fichiers Projet

![Production](https://img.shields.io/badge/Status-Production%20Deployed-brightgreen)
![Live](https://img.shields.io/badge/Live-livrestaka.fr-blue)
![S3](https://img.shields.io/badge/AWS-S3%20Ready-orange)
![Multer](https://img.shields.io/badge/Upload-Multer-yellow)

## 🎯 Vue d'ensemble

Le système d'upload de fichiers projet de Staka Livres permet aux utilisateurs d'uploader des documents avec support dual : **stockage local multer** (mode développement) et **AWS S3 avec URLs présignées** (mode production). Cette implémentation moderne offre une expérience utilisateur fluide avec suivi de progression en temps réel, **déployée et opérationnelle sur [livrestaka.fr](https://livrestaka.fr/)**.

## 🏗️ Architecture

### Composants Backend

#### 1. Model (`ProjectFileModel`)

```typescript
// backend/src/models/projectFileModel.ts
- createFile(): Crée un enregistrement fichier et génère URL S3 présignée
- getProjectFiles(): Récupère les fichiers d'un projet (tri par date DESC)
- deleteFile(): Suppression logique d'un fichier
```

#### 2. Service (`FilesService`)

```typescript
// backend/src/services/filesService.ts
- createProjectFile(): Orchestration upload avec client S3
- getProjectFiles(): Récupération fichiers avec validation
- deleteProjectFile(): Suppression sécurisée
```

#### 3. Controller (`fileController`)

```typescript
// backend/src/controllers/fileController.ts
- uploadMessageFile(): Upload multer local avec validation
- downloadMessageFile(): Téléchargement sécurisé avec permissions
- deleteMessageFile(): Suppression physique + base de données
- listUserFiles(): Liste paginée des fichiers utilisateur
```

> **Note** : Le système actuel utilise le stockage local multer. L'intégration S3 avec URLs présignées est prête mais optionnelle selon la configuration AWS.

### Composants Frontend

#### 1. Hooks React Query

```typescript
// frontend/src/hooks/useUploadFile.ts
- Gestion upload avec progression temps réel
- Invalidation cache automatique
- Gestion d'erreurs avancée

// frontend/src/hooks/useProjectFiles.ts
- Récupération fichiers avec cache 30s
- Hooks suppression et téléchargement
- Utilitaires formatage (taille, date, icônes)
```

#### 2. Composants UI

```typescript
// frontend/src/pages/FilesPage.tsx
- FileItem: Affichage fichier avec actions
- UploadButton: Zone drag & drop avec progression
- Toast: Notifications utilisateur
```

## 🔒 Sécurité

### Backend

- **Validation ownership**: Vérification utilisateur propriétaire du projet
- **Validation MIME types**: Liste blanche des types autorisés
- **Limite taille**: Maximum 20 Mo par fichier
- **Validation UUID**: Paramètres route validés avec Zod
- **Authentification JWT**: Middleware obligatoire sur toutes les routes

### Frontend

- **Token validation**: Vérification token localStorage
- **Validation côté client**: Taille et types avant upload
- **Error boundaries**: Gestion erreurs gracieuse
- **HTTPS uniquement**: Uploads sécurisés vers S3

## 📊 Validation et Contraintes

### Types de fichiers autorisés

```typescript
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/zip",
  "application/x-rar-compressed",
];
```

### Limites

- **Taille maximum**: 20 Mo par fichier
- **Nom fichier**: 1-255 caractères
- **Upload simultané**: Supporté avec progression individuelle
- **URL présignée**: Expiration 1 heure

## 🚀 Utilisation

### 1. Upload de fichier

```typescript
import { useUploadFile } from "../hooks/useUploadFile";

function MyComponent() {
  const { uploadFile, progress, isUploading, error } = useUploadFile(
    (progressEvent) => console.log(`Progress: ${progressEvent.percentage}%`),
    (fileId) => console.log(`Upload success: ${fileId}`),
    (error) => console.error(`Upload error: ${error}`)
  );

  const handleUpload = async (file: File) => {
    try {
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
}: {
  projectId: string;
  fileId: string;
}) {
  const { deleteFile, isDeleting } = useDeleteFile(
    projectId,
    () => alert("Fichier supprimé"),
    (error) => alert(`Erreur: ${error}`)
  );

  return (
    <button onClick={() => deleteFile(fileId)} disabled={isDeleting}>
      {isDeleting ? "Suppression..." : "Supprimer"}
    </button>
  );
}
```

## 🔧 Configuration

### Variables d'environnement

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-west-3
AWS_S3_BUCKET=staka-livres-files

# Base de données
DATABASE_URL="mysql://user:password@localhost:3306/database"

# JWT
JWT_SECRET="your_jwt_secret"
```

### Mode développement sans S3

Si les variables AWS ne sont pas configurées, le système fonctionne en mode simulation avec des URLs locales.

## 🧪 Tests

### Tests Backend

```bash
# Tests unitaires
cd backend && npm test -- src/__tests__/models/projectFileModel.test.ts
cd backend && npm test -- src/__tests__/services/filesService.test.ts
cd backend && npm test -- src/__tests__/controllers/filesController.test.ts

# Coverage
cd backend && npm run test:coverage
```

### Tests Frontend

```bash
# Tests hooks
cd frontend && npm test -- src/__tests__/hooks/useUploadFile.test.ts
cd frontend && npm test -- src/__tests__/hooks/useProjectFiles.test.ts

# Coverage
cd frontend && npm run test:coverage
```

### Mocking S3

Les tests utilisent `aws-sdk-client-mock` pour simuler les interactions S3 :

```typescript
import { mockClient } from "aws-sdk-client-mock";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Mock = mockClient(S3Client);

beforeEach(() => {
  s3Mock.reset();
});

it("should upload to S3", async () => {
  s3Mock.on(PutObjectCommand).resolves({});
  // Test upload logic
});
```

## 📈 Performance

### React Query Cache

- **Stale time**: 30 secondes pour les listes de fichiers
- **Garbage collection**: 5 minutes
- **Invalidation automatique**: Après upload/suppression
- **Retry logic**: 3 tentatives avec backoff exponentiel

### Optimisations S3

- **URLs présignées**: Upload direct sans proxy backend
- **Metadata enrichies**: Informations utilisateur et projet dans headers
- **Compression**: Automatique côté navigateur
- **Progression streaming**: XMLHttpRequest avec events

## 🐛 Gestion d'erreurs

### Codes d'erreur communs

| Code | Description             | Solution                    |
| ---- | ----------------------- | --------------------------- |
| 400  | Fichier trop volumineux | Réduire la taille < 20 Mo   |
| 400  | Type MIME non autorisé  | Utiliser un format supporté |
| 403  | Accès projet refusé     | Vérifier ownership projet   |
| 403  | Token invalide          | Réauthentification          |
| 500  | Erreur S3               | Vérifier configuration AWS  |

### Stratégies de récupération

- **Retry automatique**: 3 tentatives avec délai croissant
- **Fallback mode**: Mode simulation si S3 indisponible
- **Cache persistence**: Données en cache pendant les erreurs
- **User feedback**: Messages d'erreur explicites

## 🔄 API Reference

### POST /api/files/upload (Multer Local)

Upload un fichier via multer avec stockage local.

**Request:** Multipart form-data avec fichier

**Response 201:**

```json
{
  "message": "Fichier uploadé avec succès",
  "file": {
    "id": "file-uuid",
    "filename": "manuscript.pdf",
    "size": 2048576,
    "mimeType": "application/pdf",
    "url": "/uploads/messages/stored-name.pdf",
    "type": "DOCUMENT"
  }
}
```

### GET /api/files/user

Récupère les fichiers de l'utilisateur avec pagination.

**Query params:** `page`, `limit`

**Response 200:**

```json
{
  "files": [
    {
      "id": "file-uuid",
      "filename": "manuscript.pdf",
      "mimeType": "application/pdf",
      "size": 2048576,
      "type": "DOCUMENT",
      "createdAt": "2025-07-27T10:30:00Z"
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

### DELETE /api/files/:fileId

Supprime un fichier avec validation ownership et suppression physique.

**Response 200:**

```json
{
  "message": "Fichier supprimé avec succès"
}
```

## 🎯 Roadmap

### Fonctionnalités futures

- [ ] **Versioning**: Historique des versions de fichiers
- [ ] **Compression automatique**: Optimisation taille upload
- [ ] **Prévisualisation**: Aperçu fichiers dans navigateur
- [ ] **Partage sécurisé**: URLs temporaires pour partage
- [ ] **Indexation**: Recherche contenu documents
- [ ] **Webhooks**: Notifications externes upload/suppression

### Améliorations techniques

- [ ] **CDN CloudFront**: Distribution globale des fichiers
- [ ] **Multipart upload**: Gros fichiers > 100 Mo
- [ ] **Background jobs**: Processing async documents
- [ ] **Encryption**: Chiffrement files sensibles
- [ ] **Backup S3**: Réplication cross-region
- [ ] **Monitoring**: Métriques upload/download

---

**✨ Version Juillet 2025 - Dernière mise à jour : 27 Juillet 2025**  
**🌐 Production URL** : [livrestaka.fr](https://livrestaka.fr/)  
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

_Documentation mise à jour le 27 juillet 2025 - Version 2.0.0 - Production déployée_
