# 🐳 Workflow Docker Staka-Livres - Simplifié

![Production](https://img.shields.io/badge/Status-Production%20Deployed-brightgreen)
![Live](https://img.shields.io/badge/Live-livrestaka.fr-blue)
![Docker](https://img.shields.io/badge/Docker-Simplifié-blue)

Guide simplifié du workflow Docker dev → prod pour Staka-Livres.

**✨ Version 2 Août 2025 - Architecture simplifiée**  
**🌐 Production** : [livrestaka.fr](https://livrestaka.fr/)  
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

> **🎯 Status** : Architecture simplifiée ✅  
> **🔧 Configuration** : 2 docker-compose + 1 script deploy  
> **🚀 Déploiement** : Docker Hub → VPS en un script

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
- Frontend : http://localhost:3000 (Vite dev + hot-reload)
- Backend : http://localhost:3001 (nodemon + hot-reload)  
- MySQL : localhost:3306

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
1. Build frontend + backend
2. Push vers Docker Hub (krismos64/frontend, krismos64/backend)
3. Connexion SSH au VPS
4. Pull des nouvelles images
5. Redémarrage des services

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
| Backend  | 3001        | 3001       | 3001      | Node + Express   |
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

**Build multi-arch**
```bash
# Vérifier buildx
docker buildx ls
docker buildx inspect --bootstrap
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
- **Site**: https://livrestaka.fr

