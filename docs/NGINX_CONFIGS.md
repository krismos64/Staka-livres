# 🔧 Configurations Nginx - Staka Livres

![Architecture](https://img.shields.io/badge/Architecture-nginx%20externe%20v5-blue)
![SSL](https://img.shields.io/badge/SSL-Let's%20Encrypt-green)
![Status](https://img.shields.io/badge/Status-Production%20Active-brightgreen)

## 📁 **Fichiers de configuration (Architecture v5)**

| Fichier | Usage | Proxy vers | SSL | Context |
|---------|-------|------------|-----|---------|
| `nginx-external.conf` | **nginx externe VPS** | localhost:8080 + 3000 | ✅ HTTPS | Système |
| `nginx-prod.conf` | **Conteneur frontend** | staka_backend_prod:3000 | ❌ HTTP | Docker |
| `nginx-dev.conf` | **Développement local** | backend:3000 | ❌ HTTP | Docker |
| `nginx.conf` | **Historique (v4)** | staka_backend_prod:3000 | ✅ HTTPS | Deprecated |

**🆕 Architecture v5** : nginx externe gère HTTPS, conteneurs utilisent HTTP interne

## 🎯 **Corrections appliquées pour Stripe Webhook**

### ✅ **Problème résolu**
- **Erreur 405 "Method Not Allowed"** → Route `/payments/webhook` ajoutée
- **Port incorrect** → Backend utilise le port 3000 (pas 3001)
- **Nom conteneur** → Production utilise `staka_backend_prod`

### 🔧 **Configuration Webhook correcte**

```nginx
# CRITICAL: Stripe webhook endpoint - MUST be before /api location
location = /payments/webhook {
    # Permettre uniquement POST
    if ($request_method != POST) {
        return 405;
    }
    
    # Proxy vers le backend sur le bon port
    proxy_pass http://staka_backend_prod:3000/payments/webhook;  # Production
    # proxy_pass http://backend:3000/payments/webhook;           # Dev local
    
    # CRITICAL: Préserver le header Stripe-Signature
    proxy_set_header Stripe-Signature $http_stripe_signature;
    
    # CRITICAL: Désactiver le buffering pour les webhooks
    proxy_buffering off;
    proxy_request_buffering off;
    
    # Timeouts généreux pour le traitement des webhooks
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
    
    # Headers standard
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Taille max du body pour les webhooks
    client_max_body_size 10M;
    client_body_buffer_size 128k;
}
```

## 🚀 **Déploiement**

### **Production (VPS)**
- Configuration appliquée directement dans le conteneur `staka_frontend_ssl`
- Fichier : `/etc/nginx/conf.d/default.conf`
- Backend : `staka_backend_prod:3000`

### **Développement local**
- Utiliser `nginx-dev.conf` pour docker-compose
- Backend : `backend:3000`
- Pas de SSL en développement

## 🧪 **Tests**

```bash
# Test webhook production
curl -X POST https://livrestaka.fr/payments/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"test": true}'
# Doit retourner 400 (signature invalide)

# Test webhook développement
curl -X POST http://localhost:3001/payments/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"test": true}'
# Doit retourner 400 (signature invalide)
```

## 📋 **Synchronisation VPS ↔ Local**

1. **Modifications VPS → Local** : ✅ Fait
2. **Modifications Local → VPS** : Copier dans le conteneur
   ```bash
   docker cp nginx.conf staka_frontend_ssl:/etc/nginx/conf.d/default.conf
   docker exec staka_frontend_ssl nginx -s reload
   ```

## 🔍 **Debugging**

```bash
# Logs webhook VPS
docker logs staka_backend_prod | grep Stripe

# Logs nginx VPS
docker logs staka_frontend_ssl

# Test connectivité backend
docker exec staka_frontend_ssl curl http://staka_backend_prod:3000/health
```