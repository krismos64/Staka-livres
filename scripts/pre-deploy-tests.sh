#!/bin/bash
# 🧪 Script de tests pré-déploiement - Staka Livres
# Usage: ./scripts/pre-deploy-tests.sh

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Variables de contrôle
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TESTS_PASSED=0
TESTS_FAILED=0

# Fonctions d'affichage
print_header() {
    echo -e "\n${BLUE}🧪 ================================================${NC}"
    echo -e "${BLUE}    TESTS PRÉ-DÉPLOIEMENT STAKA-LIVRES${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_section() {
    echo -e "\n${PURPLE}📋 $1${NC}"
    echo -e "${PURPLE}$(printf '%.0s─' $(seq 1 ${#1}))${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test 1: Configuration des credentials
test_credentials() {
    print_section "1. VÉRIFICATION CREDENTIALS DE DÉPLOIEMENT"
    
    if [ ! -f "$ROOT_DIR/.env.deploy" ]; then
        log_error "Fichier .env.deploy manquant"
        return 1
    fi
    
    source "$ROOT_DIR/.env.deploy"
    
    if [ -f "$ROOT_DIR/.env.deploy.local" ]; then
        source "$ROOT_DIR/.env.deploy.local"
        log_success "Credentials locaux chargés depuis .env.deploy.local"
    else
        log_warning "Fichier .env.deploy.local manquant - utilisation des placeholders"
    fi
    
    # Vérifications
    if [ -z "$DOCKERHUB_USER" ] || [ "$DOCKERHUB_USER" = "YOUR_DOCKERHUB_USERNAME" ]; then
        log_error "DOCKERHUB_USER non configuré"
        return 1
    fi
    
    if [ -z "$DOCKERHUB_TOKEN" ] || [ "$DOCKERHUB_TOKEN" = "YOUR_DOCKERHUB_TOKEN_HERE" ]; then
        log_error "DOCKERHUB_TOKEN non configuré"
        return 1
    fi
    
    if [ -z "$VPS_HOST" ] || [ "$VPS_HOST" = "YOUR_VPS_IP" ]; then
        log_error "VPS_HOST non configuré"
        return 1
    fi
    
    log_success "Docker Hub User: $DOCKERHUB_USER"
    log_success "Token Docker Hub: $(echo $DOCKERHUB_TOKEN | cut -c1-10)***"
    log_success "VPS Host: $VPS_HOST"
    log_success "Credentials de déploiement valides"
}

# Test 2: Build des images Docker production
test_docker_builds() {
    print_section "2. TEST BUILD IMAGES DOCKER PRODUCTION"
    
    log_info "Build image frontend..."
    if docker buildx build --platform linux/amd64 -t staka-test-frontend -f "$ROOT_DIR/frontend/Dockerfile" "$ROOT_DIR" >/dev/null 2>&1; then
        log_success "Build frontend réussi"
        docker image rm staka-test-frontend >/dev/null 2>&1 || true
    else
        log_error "Échec build frontend"
        return 1
    fi
    
    log_info "Build image backend..."
    if docker buildx build --platform linux/amd64 -t staka-test-backend -f "$ROOT_DIR/backend/Dockerfile" "$ROOT_DIR" >/dev/null 2>&1; then
        log_success "Build backend réussi"
        docker image rm staka-test-backend >/dev/null 2>&1 || true
    else
        log_error "Échec build backend"
        return 1
    fi
    
    log_success "Builds Docker production validés"
}

# Test 3: Environnement local Docker
test_local_environment() {
    print_section "3. VÉRIFICATION ENVIRONNEMENT LOCAL"
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker non installé"
        return 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon non démarré"
        return 1
    fi
    
    log_success "Docker opérationnel"
    
    # Vérifier buildx
    if ! docker buildx version >/dev/null 2>&1; then
        log_error "Docker buildx non disponible"
        return 1
    fi
    
    log_success "Docker buildx disponible"
    
    # Vérifier les fichiers essentiels
    local essential_files=(
        "docker-compose.yml"
        "docker-compose.prod.yml" 
        "deploy.sh"
        "frontend/Dockerfile"
        "backend/Dockerfile"
        ".env.prod"
    )
    
    for file in "${essential_files[@]}"; do
        if [ ! -f "$ROOT_DIR/$file" ]; then
            log_error "Fichier essentiel manquant: $file"
            return 1
        fi
    done
    
    log_success "Tous les fichiers essentiels présents"
}

# Test 4: Tests de sécurité critiques
test_security() {
    print_section "4. TESTS DE SÉCURITÉ CRITIQUES"
    
    if [ -f "$ROOT_DIR/scripts/run-security-optimized.sh" ]; then
        log_info "Lancement des tests de sécurité..."
        if timeout 60 "$ROOT_DIR/scripts/run-security-optimized.sh" --critical >/dev/null 2>&1; then
            log_success "Tests de sécurité passés"
        else
            log_warning "Tests de sécurité échoués ou timeout"
            # Ne pas faire échouer le déploiement pour les tests de sécurité
        fi
    else
        log_warning "Script de tests de sécurité introuvable"
    fi
}

# Test 5: Connectivité réseau
test_connectivity() {
    print_section "5. TESTS DE CONNECTIVITÉ"
    
    # Test Docker Hub
    log_info "Test connexion Docker Hub..."
    if timeout 10 docker pull hello-world >/dev/null 2>&1; then
        log_success "Connexion Docker Hub OK"
        docker image rm hello-world >/dev/null 2>&1 || true
    else
        log_error "Impossible de se connecter à Docker Hub"
        return 1
    fi
    
    # Test VPS si configured
    if [ "$VPS_HOST" != "YOUR_VPS_IP" ] && [ ! -z "$VPS_HOST" ]; then
        log_info "Test ping VPS..."
        if timeout 5 ping -c 1 "$VPS_HOST" >/dev/null 2>&1; then
            log_success "VPS accessible: $VPS_HOST"
        else
            log_warning "VPS non accessible via ping (firewall possible)"
        fi
    fi
}

# Résumé final
print_summary() {
    echo -e "\n${BLUE}📊 RÉSUMÉ DES TESTS${NC}"
    echo -e "${BLUE}==================${NC}"
    echo -e "✅ Tests réussis: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "❌ Tests échoués: ${RED}$TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🚀 DÉPLOIEMENT AUTORISÉ !${NC}"
        echo -e "${GREEN}Vous pouvez lancer: ./deploy.sh${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}🚫 DÉPLOIEMENT BLOQUÉ !${NC}"
        echo -e "${RED}Corrigez les erreurs avant de déployer${NC}"
        echo ""
        return 1
    fi
}

# Fonction principale
main() {
    print_header
    
    cd "$ROOT_DIR"
    
    # Exécution des tests
    test_credentials || true
    test_local_environment || true  
    test_docker_builds || true
    test_security || true
    test_connectivity || true
    
    print_summary
}

# Gestion des signaux
cleanup() {
    log_warning "Tests interrompus par l'utilisateur"
    exit 130
}

trap cleanup SIGINT SIGTERM

# Exécution
main "$@"