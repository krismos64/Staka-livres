# 🎯 Guide Système d'Échantillon Gratuit - Staka Livres

> **Guide technique complet** pour le système d'échantillon gratuit qui permet aux visiteurs de demander une correction gratuite de 10 pages depuis la landing page.

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

Le système d'échantillon gratuit de Staka Livres permet aux visiteurs de la landing page de demander facilement une correction gratuite de 10 pages pour tester la qualité du service.

### ✅ Fonctionnalités principales

- **Formulaire public optimisé** : Section "Testez notre expertise gratuitement" sur la landing page
- **Workflow automatisé complet** : Formulaire → Messagerie admin → Email équipe → Notification temps réel
- **Intégration messagerie** : Messages automatiquement créés et assignés au premier admin disponible
- **Templates email professionnels** : HTML responsive avec informations prospect et action requise
- **Validation stricte** : Nom, email requis + validation format email côté client et serveur
- **Audit logging** : Traçabilité complète avec métadonnées prospect et admin assigné

### 🔧 Technologies utilisées

- **Backend** : Node.js, Express, Prisma, TypeScript
- **Frontend** : React, TypeScript, Fetch API
- **Email** : SendGrid avec templates HTML
- **Messagerie** : Système messagerie admin intégré
- **Notifications** : Notifications temps réel admin
- **Audit** : AuditService avec logs complets

---

## 🏗️ Architecture technique

### 📁 Structure des fichiers

```
backend/
├── src/
│   ├── controllers/
│   │   └── publicController.ts          # Endpoint échantillon gratuit
│   ├── routes/
│   │   └── public.ts                    # Route POST /free-sample
│   └── scripts/
│       ├── checkMessages.ts             # Vérification messages
│       └── checkNotifications.ts        # Vérification notifications

frontend/
├── src/
│   └── components/
│       └── landing/
│           └── FreeSample.tsx           # Composant formulaire optimisé
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
// Request Body
{
  "nom": "Jean Dupont",                    // Requis
  "email": "jean.dupont@example.com",      // Requis + validation format
  "telephone": "06 12 34 56 78",           // Optionnel
  "genre": "roman",                        // Optionnel
  "description": "Description du projet",  // Optionnel
  "fichier": "manuscrit.docx"              // Optionnel (nom fichier)
}
```

**Réponses :**

```typescript
// 200 - Succès
{
  "success": true,
  "message": "Votre demande d'échantillon gratuit a bien été envoyée ! Nous vous recontacterons sous 48h avec vos 10 pages corrigées gratuitement.",
  "conversationId": "uuid-conversation"
}

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

### 🔒 Validation et sécurité

```typescript
// Validation côté serveur
const cleanData = {
  nom: nom.trim(),
  email: email.trim().toLowerCase(),
  telephone: telephone ? telephone.trim() : '',
  genre: genre ? genre.trim() : '',
  description: description ? description.trim() : '',
  fichier: fichier || null
};

// Validation format email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(cleanData.email)) {
  // Erreur 400
}

// Validation longueur des champs
if (cleanData.nom.length > 100) {
  // Erreur 400 - Nom trop long
}

if (cleanData.description && cleanData.description.length > 2000) {
  // Erreur 400 - Description trop longue
}
```

---

## 🖥️ Interface utilisateur

### 📄 Composant FreeSample.tsx

**Localisation** : `frontend/src/components/landing/FreeSample.tsx`

**Fonctionnalités** :
- Formulaire complet avec validation temps réel
- Appel API réelle (fini la simulation)
- Gestion d'états loading/success/error
- Upload de fichier avec simulation de progression
- Reset automatique après succès

```typescript
// États principaux du composant
const [formData, setFormData] = useState({
  nom: "",
  email: "",
  telephone: "",
  genre: "",
  description: "",
  fichier: null as File | null,
});

const [uploadProgress, setUploadProgress] = useState(0);
const [isUploading, setIsUploading] = useState(false);
const [isSubmitted, setIsSubmitted] = useState(false);
```

### 🎨 Design et UX

- **Section landing page** : "Testez notre expertise gratuitement"
- **Design responsive** : Mobile-first avec Tailwind CSS
- **Validation temps réel** : Email, champs requis
- **Upload simulé** : Barre de progression avec nom fichier
- **Messages clairs** : Succès/erreur avec émojis
- **Loading states** : Bouton disabled pendant envoi

---

## 🔄 Workflow automatisé

### 1️⃣ Soumission formulaire

```mermaid
graph TD
    A[Visiteur remplit formulaire] --> B[Validation côté client]
    B --> C[Appel API /free-sample]
    C --> D[Validation serveur]
    D --> E[Recherche admin disponible]
    E --> F[Création message messagerie]
    F --> G[Envoi email équipe]
    G --> H[Notification admin]
    H --> I[Audit logging]
    I --> J[Réponse success au client]
```

### 2️⃣ Traitement automatique

1. **Validation données** : Nom, email requis + format email
2. **Attribution admin** : Premier admin par date de création
3. **Message messagerie** : Création automatique avec détails prospect
4. **Email équipe** : Template HTML professionnel vers SUPPORT_EMAIL
5. **Notification admin** : Badge temps réel + identification "échantillon gratuit"
6. **Audit log** : Traçabilité complète avec métadonnées

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
curl -X POST http://localhost:3000/api/public/free-sample \
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

# 4. Vérifier email reçu (si configuration SendGrid active)
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
curl -X POST http://localhost:3000/api/public/free-sample \
  -H "Content-Type: application/json" \
  -d '{"nom": "Test", "email": "invalid-email"}' -s

# Attendu: 400 Bad Request
# {"error": "Format d'email invalide", "details": "..."}

# Test champs requis manquants
curl -X POST http://localhost:3000/api/public/free-sample \
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

# Configuration SendGrid pour emails automatiques
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@staka-livres.com"

# JWT pour authentification (si messages admin)
JWT_SECRET="your-jwt-secret"

# Base de données pour messages et notifications
DATABASE_URL="mysql://user:password@localhost:3306/staka_livres"
```

### 📧 Configuration email

Template utilise les variables d'environnement :

```typescript
// Adresse email de support (configurable)
const supportEmail = process.env.SUPPORT_EMAIL || "contact@staka.fr";

// Configuration SendGrid
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
- Vérifier configuration SendGrid (SENDGRID_API_KEY)
- Contrôler SUPPORT_EMAIL dans les variables d'environnement
- Vérifier les spams de la boîte support
- Consulter les logs backend pour erreurs email

```bash
# Vérifier logs email
docker compose logs backend | grep -i "sendgrid\|email\|mailer"
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

- [SendGrid API](https://docs.sendgrid.com/) - Documentation email
- [Prisma Docs](https://www.prisma.io/docs/) - ORM base de données
- [React Docs](https://react.dev/) - Framework frontend

---

## 🎯 Conclusion

Le système d'échantillon gratuit de Staka Livres offre un **workflow automatisé complet** qui transforme les visiteurs en prospects qualifiés tout en respectant l'engagement de réponse sous 48h.

### Fonctionnalités clés ✅

- ✅ Formulaire public optimisé sur landing page
- ✅ Workflow automatisé : Formulaire → Messagerie → Email → Notification
- ✅ Templates email professionnels HTML responsive
- ✅ Intégration messagerie admin avec assignation automatique
- ✅ Notifications temps réel avec identification claire
- ✅ Audit logging complet pour traçabilité
- ✅ Validation stricte côté client et serveur
- ✅ UX optimisée avec gestion d'erreurs robuste

Le système est **production-ready** avec tests validés et monitoring complet.

---

*Guide rédigé en Juillet 2025 - Version 1.0*