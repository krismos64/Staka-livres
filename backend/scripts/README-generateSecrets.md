# 🔒 Générateur de Secrets Production - Guide d'Utilisation

## 🎯 **Objectif**

Script Node.js sécurisé pour générer automatiquement tous les secrets de production nécessaires au déploiement de Staka Livres sur VPS OVH.

## 📋 **Secrets Générés**

| Variable | Longueur | Entropie | Usage |
|----------|----------|----------|-------|
| `JWT_SECRET` | 64 chars | 320+ bits | Signature des tokens JWT |
| `MYSQL_ROOT_PASSWORD` | 32 chars | 160+ bits | Mot de passe root MySQL |
| `MYSQL_PASSWORD` | 24 chars | 120+ bits | Utilisateur `staka_prod` MySQL |
| `AWS_SECRET_ACCESS_KEY` | 40 chars | 200+ bits | Clé secrète AWS S3 |
| `REDIS_PASSWORD` | 20 chars | 100+ bits | Mot de passe Redis cache |
| `STRIPE_WEBHOOK_ENDPOINT_SECRET` | 32 chars | 120+ bits | Secret endpoint webhook |

## 🚀 **Utilisation**

### **1. Installation et Permissions**

```bash
# Rendre le script exécutable
chmod +x backend/scripts/generateSecrets.js

# Vérifier Node.js disponible
node --version  # Doit être >= 16.x
```

### **2. Générer les Secrets**

```bash
# Génération standard
node backend/scripts/generateSecrets.js

# Fichier de sortie personnalisé
node backend/scripts/generateSecrets.js --output .env.prod

# Mode test (pas de fichier créé)
node backend/scripts/generateSecrets.js --dry-run

# Afficher l'aide
node backend/scripts/generateSecrets.js --help
```

### **3. Exemple de Sortie**

```bash
🔒 GÉNÉRATEUR DE SECRETS PRODUCTION - STAKA LIVRES
═══════════════════════════════════════════════════════

⚙️ Configuration:
   📄 Fichier sortie: .env.production
   🧪 Mode test: Désactivé
   🕒 Timestamp: 2025-07-22T09:45:00.000Z

🔐 GÉNÉRATION DES SECRETS:
═══════════════════════════════════════════════════════

JWT_SECRET
  📝 Description: Clé de signature JWT pour authentification
  🔢 Longueur: 64 caractères
  🎲 Entropie: ✅ 384 bits
  🔐 Secret: 4t9LSGlH0WkqUZu2iP08ybyU7x82GPggj_huwIhmg3BrnoD8VwMiLTc9XHX5qAI0

[... autres secrets ...]

✅ FICHIER GÉNÉRÉ AVEC SUCCÈS:
═══════════════════════════════════════════════════════
   📄 Fichier: /path/to/.env.production
   📏 Taille: 3847 bytes
   🔒 Permissions: 600 (rw--------)
```

## 🔐 **Sécurité**

### **Caractéristiques de Sécurité**

- **Entropie cryptographique** : Utilise `crypto.randomBytes()` de Node.js
- **Validation entropie** : Vérification automatique des seuils de sécurité
- **Permissions sécurisées** : Fichier automatiquement protégé en 600 (rw-------)
- **Standards conformes** : NIST et OWASP recommandations
- **Encodage sécurisé** : Base64URL (sans caractères problématiques)

### **Entropie par Secret**

```javascript
// Calcul d'entropie base64url: log2(64) ≈ 6 bits par caractère
JWT_SECRET (64 chars)     : 384 bits (EXCELLENT)
MYSQL_ROOT_PASSWORD (32)  : 192 bits (TRÈS BON)
MYSQL_PASSWORD (24)       : 144 bits (BON)
AWS_SECRET_ACCESS_KEY (40): 240 bits (TRÈS BON)
REDIS_PASSWORD (20)       : 120 bits (BON)
```

## 📁 **Fichier .env.production Généré**

### **Structure du Fichier**

```env
# 🔒 CONFIGURATION PRODUCTION - STAKA LIVRES
# Fichier généré automatiquement le 2025-07-22T09:45:00.000Z

# =============================================================================
# 🔐 SÉCURITÉ ET AUTHENTIFICATION
# =============================================================================

JWT_SECRET="4t9LSGlH0WkqUZu2iP08ybyU7x82GPggj_huwIhmg3BrnoD8VwMiLTc9XHX5qAI0"
NODE_ENV="production"

# =============================================================================
# 🗄️ BASE DE DONNÉES MYSQL
# =============================================================================

DATABASE_URL="mysql://staka_prod:WtAgK5q3EveTttij33Lo9iiz@db:3306/stakalivres_prod"
MYSQL_ROOT_PASSWORD="dxJhRZrqD5zKE8XDlXJbU7CqL9ixVCn-"
MYSQL_PASSWORD="WtAgK5q3EveTttij33Lo9iiz"

# =============================================================================
# 💳 PAIEMENTS STRIPE LIVE
# =============================================================================

# ⚠️ REMPLACER PAR VOS VRAIES CLÉS STRIPE LIVE
STRIPE_SECRET_KEY="sk_live_VOTRE_CLE_STRIPE_LIVE_ICI"
STRIPE_WEBHOOK_SECRET="whsec_VOTRE_WEBHOOK_SECRET_STRIPE_ICI"

# [... autres sections ...]
```

### **Variables à Compléter Manuellement**

⚠️ **ATTENTION** : Ces valeurs doivent être remplacées par vos vraies clés :

```env
# SendGrid
SENDGRID_API_KEY="SG.VOTRE_CLE_SENDGRID_PRODUCTION_ICI"

# Stripe LIVE
STRIPE_SECRET_KEY="sk_live_VOTRE_CLE_STRIPE_LIVE_ICI"
STRIPE_WEBHOOK_SECRET="whsec_VOTRE_WEBHOOK_SECRET_STRIPE_ICI"

# AWS S3
AWS_ACCESS_KEY_ID="AKIA_VOTRE_ACCESS_KEY_PRODUCTION_ICI"
```

## 🔧 **Intégration Docker**

### **1. Utilisation avec Docker Compose**

```yaml
# docker-compose.prod.yml
services:
  backend:
    env_file:
      - ./backend/.env.production
    # ...
  
  db:
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    # ...
```

### **2. Script de Déploiement Automatisé**

```bash
#!/bin/bash
# deploy-production.sh

echo "🔒 Génération des secrets production..."
node backend/scripts/generateSecrets.js

echo "✏️ Configuration manuelle requise:"
echo "   - Ouvrez backend/.env.production"
echo "   - Remplacez les valeurs avec 'VOTRE_'"
echo "   - Sauvegardez et fermez l'éditeur"

read -p "⏸️ Appuyez sur Entrée quand la configuration est terminée..."

echo "🚀 Lancement du déploiement Docker..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "✅ Déploiement terminé !"
```

## ⚠️ **Instructions Sécurité**

### **1. Avant Utilisation**

```bash
# Vérifier que le script est dans .gitignore
grep -F "generateSecrets.js" .gitignore || echo "backend/scripts/generateSecrets.js" >> .gitignore

# Vérifier que .env.production est dans .gitignore  
grep -F ".env.production" .gitignore || echo "**/.env.production" >> .gitignore
```

### **2. Après Génération**

```bash
# Vérifier permissions
ls -la backend/.env.production
# Doit afficher: -rw------- (600)

# Tester validité du fichier
grep -E "^[A-Z_]+=.+" backend/.env.production | wc -l
# Doit afficher le nombre de variables définies
```

### **3. Sauvegarde Sécurisée**

```bash
# Chiffrement avec GPG (optionnel)
gpg -c backend/.env.production
# Crée: backend/.env.production.gpg

# Sauvegarde vers gestionnaire de mots de passe
# 1. Copier le contenu du fichier
# 2. Coller dans votre gestionnaire de mots de passe
# 3. Supprimer le fichier local après déploiement
```

## 🧪 **Tests et Validation**

### **1. Test du Script**

```bash
# Test mode dry-run
node backend/scripts/generateSecrets.js --dry-run

# Vérifier entropie générée (doit être > 1000 bits total)
```

### **2. Validation des Secrets**

```javascript
// Test manuel d'entropie
const secret = "4t9LSGlH0WkqUZu2iP08ybyU7x82GPggj_huwIhmg3BrnoD8VwMiLTc9XHX5qAI0";
const entropy = secret.length * Math.log2(64); // base64url = 64 chars
console.log(`Entropie: ${entropy} bits`); // Doit être > 300 bits
```

### **3. Test Production**

```bash
# Test connexion MySQL avec secrets générés
docker-compose -f docker-compose.prod.yml exec db mysql -u staka_prod -p

# Test JWT avec secret généré  
curl -H "Authorization: Bearer TEST_JWT" https://votre-domaine.com/api/auth/verify
```

## 🔄 **Renouvellement des Secrets**

### **Procédure de Rotation**

```bash
# 1. Générer nouveaux secrets
node backend/scripts/generateSecrets.js --output .env.production.new

# 2. Mise à jour graduelle
# Remplacer un secret à la fois pour éviter les interruptions

# 3. Test de chaque secret
# Valider que l'application fonctionne après chaque changement

# 4. Finalisation
mv .env.production.new .env.production
docker-compose -f docker-compose.prod.yml restart
```

### **Fréquence Recommandée**

- **JWT_SECRET** : Tous les 6 mois
- **Mots de passe DB** : Tous les 3 mois  
- **Clés AWS** : Selon politique entreprise
- **Secrets Stripe** : En cas de compromission uniquement

## 📞 **Support**

### **Problèmes Courants**

**Erreur de permissions :**
```bash
chmod +x backend/scripts/generateSecrets.js
```

**Node.js non trouvé :**
```bash
# Ubuntu/Debian
sudo apt install nodejs npm

# CentOS/RHEL  
sudo yum install nodejs npm
```

**Fichier non généré :**
```bash
# Vérifier permissions du répertoire
ls -la backend/
chmod 755 backend/
```

### **Contact**

En cas de problème avec le générateur de secrets :
- 📧 **Support technique** : support@staka-livres.fr
- 📋 **Documentation** : `/docs/CHECKLIST_DEPLOIEMENT_OVH.md`
- 🔧 **Logs de débogage** : Utiliser `--dry-run` pour diagnostiquer

---

*Guide mis à jour le 22 juillet 2025 - Version 2.0*  
*Compatible avec Staka Livres Production Ready*