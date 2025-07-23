# Guide de déploiement VPS OVH + DockerHub

Ce guide détaille le déploiement de Staka-Livres sur un VPS OVH avec les images Docker hébergées sur DockerHub.

> 📖 **Voir aussi :** [DEPLOYMENT_DOCKER.md](./DEPLOYMENT_DOCKER.md) pour la documentation technique complète de l'architecture Docker.

## 🎯 Architecture de déploiement

- **Frontend** : React (Nginx) sur port 3000
- **Backend** : Node.js/Express sur port 3001  
- **Database** : MySQL 8.0 sur port 3306
- **Reverse Proxy** : Nginx avec SSL/HTTPS
- **Registry** : DockerHub pour les images
- **Monitoring** : Watchtower pour auto-update

## 📋 Prérequis VPS

### Spécifications minimales recommandées
- **CPU** : 2 vCores
- **RAM** : 4 GB
- **Stockage** : 50 GB SSD
- **Bande passante** : Illimitée
- **OS** : Ubuntu 22.04 LTS

### Installation des dépendances
```bash
# Connexion SSH au VPS
ssh user@votre-vps-ip

# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation Docker Compose
sudo apt install docker-compose-plugin

# Outils utiles
sudo apt install git curl wget nginx certbot python3-certbot-nginx
```

## 🚀 Déploiement initial

### 1. Configuration DockerHub

Créer un compte et repository sur [DockerHub](https://hub.docker.com):
- Repository : `votre-username/frontend`
- Repository : `votre-username/backend`

### 2. Configuration GitHub Secrets

Dans votre repo GitHub > Settings > Secrets and variables > Actions :
```
DOCKERHUB_USERNAME=votre-username
DOCKERHUB_TOKEN=votre-token-dockerhub
```

### 3. Clone et configuration sur le VPS

```bash
# Clone du projet
cd /opt
sudo git clone https://github.com/votre-username/staka-livres.git
sudo chown -R $USER:$USER staka-livres
cd staka-livres

# Configuration des variables d'environnement
cp backend/.env.prod.example backend/.env.prod
nano backend/.env.prod  # Modifier les valeurs
```

### 4. Premier déploiement

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Modifier le registry DockerHub dans docker-compose.prod.yml
nano docker-compose.prod.yml
# Remplacer DOCKER_REGISTRY par votre username DockerHub

# Lancer le déploiement
./deploy.sh production latest
```

## 🔧 Configuration DNS

Pointer vos domaines vers l'IP du VPS :

```dns
Type A    staka-livres.com         -> IP_VPS
Type A    www.staka-livres.com     -> IP_VPS  
Type A    api.staka-livres.com     -> IP_VPS
```

## 🔒 Configuration SSL avec Let's Encrypt

```bash
# Installation des certificats
sudo certbot --nginx -d staka-livres.com -d www.staka-livres.com -d api.staka-livres.com

# Décommentez les sections HTTPS dans nginx/sites/staka-livres.conf
nano nginx/sites/staka-livres.conf

# Redémarrer Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 📊 Monitoring et maintenance

### Logs
```bash
# Logs en temps réel
docker-compose -f docker-compose.prod.yml logs -f

# Logs spécifiques
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

### Sauvegardes automatiques
```bash
# Crontab pour sauvegarde quotidienne
crontab -e

# Ajouter cette ligne pour sauvegarde à 2h du matin
0 2 * * * /opt/staka-livres/backup.sh >> /var/log/backup.log 2>&1
```

### Mises à jour
```bash
# Mise à jour automatique via Watchtower (inclus dans docker-compose.prod.yml)
# Ou mise à jour manuelle :
git pull origin main
./deploy.sh production latest
```

## 🚨 Dépannage

### Problèmes courants

**Services ne démarrent pas**
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs [service]
```

**Base de données inaccessible**
```bash
docker exec -it staka_db_prod mysql -u root -p
```

**Frontend/Backend non accessible**
```bash
# Vérifier les ports
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3001

# Vérifier les healthchecks
docker-compose -f docker-compose.prod.yml ps
```

**Problème SSL**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

## 🔄 Workflow de déploiement continu

1. **Push sur `main`** → GitHub Actions build et push DockerHub
2. **Auto-déploiement** (optionnel) → Watchtower détecte et update
3. **Déploiement manuel** → `./deploy.sh production latest`

## 📈 Optimisations recommandées

### Performance
- **CDN** : Cloudflare pour les assets statiques
- **Cache** : Redis pour sessions/cache applicatif
- **Compression** : Gzip activé dans Nginx

### Sécurité
- **Firewall** : UFW configuré pour ports 22, 80, 443 uniquement
- **Fail2ban** : Protection contre brute force
- **Updates** : Sécurité automatiques Ubuntu

### Monitoring
- **Grafana + Prometheus** : Métriques applicatives
- **UptimeRobot** : Monitoring externe
- **Sentry** : Tracking erreurs

---

## 🎉 Checklist post-déploiement

- [ ] Services démarrent correctement
- [ ] Base de données accessible et migrée
- [ ] Frontend accessible via domaine
- [ ] API backend fonctionnelle
- [ ] SSL/HTTPS configuré
- [ ] Tests E2E passent en production
- [ ] Sauvegardes automatiques activées
- [ ] Monitoring configuré
- [ ] Logs accessibles

**Votre Staka-Livres est maintenant en production ! 🚀**