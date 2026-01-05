#!/bin/bash
# Déploiement uniquement du service Certbot
# Utilise sshpass comme deploy.sh

source .env.deploy
if [ -f .env.deploy.local ]; then
    source .env.deploy.local
fi

VPS_PROJECT_DIR="/opt/staka-livres"

echo "🚀 Déploiement service Certbot uniquement"
echo "=========================================="

# Copier les fichiers nécessaires
echo "📝 Copie des fichiers..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no docker-compose.prod.yml $VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no scripts/certbot-renew.sh $VPS_USER@$VPS_HOST:$VPS_PROJECT_DIR/scripts/

# Déploiement sur VPS
echo "🔄 Déploiement sur VPS..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'ENDSSH'
    cd /opt/staka-livres
    
    echo "📁 Création dossiers..."
    mkdir -p /opt/staka/certbot-logs
    chmod 755 /opt/staka/certbot-logs
    chmod +x scripts/certbot-renew.sh
    
    echo "🐳 Redéploiement avec Certbot..."
    docker compose -f docker-compose.prod.yml down
    docker compose -f docker-compose.prod.yml up -d
    
    echo "⏳ Attente 15 secondes..."
    sleep 15
    
    echo "🔍 Vérification..."
    docker ps | grep certbot
    
    if docker ps | grep -q staka_certbot_prod; then
        echo "✅ Service Certbot actif !"
        
        echo ""
        echo "🧪 Test dry-run..."
        docker exec staka_certbot_prod certbot renew --dry-run
        
        echo ""
        echo "📅 Certificats actuels..."
        docker exec staka_certbot_prod certbot certificates
    else
        echo "❌ Service Certbot NON trouvé !"
        exit 1
    fi
ENDSSH

echo ""
echo "🎉 Déploiement Certbot terminé !"
echo "✅ Vérification automatique toutes les 12h"
echo "✅ Renouvellement 30 jours avant expiration"
