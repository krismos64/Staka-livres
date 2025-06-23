# Composants Landing Page

Ce dossier contiendra tous les composants de la landing page Staka Éditions.

## Structure prévue

### Composants principaux

- `Hero.tsx` - Section hero avec titre, CTA et éléments visuels
- `TrustIndicators.tsx` - Badges de confiance (100% français, sans IA, etc.)
- `Testimonials.tsx` - Témoignages clients avec étoiles et stats
- `Excellence.tsx` - Section standards et garanties
- `Services.tsx` - Présentation des services (correction, design, etc.)
- `PricingCalculator.tsx` - Calculateur de prix intelligent
- `Packs.tsx` - Présentation des différents packs
- `Blog.tsx` - Articles et conseils d'experts
- `FreeSample.tsx` - Formulaire pour les 10 pages gratuites
- `About.tsx` - Section "Qui sommes-nous"
- `FAQ.tsx` - Questions fréquentes
- `Contact.tsx` - Formulaire de contact et infos
- `Footer.tsx` - Pied de page avec liens et contacts

### Composants utilitaires

- `Navigation.tsx` - Barre de navigation avec menu mobile
- `StickyBar.tsx` - Barre CTA flottante
- `ChatWidget.tsx` - Widget de chat en direct
- `BookingModal.tsx` - Modal de réservation de consultation

### Hooks et utilitaires

- `usePricing.ts` - Logique de calcul des prix
- `useScrollEffects.ts` - Effets de scroll et animations
- `useFormHandling.ts` - Gestion des formulaires et validation

## Migration depuis la maquette

Le fichier `maquette/index.html` contient tout le HTML/CSS/JS de la landing page.
Chaque section sera progressivement extraite et convertie en composants React.

## État actuel

- ✅ `LandingPage.tsx` créé avec Hero section
- ✅ `LayoutLanding.tsx` créé (layout minimal)
- 🚧 Sections restantes à migrer (voir liste dans LandingPage.tsx)

## Prochaines étapes

1. Extraire le Hero en composant dédié
2. Créer les composants section par section
3. Implémenter les interactions JavaScript
4. Optimiser les performances
5. Tests et validation
