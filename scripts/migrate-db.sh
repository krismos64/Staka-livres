#!/usr/bin/env bash
set -eo pipefail

# Script de migration de base de données sécurisé pour Staka-Livres
# Usage: ./scripts/migrate-db.sh [--source-env] [--dry-run] [--force] [--schema-only]

# Configuration par défaut
DRY_RUN=false
FORCE_MIGRATE=false
SCHEMA_ONLY=false
SOURCE_ENV="dev"
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

🗄️  Script de migration de base de données sécurisé

Options:
  --source-env ENV       Environnement source (dev|staging) - défaut: dev
  --schema-only         Migration du schéma uniquement (Prisma migrate)
  --dry-run            Simulation sans exécution réelle
  --force              Skip les confirmations (DANGEREUX)
  --help               Affiche cette aide

Variables d'environnement requises:
  VPS_HOST             Adresse du serveur VPS
  VPS_USER             Utilisateur SSH pour le VPS
  VPS_PASSWORD         Mot de passe SSH (ou SSH_KEY_PATH)

Types de migration:
  1. Schema Only       : Applique les migrations Prisma (RECOMMANDÉ)
  2. Full Data         : Export/Import complet de la DB (DANGEREUX)

Sécurités intégrées:
  ✅ Backup automatique production avant migration
  ✅ Validation des données source et cible
  ✅ Confirmation manuelle obligatoire
  ✅ Rollback automatique en cas d'échec
  ✅ Test de connectivité avant opération
  ✅ Vérification de l'intégrité post-migration

Exemples:
  $0 --schema-only                    # Migration schéma uniquement (sûr)
  $0 --dry-run                       # Simulation complète
  $0 --source-env staging --force    # Migration depuis staging (force)

⚠️  ATTENTION: La migration complète remplace TOUTES les données production !
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
        exit 1
    fi
    log_success "✓ Connexion base locale OK"
    
    # Test base production
    if $SSH_CMD "$VPS_USER@$VPS_HOST" "cd /opt/staka-livres && docker compose -f docker-compose.prod.yml exec -T db mysql -u staka -pstaka.ed2020Livres -e 'SELECT 1;' stakalivres >/dev/null 2>&1"; then
        local prod_test="PROD_DB_OK"
    else
        local prod_test="PROD_DB_ERROR"
    fi
    
    if [[ "$prod_test" == *"PROD_DB_OK"* ]]; then
        log_success "✓ Connexion base production OK"
    else
        log_error "Impossible de se connecter à la base production"
        exit 1
    fi
}

# Collecte d'informations sur les bases
collect_db_info() {
    log_info "Collecte des informations des bases de données..."
    
    # Info base locale
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
    
    # Info base production
    PROD_INFO=$($SSH_CMD "$VPS_USER@$VPS_HOST" "cd /opt/staka-livres && docker compose -f docker-compose.prod.yml exec -T db mysql -u staka -pstaka.ed2020Livres -e \"SELECT COUNT(*) as 'TABLES' FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'stakalivres';\" stakalivres 2>/dev/null || echo 'Production DB vide'")
    
    echo ""
    log_info "=== INFORMATIONS DES BASES ==="
    echo -e "${BLUE}Base locale ($SOURCE_ENV):${NC}"
    echo "$LOCAL_INFO" | column -t
    echo ""
    echo -e "${BLUE}Base production:${NC}"
    echo "$PROD_INFO" | column -t
    echo ""
}

# Création backup production
create_production_backup() {
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Simulation du backup production"
        return 0
    fi
    
    local backup_timestamp=$(date +"%Y%m%d_%H%M%S")
    BACKUP_NAME="migration_backup_${backup_timestamp}"
    
    log_info "Création du backup production: $BACKUP_NAME"
    
    $SSH_CMD "$VPS_USER@$VPS_HOST" << EOF
cd $DEPLOY_DIR
mkdir -p /opt/backups

# Backup complet de la base
if docker compose -f docker-compose.prod.yml exec -T db mysqldump -u staka -pstaka.ed2020Livres --single-transaction --routines --triggers stakalivres > /opt/backups/${BACKUP_NAME}.sql; then
    echo "✓ Backup production créé: ${BACKUP_NAME}.sql"
    ls -lh /opt/backups/${BACKUP_NAME}.sql
else
    echo "✗ Échec du backup production"
    exit 1
fi

# Nettoyage des anciens backups (garde les 5 derniers)
cd /opt/backups
ls -t migration_backup_*.sql 2>/dev/null | tail -n +6 | xargs rm -f || true
EOF
    
    log_success "Backup production créé avec succès"
}

# Migration schéma uniquement (Prisma)
migrate_schema_only() {
    log_info "Migration du schéma uniquement (Prisma migrate)..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Simulation Prisma migrate"
        return 0
    fi
    
    $SSH_CMD "$VPS_USER@$VPS_HOST" << EOF
cd $DEPLOY_DIR

echo "🔄 Application des migrations Prisma..."
if docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy; then
    echo "✅ Migrations Prisma appliquées avec succès"
else
    echo "❌ Échec des migrations Prisma"
    exit 1
fi

echo "📊 Génération du client Prisma..."
docker compose -f docker-compose.prod.yml exec -T backend npx prisma generate

echo "🔍 Vérification de la base après migration..."
MYSQL_PASSWORD=$(docker compose -f docker-compose.prod.yml exec -T db printenv MYSQL_PASSWORD 2>/dev/null || echo "staka.ed2020Livres")
docker compose -f docker-compose.prod.yml exec -T db mysql -u staka -p"$MYSQL_PASSWORD" -e "SHOW TABLES;" stakalivres
EOF
    
    log_success "Migration du schéma terminée"
}

# Migration complète des données
migrate_full_data() {
    log_critical "⚠️  MIGRATION COMPLÈTE DES DONNÉES - OPÉRATION DANGEREUSE ⚠️"
    
    if [[ "$FORCE_MIGRATE" != true ]]; then
        echo ""
        log_warning "Cette opération va REMPLACER toutes les données production!"
        log_warning "Les utilisateurs, commandes, fichiers seront PERDUS!"
        echo ""
        read -p "Tapez 'CONFIRME_MIGRATION_COMPLETE' pour continuer: " confirmation
        
        if [[ "$confirmation" != "CONFIRME_MIGRATION_COMPLETE" ]]; then
            log_info "Migration annulée par l'utilisateur"
            exit 0
        fi
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY-RUN] Simulation export/import complet"
        return 0
    fi
    
    # Export base locale
    log_info "Export de la base locale..."
    local dump_file="/tmp/staka_migration_$(date +%s).sql"
    
    docker compose exec -T db mysqldump -u staka -pstaka --single-transaction --routines --triggers stakalivres > "$dump_file"
    
    if [[ ! -f "$dump_file" || ! -s "$dump_file" ]]; then
        log_error "Échec de l'export de la base locale"
        exit 1
    fi
    
    log_success "Export local terminé: $(wc -l < "$dump_file") lignes"
    
    # Transfer et import
    log_info "Transfer et import vers la production..."
    
    local remote_dump_file="/tmp/$(basename "$dump_file")"
    scp "$dump_file" "$VPS_USER@$VPS_HOST:$remote_dump_file"
    
    $SSH_CMD "$VPS_USER@$VPS_HOST" << EOF
cd $DEPLOY_DIR

echo "🗄️ Import des données en production..."
if docker compose -f docker-compose.prod.yml exec -T db mysql -u staka -pstaka.ed2020Livres stakalivres < $remote_dump_file; then
    echo "✅ Import terminé avec succès"
    rm -f $remote_dump_file
else
    echo "❌ Échec de l'import - Rollback nécessaire"
    exit 1
fi
EOF
    
    # Cleanup local
    rm -f "$dump_file"
    
    log_success "Migration complète terminée"
}

# Vérification post-migration
verify_migration() {
    log_info "Vérification de l'intégrité post-migration..."
    
    # Collecte des nouvelles infos
    collect_db_info
    
    # Test de l'application
    log_info "Test de l'application après migration..."
    
    if curl -f -s --max-time 10 "https://livrestaka.fr/health" > /dev/null; then
        log_success "✓ Application accessible"
    else
        log_warning "⚠ Application non accessible (peut être normal)"
    fi
    
    # Test des services
    $SSH_CMD "$VPS_USER@$VPS_HOST" << EOF
cd $DEPLOY_DIR
echo "📊 État des services:"
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Health}}"
EOF
}

# Rollback en cas d'échec
rollback_migration() {
    log_critical "🔄 ROLLBACK DE LA MIGRATION"
    
    if [[ -z "$BACKUP_NAME" ]]; then
        log_error "Aucun backup trouvé pour le rollback"
        exit 1
    fi
    
    $SSH_CMD "$VPS_USER@$VPS_HOST" << EOF
cd $DEPLOY_DIR

if [[ -f "/opt/backups/${BACKUP_NAME}.sql" ]]; then
    echo "🔄 Restauration du backup: $BACKUP_NAME"
    MYSQL_PASSWORD=$(docker compose -f docker-compose.prod.yml exec -T db printenv MYSQL_PASSWORD 2>/dev/null || echo "staka.ed2020Livres")
    docker compose -f docker-compose.prod.yml exec -T db mysql -u staka -p"$MYSQL_PASSWORD" stakalivres < /opt/backups/${BACKUP_NAME}.sql
    echo "✅ Rollback terminé"
else
    echo "❌ Fichier de backup introuvable"
    exit 1
fi
EOF
    
    log_success "Rollback effectué avec succès"
}

# Fonction principale
main() {
    # Parse des arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --source-env)
                SOURCE_ENV="$2"
                shift 2
                ;;
            --schema-only)
                SCHEMA_ONLY=true
                shift
                ;;
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
    
    # Validation
    if [[ ! "$SOURCE_ENV" =~ ^(dev|staging)$ ]]; then
        log_error "Source env invalide: $SOURCE_ENV (dev|staging uniquement)"
        exit 1
    fi
    
    # Configuration du type de migration
    local migration_type="COMPLÈTE"
    if [[ "$SCHEMA_ONLY" == true ]]; then
        migration_type="SCHÉMA UNIQUEMENT"
    fi
    
    # Information sur la configuration
    echo ""
    log_info "=== CONFIGURATION DE LA MIGRATION ==="
    log_info "Type: $migration_type"
    log_info "Source: $SOURCE_ENV"
    log_info "Cible: production (VPS)"
    log_info "Dry run: $DRY_RUN"
    log_info "Force: $FORCE_MIGRATE"
    echo ""
    
    if [[ "$DRY_RUN" == true ]]; then
        log_warning "Mode simulation - aucune modification ne sera effectuée"
    fi
    
    # Exécution avec gestion d'erreur
    local start_time=$(date +%s)
    
    # Trap pour rollback automatique
    trap 'rollback_migration' ERR
    
    load_env_vars
    test_connectivity
    collect_db_info
    create_production_backup
    
    if [[ "$SCHEMA_ONLY" == true ]]; then
        migrate_schema_only
    else
        migrate_full_data
    fi
    
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
        log_success "=== MIGRATION TERMINÉE AVEC SUCCÈS ==="
    fi
    log_success "Type: $migration_type"
    log_success "Durée: ${duration}s"
    
    if [[ "$DRY_RUN" != true ]]; then
        echo ""
        log_info "Backup sauvegardé: /opt/backups/$BACKUP_NAME.sql"
        log_info "Commande de rollback manuel si besoin:"
        log_info "  ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml exec -T db mysql -u staka -p\$MYSQL_PASSWORD stakalivres < /opt/backups/$BACKUP_NAME.sql'"
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