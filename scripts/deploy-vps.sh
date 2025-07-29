#!/usr/bin/env bash
set -eo pipefail

# Script de déploiement VPS pour Staka-Livres
# Usage: ./scripts/deploy-vps.sh [version] [--dry-run] [--force] [--no-backup]

# Configuration par défaut
DEFAULT_VERSION="latest"
VERSION="${1:-$DEFAULT_VERSION}"
DRY_RUN=false
FORCE_DEPLOY=false
CREATE_BACKUP=true
DEPLOY_DIR="/opt/staka-livres"

# Variables d'environnement requises
REQUIRED_VARS=(
    "VPS_HOST"
    "VPS_USER"
    "DOCKERHUB_USER"
    "DOCKERHUB_TOKEN"
)

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
Usage: $0 [version] [options]

Arguments:
  [version]           Version à déployer (défaut: latest)

Options:
  --dry-run          Simulation du déploiement sans execution
  --force            Force le déploiement même si la version existe
  --no-backup        Skip la sauvegarde avant déploiement
  --help             Affiche cette aide

Variables d'environnement requises:
  VPS_HOST           Adresse du serveur VPS
  VPS_USER           Utilisateur SSH pour le VPS
  DOCKERHUB_USER     Nom d'utilisateur Docker Hub
  DOCKERHUB_TOKEN    Token d'authentification Docker Hub

Variables optionnelles:
  DOCKER_REGISTRY    Registry Docker (défaut: krismos64)
  SSH_KEY_PATH       Chemin vers la clé SSH (défaut: ~/.ssh/id_rsa)

Exemples:
  $0                              # Déploie la version 'latest'
  $0 v1.4.0                      # Déploie la version v1.4.0
  $0 v1.4.0 --dry-run           # Simulation du déploiement v1.4.0
  $0 latest --force --no-backup  # Force le déploiement sans backup

Configuration via .env.deploy:
  VPS_HOST=mon-serveur.ovh.com
  VPS_USER=ubuntu
  DOCKERHUB_USER=krismos64
  DOCKERHUB_TOKEN=dckr_pat_xxxxx
EOF
}

# Chargement des variables d'environnement
load_env_vars() {
    local env_file=".env.deploy"
    
    if [[ -f "$env_file" ]]; then
        log_info "Chargement des variables depuis $env_file"
        set -a
        source "$env_file"
        set +a
    fi
    
    # Vérification des variables requises
    local missing_vars=()
    for var in "${REQUIRED_VARS[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Variables d'environnement manquantes: ${missing_vars[*]}"
        log_error "Créez un fichier .env.deploy ou définissez ces variables"
        show_usage
        exit 1
    fi
    
    # Variables par défaut
    DOCKER_REGISTRY="${DOCKER_REGISTRY:-krismos64}"
    SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_rsa}"
    
    # Configuration de la commande SSH selon la méthode d'authentification
    if [[ -n "$SSH_KEY_PATH" && -f "$SSH_KEY_PATH" ]]; then
        SSH_CMD="ssh -i $SSH_KEY_PATH -o ConnectTimeout=10 -o BatchMode=yes"
        log_info "Authentification SSH: clé privée ($SSH_KEY_PATH)"
    elif [[ -n "$VPS_PASSWORD" ]]; then
        SSH_CMD="sshpass -p $VPS_PASSWORD ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no"
        log_info "Authentification SSH: mot de passe"
    else
        log_error "Aucune méthode d'authentification SSH configurée"
        log_error "Définissez SSH_KEY_PATH ou VPS_PASSWORD dans .env.deploy"
        exit 1
    fi
    
    log_success "Variables d'environnement validées"
}

# Test de connexion SSH
test_ssh_connection() {
    log_info "Test de la connexion SSH vers $VPS_USER@$VPS_HOST"
    
    if $SSH_CMD "$VPS_USER@$VPS_HOST" 'echo "SSH OK"' &>/dev/null; then
        log_success "Connexion SSH établie"
        return 0
    fi
    
    log_error "Impossible de se connecter au VPS"
    log_error "Vérifiez: $VPS_HOST, $VPS_USER, authentification"
    exit 1
}

# Fonction helper pour exécuter des commandes SSH
run_ssh_command() {
    local command="$1"
    $SSH_CMD "$VPS_USER@$VPS_HOST" "$command"
}


# Vérification de l'état du serveur distant
check_remote_status() {
    log_info "Vérification de l'état du serveur distant..."
    
    local remote_check=$($SSH_CMD "$VPS_USER@$VPS_HOST" << 'EOF'
# Vérification Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker non installé"
    exit 1
fi

# Vérification du répertoire de déploiement
if [[ ! -d "/opt/staka-livres" ]]; then
    echo "WARNING: Répertoire de déploiement inexistant"
fi

# État des services actuels
if docker compose -f /opt/staka-livres/docker-compose.prod.yml ps --quiet &>/dev/null; then
    echo "INFO: Services Docker actuellement actifs"
    docker compose -f /opt/staka-livres/docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}"
else
    echo "INFO: Aucun service Docker actif"
fi

echo "SUCCESS: Serveur prêt pour le déploiement"
EOF
    )
    
    echo "$remote_check"
    
    if echo "$remote_check" | grep -q "ERROR:"; then
        log_error "Le serveur distant n'est pas prêt"
        exit 1
    fi
    
    log_success "Serveur distant opérationnel"
}

# Sauvegarde avant déploiement
create_backup() {
    if [[ "$CREATE_BACKUP" != true ]]; then
        log_warning "Sauvegarde désactivée (--no-backup)"
        return 0
    fi
    
    local backup_timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_name="staka_backup_${backup_timestamp}"
    
    log_info "Création de la sauvegarde: $backup_name"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Sauvegarde simulée"
        return 0
    fi
    
    $SSH_CMD "$VPS_USER@$VPS_HOST" << EOF
# Création du répertoire de backup
mkdir -p /opt/backups

# Sauvegarde de la base de données
if docker compose -f $DEPLOY_DIR/docker-compose.prod.yml exec -T db mysqldump -u staka -p\$MYSQL_PASSWORD stakalivres > /opt/backups/${backup_name}_db.sql 2>/dev/null; then
    echo "✓ Sauvegarde DB créée"
else
    echo "⚠ Échec sauvegarde DB (service peut-être arrêté)"
fi

# Sauvegarde des fichiers de configuration
if [[ -d "$DEPLOY_DIR" ]]; then
    tar -czf /opt/backups/${backup_name}_config.tar.gz -C $DEPLOY_DIR . 2>/dev/null
    echo "✓ Sauvegarde config créée"
fi

# Nettoyage des anciennes sauvegardes (garde les 5 dernières)
cd /opt/backups && ls -t staka_backup_*.sql 2>/dev/null | tail -n +6 | xargs rm -f
cd /opt/backups && ls -t staka_backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f

echo "✓ Sauvegarde terminée: $backup_name"
EOF
    
    log_success "Sauvegarde créée avec succès"
}

# Déploiement principal
deploy_to_vps() {
    log_info "Déploiement de la version '$VERSION' sur $VPS_HOST"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Simulation du déploiement"
        return 0
    fi
    
    # Script de déploiement distant  
    $SSH_CMD "$VPS_USER@$VPS_HOST" << EOF
set -eo pipefail

echo "🚀 Début du déploiement..."

# Authentification Docker Hub
echo "🔐 Authentification Docker Hub..."
echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USER" --password-stdin

# Navigation vers le répertoire de déploiement
cd $DEPLOY_DIR

# Pull des nouvelles images
echo "📦 Pull des images version '$VERSION'..."
export TAG=$VERSION
export DOCKER_REGISTRY=$DOCKER_REGISTRY

docker compose -f docker-compose.prod.yml pull

# Arrêt gracieux des services
echo "⏹️  Arrêt des services actuels..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true

# Nettoyage des ressources inutilisées
echo "🧹 Nettoyage du système..."
docker system prune -f --volumes || true

# Redémarrage des services
echo "▶️  Démarrage des nouveaux services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Attente que les services soient healthy
echo "⏳ Attente de la santé des services..."
for i in {1..30}; do
    if docker compose -f docker-compose.prod.yml ps --format json | jq -r '.[].Health' | grep -v "healthy" | grep -q .; then
        echo "⏳ Services en cours de démarrage (\$i/30)..."
        sleep 10
    else
        echo "✅ Tous les services sont healthy"
        break
    fi
    
    if [[ \$i -eq 30 ]]; then
        echo "⚠️  Timeout: certains services ne sont pas healthy"
        docker compose -f docker-compose.prod.yml ps
    fi
done

# Vérification finale
echo "🔍 Vérification finale..."
docker compose -f docker-compose.prod.yml ps

echo "✅ Déploiement terminé avec succès!"
EOF
    
    log_success "Déploiement completed"
}

# Vérification post-déploiement
post_deploy_check() {
    log_info "Vérification post-déploiement..."
    
    local health_checks=(
        "https://livrestaka.fr/health"
        "https://api.staka-livres.com/health"
    )
    
    for url in "${health_checks[@]}"; do
        log_info "Test de $url"
        
        if curl -f -s --max-time 10 "$url" > /dev/null; then
            log_success "✓ $url OK"
        else
            log_warning "⚠ $url non accessible (peut être normal si juste déployé)"
        fi
    done
    
    # État des services
    log_info "État final des services:"
    $SSH_CMD "$VPS_USER@$VPS_HOST" \
        "cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'"
}

# Fonction principale
main() {
    # Parse des arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE_DEPLOY=true
                shift
                ;;
            --no-backup)
                CREATE_BACKUP=false
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            --*)
                log_error "Option inconnue: $1"
                show_usage
                exit 1
                ;;
            *)
                # C'est la version si pas encore définie
                if [[ "$VERSION" == "$DEFAULT_VERSION" ]]; then
                    VERSION="$1"
                fi
                shift
                ;;
        esac
    done
    
    # Validation de la version
    if [[ ! "$VERSION" =~ ^[a-zA-Z0-9._-]+$ ]]; then
        log_error "Version invalide: '$VERSION'"
        exit 1
    fi
    
    # Information sur la configuration
    log_info "=== Configuration du déploiement ==="
    log_info "Version: $VERSION"
    log_info "VPS: $VPS_USER@$VPS_HOST"
    log_info "Registry: $DOCKER_REGISTRY"
    log_info "Dry run: $DRY_RUN"
    log_info "Force: $FORCE_DEPLOY"
    log_info "Backup: $CREATE_BACKUP"
    echo ""
    
    if [[ "$DRY_RUN" == true ]]; then
        log_warning "Mode simulation activé - aucune modification ne sera effectuée"
    fi
    
    # Exécution des étapes
    local start_time=$(date +%s)
    
    load_env_vars
    test_ssh_connection
    check_remote_status
    create_backup
    deploy_to_vps
    
    if [[ "$DRY_RUN" != true ]]; then
        post_deploy_check
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Résumé final
    echo ""
    if [[ "$DRY_RUN" == true ]]; then
        log_success "=== Simulation terminée ==="
    else
        log_success "=== Déploiement terminé avec succès ==="
    fi
    log_success "Version: $VERSION"
    log_success "Durée: ${duration}s"
    
    if [[ "$DRY_RUN" != true ]]; then
        echo ""
        log_info "Services accessibles sur:"
        log_info "  Frontend: https://livrestaka.fr"
        log_info "  API: https://api.staka-livres.com"
        echo ""
        log_info "Pour vérifier les logs:"
        log_info "  ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml logs -f'"
    fi
}

# Gestion des signaux pour cleanup
cleanup() {
    log_warning "Déploiement interrompu par l'utilisateur"
    exit 130
}

trap cleanup SIGINT SIGTERM

# Exécution
main "$@"