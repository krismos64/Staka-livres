# 🧾 Système de Facturation Automatique - Guide Complet

## 📋 **Vue d'ensemble**

Le système de facturation automatique génère, stocke et envoie des factures PDF lors des paiements Stripe réussis. Il s'intègre parfaitement avec le webhook existant pour un processus entièrement automatisé.

## 🏗️ **Architecture**

```
Webhook Stripe → Mise à jour Commande → Génération PDF → Upload S3 → Envoi Email
```

### Composants

1. **Modèle Prisma Invoice** - Base de données
2. **InvoiceService** - Génération PDF et upload
3. **MailerService** - Envoi d'emails
4. **Webhook Integration** - Déclenchement automatique

## 🗄️ **Modèle de Données**

### Schema Prisma

```prisma
model Invoice {
  id         String   @id @default(uuid())
  commande   Commande @relation(fields: [commandeId], references: [id], onDelete: Cascade)
  commandeId String
  amount     Int      // Montant en centimes
  pdfUrl     String   // URL du PDF sur S3
  createdAt  DateTime @default(now())

  @@map("invoices")
}

model Commande {
  // ... champs existants
  amount          Int?           // Montant en centimes
  invoices        Invoice[]      // Relation vers les factures
}
```

## ⚙️ **Configuration Environnement**

### Variables d'environnement requises

```env
# AWS S3 pour le stockage des factures
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="eu-west-3"
S3_BUCKET_NAME="staka-livres-invoices"

# SendGrid pour l'envoi d'emails
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
FROM_EMAIL="noreply@staka-livres.com"
FROM_NAME="Staka Livres"
```

### Permissions S3 requises

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl", "s3:GetObject"],
      "Resource": "arn:aws:s3:::staka-livres-invoices/*"
    }
  ]
}
```

## 🔄 **Processus de Facturation**

### 1. Déclenchement automatique

```typescript
// Dans le webhook checkout.session.completed
const commandeForInvoice = {
  ...updatedCommande,
  amount: session.amount_total, // Montant depuis Stripe
};

await InvoiceService.processInvoiceForCommande(commandeForInvoice);
```

### 2. Génération PDF

Le service génère un PDF professionnel contenant :

- **En-tête** : Logo et informations entreprise
- **Informations client** : Nom, email
- **Détails commande** : Description, montant
- **Footer** : Mentions légales, date de traitement

### 3. Upload S3

- Nom de fichier : `invoices/INV-{ID_COURT}-{TIMESTAMP}.pdf`
- URL publique générée automatiquement
- Gestion d'erreurs avec fallback

### 4. Envoi Email

Template HTML responsive avec :

- Message personnalisé
- Lien de téléchargement sécurisé
- Design professionnel

## 🌐 **API Endpoints pour Factures**

### Routes disponibles

Le système expose trois endpoints REST pour consulter et télécharger les factures générées :

#### 📋 `GET /invoices` - Liste des factures

```http
GET /invoices?page=1&limit=10
Authorization: Bearer JWT_TOKEN

Response: 200
{
  "invoices": [
    {
      "id": "invoice-123",
      "amount": 59900,
      "amountFormatted": "599.00 €",
      "createdAt": "2024-01-15T10:30:00Z",
      "pdfUrl": "https://s3.amazonaws.com/bucket/invoice.pdf",
      "commande": {
        "id": "cmd-456",
        "titre": "Correction Mémoire",
        "statut": "TERMINE"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

#### 📄 `GET /invoices/:id` - Détails d'une facture

```http
GET /invoices/invoice-123
Authorization: Bearer JWT_TOKEN

Response: 200
{
  "id": "invoice-123",
  "amount": 59900,
  "amountFormatted": "599.00 €",
  "commande": {
    "titre": "Correction Mémoire",
    "description": "Détails complets...",
    "user": {
      "prenom": "Jean",
      "nom": "Dupont"
    }
  }
}
```

#### 📥 `GET /invoices/:id/download` - Téléchargement PDF

```http
GET /invoices/invoice-123/download
Authorization: Bearer JWT_TOKEN

Response: 200 (PDF stream)
Content-Type: application/pdf
Content-Disposition: attachment; filename="facture-XXX.pdf"
```

### Sécurité des endpoints

- **Authentification JWT** : Token Bearer obligatoire
- **Contrôle d'accès** : Utilisateur ne voit que ses factures
- **Validation des paramètres** : Pagination sécurisée (max 50/page)
- **Streaming sécurisé** : Téléchargement direct depuis S3 ou fallback URL

### Codes d'erreur

| Code  | Description                                   |
| ----- | --------------------------------------------- |
| `401` | Token JWT manquant ou invalide                |
| `403` | Accès refusé (facture d'un autre utilisateur) |
| `404` | Facture non trouvée                           |
| `500` | Erreur serveur (base de données, S3)          |

## 🧪 **Tests**

### Exécution des tests

```bash
# Tests du service de facturation
npm test -- tests/unit/invoiceService.test.ts

# Tests d'intégration webhook + facturation
npm test -- tests/unit/webhookWithInvoice.test.ts

# Tests des endpoints REST (NOUVEAU)
npm test -- tests/unit/invoiceRoutes.test.ts
```

### Couverture des tests

#### Service de facturation

- ✅ Génération PDF avec données valides
- ✅ Upload S3 et gestion d'erreurs
- ✅ Envoi d'emails avec templates
- ✅ Intégration webhook complète
- ✅ Gestion des erreurs sans bloquer webhook

#### Endpoints REST (Nouveaux)

- ✅ **Liste paginée** : Pagination, limite, tri chronologique
- ✅ **Détails facture** : Données complètes, contrôle d'accès
- ✅ **Téléchargement** : Streaming S3, fallback URL, headers corrects
- ✅ **Authentification** : JWT validation, erreurs 401/403
- ✅ **Sécurité** : Isolation des données utilisateur
- ✅ **Robustesse** : Gestion d'erreurs base de données et S3

#### Résultats des tests routes

```
✓ 15/15 tests passés - Invoice Routes Tests
  GET /invoices
    ✓ Liste avec pagination (57ms)
    ✓ Pagination correcte (8ms)
    ✓ Limite max 50 par page (8ms)
    ✓ 401 sans authentification (2ms)
    ✓ Gestion erreurs DB (28ms)

  GET /invoices/:id
    ✓ Détails complets (7ms)
    ✓ 404 facture inexistante (6ms)
    ✓ 403 accès non autorisé (5ms)

  GET /invoices/:id/download
    ✓ Téléchargement valide (9ms)
    ✓ Redirection sans S3 (7ms)
    ✓ 404 facture inexistante (5ms)
    ✓ 403 accès non autorisé (10ms)
    ✓ Fallback erreur S3 (9ms)
```

## 🚀 **Déploiement**

### 1. Configuration de la base de données

```bash
# Appliquer le schéma
npx prisma db push

# Ou créer une migration
npx prisma migrate dev --name add_invoice_system
```

### 2. Installation des dépendances

```bash
npm install pdfkit @types/pdfkit @aws-sdk/client-s3 @sendgrid/mail
```

### 3. Configuration S3

1. Créer un bucket S3 : `staka-livres-invoices`
2. Configurer les permissions CORS si nécessaire
3. Créer un utilisateur IAM avec les permissions S3

### 4. Configuration SendGrid

1. Créer un compte SendGrid
2. Générer une clé API
3. Vérifier le domaine d'envoi

## 🐛 **Dépannage**

### Erreurs communes

#### "S3 upload failed"

- Vérifier les clés AWS
- Contrôler les permissions du bucket
- Valider la région AWS

#### "Email failed"

- Vérifier la clé SendGrid
- Contrôler la vérification du domaine
- Tester avec un email différent

#### "PDF generation failed"

- Vérifier les données de la commande
- Contrôler que l'utilisateur est inclus
- Valider le montant (non null)

### Mode debug

```typescript
// Activer les logs détaillés
console.log("🎯 [Invoice] Données commande:", commande);
console.log("📤 [Invoice] URL générée:", pdfUrl);
```

### Fallbacks

- **S3 indisponible** : URL mock générée
- **SendGrid indisponible** : Simulation d'envoi
- **PDF échec** : Erreur loggée, webhook continue

## 📊 **Monitoring**

### Métriques importantes

```typescript
// À implémenter selon vos besoins
- Nombre de factures générées/jour
- Taux d'échec génération PDF
- Taux d'échec upload S3
- Taux d'échec envoi email
```

### Logs à surveiller

```bash
# Succès
"✅ [Invoice] Processus terminé pour commande"

# Erreurs critiques
"❌ [Invoice] Erreur lors du traitement"
"❌ [Stripe Webhook] Erreur lors de la génération de facture"
```

## 🔐 **Sécurité**

### Bonnes pratiques

1. **Clés AWS** : Utiliser IAM avec permissions minimales
2. **URLs PDF** : Considérer des URLs signées pour plus de sécurité
3. **Validation** : Vérifier les données avant génération
4. **Logs** : Ne pas logger d'informations sensibles

### Accès aux factures

Les factures sont accessibles via :

- URL S3 publique (actuellement)
- Email client automatique
- Interface admin (à implémenter)

## 🚀 **Évolutions futures**

### Améliorations possibles

1. **URLs signées S3** pour plus de sécurité
2. **Templates PDF personnalisables**
3. **Support multi-langues**
4. **Historique des envois d'emails**
5. **Intégration comptabilité**
6. **Factures récurrentes**

### Architecture avancée

```typescript
// Service de templates
interface InvoiceTemplate {
  generatePDF(data: InvoiceData): Promise<Buffer>;
  getEmailTemplate(lang: string): EmailTemplate;
}

// Service de stockage abstrait
interface StorageService {
  upload(buffer: Buffer, filename: string): Promise<string>;
  getSignedUrl(filename: string): Promise<string>;
}
```

## 📞 **Support**

Pour toute question ou problème :

1. Consulter les logs détaillés
2. Vérifier la configuration des variables d'environnement
3. Tester les services indépendamment
4. Consulter la documentation AWS/SendGrid

---

**Note** : Ce système est conçu pour être robuste et ne jamais faire échouer le webhook Stripe, garantissant que les paiements sont toujours traités même en cas de problème de facturation.
