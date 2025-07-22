#!/bin/bash

# 🚀 SCRIPT DE DÉPLOIEMENT PRODUCTION - STAKA LIVRES
# 
# Script automatisé pour le déploiement sécurisé sur VPS OVH
# Génère les secrets, guide la configuration et lance Docker
# 
# Usage: ./scripts/deploy-production.sh
# 
# @author Staka Livres Team
# @version 2.0.0
# @date 2025-07-22

set -e  # Arrêt immédiat en cas d'erreur

# 🎨 Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 📋 Configuration
ENV_FILE="backend/.env.production"
BACKUP_DIR="backup/secrets"
LOG_FILE="deployment.log"

# 🔧 Fonctions utilitaires
log() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ ERREUR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}" | tee -a "$LOG_FILE"
}

# 🔍 Vérifications préalables
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé. Installez Node.js >= 16.x"
    fi
    success "Node.js disponible: $(node --version)"
    
    # Docker
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
    fi
    success "Docker disponible: $(docker --version)"
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé"
    fi
    success "Docker Compose disponible: $(docker-compose --version)"
    
    # Permissions script generateSecrets.js
    if [[ ! -x "backend/scripts/generateSecrets.js" ]]; then
        chmod +x backend/scripts/generateSecrets.js
        success "Permissions script secrets corrigées"
    fi
}

# 🔒 Génération des secrets
generate_secrets() {
    log "🔐 Génération des secrets de production..."
    
    # Sauvegarde ancien fichier si existe
    if [[ -f "$ENV_FILE" ]]; then
        mkdir -p "$BACKUP_DIR"
        cp "$ENV_FILE" "$BACKUP_DIR/.env.production.backup.$(date +%Y%m%d_%H%M%S)"
        warning "Ancien fichier .env.production sauvegardé"
    fi
    
    # Génération nouveaux secrets
    if node backend/scripts/generateSecrets.js --output "$ENV_FILE"; then
        success "Secrets générés avec succès dans $ENV_FILE"
    else
        error "Échec de la génération des secrets"
    fi
    
    # Vérification permissions
    if [[ $(stat -c %a "$ENV_FILE" 2>/dev/null || stat -f %A "$ENV_FILE" 2>/dev/null) != "600" ]]; then
        warning "Permissions du fichier secrets non sécurisées"
        chmod 600 "$ENV_FILE"
        success "Permissions sécurisées (600)"
    fi
}

# ✏️ Configuration manuelle
configure_secrets() {
    log "📝 Configuration manuelle des secrets..."
    
    echo -e "${BOLD}${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║               CONFIGURATION MANUELLE REQUISE              ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${YELLOW}Vous devez maintenant éditer le fichier $ENV_FILE et remplacer:"
    echo -e "  • SENDGRID_API_KEY=\"SG.VOTRE_CLE_SENDGRID_PRODUCTION_ICI\""
    echo -e "  • STRIPE_SECRET_KEY=\"sk_live_VOTRE_CLE_STRIPE_LIVE_ICI\""
    echo -e "  • STRIPE_WEBHOOK_SECRET=\"whsec_VOTRE_WEBHOOK_SECRET_STRIPE_ICI\""
    echo -e "  • AWS_ACCESS_KEY_ID=\"AKIA_VOTRE_ACCESS_KEY_PRODUCTION_ICI\""
    echo -e "${NC}"
    
    # Ouverture automatique de l'éditeur
    if command -v nano &> /dev/null; then
        EDITOR="nano"
    elif command -v vim &> /dev/null; then
        EDITOR="vim"
    elif command -v vi &> /dev/null; then
        EDITOR="vi"
    else
        EDITOR=""
    fi
    
    if [[ -n "$EDITOR" ]]; then
        echo -e "${CYAN}Ouverture de l'éditeur $EDITOR...${NC}"
        echo -e "${YELLOW}💡 Conseil: Recherchez 'VOTRE_' pour trouver les valeurs à remplacer${NC}"
        sleep 3
        $EDITOR "$ENV_FILE"
    else
        warning "Aucun éditeur de texte trouvé"
        echo -e "${YELLOW}Éditez manuellement le fichier: $ENV_FILE${NC}"
    fi
    
    # Validation
    while true; do
        echo
        read -p "⏸️ Configuration terminée ? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            break
        elif [[ $REPLY =~ ^[Nn]$ ]]; then
            if [[ -n "$EDITOR" ]]; then
                $EDITOR "$ENV_FILE"
            else
                echo -e "${YELLOW}Continuez l'édition manuelle de $ENV_FILE${NC}"
            fi
        fi
    done
    
    success "Configuration manuelle terminée"
}

# 🔍 Validation des secrets
validate_secrets() {
    log "🔍 Validation de la configuration..."
    
    # Vérifier que les valeurs ont été remplacées
    local issues=0
    
    if grep -q "VOTRE_" "$ENV_FILE"; then
        warning "Certaines valeurs n'ont pas été remplacées:"
        grep "VOTRE_" "$ENV_FILE" | sed 's/^/    /'
        ((issues++))
    fi
    
    # Vérifier secrets générés présents
    local required_secrets=("JWT_SECRET" "MYSQL_ROOT_PASSWORD" "MYSQL_PASSWORD")
    for secret in "${required_secrets[@]}"; do
        if ! grep -q "^$secret=" "$ENV_FILE"; then
            warning "Secret manquant: $secret"
            ((issues++))
        fi
    done
    
    if [[ $issues -gt 0 ]]; then
        echo
        read -p "⚠️ Des problèmes ont été détectés. Continuer quand même ? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Déploiement annulé - Corrigez la configuration"
        fi
        warning "Déploiement avec problèmes de configuration"
    else
        success "Configuration valide"
    fi
}

# 🏗️ Préparation Docker
prepare_docker() {
    log "🏗️ Préparation de l'environnement Docker..."
    
    # Vérifier docker-compose.prod.yml existe
    if [[ ! -f "docker-compose.prod.yml" ]]; then
        warning "docker-compose.prod.yml non trouvé, utilisation de docker-compose.yml"
        COMPOSE_FILE="docker-compose.yml"
    else
        COMPOSE_FILE="docker-compose.prod.yml"
        success "Fichier Docker Compose trouvé: $COMPOSE_FILE"
    fi
    
    # Nettoyer images anciennes si demandé
    echo
    read -p "🧹 Nettoyer les images Docker anciennes ? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Nettoyage des images Docker..."
        docker system prune -f
        success "Images Docker nettoyées"
    fi
}

# 🚀 Déploiement
deploy_application() {
    log "🚀 Lancement du déploiement Docker..."
    
    # Build et démarrage
    if docker-compose -f "$COMPOSE_FILE" up -d --build; then
        success "Services Docker démarrés avec succès"
    else
        error "Échec du démarrage des services Docker"
    fi
    
    # Attendre que les services soient prêts
    log "⏳ Attente du démarrage des services..."
    sleep 30
    
    # Vérifier statut des containers
    log "📊 Vérification du statut des services..."
    docker-compose -f "$COMPOSE_FILE" ps
    
    # Test connectivité basique
    if docker-compose -f "$COMPOSE_FILE" exec -T backend curl -f http://localhost:3001/health &>/dev/null; then
        success "Backend accessible"
    else
        warning "Backend ne répond pas au health check"
    fi
}

# 🔍 Validation post-déploiement
post_deployment_validation() {
    log "🔍 Validation post-déploiement..."
    
    echo -e "${BOLD}${BLUE}📊 TESTS DE CONNECTIVITÉ:${NC}"
    
    # Test localhost (si sur le serveur)
    echo -e "${CYAN}Frontend local:${NC}"
    if curl -s -f http://localhost:3000 >/dev/null; then
        success "✅ Frontend accessible sur localhost:3000"
    else
        warning "❌ Frontend inaccessible sur localhost:3000"
    fi
    
    echo -e "${CYAN}Backend API local:${NC}"
    if curl -s -f http://localhost:3001/health >/dev/null; then
        success "✅ Backend API accessible sur localhost:3001"
    else
        warning "❌ Backend API inaccessible sur localhost:3001"
    fi
    
    # Afficher logs récents
    echo -e "${CYAN}Logs récents (30 dernières lignes):${NC}"
    docker-compose -f "$COMPOSE_FILE" logs --tail 30
}

# 📋 Instructions finales
final_instructions() {
    echo -e "${BOLD}${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                  DÉPLOIEMENT TERMINÉ                      ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BOLD}🎉 FÉLICITATIONS ! Le déploiement est terminé.${NC}\n"
    
    echo -e "${BOLD}📋 ÉTAPES SUIVANTES POUR LA PRODUCTION:${NC}"
    echo -e "${YELLOW}1. Configuration DNS:${NC}"
    echo -e "   • Pointez livres.staka.fr vers l'IP de ce serveur"
    echo -e "   • Configurez les certificats SSL Let's Encrypt"
    echo -e ""
    echo -e "${YELLOW}2. Configuration Nginx reverse proxy:${NC}"
    echo -e "   • Suivez la checklist: docs/CHECKLIST_DEPLOIEMENT_OVH.md"
    echo -e "   • Configurez HTTPS avec certificats automatiques"
    echo -e ""
    echo -e "${YELLOW}3. Configuration Stripe:${NC}"
    echo -e "   • Dashboard Stripe: Webhooks > Add endpoint"
    echo -e "   • URL: https://livres.staka.fr/api/payments/webhook"
    echo -e "   • Événements: checkout.session.completed, payment_intent.payment_failed"
    echo -e ""
    echo -e "${YELLOW}4. Tests de production:${NC}"
    echo -e "   • curl https://livres.staka.fr"
    echo -e "   • curl https://livres.staka.fr/api/health"
    echo -e "   • Tests fonctionnels complets"
    echo -e ""
    echo -e "${BOLD}📞 SUPPORT:${NC}"
    echo -e "   • Documentation: docs/CHECKLIST_DEPLOIEMENT_OVH.md"
    echo -e "   • Logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo -e "   • Email: support@staka-livres.fr"
    echo -e ""
    echo -e "${RED}🔒 SÉCURITÉ - NE PAS OUBLIER:${NC}"
    echo -e "   • Sauvegardez $ENV_FILE dans un gestionnaire de mots de passe"
    echo -e "   • Ne jamais commiter les fichiers .env dans Git"
    echo -e "   • Changez les secrets en cas de compromission"
}

# 🎯 Fonction principale
main() {
    clear
    echo -e "${BOLD}${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         DÉPLOIEMENT PRODUCTION - STAKA LIVRES             ║"
    echo "║              VPS OVH - Docker Multi-services              ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    log "🚀 Début du déploiement production Staka Livres"
    
    # Exécution séquentielle
    check_prerequisites
    generate_secrets
    configure_secrets
    validate_secrets
    prepare_docker
    deploy_application
    post_deployment_validation
    final_instructions
    
    success "Déploiement production terminé avec succès !"
    log "📊 Logs sauvegardés dans: $LOG_FILE"
}

# 🛡️ Gestion des erreurs
trap 'error "Déploiement interrompu"' INT TERM

# 🚀 Lancement
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi