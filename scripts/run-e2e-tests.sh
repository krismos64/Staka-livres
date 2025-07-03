#!/bin/bash

# Script pour exécuter les tests E2E Cypress avec préparation de la DB
# Usage: ./scripts/run-e2e-tests.sh

set -e

echo "🚀 Démarrage des tests E2E Cypress..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${BLUE}[E2E]${NC} $1"
}

error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCÈS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Vérifier que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null; then
    error "docker-compose n'est pas installé ou disponible"
    exit 1
fi

# Vérifier que les services principaux sont lancés
log "Vérification des services Docker..."
if ! docker-compose ps | grep -q "Up"; then
    warning "Les services ne semblent pas tous lancés"
    log "Démarrage des services db, backend, frontend..."
    docker-compose up -d db backend frontend
    log "Attente du démarrage des services (30s)..."
    sleep 30
fi

# Vérifier la connectivité backend
log "Vérification de la connectivité backend..."
for i in {1..10}; do
    if curl -f http://localhost:3001/health &>/dev/null; then
        success "Backend accessible"
        break
    else
        if [ $i -eq 10 ]; then
            error "Backend non accessible après 10 tentatives"
            docker-compose logs --tail=20 backend
            exit 1
        fi
        warning "Backend non accessible, tentative $i/10..."
        sleep 3
    fi
done

# Vérifier la connectivité frontend  
log "Vérification de la connectivité frontend..."
for i in {1..10}; do
    if curl -f http://localhost:3000 &>/dev/null; then
        success "Frontend accessible"
        break
    else
        if [ $i -eq 10 ]; then
            error "Frontend non accessible après 10 tentatives"
            docker-compose logs --tail=20 frontend
            exit 1
        fi
        warning "Frontend non accessible, tentative $i/10..."
        sleep 3
    fi
done

# Préparation de la base de données
log "Préparation de la base de données..."
log "Reset de la base de données..."
if docker-compose exec -T backend npx prisma migrate reset --force --skip-seed; then
    success "Reset de la DB terminé"
else
    error "Échec du reset de la DB"
    exit 1
fi

log "Seed de la base de données..."
if docker-compose exec -T backend npx prisma db seed; then
    success "Seed de la DB terminé"
else
    error "Échec du seed de la DB"
    exit 1
fi

log "Attente de la stabilisation de la DB (5s)..."
sleep 5

# Lancement des tests Cypress
log "Lancement des tests Cypress..."
success "🎯 Démarrage de Cypress en mode headless..."

if docker-compose --profile test run --rm cypress; then
    success "✅ Tests E2E terminés avec succès!"
    exit 0
else
    error "❌ Tests E2E échoués"
    
    # Affichage des logs utiles en cas d'échec
    warning "Logs des services pour diagnostic:"
    echo ""
    echo "=== LOGS BACKEND ==="
    docker-compose logs --tail=50 backend
    echo ""
    echo "=== LOGS FRONTEND ==="  
    docker-compose logs --tail=50 frontend
    echo ""
    echo "=== LOGS CYPRESS ==="
    docker-compose logs cypress
    
    exit 1
fi 