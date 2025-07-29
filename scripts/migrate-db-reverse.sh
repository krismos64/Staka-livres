#!/usr/bin/env bash
set -eo pipefail

# Script de migration inverse : Production → Développement
# Usage: ./scripts/migrate-db-reverse.sh [--dry-run] [--force]

# Configuration par défaut
DRY_RUN=false
FORCE_MIGRATE=false
BACKUP_RETENTION_DAYS=7
DEPLOY_DIR="/opt/staka-livres"

# Variables d'environnement requises
REQUIRED_VARS=(
    "VPS_HOST"
    "VPS_USER"
)

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
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

log_critical() {
    echo -e "${MAGENTA}[CRITICAL]${NC} $1"
}

show_usage() {
    cat << EOF
Usage: $0 [options]

🔄 Script de migration inverse : Production → Développement

⚠️  ATTENTION: Ce script REMPLACE votre base de développement locale !

Options:
  --dry-run            Simulation sans exécution réelle
  --force              Skip les confirmations (DANGEREUX)
  --help               Affiche cette aide

Variables d'environnement requises:
  VPS_HOST             Adresse du serveur VPS
  VPS_USER             Utilisateur SSH pour le VPS
  VPS_PASSWORD         Mot de passe SSH (ou SSH_KEY_PATH)

Fonctionnement:
  1. Export de la base de données de production
  2. Backup automatique de la base de développement
  3. Import des données de production vers développement
  4. Vérification de l'intégrité

Sécurités intégrées:
  ✅ Backup automatique base dev avant migration
  ✅ Test de connectivité avant opération  
  ✅ Confirmation manuelle obligatoire
  ✅ Rollback automatique en cas d'échec
  ✅ Vérification intégrité post-migration

Exemples:
  $0                     # Migration complète prod → dev
  $0 --dry-run          # Simulation
  $0 --force            # Sans confirmation (automatisation)

⚠️  RAPPEL: La base de développement sera ENTIÈREMENT REMPLACÉE !
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
    
    # Configuration SSH
    if [[ -n "$SSH_KEY_PATH" && -f "$SSH_KEY_PATH" ]]; then
        SSH_CMD="ssh -i $SSH_KEY_PATH -o ConnectTimeout=10 -o BatchMode=yes"
        log_info "Authentification SSH: clé privée ($SSH_KEY_PATH)"
    elif [[ -n "$VPS_PASSWORD" ]]; then
        SSH_CMD="sshpass -p $VPS_PASSWORD ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no"
        log_info "Authentification SSH: mot de passe"
    else
        log_error "Aucune méthode d'authentification SSH configurée"
        exit 1
    fi
    
    log_success "Variables d'environnement validées"
}

# Test de connectivité
test_connectivity() {
    log_info "Test de connectivité..."
    
    # Test SSH VPS
    if ! $SSH_CMD "$VPS_USER@$VPS_HOST" 'echo "SSH OK"' &>/dev/null; then
        log_error "Impossible de se connecter au VPS"
        exit 1
    fi
    log_success "✓ Connexion VPS établie"
    
    # Test base locale
    if ! docker compose exec -T db mysql -u staka -pstaka -e "SELECT 1;" stakalivres &>/dev/null; then
        log_error "Impossible de se connecter à la base locale"
        log_error "Assurez-vous que le stack de développement est démarré (npm run dev:watch)"
        exit 1
    fi
    log_success "✓ Connexion base locale OK"
    
    # Test base production
    if $SSH_CMD "$VPS_USER@$VPS_HOST" "cd /opt/staka-livres && docker compose -f docker-compose.prod.yml exec -T db mysql -u staka -pstaka.ed2020Livres -e 'SELECT 1;' stakalivres >/dev/null 2>&1"; then
        log_success "✓ Connexion base production OK"
    else
        log_error "Impossible de se connecter à la base production"
        exit 1
    fi
}

# Collecte d'informations sur les bases
collect_db_info() {
    log_info "Collecte des informations des bases de données..."
    
    # Info base production (source)
    PROD_INFO=$($SSH_CMD "$VPS_USER@$VPS_HOST" "cd /opt/staka-livres && docker compose -f docker-compose.prod.yml exec -T db mysql -u staka -pstaka.ed2020Livres stakalivres -e \"
    SELECT 
        'TABLES' as type,
        COUNT(*) as count
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = 'stakalivres'
    UNION ALL
    SELECT 
        'USERS' as type,
        (SELECT COUNT(*) FROM User) as count
    UNION ALL
    SELECT 
        'COMMANDES' as type,
        (SELECT COUNT(*) FROM Commande) as count
    UNION ALL
    SELECT 
        'FILES' as type,
        (SELECT COUNT(*) FROM File) as count;\" 2>/dev/null || echo 'Production DB vide'")
    
    # Info base locale (cible)
    LOCAL_INFO=$(docker compose exec -T db mysql -u staka -pstaka stakalivres -e "
    SELECT 
        'TABLES' as type,
        COUNT(*) as count
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = 'stakalivres'
    UNION ALL
    SELECT 
        'USERS' as type,
        (SELECT COUNT(*) FROM User) as count
    UNION ALL
    SELECT 
        'COMMANDES' as type,
        (SELECT COUNT(*) FROM Commande) as count
    UNION ALL
    SELECT 
        'FILES' as type,
        (SELECT COUNT(*) FROM File) as count;" 2>/dev/null || echo "Base locale vide")
    
    echo ""
    log_info "=== INFORMATIONS DES BASES ==="
    echo -e "${BLUE}Base production (source):${NC}"
    echo "$PROD_INFO" | column -t
    echo ""
    echo -e "${BLUE}Base locale dev (cible - sera remplacée):${NC}"
    echo "$LOCAL_INFO" | column -t
    echo ""
}

# Création backup développement
create_dev_backup() {
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Simulation du backup développement"
        return 0
    fi
    
    local backup_timestamp=$(date +"%Y%m%d_%H%M%S")
    BACKUP_NAME="dev_backup_${backup_timestamp}"
    
    log_info "Création du backup développement: $BACKUP_NAME"
    
    # Créer le répertoire de backup local
    mkdir -p ./backups
    
    # Backup de la base de développement
    if docker compose exec -T db mysqldump -u staka -pstaka --single-transaction --routines --triggers stakalivres > "./backups/${BACKUP_NAME}.sql"; then
        log_success "Backup développement créé: ./backups/${BACKUP_NAME}.sql"
        ls -lh "./backups/${BACKUP_NAME}.sql"
    else
        log_error "Échec du backup développement"
        exit 1
    fi
    
    # Nettoyage des anciens backups (garde les 5 derniers)
    cd ./backups && ls -t dev_backup_*.sql 2>/dev/null | tail -n +6 | xargs rm -f || true
    cd ..
}

# Export de la base production
export_production_data() {
    log_info "Export de la base de données de production..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Simulation export production"
        return 0
    fi
    
    local dump_file="/tmp/staka_prod_export_$(date +%s).sql"
    
    # Export depuis la production via SSH
    $SSH_CMD "$VPS_USER@$VPS_HOST" "cd /opt/staka-livres && docker compose -f docker-compose.prod.yml exec -T db mysqldump -u staka -pstaka.ed2020Livres --single-transaction --routines --triggers stakalivres" > "$dump_file"
    
    if [[ ! -f "$dump_file" || ! -s "$dump_file" ]]; then
        log_error "Échec de l'export de la base production"
        exit 1
    fi
    
    PROD_DUMP_FILE="$dump_file"
    log_success "Export production terminé: $(wc -l < "$dump_file") lignes"
}

# Import vers développement
import_to_dev() {
    log_info "Import des données de production vers développement..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Simulation import vers développement"
        return 0
    fi
    
    # Import dans la base de développement
    if docker compose exec -T db mysql -u staka -pstaka stakalivres < "$PROD_DUMP_FILE"; then
        log_success "Import vers développement terminé avec succès"
        # Cleanup du fichier temporaire
        rm -f "$PROD_DUMP_FILE"
    else
        log_error "Échec de l'import vers développement - Rollback nécessaire"
        exit 1
    fi
}

# Vérification post-migration
verify_migration() {
    log_info "Vérification de l'intégrité post-migration..."
    
    # Collecte des nouvelles infos
    collect_db_info
    
    # Test rapide de l'application locale
    log_info "Test de l'application de développement..."
    
    if curl -f -s --max-time 5 "http://localhost:3000/health" > /dev/null 2>&1; then
        log_success "✓ Application de développement accessible"
    else
        log_warning "⚠ Application locale non accessible (peut être normal)"
    fi
}

# Rollback vers développement
rollback_dev() {
    log_critical "🔄 ROLLBACK VERS LA BASE DE DÉVELOPPEMENT"
    
    if [[ -z "$BACKUP_NAME" ]]; then
        log_error "Aucun backup trouvé pour le rollback"
        exit 1
    fi
    
    if [[ -f "./backups/${BACKUP_NAME}.sql" ]]; then
        log_info "🔄 Restauration du backup: $BACKUP_NAME"
        docker compose exec -T db mysql -u staka -pstaka stakalivres < "./backups/${BACKUP_NAME}.sql"
        log_success "Rollback effectué avec succès"
    else
        log_error "Fichier de backup introuvable"
        exit 1
    fi
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
                FORCE_MIGRATE=true
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
    
    # Information sur la configuration
    echo ""
    log_info "=== CONFIGURATION DE LA MIGRATION INVERSE ==="
    log_info "Direction: Production → Développement"
    log_info "Source: production (VPS)"
    log_info "Cible: développement (local)"
    log_info "Dry run: $DRY_RUN"
    log_info "Force: $FORCE_MIGRATE"
    echo ""
    
    if [[ "$DRY_RUN" == true ]]; then
        log_warning "Mode simulation - aucune modification ne sera effectuée"
    fi
    
    # Confirmation manuelle
    if [[ "$FORCE_MIGRATE" != true && "$DRY_RUN" != true ]]; then
        log_critical "⚠️  MIGRATION INVERSE - ATTENTION ⚠️"
        echo ""
        log_warning "Cette opération va REMPLACER votre base de développement locale!"
        log_warning "Toutes vos données de développement seront PERDUES!"
        echo ""
        read -p "Tapez 'CONFIRME_MIGRATION_INVERSE' pour continuer: " confirmation
        
        if [[ "$confirmation" != "CONFIRME_MIGRATION_INVERSE" ]]; then
            log_info "Migration annulée par l'utilisateur"
            exit 0
        fi
    fi
    
    # Exécution avec gestion d'erreur
    local start_time=$(date +%s)
    
    # Trap pour rollback automatique
    trap 'rollback_dev' ERR
    
    load_env_vars
    test_connectivity
    collect_db_info
    create_dev_backup
    export_production_data
    import_to_dev
    verify_migration
    
    # Désactiver le trap de rollback (migration réussie)
    trap - ERR
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Résumé final
    echo ""
    if [[ "$DRY_RUN" == true ]]; then
        log_success "=== SIMULATION TERMINÉE ==="
    else
        log_success "=== MIGRATION INVERSE TERMINÉE AVEC SUCCÈS ==="
    fi
    log_success "Direction: Production → Développement"
    log_success "Durée: ${duration}s"
    
    if [[ "$DRY_RUN" != true ]]; then
        echo ""
        log_info "Backup développement sauvegardé: ./backups/$BACKUP_NAME.sql"
        log_info "Commande de rollback manuel si besoin:"
        log_info "  docker compose exec -T db mysql -u staka -pstaka stakalivres < ./backups/$BACKUP_NAME.sql"
        echo ""
        log_info "Votre environnement de développement contient maintenant les données de production!"
        log_info "Redémarrez votre application si nécessaire: npm run dev:watch"
    fi
}

# Gestion des signaux
cleanup() {
    log_warning "Migration interrompue par l'utilisateur"
    exit 130
}

trap cleanup SIGINT SIGTERM

# Exécution
main "$@"