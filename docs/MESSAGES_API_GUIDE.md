# 💬 Guide API - Système de Messagerie Staka Livres (v2)

## 📋 **Vue d'ensemble**

Le système de messagerie de **Staka Livres** a été refactorisé pour une approche plus simple et directe, centrée sur les conversations. Il unifie la communication entre les visiteurs, les clients authentifiés et les administrateurs.

- **Messagerie Visiteur** : Permet aux utilisateurs non authentifiés de contacter l'administration.
- **Messagerie Client/Admin** : Interface unifiée pour les conversations après authentification.
- **API Backend** : Endpoints REST simplifiés utilisant un `conversationId` unique.

---

## 🔗 **API Backend - Endpoints (Version Actuelle)**

### **🔐 Authentification**

À l'exception de la route pour les visiteurs, toutes les routes nécessitent un token JWT valide :

```http
Authorization: Bearer <votre-token-jwt>
```

### **📬 Route Publique**

#### **1. POST /messages/visitor - Envoyer un message en tant que visiteur**

Permet à un utilisateur non authentifié d'envoyer un message. Le système assigne ce message au premier administrateur disponible et crée une nouvelle conversation.

**Requête :**

```http
POST /api/messages/visitor
Content-Type: application/json

{
  "email": "visiteur@example.com",
  "name": "Jean Dupont", // Optionnel
  "subject": "Question sur vos services", // Optionnel
  "content": "Bonjour, j'aimerais avoir plus d'informations."
}
```

**Réponse 201 :**

```json
{
  "message": "Message envoyé avec succès. Nous vous répondrons par email.",
  "conversationId": "uuid-de-la-conversation"
}
```

### **👤 Routes Authentifiées (Clients & Admins)**

#### **1. POST /messages/conversations - Démarrer une nouvelle conversation**

Un utilisateur authentifié peut démarrer une nouvelle conversation. Le message est automatiquement adressé à un administrateur.

**Requête :**

```http
POST /api/messages/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Problème avec ma commande", // Optionnel
  "content": "Le livre que j'ai reçu est endommagé."
}
```

**Réponse 201 :**

```json
{
  "message": "Conversation démarrée avec succès.",
  "conversationId": "uuid-de-la-conversation",
  "data": { ...objet du message créé... }
}
```

#### **2. GET /messages/conversations - Obtenir la liste des conversations**

Récupère une liste paginée des conversations.

- Un **client** voit uniquement ses propres conversations.
- Un **admin** voit toutes les conversations du système.

**Requête :**

```http
GET /api/messages/conversations?page=1&limit=20
Authorization: Bearer <token>
```

**Réponse 200 :**

```json
[
  {
    "conversationId": "uuid-de-la-conversation",
    "lastMessage": {
      "id": "uuid-du-message",
      "content": "Le livre que j'ai reçu est endommagé.",
      "createdAt": "2024-01-15T10:30:00Z",
      "senderId": "uuid-expediteur"
    },
    "unreadCount": 1,
    "withUser": {
      "id": "uuid-du-participant",
      "name": "Admin Staka",
      "avatar": null
    }
  }
]
```

#### **3. GET /messages/conversations/:conversationId - Obtenir les messages d'une conversation**

Récupère l'historique complet des messages pour une conversation donnée. Un utilisateur ne peut accéder qu'à ses propres conversations, sauf s'il est admin.

**Requête :**

```http
GET /api/messages/conversations/uuid-de-la-conversation
Authorization: Bearer <token>
```

**Réponse 200 :**

```json
[
  {
    "id": "uuid-message-1",
    "content": "Le livre que j'ai reçu est endommagé.",
    "senderId": "uuid-client",
    ...
  },
  {
    "id": "uuid-message-2",
    "content": "Bonjour, nous sommes désolés d'apprendre cela...",
    "senderId": "uuid-admin",
    ...
  }
]
```

#### **4. POST /messages/conversations/:conversationId/reply - Répondre à une conversation**

Ajoute un nouveau message à une conversation existante.

**Requête :**

```http
POST /api/messages/conversations/uuid-de-la-conversation/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Merci pour votre retour rapide."
}
```

**Réponse 201 :**

```json
{
  "message": "Réponse envoyée avec succès.",
  "data": { ...objet du message créé... }
}
```

### **👑 Route Spécifique Admin**

#### **1. GET /admin/messages/unread-count - Compteur de conversations non lues**

Fournit le nombre total de conversations qui contiennent des messages non lus par l'administrateur.

**Requête :**

```http
GET /api/admin/messages/unread-count
Authorization: Bearer <token-admin>
```

**Réponse 200 :**

```json
{
  "unreadConversationsCount": 5
}
```

---

## 🔧 **Backend - Architecture Technique**

### **Modèle de Données Simplifié**

Le système repose sur un modèle de `Message` unique avec un champ `conversationId`.

- `conversationId`: Un UUID qui regroupe tous les messages d'un même fil de discussion. Il est généré lors de la création du premier message (par un visiteur ou un client) et réutilisé pour toutes les réponses.
- `visitorEmail` / `visitorName`: Utilisés pour stocker les informations du contact lorsque le message provient d'un utilisateur non authentifié.
- `senderId` / `receiverId`: Lient les messages aux utilisateurs enregistrés dans la base de données.

Cette approche élimine la complexité de la gestion de différents types de conversations (projet, support, direct) directement dans l'API.

---

## 🧪 **Tests avec `curl`**

Assurez-vous que votre serveur backend est en cours d'exécution.

```bash
# 1. Se connecter en tant qu'admin pour obtenir un token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@staka-editions.com","password":"votre-mot-de-passe-admin"}' \
  | jq -r '.token')

# 2. Tester l'envoi d'un message en tant que visiteur
curl -X POST http://localhost:3001/api/messages/visitor \
  -H "Content-Type: application/json" \
  -d '{"email":"nouveau.visiteur@test.com", "content": "Je suis un testeur."}'

# 3. Tester la récupération des conversations en tant qu'admin
curl -X GET "http://localhost:3001/api/messages/conversations" \
  -H "Authorization: Bearer $TOKEN"

# 4. Tester le compteur de conversations non lues
curl -X GET "http://localhost:3001/api/admin/messages/unread-count" \
  -H "Authorization: Bearer $TOKEN"
```
