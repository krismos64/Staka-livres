# 🧪 Guide de Tests - Messagerie Migrée

## ⚡ **Tests Rapides d'Intégration**

### 🔧 **Prérequis**

```bash
# 1. Backend en marche
cd backend && npm run dev

# 2. Frontend en marche
cd frontend && npm run dev

# 3. Base de données connectée
# Vérifier que Prisma est sync avec la DB
```

---

## 🎯 **Test Sequence Utilisateur**

### **1. Page Messages Utilisateur**

📍 URL : `http://localhost:3000/messages`

#### **Test Basic Flow**

1. ✅ **Chargement initial**

   - [ ] Page se charge sans erreur
   - [ ] Liste conversations vide ou avec données
   - [ ] Pas d'erreur console network

2. ✅ **Envoi message simple**

   - [ ] Taper message dans input
   - [ ] Appuyer "Entrée" ou clic bouton send
   - [ ] Message apparaît instantanément (optimistic)
   - [ ] Message confirmé après appel API
   - [ ] Input se vide automatiquement

3. ✅ **Upload fichier**

   - [ ] Clic icône paperclip
   - [ ] Sélectionner image/PDF < 10MB
   - [ ] Preview fichier apparaît
   - [ ] Envoyer message avec fichier
   - [ ] Fichier visible dans thread

4. ✅ **Drag & Drop**
   - [ ] Glisser fichier sur input area
   - [ ] Overlay bleu apparaît
   - [ ] Drop → fichier ajouté
   - [ ] Envoyer message

#### **Test Scroll & Pagination**

5. ✅ **Auto-scroll**

   - [ ] Envoyer plusieurs messages
   - [ ] Page scroll automatiquement vers bas
   - [ ] Scroll manuel vers haut désactive auto-scroll
   - [ ] Bouton "Aller en bas" apparaît

6. ✅ **Load More**
   - [ ] Si > 20 messages, bouton "Charger plus" en haut
   - [ ] Clic charge messages précédents
   - [ ] Pagination infinie fonctionne

#### **Test Filtres & Conversations**

7. ✅ **Filtres sidebar**

   - [ ] "Tous" affiche toutes conversations
   - [ ] "Non lus" filtre messages non lus
   - [ ] "Archivés" filtre archivés
   - [ ] Badge compteur non-lus correct

8. ✅ **Sélection conversation**
   - [ ] Clic conversation change thread
   - [ ] Messages conversation s'affichent
   - [ ] Compteur non-lus se met à jour

---

## 👑 **Test Sequence Admin**

### **2. Page Messages Admin**

📍 URL : `http://localhost:3000/admin/messagerie`

#### **Test Vue Admin**

1. ✅ **Dashboard messages**

   - [ ] Vue globale tous messages site
   - [ ] Filtres avancés fonctionnent
   - [ ] Search par contenu/utilisateur

2. ✅ **Actions Admin**

   - [ ] Sélection multiple messages
   - [ ] "Marquer comme lu" en lot
   - [ ] "Archiver" en lot
   - [ ] "Supprimer" avec confirmation

3. ✅ **Export Données**

   - [ ] Bouton "Export CSV"
   - [ ] Download automatique fichier
   - [ ] Bouton "Export JSON"
   - [ ] Données exportées correctes

4. ✅ **Envoi Message Admin**
   - [ ] Composer nouveau message
   - [ ] Sélection destinataire
   - [ ] Message avec priorité
   - [ ] Envoi instantané

#### **Test Statistiques**

5. ✅ **Stats temps réel**
   - [ ] Compteurs messages jour/semaine
   - [ ] Utilisateurs actifs
   - [ ] Messages non-lus total
   - [ ] Refresh automatique stats

---

## 🔧 **Tests Techniques**

### **3. Robustesse & Performance**

#### **Test Erreurs Réseau**

1. ✅ **Simulations pannes**

   - [ ] Couper WiFi → erreur "Connexion perdue"
   - [ ] Message optimistic rollback
   - [ ] Bouton "Réessayer" fonctionne
   - [ ] Reconnexion auto-sync

2. ✅ **Validation Données**
   - [ ] Message > 2000 caractères bloqué
   - [ ] Fichier > 10MB refusé
   - [ ] Type fichier invalid refusé
   - [ ] Rate limit respecté (50 msg/h)

#### **Test Cache & Performance**

3. ✅ **React Query Cache**

   - [ ] F5 page → données persistantes 30s
   - [ ] Navigation retour → pas reload
   - [ ] Background refresh 5min
   - [ ] Cache invalidation après envoi

4. ✅ **Optimizations**
   - [ ] Pagination lazy load smooth
   - [ ] Scroll performance fluide
   - [ ] Upload progress bars réactives
   - [ ] UI responsive mobile/desktop

---

## 🐛 **Debug & Logs**

### **4. Console Debugging**

#### **Logs Attendus**

```javascript
// Messages API
🔗 Fetching messages from API
✅ Messages fetched: {count} messages
📤 Sending message: {content}
🔄 Optimistic update for: {message}
✅ Message sent successfully

// Erreurs
❌ Network error: {error}
⚠️ Rate limit reached
🔄 Retrying in 3s...
```

#### **Network Tab**

- [ ] `GET /api/messages` → 200 OK
- [ ] `POST /api/messages` → 201 Created
- [ ] `PATCH /api/messages/:id` → 200 OK
- [ ] `GET /api/messages/stats` → 200 OK
- [ ] Headers `Authorization: Bearer xxx`

---

## ✅ **Checklist Validation**

### **Frontend UX**

- [ ] 🎯 Optimistic updates instantanés
- [ ] 📱 Interface responsive
- [ ] 🔄 Gestion erreurs gracieuse
- [ ] ⚡ Performance scroll fluide
- [ ] 📎 Upload fichiers drag&drop
- [ ] 😊 Émojis et formatting
- [ ] 🔔 Badges notifications
- [ ] 🔍 Search et filtres

### **Backend Integration**

- [ ] 🔗 API REST endpoints connectés
- [ ] 🔐 JWT authentication working
- [ ] 📊 Statistiques temps réel
- [ ] 📁 Upload fichiers storage
- [ ] 🗄️ Database Prisma queries
- [ ] 🚦 Rate limiting respect
- [ ] 🛡️ CORS et sécurité

### **Admin Features**

- [ ] 👥 Vue globale messages
- [ ] 🔧 Actions administrateur
- [ ] 📈 Analytics et reports
- [ ] 📤 Export données CSV/JSON
- [ ] 🎛️ Filtres avancés
- [ ] ⚙️ Configuration système

---

## 🚀 **Résultats Attendus**

### **Performance Targets**

- Loading initial : < 2s
- Envoi message : < 500ms (optimistic)
- Upload fichier : progress visible
- Scroll pagination : < 100ms
- Search/filter : < 300ms

### **Compatibilité**

- ✅ Chrome/Firefox/Safari desktop
- ✅ Mobile iOS/Android
- ✅ Tablets responsive
- ✅ Accessibilité keyboard nav

---

## 🎉 **Validation Finale**

Si tous ces tests passent ✅, la migration est **100% réussie** !

Le système de messagerie frontend est prêt pour la production avec :

- Architecture robuste et scalable
- UX moderne et intuitive
- Administration complète
- Performance optimisée
- Sécurité et validation

**Félicitations ! 🎊**
