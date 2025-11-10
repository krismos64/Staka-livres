# 🔐 Guide de Renouvellement SSL - livrestaka.fr

**Date intervention** : 10 Novembre 2025
**Problème** : Certificat SSL expiré (1er novembre 2025)
**Solution** : Renouvellement via Mode Rescue OVH
**Statut** : ✅ Résolu - Certificat valide jusqu'au 8 février 2026

---

## 📋 Problème Rencontré

### Symptôme
```
Erreur navigateur : "Votre connexion n'est pas privée"
net::ERR_CERT_DATE_INVALID
```

### Causes Identifiées
1. ❌ **Certificat SSL expiré** le 1er novembre 2025
2. ❌ **SSH inaccessible** depuis l'extérieur (port 22 fermé/bloqué)
3. ⚠️ **Edge Firewall OVH actif** mais configuré correctement
4. ⚠️ **Service SSH non actif** sur le VPS en mode normal

---

## ✅ Solution Appliquée

### 1. Accès au VPS via Mode Rescue OVH

**Étapes effectuées** :

1. **OVH Manager** → VPS → Activer **Mode Rescue**
2. **Redémarrer** le VPS
3. **Email OVH** avec identifiants temporaires reçus :
   ```
   Login: root
   Password: QyBnpaCrQzLh (exemple)
   ```

### 2. Connexion SSH Mode Rescue

```bash
# Depuis Mac/Linux
ssh root@51.254.102.133
# Mot de passe : celui reçu par email
```

### 3. Montage du Disque Principal

```bash
# Lister les disques
fdisk -l

# Monter la partition principale (VPS OVH = /dev/sdb1)
mkdir -p /mnt/vps
mount /dev/sdb1 /mnt/vps

# Vérifier
ls -la /mnt/vps/opt/staka-livres/
```

### 4. Installation Certbot

```bash
# Installer certbot en mode rescue
apt-get update
apt-get install -y certbot
```

### 5. Renouvellement du Certificat SSL

```bash
# Renouveler le certificat (standalone mode car nginx arrêté)
certbot certonly --standalone \
  --config-dir /mnt/opt/staka/certs \
  --work-dir /tmp/certbot-work \
  --logs-dir /tmp/certbot-logs \
  -d livrestaka.fr \
  -d www.livrestaka.fr \
  --force-renewal \
  --non-interactive \
  --agree-tos \
  --email contact@livrestaka.fr

# Résultat : Certificat créé dans /mnt/opt/staka/certs/live/livrestaka.fr-0001/
```

### 6. Activation du Nouveau Certificat

```bash
cd /mnt/opt/staka/certs/live

# Sauvegarder l'ancien
mv livrestaka.fr livrestaka.fr-old-backup

# Activer le nouveau
mv livrestaka.fr-0001 livrestaka.fr

# Vérifier
openssl x509 -enddate -noout -in /mnt/opt/staka/certs/live/livrestaka.fr/cert.pem
# Résultat : notAfter=Feb  8 08:09:32 2026 GMT ✅
```

### 7. Redémarrage en Mode Normal

1. **OVH Manager** → VPS → Désactiver **Mode Rescue**
2. Sélectionner **"Booter sur le disque dur"**
3. **Redémarrer** le VPS
4. **Attendre 2-3 minutes**

### 8. Vérification Finale

```bash
# Depuis le Mac
curl -I https://livrestaka.fr

# Résultat attendu :
# HTTP/2 200
# server: nginx/1.18.0 (Ubuntu)
# ✅ Certificat SSL valide
```

---

## 🚀 Procédure Rapide - Prochain Renouvellement

### ⏱️ Timeline : ~10 minutes

### 📍 Étape 1 : Activer Mode Rescue (2 min)

1. **OVH Manager** : https://www.ovh.com/manager/
2. Aller sur ton **VPS** (vps-c0089a0e)
3. Cliquer **"Netboot"** ou **"Mode de démarrage"**
4. Sélectionner **"Mode Rescue"**
5. Cliquer **"Redémarrer"**
6. **Récupérer le mot de passe** dans l'email OVH

---

### 📍 Étape 2 : Connexion SSH (1 min)

```bash
# Supprimer l'ancienne clé SSH
ssh-keygen -R 51.254.102.133

# Se connecter avec le mot de passe rescue
ssh root@51.254.102.133
```

---

### 📍 Étape 3 : Script de Renouvellement Complet (3 min)

**Copie-colle ce script dans le terminal SSH** :

```bash
#!/bin/bash
echo "🔧 Renouvellement SSL livrestaka.fr - Mode Rescue"

# 1. Monter le disque
echo "📂 Montage du disque..."
mount /dev/sdb1 /mnt 2>/dev/null || echo "Déjà monté"

# 2. Installer certbot si nécessaire
if ! command -v certbot &> /dev/null; then
    echo "📦 Installation de certbot..."
    apt-get update -qq && apt-get install -y certbot -qq
fi

# 3. Renouveler le certificat
echo "🔐 Renouvellement du certificat..."
certbot certonly --standalone \
  --config-dir /mnt/opt/staka/certs \
  --work-dir /tmp/certbot-work \
  --logs-dir /tmp/certbot-logs \
  -d livrestaka.fr \
  -d www.livrestaka.fr \
  --force-renewal \
  --non-interactive \
  --agree-tos \
  --email contact@livrestaka.fr

# 4. Activer le nouveau certificat
echo "✅ Activation du certificat..."
cd /mnt/opt/staka/certs/live
if [ -d "livrestaka.fr-0001" ]; then
    mv livrestaka.fr livrestaka.fr-old-backup-$(date +%Y%m%d) 2>/dev/null || true
    mv livrestaka.fr-0001 livrestaka.fr
elif [ -d "livrestaka.fr-0002" ]; then
    mv livrestaka.fr livrestaka.fr-old-backup-$(date +%Y%m%d) 2>/dev/null || true
    mv livrestaka.fr-0002 livrestaka.fr
fi

# 5. Vérifier
echo "🔍 Vérification..."
openssl x509 -enddate -noout -in /mnt/opt/staka/certs/live/livrestaka.fr/cert.pem

echo ""
echo "✅ Renouvellement terminé !"
echo "📌 Prochaine étape : Sortir du mode rescue et redémarrer le VPS"
```

---

### 📍 Étape 4 : Sortir du Mode Rescue (2 min)

1. **OVH Manager** → Ton VPS
2. **"Netboot"** → Sélectionner **"Booter sur le disque dur"**
3. **"Redémarrer"** le VPS
4. **Attendre 2-3 minutes**

---

### 📍 Étape 5 : Vérification (1 min)

```bash
# Depuis ton Mac
curl -I https://livrestaka.fr

# Ouvrir dans le navigateur
open https://livrestaka.fr
```

**Résultat attendu** : ✅ Site accessible sans erreur SSL

---

## 📅 Calendrier de Renouvellement

### Dates Importantes

| Date | Événement | Action |
|------|-----------|--------|
| **8 février 2026** | Expiration certificat actuel | ⚠️ Renouveler AVANT cette date |
| **8 janvier 2026** | Rappel renouvellement | 🔔 1 mois avant expiration |
| **8 décembre 2025** | Vérification préventive | ℹ️ Optionnel |

### 🔔 Rappels Automatiques

**Ajouter un rappel dans ton calendrier** :
- **1 mois avant** l'expiration (8 janvier 2026)
- **1 semaine avant** l'expiration (1 février 2026)

---

## ⚙️ Configuration Automatisation SSL (Futur)

### Une fois SSH actif sur le VPS

**Via Console KVM ou SSH (quand disponible)** :

```bash
# 1. Créer le script de renouvellement
cat > /opt/staka-livres/scripts/renew-ssl.sh << 'EOF'
#!/bin/bash
# Script de renouvellement automatique SSL
docker run --rm \
  -v /opt/staka/certs:/etc/letsencrypt \
  certbot/certbot renew --quiet

# Recharger nginx si renouvellement réussi
if [ $? -eq 0 ]; then
    systemctl reload nginx 2>/dev/null || \
    docker compose -f /opt/staka-livres/docker-compose.prod.yml restart frontend
    echo "$(date): SSL renouvelé et nginx rechargé" >> /var/log/ssl-renew.log
fi
EOF

chmod +x /opt/staka-livres/scripts/renew-ssl.sh

# 2. Ajouter au cron (tous les 2 mois)
(crontab -l 2>/dev/null; echo "0 3 1 */2 * /opt/staka-livres/scripts/renew-ssl.sh") | crontab -

# 3. Vérifier le cron
crontab -l
```

**Explication** :
- S'exécute le **1er de chaque mois pair** à **3h du matin**
- Renouvelle uniquement si certificat expire dans moins de 30 jours
- Recharge nginx automatiquement

---

## 🔧 Troubleshooting

### Problème : SSH inaccessible en mode normal

**Symptômes** :
```bash
ssh root@51.254.102.133
# → Connection refused ou Permission denied
```

**Solutions** :

1. **Via Console KVM OVH** :
   ```bash
   systemctl enable sshd
   systemctl start sshd
   systemctl status sshd
   ```

2. **Ajouter ta clé SSH** :
   ```bash
   mkdir -p /root/.ssh
   chmod 700 /root/.ssh
   echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKLG1wxHNMWbWLK6bSWkzaptav8w5oDZQfVkC4N0Svde c.mostefaoui@yahoo.fr" >> /root/.ssh/authorized_keys
   chmod 600 /root/.ssh/authorized_keys
   ```

3. **Vérifier le firewall** :
   ```bash
   ufw status
   ufw allow 22/tcp
   ```

---

### Problème : Mode rescue ne démarre pas SSH

**Solution** :
- Utiliser la **Console KVM** d'OVH (toujours accessible)
- Redémarrer le VPS en mode rescue

---

### Problème : Certificat dans mauvais dossier

Si le nouveau certificat est dans `livrestaka.fr-0002` au lieu de `livrestaka.fr-0001` :

```bash
cd /mnt/opt/staka/certs/live
mv livrestaka.fr livrestaka.fr-old-backup
mv livrestaka.fr-0002 livrestaka.fr  # Adapter le numéro
```

---

## 📁 Structure des Certificats

```
/opt/staka/certs/
├── live/
│   └── livrestaka.fr/           # Certificats actifs (symlinks)
│       ├── fullchain.pem
│       ├── privkey.pem
│       ├── cert.pem
│       └── chain.pem
├── archive/
│   └── livrestaka.fr/           # Historique des certificats
│       ├── fullchain1.pem
│       ├── privkey1.pem
│       └── ...
└── renewal/
    └── livrestaka.fr.conf       # Configuration de renouvellement
```

---

## 🔗 Ressources Utiles

- **OVH Manager** : https://www.ovh.com/manager/
- **Let's Encrypt** : https://letsencrypt.org/
- **Certbot Docs** : https://certbot.eff.org/docs/
- **Documentation Projet** : `/docs/README.md`

---

## 📝 Historique des Renouvellements

| Date | Méthode | Certificat Expire le | Statut | Notes |
|------|---------|---------------------|--------|-------|
| 10/11/2025 | Mode Rescue | 08/02/2026 | ✅ | Premier renouvellement documenté |
| _À compléter_ | | | | |

---

## ✅ Checklist Renouvellement Rapide

- [ ] Activer Mode Rescue sur OVH Manager
- [ ] Récupérer mot de passe dans l'email OVH
- [ ] SSH : `ssh root@51.254.102.133`
- [ ] Monter : `mount /dev/sdb1 /mnt`
- [ ] Installer certbot : `apt-get install -y certbot`
- [ ] Exécuter script de renouvellement (voir Étape 3)
- [ ] Vérifier nouveau certificat
- [ ] Désactiver Mode Rescue sur OVH
- [ ] Redémarrer VPS en mode normal
- [ ] Tester : `curl -I https://livrestaka.fr`
- [ ] Vérifier dans navigateur
- [ ] Mettre à jour ce document (date, expiration)

---

**📅 Prochain renouvellement recommandé** : **Janvier 2026**
**🔔 Rappel** : Ajouter au calendrier !

---

*Document créé le 10 novembre 2025 - Christophe Mostefaoui*
*Projet : Staka-Livres - livrestaka.fr*
