#!/bin/bash

echo "🧪 TEST - Configuration nginx pour le déploiement"
echo "================================================="

# Vérifier que les fichiers nginx existent
echo ""
echo "📂 Vérification des fichiers nginx:"

if [ -f "frontend/nginx-prod.conf" ]; then
    echo "✅ nginx-prod.conf trouvé"
else
    echo "❌ nginx-prod.conf manquant"
    exit 1
fi

if [ -f "docker-compose.prod.yml" ]; then
    echo "✅ docker-compose.prod.yml trouvé"
else
    echo "❌ docker-compose.prod.yml manquant"  
    exit 1
fi

echo ""
echo "🔍 Analyse de la configuration nginx-prod.conf:"

# Vérifier les éléments critiques
if grep -q "listen 80" frontend/nginx-prod.conf; then
    echo "✅ Port HTTP 80 configuré (correct pour conteneur interne)"
else
    echo "❌ Port HTTP manquant"
fi

if grep -q "ssl_certificate" frontend/nginx-prod.conf; then
    echo "⚠️  Configuration SSL trouvée dans nginx-prod (problématique pour conteneur)"
else
    echo "✅ Pas de SSL dans conteneur (correct pour architecture externe)"
fi

if grep -q "staka_backend_prod:3000" frontend/nginx-prod.conf; then
    echo "✅ Nom de conteneur backend correct"
else
    echo "❌ Nom de conteneur backend incorrect"
fi

if grep -q "/payments/webhook" frontend/nginx-prod.conf; then
    echo "✅ Route webhook Stripe configurée"
else
    echo "❌ Route webhook Stripe manquante"
fi

if grep -q "proxy_set_header Stripe-Signature" frontend/nginx-prod.conf; then
    echo "✅ Header Stripe-Signature préservé"
else
    echo "❌ Header Stripe-Signature manquant"
fi

if grep -q "proxy_buffering off" frontend/nginx-prod.conf; then
    echo "✅ Buffering désactivé pour webhooks"
else
    echo "❌ Buffering non désactivé"
fi

echo ""
echo "🔍 Analyse du docker-compose.prod.yml:"

if grep -q "nginx-prod.conf" docker-compose.prod.yml; then
    echo "✅ docker-compose utilise nginx-prod.conf"
else
    echo "❌ docker-compose utilise une mauvaise config nginx"
fi

if grep -q "8080:80" docker-compose.prod.yml; then
    echo "✅ Port mapping correct (8080:80)"
else
    echo "❌ Port mapping incorrect"
fi

if grep -q "staka_backend_prod" docker-compose.prod.yml; then
    echo "✅ Nom de conteneur backend cohérent"
else
    echo "❌ Nom de conteneur backend incorrect"
fi

echo ""
echo "🎯 RÉSUMÉ:"
echo "========="
echo "Configuration nginx prête pour déploiement avec nginx externe."
echo "Architecture: nginx VPS (HTTPS) → conteneur nginx (HTTP) → backend"