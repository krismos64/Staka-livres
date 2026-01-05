#!/bin/sh
# Script de renouvellement automatique SSL
# Appelé par Certbot après un renouvellement réussi
# Date : 05 Janvier 2026

echo "[$(date)] 🔄 Certificat SSL renouvelé - Rechargement nginx..." >> /var/log/letsencrypt/renew.log

# Installer docker CLI si nécessaire (dans le conteneur certbot)
if ! command -v docker &> /dev/null; then
    apk add --no-cache docker-cli 2>/dev/null || apt-get update && apt-get install -y docker.io 2>/dev/null
fi

# Méthode 1 : Recharger nginx dans le conteneur frontend (préféré)
if docker exec staka_frontend_prod nginx -s reload 2>/dev/null; then
    echo "[$(date)] ✅ Nginx rechargé avec succès (conteneur frontend)" >> /var/log/letsencrypt/renew.log
    exit 0
fi

# Méthode 2 : Redémarrer le conteneur frontend (fallback)
if docker restart staka_frontend_prod 2>/dev/null; then
    echo "[$(date)] ✅ Conteneur frontend redémarré avec succès" >> /var/log/letsencrypt/renew.log
    exit 0
fi

# Méthode 3 : Recharger nginx système (si nginx externe)
if systemctl reload nginx 2>/dev/null; then
    echo "[$(date)] ✅ Nginx système rechargé avec succès" >> /var/log/letsencrypt/renew.log
    exit 0
fi

echo "[$(date)] ⚠️ Impossible de recharger nginx automatiquement" >> /var/log/letsencrypt/renew.log
exit 1
