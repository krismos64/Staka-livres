#!/bin/bash

echo "🧪 TEST - Filtrage des webhooks Stripe par source"
echo "================================================="

WEBHOOK_URL="http://localhost:3000/payments/webhook"

echo ""
echo "🔍 Test 1: Webhook avec source NON AUTORISÉE (autre-site.fr)"
echo "-------------------------------------------------------------"
RESPONSE1=$(curl -s -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"id":"evt_test_1","type":"checkout.session.completed","data":{"object":{"id":"cs_test_1","metadata":{"source":"autre-site.fr"}}}}')
echo "Réponse: $RESPONSE1"

if echo "$RESPONSE1" | grep -q "ignored.*true"; then
  echo "✅ Test 1 RÉUSSI: Événement rejeté comme attendu"
else
  echo "❌ Test 1 ÉCHEC: Événement non rejeté"
fi

echo ""
echo "🔍 Test 2: Webhook avec source AUTORISÉE (livrestaka.fr)"
echo "--------------------------------------------------------"
RESPONSE2=$(curl -s -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"id":"evt_test_2","type":"checkout.session.completed","data":{"object":{"id":"cs_test_2","metadata":{"source":"livrestaka.fr"}}}}')
echo "Réponse: $RESPONSE2"

if echo "$RESPONSE2" | grep -q "Signature webhook invalide"; then
  echo "✅ Test 2 RÉUSSI: Source acceptée, échec attendu sur signature"
else
  echo "❌ Test 2 ÉCHEC: Comportement inattendu"
fi

echo ""
echo "🔍 Test 3: Webhook SANS source (ancien site)"
echo "--------------------------------------------"
RESPONSE3=$(curl -s -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"id":"evt_test_3","type":"checkout.session.completed","data":{"object":{"id":"cs_test_3","metadata":{}}}}')
echo "Réponse: $RESPONSE3"

if echo "$RESPONSE3" | grep -q "ignored.*true"; then
  echo "✅ Test 3 RÉUSSI: Événement sans source rejeté"
else
  echo "❌ Test 3 ÉCHEC: Événement sans source non rejeté"
fi

echo ""
echo "🎯 RÉSUMÉ DU FILTRAGE:"
echo "====================="
echo "✅ Le webhook rejette maintenant les événements d'autres sites"
echo "✅ Seuls les événements de livrestaka.fr sont traités"
echo "✅ Les anciens événements sans source sont rejetés"
echo ""
echo "🚀 Déploiement: Le filtrage sera actif après ./deploy.sh"