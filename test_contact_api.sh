#!/bin/bash

echo "🧪 Test de l'API de contact"
echo "================================"

# Test 1: Message valide
echo ""
echo "📤 Test 1: Envoi d'un message valide"
curl -X POST http://localhost:3001/api/public/contact \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test User",
    "email": "test@example.com", 
    "sujet": "Test depuis l'\''API",
    "message": "Ceci est un message de test pour vérifier que l'\''API fonctionne correctement."
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: Champs manquants
echo ""
echo "❌ Test 2: Champs manquants (devrait échouer)"
curl -X POST http://localhost:3001/api/public/contact \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test User",
    "email": "", 
    "sujet": "Test",
    "message": "Message test"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 3: Email invalide
echo ""
echo "❌ Test 3: Email invalide (devrait échouer)"
curl -X POST http://localhost:3001/api/public/contact \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test User",
    "email": "email-invalide", 
    "sujet": "Test",
    "message": "Message test"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ Tests terminés"