# 🔐 Configuration Renouvellement SSL Automatique - Staka Livres

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Automation](https://img.shields.io/badge/Automation-100%25-blue)
![Certbot](https://img.shields.io/badge/Certbot-Latest-orange)

Guide complet pour configurer le renouvellement automatique des certificats SSL Let's Encrypt avec Certbot en conteneur Docker.

**📅 Date de création** : 05 Janvier 2026
**🌐 Site** : [https://livrestaka.fr](https://livrestaka.fr/)
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

---

## 🎯 Objectif

**Automatiser complètement le renouvellement SSL** pour que les certificats se renouvellent automatiquement tous les 90 jours **sans intervention humaine**.

### ✅ Avantages

- ✅ **Zéro maintenance** : Plus besoin de mode rescue ni d'intervention manuelle
- ✅ **Haute disponibilité** : Pas d'expiration de certificat surprise
- ✅ **Logging automatique** : Historique complet des renouvellements
- ✅ **Rechargement nginx** : Application automatique des nouveaux certificats
- ✅ **Notifications** : Logs consultables en temps réel
- ✅ **Testable** : Possibilité de forcer un renouvellement de test

---

## 🏗️ Architecture de la Solution

### Composants

```
┌─────────────────────────────────────────────────────────┐
│                    VPS Production                        │
│                                                          │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │  Nginx Externe │◄────────│  Certbot Docker  │       │
│  │  (Port 443)    │         │  (Auto-renewal)  │       │
│  └────────────────┘         └──────────────────┘       │
│         │                            │                  │
│         │                            │                  │
│  ┌──────▼──────────┐        ┌───────▼─────────┐       │
│  │  Frontend       │        │  Certificats    │       │
│  │  Container      │        │  Let's Encrypt  │       │
│  │  (Port 8080)    │        │  /opt/staka/    │       │
│  └─────────────────┘        └─────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Fonctionnement

1. **Certbot Container** : Vérifie tous les **12 heures** si les certificats expirent dans moins de 30 jours
2. **Renouvellement automatique** : Si nécessaire, demande de nouveaux certificats à Let's Encrypt
3. **Deploy Hook** : Appelle le script `certbot-renew.sh` après chaque renouvellement réussi
4. **Rechargement nginx** : Le script recharge nginx pour appliquer les nouveaux certificats
5. **Logging** : Tout est logué dans `/opt/staka/certbot-logs/`

---

## 📦 Installation sur le VPS

### Étape 1 : Connexion au VPS

```bash
# Depuis votre ordinateur
ssh root@51.254.102.133
# Mot de passe : staka2020

# Aller dans le dossier du projet
cd /opt/staka-livres
```

### Étape 2 : Vérifier les nouveaux fichiers

```bash
# Vérifier que les nouveaux fichiers sont présents
ls -l docker-compose.prod.yml
ls -l scripts/certbot-renew.sh

# Si les fichiers ne sont pas à jour, les récupérer depuis Git
git pull origin main
```

### Étape 3 : Créer les dossiers nécessaires

```bash
# Créer le dossier pour les logs certbot
mkdir -p /opt/staka/certbot-logs

# Vérifier que le dossier des certificats existe
ls -la /opt/staka/certs/

# Donner les bonnes permissions
chmod 755 /opt/staka/certbot-logs
chmod +x scripts/certbot-renew.sh
```

### Étape 4 : Déployer la nouvelle configuration

```bash
# Stopper les services actuels
docker compose -f docker-compose.prod.yml down

# Démarrer avec le nouveau service certbot
docker compose -f docker-compose.prod.yml up -d

# Vérifier que tous les services tournent
docker compose ps
```

**Résultat attendu** :
```
NAME                    STATUS          PORTS
staka_backend_prod      Up             0.0.0.0:3000->3000/tcp
staka_certbot_prod      Up
staka_db_prod           Up             0.0.0.0:3306->3306/tcp
staka_frontend_prod     Up             0.0.0.0:8080->80/tcp
```

### Étape 5 : Vérification de l'installation

```bash
# Vérifier les logs du conteneur certbot
docker logs staka_certbot_prod

# Vérifier que certbot voit les certificats actuels
docker exec staka_certbot_prod certbot certificates

# Résultat attendu :
# Certificate Name: livrestaka.fr
#   Domains: livrestaka.fr www.livrestaka.fr
#   Expiry Date: 2026-02-08 08:09:32+00:00 (VALID: 33 days)
```

---

## 🧪 Test du Renouvellement

### Test à blanc (Dry Run)

```bash
# Lancer un test de renouvellement sans vraiment renouveler
docker exec staka_certbot_prod certbot renew --dry-run

# Si tout est OK, vous verrez :
# Congratulations, all simulated renewals succeeded
```

### Forcer un renouvellement (Production)

```bash
# ⚠️ À utiliser uniquement si nécessaire
docker exec staka_certbot_prod certbot renew --force-renewal

# Vérifier que nginx a été rechargé
docker logs staka_certbot_prod | tail -20
docker logs staka_frontend_prod | tail -20
```

### Vérifier les logs de renouvellement

```bash
# Logs du conteneur certbot
docker logs staka_certbot_prod

# Logs certbot détaillés
cat /opt/staka/certbot-logs/letsencrypt.log

# Logs du script de renouvellement
cat /opt/staka/certbot-logs/renew.log
```

---

## 📊 Monitoring et Maintenance

### Commandes de surveillance

```bash
# État du service certbot
docker ps | grep certbot

# Logs en temps réel
docker logs -f staka_certbot_prod

# Vérifier la date d'expiration actuelle
docker exec staka_certbot_prod openssl x509 -enddate -noout -in /etc/letsencrypt/live/livrestaka.fr/cert.pem

# Historique des renouvellements
cat /opt/staka/certbot-logs/renew.log
```

### Calendrier de vérification recommandé

| Fréquence | Action | Commande |
|-----------|--------|----------|
| **Mensuel** | Vérifier que certbot tourne | `docker ps \| grep certbot` |
| **Mensuel** | Voir date expiration | `docker exec staka_certbot_prod certbot certificates` |
| **Trimestriel** | Test dry-run | `docker exec staka_certbot_prod certbot renew --dry-run` |
| **Après renouvellement** | Vérifier logs | `cat /opt/staka/certbot-logs/renew.log` |

---

## 🔧 Troubleshooting

### Problème : Le conteneur certbot ne démarre pas

**Solution** :
```bash
# Vérifier les logs d'erreur
docker logs staka_certbot_prod

# Vérifier que les volumes existent
ls -la /opt/staka/certs/
ls -la /opt/staka/certbot-logs/

# Recréer le conteneur
docker compose -f docker-compose.prod.yml up -d certbot
```

### Problème : Le renouvellement échoue

**Solution** :
```bash
# Vérifier les logs détaillés
cat /opt/staka/certbot-logs/letsencrypt.log

# Causes fréquentes :
# - Port 80/443 non accessible (vérifier nginx externe)
# - Rate limit Let's Encrypt atteint (max 5 renouvellements/semaine)
# - Permissions insuffisantes sur /opt/staka/certs/

# Test de connexion Let's Encrypt
curl -I http://livrestaka.fr/.well-known/acme-challenge/test
```

### Problème : Nginx ne recharge pas après renouvellement

**Solution** :
```bash
# Vérifier que le script est exécutable
ls -l /opt/staka-livres/scripts/certbot-renew.sh

# Tester manuellement le script
docker exec staka_certbot_prod /usr/local/bin/certbot-renew.sh

# Vérifier que Docker socket est accessible
docker exec staka_certbot_prod ls -la /var/run/docker.sock

# Recharger manuellement nginx
docker exec staka_frontend_prod nginx -s reload
# Ou redémarrer le conteneur
docker restart staka_frontend_prod
```

### Problème : Certificat expiré malgré l'automatisation

**Solution d'urgence (Mode Rescue)** :
```bash
# Si le certificat expire malgré l'automatisation,
# suivre la procédure de renouvellement manuel dans :
# docs/SSL_RENEWAL_GUIDE.md

# Puis diagnostiquer pourquoi l'automatisation n'a pas fonctionné :
cat /opt/staka/certbot-logs/letsencrypt.log | grep -i error
cat /opt/staka/certbot-logs/renew.log
```

---

## 📅 Timeline du Certificat Actuel

### Dates importantes

- **Émission** : 10 Novembre 2025
- **Expiration** : 8 Février 2026 (90 jours)
- **Renouvellement automatique** : À partir du 9 Janvier 2026 (30 jours avant expiration)

### Vérification manuelle de l'expiration

```bash
# Méthode 1 : Via certbot
docker exec staka_certbot_prod certbot certificates

# Méthode 2 : Via openssl
docker exec staka_certbot_prod openssl x509 -enddate -noout -in /etc/letsencrypt/live/livrestaka.fr/cert.pem

# Méthode 3 : Depuis le navigateur
open https://livrestaka.fr
# → Cliquer sur le cadenas → Voir le certificat
```

---

## 📝 Checklist de Déploiement

**Avant de déployer en production** :

- [ ] Git pull pour récupérer les nouveaux fichiers
- [ ] Vérifier `docker-compose.prod.yml` contient le service `certbot`
- [ ] Vérifier `scripts/certbot-renew.sh` existe et est exécutable
- [ ] Créer `/opt/staka/certbot-logs/` sur le VPS
- [ ] Stopper les services actuels (`docker compose down`)
- [ ] Démarrer avec la nouvelle config (`docker compose up -d`)
- [ ] Vérifier que certbot tourne (`docker ps | grep certbot`)
- [ ] Tester le dry-run (`docker exec staka_certbot_prod certbot renew --dry-run`)
- [ ] Vérifier la date d'expiration actuelle
- [ ] Ajouter un rappel calendrier pour vérification mensuelle

---

## 🎓 Explications Techniques

### Pourquoi toutes les 12 heures ?

Certbot recommande de vérifier **deux fois par jour** car :
- Let's Encrypt peut révoquer des certificats en cas de faille de sécurité
- Plus de tentatives = plus de chances de succès en cas de problème temporaire
- Certbot ne renouvelle que si nécessaire (< 30 jours avant expiration)

### Pourquoi 30 jours avant expiration ?

- **Sécurité** : Marge de 30 jours en cas d'échec des premières tentatives
- **Let's Encrypt** : Les certificats sont valides 90 jours
- **Best Practice** : Renouveler au 2/3 de la durée de vie (60 jours)

### Comment ça marche sans exposer le port 80 ?

Le renouvellement utilise les certificats existants et l'API Let's Encrypt. Le port 80 n'est **pas nécessaire** pour les renouvellements, seulement pour la création initiale.

---

## 🔗 Ressources et Documentation

### Documentation externe

- **Certbot Official** : https://certbot.eff.org/docs/
- **Let's Encrypt** : https://letsencrypt.org/docs/
- **Docker Certbot** : https://hub.docker.com/r/certbot/certbot

### Documentation projet

- **Guide SSL Manuel** : `docs/SSL_RENEWAL_GUIDE.md`
- **Docker Workflow** : `docs/docker-workflow.md`
- **Guide Client** : `docs/CLIENT_ACCESS_GUIDE.md`

---

## ✅ Avantages de cette Solution

| Avant (Manuel) | Après (Automatisé) |
|----------------|-------------------|
| ❌ Mode Rescue tous les 90 jours | ✅ Aucune intervention |
| ❌ Risque d'oubli = site down | ✅ Renouvellement automatique |
| ❌ ~30 min de manipulation | ✅ 0 seconde |
| ❌ SSH requis | ✅ Fonctionne sans SSH |
| ❌ Stress avant expiration | ✅ Tranquillité d'esprit |
| ❌ Pas de logs automatiques | ✅ Historique complet |

---

## 📧 Support

Pour toute question ou problème avec le renouvellement automatique SSL :

**Christophe Mostefaoui**
Développeur Full-Stack

- 🌐 Site web : https://christophe-dev-freelance.fr/
- 📧 Email : contact@christophe-dev-freelance.fr

---

## 📊 Statistiques et Monitoring

### Commandes pratiques pour le client

```bash
# Vérifier que l'automatisation fonctionne (à faire 1x/mois)
ssh root@51.254.102.133 "docker ps | grep certbot && echo '✅ Certbot actif'"

# Voir la date d'expiration (à faire 1x/mois)
ssh root@51.254.102.133 "docker exec staka_certbot_prod certbot certificates"

# Voir l'historique des renouvellements
ssh root@51.254.102.133 "cat /opt/staka/certbot-logs/renew.log"
```

---

**🎉 Votre SSL est maintenant 100% automatisé ! Plus aucune intervention manuelle nécessaire.**

**📌 Rappel** : Vérifiez simplement une fois par mois que le service certbot tourne bien. C'est tout !

---

*Document créé le 05 janvier 2026 - Christophe Mostefaoui*
*Projet : Staka-Livres - livrestaka.fr*
