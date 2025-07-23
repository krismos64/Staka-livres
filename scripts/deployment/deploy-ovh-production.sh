#!/bin/bash

# 🚀 SCRIPT DE DÉPLOIEMENT AUTOMATIQUE - STAKA LIVRES
# 
# Déploie automatiquement la plateforme Staka Livres sur VPS OVH Ubuntu 22.04
# Domaine: livrestaka.fr (DNS déjà configuré vers IP VPS)
# 
# PRÉREQUIS:
#   - VPS OVH Ubuntu 22.04 configuré
#   - DNS livrestaka.fr → IP VPS configuré
#   - Accès root ou sudo sur le VPS
#   - Ports 22, 80, 443 accessibles
# 
# USAGE:
#   wget -O deploy.sh https://raw.githubusercontent.com/krismos64/Staka-livres/main/deploy-ovh-production.sh
#   chmod +x deploy.sh
#   sudo ./deploy.sh
# 
# @author Staka Livres Team
# @version 3.0.0 - Production OVH Ready
# @date 2025-07-22

set -euo pipefail  # Arrêt strict en cas d'erreur

# =============================================================================
# 🎨 CONFIGURATION ET VARIABLES
# =============================================================================

# Configuration du projet
readonly PROJECT_NAME="Staka-livres"
readonly REPO_URL="https://github.com/krismos64/Staka-livres.git"
readonly DOMAIN="livrestaka.fr"
readonly WWW_DOMAIN="www.livrestaka.fr"
readonly PROJECT_DIR="/opt/staka-livres"
readonly NGINX_CONFIG="/etc/nginx/sites-available/staka-livres"
readonly SSL_EMAIL="admin@livrestaka.fr"

# Ports de l'application
readonly FRONTEND_PORT=3000
readonly BACKEND_PORT=3001
readonly DB_PORT=3306
readonly PRISMA_STUDIO_PORT=5555

# Couleurs pour l'affichage
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Variables de statut
SCRIPT_START_TIME=$(date +%s)
LOG_FILE="/var/log/staka-deployment.log"

# =============================================================================
# 🔧 FONCTIONS UTILITAIRES
# =============================================================================

# Fonction de logging avec timestamp
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${CYAN}[${timestamp}] ${level}: ${message}${NC}" | tee -a "$LOG_FILE"
}

info() { log "INFO" "$@"; }
success() { log "${GREEN}SUCCESS${NC}" "$@"; }
warning() { log "${YELLOW}WARNING${NC}" "$@"; }
error() { log "${RED}ERROR${NC}" "$@"; }

# Fonction pour afficher une bannière
banner() {
    echo -e "${BOLD}${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                 DÉPLOIEMENT STAKA LIVRES                  ║"
    echo "║                   Production OVH VPS                      ║"
    echo "║                   Domain: ${DOMAIN}                ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Vérification des prérequis système
check_prerequisites() {
    info "Vérification des prérequis système..."
    
    # Vérification Ubuntu
    if ! grep -q "Ubuntu" /etc/os-release; then
        error "Ce script nécessite Ubuntu. Distribution détectée: $(lsb_release -d | cut -f2)"
        exit 1
    fi
    
    # Vérification version Ubuntu
    local ubuntu_version=$(lsb_release -rs)
    if [[ $(echo "$ubuntu_version >= 20.04" | bc -l) -ne 1 ]]; then
        error "Ubuntu 20.04+ requis. Version détectée: $ubuntu_version"
        exit 1
    fi
    
    # Vérification permissions root/sudo
    if [[ $EUID -ne 0 ]] && ! sudo -n true 2>/dev/null; then
        error "Ce script nécessite des permissions root ou sudo"
        exit 1
    fi
    
    # Vérification connectivité internet
    if ! curl -s --max-time 5 https://google.com > /dev/null; then
        error "Pas de connectivité Internet détectée"
        exit 1
    fi
    
    # Vérification résolution DNS du domaine
    if ! nslookup "$DOMAIN" > /dev/null 2>&1; then
        warning "Le domaine $DOMAIN ne résout pas correctement. Vérifiez la configuration DNS OVH"
    fi
    
    success "Prérequis système validés"
}

# Mise à jour du système
update_system() {
    info "Mise à jour du système Ubuntu..."
    
    export DEBIAN_FRONTEND=noninteractive
    
    apt-get update -y
    apt-get upgrade -y
    apt-get autoremove -y
    apt-get autoclean
    
    # Installation des paquets de base
    apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        software-properties-common \
        unzip \
        jq \
        git \
        ufw \
        htop \
        nano \
        wget \
        bc \
        fail2ban
    
    success "Système mis à jour et paquets de base installés"
}

# Installation Docker
install_docker() {
    info "Installation de Docker..."
    
    # Vérification si Docker est déjà installé
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
        info "Docker déjà installé (version: $docker_version)"
        
        # Vérification version minimale (20.10+)
        if [[ $(echo "$docker_version >= 20.10" | bc -l) -eq 1 ]]; then
            success "Version Docker compatible"
            return 0
        else
            warning "Version Docker obsolète, mise à jour..."
        fi
    fi
    
    # Suppression des anciennes versions
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Ajout du repository officiel Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Installation Docker
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin
    
    # Configuration Docker
    systemctl enable docker
    systemctl start docker
    
    # Ajout utilisateur au groupe docker (si pas root)
    if [[ $EUID -ne 0 ]]; then
        usermod -aG docker "$USER"
        warning "Vous devrez vous reconnecter pour utiliser Docker sans sudo"
    fi
    
    # Test installation
    if docker run --rm hello-world &> /dev/null; then
        success "Docker installé et fonctionnel (version: $(docker --version | grep -oP '\d+\.\d+\.\d+'))"
    else
        error "Échec du test Docker"
        exit 1
    fi
}

# Installation Docker Compose v2
install_docker_compose() {
    info "Installation de Docker Compose v2..."
    
    # Vérification si Docker Compose v2 est déjà installé
    if docker compose version &> /dev/null; then
        local compose_version=$(docker compose version --short)
        info "Docker Compose v2 déjà installé (version: $compose_version)"
        return 0
    fi
    
    # Docker Compose v2 est normalement inclus avec Docker Desktop/Engine moderne
    # Vérification si le plugin est installé
    if ! docker compose version &> /dev/null; then
        error "Docker Compose v2 non disponible. Installation de Docker Compose v2 standalone..."
        
        # Installation Docker Compose v2 standalone
        local compose_version="v2.24.5"
        curl -SL "https://github.com/docker/compose/releases/download/${compose_version}/docker-compose-linux-$(uname -m)" \
            -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Création du symlink pour docker compose
        ln -sf /usr/local/bin/docker-compose /usr/local/bin/docker-compose-v2
    fi
    
    # Test installation
    if docker compose version &> /dev/null; then
        success "Docker Compose v2 installé (version: $(docker compose version --short))"
    else
        error "Échec installation Docker Compose v2"
        exit 1
    fi
}

# Installation Nginx
install_nginx() {
    info "Installation de Nginx..."
    
    # Vérification si Nginx est déjà installé
    if systemctl is-active nginx &> /dev/null; then
        info "Nginx déjà installé et actif"
        return 0
    fi
    
    # Installation Nginx
    apt-get install -y nginx
    
    # Configuration de base Nginx
    systemctl enable nginx
    systemctl start nginx
    
    # Test installation
    if curl -s http://localhost | grep -q "Welcome to nginx"; then
        success "Nginx installé et fonctionnel"
    else
        error "Échec du test Nginx"
        exit 1
    fi
    
    # Sauvegarde config par défaut
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    success "Nginx configuré avec succès"
}

# Installation Certbot
install_certbot() {
    info "Installation de Certbot (Let's Encrypt)..."
    
    # Vérification si Certbot est déjà installé
    if command -v certbot &> /dev/null; then
        info "Certbot déjà installé (version: $(certbot --version | grep -oP '\d+\.\d+\.\d+'))"
        return 0
    fi
    
    # Installation Certbot via snapd
    apt-get install -y snapd
    systemctl enable snapd
    systemctl start snapd
    
    # Installation du core snap
    snap install core; snap refresh core
    
    # Installation Certbot
    snap install --classic certbot
    
    # Création du lien symbolique
    ln -sf /snap/bin/certbot /usr/bin/certbot
    
    # Test installation
    if certbot --version &> /dev/null; then
        success "Certbot installé (version: $(certbot --version | grep -oP '\d+\.\d+\.\d+'))"
    else
        error "Échec installation Certbot"
        exit 1
    fi
}

# Configuration du pare-feu UFW
configure_firewall() {
    info "Configuration du pare-feu UFW..."
    
    # Reset UFW pour configuration propre
    ufw --force reset
    
    # Règles par défaut
    ufw default deny incoming
    ufw default allow outgoing
    
    # Autoriser SSH (port 22)
    ufw allow ssh
    ufw allow 22/tcp
    
    # Autoriser HTTP/HTTPS (ports 80, 443)
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Autoriser ports Docker internes (localhost seulement)
    ufw allow from 127.0.0.1 to any port $FRONTEND_PORT
    ufw allow from 127.0.0.1 to any port $BACKEND_PORT
    ufw allow from 172.16.0.0/12 to any port $DB_PORT
    
    # Activation UFW
    ufw --force enable
    
    # Affichage des règles
    ufw status verbose
    
    success "Pare-feu UFW configuré et activé"
}

# Configuration Fail2Ban pour sécurité SSH
configure_fail2ban() {
    info "Configuration de Fail2Ban pour sécurité SSH..."
    
    # Configuration SSH jail
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF
    
    # Redémarrage Fail2Ban
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    success "Fail2Ban configuré pour protection SSH"
}

# Clonage du projet
clone_project() {
    info "Clonage du projet Staka Livres..."
    
    # Création du répertoire projet
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # Suppression du répertoire existant si présent
    if [[ -d "$PROJECT_DIR/.git" ]]; then
        warning "Repository déjà cloné, mise à jour..."
        git fetch origin
        git reset --hard origin/main
        git pull origin main
    else
        # Clonage du repository
        git clone "$REPO_URL" .
    fi
    
    # Vérification du clonage
    if [[ ! -f "docker-compose.yml" ]]; then
        error "Échec du clonage - docker-compose.yml non trouvé"
        exit 1
    fi
    
    success "Projet cloné dans $PROJECT_DIR"
}

# Configuration de l'environnement
configure_environment() {
    info "Configuration de l'environnement..."
    
    cd "$PROJECT_DIR"
    
    # Copie du fichier .env.example vers .env
    if [[ -f "backend/.env.example" ]]; then
        cp backend/.env.example backend/.env
        info "Fichier backend/.env créé depuis .env.example"
    else
        warning "Fichier .env.example non trouvé, création d'un .env basique"
        create_basic_env_file
    fi
    
    # Instructions pour l'utilisateur
    echo -e "${BOLD}${YELLOW}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║           CONFIGURATION ENVIRONNEMENT REQUISE            ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${YELLOW}🔧 CONFIGURATION REQUISE:${NC}"
    echo -e "   Le fichier ${BOLD}backend/.env${NC} a été créé."
    echo -e "   Vous devez maintenant configurer les variables suivantes:"
    echo ""
    echo -e "${CYAN}   📧 Email et SendGrid:${NC}"
    echo -e "      SENDGRID_API_KEY=\"SG.votre_cle_sendgrid\""
    echo -e "      FROM_EMAIL=\"noreply@${DOMAIN}\""
    echo -e "      ADMIN_EMAIL=\"admin@${DOMAIN}\""
    echo ""
    echo -e "${CYAN}   💳 Stripe (production):${NC}"
    echo -e "      STRIPE_SECRET_KEY=\"sk_live_votre_cle_live\""
    echo -e "      STRIPE_WEBHOOK_SECRET=\"whsec_votre_webhook_secret\""
    echo ""
    echo -e "${CYAN}   ☁️ AWS S3 (optionnel):${NC}"
    echo -e "      AWS_ACCESS_KEY_ID=\"votre_access_key\""
    echo -e "      AWS_SECRET_ACCESS_KEY=\"votre_secret_key\""
    echo ""
    echo -e "${CYAN}   🔐 Sécurité:${NC}"
    echo -e "      JWT_SECRET=\"votre_jwt_secret_securise\""
    echo -e "      MYSQL_ROOT_PASSWORD=\"mot_de_passe_mysql_securise\""
    echo ""
    
    # Ouverture de l'éditeur
    echo -e "${BOLD}Ouverture de l'éditeur pour configuration...${NC}"
    sleep 3
    
    # Essai de différents éditeurs
    if command -v nano &> /dev/null; then
        nano backend/.env
    elif command -v vim &> /dev/null; then
        vim backend/.env
    elif command -v vi &> /dev/null; then
        vi backend/.env
    else
        error "Aucun éditeur de texte trouvé. Configurez manuellement backend/.env"
        return 1
    fi
    
    # Validation configuration
    while true; do
        echo
        read -p "⏸️ Configuration terminée ? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            break
        elif [[ $REPLY =~ ^[Nn]$ ]]; then
            if command -v nano &> /dev/null; then
                nano backend/.env
            else
                echo "Éditez manuellement le fichier: $PROJECT_DIR/backend/.env"
                read -p "Appuyez sur Entrée quand c'est terminé..."
            fi
        fi
    done
    
    success "Environnement configuré"
}

# Création d'un fichier .env basique
create_basic_env_file() {
    cat > backend/.env << EOF
# Configuration de base Staka Livres
NODE_ENV=production
PORT=3001

# Base de données
DATABASE_URL="mysql://staka:staka_password@db:3306/stakalivres"
SHADOW_DATABASE_URL="mysql://staka:staka_password@db:3306/prisma_shadow"

# JWT
JWT_SECRET="changez_cette_cle_jwt_par_une_cle_securisee_de_64_caracteres_minimum"

# URLs
FRONTEND_URL="https://${DOMAIN}"
APP_URL="https://${DOMAIN}"

# MySQL
MYSQL_ROOT_PASSWORD="changez_ce_mot_de_passe_mysql_root"
MYSQL_PASSWORD="changez_ce_mot_de_passe_mysql_user"

# Email (à configurer)
SENDGRID_API_KEY="SG.VOTRE_CLE_SENDGRID_ICI"
FROM_EMAIL="noreply@${DOMAIN}"
FROM_NAME="Staka Livres"
ADMIN_EMAIL="admin@${DOMAIN}"
SUPPORT_EMAIL="support@${DOMAIN}"

# Stripe (à configurer)
STRIPE_SECRET_KEY="sk_live_VOTRE_CLE_STRIPE_LIVE_ICI"
STRIPE_WEBHOOK_SECRET="whsec_VOTRE_WEBHOOK_SECRET_ICI"

# AWS S3 (optionnel)
AWS_ACCESS_KEY_ID="VOTRE_ACCESS_KEY_ICI"
AWS_SECRET_ACCESS_KEY="VOTRE_SECRET_KEY_ICI"
AWS_REGION="eu-west-3"
AWS_S3_BUCKET="staka-livres-files"
EOF
}

# Démarrage des conteneurs Docker
start_docker_containers() {
    info "Démarrage des conteneurs Docker..."
    
    cd "$PROJECT_DIR"
    
    # Vérification docker-compose.yml
    if [[ ! -f "docker-compose.yml" ]]; then
        error "Fichier docker-compose.yml non trouvé dans $PROJECT_DIR"
        exit 1
    fi
    
    # Arrêt des conteneurs existants
    docker compose down || true
    
    # Build et démarrage des conteneurs
    info "Build et démarrage des conteneurs (cela peut prendre plusieurs minutes)..."
    docker compose up -d --build
    
    # Attente que les services soient prêts
    info "Attente du démarrage des services..."
    sleep 30
    
    # Vérification des conteneurs
    if docker compose ps | grep -q "Up"; then
        success "Conteneurs Docker démarrés avec succès"
        docker compose ps
    else
        error "Échec du démarrage des conteneurs"
        docker compose logs
        exit 1
    fi
    
    # Test des endpoints
    test_application_endpoints
}

# Test des endpoints de l'application
test_application_endpoints() {
    info "Test des endpoints de l'application..."
    
    # Test frontend (port 3000)
    if curl -s -f http://localhost:$FRONTEND_PORT > /dev/null; then
        success "✅ Frontend accessible sur http://localhost:$FRONTEND_PORT"
    else
        warning "⚠️ Frontend non accessible sur le port $FRONTEND_PORT"
    fi
    
    # Test backend (port 3001)
    if curl -s -f http://localhost:$BACKEND_PORT/health > /dev/null; then
        success "✅ Backend accessible sur http://localhost:$BACKEND_PORT/health"
    else
        warning "⚠️ Backend non accessible sur le port $BACKEND_PORT"
    fi
    
    # Test base de données (connexion container)
    if docker compose exec -T db mysqladmin ping -h localhost &> /dev/null; then
        success "✅ Base de données MySQL accessible"
    else
        warning "⚠️ Base de données MySQL non accessible"
    fi
}

# Configuration Nginx reverse proxy
configure_nginx_proxy() {
    info "Configuration du reverse proxy Nginx..."
    
    # Création de la configuration Nginx
    cat > "$NGINX_CONFIG" << EOF
# Configuration Nginx - Staka Livres
# Reverse proxy vers les conteneurs Docker

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    
    # Redirection HTTPS (sera activée après SSL)
    # return 301 https://\$server_name\$request_uri;
    
    # Configuration temporaire pour obtenir le certificat SSL
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy vers le frontend Docker
    location / {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Proxy API vers le backend Docker
    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts étendus pour les webhooks
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:${FRONTEND_PORT}/health;
        access_log off;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rss+xml
        application/vnd.geo+json
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        font/opentype
        image/bmp
        image/svg+xml
        text/cache-manifest
        text/css
        text/plain
        text/vcard
        text/vnd.rim.location.xloc
        text/vtt
        text/x-component
        text/x-cross-domain-policy;
}

# Configuration HTTPS (sera ajoutée par Certbot)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name ${DOMAIN} ${WWW_DOMAIN};
#     
#     # Configuration SSL ajoutée automatiquement par Certbot
# }
EOF
    
    # Activation de la configuration
    ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/staka-livres
    
    # Suppression de la configuration par défaut
    rm -f /etc/nginx/sites-enabled/default
    
    # Test de la configuration Nginx
    if nginx -t; then
        success "Configuration Nginx valide"
        systemctl reload nginx
        success "Nginx rechargé avec la nouvelle configuration"
    else
        error "Configuration Nginx invalide"
        exit 1
    fi
}

# Installation du certificat SSL Let's Encrypt
install_ssl_certificate() {
    info "Installation du certificat SSL Let's Encrypt..."
    
    # Vérification que Nginx est actif
    if ! systemctl is-active nginx &> /dev/null; then
        error "Nginx n'est pas actif"
        exit 1
    fi
    
    # Test de connectivité du domaine
    if ! curl -s --max-time 10 "http://${DOMAIN}" > /dev/null; then
        warning "Le domaine $DOMAIN n'est pas accessible via HTTP"
        echo "Vérifiez que:"
        echo "- Le DNS pointe correctement vers ce serveur"
        echo "- Les ports 80 et 443 sont ouverts"
        echo "- Nginx fonctionne correctement"
        
        read -p "Continuer quand même ? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Installation SSL annulée"
            return 1
        fi
    fi
    
    # Installation du certificat SSL
    info "Demande du certificat SSL pour $DOMAIN et $WWW_DOMAIN..."
    
    if certbot --nginx \
        -d "$DOMAIN" \
        -d "$WWW_DOMAIN" \
        --email "$SSL_EMAIL" \
        --agree-tos \
        --no-eff-email \
        --redirect \
        --non-interactive; then
        
        success "Certificat SSL installé avec succès"
        
        # Test HTTPS
        if curl -s --max-time 10 "https://${DOMAIN}" > /dev/null; then
            success "✅ HTTPS fonctionnel sur https://$DOMAIN"
        else
            warning "⚠️ HTTPS configuré mais non accessible"
        fi
        
        # Configuration du renouvellement automatique
        configure_ssl_renewal
        
    else
        error "Échec de l'installation du certificat SSL"
        warning "Vérifiez que le domaine pointe correctement vers ce serveur"
        return 1
    fi
}

# Configuration du renouvellement automatique SSL
configure_ssl_renewal() {
    info "Configuration du renouvellement automatique SSL..."
    
    # Test du renouvellement
    if certbot renew --dry-run; then
        success "Test de renouvellement SSL réussi"
    else
        warning "Test de renouvellement SSL échoué"
    fi
    
    # Le renouvellement automatique est déjà configuré par le snap Certbot
    # Vérification du timer
    if systemctl is-active snap.certbot.renew.timer &> /dev/null; then
        success "Timer de renouvellement SSL automatique actif"
    else
        warning "Timer de renouvellement SSL non actif"
        systemctl enable snap.certbot.renew.timer
        systemctl start snap.certbot.renew.timer
    fi
}

# Optimisations post-installation
post_installation_optimizations() {
    info "Optimisations post-installation..."
    
    # Optimisation Docker
    optimize_docker_configuration
    
    # Optimisation Nginx
    optimize_nginx_configuration
    
    # Configuration logrotate pour les logs applicatifs
    configure_log_rotation
    
    # Configuration des sauvegardes automatiques
    configure_automatic_backups
    
    success "Optimisations post-installation terminées"
}

# Optimisation de la configuration Docker
optimize_docker_configuration() {
    info "Optimisation de la configuration Docker..."
    
    # Configuration Docker daemon
    cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "default-ulimits": {
        "nofile": {
            "name": "nofile",
            "hard": 65536,
            "soft": 65536
        }
    }
}
EOF
    
    # Redémarrage Docker pour appliquer la configuration
    systemctl restart docker
    
    success "Configuration Docker optimisée"
}

# Optimisation de la configuration Nginx
optimize_nginx_configuration() {
    info "Optimisation de la configuration Nginx..."
    
    # Sauvegarde de la configuration originale
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.original
    
    # Configuration optimisée
    cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;
    types_hash_max_size 2048;
    server_tokens off;
    client_max_body_size 50M;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ##
    # SSL Settings
    ##
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    ##
    # Logging Settings
    ##
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    ##
    # Gzip Settings
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    ##
    # Security Headers
    ##
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF
    
    # Test et rechargement de la configuration
    if nginx -t; then
        systemctl reload nginx
        success "Configuration Nginx optimisée et rechargée"
    else
        error "Erreur dans la configuration Nginx optimisée"
        cp /etc/nginx/nginx.conf.original /etc/nginx/nginx.conf
        systemctl reload nginx
    fi
}

# Configuration de la rotation des logs
configure_log_rotation() {
    info "Configuration de la rotation des logs..."
    
    # Logrotate pour les logs applicatifs
    cat > /etc/logrotate.d/staka-livres << 'EOF'
/var/log/staka-deployment.log {
    weekly
    missingok
    rotate 12
    compress
    delaycompress
    copytruncate
    notifempty
}

/opt/staka-livres/logs/*.log {
    weekly
    missingok
    rotate 4
    compress
    delaycompress
    copytruncate
    notifempty
}
EOF
    
    success "Rotation des logs configurée"
}

# Configuration des sauvegardes automatiques
configure_automatic_backups() {
    info "Configuration des sauvegardes automatiques..."
    
    # Création du script de sauvegarde
    cat > /usr/local/bin/staka-backup.sh << 'EOF'
#!/bin/bash

# Script de sauvegarde automatique Staka Livres
BACKUP_DIR="/opt/backups/staka-livres"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/opt/staka-livres"

# Création du répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Sauvegarde de la base de données
docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
    mysqldump --all-databases --single-transaction --routines --triggers \
    -u root -p$(grep MYSQL_ROOT_PASSWORD "$PROJECT_DIR/backend/.env" | cut -d= -f2 | tr -d '"') \
    > "$BACKUP_DIR/mysql_backup_$DATE.sql"

# Compression de la sauvegarde
gzip "$BACKUP_DIR/mysql_backup_$DATE.sql"

# Sauvegarde des fichiers de configuration
tar -czf "$BACKUP_DIR/config_backup_$DATE.tar.gz" \
    "$PROJECT_DIR/backend/.env" \
    "/etc/nginx/sites-available/staka-livres" \
    "/etc/letsencrypt/live" 2>/dev/null || true

# Nettoyage des anciennes sauvegardes (plus de 30 jours)
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "[$(date)] Sauvegarde terminée: $BACKUP_DIR"
EOF
    
    chmod +x /usr/local/bin/staka-backup.sh
    
    # Ajout de la tâche cron (sauvegarde quotidienne à 2h du matin)
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/staka-backup.sh >> /var/log/staka-backup.log 2>&1") | crontab -
    
    success "Sauvegardes automatiques configurées (quotidiennes à 2h)"
}

# Affichage des informations finales
display_final_information() {
    local end_time=$(date +%s)
    local duration=$((end_time - SCRIPT_START_TIME))
    
    echo -e "${BOLD}${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                  DÉPLOIEMENT TERMINÉ                      ║"
    echo "║                     AVEC SUCCÈS                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    success "Déploiement terminé en $(($duration / 60)) minutes et $(($duration % 60)) secondes"
    
    echo -e "${BOLD}🎉 PLATEFORME STAKA LIVRES DÉPLOYÉE !${NC}\n"
    
    echo -e "${BOLD}🌐 ENDPOINTS DISPONIBLES:${NC}"
    echo -e "   • ${CYAN}Site web principal:${NC}     https://$DOMAIN"
    echo -e "   • ${CYAN}Site web (www):${NC}         https://$WWW_DOMAIN"
    echo -e "   • ${CYAN}API backend:${NC}            https://$DOMAIN/api/"
    echo -e "   • ${CYAN}Health check:${NC}           https://$DOMAIN/health"
    echo ""
    
    echo -e "${BOLD}🔧 ENDPOINTS INTERNES (localhost uniquement):${NC}"
    echo -e "   • ${YELLOW}Frontend direct:${NC}        http://localhost:$FRONTEND_PORT"
    echo -e "   • ${YELLOW}Backend direct:${NC}         http://localhost:$BACKEND_PORT"
    echo -e "   • ${YELLOW}Prisma Studio:${NC}          http://localhost:$PRISMA_STUDIO_PORT"
    echo -e "   • ${YELLOW}Base de données:${NC}        localhost:$DB_PORT"
    echo ""
    
    echo -e "${BOLD}📊 STATUT DES SERVICES:${NC}"
    systemctl is-active docker && echo -e "   • ${GREEN}✅ Docker:${NC}               Actif"
    systemctl is-active nginx && echo -e "   • ${GREEN}✅ Nginx:${NC}                Actif"
    systemctl is-active ufw && echo -e "   • ${GREEN}✅ Pare-feu UFW:${NC}         Actif"
    systemctl is-active fail2ban && echo -e "   • ${GREEN}✅ Fail2Ban:${NC}             Actif"
    
    echo ""
    echo -e "${BOLD}📋 COMMANDES UTILES:${NC}"
    echo -e "   • ${CYAN}Logs Docker:${NC}             docker compose -f $PROJECT_DIR/docker-compose.yml logs -f"
    echo -e "   • ${CYAN}Redémarrer app:${NC}          docker compose -f $PROJECT_DIR/docker-compose.yml restart"
    echo -e "   • ${CYAN}Mise à jour SSL:${NC}         certbot renew"
    echo -e "   • ${CYAN}Statut Nginx:${NC}            systemctl status nginx"
    echo -e "   • ${CYAN}Sauvegarde manuelle:${NC}     /usr/local/bin/staka-backup.sh"
    
    echo ""
    echo -e "${BOLD}🔐 SÉCURITÉ:${NC}"
    echo -e "   • ${GREEN}✅ Certificat SSL:${NC}       Installé et auto-renouvelable"
    echo -e "   • ${GREEN}✅ Pare-feu UFW:${NC}         Configuré (22, 80, 443)"
    echo -e "   • ${GREEN}✅ Fail2Ban:${NC}             Protection SSH active"
    echo -e "   • ${GREEN}✅ Headers sécurité:${NC}     Configurés dans Nginx"
    
    echo ""
    echo -e "${BOLD}💾 SAUVEGARDES:${NC}"
    echo -e "   • ${CYAN}Automatiques:${NC}            Quotidiennes à 2h (base de données + config)"
    echo -e "   • ${CYAN}Répertoire:${NC}              /opt/backups/staka-livres/"
    echo -e "   • ${CYAN}Rétention:${NC}               30 jours"
    
    echo ""
    echo -e "${BOLD}📝 FICHIERS IMPORTANTS:${NC}"
    echo -e "   • ${CYAN}Projet:${NC}                  $PROJECT_DIR"
    echo -e "   • ${CYAN}Configuration .env:${NC}      $PROJECT_DIR/backend/.env"
    echo -e "   • ${CYAN}Config Nginx:${NC}            $NGINX_CONFIG"
    echo -e "   • ${CYAN}Logs déploiement:${NC}        $LOG_FILE"
    echo -e "   • ${CYAN}Logs backup:${NC}             /var/log/staka-backup.log"
    
    echo ""
    echo -e "${BOLD}⚠️ IMPORTANT - PROCHAINES ÉTAPES:${NC}"
    echo -e "${YELLOW}   1. Testez tous les endpoints listés ci-dessus${NC}"
    echo -e "${YELLOW}   2. Configurez les webhooks Stripe vers https://$DOMAIN/api/payments/webhook${NC}"
    echo -e "${YELLOW}   3. Testez les paiements en mode production${NC}"
    echo -e "${YELLOW}   4. Vérifiez les emails SendGrid${NC}"
    echo -e "${YELLOW}   5. Testez la sauvegarde: /usr/local/bin/staka-backup.sh${NC}"
    
    echo ""
    echo -e "${BOLD}📞 SUPPORT:${NC}"
    echo -e "   • ${CYAN}Documentation:${NC}           $PROJECT_DIR/docs/"
    echo -e "   • ${CYAN}Logs en temps réel:${NC}      tail -f $LOG_FILE"
    echo -e "   • ${CYAN}Email:${NC}                   support@${DOMAIN}"
    
    echo ""
    success "🚀 Déploiement Staka Livres terminé avec succès !"
    
    # Affichage des tests finaux
    final_connectivity_tests
}

# Tests finaux de connectivité
final_connectivity_tests() {
    echo ""
    info "🧪 Tests finaux de connectivité..."
    
    # Test HTTPS
    if curl -s --max-time 10 "https://$DOMAIN" > /dev/null; then
        success "✅ Site HTTPS accessible: https://$DOMAIN"
    else
        warning "⚠️ Site HTTPS non accessible: https://$DOMAIN"
    fi
    
    # Test API
    if curl -s --max-time 10 "https://$DOMAIN/api/health" > /dev/null; then
        success "✅ API accessible: https://$DOMAIN/api/"
    else
        warning "⚠️ API non accessible: https://$DOMAIN/api/"
    fi
    
    # Test redirection HTTP -> HTTPS
    local redirect_status=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN")
    if [[ "$redirect_status" == "301" || "$redirect_status" == "302" ]]; then
        success "✅ Redirection HTTP -> HTTPS fonctionnelle"
    else
        warning "⚠️ Redirection HTTP -> HTTPS: Status $redirect_status"
    fi
    
    echo ""
    success "Tests de connectivité terminés"
}

# Fonction de nettoyage en cas d'erreur
cleanup_on_error() {
    error "Une erreur s'est produite pendant le déploiement"
    
    # Logs pour debug
    echo "Logs Docker:"
    docker compose -f "$PROJECT_DIR/docker-compose.yml" logs --tail 50 || true
    
    echo "Logs Nginx:"
    tail -20 /var/log/nginx/error.log || true
    
    echo "Consultez les logs complets: $LOG_FILE"
}

# =============================================================================
# 🎯 FONCTION PRINCIPALE
# =============================================================================

main() {
    # Trap pour nettoyage en cas d'erreur
    trap cleanup_on_error ERR
    
    # Initialisation du fichier de log
    touch "$LOG_FILE"
    chmod 644 "$LOG_FILE"
    
    # Affichage de la bannière
    banner
    
    # Execution des étapes de déploiement
    info "🚀 Début du déploiement Staka Livres sur VPS OVH"
    info "Domaine cible: $DOMAIN"
    info "Logs sauvegardés dans: $LOG_FILE"
    
    # Étapes de déploiement
    check_prerequisites
    update_system
    install_docker
    install_docker_compose
    install_nginx
    install_certbot
    configure_firewall
    configure_fail2ban
    clone_project
    configure_environment
    start_docker_containers
    configure_nginx_proxy
    install_ssl_certificate
    post_installation_optimizations
    
    # Affichage des informations finales
    display_final_information
    
    info "✅ Déploiement terminé avec succès!"
}

# =============================================================================
# 🚀 LANCEMENT DU SCRIPT
# =============================================================================

# Vérification que le script est exécuté en tant que root ou avec sudo
if [[ $EUID -ne 0 ]] && ! sudo -n true 2>/dev/null; then
    echo -e "${RED}❌ Ce script doit être exécuté en tant que root ou avec sudo${NC}"
    echo "Usage: sudo $0"
    exit 1
fi

# Confirmation de lancement
echo -e "${BOLD}${YELLOW}⚠️ ATTENTION: Ce script va configurer complètement votre VPS pour Staka Livres${NC}"
echo -e "   Domaine cible: ${BOLD}$DOMAIN${NC}"
echo -e "   Répertoire: ${BOLD}$PROJECT_DIR${NC}"
echo ""
read -p "Continuer ? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Déploiement annulé"
    exit 0
fi

# Lancement du script principal
main "$@"