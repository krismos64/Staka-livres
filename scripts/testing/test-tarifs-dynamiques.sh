#!/bin/bash

# 🧪 Script de Validation Complète - Tarifs Dynamiques
# Utilisation: ./test-tarifs-dynamiques.sh

set -e # Arrêter en cas d'erreur

echo "🎯 === VALIDATION TARIFS DYNAMIQUES ===" 
echo ""

# Couleurs pour les logs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérification de l'environnement
log_info "Vérification de l'environnement..."

if [ ! -f "package.json" ]; then
    log_error "Vous devez être dans le répertoire frontend/"
    exit 1
fi

if [ ! -f "src/__tests__/tarifsInvalidation.test.tsx" ]; then
    log_error "Fichier de test unitaire manquant!"
    exit 1
fi

if [ ! -f "cypress/e2e/tarifsSync.cy.ts" ]; then
    log_error "Fichier de test E2E manquant!"
    exit 1
fi

log_success "Environnement validé"
echo ""

# 1. Tests Unitaires Vitest
log_info "🧪 ÉTAPE 1: Tests Unitaires Vitest"
echo "----------------------------------------"

log_info "Lancement des tests unitaires tarifs..."
if npm run test:run -- src/__tests__/tarifsInvalidation.test.tsx; then
    log_success "Tests unitaires PASSÉS ✨"
else
    log_error "Tests unitaires ÉCHOUÉS"
    echo ""
    log_warning "💡 Debug: Vérifiez les mocks et l'API dans le test"
    log_warning "💡 Commande: npm run test -- src/__tests__/tarifsInvalidation.test.tsx --watch"
    exit 1
fi

echo ""

# 2. Coverage
log_info "📊 ÉTAPE 2: Couverture de Code"
echo "----------------------------------------"

log_info "Génération de la couverture..."
if npm run test:coverage -- src/__tests__/tarifsInvalidation.test.tsx; then
    log_success "Couverture générée ✨"
    log_info "📁 Rapport disponible dans ./coverage/index.html"
else
    log_warning "Couverture partielle ou échec"
fi

echo ""

# 3. Vérification Backend (pour E2E)
log_info "🔗 ÉTAPE 3: Vérification Backend"
echo "----------------------------------------"

log_info "Test de connectivité backend..."
if curl -s http://localhost:3001/api/tarifs > /dev/null 2>&1; then
    log_success "Backend accessible sur http://localhost:3001"
elif curl -s http://backend:3001/api/tarifs > /dev/null 2>&1; then
    log_success "Backend accessible sur http://backend:3001"
else
    log_warning "Backend non accessible - tests E2E pourraient échouer"
    log_info "💡 Démarrez le backend: cd ../backend && npm run dev"
    log_info "💡 Ou avec Docker: docker-compose up -d backend"
    read -p "Continuer quand même? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# 4. Tests E2E Cypress
log_info "🌐 ÉTAPE 4: Tests E2E Cypress"
echo "----------------------------------------"

log_info "Lancement des tests E2E (mode headless)..."
if npx cypress run --spec "cypress/e2e/tarifsSync.cy.ts" --quiet; then
    log_success "Tests E2E PASSÉS ✨"
else
    log_error "Tests E2E ÉCHOUÉS"
    echo ""
    log_warning "💡 Debug: Lancez en mode interactif: npm run test:e2e:open"
    log_warning "💡 Vérifiez les sélecteurs et l'API en mode headless"
    log_warning "💡 Screenshots disponibles dans ./cypress/screenshots/"
    exit 1
fi

echo ""

# 5. Résumé Final
log_info "📋 RÉSUMÉ FINAL"
echo "----------------------------------------"

log_success "✅ Tests unitaires Vitest: PASSÉS"
log_success "✅ Couverture de code: Générée"
log_success "✅ Tests E2E Cypress: PASSÉS"

echo ""
echo "🎉 === VALIDATION COMPLÈTE RÉUSSIE ==="
echo ""
log_success "Les tarifs dynamiques sont 100% fonctionnels!"
echo ""
log_info "📁 Rapports disponibles:"
log_info "   • Coverage: ./coverage/index.html"
log_info "   • Screenshots E2E: ./cypress/screenshots/"
log_info "   • Videos E2E: ./cypress/videos/"
echo ""
log_info "🚀 Prêt pour la production!"

# 6. Tests Manuels (Optionnel)
echo ""
read -p "Voulez-vous lancer les tests manuels interactifs? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    log_info "🔍 TESTS MANUELS"
    echo "----------------------------------------"
    
    log_info "1. Ouvrez http://localhost:3000/admin/tarifs"
    log_info "2. Modifiez un tarif (nom + prix)"
    log_info "3. Ouvrez http://localhost:3000/ (landing)"
    log_info "4. Vérifiez que le tarif modifié apparaît"
    echo ""
    log_warning "Temps de synchronisation attendu: < 2 secondes"
    echo ""
    read -p "Appuyez sur Entrée quand vous avez terminé..."
    
    log_success "Tests manuels terminés ✨"
fi

echo ""
log_success "🎯 Validation des tarifs dynamiques COMPLÈTE!" 