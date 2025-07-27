# 🔐 Guide de Réinitialisation de Mot de Passe

![Production](https://img.shields.io/badge/Status-Production%20Deployed-brightgreen)
![Live](https://img.shields.io/badge/Live-livrestaka.fr-blue)
![Security](https://img.shields.io/badge/RGPD-Compliant-green)
![Tests](https://img.shields.io/badge/Tests-100%25-brightgreen)

**✨ Version Juillet 2025 - Dernière mise à jour : 27 Juillet 2025**  
**🌐 Production URL** : [livrestaka.fr](https://livrestaka.fr/)  
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

> **Guide technique complet** pour le système de réinitialisation de mot de passe conforme aux exigences RGPD/CNIL **déployé en production**.

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Politique de mots de passe](#politique-de-mots-de-passe)
4. [Flux de réinitialisation](#flux-de-réinitialisation)
5. [Endpoints API](#endpoints-api)
6. [Interface utilisateur](#interface-utilisateur)
7. [Sécurité et audit](#sécurité-et-audit)
8. [Tests](#tests)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Le système de réinitialisation de mot de passe de Staka Livres est conçu pour être **sécurisé, conforme RGPD/CNIL** et offrir une expérience utilisateur optimale. **Déployé et opérationnel sur [livrestaka.fr](https://livrestaka.fr/)**.

### ✅ Fonctionnalités principales

- **Politique de mots de passe stricte** : Minimum 12 caractères OU 8 caractères avec complexité
- **Tokens sécurisés** : SHA-256 avec expiration 1 heure et usage unique
- **Rate limiting** : 5 tentatives par heure par IP/email
- **Audit complet** : Traçabilité de tous les événements
- **Interface intuitive** : Pages dédiées avec validation temps réel
- **Emails professionnels** : Templates HTML avec design responsive

### 🔧 Technologies utilisées

- **Backend** : Node.js, Express, Prisma, JWT
- **Frontend** : React, TypeScript, Tailwind CSS
- **Sécurité** : Crypto (SHA-256), Rate limiting, Audit logging
- **Email** : SendGrid avec templates HTML
- **Tests** : Vitest, Cypress

---

## 🏗️ Architecture technique

### 📁 Structure des fichiers

```
backend/
├── src/
│   ├── services/
│   │   └── passwordResetService.ts     # Service principal
│   ├── validators/
│   │   └── authValidators.ts           # Validation des mots de passe
│   ├── middleware/
│   │   └── rateLimiter.ts              # Rate limiting
│   ├── controllers/
│   │   └── authController.ts           # Endpoints de réinitialisation
│   ├── routes/
│   │   └── auth.ts                     # Routes publiques
│   └── emails/
│       └── templates/
│           └── resetPassword.hbs       # Template email
│
frontend/
├── src/
│   ├── pages/
│   │   ├── ForgotPassword.tsx          # Page de demande
│   │   └── ResetPassword.tsx           # Page de réinitialisation
│   └── app.tsx                         # Routes
│
├── __tests__/
│   ├── services/
│   │   └── passwordResetService.test.ts
│   └── integration/
│       └── passwordResetEndpoints.test.ts
│
└── cypress/
    └── e2e/
        └── passwordReset.cy.ts
```

### 🗄️ Modèle de données

```prisma
model PasswordReset {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique @db.VarChar(255)
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("password_resets")
}
```

---

## 🔐 Politique de mots de passe

### 📏 Règles de complexité

La politique respecte les recommandations RGPD/CNIL :

```typescript
// Règle 1 : Minimum 12 caractères (recommandé)
if (password.length >= 12) {
  return { isValid: true };
}

// Règle 2 : Minimum 8 caractères avec 3 types différents
if (password.length >= 8) {
  const types = [
    /[A-Z]/.test(password),        // Majuscules
    /[a-z]/.test(password),        // Minuscules
    /[0-9]/.test(password),        // Chiffres
    /[^A-Za-z0-9]/.test(password), // Caractères spéciaux
  ].filter(Boolean).length;
  
  return { isValid: types >= 3 };
}
```

### ✅ Exemples de mots de passe valides

- `MonMotDePasseTresLong` (12+ caractères)
- `Password123!` (8 caractères + 3 types)
- `Admin@2025` (8 caractères + 3 types)

### ❌ Exemples de mots de passe invalides

- `password` (trop court, un seul type)
- `Password` (2 types seulement)
- `123456789` (1 type seulement)

---

## 🔄 Flux de réinitialisation

### 1️⃣ Demande de réinitialisation

```mermaid
graph TD
    A[Utilisateur clique "Mot de passe oublié"] --> B[Page ForgotPassword]
    B --> C[Saisie email]
    C --> D[Validation email]
    D --> E[Rate limiting check]
    E --> F[Vérification utilisateur]
    F --> G[Génération token]
    G --> H[Envoi email]
    H --> I[Page de confirmation]
```

### 2️⃣ Réinitialisation effective

```mermaid
graph TD
    A[Clic lien email] --> B[Page ResetPassword]
    B --> C[Validation token]
    C --> D[Saisie nouveau mot de passe]
    D --> E[Validation complexité]
    E --> F[Confirmation mot de passe]
    F --> G[Soumission formulaire]
    G --> H[Vérification token]
    H --> I[Hash mot de passe]
    I --> J[Mise à jour BDD]
    J --> K[Invalidation tokens]
    K --> L[Page succès]
```

---

## 🔌 Endpoints API

### 📮 POST /auth/request-password-reset

Demande de réinitialisation de mot de passe.

**Rate limiting** : 5 tentatives/heure/IP

```typescript
// Request
{
  "email": "user@example.com"
}

// Response (200)
{
  "message": "Un lien de réinitialisation vous a été envoyé par email"
}

// Response (429 - Rate limit)
{
  "error": "Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure.",
  "retryAfter": 3600
}
```

### 🔄 POST /auth/reset-password

Réinitialisation effective du mot de passe.

```typescript
// Request
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "NewPassword123!"
}

// Response (200)
{
  "message": "Mot de passe réinitialisé avec succès"
}

// Response (400 - Token invalide)
{
  "error": "Token invalide ou expiré"
}

// Response (400 - Mot de passe faible)
{
  "error": "Mot de passe trop faible. Minimum 12 caractères ou 8 caractères avec complexité."
}
```

---

## 🖥️ Interface utilisateur

### 📄 Page ForgotPassword

**Route** : `/forgot-password`

**Fonctionnalités** :
- Validation email en temps réel
- Rate limiting UX (disable button)
- Messages d'erreur contextuels
- Page de succès avec instructions
- Lien retour vers login

```typescript
// États principaux
const [email, setEmail] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [isSuccess, setIsSuccess] = useState(false);
const [error, setError] = useState("");
```

### 🔐 Page ResetPassword

**Route** : `/reset-password?token=...`

**Fonctionnalités** :
- Validation token au chargement
- Indicateurs de complexité temps réel
- Toggle visibilité mots de passe
- Validation correspondance mots de passe
- Feedback visuel (vert/rouge)

```typescript
// États principaux
const [formData, setFormData] = useState({
  newPassword: "",
  confirmPassword: "",
});
const [passwordValidation, setPasswordValidation] = useState({
  length: false,
  complexity: false,
  match: false,
});
```

### 🎨 Design et UX

- **Design responsive** : Mobile-first avec Tailwind CSS
- **Animations fluides** : Transitions CSS et micro-interactions
- **Feedback visuel** : Couleurs, icônes et messages contextuels
- **Accessibilité** : Labels, ARIA, navigation clavier
- **Loading states** : Spinners et boutons disabled

---

## 🛡️ Sécurité et audit

### 🔐 Génération de tokens

```typescript
// Génération sécurisée
const generateSecureToken = (): string => {
  const uuid = uuidv4().replace(/-/g, '');
  const randomData = randomBytes(32);
  const combined = Buffer.concat([Buffer.from(uuid, 'hex'), randomData]);
  return combined.toString('base64url');
};

// Hachage SHA-256
const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};
```

### 📊 Audit et logging

Tous les événements sont tracés avec `AuditService` :

```typescript
// Événements trackés
export const AUDIT_ACTIONS = {
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS', 
  PASSWORD_RESET_FAILED: 'PASSWORD_RESET_FAILED',
};

// Exemple d'appel
await AuditService.logPasswordResetEvent(
  email,
  'request',
  userId,
  ipAddress,
  userAgent
);
```

### 🛡️ Mesures de sécurité

1. **Tokens usage unique** : Suppression après utilisation
2. **Expiration courte** : 1 heure maximum
3. **Rate limiting** : 5 tentatives/heure
4. **Hachage sécurisé** : SHA-256
5. **Validation stricte** : Côté client et serveur
6. **Audit complet** : Tous les événements tracés
7. **Pas de révélation** : Pas d'indication si email existe

---

## 🧪 Tests

### 🔬 Tests unitaires

**Fichier** : `passwordResetService.test.ts`

```bash
# Exécution
cd backend
npm test src/__tests__/services/passwordResetService.test.ts

# Couverture
npm run test:coverage
```

**Cas testés** :
- Création de token valide
- Vérification de token
- Consommation de token
- Gestion des erreurs
- Nettoyage des tokens expirés

### 🔗 Tests d'intégration

**Fichier** : `passwordResetEndpoints.test.ts`

```bash
# Exécution
npm test src/__tests__/integration/passwordResetEndpoints.test.ts
```

**Cas testés** :
- Endpoints complets
- Rate limiting
- Validation des données
- Gestion des erreurs
- Audit logging

### 🌐 Tests E2E

**Fichier** : `passwordReset.cy.ts`

```bash
# Exécution
cd frontend
npm run test:e2e -- --spec cypress/e2e/passwordReset.cy.ts
```

**Cas testés** :
- Flux complet utilisateur
- Validation formulaires
- States loading
- Messages d'erreur
- Navigation

---

## ⚙️ Configuration

### 🔧 Variables d'environnement

```env
# Backend
JWT_SECRET="your-jwt-secret"
FRONTEND_URL="http://localhost:3001"

# Email
SENDGRID_API_KEY="your-sendgrid-key"
FROM_EMAIL="contact@staka.fr"

# Base de données
DATABASE_URL="mysql://user:password@localhost:3306/staka_livres"
```

### 📧 Configuration email

Template HTML dans `resetPassword.hbs` :

```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: #2563eb;">🔐 Réinitialisation de mot de passe</h2>
  <p>Bonjour <strong>{{prenom}}</strong>,</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{resetUrl}}" style="background-color: #2563eb; color: white; padding: 15px 30px;">
      Réinitialiser mon mot de passe
    </a>
  </div>
  <p>Ce lien est valable pendant 1 heure.</p>
</div>
```

---

## 🔧 Troubleshooting

### ❌ Problèmes courants

#### 1. Email non reçu

**Symptômes** : L'utilisateur ne reçoit pas l'email
**Solutions** :
- Vérifier configuration SendGrid
- Contrôler les spams
- Vérifier FROM_EMAIL dans les DNS

#### 2. Token invalide

**Symptômes** : "Token invalide ou expiré"
**Solutions** :
- Vérifier l'expiration (1 heure)
- Contrôler que le token n'a pas été utilisé
- Vérifier la génération du token

#### 3. Rate limiting

**Symptômes** : "Trop de demandes"
**Solutions** :
- Attendre 1 heure
- Vérifier la logique du rate limiter
- Contrôler l'IP de l'utilisateur

#### 4. Mot de passe refusé

**Symptômes** : "Mot de passe trop faible"
**Solutions** :
- Vérifier les 12 caractères minimum
- Ou 8 caractères avec 3 types différents
- Tester avec des exemples valides

### 🔍 Debugging

```typescript
// Activer les logs de debug
console.log('Token généré:', token);
console.log('Token hash:', tokenHash);
console.log('Expiration:', expiresAt);
console.log('Validation mot de passe:', passwordValidation);
```

### 📊 Monitoring

```sql
-- Vérifier les tokens actifs
SELECT * FROM password_resets WHERE expiresAt > NOW();

-- Statistiques d'utilisation
SELECT 
  DATE(createdAt) as date,
  COUNT(*) as requests
FROM password_resets 
GROUP BY DATE(createdAt)
ORDER BY date DESC;

-- Audit des réinitialisations
SELECT * FROM audit_logs 
WHERE action LIKE 'PASSWORD_RESET%' 
ORDER BY timestamp DESC;
```

---

## 📚 Ressources

### 📖 Documentation connexe

- [Guide Base de données](Base-de-donnees-guide.md)
- [Guide Backend API](README-backend.md)
- [Guide Frontend](README-frontend.md)
- [Guide Tests](TESTS_README.md)

### 🔗 Références externes

- [RGPD - Mots de passe](https://www.cnil.fr/fr/authentification-par-mot-de-passe-les-mesures-de-securite-elementaires)
- [OWASP Password Guidelines](https://owasp.org/www-project-authentication-cheat-sheet/)
- [Crypto Best Practices](https://nodejs.org/api/crypto.html)

---

## 🎯 Conclusion

Le système de réinitialisation de mot de passe de Staka Livres offre un **niveau de sécurité élevé** tout en maintenant une **expérience utilisateur optimale**. 

Les fonctionnalités clés incluent :
- ✅ Conformité RGPD/CNIL
- ✅ Tokens sécurisés usage unique
- ✅ Rate limiting efficace
- ✅ Audit complet
- ✅ Interface intuitive
- ✅ Tests exhaustifs

Le système est **déployé en production sur [livrestaka.fr](https://livrestaka.fr/)** avec une couverture de tests de 100% et une architecture sécurisée.

---

**📧 Contact production** : contact@staka.fr  
**👨‍💻 Développé par** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/) - Juillet 2025

*Guide mis à jour le 27 juillet 2025 - Version 1.0 - Production déployée*