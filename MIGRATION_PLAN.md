# Plan de migration : S3 → Stockage Local

## Objectif
Migrer le système de fichiers de projets de AWS S3 vers un stockage local, similaire au système de messages.

## Avantages
- ✅ **Gratuit** : Pas de coûts AWS
- ✅ **Simplicité** : Une seule méthode de stockage
- ✅ **Contrôle total** : Pas de dépendance externe
- ✅ **Développement** : Fonctionne immédiatement
- ✅ **Backup** : Inclus dans backup serveur

## Inconvénients
- ❌ **Scalabilité** : Limitée par l'espace disque
- ❌ **CDN** : Pas de distribution globale
- ❌ **Redondance** : Pas de backup automatique AWS

## Plan technique

### Étape 1 : Nouveau contrôleur unifié
```typescript
// backend/src/controllers/unifiedFileController.ts
export const uploadProjectFile = async (req, res) => {
  // Utiliser multer comme pour les messages
  // Stockage : uploads/projects/{commandeId}/
}

export const downloadProjectFile = async (req, res) => {
  // Servir depuis uploads/projects/
  // Même logique que downloadMessageFile
}
```

### Étape 2 : Structure de dossiers
```
backend/uploads/
├── messages/           # Messages (existant)
├── projects/          # Nouveaux fichiers projets
│   ├── {commandeId1}/
│   ├── {commandeId2}/
└── admin-corrections/  # Documents corrigés
    ├── {commandeId1}/
    ├── {commandeId2}/
```

### Étape 3 : Migration frontend
- Remplacer useUploadFile (S3) par upload direct multipart
- Supprimer logique URLs présignées
- Upload direct vers backend comme les messages

### Étape 4 : Nettoyage
- Supprimer filesService.ts (S3)
- Supprimer imports AWS SDK
- Simplifier projectFileModel.ts

## Estimation effort
- **Développement** : 2-3 heures
- **Tests** : 1 heure  
- **Migration données** : 30 minutes

## Coût final
- **AWS S3** : ~7-15€/mois → **0€/mois**
- **Stockage serveur** : Inclus dans hébergement