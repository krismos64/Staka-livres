# 🎯 Guide Système d'Échantillon Gratuit - Staka Livres

![Production](https://img.shields.io/badge/Status-Production%20Deployed-brightgreen)
![Live](https://img.shields.io/badge/Live-livrestaka.fr-blue)
![API](https://img.shields.io/badge/API-Public%20Endpoint-green)
![Integration](https://img.shields.io/badge/Integration-Complete-brightgreen)

**✨ Version 3 Août 2025 - Production validée et opérationnelle**  
**🌐 Production URL** : [livrestaka.fr](https://livrestaka.fr/) (✅ **TESTÉ LE 3 AOÛT**)  
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

> **Guide technique complet** pour le système d'échantillon gratuit qui permet aux visiteurs de demander une correction gratuite de 10 pages depuis la landing page **déployé en production**.

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Endpoints API](#endpoints-api)
4. [Interface utilisateur](#interface-utilisateur)
5. [Workflow automatisé](#workflow-automatisé)
6. [Templates email](#templates-email)
7. [Tests et validation](#tests-et-validation)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Le système d'échantillon gratuit de Staka Livres permet aux visiteurs de la landing page de demander facilement une correction gratuite de 10 pages pour tester la qualité du service. **Déployé et opérationnel sur [livrestaka.fr](https://livrestaka.fr/)**.

### ✅ Fonctionnalités principales (**CONFIRMÉES EN PRODUCTION 3 AOÛT 2025**)

- **Formulaire public optimisé** : Section "Testez notre expertise gratuitement" intégrée landing page
- **Workflow automatisé complet** : Formulaire → Message messagerie → **Notification admin centralisée** → Email automatique
- **Intégration messagerie** : Messages créés avec **visitorEmail/visitorName** + assignés premier admin
- **Templates email professionnels** : **2 templates** (`visitor-sample-confirmation.hbs` + `admin-message.hbs`)
- **Validation stricte** : Nom/email requis + validation regex + limites caractères (nom: 100, desc: 2000)
- **Upload fichier** : Support **FormData** avec limite 5 Mo + association `MessageAttachment`
- **Audit logging** : **AuditService** complet avec métadonnées et géolocalisation IP
- **Système centralisé** : **EventBus** + **adminNotificationEmailListener** pour emails automatiques

### 🔧 Technologies utilisées (**ARCHITECTURE CONFIRMÉE**)

- **Backend** : Node.js 20.15.1, Express 4.18.2, Prisma 6.10.1, TypeScript 5.8.3
- **Frontend** : React 18.2.0, TypeScript, Fetch API native, FormData pour upload
- **Email** : **Resend 8.1.5** + **emailQueue** + **templates Handlebars** 
- **Messagerie** : Prisma **Message** model avec support **visitorEmail/visitorName**
- **Notifications** : **EventBus centralisé** + **adminNotificationEmailListener**
- **Upload** : **Multer 2.0.1** + **MessageAttachment** + stockage local `/uploads/`
- **Audit** : **AuditService** + **AUDIT_ACTIONS.USER_MESSAGE_SUPPORT_EMAIL_SENT**

---

## 🏗️ Architecture technique

### 📁 Structure des fichiers

```
✅ ARCHITECTURE CONFIRMÉE ET OPÉRATIONNELLE

backend/
├── src/
│   ├── controllers/
│   │   └── publicController.ts          # sendFreeSampleRequest (509 lignes)
│   ├── routes/
│   │   └── public.ts                    # POST /free-sample + upload middleware
│   ├── emails/templates/
│   │   ├── visitor-sample-confirmation.hbs  # Confirmation visiteur
│   │   └── admin-message.hbs               # Email admin centralisé
│   ├── listeners/
│   │   └── adminNotificationEmailListener.ts # Email automatique
│   ├── queues/
│   │   └── emailQueue.ts                   # Traitement asynchrone
│   └── scripts/
│       ├── checkMessages.ts             # Vérification messages
│       └── checkNotifications.ts        # Vérification notifications

frontend/
├── src/
│   └── components/
│       └── landing/
│           └── FreeSample.tsx           # Formulaire complet (375 lignes)
```

### 🗄️ Intégration base de données

Le système utilise les modèles existants :

```prisma
// Message créé automatiquement
model Message {
  id             String @id @default(uuid())
  conversationId String @default(uuid())
  
  // Pour visiteurs non connectés (échantillon gratuit)
  visitorEmail   String? @db.VarChar(255)
  visitorName    String? @db.VarChar(100)
  
  receiverId     String? // Admin assigné
  subject        String  // "🎯 Échantillon gratuit - {nom}"
  content        String  // Détails prospect et projet
  type           MessageType // USER_MESSAGE
  statut         MessageStatut // ENVOYE
  
  createdAt      DateTime @default(now())
  receiver       User? @relation("ReceivedMessages", fields: [receiverId], references: [id])
}

// Notification admin automatique
model Notification {
  id       String @id @default(uuid())
  userId   String // Admin ID
  title    String // "Nouveau message visiteur"
  message  String // "{nom} (échantillon gratuit) vous a envoyé..."
  type     NotificationType // MESSAGE
  isRead   Boolean @default(false)
  
  createdAt DateTime @default(now())
  user     User @relation(fields: [userId], references: [id])
}
```

---

## 🔌 Endpoints API

### 📮 POST /api/public/free-sample

Endpoint public pour traiter les demandes d'échantillon gratuit.

**Aucune authentification requise**

```typescript
// ✅ REQUEST BODY CONFIRMÉ (FormData + JSON support)
{
  "nom": "Jean Dupont",                    // Requis (max 100 chars)
  "email": "jean.dupont@example.com",      // Requis + regex validation
  "telephone": "06 12 34 56 78",           // Optionnel
  "genre": "roman",                        // Optionnel (select options)
  "description": "Description du projet",  // Optionnel (max 2000 chars)
  "fichier": File                          // Optionnel (FormData File, max 5Mo)
}

// Support aussi FormData pour upload fichier
// Content-Type: multipart/form-data (automatique avec FormData)
```

**Réponses :**

```typescript
// ✅ 200 - Succès (CONFIRMÉ EN PRODUCTION)
{
  "success": true,
  "message": "Votre demande d'échantillon gratuit a bien été envoyée ! Nous vous recontacterons sous 48h avec vos 10 pages corrigées gratuitement.",
  "conversationId": "dcae587c-5592-4ede-92f0-e2dea6877197"  // UUID réel
}

// ✅ ACTIONS DÉCLENCHÉES AUTOMATIQUEMENT :
// 1. Message créé dans messagerie admin
// 2. Notification admin via EventBus 
// 3. Email admin via adminNotificationEmailListener
// 4. Email confirmation visiteur via emailQueue
// 5. Audit log avec métadonnées complètes
// 6. Upload fichier si fourni (MessageAttachment)

// 400 - Validation échouée
{
  "error": "Nom et email sont requis",
  "details": "Ces champs sont obligatoires pour traiter votre demande"
}

// 400 - Format email invalide
{
  "error": "Format d'email invalide",
  "details": "Veuillez saisir une adresse email valide"
}

// 500 - Erreur serveur
{
  "error": "Erreur lors de l'envoi de votre demande",
  "message": "Une erreur technique est survenue. Veuillez réessayer."
}
```

### 🔒 Validation et sécurité (✅ IMPLÉMENTATION CONFIRMÉE)

```typescript
// ✅ VALIDATION CÔTÉ SERVEUR (publicController.ts:224-268)

// 1. Validation champs requis AVANT nettoyage
if (!nom || !email) {
  return res.status(400).json({ error: "Nom et email sont requis" });
}

// 2. Nettoyage données avec trim() + toLowerCase()
const cleanData = {
  nom: nom.trim(),
  email: email.trim().toLowerCase(),
  telephone: telephone ? telephone.trim() : '',
  genre: genre ? genre.trim() : '',
  description: description ? description.trim() : '',
  fichier: req.file || null  // Multer File object
};

// 3. Validation APRES nettoyage
if (!cleanData.nom || !cleanData.email) {
  return res.status(400).json({ error: "Ces champs ne peuvent pas \u00eatre vides" });
}

// 4. Validation format email (regex stricte)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(cleanData.email)) {
  return res.status(400).json({ error: "Format d'email invalide" });
}

// 5. Validation longueur des champs
if (cleanData.nom.length > 100) {
  return res.status(400).json({ error: "Nom trop long" });
}

if (cleanData.description && cleanData.description.length > 2000) {
  return res.status(400).json({ error: "Description trop longue" });
}

// 6. Validation fichier (côté frontend : max 5Mo, .doc/.docx/.pdf)
```

---

## 🖥️ Interface utilisateur

### 📄 Composant FreeSample.tsx

**Localisation** : `frontend/src/components/landing/FreeSample.tsx` (**375 lignes**)

**Fonctionnalités confirmées** :
- ✅ Formulaire complet avec validation temps réel (nom/email requis + regex)
- ✅ Appel API réelle `/api/public/free-sample` avec **FormData**
- ✅ Gestion d'états `isSubmitted/isUploading/uploadProgress`
- ✅ Upload de fichier avec **simulation progression** (barre animée)
- ✅ Reset automatique après succès + messages alert() avec emojis
- ✅ Validation côté client : email regex + taille fichier 5Mo max
- ✅ Support formats : `.doc, .docx, .pdf`

```typescript
// ✅ ÉTATS CONFIRMÉS (FreeSample.tsx:4-15)
const [formData, setFormData] = useState({
  nom: "",                          // Input text requis
  email: "",                        // Input email requis + validation
  telephone: "",                    // Input tel optionnel
  genre: "",                        // Select optionnel (roman/nouvelle/essai/etc)
  description: "",                  // Textarea optionnel
  fichier: null as File | null,     // File input avec drag&drop
});

const [uploadProgress, setUploadProgress] = useState(0);    // 0-100%
const [isUploading, setIsUploading] = useState(false);     // Animation progress
const [isSubmitted, setIsSubmitted] = useState(false);     // Submit loading

// ✅ FONCTIONS CLÉS :
// - handleSubmit() : FormData + fetch API
// - handleFileChange() : Validation 5Mo + simulation progress
// - triggerFileInput() : Déclenchement zone drop
```

### 🎨 Design et UX

- **Section landing page** : "Testez notre expertise gratuitement"
- **Design responsive** : **Tailwind CSS** mobile-first + grid `md:grid-cols-2`
- **Validation temps réel** : Email regex + champs requis avec feedback visuel
- **Upload zone** : **Drag & drop** + barre progression animée + prévisualisation nom fichier
- **Messages utilisateur** : **Alert()** avec emojis (🎉 succès / ❌ erreur)
- **Loading states** : Bouton `disabled={isSubmitted}` avec texte "Envoi en cours..."
- **Success stories** : 3 témoignages en cards avec emojis
- **Trust indicators** : "Réponse 48h • Sans engagement • Confidentiel"

---

## 🔄 Workflow automatisé

### 1️⃣ Soumission formulaire (✅ WORKFLOW CONFIRMÉ)

```mermaid
graph TD
    A[Visiteur remplit formulaire] --> B[Validation côté client + FormData]
    B --> C[POST /api/public/free-sample + multer]
    C --> D[Validation serveur + nettoyage trim()]
    D --> E[Recherche premier admin disponible]
    E --> F[Création Message avec visitorEmail/Name]
    F --> F2[Upload fichier + MessageAttachment si fourni]
    F2 --> G[notifyAdminNewMessage via EventBus]
    G --> G2[adminNotificationEmailListener déclenché]
    G2 --> H[Email admin via admin-message.hbs]
    H --> I[Email confirmation visiteur via visitor-sample-confirmation.hbs]
    I --> J[AuditService.logAdminAction avec métadonnées]
    J --> K[Réponse JSON success + conversationId]
```

### 2️⃣ Traitement automatique (✅ ÉTAPES CONFIRMÉES)

1. **Validation données** : Nom/email requis + regex email + limites caractères
2. **Attribution admin** : `prisma.user.findFirst({ role: ADMIN, orderBy: createdAt })`
3. **Message messagerie** : **Message** model avec `visitorEmail/visitorName` + `receiverId`
4. **Upload fichier** : **File** + **MessageAttachment** si `req.file` fourni
5. **Notification centralisée** : `notifyAdminNewMessage()` → **EventBus** → email automatique
6. **Double email** : Admin (`admin-message.hbs`) + Visiteur (`visitor-sample-confirmation.hbs`)
7. **Audit complet** : **AuditService** avec `USER_MESSAGE_SUPPORT_EMAIL_SENT` + métadonnées

### 3️⃣ Suivi et réponse

- **Messagerie admin** : Message avec ID conversation unique
- **Engagement 48h** : Promesse de réponse claire
- **Templates riches** : HTML responsive avec toutes les infos
- **Action requise** : 10 pages à corriger gratuitement

---

## 📧 Templates email

### 📨 Template HTML équipe support

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #16a34a; margin-bottom: 20px;">🎯 Nouvelle demande d'échantillon gratuit</h2>
    
    <!-- Informations prospect -->
    <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #16a34a;">
      <h3 style="margin: 0 0 10px 0; color: #15803d;">👤 Informations du prospect</h3>
      <p style="margin: 5px 0;"><strong>Nom :</strong> Jean Dupont</p>
      <p style="margin: 5px 0;"><strong>Email :</strong> <a href="mailto:jean.dupont@test.com">jean.dupont@test.com</a></p>
      <p style="margin: 5px 0;"><strong>Téléphone :</strong> 06 12 34 56 78</p>
    </div>

    <!-- Détails projet -->
    <div style="margin-bottom: 20px;">
      <h3 style="color: #15803d; margin-bottom: 10px;">📚 Détails du projet</h3>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <p style="margin: 5px 0;"><strong>Genre littéraire :</strong> Roman</p>
        <p style="margin: 5px 0;"><strong>Description du projet :</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 4px; margin-top: 10px;">
          Premier roman de 300 pages sur une histoire d'amour
        </div>
      </div>
    </div>

    <!-- Action requise -->
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
      <h3 style="margin: 0 0 10px 0; color: #d97706;">🎯 Action requise</h3>
      <p style="margin: 0; font-weight: bold;">Le prospect souhaite recevoir 10 pages corrigées gratuitement</p>
      <p style="margin: 5px 0 0 0; color: #059669;">✅ Fichier joint fourni</p>
    </div>

    <!-- Messagerie admin -->
    <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #2563eb;">📨 Messagerie admin</h3>
      <p style="margin: 0;">Cette demande a été automatiquement ajoutée à la messagerie de <strong>Admin Staka</strong></p>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">ID conversation : uuid-conversation</p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">
        Cette demande provient de la landing page section "Testez notre expertise gratuitement".<br>
        Réponse attendue sous 48h selon les engagements du site.
      </p>
      <p style="margin: 10px 0 0 0;">
        <strong>Staka Livres</strong> - Système d'échantillons gratuits automatique
      </p>
    </div>
  </div>
</div>
```

### 📝 Template texte alternatif

```text
🎯 Nouvelle demande d'échantillon gratuit

Informations du prospect :
- Nom : Jean Dupont
- Email : jean.dupont@test.com
- Téléphone : 06 12 34 56 78

Détails du projet :
- Genre littéraire : Roman
- Description : Premier roman de 300 pages sur une histoire d'amour

Action requise : Le prospect souhaite recevoir 10 pages corrigées gratuitement
✅ Fichier joint fourni

Cette demande a été automatiquement ajoutée à la messagerie de Admin Staka
ID conversation : uuid-conversation

---
Cette demande provient de la landing page section "Testez notre expertise gratuitement".
Réponse attendue sous 48h selon les engagements du site.

Staka Livres - Système d'échantillons gratuits automatique
```

---

## 🧪 Tests et validation

### 🔬 Test API complet

```bash
# Test demande d'échantillon gratuit
curl -X POST https://livrestaka.fr/api/public/free-sample \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Jean Dupont", 
    "email": "jean.dupont@test.com", 
    "telephone": "06 12 34 56 78", 
    "genre": "roman", 
    "description": "Premier roman de 300 pages", 
    "fichier": "manuscrit.docx"
  }'

# Attendu: 200 OK
# {
#   "success": true,
#   "message": "Votre demande d'échantillon gratuit a bien été envoyée ! Nous vous recontacterons sous 48h avec vos 10 pages corrigées gratuitement.",
#   "conversationId": "uuid-conversation"
# }
```

### 🔍 Vérifications post-test

```bash
# 1. Vérifier message dans messagerie admin
docker compose exec backend npx ts-node scripts/checkMessages.ts

# 2. Vérifier notification admin créée
docker compose exec backend npx ts-node scripts/checkNotifications.ts

# 3. Vérifier logs backend
docker compose logs backend | grep -i "FreeSample\|échantillon"

# 4. Vérifier email reçu (si configuration Resend active)
# → Boîte SUPPORT_EMAIL doit contenir email avec template HTML
```

### 📋 Checklist de validation

- [ ] Formulaire soumis avec succès
- [ ] Message créé dans messagerie admin
- [ ] Notification admin générée
- [ ] Email envoyé à l'équipe support
- [ ] Audit log créé
- [ ] Réponse 200 avec conversationId
- [ ] Formulaire reset après succès

### ❌ Tests d'erreur

```bash
# Test validation email invalide
curl -X POST https://livrestaka.fr/api/public/free-sample \
  -H "Content-Type: application/json" \
  -d '{"nom": "Test", "email": "invalid-email"}' -s

# Attendu: 400 Bad Request
# {"error": "Format d'email invalide", "details": "..."}

# Test champs requis manquants
curl -X POST https://livrestaka.fr/api/public/free-sample \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com"}' -s

# Attendu: 400 Bad Request
# {"error": "Nom et email sont requis", "details": "..."}
```

---

## ⚙️ Configuration

### 🔧 Variables d'environnement

```env
# Backend (.env)
# Support email pour demandes d'échantillon gratuit
SUPPORT_EMAIL="contact@staka.fr"

# Configuration Resend pour emails automatiques
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="contact@staka.fr"
FROM_NAME="Staka Livres"

# Email admin pour notifications automatiques (système centralisé)
ADMIN_EMAIL="contact@staka.fr"

# JWT pour authentification (si messages admin)
JWT_SECRET="your-jwt-secret"

# Base de données pour messages et notifications
DATABASE_URL="mysql://user:password@localhost:3306/staka_livres"

# URL frontend pour liens dans les emails
FRONTEND_URL="https://livrestaka.fr"
```

### 📧 Configuration email

Template utilise les variables d'environnement :

```typescript
// Adresse email de support (configurable)
const supportEmail = process.env.SUPPORT_EMAIL || "contact@staka.fr";

// Configuration Resend
await MailerService.sendEmail({
  to: supportEmail,
  subject: `🎯 Échantillon gratuit demandé par ${cleanData.nom}`,
  html: htmlContent,
  text: textContent,
});
```

### 🛡️ Sécurité et rate limiting

```typescript
// TODO: Ajouter rate limiting (optionnel)
// Limite : 5 demandes par heure par IP pour éviter spam

// Validation stricte existante
- Champs requis : nom, email
- Format email vérifié
- Longueur limitée : nom (100 chars), description (2000 chars)
- Nettoyage données avec trim()
- Logs d'audit complets
```

---

## 🔧 Troubleshooting

### ❌ Problèmes courants

#### 1. Email non reçu

**Symptômes** : L'équipe ne reçoit pas l'email de notification
**Solutions** :
- Vérifier configuration Resend (RESEND_API_KEY)
- Contrôler SUPPORT_EMAIL dans les variables d'environnement
- Vérifier les spams de la boîte support
- Consulter les logs backend pour erreurs email

```bash
# Vérifier logs email
docker compose logs backend | grep -i "resend\|email\|mailer"
```

#### 2. Message non créé dans messagerie

**Symptômes** : Aucun message visible dans l'interface admin
**Solutions** :
- Vérifier qu'un admin existe dans la base de données
- Contrôler logs pour erreurs Prisma
- Vérifier script checkMessages.ts

```bash
# Lister les admins disponibles
docker compose exec backend npx ts-node scripts/listUsers.ts

# Vérifier messages récents
docker compose exec backend npx ts-node scripts/checkMessages.ts
```

#### 3. Notification admin manquante

**Symptômes** : Pas de badge/notification dans l'interface admin
**Solutions** :
- Vérifier que la fonction notifyAdminNewMessage fonctionne
- Contrôler les notifications avec script de vérification
- Vérifier polling notifications côté frontend

```bash
# Vérifier notifications récentes
docker compose exec backend npx ts-node scripts/checkNotifications.ts
```

#### 4. Erreur 500 serveur

**Symptômes** : Erreur interne serveur lors de la soumission
**Solutions** :
- Vérifier logs backend pour stack trace
- Contrôler configuration base de données
- Vérifier que tous les imports sont corrects

```bash
# Logs erreurs backend
docker compose logs backend --tail=50
```

### 🔍 Debugging

```typescript
// Activer logs de debug dans publicController.ts
console.log('[FreeSample] Données reçues:', req.body);
console.log('[FreeSample] Admin assigné:', admin);
console.log('[FreeSample] Message créé:', message.id);
console.log('[FreeSample] Email envoyé vers:', supportEmail);
```

### 📊 Monitoring

```sql
-- Statistiques demandes d'échantillon gratuit
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as demandes
FROM messages 
WHERE subject LIKE '%Échantillon gratuit%'
GROUP BY DATE(createdAt)
ORDER BY date DESC;

-- Messages récents d'échantillon gratuit
SELECT 
  visitorName,
  visitorEmail,
  subject,
  createdAt
FROM messages 
WHERE subject LIKE '%Échantillon gratuit%'
ORDER BY createdAt DESC
LIMIT 10;
```

---

## 📚 Ressources

### 📖 Documentation connexe

- [MESSAGES_API_GUIDE.md](MESSAGES_API_GUIDE.md) - API messagerie complète
- [NOUVELLES_FONCTIONNALITES_2025.md](NOUVELLES_FONCTIONNALITES_2025.md) - Toutes les nouveautés 2025
- [README-backend.md](README-backend.md) - Guide backend API
- [README-frontend.md](README-frontend.md) - Guide frontend React

### 🔗 Références techniques

- [Resend API](https://docs.resend.com/) - Documentation email
- [Prisma Docs](https://www.prisma.io/docs/) - ORM base de données
- [React Docs](https://react.dev/) - Framework frontend

---

## 🎯 Conclusion

Le système d'échantillon gratuit de Staka Livres offre un **workflow automatisé complet** qui transforme les visiteurs en prospects qualifiés tout en respectant l'engagement de réponse sous 48h.

### Fonctionnalités clés ✅ (**PRODUCTION VALIDÉE 3 AOÛT 2025**)

- ✅ **Formulaire public** : 375 lignes React + FormData + drag&drop
- ✅ **Workflow EventBus** : Formulaire → Message → Notification centralisée → Double email
- ✅ **Templates Handlebars** : `admin-message.hbs` + `visitor-sample-confirmation.hbs`
- ✅ **Messagerie intégrée** : `visitorEmail/visitorName` + assignation premier admin
- ✅ **Upload fichiers** : Multer + MessageAttachment + stockage local
- ✅ **Audit AuditService** : `USER_MESSAGE_SUPPORT_EMAIL_SENT` + métadonnées
- ✅ **Validation stricte** : Regex email + limites 100/2000 chars + 5Mo max
- ✅ **UX premium** : Trust indicators + success stories + loading states

Le système est **pleinement opérationnel sur [livrestaka.fr](https://livrestaka.fr/)**  
✅ **Testé le 3 août 2025** : `conversationId: dcae587c-5592-4ede-92f0-e2dea6877197`

### 📧 Architecture centralisée confirmée (✅ PRODUCTION)

Le système d'échantillon gratuit utilise l'**architecture EventBus centralisée** :

#### ✅ **Flux confirmé** :
1. `sendFreeSampleRequest()` → `notifyAdminNewMessage()` 
2. **EventBus** émet `admin.notification.created`
3. **adminNotificationEmailListener** capture l'événement
4. **Template `admin-message.hbs`** rendu automatiquement
5. **emailQueue** traite l'envoi asynchrone vers `ADMIN_EMAIL`

#### ✅ **Variables production** :
- `ADMIN_EMAIL="contact@staka.fr"` (✅ confirmé)
- `FRONTEND_URL="https://livrestaka.fr"` (✅ confirmé)
- **Resend** opérationnel avec queue asynchrone

Cette architecture garantit **zéro oubli d'email admin** et **cohérence templates**.

---

**📧 Contact production** : contact@staka.fr  
**👨‍💻 Développé par** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)  
**🌐 Test production** : https://livrestaka.fr/ (✅ validé 3 août 2025)

*Guide mis à jour le 3 août 2025 - Version 1.2 - Architecture EventBus confirmée - Production pleinement opérationnelle*