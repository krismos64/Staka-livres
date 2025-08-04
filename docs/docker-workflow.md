# 🐳 Workflow Docker Staka-Livres - Simplifié

![Production](https://img.shields.io/badge/Status-Production%20Deployed-brightgreen)
![Live](https://img.shields.io/badge/Live-livrestaka.fr-blue)
![Docker](https://img.shields.io/badge/Docker-Simplifié-blue)

Guide simplifié du workflow Docker dev → prod pour Staka-Livres.

**✨ Version 3 Août 2025 - Architecture simplifiée & HTTPS Let's Encrypt**  
**🌐 Production** : [https://livrestaka.fr](https://livrestaka.fr/)  
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

> **🎯 Status** : Production HTTPS opérationnelle ✅  
> **🔧 Configuration** : 2 docker-compose + 1 script deploy + SSL  
> **🚀 Déploiement** : Docker Hub → VPS automatisé + Let's Encrypt

## 📋 Architecture Simplifiée

```
Staka-livres/
├── docker-compose.yml          # 🛠️ Développement local (hot-reload)
├── docker-compose.prod.yml     # 🚀 Production (images registry)
├── deploy.sh                   # 📦 Script unique de déploiement
├── scripts/
│   ├── dev-reset.sh           # 🔄 Reset environnement dev
│   └── testing/
│       └── run-e2e-tests.sh   # 🧪 Tests E2E
└── .env.deploy                # 🔧 Config VPS
```

## 🛠️ Développement Local

### Lancement simple
```bash
# Avec Docker Desktop actif
docker-compose up --build
```

**Services :**
- Frontend : http://localhost:3000 (React + Vite dev server)
- Backend : http://localhost:3001 (Node.js + Express + nodemon hot-reload)  
- MySQL : localhost:3306 (Base de données avec seed complet)
- API : http://localhost:3001/api (Routes REST + authentification JWT)

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
1. Build frontend + backend (avec context racine)
2. Push vers Docker Hub (krismos64/frontend, krismos64/backend)
3. Connexion SSH au VPS (51.254.102.133)
4. Pull des nouvelles images
5. Redémarrage des services avec docker-compose
6. **Exécution du seed de production automatique**
7. Nettoyage automatique (docker system prune)

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

### Mapping des ports

| Service  | Dev (local) | Prod (VPS) | Container | Description      |
| -------- | ----------- | ---------- | --------- | ---------------- |
| Frontend | 3000        | 80/443     | 5173      | React + Vite HMR |
| Backend  | 3001        | 3000       | 3000      | Node + Express   |
| MySQL    | 3306        | 3306       | 3306      | Base de données  |

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
# Le script deploy.sh utilise le bon contexte :
docker build -t krismos64/frontend:latest -f ./frontend/Dockerfile .
# (contexte racine ., pas ./frontend)
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

## 📦 Nouvelles Fonctionnalités v3 (Août 2025)

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
```

---

**✅ Déploiement simplifié avec HTTPS complet + SSL automatique - Guide détaillé dans CLAUDE.md**

