# 🏗️ Architecture des Composants - Staka Livres

## 📁 Organisation Modulaire

Cette architecture suit les **bonnes pratiques SaaS** pour une codebase scalable et maintenable.

### 🎯 Principes Appliqués

- **Séparation des responsabilités** : chaque dossier a un rôle spécifique
- **Réutilisabilité** : composants génériques vs spécifiques
- **Scalabilité** : structure qui grandit avec l'équipe
- **Maintenance** : imports/exports clairs et logiques

## 📂 Structure des Dossiers

```
src/
├── components/           # Composants réutilisables
│   ├── billing/         # 💳 Composants spécifiques à la facturation
│   ├── forms/           # 📝 Formulaires réutilisables
│   ├── layout/          # 🏛️ Composants de mise en page
│   ├── messages/        # 💬 Composants de messagerie
│   ├── modals/          # 🪟 Toutes les modales
│   ├── project/         # 📚 Composants liés aux projets
│   ├── EmptyState.tsx   # 🎭 États vides génériques
│   ├── Notifications.tsx # 🔔 Système de notifications
│   └── RecentActivity.tsx # ⏰ Activité récente
└── pages/               # 📄 Composants représentant des pages
    ├── Dashboard.tsx
    ├── LoginPage.tsx
    └── ...
```

## 🔧 Détail des Modules

### 💳 `billing/`

Composants spécifiques à la facturation et aux paiements :

- `AnnualSummaryCard` - Résumé annuel
- `CurrentInvoiceCard` - Facture en cours
- `InvoiceDetailsModal` - Détails de facture
- `InvoiceHistoryCard` - Historique des factures
- `PaymentMethodsCard` - Méthodes de paiement
- `PaymentModal` - Modal de paiement
- `SupportCard` - Support client

### 📝 `forms/`

Formulaires réutilisables dans toute l'app :

- `LoginForm` - Connexion utilisateur
- `SignupForm` - Inscription utilisateur
- `MessageInput` - Saisie de messages

### 🏛️ `layout/`

Composants structurels de l'interface :

- `Header` - En-tête principal
- `MainLayout` - Layout principal
- `Sidebar` - Barre latérale de navigation
- `ToastProvider` - Système de notifications toast
- `UserMenu` - Menu utilisateur

### 💬 `messages/`

Système de messagerie complet :

- `ConversationList` - Liste des conversations
- `MessageItem` - Élément de message individuel
- `MessageThread` - Fil de conversation

### 🪟 `modals/`

Toutes les modales de l'application :

- `AvatarUploadModal` - Upload d'avatar
- `DeactivateAccountModal` - Désactivation de compte
- `DeleteAccountModal` - Suppression de compte
- `DeleteProjectModal` - Suppression de projet
- `EditProjectModal` - Édition de projet
- `ModalNouveauProjet` - Création de projet
- `ProjectDetailsModal` - Détails de projet
- `RateProjectModal` - Notation de projet

### 📚 `project/`

Composants liés aux projets :

- `ProjectCard` - Carte de projet avec toutes les actions

### 🎭 Composants Génériques

À la racine de `components/` :

- `EmptyState` - États vides réutilisables
- `Notifications` - Notifications système
- `RecentActivity` - Activité récente utilisateur

## 🔄 Imports Types

### ✅ Bonnes Pratiques d'Import

```tsx
// Depuis une page vers un composant
import ProjectCard from "../components/project/ProjectCard";
import { useToast } from "../components/layout/ToastProvider";

// Depuis un composant vers un autre composant
import MessageItem from "./MessageItem"; // Même dossier
import UserMenu from "../layout/UserMenu"; // Autre dossier
import EmptyState from "../EmptyState"; // Racine components

// Depuis un composant vers une page (pour les types)
import { Project } from "../../pages/ProjectsPage";
```

### 🎯 Patterns de Naming

- **PascalCase** pour tous les composants : `ProjectCard.tsx`
- **Dossiers en lowercase** : `forms/`, `modals/`
- **Interfaces** avec suffixe `Props` : `ProjectCardProps`
- **Types** exportés depuis les pages correspondantes

## 🚀 Avantages de cette Architecture

### 👥 **Pour l'Équipe**

- **Onboarding rapide** : structure claire et intuitive
- **Collaboration efficace** : pas de conflits sur l'organisation des fichiers
- **Code reviews facilités** : changements localisés dans les bons modules

### 🔧 **Pour la Maintenance**

- **Debugging rapide** : on sait où chercher les bugs
- **Refactoring sécurisé** : impacts limités et prévisibles
- **Tests ciblés** : tests par domaine fonctionnel

### 📈 **Pour la Scalabilité**

- **Ajout de features** : nouveau dossier = nouveau domaine
- **Lazy loading** : chargement par module possible
- **Micro-frontends ready** : modules autonomes

## 🎨 Exemples d'Usage

### Créer un nouveau composant de formulaire

```bash
# Créer dans forms/
touch src/components/forms/ContactForm.tsx
```

### Ajouter une nouvelle modale

```bash
# Créer dans modals/
touch src/components/modals/ConfirmActionModal.tsx
```

### Nouveau domaine fonctionnel

```bash
# Créer un nouveau module
mkdir src/components/analytics/
touch src/components/analytics/ChartCard.tsx
```

## 📚 Standards d'Équipe

### 🔒 **Règles à Respecter**

1. **Un composant = un fichier** `.tsx`
2. **Export default** pour le composant principal
3. **Interfaces définies** dans le même fichier que le composant
4. **Types partagés** exportés depuis les pages correspondantes
5. **Imports absolus** préférés aux imports relatifs profonds

### ✨ **Recommandations**

- Préférer `async/await` aux callbacks
- Utiliser les modules ES (import/export)
- Composants génériques dans `/components`
- Composants spécifiques dans des sous-dossiers thématiques

---
