# 🐳 Workflow Docker Staka-Livres

![Production](https://img.shields.io/badge/Status-Production%20Deployed-brightgreen)
![Live](https://img.shields.io/badge/Live-livrestaka.fr-blue)
![Docker](https://img.shields.io/badge/Docker-Multi--arch-blue)
![SSL](https://img.shields.io/badge/SSL-Let's%20Encrypt-green)

Guide complet du workflow Docker dev → prod pour le monorepo Staka-Livres.

**✨ Version 27 Juillet 2025 - Production déployée sur livrestaka.fr**  
**🌐 Production URL** : [livrestaka.fr](https://livrestaka.fr/)  
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

> **🎯 Status** : Production opérationnelle sur https://livrestaka.fr  
> **🔧 Résolutions** : Rollup ARM64/x64 + Volumes isolés + Scripts automatisés  
> **🚀 Déploiement** : VPS OVH avec SSL Let's Encrypt + Auto-update Watchtower

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Configuration développement](#configuration-développement)
- [Configuration production](#configuration-production)
- [Scripts de build et déploiement](#scripts-de-build-et-déploiement)
- [Résolution des problèmes](#résolution-des-problèmes)
- [Bonnes pratiques](#bonnes-pratiques)

## 🏗️ Vue d'ensemble

### Architecture multi-compose optimisée

```
Staka-livres/
├── docker-compose.dev.yml      # 🛠️  Développement (hot-reload + volumes isolés)
├── docker-compose.prod.yml     # 🚀 Production (registry + Watchtower)
├── docker-compose.yml          # 📦 Legacy (déprécié)
├── scripts/
│   ├── dev-reset.sh           # 🔄 Reset complet environnement dev
│   ├── docker-build.sh        # 🔨 Build multi-arch (ARM64/x64) + push
│   ├── deploy-vps.sh          # 🚁 Déploiement VPS automatisé
│   ├── migrate-db.sh          # 🗄️ Migration base de données sécurisée (NOUVEAU)
│   ├── migrate-db-reverse.sh  # 🔄 Migration inverse prod → dev (NOUVEAU)
│   ├── build/
│   │   └── docker-build.sh    # 🔧 Script build alternatif
│   ├── deployment/
│   │   ├── deploy-ovh-production.sh  # 📋 Setup complet VPS OVH
│   │   └── deploy.sh          # 🚀 Script déploiement alternatif
│   └── testing/
│       └── run-e2e-tests.sh   # 🧪 Tests E2E automatisés (NOUVEAU)
└── package.json               # 📝 Scripts npm unifiés + raccourcis
```

### Mapping des ports

| Service  | Dev (local) | Prod (VPS) | Container | Description      |
| -------- | ----------- | ---------- | --------- | ---------------- |
| Frontend | 3000        | 80/443     | 5173      | React + Vite HMR |
| Backend  | 3001        | 3000       | 3000      | Node + Express   |
| MySQL    | 3306        | 3306       | 3306      | Base de données  |

## 🛠️ Configuration développement

### Lancement rapide

```bash
# Option 1: Via npm (recommandé)
npm run docker:dev

# Option 2: Docker compose direct
docker compose -f docker-compose.dev.yml up --build

# Option 3: Hot-reload spécifique
npm run dev:watch
```

### Caractéristiques dev (Résolutions ARM64/x64)

✅ **Hot-reload backend** : nodemon + volumes `delegated`  
✅ **Hot-reload frontend** : Vite HMR sur port 5173  
✅ **Volumes isolés** : `backend_node_modules` + `frontend_node_modules` (résout Rollup ARM64/x64)  
✅ **Image Debian Bookworm** : glibc compatible avec binaires natifs (vs Alpine musl)  
✅ **Réseau isolé** : `staka-dev-net` pour communication inter-services  
✅ **Healthchecks robustes** : `/health` endpoints avec retry et timeout configurés  
✅ **Script reset automatisé** : `./scripts/dev-reset.sh` pour résoudre conflits instantanément

### Accès en développement

- **Frontend** : http://localhost:3000 (Vite dev server)
- **Backend** : http://localhost:3001 (API)
- **MySQL** : localhost:3306 (accès direct)

## 🚀 Configuration production

### Services inclus

```yaml
services:
  - frontend # React build statique (Nginx)
  - backend # Node.js API
  - db # MySQL 8
  - nginx # Reverse proxy + SSL
  - watchtower # Auto-update images
```

### Caractéristiques prod (VPS OVH Production)

✅ **Images multi-arch** : `krismos64/backend:latest` + `krismos64/frontend:latest`  
✅ **Volumes persistants** : `/opt/staka/data/*` mappés sur VPS OVH  
✅ **SSL/TLS** : Let's Encrypt + auto-renewal (certificat jusqu'au 22 oct 2025)  
✅ **Auto-update** : Watchtower poll 5min + cleanup automatique  
✅ **Healthchecks production** : Nginx + Backend + DB avec monitoring  
✅ **Reverse proxy** : Nginx optimisé + headers sécurité + compression gzip  
✅ **Déploiement automatisé** : Script complet VPS OVH avec sauvegarde pré-déploiement

### Variables d'environnement

Créez `/opt/staka-livres/.env.prod` sur le VPS :

```env
# Base de données (Production OVH)
MYSQL_ROOT_PASSWORD=StakaRootPass2024!
MYSQL_PASSWORD=staka.ed2020Livres
DATABASE_URL="mysql://staka:staka.ed2020Livres@db:3306/stakalivres"

# Application
BACKEND_URL=https://livrestaka.fr
FRONTEND_URL=https://livrestaka.fr
NODE_ENV=production
JWT_SECRET="production_jwt_secret_change_me"

# Emails centralisés (OBLIGATOIRE)
SENDGRID_API_KEY="SG.votre_cle_production"
FROM_EMAIL="noreply@livrestaka.fr"
FROM_NAME="Staka Livres"
ADMIN_EMAIL="admin@livrestaka.fr"
SUPPORT_EMAIL="support@livrestaka.fr"
APP_URL="https://livrestaka.fr"

# Stripe Production
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AWS S3 (optionnel)
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="eu-west-3"
AWS_S3_BUCKET="staka-livres-files-prod"

# Registry
DOCKER_REGISTRY=krismos64
TAG=latest
```

## 🔨 Scripts de build et déploiement automatisés

### Build local et multi-arch (ARM64 + x64)

```bash
# Build développement (local) - Support ARM64/x64
npm run docker:build dev

# Build production avec push vers registry
npm run docker:build:push

# Build service spécifique
./scripts/docker-build.sh v1.4.0 --push --service backend

# Build multi-architecture complet (recommandé)
./scripts/docker-build.sh latest --push --platform linux/amd64,linux/arm64

# Reset complet environnement dev (résout problèmes Rollup)
./scripts/dev-reset.sh
./scripts/dev-reset.sh --frontend-only  # Reset seulement frontend
./scripts/dev-reset.sh --keep-volumes   # Reset sans supprimer volumes
```

### Migration base de données sécurisée (NOUVEAU 2025)

```bash
# Migration dev → prod avec sauvegarde automatique
npm run migrate:db
./scripts/migrate-db.sh --force

# Migration inverse prod → dev (synchronisation locale)
npm run migrate:db:reverse
./scripts/migrate-db-reverse.sh --dry-run

# Options avancées migration
./scripts/migrate-db.sh --schema-only     # Schéma uniquement
./scripts/migrate-db.sh --dry-run         # Simulation
./scripts/migrate-db.sh --source-env dev  # Source spécifique
```

### Tests E2E automatisés (NOUVEAU 2025)

```bash
# Exécution complète des tests E2E avec préparation DB
./scripts/testing/run-e2e-tests.sh

# Tests par niveau de criticité
npm run test:e2e:critical    # Tests critiques uniquement
npm run test:e2e:smoke      # Tests de fumée rapides
npm run test:e2e:integration # Tests d'intégration complets
```

### Déploiement VPS automatisé

```bash
# Configuration initiale (.env.deploy)
cp .env.deploy.example .env.deploy
# Éditez .env.deploy avec vos credentials VPS

# Déploiement simple (latest)
npm run deploy:vps

# Déploiement avec version spécifique + sauvegarde automatique
./scripts/deploy-vps.sh v1.4.0

# Test de déploiement (simulation)
npm run deploy:vps:dry

# Déploiement sans sauvegarde (plus rapide)
./scripts/deploy-vps.sh latest --no-backup

# Setup complet VPS OVH (première installation)
./scripts/deployment/deploy-ovh-production.sh
```

### Variables .env.deploy (Production OVH)

```env
# VPS OVH Configuration (Production Ready)
VPS_HOST=51.254.102.133
VPS_USER=root
VPS_PASSWORD=staka2020

# Docker Registry (Multi-arch Support)
DOCKERHUB_USER=krismos64
DOCKERHUB_TOKEN=dckr_pat_xxxxx
DOCKER_REGISTRY=krismos64

# SSH Configuration
SSH_KEY_PATH=~/.ssh/id_rsa

# Backup Settings (Auto-backup avant déploiement)
BACKUP_RETENTION_DAYS=7
BACKUP_PATH=/opt/staka-livres/backups

# Monitoring
MONITORING_EMAIL=admin@livrestaka.fr
HEALTH_CHECK_INTERVAL=300
```

## 🔧 Résolution des problèmes

### Erreur "Port déjà utilisé"

**Symptômes** :

```
Error: bind for 0.0.0.0:3000 failed: port is already allocated
```

**Solutions** :

1. **Scanner les ports occupés** :

```bash
# macOS/Linux
lsof -i :3000
netstat -tulpn | grep :3000

# Windows
netstat -ano | findstr :3000
```

2. **Tuer les processus** :

```bash
# Processus Node.js
pkill -f "node.*3000"

# Ou spécifique
kill -9 <PID>
```

3. **Alternative : changer les ports** :

```bash
# Modifier docker-compose.dev.yml temporairement
ports:
  - "3002:5173"  # au lieu de 3000:5173
```

### 💡 Erreur Rollup native (ARM64/x64, musl/glibc) - **RÉSOLU**

**Symptômes** :

```
Error: Cannot find module '@rollup/rollup-linux-x64-musl'
Error: Cannot find module '@rollup/rollup-darwin-arm64'
Cannot find module '@esbuild/darwin-arm64'
```

**Cause** : Le bind-mount `./frontend:/app` écrase les `node_modules` Linux natifs générés dans l'image Docker. Rollup et esbuild ont besoin de leurs binaires spécifiques à l'architecture (ARM64 vs x64) et à la libc (musl vs glibc).

**Solutions implémentées** :

1. **Volumes isolés** (solution principale) :

```yaml
# docker-compose.dev.yml - Configuration actuelle
volumes:
  - ./frontend:/app:delegated                    # code source (hot-reload)
  - frontend_node_modules:/app/node_modules      # dépendances Linux ARM64/x64 isolées
  - ./shared:/shared:delegated                   # types partagés
volumes:
  frontend_node_modules:  # Volume nommé pour isolation complète
  backend_node_modules:   # Idem pour backend
```

2. **Script de reset automatisé** :

```bash
# Reset complet avec detection conflits
./scripts/dev-reset.sh

# Reset frontend uniquement (plus rapide)
./scripts/dev-reset.sh --frontend-only

# Reset sans supprimer les volumes (garde les dépendances)
./scripts/dev-reset.sh --keep-volumes

# Le script détecte automatiquement :
# - Les conflits de ports
# - Les containers en échec
# - Les volumes corrompus
# - Les images obsolètes
```

3. **Image Debian Bookworm** (vs Alpine) :

```dockerfile
# frontend/Dockerfile.dev - Base glibc au lieu de musl
FROM node:18-bookworm-slim
# Compatible avec binaires natifs Rollup/esbuild
```

### Problèmes de volumes et caches - **AUTOMATISÉ**

**Symptômes** :

- Modifications non reflétées (cache Vite/esbuild)
- `node_modules` corrompus (mélange host/container)
- Erreurs de build étranges (architecture mixte)
- Services qui ne démarrent pas (healthcheck fail)

**Solutions automatisées** :

```bash
# Solution ONE-CLICK (recommandée)
./scripts/dev-reset.sh
# 📋 Le script fait automatiquement :
# 1. Arrêt propre des containers
# 2. Suppression volumes Docker (-v)
# 3. Nettoyage node_modules host
# 4. Rebuild images avec cache propre
# 5. Démarrage + vérification healthchecks

# Solutions spécifiques
./scripts/dev-reset.sh --frontend-only     # Problème Vite uniquement
./scripts/dev-reset.sh --keep-volumes      # Garde les volumes (plus rapide)

# Solution manuelle (si script indisponible)
docker compose -f docker-compose.dev.yml down -v
docker system prune -f --volumes
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up

# Vérification détection automatique conflits
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :3306  # MySQL
```

### Healthcheck failures

**Diagnostic** :

```bash
# Logs des services
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend

# Test manuel des endpoints
curl -f http://localhost:3001/health
curl -f http://localhost:3000/
```

**Corrections courantes** :

- Vérifier que `/health` renvoie 200
- Ajuster les `start_period` si services lents
- Valider la connectivité réseau entre containers

### 7. **Tests Frontend Échouent (Architecture Séparée)**

**Symptôme :**

```
Network Error - connect ECONNREFUSED 127.0.0.1:3001
Tests d'intégration échouent en CI/CD
```

**Solutions :**

```bash
# Vérifier type de tests à exécuter
docker compose -f docker-compose.dev.yml exec frontend npm run test:unit        # CI/CD
docker compose -f docker-compose.dev.yml exec frontend npm run test:integration # Local seulement

# Vérifier configuration Vitest
docker compose -f docker-compose.dev.yml exec frontend cat vite.config.ts
docker compose -f docker-compose.dev.yml exec frontend cat vite.config.integration.ts

# Vérifier exclusions tests intégration
docker compose -f docker-compose.dev.yml exec frontend npx vitest list --config vite.config.ts

# Redémarrer services pour tests intégration
docker compose -f docker-compose.dev.yml restart backend
docker compose -f docker-compose.dev.yml exec frontend npm run test:integration

# Vérifier connectivité backend
docker compose -f docker-compose.dev.yml exec frontend wget -qO- http://staka_backend_dev:3000/health || echo "Backend non accessible"

# Debug tests unitaires isolés
docker compose -f docker-compose.dev.yml exec frontend npm run test:unit -- --reporter=verbose --no-coverage
```

**Architecture recommandée :**

```bash
# En développement local
docker compose -f docker-compose.dev.yml up -d                    # Tous services
docker compose -f docker-compose.dev.yml exec frontend npm run test:all       # Tous tests

# En CI/CD GitHub Actions
npm run test:unit                                   # Tests unitaires seulement

# Debug spécifique
docker compose -f docker-compose.dev.yml exec frontend npm run test:unit -- --run --reporter=verbose
docker compose -f docker-compose.dev.yml exec frontend npm run test:integration -- --run --reporter=verbose
```

### 8. **Emails Ne S'Envoient Pas (Système Centralisé)**

**Symptôme :**

```
[EmailQueue] ❌ Erreur envoi email: Invalid API key
[EventBus] ⚠️ Listener adminNotificationEmailListener failed
```

**Solutions :**

```bash
# Vérifier configuration SendGrid complète
docker compose -f docker-compose.dev.yml exec backend env | grep SENDGRID
docker compose -f docker-compose.dev.yml exec backend env | grep FROM_EMAIL
docker compose -f docker-compose.dev.yml exec backend env | grep ADMIN_EMAIL
docker compose -f docker-compose.dev.yml exec backend env | grep SUPPORT_EMAIL

# Tester configuration email
docker compose -f docker-compose.dev.yml exec backend node -e "
  console.log('SENDGRID_API_KEY:', !!process.env.SENDGRID_API_KEY);
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
"

# Vérifier EventBus listeners
docker compose -f docker-compose.dev.yml exec backend node -e "
  const { eventBus } = require('./dist/events/eventBus');
  console.log('Event listeners:', eventBus.eventNames());
"

# Tester émission événement
docker compose -f docker-compose.dev.yml exec backend node -e "
  const { eventBus } = require('./dist/events/eventBus');
  eventBus.emit('admin.notification.created', {
    title: 'Test Docker Dev',
    message: 'Test depuis container dev',
    type: 'INFO'
  });
  console.log('✅ Événement émis');
"

# Vérifier templates disponibles
docker compose -f docker-compose.dev.yml exec backend find src/emails/templates/ -name "*.hbs" -type f
```

### Problèmes de build multi-arch - **OPTIMISÉ**

**Support ARM64 + x64 intégré** :

```bash
# Build automatique multi-arch (script)
./scripts/docker-build.sh latest --push
# 📋 Configure automatiquement :
# - Docker buildx multi-platform
# - Cache registry pour accélération
# - Plateforme linux/amd64,linux/arm64
# - Vérification prérequis

# Build plateforme spécifique
./scripts/docker-build.sh dev --platform linux/amd64
./scripts/docker-build.sh dev --platform linux/arm64

# Build service spécifique
./scripts/docker-build.sh latest --service frontend --push

# Debug build multi-platform avec logs verbeux
DOCKER_BUILDKIT=1 ./scripts/docker-build.sh dev --platform linux/amd64,linux/arm64

# Vérification buildx
docker buildx inspect default --bootstrap
docker buildx ls

# Images disponibles sur registry
docker manifest inspect krismos64/frontend:latest
docker manifest inspect krismos64/backend:latest
```

### Outils de Débogage

#### Container Shell Access

```bash
# Accès shell backend
docker compose -f docker-compose.dev.yml exec backend sh

# Accès shell frontend (Nginx)
docker compose -f docker-compose.dev.yml exec frontend sh

# Accès MySQL
docker compose -f docker-compose.dev.yml exec db mysql -u root -proot stakalivres
```

#### Debug Build Process

```bash
# Build avec logs verbeux
DOCKER_BUILDKIT=1 docker compose -f docker-compose.dev.yml build --progress=plain frontend

# Validation configuration
docker compose -f docker-compose.dev.yml config

# Test connexions réseau
docker compose -f docker-compose.dev.yml exec backend ping db
docker compose -f docker-compose.dev.yml exec frontend ping staka_backend_dev

# Vérifier variables environnement
docker compose -f docker-compose.dev.yml exec backend env | grep DATABASE
docker compose -f docker-compose.dev.yml exec frontend env | grep VITE
```

## 🎯 Bonnes pratiques optimisées

### Workflow développement (ARM64/x64)

1. **Toujours utiliser dev compose avec reset** :

   ```bash
   npm run docker:dev              # ✅ Correct (hot-reload garanti)
   ./scripts/dev-reset.sh          # 🔄 En cas de problème (ONE-CLICK)
   docker compose up               # ❌ Ancien, mélange dev/prod
   docker-compose up               # ❌ Déprécié (v1)
   ```

2. **Vérification automatique des conflits** :

   ```bash
   # Le script docker-build.sh scanne automatiquement
   ./scripts/docker-build.sh dev   # Détecte ports 3000, 3001, 3306
   ./scripts/dev-reset.sh          # Vérifie + résout conflits
   ```

3. **Nettoyage intelligent automatisé** :

   ```bash
   # Nettoyage sélectif (garde les caches utiles)
   ./scripts/dev-reset.sh --keep-volumes

   # Nettoyage complet hebdomadaire
   docker system prune -f --volumes
   docker builder prune -f

   # Nettoyage automatique dans scripts
   ./scripts/docker-build.sh       # Nettoie avant build
   ./scripts/deploy-vps.sh         # Nettoie sur VPS avant déploiement
   ```

### Workflow production automatisé

1. **Pipeline de déploiement sécurisé** :

   ```bash
   # 1. Build multi-arch local + tests
   ./scripts/docker-build.sh v1.4.0 --push

   # 2. Simulation déploiement (safe)
   ./scripts/deploy-vps.sh v1.4.0 --dry-run

   # 3. Déploiement réel avec sauvegarde automatique
   ./scripts/deploy-vps.sh v1.4.0

   # 4. Setup complet VPS (première fois)
   ./scripts/deployment/deploy-ovh-production.sh
   ```

2. **Sauvegarde et recovery automatisés** :

   ```bash
   # Sauvegarde avant chaque déploiement (automatique)
   # - Base de données MySQL complet
   # - Configuration .env + nginx
   # - Certificats SSL
   # - Rétention : 5 dernières + 30 jours

   # Sauvegarde manuelle
   ssh root@51.254.102.133 '/usr/local/bin/staka-backup.sh'

   # Recovery d'urgence
   ssh root@51.254.102.133 'cd /opt/staka-livres && ./restore-backup.sh YYYYMMDD_HHMMSS'
   ```

3. **Monitoring production avancé** :

   ```bash
   # Statut services en temps réel
   ssh root@51.254.102.133 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml ps'

   # Logs structurés par service
   ssh root@51.254.102.133 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml logs -f backend'
   ssh root@51.254.102.133 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml logs -f frontend'

   # Tests connectivité automatiques
   curl -I https://livrestaka.fr/health
   curl -I https://livrestaka.fr/api/health

   # Monitoring SSL
   openssl s_client -connect livrestaka.fr:443 -servername livrestaka.fr < /dev/null 2>/dev/null | openssl x509 -noout -dates
   ```

### Sécurité production renforcée

1. **Fichiers sensibles (JAMAIS commit)** :

   ```bash
   # Ajoutés automatiquement au .gitignore
   .env.deploy                    # Credentials VPS OVH
   backend/.env.prod             # Secrets production
   ~/.ssh/id_rsa*                # Clés SSH privées

   # Vérification avant commit
   git status | grep -E '\.(env|key|pem)$'
   ```

2. **Rotation des secrets automatisée** :

   ```bash
   # Docker Hub Token (6 mois)
   DOCKERHUB_TOKEN=dckr_pat_xxxxx  # Générer nouveau token

   # MySQL passwords (forts + rotation)
   MYSQL_ROOT_PASSWORD="$(openssl rand -base64 32)"
   MYSQL_PASSWORD="$(openssl rand -base64 24)"

   # JWT Secret (64 caractères minimum)
   JWT_SECRET="$(openssl rand -base64 64)"
   ```

3. **VPS OVH sécurisé** :

   ```bash
   # Configuration automatique par deploy-ovh-production.sh
   # - Clés SSH uniquement (désactive mot de passe)
   # - Fail2ban actif (3 tentatives = ban 1h)
   # - UFW firewall (22, 80, 443 uniquement)
   # - SSL Let's Encrypt + auto-renewal
   # - Headers sécurité Nginx

   # Vérification sécurité
   ssh root@51.254.102.133 'ufw status verbose'
   ssh root@51.254.102.133 'fail2ban-client status'
   curl -I https://livrestaka.fr | grep -E "(X-Frame|X-Content|Strict-Transport)"
   ```

## 📈 Monitoring et Logs

### Health checks automatiques

Les compose files incluent des healthchecks pour tous les services :

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Performance Docker

```bash
# Stats containers en temps réel
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Inspection détaillée
docker system df
docker system events --filter container=staka_frontend_dev

# Monitoring ressources spécifiques
docker inspect staka-livres-frontend:latest
docker images ls
```

### Logs Avancés

```bash
# Logs par service avec filtres
docker compose -f docker-compose.dev.yml logs -f frontend | grep ERROR
docker compose -f docker-compose.dev.yml logs -f backend | grep "[EventBus]"
docker compose -f docker-compose.dev.yml logs -f backend | grep "[EmailQueue]"

# Logs système d'emails centralisé
docker compose -f docker-compose.dev.yml logs -f backend | grep "\[EmailListener\]"

# Export logs pour analyse
docker compose -f docker-compose.dev.yml logs --no-color > dev-logs-$(date +%Y%m%d).log

# Logs structurés avec Winston
docker compose -f docker-compose.dev.yml logs backend --tail 100 -f
docker compose -f docker-compose.dev.yml logs frontend --tail 100 -f
```

### Monitoring Emails Spécifique

```bash
# Vérification EventBus en temps réel
docker compose -f docker-compose.dev.yml exec backend node -e "
  const { eventBus } = require('./dist/events/eventBus');
  console.log('EventBus listeners:', eventBus.eventNames());
  console.log('Max listeners:', eventBus.getMaxListeners());
"

# Vérification templates emails
docker compose -f docker-compose.dev.yml exec backend ls -la src/emails/templates/

# Test envoi email (dev)
docker compose -f docker-compose.dev.yml exec backend node -e "
  const { MailerService } = require('./dist/services/MailerService');
  MailerService.sendEmail({
    to: 'test@example.com',
    subject: 'Test Docker Dev',
    html: '<h1>Test email système</h1>'
  }).then(() => console.log('✅ Email envoyé'))
    .catch(err => console.error('❌115 Erreur:', err));
"
```

### Métriques de performance

Watchtower fournit des mises à jour automatiques, mais surveillez :

- Utilisation CPU/RAM des containers
- Espace disque `/opt/staka/*`
- Temps de réponse des healthchecks
- Taille des logs (`/opt/staka/logs/*`)

### Backup Base de Données

```bash
# Backup automatisé
docker exec staka_db mysqldump -u root -proot stakalivres > backup-$(date +%Y%m%d).sql

# Restauration
docker exec -i staka_db mysql -u root -proot stakalivres < backup-20250112.sql
```

---

## 🔧 **Scripts Automatisés Avancés**

### Script dev-reset.sh - Reset ONE-CLICK

```bash
#!/usr/bin/env bash
# Résout TOUS les problèmes ARM64/x64, volumes, caches d'un coup

./scripts/dev-reset.sh
# 📋 Fait automatiquement :
# 1. Arrêt propre containers
# 2. Suppression volumes corrompus
# 3. Nettoyage node_modules host (ARM64/x64)
# 4. Rebuild images avec cache propre
# 5. Redémarrage + vérification healthchecks

# Options avancées
./scripts/dev-reset.sh --frontend-only    # Plus rapide, problème Vite uniquement
./scripts/dev-reset.sh --keep-volumes     # Garde les volumes (économise du temps)
```

### Script docker-build.sh - Build Multi-arch

```bash
#!/usr/bin/env bash
# Build optimisé multi-architecture avec détection conflits

./scripts/docker-build.sh latest --push
# 📋 Fait automatiquement :
# 1. Vérification Docker buildx
# 2. Scan conflits ports (3000, 3001, 3306)
# 3. Build linux/amd64,linux/arm64
# 4. Cache registry pour accélération
# 5. Push vers krismos64/backend:latest

# Build service spécifique
./scripts/docker-build.sh v1.4.0 --service backend --push
```

### Script deploy-vps.sh - Déploiement Sécurisé

```bash
#!/usr/bin/env bash
# Déploiement VPS avec sauvegarde automatique

./scripts/deploy-vps.sh latest
# 📋 Fait automatiquement :
# 1. Test connexion SSH VPS
# 2. Sauvegarde MySQL + config
# 3. Pull nouvelles images
# 4. Arrêt gracieux services
# 5. Redémarrage + vérification healthchecks
# 6. Tests post-déploiement

# Mode simulation sécurisé
./scripts/deploy-vps.sh v1.4.0 --dry-run
```

## 📧 **Configuration Système d'Emails Centralisé**

### Architecture Événementielle

- **EventBus centralisé** avec listeners spécialisés
- **Double notification** : Interface clochette + Email automatique
- **Queue asynchrone** pour traitement emails
- **22 templates HTML** professionnels par type

### Initialisation EventBus et Listeners

```typescript
// src/app.ts - Chargement automatique des listeners
import "./listeners/adminNotificationEmailListener";
import "./listeners/userNotificationEmailListener";

// src/events/eventBus.ts - EventBus global
import { EventEmitter } from "events";
export const eventBus = new EventEmitter();
eventBus.setMaxListeners(50); // Augmenter pour production
```

### Configuration Queue Emails (Optionnel)

```yaml
# docker-compose.prod.yml - Service Redis pour queue emails
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  backend:
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

volumes:
  redis_data:
```

## 📋 **Checklist Déploiement Production OVH**

### 🎯 **Phases de Déploiement Complètes**

#### **Phase 1 : Préparation VPS OVH**

```bash
# Configuration initiale serveur
ssh root@51.254.102.133
apt update && apt upgrade -y
apt install -y curl wget git vim htop fail2ban ufw

# Firewall
ufw allow ssh && ufw allow http && ufw allow https && ufw enable

# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
systemctl enable docker
```

#### **Phase 2 : Configuration SSL Let's Encrypt**

```bash
# Installation Certbot
apt install -y snapd
snap install core && snap refresh core
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot

# Génération certificats (domaine livrestaka.fr)
certbot certonly --standalone \
  -d livrestaka.fr \
  -d www.livrestaka.fr \
  --email admin@livrestaka.fr \
  --agree-tos --no-eff-email

# Renouvellement automatique
certbot renew --dry-run
```

#### **Phase 3 : Tests Validation Production**

```bash
# Tests connectivité HTTPS
curl -I https://livrestaka.fr                  # → 200 OK
curl -I https://livrestaka.fr/api/health       # → 200 OK
curl -I http://livrestaka.fr                   # → 301 Redirect

# Tests fonctionnels
# Test contact public
curl -X POST https://livrestaka.fr/api/public/contact \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","email":"test@example.com","sujet":"Test prod","message":"Validation"}'

# Test authentification
curl -X POST https://livrestaka.fr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@staka-editions.com","password":"admin123"}'
```

#### **Phase 4 : Sécurité et Audit**

```bash
# Audit sécurité serveur
nmap -sT -O localhost
fail2ban-client status
ufw status verbose

# Test rate limiting (auth)
for i in {1..12}; do
  curl -X POST https://livrestaka.fr/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "Request $i: %{http_code}\n"
done
# → Doit bloquer après la 10ème requête

# Test headers sécurité
curl -I https://livrestaka.fr | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"
```

### 📈 **Scripts de Monitoring Automatisés**

#### **Script de Monitoring (`/opt/staka-livres/scripts/monitor.sh`)**

```bash
#!/bin/bash
# Monitoring complet Staka Livres

LOG_FILE="/opt/staka-livres/monitoring.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Début monitoring" >> $LOG_FILE

# Vérification containers
docker compose -f docker-compose.prod.yml ps --format "table {{.Names}}\t{{.Status}}"

# Vérification espace disque
df -h / | tail -1

# Vérification SSL (expiration)
DAYS_LEFT=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/livrestaka.fr/cert.pem | cut -d= -f2 | xargs -I {} date -d {} +%s)
NOW=$(date +%s)
DAYS=$((($DAYS_LEFT - $NOW) / 86400))
echo "[$DATE] Certificat SSL expire dans $DAYS jours" >> $LOG_FILE

# Test connectivité application
if curl -f -s https://livrestaka.fr/api/health > /dev/null; then
    echo "[$DATE] ✅ Application healthy" >> $LOG_FILE
else
    echo "[$DATE] ❌ Application DOWN - ALERT!" >> $LOG_FILE
    # Ici : envoyer alerte email
fi

echo "[$DATE] Fin monitoring" >> $LOG_FILE
```

#### **Script de Sauvegarde (`/opt/staka-livres/scripts/backup.sh`)**

```bash
#!/bin/bash
# Sauvegarde automatique MySQL + fichiers

BACKUP_DIR="/opt/staka-livres/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="stakalivres"

mkdir -p $BACKUP_DIR

# Sauvegarde MySQL
docker compose -f docker-compose.prod.yml exec -T db mysqldump \
  -u staka \
  -pstaka.ed2020Livres \
  --single-transaction \
  --routines \
  --triggers \
  $DB_NAME > $BACKUP_DIR/mysql_backup_$DATE.sql

# Compression
gzip $BACKUP_DIR/mysql_backup_$DATE.sql

# Sauvegarde fichiers uploads (si AWS S3 non utilisé)
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /opt/staka-livres/uploads/ 2>/dev/null || true

# Nettoyage sauvegardes > 7 jours
find $BACKUP_DIR -name "*_backup_*.gz" -mtime +7 -delete

echo "Sauvegarde terminée : mysql_backup_$DATE.sql.gz"
```

#### **Configuration Cron Jobs**

```bash
# Éditer crontab
crontab -e

# Ajouter les tâches automatisées
# Monitoring toutes les heures
0 * * * * /opt/staka-livres/scripts/monitor.sh

# Sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/staka-livres/scripts/backup.sh

# Nettoyage logs Docker hebdomadaire
0 3 * * 0 docker system prune -f --volumes
```

### 📊 **Checklist de Validation Finale**

#### **✅ Indicateurs de Succès**

- [ ] **Connectivité HTTPS** : Site accessible avec certificat valide (Grade A+ SSL Labs)
- [ ] **API fonctionnelle** : Tous endpoints → 200 OK (`/health`, `/api/health`)
- [ ] **Base de données** : MySQL healthy + migrations appliquées + seed exécuté
- [ ] **Stripe intégration** : Webhooks reçus et traités correctement
- [ ] **RGPD complet** : Export (`/api/users/me/export`) + suppression fonctionnels
- [ ] **Système emails** : SendGrid opérationnel, emails reçus sur ADMIN_EMAIL
- [ ] **Sécurité renforcée** : Rate limiting actif, headers sécurité, firewall config
- [ ] **Audit logs** : Traçabilité complète (`/admin/audit-logs`)
- [ ] **SSL/TLS** : HSTS activé, redirection HTTP → HTTPS automatique
- [ ] **Monitoring** : Scripts surveillance + backup + cron jobs configurés
- [ ] **Performance** : Temps réponse < 2s, ressources optimisées
- [ ] **Docker** : Tous containers healthy, restart policy `unless-stopped`

#### **🎯 Métriques de Performance**

| Métrique                | Objectif     | Validation                                        |
| ----------------------- | ------------ | ------------------------------------------------- |
| **Temps chargement**    | < 2 secondes | `curl -w "%{time_total}\n" https://livrestaka.fr` |
| **SSL Score**           | Grade A+     | SSL Labs Test                                     |
| **Uptime containers**   | 99.9%        | `docker compose -f docker-compose.prod.yml ps`    |
| **Espace disque libre** | > 20%        | `df -h /`                                         |
| **Mémoire disponible**  | > 500MB      | `free -h`                                         |
| **CPU utilisation**     | < 70%        | `htop`                                            |

### 🆘 **Procédures de Maintenance Production**

#### **Mise à jour Application**

```bash
# Sauvegarde préventive
/opt/staka-livres/scripts/backup.sh

# Mise à jour depuis repository
cd /opt/staka-livres
git pull origin main

# Rebuild et redéploiement
./scripts/docker-build.sh latest --push
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Vérification post-déploiement
curl -I https://livrestaka.fr/health
docker compose -f docker-compose.prod.yml ps
```

#### **Restauration d'Urgence**

```bash
# Arrêt services
docker compose -f docker-compose.prod.yml down

# Restauration base de données
gunzip < backups/mysql_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db mysql -u staka -pstaka.ed2020Livres stakalivres

# Redémarrage complet
docker compose -f docker-compose.prod.yml up -d

# Vérification
docker compose -f docker-compose.prod.yml logs -f
```

---

## 🆘 Support

En cas de problème non résolu :

1. **Vérifier les logs** détaillés de chaque service
2. **Tester les healthchecks** manuellement
3. **Simuler le déploiement** avec `--dry-run`
4. **Consulter les troubleshooting** spécialisés ci-dessus
5. **Vérifier la documentation** Docker Compose officielle

### Pour Claude Code - Reprise de Session

**Application Docker Staka-Livres - STATUS : ✅ PRODUCTION OPÉRATIONNELLE + OPTIMISÉE**

- ✅ **Problèmes Rollup ARM64/x64 RÉSOLUS** : Volumes isolés + Debian Bookworm + scripts reset
- ✅ **Hot-reload garanti multi-arch** : Vite HMR + nodemon + detection conflits automatique
- ✅ **Scripts automatisés avancés** : Build multi-arch, déploiement sécurisé, reset ONE-CLICK
- ✅ **Production déployée stable** : `https://livrestaka.fr` avec SSL + auto-update Watchtower
- ✅ **Tests E2E complets** : Architecture 3 niveaux (critical/smoke/integration)
- ✅ **Documentation mise à jour** : Guides consolidés + troubleshooting complet
- ✅ **Déploiement VPS automatisé** : Script setup complet OVH + monitoring

**Améliorations récentes (26 juillet 2025) :**

- Images et footer intégrés en production
- Workflow Docker optimisé ARM64/x64
- Scripts de déploiement sécurisés avec backup automatique
- Tests avancés de sécurité et workflow
- Architecture dev/prod parfaitement séparée

## 🚀 État du Déploiement Production

### ✅ **Application HTTPS Opérationnelle - 26 Juillet 2025**

**🎉 DÉPLOIEMENT COMPLET RÉUSSI + OPTIMISATIONS !**

- **Site web** : `https://livrestaka.fr` ✅ Fonctionnel avec images et footer
- **API Backend** : `https://livrestaka.fr/api/health` ✅ Opérationnelle
- **Base de données** : MySQL 8.0 ✅ Healthy avec seed production complet
- **Certificats SSL** : Let's Encrypt ✅ Valides jusqu'au 22 octobre 2025
- **Redirection HTTPS** : HTTP → HTTPS automatique ✅
- **Configuration nginx** : Proxy optimisé + headers sécurité + compression ✅
- **Tests E2E** : Cypress tests critiques + smoke + intégration ✅
- **Workflow Docker** : ARM64/x64 + volumes isolés + scripts automatisés ✅

### 🏆 **Services Docker Production (Images Multi-arch)**

| Service        | Status     | Port      | Health  | Détails                          | Architecture      |
| -------------- | ---------- | --------- | ------- | -------------------------------- | ----------------- |
| **MySQL**      | ✅ Running | 3306      | Healthy | Seed complet + backup quotidien  | linux/amd64       |
| **Backend**    | ✅ Running | 3001→3000 | Healthy | API + EventBus + Emails + Tests  | linux/amd64,arm64 |
| **Frontend**   | ✅ Running | 3000→80   | Running | React + Vite + images optimisées | linux/amd64,arm64 |
| **Nginx**      | ✅ Running | 80, 443   | Healthy | SSL + HTTP/2 + Headers + Gzip    | linux/amd64       |
| **Watchtower** | ✅ Running | -         | Healthy | Auto-update 5min + cleanup       | linux/amd64,arm64 |

### 🔐 **Accès Admin Production**

- **Email** : `admin@staka-editions.com`
- **Mot de passe** : `admin123`
- **Rôle** : ADMIN (accès complet interface)

### 🌐 **Configuration VPS OVH**

- **VPS** : `51.254.102.133` (OVH)
- **Domaine** : `livrestaka.fr` + `www.livrestaka.fr`
- **SSH** : `root@51.254.102.133` (mot de passe: staka2020)
- **Projet Path** : `/opt/staka-livres/`
- **Images Registry** : `krismos64/backend:latest` & `krismos64/frontend:latest`

### 📋 **Workflow de Déploiement Standard**

```bash
# 1. Modifications locales + Git
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# 2. Build et Push Docker Images
./scripts/docker-build.sh latest --push

# 3. Déploiement VPS (automatique avec Watchtower OU manuel)
./scripts/deploy-vps.sh latest
```

### 🔧 **Commandes de Debug Production**

```bash
# Statut des services
ssh root@51.254.102.133 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml ps'

# Logs en temps réel
ssh root@51.254.102.133 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml logs -f'

# Tester l'app directement
curl -H "Host: livrestaka.fr" http://51.254.102.133/

# Redémarrer un service
ssh root@51.254.102.133 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml restart nginx'

# Accès base de données
ssh root@51.254.102.133 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml exec db mysql -u staka -pstaka.ed2020Livres stakalivres'
```

### 📊 **Tests de Fonctionnement Production**

```bash
# ✅ Application HTTPS complète accessible
curl -I https://livrestaka.fr/

# ✅ API Backend HTTPS fonctionnelle
curl -I https://livrestaka.fr/api/health

# ✅ Redirection HTTP → HTTPS automatique
curl -I http://livrestaka.fr/

# ✅ Base de données connectée
ssh root@51.254.102.133 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml exec backend npm run prisma:seed'
```

### 🔄 **Migrations Base de Données**

```bash
# Si changements schéma Prisma
ssh root@51.254.102.133 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml exec backend npx prisma db push'
```

### 📂 **Synchronisation Fichiers Config**

```bash
# Nginx, docker-compose, etc.
scp nginx/sites/staka-livres.conf root@51.254.102.133:/opt/staka-livres/nginx/sites/
scp docker-compose.prod.yml root@51.254.102.133:/opt/staka-livres/
```

### 🗄️ **Nouveaux Scripts de Migration Database (Juillet 2025)**

#### **Migration Sécurisée Dev → Prod**

```bash
# Script: ./scripts/migrate-db.sh
# Fonctionnalités : Sauvegarde automatique + Migration sécurisée + Rollback

# Migration standard avec sauvegarde
./scripts/migrate-db.sh --force

# Options avancées
./scripts/migrate-db.sh --schema-only     # Structure uniquement
./scripts/migrate-db.sh --dry-run         # Simulation sans modifications
./scripts/migrate-db.sh --source-env dev  # Source spécifique

# Variables requises dans .env.deploy
VPS_HOST=51.254.102.133
VPS_USER=root
BACKUP_RETENTION_DAYS=7
```

#### **Migration Inverse Prod → Dev**

```bash
# Script: ./scripts/migrate-db-reverse.sh
# Fonctionnalités : Synchronisation données production vers développement

# Synchronisation complète prod → dev
./scripts/migrate-db-reverse.sh --force

# Simulation sans modifications
./scripts/migrate-db-reverse.sh --dry-run

# Sauvegarde locale automatique avant sync
# Rétention configurée : 7 jours par défaut
```

#### **Tests E2E Automatisés**

```bash
# Script: ./scripts/testing/run-e2e-tests.sh
# Fonctionnalités : Préparation DB + Tests Cypress complets

# Exécution complète avec logs colorés
./scripts/testing/run-e2e-tests.sh

# Le script exécute automatiquement :
# 1. Vérification environnement
# 2. Préparation base de données
# 3. Tests critique/smoke/integration
# 4. Rapport de résultats
# 5. Nettoyage post-tests
```

#### **Scripts Package.json Mis à Jour**

```json
{
  "scripts": {
    // Scripts existants...
    "migrate:db": "./scripts/migrate-db.sh",
    "migrate:db:schema": "./scripts/migrate-db.sh --schema-only",
    "migrate:db:dry": "./scripts/migrate-db.sh --dry-run",
    "migrate:db:reverse": "./scripts/migrate-db-reverse.sh",
    "migrate:db:reverse:dry": "./scripts/migrate-db-reverse.sh --dry-run",
    "test:e2e": "./scripts/testing/run-e2e-tests.sh"
  }
}
```

#### **Sécurité et Bonnes Pratiques**

✅ **Sauvegardes automatiques** : Avant chaque migration  
✅ **Mode simulation** : `--dry-run` pour tous les scripts  
✅ **Logs détaillés** : Couleurs + timestamps + progression  
✅ **Rollback automatique** : En cas d'échec critique  
✅ **Validation environnement** : Vérification prérequis  
✅ **Rétention configurée** : 7 jours par défaut

---

**✅ APPLICATION EN PRODUCTION - READY FOR BUSINESS !** 🎯

**Dernière mise à jour** : 26 Juillet 2025  
**Version** : Compatible avec Staka-Livres v1.4.0+  
**Status** : 🚀 Production déployée et opérationnelle  
**Commits récents** : images and footer, fix docker workflow, tests avancés
