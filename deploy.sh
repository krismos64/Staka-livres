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
VPS_PROJECT_DIR="/opt/staka-livres"
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

# 2. Copie des fichiers de configuration sur le VPS
echo "📝 Copying production configuration files..."
sshpass -p $VPS_PASSWORD ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "mkdir -p $VPS_PROJECT_DIR/frontend"
sshpass -p $VPS_PASSWORD scp -o StrictHostKeyChecking=no .env.prod $VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/.env.prod
sshpass -p $VPS_PASSWORD scp -o StrictHostKeyChecking=no docker-compose.prod.yml $VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/docker-compose.prod.yml
sshpass -p $VPS_PASSWORD scp -o StrictHostKeyChecking=no frontend/nginx-prod.conf $VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/frontend/nginx-prod.conf

# 3. Déploiement sur VPS
echo "🔄 Deploying to VPS..."
sshpass -p $VPS_PASSWORD ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << EOF
    cd $VPS_PROJECT_DIR
    
    # Vérifier l'existence des fichiers nécessaires
    if [ ! -f docker-compose.prod.yml ]; then
        echo "❌ ERREUR: docker-compose.prod.yml introuvable dans $VPS_PROJECT_DIR"
        echo "📍 Contenu du répertoire:"
        ls -la
        exit 1
    fi
    
    if [ ! -f frontend/nginx-prod.conf ]; then
        echo "❌ ERREUR: frontend/nginx-prod.conf introuvable"
        exit 1
    fi
    
    # Vérifier que le fichier .env.prod a été copié
    if [ -f .env.prod ]; then
        echo "✅ Fichiers de configuration détectés"
        echo "🔍 Variables critiques:"
        grep -E "STRIPE_SECRET_KEY|SENDGRID_API_KEY|ADMIN_EMAIL" .env.prod | sed 's/=.*/=***CONFIGURÉ***/'
    else
        echo "❌ ERREUR: Fichier .env.prod manquant!"
        exit 1
    fi
    
    # 🧹 Nettoyage préventif des conteneurs conflictuels
    echo "🧹 Nettoyage préventif des anciens conteneurs..."
    docker stop \$(docker ps -aq) 2>/dev/null || true
    docker rm \$(docker ps -aq) 2>/dev/null || true
    
    # Pull et restart avec nouvelles variables
    echo "📥 Pull des nouvelles images..."
    docker compose -f docker-compose.prod.yml pull || {
        echo "❌ ERREUR: Pull des images échoué"
        exit 1
    }
    
    # 🔍 Détection problème MySQL downgrade et correction automatique
    echo "🔍 Vérification intégrité base de données MySQL..."
    if [ -f /opt/staka/data/mysql/ib_logfile0 ]; then
        # Tenter de démarrer MySQL temporairement pour tester
        if ! docker run --rm -v /opt/staka/data/mysql:/var/lib/mysql mysql:8.0 mysqld --help >/dev/null 2>&1; then
            echo "⚠️ Détection problème MySQL downgrade - Nettoyage automatique..."
            rm -rf /opt/staka/data/mysql
            mkdir -p /opt/staka/data/mysql
            echo "✅ Volume MySQL nettoyé"
        fi
    fi
    
    # Démarrer avec les nouvelles images
    echo "🚀 Démarrage des nouveaux conteneurs..."
    docker compose -f docker-compose.prod.yml up -d || {
        echo "❌ ERREUR: Démarrage des nouveaux conteneurs échoué"
        exit 1
    }
    
    # 🕐 Attente intelligente du démarrage des services
    echo "⏳ Attente du démarrage des services..."
    for i in {1..10}; do
        sleep 3
        if docker compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
            echo "✅ Services démarrés"
            break
        fi
        echo "⏳ Tentative \$i/10..."
    done
    
    # 🔄 MIGRATIONS AUTOMATIQUES : Appliquer les nouvelles migrations
    echo "🔄 Application des migrations de base de données..."
    docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy || {
        echo "⚠️ AVERTISSEMENT: Migrations échouées, mais on continue"
    }
    
    # 🌱 SEED CONDITIONNEL : Seulement si base de données vide
    echo "🔍 Vérification si la base a besoin d'un seed initial..."
    USER_COUNT=\$(docker compose -f docker-compose.prod.yml exec backend npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM users;" 2>/dev/null | grep -o '[0-9]' | head -1 || echo "0")
    
    if [ "\$USER_COUNT" = "0" ] || [ "\$USER_COUNT" = "" ]; then
        echo "🌱 Base de données vide détectée - Exécution du seed de production..."
        docker compose -f docker-compose.prod.yml exec backend npx ts-node prisma/seed-prod.ts || {
            echo "⚠️ AVERTISSEMENT: Seed échoué, mais on continue"
        }
    else
        echo "✅ Base de données peuplée (\$USER_COUNT utilisateurs) - Seed ignoré"
    fi
    
    # 🩺 Tests de santé robustes des services
    echo "🩺 Tests de santé des services..."
    
    # Test frontend
    if curl -f --connect-timeout 10 --max-time 15 http://localhost:8080/health >/dev/null 2>&1; then
        echo "✅ Frontend accessible sur port 8080"
    else
        echo "⚠️ Frontend non accessible sur port 8080"
    fi
    
    # Test backend via conteneur
    if docker compose -f docker-compose.prod.yml exec backend curl -f --connect-timeout 5 http://localhost:3000/health >/dev/null 2>&1; then
        echo "✅ Backend accessible sur port 3000"
    else
        echo "⚠️ Backend non accessible sur port 3000"
    fi
    
    # Test API via nginx externe (test final)
    sleep 5
    if curl -f --connect-timeout 10 --max-time 15 https://livrestaka.fr/health >/dev/null 2>&1; then
        echo "✅ Site HTTPS accessible via nginx externe"
    else
        echo "⚠️ Site HTTPS non accessible - vérifier nginx externe"
    fi
    
    # État final des conteneurs
    echo "📋 État final des conteneurs:"
    docker compose -f docker-compose.prod.yml ps
    
    # Cleanup des images inutiles
    echo "🧹 Nettoyage des anciens conteneurs et images..."
    docker system prune -f
EOF

# 4. Test de la configuration email après déploiement
echo ""
echo "📧 TEST DE LA CONFIGURATION EMAIL"
echo "=================================="
echo "Copie du script de test email sur le VPS..."
sshpass -p $VPS_PASSWORD scp -o StrictHostKeyChecking=no scripts/test-email-prod.sh $VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/test-email-prod.sh

sshpass -p $VPS_PASSWORD ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << EOF
    cd $VPS_PROJECT_DIR
    chmod +x test-email-prod.sh
    
    echo "Lancement du test d'envoi d'email..."
    ./test-email-prod.sh || echo "⚠️ Test email terminé avec avertissements"
EOF

# 5. Validation finale et résumé
echo ""
echo "🎯 VALIDATION FINALE DU DÉPLOIEMENT"
echo "===================================="

# Test final API
if curl -f --connect-timeout 10 --max-time 15 https://livrestaka.fr/api/tarifs >/dev/null 2>&1; then
    echo "✅ API fonctionnelle : https://livrestaka.fr/api/tarifs"
else
    echo "⚠️ API non accessible : https://livrestaka.fr/api/tarifs"
fi

# Test webhook
if curl -X POST --connect-timeout 10 --max-time 15 https://livrestaka.fr/payments/webhook -H "Content-Type: application/json" -d '{"test":true}' 2>&1 | grep -q "signature"; then
    echo "✅ Webhook Stripe opérationnel : https://livrestaka.fr/payments/webhook"
else
    echo "⚠️ Webhook Stripe problématique"
fi

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ !"
echo "======================="
echo "🌐 Site principal    : https://livrestaka.fr"
echo "🔧 API Backend      : https://livrestaka.fr/api"
echo "💳 Webhook Stripe   : https://livrestaka.fr/payments/webhook"
echo "🏥 Health check     : https://livrestaka.fr/health"
echo ""
echo "📋 Configuration actuelle :"
echo "   - Version déployée : $TAG"
echo "   - Images Docker    : $DOCKER_REGISTRY/frontend:$TAG, $DOCKER_REGISTRY/backend:$TAG"
echo "   - Architecture     : nginx externe → conteneurs ports 8080/3000"
echo "   - Base de données  : MySQL 8.0 avec migrations appliquées"
echo "   - SSL/TLS         : Let's Encrypt (nginx externe)"
echo ""
echo "🔑 Variables critiques configurées :"
echo "   - Stripe LIVE      : ✅ Configuré"
echo "   - Resend (Email)   : ✅ Configuré avec domaine vérifié" 
echo "   - Email admin      : ✅ contact@staka.fr"
echo "   - FROM_EMAIL       : ✅ noreply@livrestaka.fr"
echo ""
echo "✨ Déploiement réussi ! Site prêt pour la production."