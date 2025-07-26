# 🐳 Workflow Docker Staka-Livres

Guide complet du workflow Docker dev → prod pour le monorepo Staka-Livres.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Configuration développement](#configuration-développement)
- [Configuration production](#configuration-production)
- [Scripts de build et déploiement](#scripts-de-build-et-déploiement)
- [Résolution des problèmes](#résolution-des-problèmes)
- [Bonnes pratiques](#bonnes-pratiques)

## 🏗️ Vue d'ensemble

### Architecture multi-compose

```
Staka-livres/
├── docker-compose.dev.yml      # 🛠️  Développement (hot-reload)
├── docker-compose.prod.yml     # 🚀 Production (images registry)
├── docker-compose.yml          # 📦 Legacy (déprécié)
├── scripts/
│   ├── docker-build.sh         # 🔨 Build multi-arch + push
│   └── deploy-vps.sh          # 🚁 Déploiement VPS automatisé
└── package.json               # 📝 Scripts npm unifiés
```

### Mapping des ports

| Service  | Dev (local) | Prod (VPS) | Container | Description |
|----------|-------------|------------|-----------|-------------|
| Frontend | 3000        | 80/443     | 5173      | React + Vite HMR |
| Backend  | 3001        | 3000       | 3000      | Node + Express |
| MySQL    | 3306        | 3306       | 3306      | Base de données |

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

### Caractéristiques dev

✅ **Hot-reload backend** : nodemon + volumes `delegated`  
✅ **Hot-reload frontend** : Vite HMR sur port 5173  
✅ **Volumes nommés** : `node_modules` Linux isolés (résout erreur Rollup)  
✅ **Image Bookworm** : glibc compatible avec binaires natifs  
✅ **Réseau isolé** : `staka-dev-net`  
✅ **Healthchecks** : `/health` sur backend et frontend  

### Accès en développement

- **Frontend** : http://localhost:3000 (Vite dev server)
- **Backend** : http://localhost:3001 (API)
- **MySQL** : localhost:3306 (accès direct)

## 🚀 Configuration production

### Services inclus

```yaml
services:
  - frontend    # React build statique (Nginx)
  - backend     # Node.js API
  - db          # MySQL 8
  - nginx       # Reverse proxy + SSL
  - watchtower  # Auto-update images
```

### Caractéristiques prod

✅ **Images registry** : Push vers Docker Hub  
✅ **Volumes persistants** : `/opt/staka/*` sur VPS  
✅ **SSL/TLS** : Let's Encrypt via Nginx  
✅ **Auto-update** : Watchtower surveille les nouvelles images  
✅ **Healthchecks stricts** : Intervalle 30s, retries 3-5  

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

## 🔨 Scripts de build et déploiement

### Build local et multi-arch

```bash
# Build développement (local)
npm run docker:build dev

# Build production avec push
npm run docker:build:push

# Build spécifique
./scripts/docker-build.sh v1.4.0 --push --service backend

# Build multi-architecture
./scripts/docker-build.sh latest --push --platform linux/amd64,linux/arm64
```

### Déploiement VPS

```bash
# Configuration initiale (.env.deploy)
cp .env.deploy.example .env.deploy
# Éditez .env.deploy avec vos credentials

# Déploiement simple
npm run deploy:vps

# Déploiement avec version spécifique
./scripts/deploy-vps.sh v1.4.0

# Test de déploiement (simulation)
npm run deploy:vps:dry
```

### Variables .env.deploy (Production OVH)

```env
# VPS OVH Configuration
VPS_HOST=51.254.102.133
VPS_USER=root
VPS_PASSWORD=staka2020

# Docker Registry
DOCKERHUB_USER=krismos64
DOCKERHUB_TOKEN=dckr_pat_xxxxx
DOCKER_REGISTRY=krismos64

# SSH Configuration
SSH_KEY_PATH=~/.ssh/id_rsa

# Backup Settings
BACKUP_RETENTION_DAYS=7
BACKUP_PATH=/opt/staka-livres/backups
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

### 💡 Erreur Rollup native (ARM64/x64, musl/glibc)

**Symptômes** :
```
Error: Cannot find module '@rollup/rollup-linux-x64-musl'
```

**Cause** : Le bind-mount `./frontend:/app` écrase les `node_modules` Linux natifs générés dans l'image Docker. Rollup a besoin de ses binaires spécifiques à l'architecture (ARM64 vs x64) et à la libc (musl vs glibc).

**Solutions** :

1. **Solution recommandée : Volume nommé** (déjà implémentée)
```yaml
# docker-compose.dev.yml
volumes:
  - ./frontend:/app:delegated                    # code source (hot-reload)
  - frontend_node_modules:/app/node_modules      # dépendances Linux isolées
```

2. **Reset complet** (script automatisé) :
```bash
# Reset complet avec script dédié
./scripts/dev-reset.sh

# Reset frontend uniquement
./scripts/dev-reset.sh --frontend-only

# Reset sans supprimer les volumes
./scripts/dev-reset.sh --keep-volumes
```

### Problème de volumes et caches

**Symptômes** :
- Modifications non reflétées
- `node_modules` corrompus
- Erreurs de build étranges

**Solutions** :

```bash
# Solution automatisée (recommandée)
./scripts/dev-reset.sh

# Solution manuelle
docker compose -f docker-compose.dev.yml down -v
docker system prune -f --volumes
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up
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

### Problèmes de build multi-arch

**Erreur M1/M2 vs x86** :
```bash
# Forcer la plateforme
docker build --platform linux/amd64 .

# Utiliser buildx
docker buildx build --platform linux/amd64,linux/arm64 .

# Debug buildx multi-platform
docker buildx build --platform linux/amd64,linux/arm64 \
  --progress=plain \
  -f frontend/Dockerfile \
  ./frontend
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

## 🎯 Bonnes pratiques

### Workflow développement

1. **Toujours utiliser dev compose** :
   ```bash
   npm run docker:dev  # ✅ Correct
   docker compose up   # ❌ Ancien, mélange dev/prod
   ```

2. **Vérifier les ports avant lancement** :
   ```bash
   # Le script docker-build.sh le fait automatiquement
   ./scripts/docker-build.sh dev
   ```

3. **Nettoyer régulièrement** :
   ```bash
   # Une fois par semaine
   docker system prune -f
   docker volume prune -f
   ```

### Workflow production

1. **Tester localement d'abord** :
   ```bash
   # Build et test local
   ./scripts/docker-build.sh v1.4.0
   
   # Simulation déploiement
   ./scripts/deploy-vps.sh v1.4.0 --dry-run
   
   # Déploiement réel
   ./scripts/deploy-vps.sh v1.4.0
   ```

2. **Sauvegarde automatique** :
   - Le script `deploy-vps.sh` fait une sauvegarde avant chaque déploiement
   - Gardé les 5 dernières sauvegardes automatiquement

3. **Monitoring post-déploiement** :
   ```bash
   # Vérification des services
   ssh user@vps 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml ps'
   
   # Logs en temps réel
   ssh user@vps 'cd /opt/staka-livres && docker compose -f docker-compose.prod.yml logs -f'
   ```

### Sécurité

1. **Ne jamais committer** :
   - `.env.deploy` (credentials VPS)
   - `.env.prod` (secrets production)
   - Clés SSH privées

2. **Rotation des secrets** :
   - Changer `DOCKERHUB_TOKEN` tous les 6 mois
   - Utiliser des mots de passe forts pour MySQL

3. **Accès VPS** :
   - Utiliser des clés SSH (pas de mot de passe)
   - Configurer fail2ban sur le VPS
   - Maintenir les certificats SSL à jour

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

| Métrique | Objectif | Validation |
|----------|----------|------------|
| **Temps chargement** | < 2 secondes | `curl -w "%{time_total}\n" https://livrestaka.fr` |
| **SSL Score** | Grade A+ | SSL Labs Test |
| **Uptime containers** | 99.9% | `docker compose -f docker-compose.prod.yml ps` |
| **Espace disque libre** | > 20% | `df -h /` |
| **Mémoire disponible** | > 500MB | `free -h` |
| **CPU utilisation** | < 70% | `htop` |

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

**Application Docker Staka-Livres - STATUS : ✅ PRODUCTION OPÉRATIONNELLE**

- ✅ **Problème Rollup ARM64/x64 résolu** : Volumes isolés + Debian Bookworm
- ✅ **Hot-reload garanti** : Vite HMR + nodemon fonctionnels
- ✅ **Scripts automatisés** : Build multi-arch, déploiement, reset dev
- ✅ **Production déployée** : `https://livrestaka.fr` avec SSL Let's Encrypt
- ✅ **Tests séparés** : Architecture CI/CD vs local optimisée
- ✅ **Documentation consolidée** : Guides unifiés sans redondances

**Prochaines améliorations possibles :**
- Monitoring et alertes avancées
- Backups automatiques base de données
- Pipeline CI/CD GitHub Actions
- Optimisations performance (CDN, cache)
- Tests automatisés de régression

## 🚀 État du Déploiement Production

### ✅ **Application HTTPS Opérationnelle - 24 Juillet 2025**

**🎉 DÉPLOIEMENT COMPLET RÉUSSI !**

- **Site web** : `https://livrestaka.fr` ✅ Fonctionnel
- **API Backend** : `https://livrestaka.fr/api/health` ✅ Opérationnelle
- **Base de données** : MySQL 8.0 ✅ Healthy avec seed complet
- **Certificats SSL** : Let's Encrypt ✅ Valides jusqu'au 22 octobre 2025
- **Redirection HTTPS** : HTTP → HTTPS automatique ✅
- **Configuration nginx** : Proxy optimisé + headers sécurité ✅

### 🏆 **Services Docker Production**

| Service | Status | Port | Health | Détails |
|---------|--------|------|--------|---------|
| **MySQL** | ✅ Running | 3306 | Healthy | Seed complet (4 users, 6 commandes, 1 facture) |
| **Backend** | ✅ Running | 3001→3000 | Healthy | API + EventBus + Emails centralisés |
| **Frontend** | ✅ Running | 3000→80 | Running | React build + Nginx optimisé |
| **Nginx** | ✅ Running | 80, 443 | Healthy | SSL + HTTP/2 + Headers sécurité |
| **Watchtower** | ✅ Running | - | Healthy | Auto-update images |

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

---

**✅ APPLICATION EN PRODUCTION - READY FOR BUSINESS !** 🎯

**Dernière mise à jour** : 26 Juillet 2025  
**Version** : Compatible avec Staka-Livres v1.4.0+  
**Status** : 🚀 Production déployée et opérationnelle