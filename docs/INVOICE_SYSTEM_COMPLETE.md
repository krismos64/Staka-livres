# 🧾 Système de Facturation Complet - Guide Unifié 2025

> Guide complet unifié pour la facturation Staka Livres : gestion des factures, génération PDF avec pdf-lib, stockage S3, et intégration Stripe.
> **Dernière mise à jour :** 15 juillet 2025

## 📋 Vue d'ensemble

Le système de facturation de Staka Livres est une solution complète et moderne qui intègre :

- **Facturation automatique** lors des paiements Stripe réussis
- **Génération PDF professionnelle** avec pdf-lib v1.17.1
- **Stockage sécurisé S3** avec URLs signées (TTL 30 jours)
- **Interface d'administration** complète (8 endpoints dédiés)
- **API REST optimisée** pour les opérations CRUD
- **Tests d'intégration** complets (1756+ lignes validées)

**🎯 Nouveautés 2025 :**
- Architecture modernisée avec pdf-lib (remplace PDFKit)
- Interface admin complète avec 8 endpoints factures
- 284 lignes de hooks React Query spécialisés
- Mode mock intelligent pour développement
- Coverage 87%+ avec tests production

---

## 🏗️ Architecture Technique

### Workflow Global
```
Paiement Stripe → Webhook → Validation Commande → PDF Generation → S3 Upload → Email Client
     ↓              ↓            ↓                ↓              ↓           ↓
   Event        Validation     InvoiceService    pdf-lib      AWS S3    EmailQueue
   Handler      Commande      + PdfService      Template     Upload     + Templates
                              + Notifications
```

### Services Principaux

#### 1. InvoiceService (`/src/services/invoiceService.ts`) - 115 lignes
```typescript
export class InvoiceService {
  // Génération PDF complète avec pdf-lib
  static async generateInvoicePDF(commande: CommandeWithUser): Promise<Buffer>;
  
  // Upload S3 sécurisé avec fallback mock
  static async uploadInvoicePdf(pdfBuffer: Buffer, commandeId: string): Promise<string>;
  
  // Processus complet intégré (webhook → PDF → S3 → email)
  static async processInvoiceForCommande(commande: CommandeWithUser): Promise<void>;
}
```

#### 2. PdfService (`/src/services/pdf.ts`) 
- **Template A4 professionnel** avec design moderne Staka Livres
- **Utilise pdf-lib v1.17.1** (non PDFKit comme documenté précédemment)
- **Polices StandardFonts** avec couleurs cohérentes
- **Gestion logos** et mise en page automatique

#### 3. S3InvoiceService (`/src/services/s3InvoiceService.ts`)
- **Upload sécurisé** vers bucket `staka-livres-files`
- **URLs signées 30 jours** pour téléchargement sécurisé
- **Mode simulation** pour développement local
- **Metadata complète** pour audit et monitoring

---

## 🗃️ Modèle de Données

### Schema Prisma (Invoice)
```prisma
model Invoice {
  id         String        @id @default(uuid())
  commandeId String
  number     String        @unique @db.VarChar(50)
  amount     Int           // Montant en centimes
  taxAmount  Int           @default(0)
  pdfUrl     String        @db.VarChar(500)
  status     InvoiceStatus @default(GENERATED)
  issuedAt   DateTime?
  dueAt      DateTime?
  paidAt     DateTime?
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
  commande   Commande      @relation(fields: [commandeId], references: [id], onDelete: Cascade)

  @@map("invoices")
}

enum InvoiceStatus {
  GENERATED   // Générée automatiquement
  SENT        // Envoyée par email
  PAID        // Payée (webhook confirmé)
  OVERDUE     // En retard
  CANCELLED   // Annulée
}
```

---

## 🔧 API Endpoints Administration

### Routes Admin (`/admin/factures`) - 8 Endpoints

| Méthode  | Endpoint                       | Description                    | Implémentation |
|----------|--------------------------------|--------------------------------|----------------|
| `GET`    | `/admin/factures`              | Liste paginée + filtres + tri  | ✅ 531 lignes  |
| `GET`    | `/admin/factures/stats`        | Statistiques globales          | ✅ Complete    |
| `GET`    | `/admin/factures/:id`          | Détails facture spécifique     | ✅ Complete    |
| `PUT`    | `/admin/factures/:id`          | Mise à jour statut             | ✅ Complete    |
| `DELETE` | `/admin/factures/:id`          | Suppression facture            | ✅ Complete    |
| `POST`   | `/admin/factures/:id/reminder` | Envoi rappel email             | ✅ Complete    |
| `GET`    | `/admin/factures/:id/pdf`      | Téléchargement PDF             | ✅ Complete    |
| `GET`    | `/admin/factures/:id/download` | Téléchargement direct PDF     | ✅ Complete    |

### Endpoint PDF Spécialisé

#### `GET /admin/factures/:id/pdf`
- **Si PDF existe sur S3** → Redirection 302 vers URL signée
- **Sinon** → Génération PDF à la demande + retour direct
- **Headers optimisés** : `Cache-Control: private, max-age=3600`

#### `GET /admin/factures/:id/download`  
```typescript
// Headers de téléchargement
Content-Type: application/pdf
Content-Disposition: attachment; filename="Facture_XXXX.pdf"
Content-Length: [taille]
Cache-Control: private, max-age=3600
```

### Fonctionnalités Avancées

**Recherche Multi-critères :**
```typescript
where.OR = [
  { number: { contains: search } },
  { commande: { titre: { contains: search } } },
  { commande: { user: { email: { contains: search } } } }
];
```

**Statistiques Temps Réel :**
```typescript
const stats = {
  total: totalInvoices,
  montantTotal: montantTotalCentimes,
  montantTotalFormate: "X,XXX.XX €",
  payees: paidCount,
  enAttente: pendingCount,
  echues: overdueCount
};
```

---

## 🎨 Template PDF avec pdf-lib

### Structure du Document A4

1. **En-tête Professionnel**
   - Logo STAKA LIVRES (si `assets/logo.png` disponible)
   - Titre "FACTURE" stylisé
   - Numéro de facture et dates (émission/échéance)

2. **Informations Société**
   - Nom : STAKA LIVRES
   - Adresse complète configurée
   - SIRET et coordonnées

3. **Détails Client**
   - Nom, prénom, email
   - Adresse si disponible

4. **Tableau Services**
   - Description du projet
   - Prix unitaire HT / Quantité / Total TTC

5. **Zone Totaux**
   - Total HT / TVA 20% / **Total TTC**

### Couleurs et Design
- **Couleur principale** : `#2563eb` (bleu corporate)
- **Texte** : `#1f2937` (gris foncé)
- **Bordures** : `#e5e7eb` (gris clair)
- **Arrière-plans** : `#f3f4f6`, `#f9fafb`

### Génération Moderne avec pdf-lib
```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Création document A4
const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([595, 842]); // Format A4 portrait

// Police standard intégrée
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
```

---

## 🖥️ Frontend & Hooks React Query

### Architecture Frontend Modernisée
```
BillingPage (Orchestrateur - 1177 lignes)
     ├── CurrentInvoiceCard (Facture courante)
     ├── InvoiceHistoryCard (Historique paginé)
     ├── PaymentMethodsCard (Cartes Stripe)
     ├── AnnualSummaryCard (Stats VIP)
     ├── InvoiceDetailsModal (Détails)
     ├── PaymentModal (Processus paiement)
     └── SupportCard (Contact)
```

### Hooks Spécialisés (284 lignes total)

#### `useInvoices.ts` (53 lignes)
```typescript
// Hook principal - Liste paginée optimisée
export function useInvoices(page = 1, limit = 10) {
  return useQuery<InvoicesResponse, Error>({
    queryKey: ["invoices", page, limit],
    queryFn: () => fetchInvoices(page, limit),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
}

// Hook détails facture
export function useInvoice(id: string) {
  return useQuery<InvoiceAPI, Error>({
    queryKey: ["invoice", id],
    queryFn: () => fetchInvoice(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  });
}
```

#### `useAdminFactures.ts` (231 lignes)
```typescript
// Hook admin avec filtres avancés
export function useAdminFactures(params: AdminFacturesParams) {
  return useQuery({
    queryKey: ["admin-factures", params],
    queryFn: () => adminAPI.getFactures(
      params.page, params.limit, params.status, 
      params.search, params.sortBy, params.sortOrder
    ),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    retry: 2
  });
}

// Mutations optimisées
export function useDeleteFacture();     // Suppression + invalidation
export function useSendReminder();      // Rappel email
export function useUpdateFactureStatus(); // Changement statut
export function useDownloadFacture();   // Téléchargement PDF
```

### Interface Admin Complète (`AdminFactures`) - 1177 lignes
- **Tri dynamique** par number, amount, status, createdAt, dueAt, paidAt
- **Filtres avancés** par statut et recherche multi-critères
- **Actions bulk** : suppression multiple, envoi rappels
- **Dashboard stats** temps réel avec métriques KPI

---

## 🔄 Intégration Stripe & Webhooks

### Webhook Production Ready
```typescript
// Architecture webhook robuste
✅ Validation signature Stripe cryptographique
✅ Mode mock développement sans clés Stripe
✅ Facturation automatique : PDF + S3 + Email + Notifications
✅ Gestion d'erreurs avec logs structurés
✅ Tests 1756+ lignes validés

// Événements gérés
1. `checkout.session.completed` → Paiement réussi + Facture auto + Notifications
2. `payment_intent.payment_failed` → Échec paiement + Log
```

### Processus Paiement Intégré
1. **Sélection Service** → Redirection Stripe Checkout
2. **Paiement Réussi** → Webhook déclenché automatiquement  
3. **Facture PDF Générée** → pdf-lib + upload S3 + email + notifications
4. **UI Synchronisée** → `useInvalidateInvoices()` rafraîchit frontend
5. **Téléchargement** → PDF disponible immédiatement via URL signée

### Flux Webhook → Invoice → Notification

```typescript
// Dans webhook.ts - Traitement checkout.session.completed
case "checkout.session.completed": {
  const session = event.data.object;
  
  // 1. Mise à jour commande
  await prisma.commande.update({
    where: { stripeSessionId: session.id },
    data: { 
      statut: "PAYE",
      paidAt: new Date(),
      amount: session.amount_total
    }
  });
  
  // 2. Génération facture automatique
  await InvoiceService.processInvoiceForCommande(commande);
  
  // 3. Notifications automatiques
  await notifyAdminNewPayment(customerName, amount, commandeTitle);
  await notifyPaymentSuccess(commande.user.email, commande.titre);
  
  break;
}
```

---

## 🔧 Configuration & Déploiement

### Variables d'Environnement
```bash
# Stripe Production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 Storage PDF
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-3
AWS_S3_BUCKET=staka-livres-files

# Configuration PDF
PDF_COMPANY_INFO=... # Données entreprise
S3_SIGNED_URL_TTL=2592000 # 30 jours en secondes

# Database
DATABASE_URL=mysql://...

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_USER=...
SMTP_PASS=...
```

### Configuration S3

**Structure Bucket :**
```
staka-livres-files/
├── invoices/
│   ├── {invoiceId}.pdf
│   └── ...
```

**Paramètres Sécurité :**
- **ACL** : `private` (accès restreint)
- **URLs signées** : Expiration 30 jours
- **Metadata** : `invoice-id`, `invoice-number`, `generated-at`

### Mode Développement Mock
```typescript
// Détection automatique
const isDevelopmentMock = 
  !process.env.AWS_ACCESS_KEY_ID || 
  process.env.AWS_ACCESS_KEY_ID.startsWith('test-');

if (isDevelopmentMock) {
  console.log("🚧 [S3] Mode développement - Mock activé");
  // URLs mockées + PDFs non stockés
} else {
  console.log("☁️ [S3] Mode production - AWS S3 activé");
}
```

---

## 🧪 Tests Production 2025

### Architecture Tests (1756+ lignes)

#### Tests d'Intégration S3 Réels
**`s3InvoiceService.integration.test.ts` :**
- ✅ **Workflow complet** : PDF → Upload S3 → URL signée → Download
- ✅ **Vraies opérations S3** avec bucket `staka-livres-files`
- ✅ **Nettoyage automatique** après chaque test
- ✅ **Tests concurrence** uploads simultanés
- ✅ **Vérification intégrité** checksums MD5
- ✅ **Sécurité ACL** validation (403 sur URLs publiques)
- ✅ **TTL 30 jours** vérification expiration

#### Tests Unitaires Services
**PdfService Tests :**
- Génération PDF avec données valides
- Inclusion numéro facture et informations
- Format date français (DD/MM/YYYY)
- Gestion champs optionnels et erreurs

**InvoiceService Tests :**
- Processus complet webhook → PDF → S3 → email
- Fallback mock développement
- Gestion erreurs robuste

#### Tests Routes Admin
- Téléchargement PDF existant/génération demande
- Autorisation admin obligatoire
- Headers PDF corrects + cache
- Gestion erreurs 404/403

### Commandes Tests
```bash
# Tests intégration S3 réels
docker compose run --rm app npm run test:s3

# Tests unitaires complets
docker compose run --rm app npm run test:ci

# Coverage ≥ 87%
docker compose run --rm app npm run test:coverage

# Validation TypeScript production
docker compose run --rm app npm run build
```

### Variables Tests Docker
```bash
# Tests S3 avec vraies credentials
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
docker compose run --rm app npm run test:s3:ci
```

---

## 📊 Performance & Monitoring

### Métriques Performance
- **Génération PDF** : ~3-5 secondes (pdf-lib optimisé)
- **Upload S3** : ~1-2 secondes (selon réseau)
- **Téléchargement** : ~500ms (depuis S3 cache)
- **Taille moyenne PDF** : ~3-5 KB
- **Webhook processing** : < 1 seconde complet

### Coverage et Qualité
- ✅ **Coverage 87%+** système facturation
- ✅ **1756+ lignes tests** tous niveaux validés
- ✅ **CI/CD intégré** avec validation continue
- ✅ **Performance validée** production

### Logs Structurés
```typescript
// Logs PDF
console.log(`🎯 [PDF] Génération PDF pour facture ${invoiceNumber}`);
console.log(`✅ [PDF] PDF généré: ${pdfBuffer.length} bytes`);

// Logs S3
console.log(`📤 [S3] Upload facture vers S3: ${key}`);
console.log(`✅ [S3] URL signée générée (expire 30 jours)`);

// Logs erreurs
console.error(`❌ [PDF] Erreur génération:`, error);
```

---

## 🔐 Sécurité

### Contrôles d'Accès
1. **Authentification JWT** : Token valide requis
2. **Autorisation RBAC** : Rôle ADMIN obligatoire
3. **Validation UUID** : IDs facture validés
4. **URLs privées** : Pas d'accès direct S3

### Protection Données
1. **ACL privé S3** : Fichiers non publics
2. **URLs temporaires** : Expiration 30 jours
3. **Metadata sécurisée** : Informations audit
4. **Headers sécurisés** : Content-Type strict

---

## 🚨 Troubleshooting

### Problèmes Courants

**PDF vide/corrompu :**
- Vérifier données InvoiceData
- Contrôler logs génération pdf-lib
- Valider format entrée

**Erreur S3 Upload :**
- Vérifier credentials AWS_ACCESS_KEY_ID
- Contrôler permissions bucket
- Valider région eu-west-3

**Téléchargement échoue :**
- Vérifier authentification JWT
- Contrôler rôle ADMIN utilisateur
- Valider UUID facture

### Commandes Debug
```bash
# Vérifier config S3
echo $AWS_ACCESS_KEY_ID
echo $AWS_S3_BUCKET

# Test génération PDF locale
npm test -- --testNamePattern="buildInvoicePdf"

# Logs controllers admin
grep "Admin Factures" logs/app.log

# Test API complet
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/admin/factures/1/download \
     --output facture_test.pdf
```

---

## 📚 Résumé Technique 2025

### Métriques Architecture
**Backend (Factures) :**
- ✅ **AdminFactureController** complet avec 8 endpoints
- ✅ **115 lignes** InvoiceService avec PDF + S3 + Email
- ✅ **8 endpoints** admin factures opérationnels
- ✅ **pdf-lib v1.17.1** génération moderne

**Frontend (Client + Admin) :**
- ✅ **1177 lignes** AdminFactures interface React
- ✅ **284 lignes** hooks React Query spécialisés
- ✅ **BillingPage** optimisée avec cache intelligent
- ✅ **Synchronisation** temps réel admin ↔ client

**Production Ready :**
- ✅ **1756+ lignes tests** validation complète
- ✅ **Coverage 87%+** système facturation
- ✅ **S3 intégration** sécurisée avec URLs signées 30 jours
- ✅ **Mode mock** développement intelligent
- ✅ **Monitoring** logs structurés production

Le système de facturation Staka Livres 2025 est **production-ready** avec une architecture moderne, des tests complets, et une documentation exhaustive pour maintenir et faire évoluer efficacement la solution.

---

*Guide unifié mis à jour le 15 juillet 2025 - Consolidation BILLING_AND_INVOICES.md + PDF_INVOICE_GENERATION.md*

---

## 📧 Mise à jour 2025 - Système de notification centralisé

Le système de facturation est maintenant intégré au **système de notification admin centralisé** :

- **Notifications automatiques** : Chaque facture générée déclenche une notification admin
- **Emails centralisés** : Utilisation du système `eventBus` + `adminNotificationEmailListener`
- **Templates uniformisés** : Cohérence avec le système de notification global
- **Queue email** : Traitement asynchrone avec templates Handlebars

### Intégration Webhook → Invoice → Notification

```typescript
// Dans webhook.ts - Traitement paiement réussi
await InvoiceService.processInvoiceForCommande(commande);

// Notifications automatiques
await notifyAdminNewPayment(customerName, amount, commandeTitle);
await notifyPaymentSuccess(commande.user.email, commande.titre);
```

### Système de Queue Email

```typescript
// EmailQueue centralisée avec templates
await emailQueue.add("sendInvoiceEmail", {
  to: customerEmail,
  template: "invoice-generated.hbs",
  variables: {
    customerName: customer.nom,
    invoiceNumber: invoice.number,
    amount: invoice.amount,
    pdfUrl: invoice.pdfUrl,
    subject: `Facture ${invoice.number} - Staka Livres`
  }
});
```

Cette intégration assure une gestion centralisée des notifications pour toutes les actions critiques du système.