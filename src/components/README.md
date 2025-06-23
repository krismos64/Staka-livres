# 🏗️ Architecture des Composants - Staka Livres

## 📁 Organisation Modulaire Complète

Cette architecture suit les **bonnes pratiques SaaS** pour une codebase scalable et maintenable. Le frontend est maintenant quasi terminé avec une landing page complète et une application dashboard fonctionnelle.

### 🎯 Principes Appliqués

- **Séparation des responsabilités** : chaque dossier a un rôle spécifique
- **Réutilisabilité** : composants génériques vs spécifiques
- **Scalabilité** : structure qui grandit avec l'équipe
- **Maintenance** : imports/exports clairs et logiques
- **Performance** : composants optimisés et lazy loading ready

## 📂 Structure Complète des Dossiers

```
src/
├── components/           # Composants réutilisables
│   ├── billing/         # 💳 Facturation et paiements (7 composants)
│   ├── common/          # 🎭 Composants génériques (2 composants)
│   ├── forms/           # 📝 Formulaires réutilisables (3 composants)
│   ├── landing/         # 🌟 Landing page complète (14 composants + hooks)
│   ├── layout/          # 🏛️ Mise en page et structure (6 composants)
│   ├── messages/        # 💬 Système de messagerie (3 composants)
│   ├── modals/          # 🪟 Toutes les modales (8 composants)
│   └── project/         # 📚 Gestion des projets (2 composants)
├── pages/               # 📄 Pages principales (9 pages)
└── utils/               # 🛠️ Utilitaires
```

## 🌟 Module `landing/` - Landing Page Complète

### 🎨 Composants de Présentation

#### `Hero.tsx` - Section Héro

- **Rôle** : Section d'accueil principale avec CTA
- **Features** :
  - Titre principal avec gradient "manuscrit en livre professionnel"
  - Badge de notation "4.9/5 • 127 avis clients"
  - Statistiques d'expertise "15 ans • 1500+ auteurs"
  - Boutons CTA "10 pages gratuites" et "Calculer le prix"
  - Encart services avec puces vertes
  - Indicateurs de confiance en bas
- **Props** : Aucune (composant autonome)
- **État** : Statique avec animations CSS

#### `TrustIndicators.tsx` - Indicateurs de Confiance

- **Rôle** : Bande de confiance sous le Hero
- **Features** :
  - 6 indicateurs avec icônes : Service français, Sans IA, Données RGPD, etc.
  - Design responsive avec défilement horizontal sur mobile
  - Icônes FontAwesome colorées
- **Props** : Aucune
- **État** : Statique

#### `Testimonials.tsx` - Témoignages Clients

- **Rôle** : Témoignages et success stories
- **Features** :
  - Titre centré "Plus de 1500 auteurs nous ont fait confiance"
  - 6 témoignages avec photos, noms et citations
  - 3 success stories avec émojis et résultats
  - Grid responsive 2/3 colonnes
- **Props** : Aucune
- **État** : Données statiques des témoignages

#### `Excellence.tsx` - Standards de Qualité

- **Rôle** : Présentation des standards éditoriaux
- **Features** :
  - Titre "L'excellence éditoriale à votre service"
  - Long paragraphe sur les exigences qualité
  - Design avec fond blanc et centrage robuste
- **Props** : Aucune
- **État** : Contenu statique

### 🛠️ Composants Fonctionnels

#### `Services.tsx` - Présentation des Services

- **Rôle** : Catalogue des services avec consultation gratuite
- **Features** :
  - 4 services principaux avec icônes et descriptions
  - Section consultation gratuite avec créneaux horaires
  - Boutons interactifs "Réserver ce créneau"
  - Handlers JavaScript pour réservation et chat
- **Props** : Aucune
- **État** : Gestion des interactions utilisateur
- **Fonctions** :
  - `handleConsultationBooking()` - Simulation réservation
  - `handleTimeSlotClick()` - Sélection créneau
  - `handleExpertChatClick()` - Ouverture chat

#### `PricingCalculator.tsx` - Calculateur de Prix

- **Rôle** : Calculateur interactif avec tarification dégressive
- **Features** :
  - Slider de 10 à 500 pages avec prix dynamique
  - Tarification dégressive : 10 gratuites, puis 2€/page jusqu'à 300, puis 1€/page
  - Tableau de comparaison avec 3 colonnes de services
  - Boutons "Commander" et "Test gratuit" fonctionnels
  - Responsive design avec grid adaptatif
- **Props** : Aucune
- **État** : `pageCount` pour le calcul dynamique
- **Hooks** : `usePricing` pour la logique de calcul
- **Fonctions** :
  - `handleOrderClick()` - Commande avec prix calculé
  - `handleFreeTestClick()` - Navigation vers FreeSample
  - `handleExpertChatClick()` - Ouverture chat

#### `Packs.tsx` - Offres et Packs

- **Rôle** : Présentation des 3 packs principaux
- **Features** :
  - 3 cartes de packs : Correction, Intégral, KDP
  - Pack Intégral mis en avant avec badge "Le plus populaire"
  - Prix et descriptions détaillées
  - Section "Pas sûr de votre choix ?" avec bouton test gratuit
  - Design avec grid responsive et centrage parfait
- **Props** : Aucune
- **État** : Statique avec données des packs

#### `Blog.tsx` - Section Blog et Newsletter

- **Rôle** : Articles de blog et inscription newsletter
- **Features** :
  - 6 articles avec images, titres et descriptions
  - Formulaire newsletter avec validation email
  - Gestion d'état pour l'inscription
  - Messages de succès/erreur
  - Grid responsive 1/2/3 colonnes selon écran
- **Props** : Aucune
- **État** : `email`, `isSubmitted`, `isLoading`
- **Fonctions** :
  - `handleNewsletterSubmit()` - Inscription newsletter
  - Validation email en temps réel

#### `FreeSample.tsx` - Commande Gratuite

- **Rôle** : Formulaire de commande d'échantillon gratuit
- **Features** :
  - Formulaire complet : nom, email, téléphone, genre, description
  - Upload de fichier avec drag & drop
  - Validation en temps réel avec messages d'erreur
  - Progress bar d'upload simulée
  - CSRF token et sécurité
  - 3 success stories avec émojis
- **Props** : Aucune
- **État** : `formData`, `uploadProgress`, `isUploading`, `isSubmitted`
- **Fonctions** :
  - `handleSubmit()` - Envoi formulaire avec validation
  - `handleFileUpload()` - Gestion upload fichier
  - Validation des champs obligatoires

#### `About.tsx` - À Propos

- **Rôle** : Présentation de l'équipe et expertise
- **Features** :
  - Section "Qui sommes-nous ?" avec expertise détaillée
  - 4 points forts avec icônes et descriptions
  - 3 boutons d'action : Test gratuit, Contact, Réservation
  - Handlers pour interactions utilisateur
- **Props** : Aucune
- **État** : Interactions avec boutons
- **Fonctions** :
  - `handleChatClick()` - Ouverture chat
  - `handleBookingClick()` - Modal de réservation

#### `FAQ.tsx` - Questions Fréquentes

- **Rôle** : FAQ interactive avec accordéon
- **Features** :
  - 6 questions principales avec réponses détaillées
  - Système d'accordéon avec ouverture/fermeture
  - Icônes FontAwesome pour chaque question
  - Section d'aide supplémentaire avec boutons chat/contact
  - Design avec cartes blanches et ombres
- **Props** : Aucune
- **État** : `openItem` pour gérer l'accordéon
- **Interface** : `FAQItem` avec id, icon, question, answer, details
- **Fonctions** :
  - `toggleItem()` - Ouverture/fermeture accordéon

#### `Contact.tsx` - Formulaire de Contact

- **Rôle** : Formulaire de contact avec informations
- **Features** :
  - Formulaire : nom, email, sujet, message
  - Informations de contact : email, téléphone, horaires
  - Validation en temps réel
  - Messages de succès/erreur
  - Design en 2 colonnes responsive
- **Props** : Aucune
- **État** : `formData`, `isSubmitted`, `isLoading`
- **Fonctions** :
  - `handleSubmit()` - Envoi message avec validation

### 🎛️ Composants de Navigation

#### `Navigation.tsx` - Barre de Navigation

- **Rôle** : Navigation principale avec menu responsive
- **Features** :
  - Logo Staka Éditions avec icône livre
  - Menu desktop : Services, Packs, Témoignages, Blog, À propos, FAQ
  - Boutons : Chat (vert), Connexion (bleu), Contact (gris)
  - Menu mobile avec hamburger et overlay
  - Banner promo fermable "Offre limitée"
  - Sticky CTA bar en bas avec "10 pages gratuites"
- **Props** : `onLoginClick?: () => void`
- **État** : `isMobileMenuOpen`, `isPromoBannerVisible`
- **Fonctions** :
  - `handleLoginClick()` - Navigation vers page de connexion
  - `toggleMobileMenu()` - Ouverture/fermeture menu mobile
  - `closePromoBanner()` - Fermeture banner promo

#### `Footer.tsx` - Pied de Page

- **Rôle** : Footer complet avec liens et newsletter
- **Features** :
  - 4 colonnes : Services, Informations, Légal, Contact
  - Tous les liens de navigation et pages légales
  - Formulaire newsletter avec validation
  - Informations de contact complètes
  - Copyright et mentions légales
  - Design responsive avec grid adaptatif
- **Props** : Aucune
- **État** : `email`, `isSubmitted` pour newsletter
- **Fonctions** :
  - `handleNewsletterSubmit()` - Inscription newsletter

### 🔧 Hooks Personnalisés

#### `hooks/usePricing.ts` - Logique de Tarification

- **Rôle** : Hook pour calculs de prix avec tarification dégressive
- **Features** :
  - Calcul automatique selon nombre de pages
  - Règles : 10 gratuites, 2€ jusqu'à 300, 1€ au-delà
  - Formatage des prix en euros
  - Optimisé avec useMemo pour performance
- **Export** : `usePricing(pageCount: number)`
- **Return** : `{ totalPrice: string, formattedPrice: string }`

## 🏛️ Module `layout/` - Structure et Mise en Page

### `MainLayout.tsx` - Layout Principal Application

- **Rôle** : Layout principal pour l'application dashboard
- **Features** :
  - Header avec titre de page et menu utilisateur
  - Sidebar avec navigation principale
  - Zone de contenu principale avec children
  - Gestion responsive avec collapse sidebar
- **Props** : `pageTitle`, `onSectionChange`, `onLogout`, `activeSection`, `onNewProjectClick`, `children`

### `LayoutLanding.tsx` - Layout Landing Page

- **Rôle** : Layout spécifique pour la landing page
- **Features** :
  - Structure simplifiée sans sidebar
  - Optimisé pour SEO et performance
  - Gestion des métadonnées

### `Header.tsx` - En-tête Application

- **Rôle** : Header de l'application avec navigation
- **Features** :
  - Logo et titre de page
  - Menu utilisateur avec dropdown
  - Notifications et actions rapides

### `Sidebar.tsx` - Barre Latérale

- **Rôle** : Navigation latérale de l'application
- **Features** :
  - Menu principal avec icônes
  - Compteurs de notifications
  - Bouton "Nouveau projet"
  - État actif et hover

### `UserMenu.tsx` - Menu Utilisateur

- **Rôle** : Menu dropdown utilisateur
- **Features** :
  - Profil utilisateur avec avatar
  - Actions : Profil, Paramètres, Déconnexion
  - Design avec dropdown animé

### `ToastProvider.tsx` - Système de Notifications

- **Rôle** : Provider pour notifications toast
- **Features** :
  - Context pour notifications globales
  - Types : success, error, warning, info
  - Auto-dismiss configurable
  - Animations d'entrée/sortie

## 📝 Module `forms/` - Formulaires Réutilisables

### `LoginForm.tsx` - Formulaire de Connexion

- **Rôle** : Formulaire de connexion utilisateur
- **Features** :
  - Champs email et mot de passe
  - Validation en temps réel
  - Gestion des erreurs
  - Bouton "Se souvenir de moi"
- **Props** : `onLogin`, `onBackToLanding`

### `SignupForm.tsx` - Formulaire d'Inscription

- **Rôle** : Formulaire d'inscription utilisateur
- **Features** :
  - Champs complets : nom, email, mot de passe, confirmation
  - Validation des mots de passe
  - Conditions d'utilisation
  - Vérification email

### `MessageInput.tsx` - Saisie de Messages

- **Rôle** : Input pour saisie de messages
- **Features** :
  - Textarea avec auto-resize
  - Bouton d'envoi
  - Support des raccourcis clavier
  - Indicateur de frappe

## 🪟 Module `modals/` - Toutes les Modales

### `ModalNouveauProjet.tsx` - Création de Projet

- **Rôle** : Modal de création de nouveau projet
- **Features** :
  - Formulaire complet : titre, type, pages, pack, description
  - 3 packs avec sélection visuelle
  - Upload de fichier manuscrit
  - Validation et soumission
  - Design large et responsive
- **Props** : `open`, `onClose`
- **État** : Tous les champs du formulaire

### `ProjectDetailsModal.tsx` - Détails de Projet

- **Rôle** : Affichage détaillé d'un projet
- **Features** :
  - Informations complètes du projet
  - Statut et progression
  - Actions disponibles
  - Historique des modifications

### `EditProjectModal.tsx` - Édition de Projet

- **Rôle** : Modal d'édition de projet existant
- **Features** :
  - Formulaire pré-rempli
  - Modification des paramètres
  - Sauvegarde des changements

### `DeleteProjectModal.tsx` - Suppression de Projet

- **Rôle** : Confirmation de suppression
- **Features** :
  - Message de confirmation
  - Avertissement sur la perte de données
  - Actions Annuler/Confirmer

### `RateProjectModal.tsx` - Notation de Projet

- **Rôle** : Modal de notation et avis
- **Features** :
  - Système d'étoiles
  - Commentaire optionnel
  - Soumission de l'avis

### `AvatarUploadModal.tsx` - Upload d'Avatar

- **Rôle** : Modal d'upload et crop d'avatar
- **Features** :
  - Upload d'image
  - Crop et redimensionnement
  - Prévisualisation

### `DeleteAccountModal.tsx` - Suppression de Compte

- **Rôle** : Suppression définitive du compte
- **Features** :
  - Avertissements de sécurité
  - Confirmation par mot de passe
  - Processus en plusieurs étapes

### `DeactivateAccountModal.tsx` - Désactivation de Compte

- **Rôle** : Désactivation temporaire
- **Features** :
  - Options de désactivation
  - Conservation des données
  - Réactivation possible

## 💳 Module `billing/` - Facturation et Paiements

### `CurrentInvoiceCard.tsx` - Facture Actuelle

- **Rôle** : Affichage de la facture en cours
- **Features** :
  - Montant et échéance
  - Statut de paiement
  - Actions de paiement

### `InvoiceHistoryCard.tsx` - Historique des Factures

- **Rôle** : Liste des factures passées
- **Features** :
  - Tableau avec tri et filtres
  - Téléchargement PDF
  - Statuts de paiement

### `InvoiceDetailsModal.tsx` - Détails de Facture

- **Rôle** : Détail complet d'une facture
- **Features** :
  - Lignes de facturation
  - Calculs détaillés
  - Actions sur la facture

### `PaymentMethodsCard.tsx` - Méthodes de Paiement

- **Rôle** : Gestion des moyens de paiement
- **Features** :
  - Cartes enregistrées
  - Ajout/suppression de cartes
  - Méthode par défaut

### `PaymentModal.tsx` - Modal de Paiement

- **Rôle** : Processus de paiement
- **Features** :
  - Formulaire de carte bancaire
  - Validation sécurisée
  - Confirmation de paiement

### `AnnualSummaryCard.tsx` - Résumé Annuel

- **Rôle** : Bilan financier annuel
- **Features** :
  - Graphiques de dépenses
  - Statistiques détaillées
  - Export des données

### `SupportCard.tsx` - Support Client

- **Rôle** : Accès au support pour la facturation
- **Features** :
  - Contacts support
  - FAQ facturation
  - Tickets de support

## 💬 Module `messages/` - Système de Messagerie

### `ConversationList.tsx` - Liste des Conversations

- **Rôle** : Sidebar avec toutes les conversations
- **Features** :
  - Liste des contacts
  - Indicateurs de messages non lus
  - Recherche de conversations
  - Tri par date

### `MessageThread.tsx` - Fil de Conversation

- **Rôle** : Affichage des messages d'une conversation
- **Features** :
  - Messages avec timestamps
  - Indicateurs de lecture
  - Scroll automatique
  - Chargement des anciens messages

### `MessageItem.tsx` - Élément de Message

- **Rôle** : Composant individuel pour chaque message
- **Features** :
  - Avatar et nom expéditeur
  - Contenu du message
  - Timestamp formaté
  - Actions sur le message

## 📚 Module `project/` - Gestion des Projets

### `ProjectCard.tsx` - Carte de Projet

- **Rôle** : Carte affichant un projet avec toutes ses actions
- **Features** :
  - Informations du projet : titre, type, statut, progression
  - Actions : voir détails, éditer, supprimer, noter
  - Design avec badges de statut colorés
  - Hover effects et animations

### `RecentActivity.tsx` - Activité Récente

- **Rôle** : Timeline des activités récentes
- **Features** :
  - Liste chronologique des actions
  - Icônes selon le type d'activité
  - Timestamps relatifs
  - Filtrage par type

## 🎭 Module `common/` - Composants Génériques

### `EmptyState.tsx` - États Vides

- **Rôle** : Composant réutilisable pour états vides
- **Features** :
  - Icône et message personnalisables
  - Bouton d'action optionnel
  - Design cohérent dans toute l'app
- **Props** : `icon`, `title`, `description`, `actionText`, `onAction`

### `Notifications.tsx` - Système de Notifications

- **Rôle** : Composant de notifications globales
- **Features** :
  - Types multiples : success, error, warning, info
  - Auto-dismiss configurable
  - Position personnalisable
  - Animations fluides

## 📄 Pages Principales

### `LandingPage.tsx` - Page d'Accueil

- **Rôle** : Page d'accueil publique complète
- **Features** :
  - Assemblage de tous les composants landing
  - Bouton WhatsApp flottant avec animation pulse
  - Navigation vers page de connexion
  - SEO optimisé

### `LoginPage.tsx` - Page de Connexion

- **Rôle** : Authentification utilisateur
- **Features** :
  - Formulaire de connexion
  - Lien vers inscription
  - Retour vers landing page

### `DashboardPage.tsx` - Tableau de Bord

- **Rôle** : Page principale de l'application
- **Features** :
  - Vue d'ensemble des projets
  - Statistiques utilisateur
  - Actions rapides
  - Activité récente

### `ProjectsPage.tsx` - Gestion des Projets

- **Rôle** : Page de gestion complète des projets
- **Features** :
  - Liste/grille des projets
  - Filtres et tri
  - Création de nouveau projet
  - Actions en lot

### `MessagesPage.tsx` - Messagerie

- **Rôle** : Interface de messagerie complète
- **Features** :
  - Vue 3 colonnes : conversations, messages, détails
  - Chat en temps réel
  - Gestion des pièces jointes

### `BillingPage.tsx` - Facturation

- **Rôle** : Gestion financière complète
- **Features** :
  - Factures courantes et historique
  - Méthodes de paiement
  - Résumés financiers

### `FilesPage.tsx` - Gestion des Fichiers

- **Rôle** : Gestionnaire de fichiers complet
- **Features** :
  - Upload multiple avec drag & drop
  - Prévisualisation des fichiers
  - Organisation en dossiers
  - Partage et permissions

### `ProfilPage.tsx` - Profil Utilisateur

- **Rôle** : Gestion du profil utilisateur
- **Features** :
  - Informations personnelles
  - Avatar et préférences
  - Historique d'activité

### `SettingsPage.tsx` - Paramètres

- **Rôle** : Configuration de l'application
- **Features** :
  - Préférences utilisateur
  - Paramètres de notification
  - Sécurité et confidentialité

### `HelpPage.tsx` - Aide et Support

- **Rôle** : Centre d'aide complet
- **Features** :
  - FAQ détaillée
  - Guides d'utilisation
  - Contact support

## 🚀 Patterns et Bonnes Pratiques

### 🎯 **Conventions de Naming**

- **Composants** : PascalCase (`ProjectCard.tsx`, `LoginForm.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`usePricing.ts`)
- **Props interfaces** : Nom du composant + `Props` (`ProjectCardProps`)
- **Dossiers** : kebab-case (`landing/`, `billing/`)

### 🔄 **Patterns d'État**

- **useState** pour état local simple
- **useReducer** pour état complexe avec actions multiples
- **Context** pour état global (ToastProvider)
- **Custom hooks** pour logique réutilisable (usePricing)

### 📦 **Patterns d'Import/Export**

```tsx
// Export par défaut pour le composant principal
export default function ProjectCard({ ... }: ProjectCardProps) { ... }

// Export nommé pour les interfaces et types
export interface ProjectCardProps { ... }
export type ProjectStatus = 'draft' | 'in-progress' | 'completed';

// Imports organisés par catégorie
import React, { useState, useEffect } from 'react';
import { ProjectCardProps } from './types';
import { useToast } from '../layout/ToastProvider';
```

### 🎨 **Patterns de Styling**

- **Tailwind CSS** pour tous les styles
- **Classes conditionnelles** avec template literals
- **Responsive design** avec préfixes `sm:`, `md:`, `lg:`
- **Animations** avec classes Tailwind (`animate-pulse`, `transition-all`)

### 🔒 **Patterns de Sécurité**

- **CSRF tokens** dans tous les formulaires
- **Validation côté client** avec messages d'erreur
- **Sanitization** des inputs utilisateur
- **Rate limiting** pour les soumissions de formulaires

## 📈 Métriques de Performance

### 📊 **Statistiques Actuelles**

- **Total composants** : 50+ composants réutilisables
- **Pages** : 9 pages principales complètes
- **Hooks personnalisés** : 1 hook de pricing (extensible)
- **Modales** : 8 modales pour toutes les interactions
- **Formulaires** : 7 formulaires avec validation complète

### ⚡ **Optimisations Appliquées**

- **Lazy loading ready** : structure modulaire
- **Bundle splitting** : séparation landing/app
- **Memoization** : useMemo dans usePricing
- **Event handlers** : optimisés pour éviter re-renders
- **Images** : optimisées et responsive

---

## 🏆 Conclusion

Cette architecture modulaire offre une base solide pour une application SaaS complète avec :

- **Landing page marketing** complète et optimisée
- **Application dashboard** fonctionnelle avec toutes les features
- **Système de design** cohérent avec Tailwind CSS
- **Performance** optimisée et scalable
- **Maintenabilité** élevée avec séparation claire des responsabilités

Le frontend est maintenant **quasi terminé** avec tous les composants essentiels implémentés et une expérience utilisateur complète de la landing page jusqu'aux fonctionnalités avancées de l'application.
