#!/usr/bin/env bash
set -euo pipefail

# Script de build multi-architecture pour Staka-Livres
# Usage: ./scripts/docker-build.sh <tag> [--push] [--platform linux/amd64,linux/arm64] [--service backend|frontend]

# Configuration par défaut
DOCKER_REGISTRY="${DOCKER_REGISTRY:-krismos64}"
DEFAULT_PLATFORMS="linux/amd64,linux/arm64"
PUSH_TO_REGISTRY=false
BUILD_SERVICES=("backend" "frontend")
PLATFORMS="$DEFAULT_PLATFORMS"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    cat << EOF
Usage: $0 <tag> [options]

Arguments:
  <tag>           Tag pour les images (ex: dev, v1.4.0, latest)

Options:
  --push                      Push les images vers le registry après build
  --platform <platforms>      Plateformes cibles (défaut: linux/amd64,linux/arm64)
  --service <service>         Service spécifique à builder (backend|frontend)
  --registry <registry>       Registry Docker (défaut: krismos64)
  --help                      Affiche cette aide

Exemples:
  $0 dev                                    # Build local multi-service
  $0 v1.4.0 --push                        # Build + push images taggées v1.4.0
  $0 latest --push --service backend      # Build + push backend uniquement
  $0 dev --platform linux/amd64          # Build pour x86_64 uniquement

Variables d'environnement:
  DOCKER_REGISTRY    Registry Docker (défaut: krismos64)
  DOCKER_BUILDKIT    Active BuildKit (défaut: 1)
EOF
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! docker buildx version &> /dev/null; then
        log_error "Docker Buildx n'est pas disponible"
        exit 1
    fi
    
    # Vérifier que buildx est configuré pour multi-arch
    if ! docker buildx inspect default --bootstrap &> /dev/null; then
        log_warning "Configuration du builder multi-arch par défaut..."
        docker buildx create --use --name staka-builder --bootstrap || true
    fi
    
    log_success "Prérequis validés"
}

# Scanning des ports avant build (éviter les conflits)
scan_ports() {
    log_info "Scan des ports potentiellement en conflit..."
    
    local ports=(3000 3001 3306 5173)
    local conflicts=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            conflicts+=($port)
        fi
    done
    
    if [ ${#conflicts[@]} -gt 0 ]; then
        log_warning "Ports en conflit détectés: ${conflicts[*]}"
        log_warning "Considérez arrêter les services locaux avant le build"
    else
        log_success "Aucun conflit de port détecté"
    fi
}

# Build d'un service spécifique
build_service() {
    local service=$1
    local tag=$2
    local dockerfile=""
    local context="."
    local image_name="${DOCKER_REGISTRY}/${service}:${tag}"
    
    case $service in
        "backend")
            dockerfile="backend/Dockerfile"
            ;;
        "frontend")
            dockerfile="frontend/Dockerfile"
            ;;
        *)
            log_error "Service '$service' non reconnu. Services disponibles: backend, frontend"
            exit 1
            ;;
    esac
    
    log_info "Build du service '$service' avec le tag '$tag'..."
    log_info "Image: $image_name"
    log_info "Platforms: $PLATFORMS"
    
    # Arguments de build
    local build_args=(
        "buildx" "build"
        "--platform" "$PLATFORMS"
        "--file" "$dockerfile"
        "--tag" "$image_name"
        "--cache-from" "type=registry,ref=${image_name}-cache"
        "--cache-to" "type=registry,ref=${image_name}-cache,mode=max"
    )
    
    # Push si demandé
    if [ "$PUSH_TO_REGISTRY" = true ]; then
        build_args+=("--push")
        log_info "Les images seront push vers le registry"
    else
        build_args+=("--load")
        log_warning "Mode local: les images ne seront PAS push vers le registry"
    fi
    
    # Context
    build_args+=("$context")
    
    # Exécution du build
    log_info "Commande: docker ${build_args[*]}"
    
    if docker "${build_args[@]}"; then
        log_success "Build du service '$service' terminé avec succès"
        
        # Affichage des informations sur l'image
        if [ "$PUSH_TO_REGISTRY" = false ]; then
            log_info "Taille de l'image locale:"
            docker images "$image_name" --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}"
        fi
    else
        log_error "Échec du build du service '$service'"
        exit 1
    fi
}

# Fonction principale
main() {
    # Parse des arguments
    if [ $# -eq 0 ]; then
        log_error "Tag requis"
        show_usage
        exit 1
    fi
    
    local tag=$1
    shift
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --push)
                PUSH_TO_REGISTRY=true
                shift
                ;;
            --platform)
                PLATFORMS="$2"
                shift 2
                ;;
            --service)
                BUILD_SERVICES=("$2")
                shift 2
                ;;
            --registry)
                DOCKER_REGISTRY="$2"
                shift 2
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Option inconnue: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validation du tag
    if [[ ! "$tag" =~ ^[a-zA-Z0-9._-]+$ ]]; then
        log_error "Tag invalide: '$tag'. Utilisez uniquement des lettres, chiffres, points, traits d'union et underscores"
        exit 1
    fi
    
    # Information sur la configuration
    log_info "=== Configuration du build ==="
    log_info "Registry: $DOCKER_REGISTRY"
    log_info "Tag: $tag"
    log_info "Platforms: $PLATFORMS"
    log_info "Services: ${BUILD_SERVICES[*]}"
    log_info "Push: $PUSH_TO_REGISTRY"
    echo ""
    
    # Vérifications
    check_prerequisites
    scan_ports
    
    # Activation de BuildKit
    export DOCKER_BUILDKIT=1
    export BUILDX_NO_DEFAULT_ATTESTATIONS=1
    
    # Build de chaque service
    local start_time=$(date +%s)
    
    for service in "${BUILD_SERVICES[@]}"; do
        build_service "$service" "$tag"
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Résumé final
    echo ""
    log_success "=== Build terminé avec succès ==="
    log_success "Services buildés: ${BUILD_SERVICES[*]}"
    log_success "Tag: $tag"
    log_success "Durée: ${duration}s"
    
    if [ "$PUSH_TO_REGISTRY" = true ]; then
        log_success "Images disponibles sur le registry: $DOCKER_REGISTRY"
        echo ""
        log_info "Pour déployer en production:"
        log_info "  TAG=$tag ./scripts/deploy-vps.sh"
    else
        echo ""
        log_info "Pour tester localement:"
        log_info "  TAG=$tag docker compose -f docker-compose.dev.yml up"
        echo ""
        log_info "Pour push vers le registry:"
        log_info "  $0 $tag --push"
    fi
}

# Gestion des signaux pour cleanup
cleanup() {
    log_warning "Build interrompu par l'utilisateur"
    exit 130
}

trap cleanup SIGINT SIGTERM

# Exécution
main "$@"