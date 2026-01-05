# 🔐 Déploiement Certbot Automatisé - Mode Rescue OVH

![Date](https://img.shields.io/badge/Date-05%20Janvier%202026-blue)
![Status](https://img.shields.io/badge/Status-À%20Ex%C3%A9cuter-orange)
![Priority](https://img.shields.io/badge/Priority-Important-red)

Documentation complète pour déployer le service Certbot automatisé via le Mode Rescue OVH.

**📅 Date de création** : 05 Janvier 2026
**📅 Date prévue d'exécution** : ~20 Janvier 2026
**⏱️ Durée estimée** : 15-20 minutes
**🎯 Objectif** : Automatiser le renouvellement SSL (plus jamais de renouvellement manuel)

---

## 📋 Table des matières

1. [Contexte et pourquoi cette manipulation](#-contexte-et-pourquoi-cette-manipulation)
2. [Prérequis](#-prérequis)
3. [Informer le client](#-informer-le-client)
4. [Procédure complète Mode Rescue](#-procédure-complète-mode-rescue)
5. [Vérifications post-déploiement](#-vérifications-post-déploiement)
6. [Communication client après intervention](#-communication-client-après-intervention)
7. [Troubleshooting](#-troubleshooting)

---

## 🎯 Contexte et pourquoi cette manipulation

### Problème actuel

- ❌ **SSH inaccessible** depuis l'extérieur (port 22 fermé)
- ❌ **Renouvellement SSL manuel** tous les 90 jours via Mode Rescue
- ❌ **Risque d'oubli** = site inaccessible si certificat expire
- ❌ **30 minutes de manipulation** à chaque renouvellement

### Solution mise en place

- ✅ **Service Certbot automatisé** dans Docker
- ✅ **Vérification automatique** toutes les 12 heures
- ✅ **Renouvellement automatique** 30 jours avant expiration
- ✅ **Rechargement nginx automatique** après renouvellement
- ✅ **Zéro intervention humaine** nécessaire

### Modifications techniques effectuées

**Fichiers créés/modifiés (déjà sur GitHub) :**
- ✅ `docker-compose.prod.yml` : Service Certbot ajouté
- ✅ `scripts/certbot-renew.sh` : Script de rechargement nginx
- ✅ `docs/SSL_AUTO_RENEWAL_SETUP.md` : Documentation technique
- ✅ `docs/CLIENT_ACCESS_GUIDE.md` : Guide d'accès client

**Commit GitHub :** `0ee3547` - `feat: automatisation complète renouvellement SSL + guide client`

---

## 🔑 Prérequis

### Avant de commencer

- [ ] **Accès OVH Manager** : https://www.ovh.com/manager/
- [ ] **Identifiants OVH** : Avoir accès au compte OVH du VPS
- [ ] **Email accessible** : Pour recevoir le mot de passe Mode Rescue
- [ ] **15-20 minutes disponibles** : Pour faire la manipulation complète
- [ ] **Client informé** : Lui avoir annoncé une maintenance courte

### Informations VPS

```
Serveur : 51.254.102.133
VPS OVH : vps-c0089a0e (ou similaire)
Projet : /opt/staka-livres
Site : https://livrestaka.fr
```

---

## 📧 Informer le client

### Email à envoyer au client (3-5 jours avant)

```
Objet : Maintenance programmée - Automatisation SSL

Bonjour,

Je vous informe qu'une maintenance technique est programmée
pour améliorer la sécurité et la fiabilité de votre plateforme
Staka Livres.

📅 Date : [DATE CHOISIE - exemple : 20 janvier 2026]
⏱️ Durée : ~15 minutes
🌐 Impact : Aucun (site restera accessible)

Cette maintenance permettra d'automatiser complètement le
renouvellement de votre certificat SSL. Actuellement, cette
opération nécessite une intervention manuelle tous les 90 jours.

Après cette mise à jour :
✅ Renouvellement SSL 100% automatique
✅ Aucune intervention de votre part
✅ Site toujours sécurisé (HTTPS)

Vous recevrez peut-être un email automatique d'OVH concernant
le redémarrage du serveur. C'est tout à fait normal et fait
partie de la procédure.

Je vous tiendrai informé une fois la maintenance terminée.

Cordialement,
Christophe
```

---

## 🚀 Procédure complète Mode Rescue

### Étape 1 : Activer le Mode Rescue OVH (5 minutes)

#### 1.1 Accéder à OVH Manager

1. **Ouvrir le navigateur**
2. Aller sur : https://www.ovh.com/manager/
3. **Se connecter** avec les identifiants OVH

#### 1.2 Trouver le VPS

1. Dans le menu de gauche, cliquer sur **"Bare Metal Cloud"** ou **"Public Cloud"**
2. Puis cliquer sur **"VPS"**
3. Sélectionner le VPS avec l'IP **51.254.102.133** (probablement nommé `vps-c0089a0e`)

#### 1.3 Activer le Mode Rescue

1. Dans l'onglet **"Accueil"** du VPS
2. Chercher la section **"Boot"** ou **"Mode de démarrage"**
3. Cliquer sur **"..."** (trois points) ou **"Modifier"**
4. Cliquer sur **"Redémarrer"** ou **"Redémarrer le VPS"**
5. **Une popup s'ouvre** avec les options de démarrage

**⚠️ IMPORTANT : Dans la popup**

- Sélectionner **"Redémarrer en mode rescue"** (PAS "Redémarrer normalement")
- Choisir le mode : **"rescue-customer"** ou **"rescue64-pro"** (les deux fonctionnent)
- Cocher **"Recevoir les identifiants par email"** si l'option existe
- Cliquer sur **"Valider"** ou **"Confirmer"**

#### 1.4 Attendre l'email OVH

- **Délai** : 2-5 minutes maximum
- **Vérifier** : Boîte email associée au compte OVH
- **Objet email** : "Votre VPS est en mode rescue" ou similaire

**L'email contient :**
```
Serveur : 51.254.102.133 (ou nom du VPS)
Login : root
Mot de passe : AbCd1234XyZ (exemple - sera différent)
```

**📝 Noter ce mot de passe temporaire !**

---

### Étape 2 : Connexion SSH Mode Rescue (2 minutes)

#### 2.1 Ouvrir le Terminal

- **Mac** : Ouvrir l'application "Terminal"
- **Windows** : Utiliser PowerShell ou Git Bash

#### 2.2 Se connecter

```bash
# Supprimer l'ancienne empreinte SSH (évite les erreurs)
ssh-keygen -R 51.254.102.133

# Se connecter avec le mot de passe reçu par email
ssh root@51.254.102.133
```

**Prompt pour le mot de passe :**
```
root@51.254.102.133's password:
```

**→ Taper le mot de passe reçu par email** (rien ne s'affiche quand tu tapes, c'est normal)

**✅ Si connexion réussie, tu vois :**
```
rescue:~#
```

---

### Étape 3 : Déploiement Certbot (5 minutes)

#### 3.1 Monter le disque principal

```bash
# Créer le point de montage
mkdir -p /mnt/vps

# Monter la partition principale (sur OVH VPS c'est /dev/sdb1)
mount /dev/sdb1 /mnt/vps

# Vérifier que le montage a fonctionné
ls -la /mnt/vps/opt/staka-livres/
```

**✅ Tu dois voir :** backend, frontend, docs, scripts, docker-compose.prod.yml...

**❌ Si erreur "mount: ... already mounted"** :
```bash
# Le disque est déjà monté, pas grave
ls /mnt/opt/staka-livres/
# Ou
ls /mnt/vps/opt/staka-livres/
```

#### 3.2 Aller dans le projet

```bash
# Si le disque est monté sur /mnt/vps
cd /mnt/vps/opt/staka-livres

# OU si le disque est monté directement sur /mnt
cd /mnt/opt/staka-livres

# Vérifier qu'on est au bon endroit
pwd
ls -la
```

**✅ Tu dois voir :** docker-compose.prod.yml, backend/, frontend/, etc.

#### 3.3 Récupérer les modifications GitHub

```bash
# Récupérer les dernières modifications
git pull origin main

# Tu devrais voir :
# - docker-compose.prod.yml (service certbot ajouté)
# - scripts/certbot-renew.sh (nouveau)
# - docs/SSL_AUTO_RENEWAL_SETUP.md (nouveau)
```

**✅ Vérifier que les fichiers sont bien là :**
```bash
ls -l docker-compose.prod.yml
ls -l scripts/certbot-renew.sh
```

#### 3.4 Créer les dossiers et permissions

```bash
# Si disque monté sur /mnt/vps
mkdir -p /mnt/vps/opt/staka/certbot-logs
chmod 755 /mnt/vps/opt/staka/certbot-logs
chmod +x scripts/certbot-renew.sh

# OU si disque monté sur /mnt
mkdir -p /mnt/opt/staka/certbot-logs
chmod 755 /mnt/opt/staka/certbot-logs
chmod +x scripts/certbot-renew.sh
```

**✅ Vérifier :**
```bash
# Si /mnt/vps
ls -la /mnt/vps/opt/staka/certbot-logs/

# Si /mnt
ls -la /mnt/opt/staka/certbot-logs/

# Vérifier le script
ls -l scripts/certbot-renew.sh
# Doit afficher : -rwxr-xr-x (le x indique qu'il est exécutable)
```

#### 3.5 (Optionnel) Activer SSH pour la prochaine fois

**Si tu veux pouvoir te connecter en SSH normalement après :**

```bash
# Chrooter dans le système principal
chroot /mnt/vps  # ou chroot /mnt selon le montage

# Activer SSH
systemctl enable sshd
systemctl start sshd

# Autoriser l'authentification root
sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Vérifier la config
grep -E "PermitRootLogin|PasswordAuthentication" /etc/ssh/sshd_config

# Sortir du chroot
exit
```

---

### Étape 4 : Sortir du Mode Rescue (2 minutes)

#### 4.1 Déconnecter SSH

```bash
# Dans le terminal Mode Rescue, taper :
exit
```

#### 4.2 Redémarrer en Mode Normal via OVH Manager

1. **Retourner sur OVH Manager**
2. Aller sur ton VPS (51.254.102.133)
3. Section **"Boot"** ou **"Mode de démarrage"**
4. Cliquer sur **"..."** → **"Modifier"**
5. Sélectionner **"Booter sur le disque dur"** (boot normal)
6. Cliquer sur **"Redémarrer"**
7. Confirmer

#### 4.3 Attendre le redémarrage

- **Délai** : 2-3 minutes
- Le VPS redémarre avec le nouveau service Certbot

---

## ✅ Vérifications post-déploiement

### Vérification 1 : Site accessible (Immédiat)

```bash
# Depuis ton Mac
curl -I https://livrestaka.fr
```

**✅ Tu dois voir :**
```
HTTP/2 200
server: nginx
```

### Vérification 2 : Services Docker actifs (Après 5 minutes)

**Se reconnecter au VPS :**

```bash
# Si tu as activé SSH à l'étape 3.5
ssh root@51.254.102.133
# Mot de passe : staka2020

# Sinon, utiliser Mode Rescue à nouveau
```

**Vérifier les services :**

```bash
cd /opt/staka-livres

# Voir tous les services
docker compose ps

# Vérifier spécifiquement Certbot
docker ps | grep certbot
```

**✅ Tu dois voir :**
```
staka_certbot_prod   Up   (healthy)
```

### Vérification 3 : Certificat SSL actuel

```bash
docker exec staka_certbot_prod certbot certificates
```

**✅ Tu dois voir :**
```
Certificate Name: livrestaka.fr
  Domains: livrestaka.fr www.livrestaka.fr
  Expiry Date: 2026-02-08 (VALID: XX days)
```

### Vérification 4 : Test de renouvellement automatique

```bash
# Test dry-run (simulation sans renouvellement réel)
docker exec staka_certbot_prod certbot renew --dry-run
```

**✅ Tu dois voir à la fin :**
```
Congratulations, all simulated renewals succeeded
```

### Vérification 5 : Logs Certbot

```bash
# Logs du conteneur
docker logs staka_certbot_prod

# Logs détaillés
cat /opt/staka/certbot-logs/letsencrypt.log
```

**✅ Pas d'erreurs critiques**

---

## 📧 Communication client après intervention

### Email de confirmation au client

```
Objet : Maintenance terminée - SSL automatisé avec succès

Bonjour,

La maintenance technique de votre plateforme Staka Livres
est terminée avec succès ! ✅

🎉 Nouvelle fonctionnalité activée :

Votre certificat SSL se renouvelle désormais automatiquement
tous les 90 jours. Vous n'aurez plus jamais à vous en soucier.

Comment ça fonctionne :
✅ Vérification automatique 2 fois par jour
✅ Renouvellement 30 jours avant expiration
✅ Application automatique sans interruption
✅ Historique et logs de tous les renouvellements

Prochaines dates importantes :
📅 Certificat actuel expire : 8 février 2026
🔄 Renouvellement automatique : À partir du 9 janvier 2026

Votre site est plus sécurisé et nécessite encore moins de maintenance !

N'hésitez pas si vous avez des questions.

Cordialement,
Christophe
```

---

## 🆘 Troubleshooting

### Problème 1 : Disque non monté sur /dev/sdb1

**Symptôme :** `mount: /dev/sdb1: can't find in /etc/fstab`

**Solution :**
```bash
# Lister les disques disponibles
fdisk -l

# Identifier la partition principale (généralement la plus grosse)
# Essayer avec /dev/sda1, /dev/sda2, etc.
mount /dev/sda1 /mnt/vps
```

### Problème 2 : Git pull échoue

**Symptôme :** `error: Your local changes would be overwritten`

**Solution :**
```bash
# Sauvegarder les modifications locales
git stash

# Tirer les modifications
git pull origin main

# Réappliquer les modifications locales si nécessaire
git stash pop
```

### Problème 3 : Le conteneur Certbot ne démarre pas

**Diagnostic :**
```bash
docker logs staka_certbot_prod
```

**Solutions possibles :**
```bash
# Recréer le conteneur
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d certbot

# Vérifier les volumes
ls -la /opt/staka/certs/
ls -la /opt/staka/certbot-logs/
```

### Problème 4 : SSH ne fonctionne toujours pas après activation

**Solution :**
```bash
# Retourner en Mode Rescue
# Chrooter
chroot /mnt/vps

# Vérifier le statut SSH
systemctl status sshd

# Démarrer si arrêté
systemctl start sshd

# Vérifier le firewall
ufw status
ufw allow 22/tcp
```

### Problème 5 : Site inaccessible après redémarrage

**Diagnostic :**
```bash
# Vérifier les conteneurs
docker compose ps

# Vérifier nginx externe (hors Docker)
systemctl status nginx

# Relancer si nécessaire
systemctl restart nginx
```

---

## 📊 Checklist Finale

**Avant de démarrer :**
- [ ] Client informé de la maintenance
- [ ] Accès OVH Manager vérifié
- [ ] Email accessible pour recevoir mot de passe
- [ ] 15-20 minutes disponibles

**Pendant l'intervention :**
- [ ] Mode Rescue activé
- [ ] Email OVH reçu avec mot de passe
- [ ] Connexion SSH Mode Rescue OK
- [ ] Disque principal monté
- [ ] Git pull effectué
- [ ] Dossiers créés et permissions OK
- [ ] (Optionnel) SSH activé pour le futur
- [ ] Mode normal restauré

**Après l'intervention :**
- [ ] Site accessible (curl -I https://livrestaka.fr)
- [ ] Service Certbot actif (docker ps | grep certbot)
- [ ] Certificat SSL valide (certbot certificates)
- [ ] Test dry-run réussi (certbot renew --dry-run)
- [ ] Logs sans erreurs
- [ ] Client informé de la réussite

---

## 📅 Calendrier

| Date | Action | Statut |
|------|--------|--------|
| **05 Jan 2026** | Documentation créée | ✅ Fait |
| **~15 Jan 2026** | Informer le client (3-5j avant) | ⏳ À faire |
| **~20 Jan 2026** | Exécuter la maintenance | ⏳ À faire |
| **~20 Jan 2026** | Confirmer au client | ⏳ À faire |
| **09 Jan 2026** | Premier renouvellement auto (prévu) | 🤖 Automatique |

---

## 🔗 Ressources

### Documentation projet

- **Guide technique SSL** : `docs/SSL_AUTO_RENEWAL_SETUP.md`
- **Guide manuel SSL** : `docs/SSL_RENEWAL_GUIDE.md`
- **Guide client** : `docs/CLIENT_ACCESS_GUIDE.md`
- **Workflow Docker** : `docs/docker-workflow.md`

### Liens externes

- **OVH Manager** : https://www.ovh.com/manager/
- **Guide Mode Rescue OVH** : https://help.ovhcloud.com/csm/fr-vps-rescue?id=kb_article_view
- **Certbot Documentation** : https://certbot.eff.org/docs/

---

## ✅ Résumé

**Ce qui va changer :**
- ✅ SSL 100% automatisé (plus de renouvellement manuel)
- ✅ Vérification 2x par jour
- ✅ Renouvellement 30 jours avant expiration
- ✅ Rechargement nginx automatique
- ✅ Logs et historique complets

**Ce qui reste pareil :**
- ✅ Site toujours accessible
- ✅ Performance identique
- ✅ Aucun impact utilisateur

**Durée totale estimation :** 15-20 minutes
**Complexité :** Moyenne
**Risque :** Faible (procédure testée et documentée)

---

**🎯 Cette documentation sera valable jusqu'au prochain renouvellement automatique prévu le 09 janvier 2026.**

**📌 Important :** Garder ce document accessible pour référence future ou formation d'un collaborateur.

---

*Document créé le 05 janvier 2026 - Christophe Mostefaoui*
*Projet : Staka-Livres - livrestaka.fr*
*Version : 1.0*
