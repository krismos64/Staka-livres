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

# 0. Tests de build locaux pour validation
echo "🧪 Test des builds localement avant déploiement..."
docker buildx build --platform linux/amd64 -t $DOCKER_REGISTRY/frontend:test -f ./frontend/Dockerfile . || {
    echo "❌ ERREUR: Build frontend échoué"
    exit 1
}
docker buildx build --platform linux/amd64 -t $DOCKER_REGISTRY/backend:test -f ./backend/Dockerfile . || {
    echo "❌ ERREUR: Build backend échoué"
    exit 1
}
echo "✅ Tests de build réussis"

# 1. Build et push images production
echo "📦 Building images production..."
docker buildx build --platform linux/amd64 -t $DOCKER_REGISTRY/frontend:$TAG -f ./frontend/Dockerfile . --push || {
    echo "❌ ERREUR: Push frontend échoué"
    exit 1
}
docker buildx build --platform linux/amd64 -t $DOCKER_REGISTRY/backend:$TAG -f ./backend/Dockerfile . --push || {
    echo "❌ ERREUR: Push backend échoué"
    exit 1
}

echo "⬆️ Images pushed to Docker Hub with buildx"

# 2. Copie du fichier .env.prod sur le VPS
echo "📝 Copying production environment variables..."
sshpass -p $VPS_PASSWORD scp -o StrictHostKeyChecking=no .env.prod $VPS_USER@$VPS_HOST:/opt/staka/.env.prod

# 3. Déploiement sur VPS
echo "🔄 Deploying to VPS..."
sshpass -p $VPS_PASSWORD ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << EOF
    cd /opt/staka
    
    # Vérifier l'existence du projet
    if [ ! -f docker-compose.prod.yml ]; then
        echo "❌ ERREUR: docker-compose.prod.yml introuvable dans /opt/staka"
        echo "📍 Contenu du répertoire:"
        ls -la
        exit 1
    fi
    
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
    docker compose pull || {
        echo "❌ ERREUR: Pull des images échoué"
        exit 1
    }
    
    # Arrêter les anciens conteneurs proprement
    echo "🛑 Arrêt des anciens conteneurs..."
    docker compose down
    
    # Démarrer avec les nouvelles images
    docker compose up -d --force-recreate || {
        echo "❌ ERREUR: Démarrage des nouveaux conteneurs échoué"
        exit 1
    }
    
    # Attendre que le backend soit prêt
    echo "⏳ Attente du démarrage du backend..."
    sleep 15
    
    # 🔄 MIGRATIONS AUTOMATIQUES : Appliquer les nouvelles migrations
    echo "🔄 Application des migrations de base de données..."
    docker compose exec backend npx prisma migrate deploy || {
        echo "⚠️ AVERTISSEMENT: Migrations échouées, mais on continue"
    }
    
    # 🌱 SEED CONDITIONNEL : Seulement si base de données vide
    echo "🔍 Vérification si la base a besoin d'un seed initial..."
    USER_COUNT=$(docker compose exec backend npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM users;" 2>/dev/null | grep -o '[0-9]' | head -1 || echo "0")
    
    if [ "$USER_COUNT" = "0" ] || [ "$USER_COUNT" = "" ]; then
        echo "🌱 Base de données vide détectée - Exécution du seed de production..."
        docker compose exec backend npx ts-node prisma/seed-prod.ts || {
            echo "⚠️ AVERTISSEMENT: Seed échoué, mais on continue"
        }
    else
        echo "✅ Base de données peuplée ($USER_COUNT utilisateurs) - Seed ignoré"
    fi
    
    # Vérifier que les services sont démarrés
    echo "🏥 Vérification des services..."
    docker compose ps
    
    # Attendre que les services soient prêts
    echo "⏳ Attente du démarrage des services..."
    sleep 10
    
    # Test de santé des services
    echo "🩺 Test de santé des services..."
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        echo "✅ Frontend accessible"
    else
        echo "⚠️ Frontend non accessible"
    fi
    
    if docker compose exec backend curl -f http://localhost:3000/health >/dev/null 2>&1; then
        echo "✅ Backend accessible"
    else
        echo "⚠️ Backend non accessible"
    fi
    
    # Cleanup des images inutiles
    echo "🧹 Nettoyage des anciens conteneurs et images..."
    docker system prune -f
EOF

echo "✅ Déploiement terminé!"
echo "🌐 Site: https://livrestaka.fr"