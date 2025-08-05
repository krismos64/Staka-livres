# 🎭 Guide Mode Démonstration - Staka Livres

![Production](https://img.shields.io/badge/Status-Production%20Deployed-brightgreen)
![Live](https://img.shields.io/badge/Live-livrestaka.fr-blue)
![Demo](https://img.shields.io/badge/Demo-Fully%20Functional-purple)
![Backend](https://img.shields.io/badge/Backend-Operational-green)

**✨ Version 5 Août 2025 - Production déployée sur livrestaka.fr**  
**🌐 Production URL** : [livrestaka.fr](https://livrestaka.fr/)  
**👨‍💻 Développeur** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/)

> **Guide technique complet** pour le système de mode démonstration qui permet aux visiteurs et prospects de tester l'interface admin avec des **vraies données fictives** générées dynamiquement en base de données **déployé en production**.

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Activation du mode démo](#activation-du-mode-démo)
4. [Endpoints API backend](#endpoints-api-backend)
5. [Interface utilisateur](#interface-utilisateur)
6. [Système de restrictions](#système-de-restrictions)
7. [Gestion des données](#gestion-des-données)
8. [Hooks et composants](#hooks-et-composants)
9. [Tests et validation](#tests-et-validation)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Le mode démonstration de Staka Livres permet aux visiteurs, prospects et clients potentiels de tester l'interface d'administration avec des **vraies données fictives générées dynamiquement** en base de données, sans risque pour les données de production. **Déployé et opérationnel sur [livrestaka.fr](https://livrestaka.fr/)**.

### ✅ Fonctionnalités principales

- **Activation via URL** : Paramètres GET pour contrôle total (`?demo=true&readonly=true&duration=30`)
- **Session timer intelligent** : Durée configurable avec notifications automatiques (5min, 1min, expiration)
- **Vraies données fictives** : Génération en base de données avec Prisma (utilisateurs, commandes, messages)
- **Restrictions d'actions** : Mode lecture seule ou actions limitées selon configuration
- **Bannière interactive** : Contrôles temps réel (timer, extension, reset, rafraîchissement)
- **Endpoints backend complets** : API REST sécurisée pour gestion des données de démo
- **Système de notifications** : Toast intégrés pour feedback utilisateur
- **Sécurité garantie** : Utilisateurs @demo.staka.fr isolés, aucun impact production

### 🔧 Technologies utilisées

- **Frontend** : React 18, TypeScript 5, Context API
- **Backend** : Node.js, Express, Prisma, TypeScript
- **Base de données** : MySQL avec utilisateurs @demo.staka.fr
- **Stockage fichiers** : Stockage local unifié (AWS S3 supprimé)
- **Notifications** : EventBus centralisé avec 22 templates email
- **State Management** : React Hooks, localStorage persistence
- **UI/UX** : Tailwind CSS 3, animations, responsive design
- **Timer** : JavaScript intervals avec gestion mémoire
- **API** : Endpoints RESTful sécurisés (admin uniquement)
- **Sécurité** : HOC et hooks pour restrictions d'actions

---

## 🏗️ Architecture technique

### 📁 Structure des fichiers backend

```
backend/src/
├── controllers/
│   └── demoController.ts               # Contrôleur principal avec logique complète
├── routes/
│   └── admin/
│       └── demo.ts                     # Routes sécurisées admin
├── services/
│   └── demoService.ts                  # Service de génération (optionnel)
├── deprecated-aws/                     # Ancien code AWS S3 (non utilisé)
├── uploads/                            # Stockage local des fichiers
└── routes/
    └── admin.ts                        # Intégration routes /api/admin/demo/*
```

### 📁 Structure des fichiers frontend

```
frontend/src/
├── components/
│   └── admin/
│       └── DemoModeProvider.tsx        # Provider principal + bannière + HOC
├── utils/
│   ├── adminAPI.ts                     # API refresh/reset données démo
│   ├── mockData.ts                     # Génération données fictives (fallback)
│   └── testUtils.ts                    # Utilitaires tests démo
├── hooks/
│   └── useLocalUpload.ts               # Hook upload local (AWS S3 supprimé)
└── deprecated-aws/                     # Ancien code AWS S3 (non utilisé)
```

### 🗄️ Architecture backend-frontend

```typescript
// Backend : Génération vraies données
POST /api/admin/demo/refresh  → Génère utilisateurs @demo.staka.fr + commandes + messages
POST /api/admin/demo/reset    → Remet à l'état initial (moins de données)  
GET  /api/admin/demo/status   → Compte les données présentes en base

// Frontend : Interface et restrictions
DemoModeProvider → Bannière + Timer + Actions
useDemoMode() → Restrictions + État global
withDemoRestriction(Component) → HOC protection composants
```

### 🔄 Flux de données complet

```mermaid
graph TD
    A[URL ?demo=true] --> B[DemoModeProvider activation]
    B --> C[Bannière affichée]
    C --> D[Clic "Rafraîchir"]
    D --> E[POST /api/admin/demo/refresh]
    E --> F[Génération en base MySQL]
    F --> G[6 users @demo.staka.fr]
    G --> H[10 commandes fictives]
    H --> I[8 messages de démo]
    I --> J[Interface mise à jour]
    J --> K[Données visibles admin]
```

---

## 🚀 Activation du mode démo

### 📡 Via URL (méthode recommandée)

```bash
# Mode démo basique (30 minutes)
http://localhost:3000/admin?demo=true

# Mode lecture seule (60 minutes)  
http://localhost:3000/admin?demo=true&readonly=true&duration=60

# Mode complet avec durée personnalisée (15 minutes)
http://localhost:3000/admin?demo=true&duration=15

# Production
https://livrestaka.fr/admin?demo=true&duration=45
```

### 🎛️ Paramètres URL supportés

| Paramètre | Type    | Défaut | Description                           |
|-----------|---------|--------|---------------------------------------|
| `demo`    | boolean | false  | Active le mode démonstration         |
| `readonly`| boolean | false  | Mode lecture seule strict             |
| `duration`| number  | 30     | Durée session en minutes              |
| `banner`  | boolean | true   | Affichage bannière de contrôle        |

### 💻 Activation programmatique

```typescript
// Dans un composant React
import { useDemoMode } from '../components/admin/DemoModeProvider';

const MyComponent = () => {
  const { enableDemo, disableDemo } = useDemoMode();
  
  const startDemo = () => {
    enableDemo({
      readOnly: true,
      sessionDuration: 45,
      restrictedFeatures: ['delete', 'bulk-delete']
    });
  };
  
  return (
    <button onClick={startDemo}>
      🎭 Démarrer démonstration
    </button>
  );
};
```

---

## 🔌 Endpoints API backend

### 🛡️ Sécurité

Tous les endpoints nécessitent :
- **Authentification JWT** : Token valide dans header `Authorization: Bearer <token>`
- **Droits administrateur** : `req.user.role === "ADMIN"`
- **Middleware** : `requireRole(Role.ADMIN)` appliqué automatiquement

### 📮 POST /api/admin/demo/refresh

**Rafraîchit les données de démonstration (supprime + régénère)**

```bash
curl -X POST http://localhost:3000/api/admin/demo/refresh \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Données de démonstration rafraîchies avec succès",
  "data": {
    "supprimees": {
      "users": 6,
      "commandes": 10, 
      "factures": 0,
      "messages": 8,
      "notifications": 0
    },
    "creees": {
      "users": 6,
      "commandes": 10,
      "factures": 0, 
      "messages": 8,
      "notifications": 0
    }
  }
}
```

### 🔄 POST /api/admin/demo/reset

**Remet les données à l'état initial (dataset plus petit)**

```bash
curl -X POST http://localhost:3000/api/admin/demo/reset \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Données de démonstration réinitialisées à l'état initial",
  "data": {
    "supprimees": {
      "users": 6,
      "commandes": 10,
      "factures": 0,
      "messages": 8, 
      "notifications": 0
    },
    "initiales": {
      "users": 6,
      "commandes": 6,
      "factures": 0,
      "messages": 6,
      "notifications": 0
    }
  }
}
```

### 📊 GET /api/admin/demo/status

**Retourne le statut actuel des données de démonstration**

```bash
curl -X GET http://localhost:3000/api/admin/demo/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "data": {
    "demoDataExists": true,
    "counts": {
      "users": 6,
      "commandes": 10,
      "factures": 0,
      "messages": 8,
      "notifications": 0
    },
    "lastUpdate": "2025-07-28T05:33:31.780Z"
  }
}
```

### ❌ Réponses d'erreur

```json
// 403 - Pas admin
{
  "success": false,
  "error": "Accès refusé - Administrateurs uniquement"
}

// 500 - Erreur serveur  
{
  "success": false,
  "error": "Erreur lors du rafraîchissement des données de démonstration",
  "details": "Détails technique en mode développement"
}
```

---

## 🖥️ Interface utilisateur

### 🎨 Bannière de démonstration

La bannière s'affiche automatiquement en haut de l'interface admin :

```typescript
// Composant DemoBanner intégré
export const DemoBanner: React.FC = () => {
  const { 
    isDemo, demoConfig, remainingTime, 
    disableDemo, extendSession 
  } = useDemoMode();

  // Bannière gradient avec animations
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3">
      {/* Indicateur mode actif + timer */}
      <div className="flex items-center justify-between">
        <span>🎭 MODE DÉMONSTRATION</span> 
        <span>⏰ {formatTime(remainingTime)}</span>
      </div>
      
      {/* Actions disponibles */}
      <div className="flex space-x-2">
        <button onClick={handleRefreshData}>🔄 Rafraîchir</button>
        <button onClick={handleResetData}>🔄 Reset</button>
        <button onClick={() => extendSession(10)}>⏰ +10min</button>
        <button onClick={disableDemo}>❌ Quitter</button>
      </div>
    </div>
  );
};
```

### 🎯 Indicateurs visuels

- **Badge animé** : Point clignotant indiquant le mode actif
- **Timer coloré** : Vert → Jaune → Rouge selon temps restant
- **Barre de progression** : Visualisation temps restant en bas de bannière
- **Toast notifications** : Alertes à 5min, 1min et expiration
- **Badges de restriction** : "LECTURE SEULE" si readonly activé

### 🎮 Actions utilisateur

| Action           | Description                               | Endpoint API                    | Disponibilité     |
|------------------|-------------------------------------------|---------------------------------|-------------------|
| **Rafraîchir**   | Génère nouvelles données fictives        | `POST /api/admin/demo/refresh`  | Toujours          |
| **Reset**        | Remet les données à l'état initial       | `POST /api/admin/demo/reset`    | Toujours          |
| **+10min**       | Prolonge la session de 10 minutes        | Frontend uniquement             | Si timer actif    |
| **Quitter**      | Désactive le mode et nettoie l'URL       | Frontend uniquement             | Toujours          |

---

## 🔒 Système de restrictions

### 🛡️ Niveaux de restriction

#### 1. Mode lecture seule (`readOnly: true`)
```typescript
// Seules les actions allowedActions sont autorisées
const allowedActions = ["read", "search", "filter", "export", "preview"];

// Vérification automatique
const isActionAllowed = (action: string): boolean => {
  if (demoConfig.readOnly) {
    return allowedActions.includes(action);
  }
  return true;
};
```

#### 2. Mode restreint (`readOnly: false`)
```typescript
// Les restrictedFeatures sont interdites
const restrictedFeatures = ["delete", "bulk-delete", "user-deactivate"];

// Vérification par exclusion
const isFeatureRestricted = (feature: string): boolean => {
  return restrictedFeatures.includes(feature);
};
```

### 🚫 Actions par défaut restreintes

```typescript
// Actions dangereuses toujours interdites en démo
const ALWAYS_RESTRICTED = [
  'delete',           // Suppression unitaire
  'bulk-delete',      // Suppression en masse  
  'user-deactivate',  // Désactivation utilisateurs
  'database-reset',   // Reset base de données
  'backup-restore',   // Restauration sauvegarde
  'email-broadcast'   // Envoi email en masse
];
```

### ⚡ Protection temps réel

```typescript
// HOC pour protéger les composants
export const withDemoRestriction = (
  Component: React.ComponentType,
  action: string
) => {
  return (props) => {
    const { isActionAllowed } = useDemoMode();
    
    if (!isActionAllowed(action)) {
      return <RestrictedActionFallback action={action} />;
    }
    
    return <Component {...props} />;
  };
};

// Usage
const DeleteButton = withDemoRestriction(
  OriginalDeleteButton, 
  'delete'
);
```

---

## 💾 Gestion des données

### 🎲 Génération de vraies données fictives

```typescript
// Données générées en base de données MySQL
const DEMO_USERS_DATA = [
  { prenom: "Marie", nom: "Dubois", email: "marie.dubois@demo.staka.fr" },
  { prenom: "Pierre", nom: "Martin", email: "pierre.martin@demo.staka.fr" },
  { prenom: "Sophie", nom: "Laurent", email: "sophie.laurent@demo.staka.fr" },
  { prenom: "Jean", nom: "Dupont", email: "jean.dupont@demo.staka.fr" },
  { prenom: "Anne", nom: "Moreau", email: "anne.moreau@demo.staka.fr" },
  { prenom: "François", nom: "Leclerc", email: "francois.leclerc@demo.staka.fr" },
];

const DEMO_BOOK_TITLES = [
  "Les Mystères de la Forêt Enchantée",
  "Voyage au Cœur de l'Imaginaire", 
  "Mémoires d'un Entrepreneur",
  "Guide Pratique du Jardinage Bio",
  "L'Art de la Négociation",
  "Histoire de France Moderne",
  "Recettes de Grand-Mère",
  "Philosophie et Modernité",
];
```

### 📊 Types de données générées

- **6 utilisateurs fictifs** : Profils complets avec @demo.staka.fr, mots de passe hash, statuts actifs/inactifs
- **10 commandes réalistes** : Tous statuts (EN_ATTENTE, EN_COURS, TERMINÉ, ANNULÉ), prix variables, dates échelonnées
- **8 messages démo** : Conversations avec admin, sujets client service réalistes
- **Fichiers stockés localement** : Stockage unifié dans /backend/uploads/ (AWS S3 supprimé)
- **Notifications centralisées** : EventBus avec emails automatiques via 22 templates
- **0 factures** : À implémenter selon besoins

### 🔄 Workflow de rafraîchissement

1. **Clic "Rafraîchir"** → Appel API `POST /api/admin/demo/refresh`
2. **Nettoyage backend** → Suppression utilisateurs @demo.staka.fr + dépendances
3. **Génération backend** → Nouvelles données aléatoires avec Prisma
4. **Notification success** → Toast confirmation avec compteurs
5. **Rechargement manuel** → Frontend inchangé, données mises à jour visibles
6. **Conservation session** → Mode démo maintenu

### 🗃️ Isolation des données

```sql
-- Utilisateurs de démonstration isolés
SELECT * FROM users WHERE email LIKE '%@demo.staka.fr';

-- Commandes des utilisateurs de démo uniquement  
SELECT c.* FROM commandes c 
JOIN users u ON c.userId = u.id 
WHERE u.email LIKE '%@demo.staka.fr';

-- Messages de démonstration avec préfixe
SELECT * FROM messages WHERE conversationId LIKE 'demo-conv-%';
```

---

## 🎣 Hooks et composants

### 🪝 Hook principal `useDemoMode`

```typescript
const {
  // État
  isDemo,              // boolean - Mode actif
  demoConfig,          // Config actuelle
  remainingTime,       // number - Minutes restantes
  
  // Actions
  enableDemo,          // (config?) => void
  disableDemo,         // () => void
  extendSession,       // (minutes: number) => void
  
  // Vérifications
  isActionAllowed,     // (action: string) => boolean
  isFeatureRestricted, // (feature: string) => boolean
  getRemainingTime,    // () => number
} = useDemoMode();
```

### 🎯 Hook d'action conditionnelle

```typescript
const { executeAction } = useDemoAction();

// Exécution sécurisée d'une action
const handleDelete = () => {
  executeAction(
    'delete',
    () => performDelete(),
    "Suppression interdite en mode démonstration"
  );
};
```

### 🧩 HOC de protection

```typescript
// Composant protégé qui se cache si action interdite
const ProtectedDeleteButton = withDemoRestriction(
  DeleteButton,
  'delete',
  () => <span className="text-gray-400">Action restreinte</span>
);

// Usage dans JSX
<ProtectedDeleteButton onClick={handleDelete} />
```

### 🎨 Composants utilitaires

```typescript
// Badge de restriction
const RestrictionBadge: React.FC<{feature: string}> = ({feature}) => {
  const { isFeatureRestricted } = useDemoMode();
  
  if (!isFeatureRestricted(feature)) return null;
  
  return (
    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
      ⚠️ Restreint en démo
    </span>
  );
};
```

---

## 🧪 Tests et validation

### 🔬 Test complet mode démo

```bash
# 1. Activer mode démo via URL
http://localhost:3000/admin?demo=true&duration=5

# 2. Se connecter avec admin@staka-editions.com / admin123
# → Bannière violette avec timer 5min visible

# 3. Cliquer "Rafraîchir" dans la bannière
# → Toast "Données rafraîchies", nouvelles données générées

# 4. Vérifier données fictives dans interface
# → Utilisateurs @demo.staka.fr visibles
# → Commandes "Les Mystères de la Forêt..." visibles
# → Messages de Marie Dubois, Pierre Martin visibles

# 5. Tester action autorisée (lecture)
# → Navigation, recherche, filtres fonctionnent

# 6. Tester action restreinte (suppression)
# → Boutons masqués ou toast d'avertissement

# 7. Cliquer "Reset" dans la bannière  
# → Données remises à l'état initial (moins nombreuses)

# 8. Attendre notification 1min
# → Toast "Il vous reste 1 minute"

# 9. Vérifier expiration automatique
# → Mode désactivé, URL nettoyée
```

### 📋 Checklist de validation

- [ ] Activation via URL fonctionne
- [ ] Connexion admin réussie
- [ ] Bannière s'affiche correctement
- [ ] Timer décompte et change de couleur
- [ ] **Bouton "Rafraîchir" génère vraies données**
- [ ] **Utilisateurs @demo.staka.fr visibles dans interface**
- [ ] **Commandes fictives affichées correctement**
- [ ] **Messages de démo dans messagerie**
- [ ] Actions restreintes bloquées
- [ ] Notifications aux bons moments
- [ ] **Bouton "Reset" fonctionne**
- [ ] Extension de session fonctionne
- [ ] Expiration automatique nettoie tout
- [ ] Désactivation manuelle nettoie URL

### 🧩 Tests API backend

```bash
# Test complet des endpoints avec token admin valide

# 1. Obtenir token admin
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@staka-editions.com", "password": "admin123"}' \
  | jq -r '.token')

# 2. Vérifier statut initial
curl -X GET http://localhost:3000/api/admin/demo/status \
  -H "Authorization: Bearer $TOKEN"

# 3. Générer données
curl -X POST http://localhost:3000/api/admin/demo/refresh \
  -H "Authorization: Bearer $TOKEN"

# 4. Vérifier données créées
curl -X GET http://localhost:3000/api/admin/demo/status \
  -H "Authorization: Bearer $TOKEN"

# 5. Reset à l'état initial
curl -X POST http://localhost:3000/api/admin/demo/reset \
  -H "Authorization: Bearer $TOKEN"

# 6. Vérifier reset effectué
curl -X GET http://localhost:3000/api/admin/demo/status \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Troubleshooting

### ❌ Problèmes courants

#### 1. Mode démo ne s'active pas via URL

**Symptômes** : URL avec `?demo=true` mais pas de bannière
**Solutions** :
- Vérifier que `DemoModeProvider` entoure l'app
- Contrôler console pour erreurs JavaScript
- Vérifier parsing des paramètres URL

```javascript
// Debug activation URL
console.log('URL params:', new URLSearchParams(window.location.search));
console.log('Demo param:', urlParams.get('demo'));
```

#### 2. Boutons "Rafraîchir/Reset" ne marchent pas

**Symptômes** : Clic sans effet ou erreur de connexion
**Solutions** :
- Vérifier que le backend est démarré (`docker compose logs backend`)
- Contrôler token JWT valide dans localStorage
- Vérifier endpoints API accessibles

```bash
# Debug backend
curl -I http://localhost:3000/api/admin/demo/status

# Debug avec token
curl -X GET http://localhost:3000/api/admin/demo/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Erreur "Impossible de réinitialiser les données"

**Symptômes** : Toast d'erreur, pas de données générées
**Solutions** :
- Vérifier logs backend : `docker compose logs backend --tail=20`
- Contrôler que Prisma est configuré correctement
- Vérifier schéma de base de données compatible

```bash
# Debug Prisma
docker compose exec backend npx prisma db pull
docker compose exec backend npx prisma generate
```

#### 4. Données réelles au lieu de données fictives

**Symptômes** : Mode démo affiché mais vraies données visibles
**Solutions** :
- Cliquer "Rafraîchir" pour forcer génération
- Vérifier API `/demo/status` retourne `demoDataExists: true`
- Contrôler filtrage par @demo.staka.fr

```sql
-- Debug base de données
SELECT COUNT(*) FROM users WHERE email LIKE '%@demo.staka.fr';
SELECT * FROM users WHERE email LIKE '%@demo.staka.fr' LIMIT 5;
```

#### 5. Timer ne fonctionne pas

**Symptômes** : Temps restant ne décompte pas
**Solutions** :
- Vérifier que `sessionDuration > 0` 
- Contrôler les intervals JavaScript
- Vérifier gestion mémoire des timers

```javascript
// Debug timer
useEffect(() => {
  console.log('Timer state:', {
    isDemo: demoState.isDemo,
    startTime: new Date(demoState.startTime),
    duration: demoState.demoConfig.sessionDuration,
    remaining: demoState.remainingTime
  });
}, [demoState]);
```

#### 6. Backend crash au démarrage

**Symptômes** : Erreur 502 Bad Gateway, conteneur qui redémarre
**Solutions** :
- Vérifier dépendances installées : `bcryptjs`, `@prisma/client`
- Contrôler erreurs TypeScript dans logs
- Vérifier schéma Prisma généré

```bash
# Debug dépendances
docker compose exec backend npm list bcryptjs
docker compose exec backend npm list @prisma/client

# Debug compilation TypeScript  
docker compose logs backend | grep -i "TSError\|error"
```

### 🔍 Debugging avancé

```typescript
// Logger global mode démo
window.debugDemo = () => {
  const state = /* obtenir état actuel */;
  console.table({
    'Mode actif': state.isDemo,
    'Lecture seule': state.demoConfig.readOnly,
    'Temps restant': `${state.remainingTime}min`,
    'Session démarrée': new Date(state.startTime).toLocaleString(),
    'Actions autorisées': state.demoConfig.allowedActions.length,
    'Features restreintes': state.demoConfig.restrictedFeatures.length
  });
};

// Debug API backend
window.debugDemoAPI = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/admin/demo/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log('Demo API Status:', data);
  } catch (error) {
    console.error('Demo API Error:', error);
  }
};
```

### 📊 Monitoring production

```typescript
// Analytics mode démo
const trackDemoUsage = (event: string, data?: any) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'demo_mode', {
      event_category: 'engagement',
      event_label: event,
      custom_parameter_1: data
    });
  }
};

// Usage
trackDemoUsage('demo_started', { duration: 30, readOnly: true });
trackDemoUsage('demo_data_refreshed', { usersCreated: 6, commandesCreated: 10 });
trackDemoUsage('demo_completed', { totalDuration: 25 });
```

---

## 📚 Ressources

### 📖 Documentation connexe

- [ADMIN_GUIDE_UNIFIED.md](ADMIN_GUIDE_UNIFIED.md) - Guide administration complète
- [TESTS_COMPLETE_GUIDE.md](TESTS_COMPLETE_GUIDE.md) - Tests et validation
- [README-frontend.md](README-frontend.md) - Architecture frontend React
- [README-backend.md](README-backend.md) - Architecture backend Node.js
- [FREE_SAMPLE_SYSTEM_GUIDE.md](FREE_SAMPLE_SYSTEM_GUIDE.md) - Système échantillons gratuits

### 🔗 Références techniques

- [React Context API](https://react.dev/reference/react/useContext) - Gestion d'état global
- [React Hooks](https://react.dev/reference/react) - Hooks personnalisés
- [Prisma](https://www.prisma.io/docs/) - ORM base de données
- [Express.js](https://expressjs.com/) - Framework backend
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [TypeScript](https://www.typescriptlang.org/) - Typage statique

---

## 🎯 Conclusion

Le système de mode démonstration de Staka Livres offre une **expérience utilisateur complète et sécurisée** pour permettre aux prospects de tester l'interface d'administration avec des **vraies données fictives générées dynamiquement** sans risque.

### Fonctionnalités clés ✅

- ✅ **Activation flexible** : URL, programmatique, configurations prédéfinies
- ✅ **Session intelligente** : Timer, notifications, extensions, expiration auto
- ✅ **Vraies données fictives** : Génération en base de données via API backend
- ✅ **Endpoints backend complets** : REST API sécurisée avec authentification
- ✅ **Sécurité robuste** : Restrictions granulaires, utilisateurs @demo.staka.fr isolés
- ✅ **UX optimisée** : Bannière interactive, toast feedback, indicateurs visuels
- ✅ **Gestion des données** : Rafraîchissement, reset, statut via API
- ✅ **Architecture modulaire** : HOC, hooks, composants réutilisables
- ✅ **Tests complets** : Validation manuelle et API automatisée
- ✅ **Monitoring intégré** : Analytics, debugging, troubleshooting

Le système est **déployé en production sur [livrestaka.fr](https://livrestaka.fr/)** et génère maintenant de **vraies données fictives en base de données** pour une démonstration réaliste des capacités de la plateforme. **Migration AWS S3 → stockage local complètement terminée** et système de notifications centralisé avec EventBus opérationnel.

### 🚀 Utilisation recommandée

```bash
# Pour prospects (lecture seule, 15min)
https://livrestaka.fr/admin?demo=true&readonly=true&duration=15

# Pour clients potentiels (modifications limitées, 30min)
https://livrestaka.fr/admin?demo=true&duration=30

# Pour démonstrations complètes (45min)
https://livrestaka.fr/admin?demo=true&duration=45
```

### 🔧 Instructions d'utilisation

1. **Se connecter** : `admin@staka-editions.com` / `admin123`
2. **Activer le mode démo** : Ajouter `?demo=true&duration=30` à l'URL
3. **Générer les données** : Cliquer "🔄 Rafraîchir" dans la bannière
4. **Tester l'interface** : Voir les utilisateurs @demo.staka.fr, commandes fictives, messages
5. **Reset si besoin** : Cliquer "🔄 Reset" pour remettre à l'état initial

---

**📧 Contact production** : contact@staka.fr  
**👨‍💻 Développé par** : [Christophe Mostefaoui](https://christophe-dev-freelance.fr/) - Août 2025

*Guide mis à jour le 5 août 2025 - Version 2.1 (Migration stockage local + notifications centralisées) - Production déployée*