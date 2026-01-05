# 🔐 Guide d'Accès Client - Staka Livres

![Status](https://img.shields.io/badge/Status-Production-brightgreen)
![VPS](https://img.shields.io/badge/VPS-OVH-blue)
![Docker](https://img.shields.io/badge/Docker-Active-blue)

Guide complet pour accéder au code source et effectuer des modifications sur votre plateforme Staka Livres.

**📅 Date de livraison** : 05 Septembre 2025
**🌐 Site en production** : [https://livrestaka.fr](https://livrestaka.fr/)
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

---

## 📋 Table des matières

1. [Accès au code source](#-accès-au-code-source)
2. [Accès au serveur VPS](#-accès-au-serveur-vps)
3. [Installation locale pour développement](#-installation-locale-pour-développement)
4. [Workflow de modification](#-workflow-de-modification)
5. [Déploiement des modifications](#-déploiement-des-modifications)
6. [Identifiants et accès](#-identifiants-et-accès)
7. [Support et maintenance](#-support-et-maintenance)

---

## 🔑 Accès au code source

### Option 1 : Cloner depuis GitHub (Recommandé)

**URL du repository GitHub** : `https://github.com/krismos64/Staka-livres`
_(Si le projet n'est pas encore sur votre compte GitHub, contactez Christophe pour le transfert)_

```bash
# 1. Installer Git si nécessaire
# Windows : télécharger depuis https://git-scm.com/download/win
# Mac : installer via Homebrew "brew install git"
# Linux : sudo apt-get install git

# 2. Cloner le projet
git clone https://github.com/[VOTRE-COMPTE]/Staka-livres.git
cd Staka-livres

# 3. Vérifier que vous avez bien le code
ls -la
```

### Option 2 : Télécharger depuis le VPS

Si le projet n'est pas sur GitHub, vous pouvez le récupérer directement depuis le serveur :

```bash
# Avec SCP (depuis votre ordinateur)
scp -r root@51.254.102.133:/opt/staka-livres ./Staka-livres-backup

# Ou avec SFTP (interface graphique)
# Hôte : 51.254.102.133
# Port : 22
# Utilisateur : root
# Mot de passe : staka2020
```

**⚠️ Important** : Créez immédiatement votre propre repository GitHub privé pour versionner vos modifications !

---

## 🖥️ Accès au serveur VPS

### Connexion SSH

```bash
# Depuis un terminal (Mac/Linux) ou PowerShell (Windows)
ssh root@51.254.102.133

# Mot de passe : staka2020
```

### Chemins importants sur le serveur

```bash
# Code source de production
cd /opt/staka-livres

# Certificats SSL
cd /opt/staka/certs

# Logs Docker
docker compose logs -f

# Fichiers uploadés (stockage local)
cd /opt/staka-livres/backend/uploads
```

### Commandes utiles sur le VPS

```bash
# Vérifier l'état des services
docker compose ps

# Voir les logs en temps réel
docker compose logs -f backend
docker compose logs -f frontend

# Redémarrer un service
docker compose restart backend
docker compose restart frontend

# Vérifier l'espace disque
df -h

# Vérifier l'utilisation mémoire
free -h
```

---

## 💻 Installation locale pour développement

### Prérequis

Avant de commencer, installez :

1. **Node.js 18+** : [https://nodejs.org/](https://nodejs.org/)
2. **Docker Desktop** : [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
3. **Git** : [https://git-scm.com/](https://git-scm.com/)
4. **Un éditeur de code** : [VS Code](https://code.visualstudio.com/) (recommandé)

### Installation pas à pas

```bash
# 1. Cloner le projet (si ce n'est pas déjà fait)
git clone https://github.com/[VOTRE-COMPTE]/Staka-livres.git
cd Staka-livres

# 2. Copier le fichier d'environnement
cp backend/.env.example backend/.env

# 3. Éditer backend/.env avec vos clés
# Utilisez VS Code ou tout éditeur de texte
code backend/.env

# 4. Installer toutes les dépendances
npm run install:all

# 5. Démarrer l'environnement de développement
npm run docker:dev
```

**✅ Votre application locale sera accessible sur :**
- Frontend : http://localhost:3000
- Backend API : http://localhost:3001
- Base de données : localhost:3306

### Configuration backend/.env (Développement local)

```env
# Base de données locale
DATABASE_URL="mysql://staka:staka@db:3306/stakalivres"

# Authentification
JWT_SECRET="dev_secret_key_change_in_production"
FRONTEND_URL="http://localhost:3000"
PORT=3000

# Stripe (clés de TEST)
STRIPE_SECRET_KEY="sk_test_VOTRE_CLE_TEST"
STRIPE_WEBHOOK_SECRET="whsec_VOTRE_SECRET_TEST"

# Emails (SendGrid)
SENDGRID_API_KEY="SG.VOTRE_CLE"
FROM_EMAIL="contact@staka.fr"
FROM_NAME="Staka Livres"
SUPPORT_EMAIL="contact@staka.fr"
ADMIN_EMAIL="contact@staka.fr"
```

---

## 🔄 Workflow de modification

### 1. Créer une branche pour vos modifications

```bash
# Toujours travailler sur une branche séparée
git checkout -b feature/ma-nouvelle-fonctionnalite

# Ou pour une correction
git checkout -b fix/correction-bug-contact
```

### 2. Faire vos modifications

```bash
# Exemple : modifier un fichier frontend
code frontend/src/components/landing/Hero.tsx

# Exemple : modifier un fichier backend
code backend/src/controllers/publicController.ts
```

### 3. Tester localement

```bash
# Relancer les services si nécessaire
docker compose -f docker-compose.dev.yml restart

# Tester dans le navigateur
# Frontend : http://localhost:3000
# Backend : http://localhost:3001/api/[votre-endpoint]

# Lancer les tests automatiques (optionnel mais recommandé)
npm run test:backend
cd frontend && npm run test:e2e
```

### 4. Valider et sauvegarder

```bash
# Voir les fichiers modifiés
git status

# Ajouter vos modifications
git add .

# Créer un commit avec un message clair
git commit -m "feat: ajout formulaire de newsletter"

# Envoyer sur GitHub
git push origin feature/ma-nouvelle-fonctionnalite
```

---

## 🚀 Déploiement des modifications

### Méthode 1 : Déploiement automatisé (Recommandé)

**⚠️ Prérequis** : Avoir un fichier `.env.deploy.local` à la racine du projet

```bash
# 1. Créer le fichier .env.deploy.local
cat > .env.deploy.local << EOF
VPS_HOST=51.254.102.133
VPS_USER=root
VPS_PASSWORD=staka2020
DOCKERHUB_USER=krismos64
DOCKERHUB_TOKEN=VOTRE_TOKEN_DOCKERHUB
DOCKER_REGISTRY=krismos64
EOF

# 2. Fusionner votre branche dans main
git checkout main
git merge feature/ma-nouvelle-fonctionnalite

# 3. Déployer automatiquement
./deploy.sh

# Ou avec une version spécifique
./deploy.sh v1.6.0
```

**Le script `deploy.sh` fait automatiquement :**
- ✅ Build multi-architecture des images Docker
- ✅ Push vers Docker Hub
- ✅ Connexion au VPS
- ✅ Pull des nouvelles images
- ✅ Redémarrage des services
- ✅ Exécution des migrations de base de données
- ✅ Nettoyage automatique

### Méthode 2 : Déploiement manuel sur le VPS

```bash
# 1. Se connecter au VPS
ssh root@51.254.102.133

# 2. Aller dans le dossier du projet
cd /opt/staka-livres

# 3. Sauvegarder l'état actuel (recommandé)
docker compose exec db mysqldump -u root -pStakaRootPass2024! stakalivres > backup-$(date +%Y%m%d).sql

# 4. Récupérer les dernières modifications
git pull origin main

# 5. Rebuilder et relancer
docker compose -f docker-compose.prod.yml up -d --build

# 6. Vérifier que tout fonctionne
docker compose ps
docker compose logs -f
```

### Méthode 3 : Déploiement avec images Docker Hub

```bash
# 1. Depuis votre machine locale, builder et pusher
./scripts/docker-build.sh v1.6.0 --push

# 2. Se connecter au VPS
ssh root@51.254.102.133
cd /opt/staka-livres

# 3. Mettre à jour docker-compose.prod.yml avec la nouvelle version
nano docker-compose.prod.yml
# Modifier :
# image: krismos64/frontend:v1.6.0
# image: krismos64/backend:v1.6.0

# 4. Pull et redémarrage
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# 5. Vérification
curl https://livrestaka.fr/health
```

---

## 🔐 Identifiants et accès

### 🖥️ Serveur VPS OVH

```
Hôte : 51.254.102.133
Utilisateur : root
Mot de passe : staka2020
Port SSH : 22
```

**Connexion :**
```bash
ssh root@51.254.102.133
```

### 🐳 Docker Hub (Images de production)

```
Utilisateur : krismos64
Registry : krismos64/frontend:latest
         : krismos64/backend:latest
```

**Pour obtenir votre token Docker Hub :**
1. Allez sur [https://hub.docker.com/](https://hub.docker.com/)
2. Connectez-vous avec le compte `krismos64`
3. Account Settings → Security → New Access Token
4. Copiez le token et utilisez-le dans `.env.deploy.local`

### 🗄️ Base de données MySQL (Production)

```
Hôte : db (nom du conteneur Docker)
Depuis l'extérieur : 51.254.102.133:3306 (si port exposé)
Base de données : stakalivres
Utilisateur : root
Mot de passe : StakaRootPass2024!
```

**Connexion depuis le VPS :**
```bash
docker compose exec db mysql -u root -pStakaRootPass2024! stakalivres
```

### 💳 Stripe (Paiements)

```
Mode : PRODUCTION (LIVE)
Dashboard : https://dashboard.stripe.com/
Clé secrète : sk_live_... (dans backend/.env sur le VPS)
Webhook URL : https://livrestaka.fr/payments/webhook
Webhook secret : whsec_... (dans backend/.env sur le VPS)
```

**⚠️ Important** : Les clés Stripe sont en mode LIVE. Toute modification affecte les vrais paiements !

### 📧 SendGrid (Emails)

```
Dashboard : https://app.sendgrid.com/
Clé API : SG.xxx... (dans backend/.env sur le VPS)
Email expéditeur : contact@staka.fr
```

### 🔒 SSL/HTTPS (Let's Encrypt)

```
Certificats : /opt/staka/certs/live/livrestaka.fr/
Expiration : À renouveler tous les 90 jours
Domaines : livrestaka.fr + www.livrestaka.fr
```

**Renouvellement manuel :**
```bash
ssh root@51.254.102.133
docker run --rm -v /opt/staka/certs:/etc/letsencrypt certbot/certbot renew
docker compose restart frontend
```

### 👤 Comptes utilisateurs de test (Base de données)

```
Admin :
Email : admin@test.com
Mot de passe : password

Utilisateur :
Email : user@test.com
Mot de passe : password

Correcteur :
Email : corrector@test.com
Mot de passe : password
```

---

## 🆘 Support et maintenance

### Problèmes fréquents

#### Le site est inaccessible

```bash
# 1. Vérifier que les conteneurs tournent
ssh root@51.254.102.133
docker compose ps

# 2. Vérifier les logs
docker compose logs -f

# 3. Redémarrer les services
docker compose restart

# 4. Si ça ne fonctionne toujours pas, reconstruire
docker compose up -d --build --force-recreate
```

#### Erreur 502 Bad Gateway

```bash
# Généralement, le backend est down
docker compose logs backend

# Redémarrer le backend
docker compose restart backend
```

#### Certificat SSL expiré

```bash
ssh root@51.254.102.133

# Renouveler
docker run --rm -v /opt/staka/certs:/etc/letsencrypt certbot/certbot renew

# Redémarrer nginx
docker compose restart frontend
```

#### Base de données corrompue

```bash
# Restaurer depuis une sauvegarde
docker compose exec db mysql -u root -pStakaRootPass2024! stakalivres < backup-YYYYMMDD.sql
```

### Sauvegardes recommandées

**Créer une sauvegarde complète :**

```bash
# Depuis le VPS
ssh root@51.254.102.133

# Sauvegarde base de données
docker compose exec db mysqldump -u root -pStakaRootPass2024! stakalivres > /opt/staka/backups/db-$(date +%Y%m%d-%H%M).sql

# Sauvegarde fichiers uploadés
tar -czf /opt/staka/backups/uploads-$(date +%Y%m%d-%H%M).tar.gz /opt/staka-livres/backend/uploads

# Sauvegarde configuration
cp /opt/staka-livres/backend/.env /opt/staka/backups/.env-$(date +%Y%m%d-%H%M)
```

**📅 Fréquence recommandée :**
- Base de données : Quotidienne (automatiser avec cron)
- Fichiers uploadés : Hebdomadaire
- Configuration : À chaque modification

### Monitoring

**URLs de surveillance :**
```bash
# Health check backend
curl https://livrestaka.fr/health

# Health check API
curl https://livrestaka.fr/api/tarifs

# Status codes à surveiller :
# 200 = OK
# 500 = Erreur serveur
# 502 = Backend down
# 503 = Service indisponible
```

### Logs et debugging

```bash
# Logs en temps réel
docker compose logs -f

# Logs backend uniquement
docker compose logs -f backend

# Logs frontend uniquement
docker compose logs -f frontend

# Logs base de données
docker compose logs -f db

# 50 dernières lignes
docker compose logs --tail=50 backend
```

### Contact développeur

**Christophe Mostefaoui**
- 🌐 Site web : [christophe-dev-freelance.fr](https://christophe-dev-freelance.fr/)
- 📧 Email : contact@christophe-dev-freelance.fr
- 💼 LinkedIn : [christophe-mostefaoui](https://www.linkedin.com/in/christophe-mostefaoui/)

**Support disponible pour :**
- ✅ Résolution de bugs critiques
- ✅ Assistance technique sur demande
- ✅ Formation aux outils de développement
- ✅ Conseil sur les évolutions futures

---

## 📚 Documentation complémentaire

**Guides techniques disponibles dans `/docs/` :**

- `README.md` : Vue d'ensemble complète du projet
- `docs/docker-workflow.md` : Guide Docker détaillé
- `docs/ADMIN_GUIDE_UNIFIED.md` : Guide administration complète
- `docs/TESTS_COMPLETE_GUIDE.md` : Architecture de tests
- `docs/PAYMENT_INVOICE_SYSTEM_COMPLETE.md` : Système de paiement Stripe
- `docs/WEBHOOK_STRIPE_TROUBLESHOOTING.md` : Dépannage webhooks
- `docs/SSL_RENEWAL_GUIDE.md` : Renouvellement SSL
- `CLAUDE.md` : Guide technique pour développeurs

---

## ✅ Checklist de démarrage

Avant de faire votre première modification, assurez-vous d'avoir :

- [ ] Accès SSH au VPS (testé avec `ssh root@51.254.102.133`)
- [ ] Code source cloné localement
- [ ] Docker Desktop installé et fonctionnel
- [ ] Node.js 18+ installé
- [ ] Environnement local qui démarre (`npm run docker:dev`)
- [ ] Fichier `.env.deploy.local` créé avec vos credentials
- [ ] Sauvegarde de la base de données production effectuée
- [ ] Lecture de ce guide terminée 📖

---

**🎉 Félicitations ! Vous avez maintenant tous les accès pour gérer et modifier votre plateforme Staka Livres.**

**⚠️ Rappel important** : Avant toute modification en production, testez toujours en local et créez une sauvegarde !
