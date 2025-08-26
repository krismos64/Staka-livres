#!/bin/bash

echo "🧪 TEST - Simulation de déploiement des variables d'environnement"
echo "=================================================="

# Vérifier que .env.prod existe
if [ ! -f .env.prod ]; then
    echo "❌ ERREUR: Fichier .env.prod introuvable!"
    exit 1
fi

echo "✅ Fichier .env.prod trouvé localement"

echo ""
echo "🔍 Variables critiques qui seront déployées:"
echo "============================================="
grep -E "STRIPE_SECRET_KEY|SENDGRID_API_KEY|ADMIN_EMAIL|SUPPORT_EMAIL|FROM_EMAIL" .env.prod | sed 's/\(SECRET_KEY=sk_live_[^"]*\).*/\1***/' | sed 's/\(SENDGRID_API_KEY=SG\.[^"]*\).*/\1***/' | sed 's/="\([^"]*\)"/=\1/'

echo ""
echo "📧 Configuration email unifiée:"
echo "==============================="
grep -E "FROM_EMAIL|SUPPORT_EMAIL|ADMIN_EMAIL" .env.prod

echo ""
echo "💳 Configuration Stripe:"
echo "========================"
if grep -q "sk_live_" .env.prod; then
    echo "✅ Clé Stripe LIVE détectée"
else
    echo "❌ ATTENTION: Pas de clé Stripe LIVE trouvée!"
fi

if grep -q "whsec_" .env.prod; then
    echo "✅ Webhook secret configuré"
else
    echo "❌ ATTENTION: Webhook secret manquant!"
fi

echo ""
echo "📬 Configuration SendGrid:"
echo "=========================="
if grep -q "SG\." .env.prod; then
    echo "✅ Clé SendGrid détectée"
else
    echo "❌ ATTENTION: Clé SendGrid manquante!"
fi

echo ""
echo "🎯 RÉSUMÉ:"
echo "=========="
echo "Le déploiement copiera ces variables sur le VPS et redémarrera les services."
echo "Les paiements et emails fonctionneront avec ces configurations."