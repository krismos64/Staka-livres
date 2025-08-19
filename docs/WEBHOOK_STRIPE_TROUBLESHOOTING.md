# 🚨 Guide de Troubleshooting Webhook Stripe

![Status](https://img.shields.io/badge/Status-Webhook%20Résolu-brightgreen)
![Fixed](https://img.shields.io/badge/Fixed-19%20Août%202025-blue)

**✅ Problème principal résolu : Erreur 405 → 400**

---

## 📋 **Problème résolu : 19 Août 2025**

### 🔴 **Symptômes**
- Stripe envoie des alertes par email : "webhook endpoint failed"
- Erreur `405 Method Not Allowed` sur `https://livrestaka.fr/payments/webhook`
- Événements `checkout.session.completed` non traités
- Paiements non finalisés automatiquement

### 🔍 **Diagnostic effectué**
```bash
curl -X POST https://livrestaka.fr/payments/webhook
# AVANT : 405 Method Not Allowed
# APRÈS : 400 Bad Request (comportement correct)
```

### ⚡ **Causes identifiées**

1. **Route nginx manquante** : `/payments/webhook` n'existait pas dans la config
2. **Port incorrect** : nginx pointait vers port `3001` au lieu de `3000`
3. **Conteneur incorrect** : référence à `backend` au lieu de `staka_backend_prod`
4. **Headers perdus** : `Stripe-Signature` pas préservé

### ✅ **Solutions appliquées**

#### 1. Configuration nginx corrigée
```nginx
# Ajouté dans /etc/nginx/conf.d/default.conf
location = /payments/webhook {
    # Permettre uniquement POST
    if ($request_method != POST) {
        return 405;
    }
    
    # Proxy vers le bon conteneur et port
    proxy_pass http://staka_backend_prod:3000/payments/webhook;
    
    # CRITICAL: Préserver le header Stripe-Signature
    proxy_set_header Stripe-Signature $http_stripe_signature;
    
    # CRITICAL: Désactiver le buffering pour les webhooks
    proxy_buffering off;
    proxy_request_buffering off;
    
    # Timeouts généreux pour le traitement
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
    
    # Headers standard
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### 2. Scripts de diagnostic créés
Trois scripts de monitoring ont été créés sur le VPS :

**`/root/test-stripe-webhook.sh`** :
```bash
#!/bin/bash
echo "🧪 Test du webhook Stripe"
response=$(curl -X POST https://livrestaka.fr/payments/webhook \
    -H "Content-Type: application/json" \
    -H "Stripe-Signature: test" \
    -d '{"test": true}' \
    -w "\n%{http_code}" -s)

http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "400" ]; then
    echo "✅ Webhook accessible (400 = signature invalide attendue)"
else
    echo "❌ Problème: Code HTTP $http_code"
fi
```

**`/root/monitor-stripe-events.sh`** :
```bash
#!/bin/bash
echo "📊 Analyse des événements Stripe"
docker logs staka_backend_prod 2>&1 | grep "Stripe Webhook" | tail -10
docker logs staka_backend_prod --since 24h 2>&1 | grep "Aucune commande ou PendingCommande trouvée" | wc -l
echo "événements orphelins détectés"
```

#### 3. Documentation synchronisée
- Configuration locale mise à jour (`nginx.conf`, `nginx-dev.conf`)
- Documentation technique complétée
- Guide troubleshooting créé

---

## 🔧 **Procédure de diagnostic**

### 1. **Test basique du webhook**
```bash
# Doit retourner 400, pas 405
curl -X POST https://livrestaka.fr/payments/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"test": true}' -v
```

### 2. **Vérification des conteneurs**
```bash
# Vérifier que les conteneurs tournent
docker ps | grep -E "backend|frontend"

# Vérifier les logs du backend
docker logs staka_backend_prod --tail 20 | grep -E "Stripe|webhook"
```

### 3. **Test de connectivité interne**
```bash
# Depuis le conteneur nginx vers le backend
docker exec staka_frontend_ssl curl -X POST http://staka_backend_prod:3000/payments/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"test": true}'
```

### 4. **Vérification de la configuration nginx**
```bash
# Tester la config nginx
docker exec staka_frontend_ssl nginx -t

# Voir la config actuelle
docker exec staka_frontend_ssl cat /etc/nginx/conf.d/default.conf | grep -A 20 "payments/webhook"
```

---

## 📊 **Monitoring en production**

### **Scripts automatisés disponibles**
```bash
# Test rapide webhook
/root/test-stripe-webhook.sh

# Monitoring complet des événements
/root/monitor-stripe-events.sh

# Analyse détaillée des PendingCommandes
/root/monitor-stripe-webhooks.sh
```

### **Logs importants à surveiller**
```bash
# Logs webhook en temps réel
docker logs -f staka_backend_prod | grep "Stripe Webhook"

# Événements traités avec succès
docker logs staka_backend_prod | grep "✅.*Stripe Webhook.*traité avec succès"

# Événements échoués
docker logs staka_backend_prod | grep "❌.*Stripe Webhook"

# Événements orphelins (sans PendingCommande)
docker logs staka_backend_prod | grep "Aucune commande ou PendingCommande trouvée"
```

---

## ⚠️ **Problèmes potentiels futurs**

### 1. **Événements orphelins**
**Symptôme** : "Aucune commande ou PendingCommande trouvée pour session"  
**Cause** : Paiements depuis un autre site (ex: staka.fr au lieu de livrestaka.fr)  
**Solution** : Ces événements peuvent être ignorés s'ils viennent d'une autre source

### 2. **Timeouts webhook**
**Symptôme** : Stripe reçoit des timeouts du webhook  
**Cause** : Traitement trop long (>30s)  
**Solution** : Vérifier les performances du backend, optimiser les requêtes DB

### 3. **Problèmes de signature**
**Symptôme** : "Signature webhook invalide"  
**Cause** : Header `Stripe-Signature` pas préservé ou modifié  
**Solution** : Vérifier la config nginx `proxy_set_header Stripe-Signature`

### 4. **Perte de headers**
**Symptôme** : Le backend ne reçoit pas les headers Stripe  
**Cause** : Configuration proxy nginx incorrecte  
**Solution** : Vérifier que tous les headers sont transmis

---

## 🎯 **Checklist de validation**

- [ ] `curl -X POST https://livrestaka.fr/payments/webhook` → `400` (pas `405`)
- [ ] Headers `Stripe-Signature` préservés dans la requête
- [ ] Logs backend montrent "Événement reçu: checkout.session.completed"  
- [ ] Pas d'erreurs nginx dans `/var/log/nginx/error.log`
- [ ] Conteneurs `staka_backend_prod` et `staka_frontend_ssl` en cours d'exécution
- [ ] Configuration nginx contient la route `/payments/webhook`
- [ ] Scripts de monitoring fonctionnels sur le VPS

---

## 📞 **Support**

**En cas de problème avec les webhooks Stripe :**

1. **Exécuter les scripts de diagnostic** sur le VPS
2. **Vérifier les logs** du backend et nginx
3. **Tester manuellement** avec curl
4. **Vérifier la configuration** nginx dans le conteneur
5. **Consulter cette documentation** pour les solutions connues

**Contact** : Développé par [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

---

*Dernière mise à jour : 19 Août 2025 - Webhook Stripe 100% fonctionnel*