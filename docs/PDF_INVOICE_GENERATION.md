# 📄 Guide de Génération PDF des Factures - Production 2025

## 🎯 Vue d'ensemble

Le système de génération PDF des factures de Staka Livres offre une solution complète pour créer, stocker et télécharger des factures professionnelles au format PDF. Cette implémentation utilise **pdf-lib** pour la génération, AWS S3 pour le stockage sécurisé avec URLs signées **30 jours**, et fournit des endpoints optimisés pour le téléchargement sans mocks.

## 🏗️ Architecture Technique

### Configuration Centralisée

**CONFIG** (`src/config/config.ts`)
- **S3_SIGNED_URL_TTL**: `30 * 24 * 60 * 60` (30 jours en secondes)
- **BUCKET**: `staka-invoices` (bucket S3 de production)
- **REGION**: `eu-west-3` (région AWS Europe)
- **PDF_COMPANY_INFO**: Données entreprise pour facturation

### Services Principaux

1. **PdfService** (`src/services/pdf.ts`)
   - Génération de PDF professionnel avec **pdf-lib** v1.17.1
   - Template A4 portrait avec design moderne
   - Gestion des logos, en-têtes, tableaux et pieds de page
   - TypeScript strict avec polices StandardFonts

2. **S3InvoiceService** (`src/services/s3InvoiceService.ts`)
   - Upload sécurisé vers AWS S3
   - Génération d'URLs signées (30 jours)
   - Téléchargement et vérification d'existence
   - Mode simulation pour le développement local

3. **AdminFactureController** (`src/controllers/adminFactureController.ts`)
   - Endpoints REST pour l'accès aux PDFs
   - Gestion des autorisations administrateur
   - Optimisations de performance avec cache

### Endpoints API

#### `GET /admin/factures/:id/pdf`
- **Description** : Récupère le PDF d'une facture (génère ou redirige)
- **Comportement** :
  - Si PDF existe sur S3 → Redirige vers URL signée
  - Sinon → Génère nouveau PDF et le retourne directement
- **Réponse** : Redirection 302 ou fichier PDF direct

#### `GET /admin/factures/:id/download`
- **Description** : Téléchargement direct du PDF
- **Comportement** :
  - Télécharge depuis S3 si disponible
  - Génère à la demande si nécessaire
  - Upload en arrière-plan pour optimisation future
- **Headers** :
  ```
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="Facture_XXXX.pdf"
  Content-Length: [taille]
  Cache-Control: private, max-age=3600
  ```

## 🎨 Template PDF

### Structure du Document

1. **En-tête**
   - Logo entreprise (si disponible dans `assets/logo.png`)
   - Titre "FACTURE" stylisé
   - Numéro de facture et dates d'émission/échéance

2. **Informations Entreprise**
   - Nom : STAKA LIVRES
   - Adresse complète
   - Coordonnées (téléphone, email)
   - SIRET

3. **Informations Client**
   - Nom et prénom
   - Email
   - Adresse (si disponible)

4. **Détails du Projet**
   - Titre du projet
   - Description détaillée

5. **Tableau des Éléments**
   - Description du service
   - Quantité (1)
   - Prix unitaire HT
   - Montant TTC

6. **Zone Totaux**
   - Total HT
   - TVA (20%)
   - **Total TTC**

7. **Pied de Page**
   - Conditions de paiement
   - Mentions légales
   - Informations techniques

### Couleurs et Style

- **Couleur principale** : `#2563eb` (bleu)
- **Couleur texte** : `#1f2937` (gris foncé)
- **Couleur secondaire** : `#6b7280` (gris moyen)
- **Bordures** : `#e5e7eb` (gris clair)
- **Arrière-plans** : `#f3f4f6`, `#f9fafb`

## 🔧 Configuration AWS S3

### Variables d'Environnement

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-west-3
AWS_S3_BUCKET=staka-livres-files
```

### Structure des Fichiers S3

```
bucket/
├── invoices/
│   ├── {invoiceId}.pdf
│   ├── {invoiceId}.pdf
│   └── ...
```

### Paramètres de Sécurité

- **ACL** : `private` (accès restreint)
- **Metadata** :
  - `invoice-id` : ID de la facture
  - `invoice-number` : Numéro de facture
  - `generated-at` : Timestamp de génération
- **URLs signées** : Expiration 7 jours
- **Content-Disposition** : `attachment; filename="Facture_{number}.pdf"`

## 🚀 Utilisation

### Génération Manuelle

```typescript
import { PdfService, InvoiceData } from '../services/pdf';
import { S3InvoiceService } from '../services/s3InvoiceService';

// Préparer les données
const invoiceData: InvoiceData = {
  id: "invoice-uuid",
  number: "FACT-2025-001",
  amount: 12000, // 120€ en centimes
  taxAmount: 2000, // 20€ en centimes
  issuedAt: new Date(),
  dueAt: new Date(),
  commande: {
    id: "commande-uuid",
    titre: "Correction de manuscrit",
    description: "Correction orthographique...",
    user: {
      id: "user-uuid",
      prenom: "Jean",
      nom: "Dupont",
      email: "jean@example.com",
      adresse: "123 Rue de la Paix\n75001 Paris"
    }
  }
};

// Générer le PDF
const pdfBuffer = await PdfService.buildInvoicePdf(invoiceData);

// Uploader vers S3
const s3Url = await S3InvoiceService.uploadInvoicePdf(
  pdfBuffer, 
  invoiceData.id, 
  invoiceData.number
);

// Générer URL signée
const signedUrl = await S3InvoiceService.generateSignedUrl(
  invoiceData.id, 
  invoiceData.number
);
```

### Téléchargement Frontend

```typescript
// Via endpoint direct
const downloadInvoice = async (invoiceId: string) => {
  const response = await fetch(`/admin/factures/${invoiceId}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facture_${invoiceNumber}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};
```

## 🐳 Tests d'Intégration S3 en Docker - Production 2025

### Ports et Services

| Service | Port | Usage |
|---------|------|-------|
| **Backend API** | 3000 | Tests PDF + S3 + API |
| **Frontend UI** | 3001 | Interface administration |
| **Vite Dev** | 5173 | Développement hot-reload |

### Configuration Docker Autonome

Le système de tests S3 fonctionne **exclusivement dans Docker** avec auto-skip si les credentials AWS ne sont pas fournis :

```typescript
// Vérification automatique des credentials
const hasAwsCredentials = !!(
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY && 
  process.env.AWS_S3_BUCKET
);

const describeS3Tests = hasAwsCredentials ? describe : describe.skip;

if (!hasAwsCredentials) {
  console.warn("⚠️ [S3 TESTS] AWS credentials not provided, skipping real S3 integration tests");
}
```

### Commandes Docker-only

```bash
# Build TypeScript dans conteneur (port 3000)
docker compose run --rm app npm run build:ci

# Tests unitaires dans conteneur
docker compose run --rm app npm run test:ci

# Tests S3 avec vraies credentials AWS
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
docker compose run --rm app npm run test:s3:ci

# Audit sécurité production
docker compose run --rm app npm audit --production

# Test complet API PDF (après démarrage)
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/admin/factures/1/download \
     --output facture_test.pdf
```

### Variables d'environnement Docker

**docker-compose.yml - Service `app`:**
```yaml
app:
  environment:
    - NODE_ENV=test
    - AWS_S3_BUCKET=staka-invoices
    - AWS_REGION=eu-west-3
    # AWS credentials passés via ligne de commande pour tests S3
  profiles:
    - test
```

### Validation Fichier PDF Généré

```bash
# Vérifier que le PDF est valide
file facture_test.pdf  # → facture_test.pdf: PDF document, version 1.7

# Vérifier la taille (doit être > 1KB)
ls -lh facture_test.pdf  # → 2.7K facture_test.pdf

# Vérifier l'objet S3 (TTL ~30 jours)
aws s3 ls s3://staka-invoices/invoices/ --region eu-west-3
```

## 🧪 Tests - Version Production 2025

### Tests d'Intégration Réels (NOUVEAUX)

#### S3InvoiceService Integration (`src/__tests__/integration/s3InvoiceService.integration.test.ts`)

- ✅ **Workflow complet** : Génération PDF → Upload S3 → URL signée → Téléchargement
- ✅ **Vraies opérations S3** : Upload/download avec bucket `staka-invoices`
- ✅ **Nettoyage automatique** : Suppression des objets de test après chaque test
- ✅ **Gestion concurrence** : Tests d'uploads simultanés
- ✅ **Intégrité données** : Vérification checksums MD5
- ✅ **ACL privé** : Validation sécurité (403 sur URLs publiques)
- ✅ **TTL 30 jours** : Vérification expiration URLs signées
- ✅ **Performance** : < 30s pour workflows complets

**Variables d'environnement requises :**
```bash
AWS_ACCESS_KEY_ID=your_real_access_key
AWS_SECRET_ACCESS_KEY=your_real_secret_key
AWS_S3_BUCKET=staka-invoices
AWS_REGION=eu-west-3
```

### Tests Unitaires

#### PdfService (`src/__tests__/services/pdfService.test.ts`)

- ✅ Génération PDF avec données valides
- ✅ Inclusion du numéro de facture
- ✅ Informations entreprise présentes
- ✅ Informations client correctes
- ✅ Détails du projet inclus
- ✅ Montants corrects (HT, TVA, TTC)
- ✅ Gestion des champs optionnels
- ✅ Format date français (DD/MM/YYYY)
- ✅ Mentions légales incluses
- ✅ Gestion d'erreurs

#### S3InvoiceService (`src/__tests__/services/s3InvoiceService.test.ts`)

- ✅ Upload PDF vers S3
- ✅ Génération URLs signées
- ✅ Téléchargement depuis S3
- ✅ Vérification existence fichier
- ✅ Mode simulation (sans AWS)
- ✅ Gestion d'erreurs S3
- ✅ Configuration metadata
- ✅ Paramètres de sécurité

#### Routes Admin (`src/__tests__/routes/adminFactures.test.ts`)

- ✅ Téléchargement PDF existant
- ✅ Génération PDF à la demande
- ✅ Autorisation admin requise
- ✅ Gestion erreurs 404
- ✅ Headers PDF corrects
- ✅ Cache headers
- ✅ Redirection URLs signées

### Commandes de Test

```bash
# Tests d'intégration S3 réels (PRODUCTION)
npm test -- src/__tests__/integration/s3InvoiceService.integration.test.ts

# Tests unitaires services PDF
npm test -- --testPathPattern="pdfService"

# Tests routes admin
npm test -- --testPathPattern="adminFactures"

# Tests complets avec couverture ≥ 90%
npm run test:coverage

# Validation TypeScript production
npm run build
```

## 🔧 Optimisations de Performance

### Cache et Stockage

1. **Cache S3** : Les PDFs sont stockés de manière persistante
2. **URLs signées** : Régénérées à chaque accès (7 jours de validité)
3. **Upload arrière-plan** : Pour les nouveaux PDFs lors du téléchargement direct
4. **Headers cache** : `Cache-Control: private, max-age=3600`

### Stratégies de Génération

1. **Génération à la demande** : PDF créé seulement si nécessaire
2. **Vérification existence** : Check S3 avant génération
3. **Background upload** : Upload asynchrone après envoi direct
4. **Fallback intelligent** : Mode simulation si S3 indisponible

## 🚨 Gestion d'Erreurs

### Codes d'Erreur

- **404** : Facture non trouvée
- **401** : Token manquant ou invalide
- **403** : Permissions insuffisantes (non-admin)
- **500** : Erreur génération PDF ou S3

### Logs et Monitoring

```typescript
// Logs de génération
console.log(`🎯 [PDF] Génération PDF pour facture ${invoiceNumber}`);
console.log(`✅ [PDF] PDF généré: ${pdfBuffer.length} bytes`);

// Logs S3
console.log(`📤 [S3] Upload facture vers S3: ${key}`);
console.log(`✅ [S3] Facture uploadée: ${fileUrl}`);
console.log(`🔗 [S3] URL signée générée (expire dans 7 jours)`);

// Logs d'erreur
console.error(`❌ [PDF] Erreur génération PDF:`, error);
console.error(`❌ [S3] Erreur upload facture:`, error);
```

### Mode Simulation

Quand AWS S3 n'est pas configuré :
- PDFs générés mais non stockés
- URLs mockées retournées
- Logs explicites du mode simulation
- Fonctionnalité complète maintenue

## 📊 Métriques et Monitoring

### Performance

- **Génération PDF** : ~3-5 secondes (selon complexité)
- **Upload S3** : ~1-2 secondes (selon taille réseau)
- **Téléchargement** : ~500ms (depuis S3)
- **Taille moyenne** : ~3-5 KB par PDF

### Capacités

- **Fichier PDF** : Format A4 portrait standard
- **Metadata** : Titre, auteur, sujet inclus
- **Compression** : Optimisation PDFKit automatique
- **Compatibilité** : Toutes les visionneuses PDF modernes

## 🔐 Sécurité

### Contrôles d'Accès

1. **Authentification JWT** : Token valide requis
2. **Autorisation RBAC** : Rôle ADMIN obligatoire
3. **Validation UUID** : IDs de facture validés
4. **URLs privées** : Pas d'accès direct aux fichiers S3

### Protection Données

1. **ACL privé** : Fichiers S3 non publics
2. **URLs temporaires** : Expiration 7 jours
3. **Metadata sécurisée** : Informations d'audit incluses
4. **Headers sécurisés** : Content-Type strict

## 📝 Troubleshooting

### Problèmes Courants

1. **PDF vide ou corrompu**
   - Vérifier les données d'entrée
   - Valider le format InvoiceData
   - Contrôler les logs de génération

2. **Erreur S3 Upload**
   - Vérifier les credentials AWS
   - Contrôler les permissions bucket
   - Valider la configuration région

3. **Téléchargement échoue**
   - Vérifier l'authentification
   - Contrôler les rôles utilisateur
   - Valider l'ID de facture

### Commandes de Debug

```bash
# Vérifier la configuration S3
echo $AWS_ACCESS_KEY_ID
echo $AWS_S3_BUCKET

# Tester la génération PDF locale
npm test -- --testNamePattern="buildInvoicePdf"

# Logs des controllers
grep "Admin Factures" logs/app.log
```

## 🎯 Bonnes Pratiques

### Développement

1. **Tests first** : Écrire les tests avant l'implémentation
2. **Types stricts** : Utiliser TypeScript pour la sécurité
3. **Logs détaillés** : Tracer toutes les opérations importantes
4. **Gestion d'erreurs** : Captures complètes avec contexte

### Production

1. **Monitoring S3** : Surveiller les coûts et performances
2. **Rotation URLs** : Les URLs signées expirent automatiquement
3. **Backup** : Les PDFs sont persistants sur S3
4. **Audit** : Toutes les générations sont loggées

---

## 📚 Ressources

- [Documentation PDFKit](http://pdfkit.org/)
- [AWS S3 SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Guide Backend API](README-backend.md)
- [Guide Facturation Stripe](BILLING_AND_INVOICES.md)

---

*Guide mis à jour le 13 juillet 2025 - Version 1.0*