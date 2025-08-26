#!/bin/bash
set -e

# Configuration
source .env.deploy

# Override avec les credentials locaux si le fichier existe
if [ -f .env.deploy.local ]; then
    source .env.deploy.local
    echo "🔑 Credentials locaux chargés depuis .env.deploy.local"
fi

TAG=${1:-latest}
echo "🚀 Déploiement Staka-livres version: $TAG"

# 1. Build et push images
echo "📦 Building images..."
docker buildx build --platform linux/amd64 -t $DOCKER_REGISTRY/frontend:$TAG -f ./frontend/Dockerfile . --push
docker buildx build --platform linux/amd64 -t $DOCKER_REGISTRY/backend:$TAG -f ./backend/Dockerfile . --push

echo "⬆️ Images pushed to Docker Hub with buildx"

# 2. Copie du fichier .env.prod sur le VPS
echo "📝 Copying production environment variables..."
sshpass -p $VPS_PASSWORD scp -o StrictHostKeyChecking=no .env.prod $VPS_USER@$VPS_HOST:/opt/staka/.env.prod

# 3. Déploiement sur VPS
echo "🔄 Deploying to VPS..."
sshpass -p $VPS_PASSWORD ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << EOF
    cd /opt/staka
    
    # Vérifier que le fichier .env.prod a été copié
    if [ -f .env.prod ]; then
        echo "✅ Fichier .env.prod détecté"
        echo "🔍 Variables critiques:"
        grep -E "STRIPE_SECRET_KEY|SENDGRID_API_KEY|ADMIN_EMAIL" .env.prod | sed 's/=.*/=***CONFIGURÉ***/'
    else
        echo "❌ ERREUR: Fichier .env.prod manquant!"
        exit 1
    fi
    
    # Pull et restart avec nouvelles variables
    docker compose pull
    docker compose up -d --force-recreate
    
    # ⚠️ SEED DÉSACTIVÉ PAR SÉCURITÉ - Préserve les données clients
    # echo "🌱 Exécution du seed de production..."
    # docker compose exec backend npx ts-node prisma/seed-prod.ts
    
    # Vérifier que les services sont démarrés
    echo "🏥 Vérification des services..."
    docker compose ps
    
    docker system prune -f
EOF

echo "✅ Déploiement terminé!"
echo "🌐 Site: https://livrestaka.fr"