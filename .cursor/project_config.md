🔖 Projet

Site web de correction de manuscrits – livres.staka.fr

🧠 Rôle du développeur

Christophe Mostefaoui – développeur freelance solo, responsable de l'intégration backend (Node.js) et conformité RGPD du projet.

🎯 Objectifs principaux

Intégrer le front HTML/CSS/JS fourni par le client

Créer un back complet (API REST + Admin + Client sécurisé)

Paiement en ligne via Stripe Checkout (paiement unique)

Espace client sécurisé et conforme RGPD

Interface administrateur simple pour gérer contenu, projets, fichiers, paiements

Déploiement final sur sous-domaine livres.staka.fr avec SSL actif

🛠️ Stack technique

Backend : Node.js + Express.js

ORM : Prisma (MySQL)

Auth : JWT + bcrypt

Websockets : socket.io (messagerie, notifications live)

Paiement : Stripe Checkout (clé client à fournir)

Stockage fichiers : local sécurisé ou S3 (option)

Validation : express-validator ou Zod

Tests : Jest, Supertest (unitaire + intégration)

Logs : audit RGPD + erreurs serveur + supervision

🗃️ Structure recommandée

/cursor ➜ règles IA du projet
/prisma ➜ schema + migrations Prisma
/src
/controllers ➜ logique métier
/routes ➜ définitions Express
/models ➜ interfaces/types + services Prisma
/middlewares ➜ validation, auth, logs
/sockets ➜ logique temps réel
/utils ➜ helpers divers
/views ➜ si HTML côté admin
/tests ➜ Jest + Supertest

✅ RGPD

Suppression complète de compte = suppression réelle des fichiers et données

Export JSON ou ZIP des données personnelles

Consentement explicite à l'inscription

Logging de toute action critique (paiement, suppression, création)

📦 Modules fonctionnels

Authentification + gestion de compte (client/admin)

Création + suivi de projets de correction

Upload + téléchargement fichiers

Paiement sécurisé via Stripe Checkout

Génération de factures PDF

Notifications (mail, websocket)

Interface admin (dashboard, édition de contenu, gestion client/factures)

📆 Développement

Sprint 1 : Auth, structure du projet, base Prisma

Sprint 2 : Modules projet + fichiers + Stripe

Sprint 3 : Espace client + admin + RGPD

Sprint 4 : Tests + déploiement final

🔐 Sécurité

HTTPS obligatoire

JWT expirant (30 min)

Filtrage/validation des entrées

Rate limit sur endpoints sensibles

Logs et backups journaliers
