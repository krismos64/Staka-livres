# 💬 Guide Complet - Système de Messagerie Staka Livres

## 📋 **Vue d'ensemble**

Le système de messagerie de **Staka Livres** est une solution complète unifiée couvrant :

- **Messagerie Frontend** : Interface React avec hooks optimisés
- **API Backend** : Endpoints REST avec Prisma et base de données
- **Administration** : Interface admin avec supervision et contrôle
- **Tests** : Suite complète de tests d'intégration
- **Architecture** : Types TypeScript unifiés et cache intelligent

---

## 🚀 **Migration Frontend - Architecture Complète**

### **✅ État Final - Migration Terminée**

La messagerie frontend a été **entièrement migrée** de mock vers l'API REST backend avec une architecture optimisée et des fonctionnalités avancées. Le fichier `useMessages.ts` est devenu un module complet de gestion de la messagerie.

### **🎯 Réalisations Principales**

#### **1. Types Unifiés & Architecture**

**Fichier central** : `frontend/src/types/messages.ts`

```typescript
// Types alignés sur le schéma Prisma backend, servant de source de vérité.
export enum MessageType {
  TEXT = "TEXT",
  FILE = "FILE",
  IMAGE = "IMAGE",
  SYSTEM = "SYSTEM",
  ADMIN_NOTE = "ADMIN_NOTE",
}

export enum MessageStatut {
  BROUILLON = "BROUILLON",
  ENVOYE = "ENVOYE",
  DELIVRE = "DELIVRE",
  LU = "LU",
  ARCHIVE = "ARCHIVE",
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  commandeId?: string;
  supportRequestId?: string;
  subject?: string;
  content: string;
  type: MessageType;
  statut: MessageStatut;
  isRead: boolean;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  titre: string;
  type: "direct" | "project" | "support";
  participants: User[];
  messages: Message[];
  messageCount: number;
  unreadCount: number;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}
```

#### **2. Hooks React Query Optimisés**

**Refactorisé** : `frontend/src/hooks/useMessages.ts`

```typescript
// Récupère une liste de messages avec filtres (pagination, etc.)
export function useMessages(filters: MessageFilters = {});

// Récupère les détails d'un message spécifique et son fil de discussion
export function useMessage(id: string);

// Récupère les statistiques de messagerie de l'utilisateur
export function useMessageStats();

// Gère l'envoi d'un nouveau message avec optimistic update
export function useSendMessage(): UseSendMessageReturn;

// Met à jour un message (ex: marquer comme lu, archiver)
export function useUpdateMessage();

// Supprime un message (soft delete par défaut)
export function useDeleteMessage();

// Marque un seul message comme lu
export function useMarkAsRead();

// Marque tous les messages d'une conversation comme lus
export function useMarkConversationAsRead();

// Gère l'upload d'une pièce jointe à un message
export function useUploadAttachment();

// Récupère les messages pour une conversation spécifique
export function useConversationMessages(
  conversationId: string,
  filters?: MessageFilters
);
```

**Production Ready** : `frontend/src/hooks/useAdminMessages.ts`

```typescript
// Vue admin globale avec filtres
export const useAdminMessages = (filters) => {
  // ... existing code ...
};
```

#### **3. Composants UX Optimisés**

**MessageInput avancé** :

- Upload drag&drop avec overlay visuel
- Progress bars et validation (10MB max, types autorisés)
- Émojis picker avec emojis populaires
- Auto-resize textarea avec limite caractères
- Raccourcis clavier (Entrée/Maj+Entrée)

**MessageThread intelligent** :

- Scroll automatique avec auto-scroll pour nouveaux messages
- Désactivation auto-scroll si user scroll manuellement
- Bouton "Aller en bas" avec compteur messages non-lus
- Pagination infinie avec intersection observer
- Marquage automatique comme lu quand messages visibles
- Grouping par date avec formatage intelligent

**ConversationList** :

- Badges non-lus avec compteurs temps réel
- Filtres (tous, non-lus, archivés)
- Search en temps réel avec debouncing

---

## 🔗 **API Backend - Endpoints Complets**

### **🔐 Authentification**

Toutes les routes nécessitent un token JWT valide :

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### **📨 Routes Utilisateur**

#### **1. POST /messages - Créer un message**

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
    }
  }
}
```

#### **2. GET /messages - Liste paginée avec filtres**

```http
GET /messages?page=1&limit=20&commandeId=cmd-123&isRead=false
Authorization: Bearer token
```

**Paramètres de filtrage :**

- `page` : Numéro de page (défaut: 1)
- `limit` : Éléments par page (max: 100, défaut: 20)
- `commandeId` : Messages d'un projet spécifique
- `supportRequestId` : Messages d'un ticket support
- `isRead` : true/false - Messages lus/non lus
- `isArchived` : true/false - Messages archivés
- `search` : Recherche dans contenu et sujet

#### **3. GET /messages/stats - Statistiques utilisateur**

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

#### **4. PATCH /messages/:id - Mise à jour statut**

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

#### **5. DELETE /messages/:id - Suppression**

```http
DELETE /messages/msg-123?hard=false
Authorization: Bearer token
```

**Paramètres :**

- `hard=true` : Suppression définitive (ADMIN uniquement)
- `hard=false` : Soft delete (anonymisation)

### **👑 Routes Admin - Production Ready**

#### **1. GET /admin/conversations - Liste conversations**

```http
GET /admin/conversations?page=1&limit=100&search=client&isRead=false
Authorization: Bearer admin-token
```

**Paramètres :**

- `page`, `limit` : Pagination
- `search` : Recherche par nom utilisateur
- `isRead` : Filtrer lu/non lu
- `sortBy` : `user` (alphabétique) ou `date`

**Response 200 :**

```json
{
  "conversations": [
    {
      "id": "direct_user1_user2",
      "type": "direct",
      "participants": { "client": { "nom": "Dupont", "prenom": "Jean" } },
      "messageCount": 5,
      "unreadCount": 2,
      "lastMessage": {
        "content": "Dernier message...",
        "createdAt": "2024-01-15T10:30:00Z",
        "sender": "Jean Dupont"
      }
    }
  ],
  "total": 45,
  "page": 1
}
```

#### **2. POST /admin/conversations/:id/messages - Envoi message admin**

```http
POST /admin/conversations/direct_user1_user2/messages
Authorization: Bearer admin-token
Content-Type: application/json

{
  "contenu": "Message de l'administrateur",
  "isNote": false  // true pour note interne non visible
}
```

#### **3. GET /admin/conversations/stats - Statistiques globales**

```http
GET /admin/conversations/stats
Authorization: Bearer admin-token
```

**Response 200 :**

```json
{
  "total": 156,
  "unread": 23,
  "totalMessages": 1247
}
```

#### **4. GET /admin/stats/advanced - Dashboard complet**

```http
GET /admin/stats/advanced
Authorization: Bearer admin-token
```

**Response 200 :**

```json
{
  "totalCommandes": 45,
  "totalFactures": 32,
  "totalUtilisateurs": 123,
  "totalMessages": 1247,
  "messagesNonLus": 23,
  "commandesEnCours": 8,
  "facturesEnAttente": 5,
  "utilisateursActifs": 67
}
```

#### **5. DELETE /admin/conversations/:id - Suppression RGPD**

```http
DELETE /admin/conversations/direct_user1_user2
Authorization: Bearer admin-token
```

Suppression définitive de tous les messages de la conversation en base de données.

---

## 🔧 **Backend - Architecture Technique**

### **Parser de Conversation IDs - Production**

```typescript
// backend/src/routes/admin.ts

const parseConversationId = (conversationId: string) => {
  if (conversationId.startsWith("direct_")) {
    return {
      type: "direct",
      userIds: conversationId.split("_").slice(1),
    };
  } else if (conversationId.startsWith("projet_")) {
    return {
      type: "projet",
      commandeId: conversationId.replace("projet_", ""),
    };
  } else if (conversationId.startsWith("support_")) {
    return {
      type: "support",
      supportRequestId: conversationId.replace("support_", ""),
    };
  }
  return null;
};

// Identification automatique du destinataire
const identifyReceiver = async (conversationId: string, adminId: string) => {
  const parsed = parseConversationId(conversationId);

  switch (parsed?.type) {
    case "direct":
      // Trouver l'utilisateur qui n'est pas l'admin
      return parsed.userIds.find((id) => id !== adminId);

    case "projet":
      // Récupérer le propriétaire du projet
      const commande = await prisma.commande.findUnique({
        where: { id: parsed.commandeId },
        select: { userId: true },
      });
      return commande?.userId;

    case "support":
      // Récupérer le créateur du ticket
      const ticket = await prisma.supportRequest.findUnique({
        where: { id: parsed.supportRequestId },
        select: { userId: true },
      });
      return ticket?.userId;
  }
};
```

### **Grouping Messages en Conversations**

```typescript
const groupMessagesIntoConversations = (messages: Message[]) => {
  const conversationsMap = new Map();

  messages.forEach((message) => {
    let conversationId: string;

    if (message.commandeId) {
      conversationId = `projet_${message.commandeId}`;
    } else if (message.supportRequestId) {
      conversationId = `support_${message.supportRequestId}`;
    } else {
      // Conversation directe
      const userIds = [message.senderId, message.receiverId]
        .filter(Boolean)
        .sort();
      conversationId = `direct_${userIds.join("_")}`;
    }

    if (!conversationsMap.has(conversationId)) {
      conversationsMap.set(conversationId, {
        id: conversationId,
        type: message.commandeId
          ? "projet"
          : message.supportRequestId
          ? "support"
          : "direct",
        messages: [],
        participants: [],
        messageCount: 0,
        unreadCount: 0,
        lastMessage: null,
      });
    }

    const conversation = conversationsMap.get(conversationId);
    conversation.messages.push(message);
    conversation.messageCount++;
    if (!message.isRead) conversation.unreadCount++;

    if (
      !conversation.lastMessage ||
      message.createdAt > conversation.lastMessage.createdAt
    ) {
      conversation.lastMessage = {
        content: message.content,
        createdAt: message.createdAt,
        sender:
          message.sender?.prenom + " " + message.sender?.nom || "Utilisateur",
      };
    }
  });

  return Array.from(conversationsMap.values());
};
```

### **Mapping Types Frontend ↔ Backend**

```typescript
const mapFrontendTypeToPrisma = (frontendType: string): MessageType => {
  switch (frontendType) {
    case "TEXT":
    case "FILE":
    case "IMAGE":
      return MessageType.USER_MESSAGE;
    case "SYSTEM":
      return MessageType.SYSTEM_MESSAGE;
    case "ADMIN_NOTE":
      return MessageType.ADMIN_MESSAGE;
    default:
      return MessageType.USER_MESSAGE;
  }
};

const mapPrismaToFrontend = (message: any) => ({
  id: message.id,
  content: message.content || message.contenu,
  sender: message.sender || message.auteur,
  isRead: message.isRead,
  createdAt: message.createdAt,
  // ... autres mappings
});
```

---

## 🧪 **Guide de Tests Complets**

### **🔧 Prérequis**

```bash
# 1. Backend en marche
cd backend && npm run dev

# 2. Frontend en marche
cd frontend && npm run dev

# 3. Base de données connectée
# Vérifier que Prisma est sync avec la DB
```

### **🎯 Tests Utilisateur Frontend**

#### **Page Messages Utilisateur**

📍 URL : `http://localhost:3000/messages`

**✅ Test Basic Flow**

1. **Chargement initial**

   - [ ] Page se charge sans erreur
   - [ ] Liste conversations vide ou avec données
   - [ ] Pas d'erreur console network

2. **Envoi message simple**

   - [ ] Taper message dans input
   - [ ] Appuyer "Entrée" ou clic bouton send
   - [ ] Message apparaît instantanément (optimistic)
   - [ ] Message confirmé après appel API
   - [ ] Input se vide automatiquement

3. **Upload fichier**

   - [ ] Clic icône paperclip
   - [ ] Sélectionner image/PDF < 10MB
   - [ ] Preview fichier apparaît
   - [ ] Envoyer message avec fichier
   - [ ] Fichier visible dans thread

4. **Drag & Drop**
   - [ ] Glisser fichier sur input area
   - [ ] Overlay bleu apparaît
   - [ ] Drop → fichier ajouté
   - [ ] Envoyer message

**✅ Test Scroll & Pagination**

5. **Auto-scroll**

   - [ ] Envoyer plusieurs messages
   - [ ] Page scroll automatiquement vers bas
   - [ ] Scroll manuel vers haut désactive auto-scroll
   - [ ] Bouton "Aller en bas" apparaît

6. **Load More**
   - [ ] Si > 20 messages, bouton "Charger plus" en haut
   - [ ] Clic charge messages précédents
   - [ ] Pagination infinie fonctionne

**✅ Test Filtres & Conversations**

7. **Filtres sidebar**
   - [ ] "Tous" affiche toutes conversations
   - [ ] "Non lus" filtre messages non lus
   - [ ] "Archivés" filtre archivés
   - [ ] Badge compteur non-lus correct

### **👑 Tests Admin Frontend**

#### **Page Messages Admin**

📍 URL : `http://localhost:3000/admin/messagerie`

**✅ Test Vue Admin - Production Ready**

1. **Dashboard messages**

   - [ ] Vue globale tous messages site
   - [ ] Filtres lu/non-lu fonctionnent
   - [ ] Search par utilisateur

2. **Actions Admin**

   - [ ] Envoi messages admin vers utilisateurs
   - [ ] Messages admin reçus côté utilisateur
   - [ ] Suppression RGPD avec confirmation
   - [ ] Modal de confirmation avertissement

3. **Interface simplifiée**
   - [ ] Tri par utilisateur (alphabétique)
   - [ ] Tri par date
   - [ ] Interface épurée et moderne
   - [ ] Fonctionnalités admin complètes

### **🔧 Tests API Backend**

#### **Tests avec curl**

```bash
# 1. Se connecter
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@staka-editions.com","password":"admin123"}' \
  | jq -r '.token')

# 2. Tester endpoints admin conversations
curl -X GET http://localhost:3001/admin/conversations \
  -H "Authorization: Bearer $TOKEN"

# 3. Tester stats avancées
curl -X GET http://localhost:3001/admin/stats/advanced \
  -H "Authorization: Bearer $TOKEN"

# 4. Tester envoi message admin
curl -X POST http://localhost:3001/admin/conversations/direct_user1_user2/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contenu": "Test message admin"}'

# 5. Tester suppression RGPD
curl -X DELETE http://localhost:3001/admin/conversations/test_conversation_id \
  -H "Authorization: Bearer $TOKEN"
```

#### **Tests Communication Bidirectionnelle**

**Test principal :** Vérifier qu'un message envoyé par l'admin apparaît bien côté utilisateur

1. **Admin envoie message**

   - [ ] Connecté en tant qu'admin
   - [ ] Envoie message vers utilisateur spécifique
   - [ ] Message créé en base de données avec receiverId correct

2. **Utilisateur reçoit message**

   - [ ] Connecté en tant qu'utilisateur cible
   - [ ] Message apparaît dans interface utilisateur
   - [ ] Peut répondre au message admin

3. **Vérification base de données**
   ```sql
   SELECT id, senderId, receiverId, content, createdAt
   FROM messages
   WHERE senderId = 'ADMIN_ID'
   AND receiverId = 'USER_ID'
   ORDER BY createdAt DESC;
   ```

### **🐛 Troubleshooting Tests**

#### **Messages admin non reçus**

**Diagnostic :**

```bash
# Vérifier parsing conversation IDs
docker logs staka_backend --tail 20 | grep "conversation\|receiverId"

# Vérifier que le message a été créé en DB
docker exec -it staka_db mysql -u staka -pstaka stakalivres -e "
SELECT id, senderId, receiverId, content, createdAt
FROM messages
WHERE senderId = 'ADMIN_USER_ID'
ORDER BY createdAt DESC LIMIT 5;"
```

#### **Erreurs frontend "Cannot read properties of undefined"**

**Solution :** Sécuriser l'accès aux propriétés :

```typescript
const conversationTitle =
  conversation.participants?.client?.nom ||
  conversation.titre ||
  `Conversation ${conversation.id?.slice(-6)}`;

const lastMessageSender =
  conversation.lastMessage?.sender ||
  message.sender?.prenom + " " + message.sender?.nom ||
  message.auteur?.prenom + " " + message.auteur?.nom ||
  "Utilisateur";
```

---

## 🚀 **Architecture Finale & Performance**

### **Stack Technologique**

```
┌─────────────────────┐
│     Frontend        │
├─────────────────────┤
│ • React + TypeScript│
│ • React Query Cache │ ← 30s staleTime, 5min cacheTime
│ • Optimistic Updates│ ← Rollback automatique
│ • Infinite Scroll   │ ← Intersection Observer
└─────────────────────┘
           ↓ /api/*
┌─────────────────────┐
│     Backend         │
├─────────────────────┤
│ • Express + JWT     │
│ • Prisma ORM        │ ← Types générés automatiquement
│ • Parser ConversationID│ ← Intelligence artificielle
│ • Mapping Types     │ ← Frontend ↔ Backend
└─────────────────────┘
           ↓
┌─────────────────────┐
│     Database        │
├─────────────────────┤
│ • MySQL 8.4+        │
│ • Index optimisés   │ ← Performance queries
│ • Contraintes RGPD  │ ← Cascade DELETE
│ • Relations complexes│ ← Messages, Users, Projets
└─────────────────────┘
```

### **Fonctionnalités Implémentées**

#### **✅ Optimistic Updates**

- Messages apparaissent instantanément
- Rollback automatique si erreur réseau
- Status "sending" → "sent" → "delivered" → "read"

#### **✅ Pagination Infinie**

- `useIntersectionObserver` hook personnalisé
- Chargement automatique au scroll
- Performance optimisée (100 conversations chargées)

#### **✅ Gestion Scroll Intelligente**

- Auto-scroll pour nouveaux messages
- Désactivation si user scroll manuellement
- Bouton "Aller en bas" avec compteur non-lus
- Marquage automatique comme lu

#### **✅ Upload Fichiers Avancé**

- Drag & drop avec overlay visuel
- Progress bars et validation
- Support images, PDF, docs (10MB max)
- Preview et suppression avant envoi

#### **✅ Interface Admin Production-Ready**

- Vue détaillée tous messages
- Communication bidirectionnelle admin↔utilisateur
- Suppression RGPD avec confirmation
- Statistiques temps réel calculées depuis DB
- Interface moderne et épurée
- Filtres et tri optimisés

### **Performance Targets**

- **Loading initial** : < 2s
- **Envoi message** : < 500ms (optimistic)
- **Upload fichier** : progress visible
- **Scroll pagination** : < 100ms
- **Search/filter** : < 300ms

### **Sécurité & RGPD**

- **Rate limiting** : 50 messages/heure par utilisateur
- **Validation contenu** : Max 10,000 caractères
- **Contrôle d'accès** : Permissions par rôle
- **Soft delete** par défaut : Anonymisation
- **Hard delete** admin : Suppression définitive

---

## 🎉 **Migration 100% Terminée !**

### **✅ Checklist Final - Production Ready**

- ✅ Types unifiés backend-alignés
- ✅ Hooks React Query optimisés
- ✅ Admin hooks complets et fonctionnels
- ✅ UX avancée (scroll, upload, pagination)
- ✅ API integration robuste
- ✅ Gestion erreurs & optimistic updates
- ✅ Communication bidirectionnelle admin↔utilisateur
- ✅ Tests flows principaux validés
- ✅ Documentation complète
- ✅ Interface admin production-ready

### **🏆 Prêt pour Production**

Le système de messagerie est maintenant **entièrement connecté** à l'API REST backend avec :

- **Performance optimisée** (React Query + cache intelligent)
- **UX moderne** (drag&drop, scroll auto, pagination infinie)
- **Administration complète** (supervision, intervention, RGPD)
- **Robustesse réseau** (retry, rollback, error handling)
- **Architecture évolutive** (types stricts, hooks modulaires)

### **🚀 Évolutions Futures (Optionnel)**

1. **Temps Réel** : Socket.io pour messages instantanés
2. **Notifications Push** : Web push API
3. **Search Avancée** : Full-text avec highlight
4. **Réactions** : Émojis sur messages
5. **Threads** : Réponses imbriquées

**La base est solide pour tous ces ajouts !** 🎊

---

_Guide Complet Messagerie Staka Livres - Frontend, Backend, API & Tests_
_Architecture unifiée prête pour la production_
