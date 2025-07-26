#!/usr/bin/env bash
set -euo pipefail

# Script de reset complet de l'environnement de développement
# Résout les problèmes de node_modules mixés host/container (ARM64 vs x64, musl vs glibc)

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
Usage: $0 [options]

Script de reset complet de l'environnement de développement Docker.
Résout les conflits node_modules ARM64/x64 et musl/glibc (erreur Rollup).

Options:
  --keep-volumes    Garde les volumes Docker (plus rapide)
  --frontend-only   Reset uniquement le service frontend
  --help           Affiche cette aide

Étapes effectuées:
  1. Arrêt des containers dev
  2. Suppression des volumes Docker (-v)
  3. Nettoyage node_modules host
  4. Rebuild images avec cache propre
  5. Démarrage des services

Exemples:
  $0                    # Reset complet (recommandé)
  $0 --keep-volumes     # Reset sans supprimer les volumes
  $0 --frontend-only    # Reset seulement le frontend
EOF
}

# Variables par défaut
REMOVE_VOLUMES=true
FRONTEND_ONLY=false

# Parse des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-volumes)
            REMOVE_VOLUMES=false
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
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

# Vérification de Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker n'est pas installé ou disponible"
    exit 1
fi

# Fonction principale
main() {
    local start_time=$(date +%s)
    
    log_info "=== Reset de l'environnement de développement ==="
    log_info "Mode: $([ "$FRONTEND_ONLY" = true ] && echo "Frontend seulement" || echo "Complet")"
    log_info "Volumes: $([ "$REMOVE_VOLUMES" = true ] && echo "Supprimés" || echo "Conservés")"
    echo ""
    
    # 1. Arrêt des containers
    log_info "1. Arrêt des containers de développement..."
    if [ "$FRONTEND_ONLY" = true ]; then
        docker compose -f docker-compose.dev.yml stop frontend || true
    else
        docker compose -f docker-compose.dev.yml down || true
    fi
    log_success "Containers arrêtés"
    
    # 2. Suppression des volumes si demandé
    if [ "$REMOVE_VOLUMES" = true ]; then
        log_info "2. Suppression des volumes Docker..."
        if [ "$FRONTEND_ONLY" = true ]; then
            docker volume rm staka-livres_frontend_node_modules 2>/dev/null || true
        else
            docker compose -f docker-compose.dev.yml down -v || true
        fi
        log_success "Volumes supprimés"
    else
        log_warning "2. Volumes conservés (--keep-volumes)"
    fi
    
    # 3. Nettoyage node_modules host
    log_info "3. Nettoyage des node_modules host..."
    if [ "$FRONTEND_ONLY" = true ]; then
        if [ -d "frontend/node_modules" ]; then
            rm -rf frontend/node_modules
            log_success "frontend/node_modules supprimé"
        else
            log_info "frontend/node_modules déjà absent"
        fi
    else
        # Nettoyage complet
        local cleaned=()
        for dir in frontend/node_modules backend/node_modules shared/node_modules; do
            if [ -d "$dir" ]; then
                rm -rf "$dir"
                cleaned+=("$dir")
            fi
        done
        
        if [ ${#cleaned[@]} -gt 0 ]; then
            log_success "Supprimés: ${cleaned[*]}"
        else
            log_info "Aucun node_modules à nettoyer"
        fi
    fi
    
    # 4. Rebuild images
    log_info "4. Rebuild des images Docker..."
    if [ "$FRONTEND_ONLY" = true ]; then
        docker compose -f docker-compose.dev.yml build --no-cache frontend
    else
        docker compose -f docker-compose.dev.yml build --no-cache
    fi
    log_success "Images rebuildées"
    
    # 5. Nettoyage système (optionnel)
    log_info "5. Nettoyage des ressources Docker inutilisées..."
    docker system prune -f || true
    log_success "Nettoyage terminé"
    
    # 6. Démarrage des services
    log_info "6. Démarrage des services..."
    if [ "$FRONTEND_ONLY" = true ]; then
        docker compose -f docker-compose.dev.yml up -d frontend
    else
        docker compose -f docker-compose.dev.yml up -d
    fi
    
    # Attente que les services soient healthy
    log_info "7. Vérification de la santé des services..."
    sleep 5
    
    local max_wait=60
    local waited=0
    while [ $waited -lt $max_wait ]; do
        local unhealthy=$(docker compose -f docker-compose.dev.yml ps --format json 2>/dev/null | jq -r '.[] | select(.Health != "healthy" and .Health != null) | .Name' || echo "")
        
        if [ -z "$unhealthy" ]; then
            log_success "Tous les services sont healthy"
            break
        else
            log_info "Services en attente: $unhealthy (${waited}s/${max_wait}s)"
            sleep 5
            waited=$((waited + 5))
        fi
    done
    
    if [ $waited -ge $max_wait ]; then
        log_warning "Timeout atteint - certains services peuvent ne pas être healthy"
    fi
    
    # État final
    echo ""
    log_info "État final des services:"
    docker compose -f docker-compose.dev.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Résumé final
    echo ""
    log_success "=== Reset terminé avec succès ==="
    log_success "Durée: ${duration}s"
    echo ""
    log_info "Services accessibles:"
    log_info "  Frontend: http://localhost:3000"
    log_info "  Backend:  http://localhost:3001"
    log_info "  MySQL:    localhost:3306"
    echo ""
    log_info "Pour vérifier les logs:"
    log_info "  docker compose -f docker-compose.dev.yml logs -f"
    echo ""
    log_info "Test rapide du frontend:"
    log_info "  curl -f http://localhost:3000"
}

# Gestion des signaux pour cleanup
cleanup() {
    log_warning "Reset interrompu par l'utilisateur"
    exit 130
}

trap cleanup SIGINT SIGTERM

# Exécution
main "$@"