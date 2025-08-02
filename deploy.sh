#!/bin/bash
set -e

# Configuration
source .env.deploy

TAG=${1:-latest}
echo "🚀 Déploiement Staka-livres version: $TAG"

# 1. Build et push images
echo "📦 Building images..."
docker build -t $DOCKER_REGISTRY/frontend:$TAG ./frontend
docker build -t $DOCKER_REGISTRY/backend:$TAG ./backend

echo "⬆️ Pushing to Docker Hub..."
docker push $DOCKER_REGISTRY/frontend:$TAG
docker push $DOCKER_REGISTRY/backend:$TAG

# 2. Déploiement sur VPS
echo "🔄 Deploying to VPS..."
sshpass -p $VPS_PASSWORD ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << EOF
    cd /opt/staka-livres
    docker compose pull
    docker compose up -d --force-recreate
    docker system prune -f
EOF

echo "✅ Déploiement terminé!"
echo "🌐 Site: https://livrestaka.fr"