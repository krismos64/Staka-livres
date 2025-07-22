#!/bin/bash
set -e

# Script de déploiement automatisé pour VPS OVH
# Usage: ./deploy.sh [production|staging] [tag]

# Configuration
ENVIRONMENT=${1:-production}
TAG=${2:-latest}
DOCKER_REGISTRY="krismos64"  # Votre registry DockerHub

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Vérifications préalables
check_requirements() {
    log "Vérification des prérequis..."
    
    command -v docker >/dev/null 2>&1 || error "Docker n'est pas installé"
    command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 || error "Docker Compose n'est pas disponible"
    
    if [[ ! -f "backend/.env.prod" ]]; then
        error "Le fichier backend/.env.prod est manquant"
    fi
    
    log "✅ Prérequis OK"
}

# Création des répertoires nécessaires
setup_directories() {
    log "Création des répertoires de données..."
    
    sudo mkdir -p /opt/staka/{data/{mysql,uploads},logs/{app,nginx}}
    sudo chown -R $USER:$USER /opt/staka
    chmod -R 755 /opt/staka
    
    log "✅ Répertoires créés"
}

# Sauvegarde de la base de données
backup_database() {
    log "Sauvegarde de la base de données..."
    
    BACKUP_DIR="/opt/staka/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    if docker ps | grep -q staka_db_prod; then
        docker exec staka_db_prod mysqldump \
            -u root -p"$MYSQL_ROOT_PASSWORD" \
            --single-transaction --routines --triggers \
            stakalivres > "$BACKUP_DIR/stakalivres.sql"
        
        log "✅ Sauvegarde créée dans $BACKUP_DIR"
    else
        warn "Aucune base de données en cours d'exécution à sauvegarder"
    fi
}

# Pull des dernières images
pull_images() {
    log "Téléchargement des images Docker..."
    
    export DOCKER_REGISTRY TAG
    docker-compose -f docker-compose.prod.yml pull
    
    log "✅ Images téléchargées"
}

# Déploiement
deploy() {
    log "Démarrage du déploiement $ENVIRONMENT (tag: $TAG)..."
    
    # Export des variables d'environnement
    export DOCKER_REGISTRY TAG
    source backend/.env.prod
    
    # Arrêt gracieux des anciens conteneurs
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log "Arrêt des conteneurs existants..."
        docker-compose -f docker-compose.prod.yml down --timeout 30
    fi
    
    # Démarrage des nouveaux conteneurs
    log "Démarrage des nouveaux conteneurs..."
    docker-compose -f docker-compose.prod.yml up -d
    
    log "✅ Conteneurs démarrés"
}

# Vérification de la santé des services
health_check() {
    log "Vérification de la santé des services..."
    
    # Attendre que les services soient prêts
    sleep 30
    
    # Vérifier le backend
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        log "✅ Backend en santé"
    else
        error "❌ Backend non disponible"
    fi
    
    # Vérifier le frontend
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        log "✅ Frontend en santé"
    else
        error "❌ Frontend non disponible"
    fi
    
    # Vérifier la base de données
    if docker exec staka_backend_prod npx prisma db ping >/dev/null 2>&1; then
        log "✅ Base de données accessible"
    else
        error "❌ Base de données non accessible"
    fi
}

# Nettoyage
cleanup() {
    log "Nettoyage des ressources inutilisées..."
    
    docker system prune -f
    docker volume prune -f
    
    log "✅ Nettoyage terminé"
}

# Script principal
main() {
    log "🚀 Début du déploiement Staka-Livres"
    log "Environnement: $ENVIRONMENT"
    log "Tag: $TAG"
    log "Registry: $DOCKER_REGISTRY"
    
    check_requirements
    setup_directories
    backup_database
    pull_images
    deploy
    health_check
    cleanup
    
    log "🎉 Déploiement terminé avec succès !"
    log "🌐 Frontend: http://$(curl -s ifconfig.me):3000"
    log "🔧 Backend: http://$(curl -s ifconfig.me):3001"
    
    echo ""
    echo -e "${BLUE}=== PROCHAINES ÉTAPES ===${NC}"
    echo "1. Configurer votre domaine pour pointer vers $(curl -s ifconfig.me)"
    echo "2. Configurer SSL avec Let's Encrypt"
    echo "3. Tester les fonctionnalités critiques"
    echo "4. Monitorer les logs avec: docker-compose -f docker-compose.prod.yml logs -f"
}

# Gestion des signaux pour nettoyage propre
trap 'error "Déploiement interrompu"' INT TERM

# Exécution
main "$@"