# 🚀 Checklist de Déploiement OVH - Staka Livres

> **Documentation officielle de déploiement sur serveur VPS OVH**  
> Version 2.0 - Juillet 2025 - Architecture Docker Multi-arch validée

---

## 📋 Vue d'Ensemble du Déploiement

### 🎯 **Objectifs**
- Déploiement sécurisé sur VPS OVH Debian 12
- Configuration SSL/TLS avec certificats Let's Encrypt
- Architecture Docker production-ready multi-services
- Monitoring et sauvegarde automatisés

### 🏗️ **Architecture de Production**

```mermaid
graph TD
    A[Internet] --> B[Cloudflare/DNS]
    B --> C[Nginx Reverse Proxy]
    C --> D[Docker Frontend :3000]
    C --> E[Docker Backend :3001]
    E --> F[MySQL Container :3306]
    E --> G[Redis Cache :6379]
    
    H[Let's Encrypt] --> C
    I[Backup Cron] --> F
    J[Monitoring] --> E
```

---

## 🔧 **Phase 1 : Préparation VPS OVH**

### **1.1 Configuration Initiale Serveur**

```bash
# Connexion SSH initiale
ssh root@VOTRE_IP_VPS

# Mise à jour système
apt update && apt upgrade -y

# Installation paquets essentiels
apt install -y curl wget git vim htop fail2ban ufw

# Configuration firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw enable
```

### **1.2 Installation Docker et Docker Compose**

```bash
# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installation Docker Compose v2
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Vérification installations
docker --version
docker-compose --version

# Auto-start Docker
systemctl enable docker
systemctl start docker
```

### **1.3 Configuration DNS**

**Configuration requise chez votre registrar DNS :**

```dns
# Enregistrements A
livres.staka.fr     A    VOTRE_IP_VPS
www.livres.staka.fr A    VOTRE_IP_VPS

# Enregistrement CNAME (optionnel)
*.livres.staka.fr   CNAME livres.staka.fr
```

**Vérification DNS :**
```bash
# Test résolution DNS
dig livres.staka.fr
nslookup livres.staka.fr

# Attendre propagation DNS (jusqu'à 24h)
```

---

## 📥 **Phase 2 : Déploiement Application**

### **2.1 Clonage et Configuration Repository**

```bash
# Création utilisateur dédié (recommandé)
useradd -m -s /bin/bash staka
usermod -aG docker staka
su - staka

# Clonage repository
cd /home/staka
git clone https://github.com/VOTRE_USERNAME/Staka-livres.git
cd Staka-livres

# Configuration des permissions
chmod +x scripts/docker-build.sh
```

### **2.2 Configuration Variables d'Environnement**

**Créer `backend/.env.production` :**

```bash
# Base de données PRODUCTION
DATABASE_URL="mysql://staka_prod:MOT_DE_PASSE_SECURISE@db:3306/stakalivres_prod"
SHADOW_DATABASE_URL="mysql://staka_prod:MOT_DE_PASSE_SECURISE@db:3306/prisma_shadow_prod"

# JWT et Sécurité
JWT_SECRET="VOTRE_JWT_SECRET_SUPER_SECURISE_MIN_64_CARACTERES_PRODUCTION"
NODE_ENV="production"
FRONTEND_URL="https://livres.staka.fr"
PORT=3001

# Email et Support (SendGrid)
SENDGRID_API_KEY="SG.VOTRE_CLE_SENDGRID_PRODUCTION"
FROM_EMAIL="noreply@staka-livres.fr"
FROM_NAME="Staka Livres"
ADMIN_EMAIL="admin@staka-livres.fr"
SUPPORT_EMAIL="support@staka-livres.fr"
APP_URL="https://livres.staka.fr"

# Stripe LIVE (ATTENTION : Clés de production)
STRIPE_SECRET_KEY="sk_live_VOTRE_CLE_STRIPE_LIVE"
STRIPE_WEBHOOK_SECRET="whsec_VOTRE_WEBHOOK_SECRET_LIVE"

# AWS S3 Production
AWS_ACCESS_KEY_ID="AKIA_VOTRE_ACCESS_KEY_PRODUCTION"
AWS_SECRET_ACCESS_KEY="VOTRE_SECRET_KEY_AWS_PRODUCTION"
AWS_REGION="eu-west-3"
AWS_S3_BUCKET="staka-livres-prod-files"

# Sécurité MySQL
MYSQL_ROOT_PASSWORD="MOT_DE_PASSE_ROOT_MYSQL_SECURISE"
MYSQL_PASSWORD="MOT_DE_PASSE_STAKA_PROD_SECURISE"
```

**⚠️ Sécuriser les fichiers sensibles :**
```bash
chmod 600 backend/.env.production
chown staka:staka backend/.env.production
```

### **2.3 Docker Compose Production**

**Créer `docker-compose.prod.yml` :**

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
      args:
        - NODE_ENV=production
    container_name: staka_frontend_prod
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=https://livres.staka.fr/api
      - NODE_ENV=production
    depends_on:
      - backend
    networks:
      - staka_network

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
      args:
        - NODE_ENV=production
    container_name: staka_backend_prod
    restart: unless-stopped
    ports:
      - "3001:3001"
    env_file:
      - ./backend/.env.production
    volumes:
      - ./backend/uploads:/app/backend/uploads
      - ./logs:/app/backend/logs
    depends_on:
      db:
        condition: service_healthy
    networks:
      - staka_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  db:
    image: mysql:8.4
    container_name: staka_db_prod
    restart: unless-stopped
    command: --mysql-native-password=ON --innodb-buffer-pool-size=512M
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=stakalivres_prod
      - MYSQL_USER=staka_prod
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
    volumes:
      - db_data_prod:/var/lib/mysql
      - ./backup:/backup
    networks:
      - staka_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "staka_prod", "-p${MYSQL_PASSWORD}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  redis:
    image: redis:7-alpine
    container_name: staka_redis_prod
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data_prod:/data
    command: redis-server --appendonly yes --requirepass VOTRE_MOT_DE_PASSE_REDIS
    networks:
      - staka_network

networks:
  staka_network:
    driver: bridge

volumes:
  db_data_prod:
    driver: local
  redis_data_prod:
    driver: local
```

---

## 🔒 **Phase 3 : Configuration SSL avec Let's Encrypt**

### **3.1 Installation Certbot**

```bash
# Installation Certbot
apt install -y snapd
snap install core; snap refresh core
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot
```

### **3.2 Génération Certificats SSL**

```bash
# Arrêt temporaire des services (si démarrés)
docker-compose -f docker-compose.prod.yml down

# Génération certificats
certbot certonly --standalone \
  -d livres.staka.fr \
  -d www.livres.staka.fr \
  --email admin@staka-livres.fr \
  --agree-tos \
  --no-eff-email

# Vérification certificats
ls -la /etc/letsencrypt/live/livres.staka.fr/
```

### **3.3 Configuration Nginx Reverse Proxy**

**Créer `/etc/nginx/sites-available/staka-livres` :**

```nginx
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name livres.staka.fr www.livres.staka.fr;
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS principale
server {
    listen 443 ssl http2;
    server_name livres.staka.fr www.livres.staka.fr;

    # Certificats SSL Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/livres.staka.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/livres.staka.fr/privkey.pem;

    # Configuration SSL optimisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types application/javascript application/json text/css text/plain text/xml application/xml;

    # Proxy vers frontend Docker
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy API vers backend Docker
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout webhooks Stripe
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Health checks
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }

    # Fichiers statiques cache longue durée
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Activation site :**
```bash
# Lien symbolique
ln -s /etc/nginx/sites-available/staka-livres /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Redémarrage Nginx
systemctl restart nginx
systemctl enable nginx
```

### **3.4 Renouvellement Automatique SSL**

```bash
# Test renouvellement
certbot renew --dry-run

# Cron job automatique (déjà configuré par snap)
systemctl list-timers snap.certbot.renew.timer
```

---

## 🚀 **Phase 4 : Lancement Application**

### **4.1 Build et Démarrage**

```bash
# En tant qu'utilisateur staka
cd /home/staka/Staka-livres

# Build images Docker production
./scripts/docker-build.sh prod --push

# Démarrage services production
docker-compose -f docker-compose.prod.yml up -d

# Vérification logs
docker-compose -f docker-compose.prod.yml logs -f
```

### **4.2 Initialisation Base de Données**

```bash
# Migration Prisma
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Génération client Prisma
docker-compose -f docker-compose.prod.yml exec backend npx prisma generate

# Seed données (optionnel - utilisateurs de test)
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed
```

---

## ✅ **Phase 5 : Vérifications Post-Déploiement**

### **5.1 Tests de Connectivité**

```bash
# Test HTTPS principal
curl -I https://livres.staka.fr
# → Doit retourner 200 OK

# Test API backend
curl -I https://livres.staka.fr/api/health
# → Doit retourner 200 OK

# Test redirection HTTP → HTTPS
curl -I http://livres.staka.fr
# → Doit retourner 301 Moved Permanently

# Test webhook Stripe (en production uniquement)
curl -X POST https://livres.staka.fr/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "connectivity"}'
# → Doit retourner 400 (signature manquante, comportement attendu)
```

### **5.2 Validation SSL/TLS**

```bash
# Test SSL Labs (en ligne)
# https://www.ssllabs.com/ssltest/analyze.html?d=livres.staka.fr

# Test local SSL
openssl s_client -connect livres.staka.fr:443 -servername livres.staka.fr
# → Vérifier certificat Let's Encrypt valide

# Test HSTS
curl -I https://livres.staka.fr | grep -i strict-transport-security
# → Doit afficher header HSTS
```

### **5.3 Tests Fonctionnels RGPD**

```bash
# Test suppression compte (avec token utilisateur)
curl -X DELETE https://livres.staka.fr/api/users/me \
  -H "Authorization: Bearer VOTRE_JWT_TOKEN"
# → Doit retourner 200 + confirmation suppression

# Test export données RGPD
curl -X GET https://livres.staka.fr/api/users/me/export \
  -H "Authorization: Bearer VOTRE_JWT_TOKEN"
# → Doit retourner 200 + email envoyé
```

### **5.4 Tests Paiements Stripe**

⚠️ **ATTENTION : Tests avec clés LIVE uniquement en pré-production contrôlée**

```bash
# Test créaation session checkout (authentifié)
curl -X POST https://livres.staka.fr/api/payments/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_JWT_TOKEN" \
  -d '{
    "commandeId": "commande-uuid-test",
    "amount": 5000,
    "description": "Test déploiement"
  }'
# → Doit retourner URL Stripe Checkout

# Vérifier réception webhooks Stripe
tail -f /home/staka/Staka-livres/logs/combined.log | grep webhook
```

### **5.5 Tests Système d'Emails**

```bash
# Test envoi email contact public
curl -X POST https://livres.staka.fr/api/public/contact \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "Deploiement",
    "email": "test@example.com",
    "sujet": "Test déploiement OVH",
    "message": "Validation système emails production"
  }'
# → Doit retourner 200 + email reçu sur SUPPORT_EMAIL
```

---

## 🔍 **Phase 6 : Monitoring et Maintenance**

### **6.1 Configuration Monitoring**

**Créer `/home/staka/scripts/monitor.sh` :**

```bash
#!/bin/bash
# Script de monitoring Staka Livres

LOG_FILE="/home/staka/monitoring.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Début monitoring" >> $LOG_FILE

# Vérification containers
docker ps --format "table {{.Names}}\t{{.Status}}" | grep staka

# Vérification espace disque
df -h / | tail -1

# Vérification mémoire
free -h

# Vérification SSL
DAYS_LEFT=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/livres.staka.fr/cert.pem | cut -d= -f2 | xargs -I {} date -d {} +%s)
NOW=$(date +%s)
DAYS=$((($DAYS_LEFT - $NOW) / 86400))

echo "[$DATE] Certificat SSL expire dans $DAYS jours" >> $LOG_FILE

# Vérification bases de données
docker exec staka_db_prod mysqladmin -u staka_prod -p${MYSQL_PASSWORD} ping

echo "[$DATE] Fin monitoring" >> $LOG_FILE
```

**Cron job monitoring :**
```bash
# Éditer crontab
crontab -e

# Ajouter ligne (monitoring toutes les heures)
0 * * * * /home/staka/scripts/monitor.sh
```

### **6.2 Sauvegarde Automatisée**

**Créer `/home/staka/scripts/backup.sh` :**

```bash
#!/bin/bash
# Script de sauvegarde MySQL

BACKUP_DIR="/home/staka/backup"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="stakalivres_prod"

# Création répertoire backup
mkdir -p $BACKUP_DIR

# Sauvegarde MySQL
docker exec staka_db_prod mysqldump \
  -u staka_prod \
  -p${MYSQL_PASSWORD} \
  --single-transaction \
  --routines \
  --triggers \
  $DB_NAME > $BACKUP_DIR/mysql_backup_$DATE.sql

# Compression
gzip $BACKUP_DIR/mysql_backup_$DATE.sql

# Suppression sauvegardes > 30 jours
find $BACKUP_DIR -name "mysql_backup_*.sql.gz" -mtime +30 -delete

echo "Sauvegarde terminée : mysql_backup_$DATE.sql.gz"
```

**Cron job sauvegarde :**
```bash
# Sauvegarde quotidienne à 2h du matin
0 2 * * * /home/staka/scripts/backup.sh
```

### **6.3 Logs et Debugging**

```bash
# Logs application temps réel
docker-compose -f docker-compose.prod.yml logs -f

# Logs spécifiques par service
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs db

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs système
journalctl -u nginx -f
journalctl -u docker -f
```

---

## 🚨 **Phase 7 : Sécurité et Audit Final**

### **7.1 Audit Sécurité Serveur**

```bash
# Scan ports ouverts
nmap -sT -O localhost

# Vérification fail2ban
fail2ban-client status
fail2ban-client status sshd

# Audit permissions fichiers sensibles
find /home/staka/Staka-livres -name "*.env*" -exec ls -la {} \;

# Test firewall
ufw status verbose
```

### **7.2 Tests Sécurité Application**

```bash
# Test rate limiting (10 requêtes/15min sur auth)
for i in {1..12}; do
  curl -X POST https://livres.staka.fr/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "Request $i: %{http_code}\n"
done
# → Doit bloquer après la 10ème requête

# Test headers sécurité
curl -I https://livres.staka.fr | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"

# Test CORS
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  https://livres.staka.fr/api/auth/login
```

### **7.3 Validation Conformité RGPD**

```bash
# Test endpoint export données (avec utilisateur valide)
curl -X GET https://livres.staka.fr/api/users/me/export \
  -H "Authorization: Bearer VOTRE_JWT_PRODUCTION" \
  -v
# → Vérifier email reçu avec export JSON

# Test logs audit (admin)
curl -X GET https://livres.staka.fr/api/admin/audit \
  -H "Authorization: Bearer JWT_ADMIN_PRODUCTION" \
  -G -d "action=USER_DATA_EXPORTED"
# → Doit afficher logs export RGPD
```

---

## 📈 **Métriques de Validation Finale**

### **✅ Checklist de Réussite**

- [ ] **Connectivité HTTPS** : Site accessible en HTTPS avec certificat valide
- [ ] **API fonctionnelle** : Tous endpoints répondent correctement
- [ ] **Base de données** : MySQL opérationnelle avec migrations appliquées
- [ ] **Stripe intégration** : Webhooks reçus et traités correctement
- [ ] **RGPD complet** : Export et suppression de données fonctionnels
- [ ] **Système d'emails** : SendGrid opérationnel, emails reçus
- [ ] **Sécurité renforcée** : Rate limiting, headers sécurité, firewall actifs
- [ ] **Audit logs** : Traçabilité complète des actions sensibles
- [ ] **SSL/TLS** : Grade A+ SSL Labs, HSTS activé
- [ ] **Monitoring** : Scripts de surveillance et backup configurés
- [ ] **Performance** : Temps de réponse < 2s, resources optimisées
- [ ] **Docker** : Tous containers healthy et restart policy configuré

### **🎯 Indicateurs de Performance**

| Métrique | Objectif | Validation |
|----------|----------|------------|
| **Temps chargement** | < 2 secondes | `curl -w "%{time_total}\n" https://livres.staka.fr` |
| **SSL Score** | Grade A+ | SSL Labs Test |
| **Uptime containers** | 99.9% | `docker ps` status |
| **Espace disque libre** | > 20% | `df -h /` |
| **Mémoire disponible** | > 500MB | `free -h` |
| **CPU utilisation** | < 70% | `htop` |

---

## 🔄 **Procédures de Maintenance**

### **Mise à jour Application**

```bash
# Sauvegarde avant mise à jour
/home/staka/scripts/backup.sh

# Récupération dernière version
cd /home/staka/Staka-livres
git pull origin main

# Rebuild et redéploiement
./scripts/docker-build.sh prod
docker-compose -f docker-compose.prod.yml up -d --build

# Vérification
curl -I https://livres.staka.fr/health
```

### **Restauration d'Urgence**

```bash
# Arrêt services
docker-compose -f docker-compose.prod.yml down

# Restauration base de données
gunzip < backup/mysql_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i staka_db_prod mysql -u staka_prod -p${MYSQL_PASSWORD} stakalivres_prod

# Redémarrage
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 **Support et Contact**

### **Informations de Contact Production**
- **Domaine principal** : https://livres.staka.fr
- **Email admin** : admin@staka-livres.fr
- **Email support** : support@staka-livres.fr

### **Ressources de Dépannage**
- **Documentation Docker** : `/home/staka/Staka-livres/docs/DEPLOYMENT_DOCKER.md`
- **Logs application** : `docker-compose -f docker-compose.prod.yml logs`
- **Monitoring** : `/home/staka/monitoring.log`
- **Backup** : `/home/staka/backup/`

---

## 🎉 **Conclusion**

Cette checklist garantit un déploiement production sécurisé et robuste du projet Staka Livres sur infrastructure OVH. 

**Points critiques validés :**
✅ Architecture Docker multi-services optimisée
✅ SSL/TLS avec certificats Let's Encrypt automatisés
✅ Configuration sécurité serveur et application
✅ Intégration Stripe complète avec webhooks production
✅ Conformité RGPD avec audit trails complets
✅ Système de monitoring et sauvegarde automatisés

**Le déploiement est maintenant prêt pour la mise en production.**

---

*Checklist validée le 22 juillet 2025 - Version 2.0*
*Projet Staka Livres - Architecture Docker Production Ready*