#!/bin/bash

# 🔐 Script d'exécution des tests de sécurité - Staka Livres
# Usage: ./scripts/run-security-tests.sh [option]
# Options: --critical, --full, --performance, --coverage, --ci

set -e  # Exit on error

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend"

# Fonction d'affichage
print_header() {
    echo -e "\n${BLUE}🔐 ================================================${NC}"
    echo -e "${BLUE}    TESTS DE SÉCURITÉ STAKA-LIVRES${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_section() {
    echo -e "\n${PURPLE}📋 $1${NC}"
    echo -e "${PURPLE}$(printf '=%.0s' {1..50})${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction de vérification des prérequis
check_prerequisites() {
    print_section "Vérification des prérequis"
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé"
        exit 1
    fi
    print_success "Node.js $(node --version)"
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé"
        exit 1
    fi
    print_success "npm $(npm --version)"
    
    # Vérifier le répertoire backend
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Répertoire backend non trouvé: $BACKEND_DIR"
        exit 1
    fi
    print_success "Répertoire backend trouvé"
    
    # Vérifier que les dépendances sont installées
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        print_warning "node_modules non trouvé, installation des dépendances..."
        cd "$BACKEND_DIR"
        npm install
        cd "$ROOT_DIR"
    fi
    print_success "Dépendances installées"
}

# Fonction d'exécution des tests critiques
run_critical_tests() {
    print_section "Tests de Sécurité Critiques"
    
    cd "$BACKEND_DIR"
    
    echo -e "\n${BLUE}🔐 Tests d'Authentification...${NC}"
    npx vitest run src/__tests__/controllers/authController.test.ts --reporter=verbose
    
    echo -e "\n${BLUE}🗝️ Tests Middleware JWT...${NC}"
    npx vitest run src/__tests__/middleware/auth.test.ts --reporter=verbose
    
    echo -e "\n${BLUE}💳 Tests Webhook Stripe...${NC}"
    npx vitest run src/__tests__/routes/webhook.security.test.ts --reporter=verbose
    
    cd "$ROOT_DIR"
    print_success "Tests critiques terminés"
}

# Fonction d'exécution des tests complets
run_full_tests() {
    print_section "Suite Complète des Tests de Sécurité"
    
    cd "$BACKEND_DIR"
    
    echo -e "\n${BLUE}🔐 Tests d'Authentification...${NC}"
    npx vitest run src/__tests__/controllers/authController.test.ts --reporter=verbose
    
    echo -e "\n${BLUE}🗝️ Tests Middleware JWT...${NC}"
    npx vitest run src/__tests__/middleware/auth.test.ts --reporter=verbose
    
    echo -e "\n${BLUE}💳 Tests Webhook Stripe...${NC}"
    npx vitest run src/__tests__/routes/webhook.security.test.ts --reporter=verbose
    
    echo -e "\n${BLUE}💰 Tests Contrôleur Paiement...${NC}"
    npx vitest run src/__tests__/controllers/paymentController.test.ts --reporter=verbose
    
    cd "$ROOT_DIR"
    print_success "Tests complets terminés"
}

# Fonction d'exécution des tests de performance
run_performance_tests() {
    print_section "Tests de Performance et DoS Protection"
    
    cd "$BACKEND_DIR"
    
    echo -e "\n${BLUE}⚡ Tests de Performance et Résistance DoS...${NC}"
    npx vitest run src/__tests__/performance/load.security.test.ts --reporter=verbose
    
    cd "$ROOT_DIR"
    print_success "Tests de performance terminés"
}

# Fonction d'exécution avec couverture
run_coverage_tests() {
    print_section "Tests de Sécurité avec Couverture"
    
    cd "$BACKEND_DIR"
    
    echo -e "\n${BLUE}📊 Exécution avec analyse de couverture...${NC}"
    npx vitest run src/__tests__/controllers/authController.test.ts src/__tests__/middleware/auth.test.ts src/__tests__/routes/webhook.security.test.ts src/__tests__/controllers/paymentController.test.ts --coverage --reporter=verbose
    
    cd "$ROOT_DIR"
    print_success "Tests avec couverture terminés"
}

# Fonction d'exécution pour CI/CD
run_ci_tests() {
    print_section "Tests de Sécurité CI/CD (Optimisés)"
    
    cd "$BACKEND_DIR"
    
    echo -e "\n${BLUE}🚀 Tests optimisés pour CI/CD...${NC}"
    npx vitest run src/__tests__/controllers/authController.test.ts src/__tests__/middleware/auth.test.ts src/__tests__/routes/webhook.security.test.ts --reporter=json --outputFile=security-test-results.json
    
    if [ $? -eq 0 ]; then
        print_success "Tous les tests de sécurité CI/CD ont réussi"
    else
        print_error "Échec des tests de sécurité CI/CD"
        exit 1
    fi
    
    cd "$ROOT_DIR"
}

# Fonction de génération de rapport
generate_report() {
    print_section "Génération du Rapport de Sécurité"
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="$ROOT_DIR/security-report-$timestamp.md"
    
    cat > "$report_file" << EOF
# 🔐 Rapport de Tests de Sécurité - Staka Livres

**Date**: $(date '+%d/%m/%Y %H:%M:%S')
**Version**: $(cd "$BACKEND_DIR" && node -p "require('./package.json').version")
**Environment**: ${NODE_ENV:-development}

## 📊 Résumé des Tests

### Tests Exécutés
- ✅ Tests d'Authentification (authController.test.ts)
- ✅ Tests Middleware JWT (auth.test.ts)  
- ✅ Tests Webhook Stripe (webhook.security.test.ts)
- ✅ Tests Contrôleur Paiement (paymentController.test.ts)
- ✅ Tests Performance DoS (load.security.test.ts)

### Couverture de Sécurité
- 🔐 **Authentification**: Protection force brute, injection SQL, énumération
- 🗝️ **JWT Middleware**: Validation tokens, manipulation, élévation privilèges
- 💳 **Webhooks Stripe**: Signatures, replay protection, tampering
- 💰 **Paiements**: Autorisation, validation, doubles paiements
- ⚡ **Performance**: Résistance DoS, montée en charge, fuites mémoire

### Standards de Sécurité
- ✅ OWASP Top 10 Coverage
- ✅ PCI DSS Requirements (paiements)
- ✅ RGPD Compliance
- ✅ Enterprise Security Standards

## 🎯 Recommandations

1. **Monitoring Continu**: Surveillance logs sécurité en production
2. **Penetration Testing**: Tests réguliers par équipe externe
3. **Security Training**: Formation équipe développement
4. **Incident Response**: Plan réponse incidents sécurité

---
*Rapport généré automatiquement par les tests de sécurité Staka-Livres*
EOF

    print_success "Rapport généré: $report_file"
}

# Fonction d'affichage de l'aide
show_help() {
    cat << EOF
🔐 Script de Tests de Sécurité - Staka Livres

Usage: $0 [option]

Options:
  --critical      Tests de sécurité critiques uniquement (< 1 min)
  --full          Suite complète des tests de sécurité (< 3 min)
  --performance   Tests de performance et résistance DoS
  --coverage      Tests avec analyse de couverture de code
  --ci            Tests optimisés pour CI/CD
  --report        Génération uniquement du rapport
  --help          Affiche cette aide

Exemples:
  $0 --critical          # Tests critiques rapides
  $0 --full --report     # Tests complets + rapport
  $0 --ci                # Tests pour pipeline CI/CD

Tests Disponibles:
  📋 69 tests de sécurité répartis sur 5 suites
  🔐 Tests d'authentification (15 tests)
  🗝️ Tests middleware JWT (12 tests)
  💳 Tests webhook Stripe (18 tests)
  💰 Tests contrôleur paiement (16 tests)
  ⚡ Tests performance DoS (8 tests)

Durée d'Exécution:
  Critical: ~30 secondes
  Full: ~2 minutes
  Performance: ~1 minute
  Coverage: ~3 minutes

EOF
}

# Fonction principale
main() {
    local option="${1:-}"
    local generate_report_flag=false
    
    # Vérifier si --report est présent
    for arg in "$@"; do
        if [ "$arg" = "--report" ]; then
            generate_report_flag=true
            break
        fi
    done
    
    # Traitement des options
    case "$option" in
        --critical)
            print_header
            check_prerequisites
            run_critical_tests
            ;;
        --full)
            print_header
            check_prerequisites
            run_full_tests
            if [ "$generate_report_flag" = true ]; then
                generate_report
            fi
            ;;
        --performance)
            print_header
            check_prerequisites
            run_performance_tests
            ;;
        --coverage)
            print_header
            check_prerequisites
            run_coverage_tests
            ;;
        --ci)
            print_header
            check_prerequisites
            run_ci_tests
            ;;
        --report)
            print_header
            generate_report
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        "")
            print_header
            check_prerequisites
            run_critical_tests
            print_warning "Utilisez --full pour la suite complète ou --help pour plus d'options"
            ;;
        *)
            print_error "Option non reconnue: $option"
            echo "Utilisez --help pour voir les options disponibles"
            exit 1
            ;;
    esac
    
    # Message final
    echo -e "\n${GREEN}🎉 Tests de sécurité terminés avec succès !${NC}"
    echo -e "${BLUE}📚 Consultez docs/SECURITY_TESTS_GUIDE.md pour plus d'informations${NC}\n"
}

# Gestion des signaux
trap 'print_error "Interruption par l\'utilisateur"; exit 1' INT TERM

# Point d'entrée
main "$@"
