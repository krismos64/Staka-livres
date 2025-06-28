# 💬 API Messages - Guide Complet

## 📋 Vue d'ensemble

L'API Messages de Staka Livres permet la gestion complète de la messagerie unifiée avec support pour :

- **Messages généraux** : Communication directe entre utilisateurs
- **Messages projet** : Conversation liée à une commande spécifique
- **Messages support** : Communication via tickets de support
- **Système de threads** : Réponses et conversations
- **Pièces jointes** : Fichiers attachés aux messages
- **Sécurité avancée** : Permissions, anti-spam, RGPD

## 🔐 Authentification

Toutes les routes nécessitent un token JWT valide :

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 🚀 Routes Disponibles

### 1. **POST /messages** - Créer un message

```http
POST /messages
Authorization: Bearer token
Content-Type: application/json

{
  "content": "Contenu du message",
  "receiverId": "uuid-destinataire",        // Optionnel (message direct)
  "commandeId": "uuid-commande",            // Optionnel (message projet)
  "supportRequestId": "uuid-ticket",       // Optionnel (message support)
  "subject": "Sujet du message",            // Optionnel
  "type": "USER_MESSAGE",                   // USER_MESSAGE, SYSTEM_MESSAGE, etc.
  "parentId": "uuid-message-parent"        // Optionnel (réponse)
}
```

**Types de messages :**

- **Message direct** : `receiverId` uniquement
- **Message projet** : `commandeId` + optionnellement `receiverId`
- **Message support** : `supportRequestId`
- **Réponse** : `parentId` + un des contextes ci-dessus

**Response 201 :**

```json
{
  "message": "Message créé avec succès",
  "data": {
    "id": "msg-123",
    "content": "Contenu du message",
    "type": "USER_MESSAGE",
    "statut": "ENVOYE",
    "isRead": false,
    "isPinned": false,
    "threadId": "thread-456",
    "createdAt": "2024-01-15T10:30:00Z",
    "sender": {
      "id": "user-789",
      "prenom": "Jean",
      "nom": "Dupont",
      "email": "jean@example.com",
      "role": "USER",
      "avatar": "https://..."
    },
    "receiver": { ... },
    "commande": {
      "id": "cmd-123",
      "titre": "Mon projet",
      "statut": "EN_COURS"
    },
    "attachments": [],
    "_count": {
      "replies": 0
    }
  }
}
```

### 2. **GET /messages** - Liste paginée avec filtres

```http
GET /messages?page=1&limit=20&commandeId=cmd-123&isRead=false
Authorization: Bearer token
```

**Paramètres de filtrage :**

- `page` : Numéro de page (défaut: 1)
- `limit` : Éléments par page (max: 100, défaut: 20)
- `commandeId` : Messages d'un projet spécifique
- `supportRequestId` : Messages d'un ticket support
- `threadId` : Messages d'un thread spécifique
- `type` : Type de message (USER_MESSAGE, SYSTEM_MESSAGE, etc.)
- `statut` : Statut (ENVOYE, LU, ARCHIVE, etc.)
- `isRead` : true/false - Messages lus/non lus
- `isArchived` : true/false - Messages archivés
- `isPinned` : true/false - Messages épinglés
- `search` : Recherche dans contenu et sujet

**Response 200 :**

```json
{
  "messages": [
    {
      "id": "msg-123",
      "content": "Contenu du message"
      // ... autres champs comme create
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3. **GET /messages/stats** - Statistiques utilisateur

```http
GET /messages/stats
Authorization: Bearer token
```

**Response 200 :**

```json
{
  "totalSent": 45,
  "totalReceived": 38,
  "unreadCount": 7,
  "pinnedCount": 3,
  "projectMessages": 25,
  "supportMessages": 12,
  "total": 83
}
```

### 4. **GET /messages/:id** - Détail message + réponses

```http
GET /messages/msg-123
Authorization: Bearer token
```

**Response 200 :**

```json
{
  "id": "msg-123",
  "content": "Message principal",
  "subject": "Discussion projet",
  // ... champs du message
  "replies": [
    {
      "id": "msg-124",
      "content": "Première réponse",
      "createdAt": "2024-01-15T11:00:00Z",
      "sender": { ... },
      "attachments": []
    },
    // ... autres réponses
  ],
  "attachments": [
    {
      "id": "att-456",
      "file": {
        "id": "file-789",
        "filename": "document.pdf",
        "size": 1024000,
        "mimeType": "application/pdf",
        "url": "https://storage.../document.pdf"
      }
    }
  ]
}
```

### 5. **PATCH /messages/:id** - Mise à jour statut

```http
PATCH /messages/msg-123
Authorization: Bearer token
Content-Type: application/json

{
  "isRead": true,          // Marquer comme lu (destinataire uniquement)
  "isArchived": false,     // Archiver/désarchiver
  "isPinned": true,        // Épingler (expéditeur/admin uniquement)
  "statut": "LU"          // Changer statut (expéditeur/admin uniquement)
}
```

**Permissions :**

- **isRead** : Seul le destinataire peut marquer comme lu
- **isArchived** : Tous les utilisateurs concernés
- **isPinned** : Seul l'expéditeur ou admin
- **statut** : Seul l'expéditeur ou admin

**Response 200 :**

```json
{
  "message": "Message mis à jour avec succès",
  "data": {
    "id": "msg-123",
    "isRead": true,
    "isPinned": true
    // ... autres champs
  }
}
```

### 6. **DELETE /messages/:id** - Suppression

```http
DELETE /messages/msg-123?hard=false
Authorization: Bearer token
```

**Paramètres :**

- `hard=true` : Suppression définitive (ADMIN uniquement)
- `hard=false` : Soft delete (anonymisation)

**Soft Delete (défaut) :**

- Contenu remplacé par "[Message supprimé]"
- Message marqué comme archivé
- Pièces jointes conservées

**Hard Delete (Admin uniquement) :**

- Suppression définitive du message
- Suppression des pièces jointes
- Suppression en cascade des réponses

**Response 200 :**

```json
{
  "message": "Message archivé avec succès"
  // ou "Message supprimé définitivement"
}
```

### 7. **POST /messages/:id/attachments** - Ajouter pièce jointe

```http
POST /messages/msg-123/attachments
Authorization: Bearer token
Content-Type: application/json

{
  "fileId": "file-456"
}
```

**Contraintes :**

- Seul l'expéditeur peut ajouter des pièces jointes
- Maximum 10 pièces jointes par message
- Le fichier doit appartenir à l'utilisateur
- Fichier déjà uploadé via l'API Files

**Response 201 :**

```json
{
  "message": "Pièce jointe ajoutée avec succès",
  "attachment": {
    "id": "att-789",
    "file": {
      "id": "file-456",
      "filename": "rapport.pdf",
      "size": 2048000,
      "mimeType": "application/pdf",
      "url": "https://storage.../rapport.pdf",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  }
}
```

## 🔒 Sécurité et Permissions

### Contrôle d'accès

**Admin** : Accès complet à tous les messages

**Utilisateur standard** : Accès uniquement aux messages où il est :

- Expéditeur ou destinataire
- Propriétaire du projet (messages avec `commandeId`)
- Créateur ou assigné du ticket support (messages avec `supportRequestId`)

### Anti-spam

- **Rate limiting** : Maximum 50 messages par heure par utilisateur
- **Validation contenu** : Maximum 10,000 caractères
- **Contrôle contexte** : Au moins un destinataire/projet/ticket requis

### RGPD

- **Soft delete** par défaut : Anonymisation du contenu
- **Hard delete** pour admins : Suppression définitive
- **Droit à l'oubli** : Suppression complète des données utilisateur

## 📊 Types de Messages

### MessageType

```typescript
enum MessageType {
  USER_MESSAGE     // Message standard utilisateur
  SYSTEM_MESSAGE   // Message automatique du système
  NOTIFICATION     // Notification interne
  SUPPORT_MESSAGE  // Message dans un ticket support
  ADMIN_MESSAGE    // Message administrateur
}
```

### MessageStatut

```typescript
enum MessageStatut {
  BROUILLON        // En cours de rédaction
  ENVOYE           // Envoyé avec succès
  DELIVRE          // Délivré au destinataire
  LU               // Lu par le destinataire
  ARCHIVE          // Archivé
}
```

## 🎯 Cas d'Usage

### 1. Conversation Projet

```javascript
// Créer un message sur un projet
const response = await fetch("/messages", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    commandeId: "cmd-123",
    content: "Bonjour, j'ai une question sur la correction...",
    subject: "Question sur le projet",
  }),
});

// Obtenir tous les messages du projet
const projectMessages = await fetch("/messages?commandeId=cmd-123", {
  headers: { Authorization: `Bearer ${token}` },
});
```

### 2. Répondre à un message

```javascript
// Répondre à un message existant
const reply = await fetch("/messages", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    parentId: "msg-123",
    commandeId: "cmd-123", // Même contexte que le parent
    content: "Voici ma réponse...",
  }),
});
```

### 3. Marquer messages comme lus

```javascript
// Marquer un message comme lu
await fetch("/messages/msg-123", {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    isRead: true,
  }),
});
```

### 4. Recherche de messages

```javascript
// Rechercher dans les messages
const searchResults = await fetch("/messages?search=correction&limit=50", {
  headers: { Authorization: `Bearer ${token}` },
});
```

## ⚠️ Codes d'Erreur

| Code | Description                                           |
| ---- | ----------------------------------------------------- |
| 400  | Données invalides (contenu manquant, trop long, etc.) |
| 401  | Token JWT manquant ou invalide                        |
| 403  | Accès non autorisé (permissions insuffisantes)        |
| 404  | Message, projet ou ticket non trouvé                  |
| 409  | Conflit (pièce jointe déjà existante)                 |
| 429  | Rate limit dépassé (anti-spam)                        |
| 500  | Erreur serveur interne                                |

## 🔧 Intégration Frontend

### React Hook Exemple

```javascript
import { useState, useEffect } from "react";

const useMessages = (filters = {}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  const fetchMessages = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...filters,
      });

      const response = await fetch(`/messages?${params}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();
      setMessages(data.messages);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filters]);

  return { messages, loading, pagination, refetch: fetchMessages };
};
```

### Utilisation du Hook

```javascript
const MessagesList = ({ commandeId }) => {
  const { messages, loading, pagination } = useMessages({
    commandeId,
    isArchived: false,
  });

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <Pagination pagination={pagination} />
    </div>
  );
};
```

## 🧪 Tests avec curl

### Test complet d'un flow

```bash
# 1. Se connecter
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}' \
  | jq -r '.token')

# 2. Créer un message
MESSAGE_ID=$(curl -s -X POST http://localhost:3001/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message","subject":"Test"}' \
  | jq -r '.data.id')

# 3. Lire le message
curl -X GET "http://localhost:3001/messages/$MESSAGE_ID" \
  -H "Authorization: Bearer $TOKEN"

# 4. Marquer comme lu
curl -X PATCH "http://localhost:3001/messages/$MESSAGE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isRead":true}'

# 5. Obtenir les statistiques
curl -X GET http://localhost:3001/messages/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

**API Messages Staka Livres** - Messagerie unifiée avec sécurité avancée et support multi-contexte

_Documentation complète pour l'intégration frontend et les tests d'API_
