#!/bin/bash
set -e

# Configuration
source .env.deploy

TAG=${1:-latest}
echo "🚀 Déploiement Staka-livres version: $TAG"

# 1. Build et push images
echo "📦 Building images..."
docker buildx build --platform linux/amd64 -t $DOCKER_REGISTRY/frontend:$TAG -f ./frontend/Dockerfile . --push
docker buildx build --platform linux/amd64 -t $DOCKER_REGISTRY/backend:$TAG -f ./backend/Dockerfile . --push

echo "⬆️ Images pushed to Docker Hub with buildx"

# 2. Déploiement sur VPS
echo "🔄 Deploying to VPS..."
sshpass -p $VPS_PASSWORD ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << EOF
    cd /opt/staka-livres
    docker compose pull
    docker compose up -d --force-recreate
    
    # ⚠️ SEED DÉSACTIVÉ PAR SÉCURITÉ - Préserve les données clients
    # echo "🌱 Exécution du seed de production..."
    # docker compose exec backend npx ts-node prisma/seed-prod.ts
    
    docker system prune -f
EOF

echo "✅ Déploiement terminé!"
echo "🌐 Site: https://livrestaka.fr"