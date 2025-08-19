#!/bin/bash

# Script pour corriger le problème de webhook Stripe en production
# Exécuter ce script sur le VPS pour appliquer les corrections

set -e

echo "🔧 Correction du webhook Stripe pour livrestaka.fr"
echo "=================================================="

# Variables
NGINX_CONF="/etc/nginx/sites-available/livrestaka.fr"
NGINX_ENABLED="/etc/nginx/sites-enabled/livrestaka.fr"
BACKUP_DIR="/root/nginx-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Créer le dossier de backup si nécessaire
echo "📁 Création du dossier de backup..."
mkdir -p $BACKUP_DIR

# Backup de la configuration actuelle
echo "💾 Sauvegarde de la configuration actuelle..."
if [ -f "$NGINX_CONF" ]; then
    cp $NGINX_CONF "$BACKUP_DIR/livrestaka.fr_$TIMESTAMP.conf"
    echo "✅ Configuration sauvegardée dans: $BACKUP_DIR/livrestaka.fr_$TIMESTAMP.conf"
else
    echo "⚠️  Aucune configuration existante trouvée"
fi

# Créer la nouvelle configuration
echo "📝 Création de la nouvelle configuration nginx..."
cat > $NGINX_CONF << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name livrestaka.fr www.livrestaka.fr;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name livrestaka.fr www.livrestaka.fr;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/livrestaka.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/livrestaka.fr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;

    root /var/www/livrestaka.fr/html;
    index index.html index.htm;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        application/javascript
        application/json
        text/css
        text/plain
        text/html;

    # CRITICAL: Stripe webhook endpoint - MUST be before /api location
    location = /payments/webhook {
        # Permettre uniquement POST
        if ($request_method != POST) {
            return 405;
        }
        
        # Proxy vers le backend sur le bon port
        proxy_pass http://127.0.0.1:3001/payments/webhook;
        
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CRITICAL: Préserver le header Stripe-Signature
        proxy_set_header Stripe-Signature $http_stripe_signature;
        
        # CRITICAL: Désactiver le buffering pour les webhooks
        proxy_buffering off;
        proxy_request_buffering off;
        
        # Timeouts généreux
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Taille max du body
        client_max_body_size 10M;
        client_body_buffer_size 128k;
        
        # Logs pour debug
        access_log /var/log/nginx/stripe_webhook_access.log;
        error_log /var/log/nginx/stripe_webhook_error.log debug;
    }

    # API proxy to backend
    location /api {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Créer le lien symbolique si nécessaire
if [ ! -L "$NGINX_ENABLED" ]; then
    echo "🔗 Création du lien symbolique..."
    ln -s $NGINX_CONF $NGINX_ENABLED
fi

# Test de la configuration nginx
echo "🧪 Test de la configuration nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration nginx valide"
    
    # Recharger nginx
    echo "🔄 Rechargement de nginx..."
    systemctl reload nginx
    
    echo "✅ Nginx rechargé avec succès"
    
    # Test du webhook
    echo ""
    echo "🧪 Test du endpoint webhook..."
    echo "=================================================="
    
    # Test avec curl
    response=$(curl -X POST https://livrestaka.fr/payments/webhook \
        -H "Content-Type: application/json" \
        -H "Stripe-Signature: test" \
        -d '{"test": true}' \
        -w "\n%{http_code}" \
        -s)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    echo "Code HTTP reçu: $http_code"
    
    if [ "$http_code" = "400" ]; then
        echo "✅ Le webhook répond correctement (400 = signature invalide attendue pour un test)"
        echo "Le webhook est maintenant accessible et devrait fonctionner avec Stripe"
    elif [ "$http_code" = "405" ]; then
        echo "❌ Erreur 405: Method Not Allowed - Le problème n'est pas résolu"
        echo "Vérifiez que le backend est bien lancé sur le port 3001"
    else
        echo "⚠️  Code HTTP inattendu: $http_code"
        echo "Réponse: $body"
    fi
    
    # Vérifier que le backend est bien lancé
    echo ""
    echo "🔍 Vérification du backend..."
    if lsof -i:3001 > /dev/null 2>&1; then
        echo "✅ Le backend est bien lancé sur le port 3001"
    else
        echo "❌ Le backend n'est pas lancé sur le port 3001!"
        echo "Vérifiez avec: docker ps ou pm2 status"
    fi
    
    # Afficher les logs
    echo ""
    echo "📋 Dernières lignes des logs nginx:"
    echo "=================================================="
    tail -n 10 /var/log/nginx/error.log
    
    echo ""
    echo "📋 Pour suivre les logs du webhook en temps réel:"
    echo "tail -f /var/log/nginx/stripe_webhook_error.log"
    
else
    echo "❌ Erreur dans la configuration nginx"
    echo "Restauration de la configuration précédente..."
    
    if [ -f "$BACKUP_DIR/livrestaka.fr_$TIMESTAMP.conf" ]; then
        cp "$BACKUP_DIR/livrestaka.fr_$TIMESTAMP.conf" $NGINX_CONF
        systemctl reload nginx
        echo "✅ Configuration précédente restaurée"
    fi
    
    exit 1
fi

echo ""
echo "🎉 Script terminé avec succès!"
echo "=================================================="
echo "Actions effectuées:"
echo "✅ Configuration nginx mise à jour"
echo "✅ Webhook Stripe configuré sur /payments/webhook"
echo "✅ Logs spécifiques activés pour le webhook"
echo ""
echo "⚠️  IMPORTANT: Assurez-vous que:"
echo "1. Le backend Node.js est bien lancé sur le port 3001"
echo "2. La variable STRIPE_WEBHOOK_SECRET est correcte dans le .env"
echo "3. L'URL du webhook dans le dashboard Stripe est: https://livrestaka.fr/payments/webhook"