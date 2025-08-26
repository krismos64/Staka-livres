# 🐳 Workflow Docker Staka-Livres - Optimisé

![Production](https://img.shields.io/badge/Status-Production%20Deployed-brightgreen)
![Live](https://img.shields.io/badge/Live-livrestaka.fr-blue)
![Docker](https://img.shields.io/badge/Docker-Optimis%C3%A9-blue)
![Local Storage](https://img.shields.io/badge/Storage-Local%20Unified-green)

Guide complet du workflow Docker dev → prod pour Staka-Livres avec stockage local unifié.

**✨ Version 5 - 26 Août 2025 - Déploiement automatisé + Filtrage Stripe**  
**🌐 Production** : [https://livrestaka.fr](https://livrestaka.fr/)  
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

> **🎯 Status** : Production HTTPS + API + Webhook + Déploiement automatisé ✅  
> **🏗️ Architecture** : nginx externe → conteneurs Docker (ports internes)  
> **🚀 Déploiement** : Script unifié `deploy.sh` avec migrations BDD automatiques  
> **📁 Stockage** : Local unifié + Filtrage multi-sites Stripe + Facturation email auto

## 📋 Architecture v5 - nginx externe

```
Staka-livres/
├── docker-compose.yml          # 🛠️ Développement local (volumes mounting)
├── docker-compose.dev.yml      # 🔧 Développement avec build contexte racine
├── docker-compose.prod.yml     # 🚀 Production (images registry)
├── deploy.sh                   # 📦 Script unique de déploiement
├── backend/
│   ├── Dockerfile              # 🏭 Production multi-stage build
│   ├── Dockerfile.dev          # 🛠️ Développement optimisé Prisma
│   └── uploads/                # 📁 Stockage local unifié
│       ├── projects/           # Fichiers projets clients
│       ├── orders/             # Fichiers commandes
│       ├── messages/           # Pièces jointes messages
│       └── invoices/           # Factures PDF générées
├── frontend/
│   ├── Dockerfile              # 🏭 Production nginx + Vite build
│   ├── Dockerfile.dev          # 🛠️ Développement HMR optimisé
│   ├── nginx.conf              # ⚙️ Configuration nginx production
│   ├── nginx-working.conf      # 🔧 Configuration nginx development
│   └── nginx-http-only.conf    # 🌐 Configuration nginx sans SSL
├── scripts/
│   ├── dev-reset.sh           # 🔄 Reset environnement dev
│   └── testing/
│       └── run-e2e-tests.sh   # 🧪 Tests E2E (34 tests Cypress)
└── .env.deploy                # 🔧 Config VPS (exclu du Git)
```

## 🛠️ Développement Local

### Lancement simple (recommandé)
```bash
# Avec Docker Desktop actif - build optimisé
docker-compose -f docker-compose.dev.yml up --build
```

### Lancement rapide (volumes)
```bash
# Pour développement rapide avec volumes
docker-compose up --build
```

**Services disponibles :**
- **Frontend** : http://localhost:3000 (React + Vite HMR + TypeScript optimisé)
- **Backend** : http://localhost:3001 (Node.js + Express + nodemon hot-reload)  
- **MySQL** : localhost:3306 (Base de données avec seed complet)
- **API** : http://localhost:3001/api (Routes REST + JWT + stockage local)
- **Uploads** : `/backend/uploads/` (Stockage local unifié - remplace AWS S3)

### 🔧 Configurations Docker disponibles

| Fichier | Usage | Contexte | Volume | Hot Reload | Ports |
|---------|-------|----------|--------|------------|-------|
| `docker-compose.yml` | Développement rapide | Dossier local | ✅ Volumes | ✅ HMR | Frontend:3000, Backend:3001 |
| `docker-compose.dev.yml` | Build optimisé | Racine | ❌ Build | ✅ HMR | Frontend:3000, Backend:3001 |
| `docker-compose.prod.yml` | Production | Images Docker Hub | ❌ Registry | ❌ Static | Frontend:8080, Backend:3000 |

**🗂️ Structure Docker finalisée :**
```
├── docker-compose.yml          # Dev rapide (volumes + hot reload)
├── docker-compose.dev.yml      # Dev build (context racine)
├── docker-compose.prod.yml     # Production (images registry)
├── backend/
│   ├── Dockerfile              # Production multi-stage
│   └── Dockerfile.dev          # Développement avec Prisma
└── frontend/
    ├── Dockerfile              # Production nginx
    └── Dockerfile.dev          # Développement HMR
```

**✅ Optimisations appliquées :**
- Suppression `Dockerfile.dev` obsolète à la racine
- Ports cohérents : backend interne:3000, externe:3001
- Volumes stockage local : `/backend/uploads` persistants
- Healthchecks production activés
- Containers nommés par environnement (_dev, _build, _prod)

## 🚀 Déploiement Production

### Script unique
```bash
# Compléter le token Docker Hub dans .env.deploy
# Puis déployer
./deploy.sh

# Ou avec version spécifique  
./deploy.sh v1.5.0
```

**Le script fait automatiquement :**
1. **Build multi-arch** (linux/amd64) frontend + backend avec contexte racine optimisé
2. **Push vers Docker Hub** (krismos64/frontend, krismos64/backend) avec buildx
3. **Connexion SSH au VPS** (51.254.102.133) sécurisée
4. **Pull des nouvelles images** avec `docker compose pull`
5. **Redémarrage avec force-recreate** pour appliquer toutes les modifications
6. **Exécution du seed de production** automatique (utilisateurs + tarifs + FAQ + pages)
7. **Nettoyage automatique** (docker system prune) pour libérer l'espace

## 🔧 Configuration

### .env.deploy (complétez le token)
```env
VPS_HOST=51.254.102.133
VPS_USER=root
VPS_PASSWORD=staka2020
DOCKERHUB_USER=krismos64
DOCKERHUB_TOKEN=YOUR_TOKEN_HERE
DOCKER_REGISTRY=krismos64
```

### Mapping des ports (MISE À JOUR v5 - Optimisé)

| Service  | Dev (local) | Prod (nginx externe) | Prod (conteneur) | Description      |
| -------- | ----------- | ------------------- | --------------- | ---------------- |
| Frontend | 3000        | → 443 (HTTPS)       | 8080            | React + Vite HMR |
| Backend  | 3001        | → 443/api           | 3000            | Node + Express   |
| MySQL    | 3306        | (interne)           | 3306            | Base de données  |

**🔧 Cohérence ports :**
- **Développement** : Frontend:3000 ↔ Backend:3001 
- **Production** : nginx:443 → Frontend:8080 + Backend:3000
- **Interne** : Backend toujours sur port 3000 dans le conteneur

**🔑 Points clés nginx externe :**
- **Port 443** : nginx externe gère HTTPS + certificats Let's Encrypt
- **Port 8080** : Frontend Docker interne (HTTP)
- **Port 3000** : Backend Docker interne (API + webhooks)
- **Avantage** : Séparation SSL/TLS du code applicatif

## ⚙️ Commandes Utiles

### Développement local
```bash
# Reset environnement dev (résout tous problèmes)
./scripts/dev-reset.sh

# Tests complets
npm run test:e2e
```

### Production

```bash
# Compléter le token dans .env.deploy puis déployer
./deploy.sh

# Avec version spécifique
./deploy.sh v1.5.0
```

---

## 🔧 Troubleshooting

### Problèmes fréquents

**Erreur "Port déjà utilisé"**
```bash
# Tuer processus sur port 3000/3001
pkill -f "node.*3000"
lsof -i :3000
```

**Volumes corrompus**
```bash
# Reset complet
./scripts/dev-reset.sh
```

**Erreur contexte Docker build**
```bash
# Le script deploy.sh utilise le bon contexte multi-arch :
docker buildx build --platform linux/amd64 -t krismos64/frontend:latest -f ./frontend/Dockerfile . --push
# (contexte racine ., pas ./frontend)
```

**Erreur Prisma génération**
```bash
# Le Dockerfile.dev corrigé génère automatiquement le client Prisma
# Si problème persiste, rebuilder sans cache :
docker-compose -f docker-compose.dev.yml build --no-cache backend
```

**Erreurs TypeScript @shared imports**
```bash
# Les imports @shared ont été remplacés par des chemins relatifs
# Si erreurs persistent, vérifier les imports dans :
frontend/src/components/admin/CommandeStatusSelect.tsx
frontend/src/types/shared.ts
```

**HTTPS ne fonctionne pas**
```bash
# Vérifier les certificats Let's Encrypt sur VPS
ssh root@51.254.102.133 "ls -la /opt/staka/certs/live/livrestaka.fr/"

# Regenerer certificat si expiré
ssh root@51.254.102.133 "docker run --rm -v /opt/staka/certs:/etc/letsencrypt certbot/certbot renew"

# Vérifier le volume SSL dans docker-compose.prod.yml
volumes:
  - /opt/staka/certs:/etc/letsencrypt:ro
```

## 🎯 Architecture Simplifiée

### Fichiers principaux

```
├── docker-compose.yml      # Dev (hot-reload)
├── docker-compose.prod.yml # Production  
├── deploy.sh              # Script unique
└── .env.deploy           # Config VPS
```

### VPS OVH Production

- **Host**: 51.254.102.133
- **Images**: krismos64/frontend:latest, krismos64/backend:latest  
- **Site**: https://livrestaka.fr ✅ HTTPS opérationnel
- **SSL**: Let's Encrypt (expire 1er nov 2025)
- **Redirection**: HTTP → HTTPS automatique
- **Base de données**: Seed complet (3 tarifs + 8 FAQ + utilisateurs)
- **API**: HTTPS + CORS configuré pour production

## 🔒 Configuration HTTPS/SSL

### Certificats Let's Encrypt
```bash
# ✅ Certificats installés et valides (expire: 1er nov 2025)
# ✅ Domaines couverts: livrestaka.fr + www.livrestaka.fr
# ✅ Stockage VPS: /opt/staka/certs/
# ✅ HTTP/2 activé automatiquement

# Commande de renouvellement (à configurer en cron)
docker run --rm -v /opt/staka/certs:/etc/letsencrypt certbot/certbot renew
```

### Headers de Sécurité
- **HSTS**: `max-age=31536000; includeSubDomains`
- **X-Frame-Options**: `SAMEORIGIN`
- **X-Content-Type-Options**: `nosniff`
- **X-XSS-Protection**: `1; mode=block`
- **Referrer-Policy**: `strict-origin-when-cross-origin`

### Tests de Validation
```bash
# ✅ HTTPS fonctionne
curl -I https://livrestaka.fr
# → HTTP/2 200 + headers sécurité

# ✅ Redirection HTTP → HTTPS
curl -I http://livrestaka.fr  
# → 301 Moved Permanently

# ✅ Health check
curl https://livrestaka.fr/health
# → healthy
```

---

## 🆕 Améliorations Majeures v4 (4 Août 2025)

### ✅ Migration AWS S3 → Stockage Local Unifié
- **Suppression complète** des services AWS S3 et fichiers deprecated
- **Stockage local** dans `/backend/uploads/` avec organisation par type :
  - `/uploads/projects/` : Fichiers projets clients
  - `/uploads/orders/` : Fichiers de commandes
  - `/uploads/messages/` : Pièces jointes messagerie
  - `/uploads/invoices/` : Factures PDF générées
- **Configuration multer** automatique par endpoint
- **Sécurité** : Validation de types de fichiers et tailles

### ✅ Optimisations Docker & TypeScript
- **Dockerfile.dev** corrigé avec génération Prisma fonctionnelle
- **docker-compose.dev.yml** avec contexte racine pour builds optimisés
- **Imports TypeScript** : suppression des imports `@shared` problématiques
- **Configuration Vite** et **tsconfig.json** optimisés pour le développement
- **Types partagés** : architecture locale robuste sans dépendances externes

### ✅ Infrastructure & Configuration
- **3 configurations Docker** : dev rapide, dev build, production
- **nginx configurations** multiples selon l'environnement
- **Scripts de déploiement** avec buildx multi-arch automatique
- **Seed de développement** synchronisé avec la production
- **Tests E2E** : 34 tests Cypress complets et fonctionnels

### ✅ Nettoyage & Sécurité
- **Suppression** de 12 fichiers deprecated et temp-fixed
- **Suppression** des composants inutilisés (ErrorMessage, Loader)
- **.env.deploy** exclu du Git pour la sécurité
- **.gitignore** optimisé pour le nouveau système de fichiers

---

## 📦 Fonctionnalités v3 (Août 2025) - Précédentes

### ✅ Certificats SSL Automatiques
- **Let's Encrypt** installé et configuré
- **Renouvellement** : `/opt/staka/certs/` sur VPS
- **HTTP/2** activé automatiquement
- **HSTS** configuré pour la sécurité

### ✅ Seed de Production Automatique
```bash
# Intégré dans deploy.sh - exécution automatique après déploiement
docker compose exec backend npx ts-node prisma/seed-prod.ts
```

**Contenu du seed :**
- 3 tarifs (Pack KDP 350€, Correction 2€/page, Rédaction 1450€)
- 8 FAQ complètes avec catégories
- 2 utilisateurs (admin + test)
- 4 pages légales (mentions, CGV, RGPD, confidentialité)

### 🔧 Commandes de Maintenance

```bash
# Renouveler certificats SSL (à faire tous les 3 mois)
ssh root@51.254.102.133 "docker run --rm -v /opt/staka/certs:/etc/letsencrypt certbot/certbot renew && docker compose restart frontend"

# Vérifier l'état de la production
curl -I https://livrestaka.fr/health
curl -I https://livrestaka.fr/api/tarifs

# Sauvegarder la base de données
ssh root@51.254.102.133 "docker compose exec db mysqldump -u root -pStakaRootPass2024! stakalivres > /opt/staka/backup/db-$(date +%Y%m%d).sql"

# Mettre à jour le seed de production (nouveau)
scp backend/prisma/seed.ts root@51.254.102.133:/opt/staka-livres/backend/prisma/seed.ts
ssh root@51.254.102.133 "cd /opt/staka-livres && docker compose exec backend npx ts-node prisma/seed.ts"

# Vérifier l'espace disque stockage local
ssh root@51.254.102.133 "du -sh /opt/staka-livres/backend/uploads/*"

# Nettoyer les anciens fichiers (si nécessaire)
ssh root@51.254.102.133 "find /opt/staka-livres/backend/uploads -name '*.tmp' -delete"
```

---

**✅ Architecture Docker optimisée + Stockage Local Unifié + TypeScript corrigé - Guide détaillé dans CLAUDE.md**

