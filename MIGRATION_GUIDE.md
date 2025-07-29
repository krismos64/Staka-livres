# 🚀 Guide de Migration AWS S3 → Stockage Local

## ✅ Migration Terminée - Récapitulatif

La migration du système de fichiers de **AWS S3** vers le **stockage local** a été complètement terminée avec succès.

### 📊 Résultats de la Migration

| Aspect | Avant (AWS S3) | Après (Stockage Local) | Statut |
|--------|----------------|------------------------|---------|
| **Coût mensuel** | ~10€/mois | 0€/mois | ✅ **-100%** |
| **Dépendances externes** | AWS SDK, S3 | Aucune | ✅ **Supprimées** |
| **Contrôleur fichiers** | `filesController.ts` | `unifiedFileController.ts` | ✅ **Recréé** |
| **Routes admin factures** | `adminFactureController.ts` | `adminInvoiceController.ts` | ✅ **Recréées** |
| **Système d'upload** | URLs présignées S3 | Upload direct Multer | ✅ **Simplifié** |

---

## 🏗️ Architecture Finale

### Structure de Stockage
```
backend/uploads/
├── projects/          # Fichiers de projets clients + documents corrigés admin  
├── invoices/          # Factures PDF générées
└── messages/          # Pièces jointes des messages (existant)
```

### Routes API Créées/Mises à Jour

#### 🔵 Routes Fichiers Unifiées
- `POST /api/files/projects/:id/upload` - Upload direct (Multer)
- `GET /api/files/projects/:id/files` - Liste des fichiers
- `GET /api/files/download/:fileId` - Téléchargement unifié
- `DELETE /api/files/projects/:id/files/:fileId` - Suppression

#### 🔵 Routes Admin Factures (Recréées)
- `GET /api/admin/factures` - Liste paginée
- `GET /api/admin/factures/:id` - Détails
- `GET /api/admin/factures/:id/download` - PDF (stockage local)
- `POST /api/admin/factures/:id/resend` - Renvoi email
- `POST /api/admin/factures/:id/regenerate` - Régénération PDF

#### 🔵 Routes Client Factures (Mises à Jour)
- `GET /api/invoices` - Liste utilisateur
- `GET /api/invoices/:id/download` - PDF (stockage local)

---

## 🛠️ Scripts de Migration Disponibles

### 1. Test du Système
```bash
# Tester le stockage local
node backend/test-local-storage.js

# Afficher les routes API
node backend/test-api-routes.js
```

### 2. Migration des Données S3 (Si Nécessaire)
```bash
# Avec vraies clés AWS (migration automatique)
export AWS_ACCESS_KEY_ID=your_real_key
export AWS_SECRET_ACCESS_KEY=your_real_secret  
export AWS_S3_BUCKET=your_bucket
node backend/migrate-s3-to-local.js

# Sans clés AWS (fichiers de démo)
node backend/migrate-s3-to-local.js
```

### 3. Mise à Jour URLs Base de Données
```bash
# Simulation (recommandé d'abord)
node backend/update-database-urls.js

# Exécution réelle
node backend/update-database-urls.js --execute
```

---

## 🚀 Déploiement en Production

### Étapes Recommandées

1. **Backup Complet**
   ```bash
   # Backup base de données
   mysqldump -u user -p database > backup_before_migration.sql
   
   # Backup fichiers S3 importants (manuel via AWS Console)
   ```

2. **Déploiement du Code**
   ```bash
   # Pull du nouveau code
   git pull origin main
   
   # Rebuild avec Docker
   docker compose build --no-cache
   
   # Redémarrage
   docker compose up -d
   ```

3. **Migration des Données** (Optionnel)
   ```bash
   # Migrer les fichiers S3 critiques
   docker compose exec app node migrate-s3-to-local.js
   
   # Mettre à jour les URLs en base
   docker compose exec app node update-database-urls.js --execute
   ```

4. **Suppression des Variables AWS**
   ```bash
   # Supprimer du .env production
   # AWS_ACCESS_KEY_ID=
   # AWS_SECRET_ACCESS_KEY=  
   # AWS_S3_BUCKET=
   # AWS_REGION=
   ```

---

## 🔍 Tests de Validation

### Tests Automatiques
- ✅ Compilation TypeScript sans erreurs
- ✅ Structure de stockage créée
- ✅ Routes API opérationnelles
- ✅ Upload/download de fichiers test

### Tests Manuels Recommandés
1. **Upload de fichier projet** (client)
2. **Upload de document corrigé** (admin)  
3. **Téléchargement de fichiers** (client/admin)
4. **Génération de facture PDF**
5. **Téléchargement de facture**

### Commandes de Test
```bash
# Démarrer en mode développement
npm run dev:watch

# Tester une route
curl -X GET http://localhost:3000/api/admin/factures

# Upload test (avec authentification)
curl -X POST -F "file=@test.pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/files/projects/PROJECT_ID/upload
```

---

## 🆘 Dépannage

### Problèmes Courants

**1. Dossiers uploads manquants**
```bash
mkdir -p backend/uploads/{projects,invoices,messages}
```

**2. Permissions fichiers**
```bash
chmod 755 backend/uploads/
chmod 644 backend/uploads/**/*
```

**3. URLs S3 restantes en base**
```bash
# Identifier les URLs S3 restantes
SELECT * FROM invoices WHERE pdfUrl LIKE '%s3%';
SELECT * FROM files WHERE url LIKE '%s3%';

# Les corriger manuellement ou via script
node backend/update-database-urls.js --execute
```

**4. Ancien code AWS importé**
```bash
# Vérifier qu'aucun import AWS reste
grep -r "aws-sdk" backend/src/
grep -r "S3Client" backend/src/
```

---

## 💰 Économies Réalisées

| Période | Économies |
|---------|-----------|
| **Mensuel** | ~10€ |
| **Annuel** | ~120€ |
| **Amortissement dev** | Immédiat |

**ROI** : 100% dès le premier mois 🎉

---

## 📞 Support

En cas de problème lors du déploiement :
1. Vérifier les logs Docker : `docker compose logs -f`
2. Tester les routes individuellement  
3. Vérifier les permissions de fichiers
4. S'assurer que les dossiers uploads existent

**La migration est techniquement terminée et prête pour la production !** ✨