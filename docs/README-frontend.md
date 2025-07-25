# 🎨 Frontend React Staka Livres - Guide Technique Complet

![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4.17-cyan)
![Vite](https://img.shields.io/badge/Vite-5.0.8-purple)
![React Query](https://img.shields.io/badge/React%20Query-5.81.5-red)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12.23.0-pink)
![Tests](https://img.shields.io/badge/Tests-85%25%20Coverage-brightgreen)
![Production](https://img.shields.io/badge/Status-Production%20Ready-green)
![OVH](https://img.shields.io/badge/Deployed-OVH%20Cloud-blue)

**📅 Mis à jour le 25 juillet 2025 par Christophe Mostefaoui**

---

## 📋 **Vue d'ensemble**

Frontend React pour **Staka Livres**, plateforme professionnelle de correction de manuscrits déployée en production sur **OVH Cloud** via SSH et Docker. Architecture moderne avec React 18, TypeScript, Tailwind CSS, React Query et système de tests séparés CI/CD vs local.

### 🏆 **Métriques Frontend (25 Juillet 2025)**

| Composant            | Détail                                             | Statut        |
| -------------------- | -------------------------------------------------- | ------------- |
| **⚛️ Composants**    | 71 composants modulaires TypeScript                | ✅ Production |
| **🎣 Hooks**         | 31 hooks personnalisés React Query                 | ✅ Optimisés  |
| **📄 Pages**         | 28 pages complètes responsive                      | ✅ Production |
| **🧪 Tests**         | 9 fichiers + architecture séparée (85% couverture) | ✅ Robustes   |
| **🔍 Tests E2E**     | 19 tests Cypress 3 niveaux                         | ✅ Enterprise |
| **🎨 Design System** | Tailwind + Framer Motion + accessibilité           | ✅ Moderne    |
| **🚀 Performance**   | Lazy loading + code splitting + cache              | ✅ Optimisé   |
| **🐳 Déploiement**   | OVH Cloud + Docker + Nginx proxy                   | ✅ Production |

---

## 🏗️ **Architecture Technique**

### 📁 **Structure Frontend**

```
frontend/
├── src/
│   ├── components/                 # 71 composants modulaires
│   │   ├── admin/                 # 12 composants administration
│   │   │   ├── AdminLayout.tsx    # Layout admin moderne sidebar
│   │   │   ├── RequireAdmin.tsx   # Protection routes admin
│   │   │   ├── DemoModeProvider.tsx # Mode démonstration pro
│   │   │   ├── UserTable.tsx      # Table utilisateurs WCAG
│   │   │   ├── SearchAndFilters.tsx # Recherche avancée
│   │   │   ├── ConfirmationModals.tsx # Modales RGPD
│   │   │   └── ... (6 autres composants)
│   │   ├── billing/               # 8 composants facturation
│   │   │   ├── CurrentInvoiceCard.tsx # Facture courante
│   │   │   ├── InvoiceHistoryCard.tsx # Historique
│   │   │   ├── PaymentMethodsCard.tsx # Moyens paiement
│   │   │   ├── PaymentModal.tsx   # Modal paiement Stripe
│   │   │   └── ... (4 autres composants)
│   │   ├── common/                # 8 composants génériques
│   │   │   ├── Notifications.tsx  # Clochette notifications
│   │   │   ├── LoadingSpinner.tsx # Spinners loading
│   │   │   ├── ErrorBoundary.tsx  # Gestion erreurs React
│   │   │   └── ... (5 autres composants)
│   │   ├── forms/                 # 6 composants formulaires
│   │   │   ├── LoginForm.tsx      # Formulaire connexion
│   │   │   ├── SignupForm.tsx     # Formulaire inscription
│   │   │   ├── ContactForm.tsx    # Formulaire contact
│   │   │   └── ... (3 autres composants)
│   │   ├── landing/               # 14 composants landing page
│   │   │   ├── Hero.tsx           # Section héro principale
│   │   │   ├── Navigation.tsx     # Navigation sticky
│   │   │   ├── PricingCalculator.tsx # Calculateur tarifs
│   │   │   ├── FreeSample.tsx     # Échantillon gratuit
│   │   │   ├── Contact.tsx        # Section contact
│   │   │   └── ... (9 autres composants)
│   │   ├── layout/                # 8 composants structure
│   │   │   ├── Header.tsx         # En-tête application
│   │   │   ├── Sidebar.tsx        # Barre latérale
│   │   │   ├── Footer.tsx         # Pied de page
│   │   │   └── ... (5 autres composants)
│   │   ├── messages/              # 6 composants messagerie
│   │   │   ├── ConversationList.tsx # Liste conversations
│   │   │   ├── MessageThread.tsx  # Thread messages
│   │   │   ├── MessageItem.tsx    # Affichage message
│   │   │   └── ... (3 autres composants)
│   │   ├── modals/                # 9 composants modales
│   │   │   ├── ConsultationModal.tsx # Réservation consultation
│   │   │   ├── PaymentModal.tsx   # Modal paiement
│   │   │   ├── ConfirmModal.tsx   # Confirmations
│   │   │   └── ... (6 autres composants)
│   │   └── project/               # 4 composants projets
│   │       ├── FileItem.tsx       # Affichage fichier
│   │       ├── UploadButton.tsx   # Upload S3
│   │       └── ... (2 autres composants)
│   ├── hooks/                     # 31 hooks React Query
│   │   ├── useAuth.ts             # Authentification JWT
│   │   ├── useAdminUsers.ts       # Gestion utilisateurs admin
│   │   ├── useAdminCommandes.ts   # Gestion commandes admin
│   │   ├── useAdminStats.ts       # Statistiques temps réel
│   │   ├── useNotifications.ts    # Notifications polling
│   │   ├── useMessages.ts         # Messagerie client
│   │   ├── useInvoices.ts         # Facturation
│   │   ├── usePricing.ts          # Tarification dynamique
│   │   └── ... (23 autres hooks)
│   ├── pages/                     # 28 pages complètes
│   │   ├── admin/                 # 10 pages administration
│   │   │   ├── AdminDashboard.tsx # Dashboard KPIs
│   │   │   ├── AdminUtilisateurs.tsx # Gestion utilisateurs
│   │   │   ├── AdminCommandes.tsx # Gestion commandes
│   │   │   ├── AdminFactures.tsx  # Gestion factures
│   │   │   ├── AdminStatistiques.tsx # Analytics
│   │   │   ├── AdminAuditLogs.tsx # Logs audit
│   │   │   └── ... (4 autres pages admin)
│   │   ├── LandingPage.tsx        # Page d'accueil marketing
│   │   ├── LoginPage.tsx          # Page connexion
│   │   ├── SignupPage.tsx         # Page inscription
│   │   ├── DashboardPage.tsx      # Dashboard client
│   │   ├── BillingPage.tsx        # Page facturation
│   │   ├── MessagesPage.tsx       # Page messagerie
│   │   ├── NotificationsPage.tsx  # Page notifications
│   │   ├── HelpPage.tsx           # Page aide client
│   │   └── ... (10 autres pages)
│   ├── contexts/                  # Contextes React
│   │   ├── AuthContext.tsx        # Contexte authentification
│   │   └── ThemeContext.tsx       # Contexte thème
│   ├── utils/                     # Utilitaires
│   │   ├── api.ts                 # Client API Axios
│   │   ├── auth.ts                # Helpers authentification
│   │   ├── toast.ts               # Notifications toast
│   │   └── formatting.ts          # Formatage données
│   ├── types/                     # Types TypeScript
│   │   ├── shared.ts              # Types partagés
│   │   ├── api.ts                 # Types API
│   │   └── components.ts          # Types composants
│   └── styles/                    # Styles globaux
│       ├── globals.css            # CSS global + Tailwind
│       └── components.css         # Styles composants
├── public/                        # Assets statiques
│   ├── images/                    # Images optimisées
│   └── icons/                     # Icônes SVG
├── tests/                         # Tests (architecture séparée)
│   ├── integration/               # Tests intégration (local)
│   └── __mocks__/                 # Mocks tests
├── cypress/                       # Tests E2E (19 tests)
│   ├── e2e/
│   │   ├── critical/              # Tests critiques CI/CD
│   │   ├── smoke/                 # Health checks
│   │   └── integration/           # Tests complets local
│   ├── fixtures/                  # Données test
│   └── support/                   # Commands Cypress
├── vite.config.ts                 # Config Vite (CI/CD)
├── vite.config.integration.ts     # Config intégration (local)
├── tailwind.config.js             # Configuration Tailwind
├── cypress.config.cjs             # Config Cypress standard
├── cypress.config.critical.cjs    # Config CI/CD optimisée
├── cypress.config.smoke.cjs       # Config health checks
├── Dockerfile                     # Container production
├── nginx.conf                     # Configuration Nginx
└── package.json                   # Dépendances et scripts
```

### 🛠️ **Stack Technique**

#### **Framework & Runtime**

- **React 18.2.0** : Framework JavaScript avec Concurrent Features
- **TypeScript 5.3.3** : Typage statique strict pour robustesse
- **Vite 5.0.8** : Build tool ultra-rapide avec HMR optimisé

#### **State Management & Data**

- **@tanstack/react-query 5.81.5** : Cache intelligent et état serveur
- **React Context** : État global authentification et thème
- **Local Storage** : Persistance données utilisateur

#### **Styling & UI**

- **Tailwind CSS 3.4.17** : Framework CSS utility-first
- **Framer Motion 12.23.0** : Animations fluides et micro-interactions
- **Lucide React 0.525.0** : Icônes vectorielles modernes
- **React Hot Toast 2.5.2** : Notifications toast élégantes

#### **Routing & Navigation**

- **React Router DOM 6.30.1** : Navigation SPA avec lazy loading
- **Protected Routes** : Authentification et rôles

#### **HTTP & API**

- **Axios 1.10.0** : Client HTTP avec intercepteurs
- **React Query DevTools** : Debug cache et queries

#### **File Upload & Media**

- **React Dropzone 14.3.8** : Upload drag & drop
- **AWS S3 Integration** : Upload direct avec URLs présignées

#### **Forms & Validation**

- **React Hook Form** : Gestion formulaires performante
- **Zod Integration** : Validation côté client

#### **Testing & Quality**

- **Vitest 3.2.4** : Framework tests unitaires ultra-rapide
- **Cypress 14.5.1** : Tests E2E avec architecture 3 niveaux
- **Testing Library** : Tests composants React
- **ESLint + Prettier** : Qualité code et formatage

---

## 🧪 **Architecture de Tests Séparée (Innovation Juillet 2025)**

### 🎯 **Tests Séparés CI/CD vs Local**

**Innovation majeure** : Séparation complète entre tests unitaires (CI/CD) et tests intégration (développement local) pour stabilité maximale.

#### 🚀 **Tests Unitaires (CI/CD optimisé)**

```bash
# Configuration : vite.config.ts (exclusion intégration)
npm run test:unit        # Tests unitaires uniquement
# ✅ Durée : < 2 minutes
# ✅ Environnement : jsdom + mocks complets
# ✅ CI/CD : GitHub Actions stable
# ✅ Cible : Composants, hooks, utils isolés
```

**Configuration Vite CI/CD :**

```typescript
// vite.config.ts - Tests unitaires CI/CD
export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: [
      "node_modules",
      "dist",
      "build",
      "**/tests/integration/**", // Exclusion CI/CD
      "tests/integration/**",
      "**/cypress/**",
    ],
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      reporter: ["text", "json-summary", "html"],
      exclude: ["tests/integration/**"],
    },
  },
});
```

#### 🔧 **Tests Intégration (Local avec backend)**

```bash
# Configuration : vite.config.integration.ts (complet)
npm run test:integration # Tests avec API réelle
npm run test:all         # Suite complète
# ✅ Durée : 3-5 minutes
# ✅ Environnement : backend requis
# ✅ Usage : développement local
# ✅ Cible : Workflows complets, API calls
```

**Configuration Vite Intégration :**

```typescript
// vite.config.integration.ts - Tests complets local
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["**/*.{test,spec}.{js,ts,jsx,tsx}"], // Tous inclus
    testTimeout: 30000, // Plus long pour intégration
    hookTimeout: 30000,
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      reporter: ["text", "json-summary", "html"],
    },
  },
});
```

### 🎪 **Tests E2E Cypress (3 niveaux)**

#### 1. **Tests Critiques** (CI/CD - < 2min)

```bash
cypress/e2e/critical/
├── auth.cy.ts              # Authentification (15 tests)
├── landing.cy.ts           # Page accueil (12 tests)
├── admin-basic.cy.ts       # Interface admin (8 tests)
├── payment-essential.cy.ts # Paiements critiques (18 tests)
└── payment-errors.cy.ts    # Gestion erreurs (20 tests)

npm run test:e2e:critical   # Tests essentiels uniquement
```

#### 2. **Tests Smoke** (Health checks - < 30s)

```bash
cypress/e2e/smoke/
└── health-check.cy.ts      # Santé application (12 tests)

npm run test:e2e:smoke      # Vérifications ultra-rapides
```

#### 3. **Tests Intégration** (Local/Staging - < 10min)

```bash
cypress/e2e/integration/
├── admin-users-advanced.cy.ts    # CRUD utilisateurs complet
├── stripe-webhooks-advanced.cy.ts # Webhooks Stripe complets
├── end-to-end-workflow.cy.ts     # Workflow client → livraison
└── payment-flow-complete.cy.ts   # Paiements Stripe avancés

npm run test:e2e:local      # Tests complets avec backend
```

### 📊 **Métriques Tests**

| Suite Tests           | Durée    | Couverture | Environnement  | Statut          |
| --------------------- | -------- | ---------- | -------------- | --------------- |
| **Unit Tests**        | 1-2 min  | 85%        | jsdom + mocks  | ✅ Stable       |
| **Integration Tests** | 3-5 min  | 90%        | Backend requis | ✅ Stable       |
| **E2E Critical**      | < 2 min  | 95%        | Docker stack   | ✅ Optimisé     |
| **E2E Smoke**         | < 30s    | 92%        | Basic stack    | ✅ Ultra-rapide |
| **E2E Integration**   | < 10 min | 90%        | Full stack     | ✅ Complet      |

---

## ⚛️ **Composants Architecture**

### 🏗️ **Design System & Composants UI**

#### **Composants de Base** (`components/ui/`)

```typescript
// LoadingSpinner.tsx - Spinner réutilisable
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
  text,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const colorClasses = {
    primary: "text-blue-600",
    secondary: "text-gray-600",
    white: "text-white",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
      >
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
};
```

#### **Système de Notifications** (`components/common/Notifications.tsx`)

```typescript
// Hook notifications avec polling
const useNotifications = () => {
  const { data: notifications, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await axios.get("/api/notifications");
      return response.data;
    },
    refetchInterval: 15000, // Polling 15 secondes
    staleTime: 10000,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await axios.get("/api/notifications/unread-count");
      return response.data.count;
    },
    refetchInterval: 15000,
  });

  return { notifications, unreadCount, refetch };
};

// Composant clochette notifications
const Notifications: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50"
          >
            <div className="p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications?.map((notification: any) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

### 👨‍💼 **Composants Administration**

#### **Layout Admin** (`components/admin/AdminLayout.tsx`)

```typescript
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: HomeIcon },
    { name: "Utilisateurs", href: "/admin/users", icon: UsersIcon },
    { name: "Commandes", href: "/admin/commandes", icon: ClipboardListIcon },
    { name: "Factures", href: "/admin/factures", icon: DocumentTextIcon },
    { name: "Statistiques", href: "/admin/stats", icon: ChartBarIcon },
    { name: "Audit Logs", href: "/admin/audit", icon: ShieldCheckIcon },
    { name: "Messagerie", href: "/admin/messages", icon: InboxIcon },
    { name: "FAQ", href: "/admin/faq", icon: QuestionMarkCircleIcon },
    { name: "Tarifs", href: "/admin/tarifs", icon: CurrencyEuroIcon },
    { name: "Pages", href: "/admin/pages", icon: DocumentIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex items-center justify-center h-16 bg-gray-800">
          <h1 className="text-white text-xl font-bold">📚 Staka Admin</h1>
        </div>

        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4">
              <Notifications />
              <UserMenu user={user} />
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
```

#### **Table Utilisateurs WCAG** (`components/admin/UserTable.tsx`)

```typescript
interface UserTableProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onRoleChange: (userId: string, role: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onEdit,
  onDelete,
  onRoleChange,
}) => {
  if (loading) {
    return <LoadingSpinner size="lg" text="Chargement des utilisateurs..." />;
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="min-w-full divide-y divide-gray-200"
        role="table"
        aria-label="Tableau des utilisateurs"
      >
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Utilisateur
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Rôle
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Statut
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Inscription
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.prenom} {user.nom}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge isActive={user.isActive} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(user.createdAt), "dd/MM/yyyy")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <ActionButtons
                  user={user}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRoleChange={onRoleChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 🎨 **Landing Page Components**

#### **Hero Section** (`components/landing/Hero.tsx`)

```typescript
const Hero: React.FC = () => {
  const { data: pricing } = usePricing();

  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] bg-repeat" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Transformez votre manuscrit en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              chef-d'œuvre
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Services professionnels de correction et d'édition pour auteurs
            exigeants. Expertise reconnue, délais respectés, qualité garantie.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-shadow"
              onClick={() =>
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Découvrir nos tarifs
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition-colors"
              onClick={() =>
                document
                  .getElementById("free-sample")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Échantillon gratuit
            </motion.button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <span>500+ manuscrits corrigés</span>
            </div>
            <div className="flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
              <span>4.9/5 satisfaction client</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-blue-400" />
              <span>Délais garantis</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
```

#### **Calculateur de Prix** (`components/landing/PricingCalculator.tsx`)

```typescript
const PricingCalculator: React.FC = () => {
  const { data: pricing, isLoading, error } = usePricing();
  const [selectedService, setSelectedService] = useState<string>("");
  const [pageCount, setPageCount] = useState<number>(100);

  const calculatePrice = useMemo(() => {
    if (!pricing || !selectedService) return 0;

    const service = pricing.find((p) => p.id === selectedService);
    if (!service) return 0;

    // Calcul basé sur le nombre de pages
    const basePrice = service.prix / 100; // Prix en euros
    return Math.round(basePrice * pageCount);
  }, [pricing, selectedService, pageCount]);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Chargement des tarifs..." />;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">
          Erreur lors du chargement des tarifs
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <section id="pricing" className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Calculateur de Prix
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Obtenez un devis personnalisé en quelques clics
          </p>
        </motion.div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Configuration */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de service
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un service</option>
                  {pricing?.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.nom} - {service.prixFormate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de pages : {pageCount}
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>10 pages</span>
                  <span>500 pages</span>
                </div>
              </div>
            </div>

            {/* Résultat */}
            <div className="flex items-center justify-center">
              <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <p className="text-lg text-gray-600 mb-2">Prix estimé</p>
                <p className="text-4xl font-bold text-blue-600 mb-4">
                  {calculatePrice}€
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Délai estimé : {Math.max(3, Math.ceil(pageCount / 50))} jours
                </p>

                {selectedService && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      // Sauvegarder la sélection et rediriger vers inscription
                      localStorage.setItem(
                        "selectedPack",
                        JSON.stringify({
                          serviceId: selectedService,
                          pageCount,
                          price: calculatePrice,
                        })
                      );
                      window.location.href = "/signup";
                    }}
                  >
                    Commander maintenant
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
```

---

## 🎣 **Hooks React Query**

### 🔑 **Hook Authentification** (`hooks/useAuth.ts`)

```typescript
interface AuthUser {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: "USER" | "ADMIN" | "CORRECTOR";
  isActive: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  prenom: string;
  nom: string;
  email: string;
  password: string;
}

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Query pour l'utilisateur actuel
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async (): Promise<AuthUser | null> => {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;

      try {
        const response = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.user;
      } catch (error) {
        localStorage.removeItem("auth_token");
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation connexion
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await axios.post("/api/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["auth", "user"], data.user);
      toast.success("Connexion réussie !");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur de connexion");
    },
  });

  // Mutation inscription
  const signupMutation = useMutation({
    mutationFn: async (userData: SignupData) => {
      const response = await axios.post("/api/auth/register", userData);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["auth", "user"], data.user);
      toast.success("Inscription réussie ! Bienvenue !");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erreur d'inscription");
    },
  });

  // Fonction déconnexion
  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    queryClient.setQueryData(["auth", "user"], null);
    queryClient.clear();
    toast.success("Déconnexion réussie");
  }, [queryClient]);

  // Vérification rôle
  const hasRole = useCallback(
    (requiredRole: string) => {
      if (!user) return false;
      return user.role === requiredRole;
    },
    [user]
  );

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout,
    hasRole,
    isLoginLoading: loginMutation.isPending,
    isSignupLoading: signupMutation.isPending,
  };
};
```

### 👨‍💼 **Hook Administration Utilisateurs** (`hooks/useAdminUsers.ts`)

```typescript
interface AdminUser {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminUsersFilters {
  search?: string;
  role?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
}

export const useAdminUsers = (filters: AdminUsersFilters = {}) => {
  const queryClient = useQueryClient();

  // Query liste utilisateurs
  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });

      const response = await axios.get(`/api/admin/users?${params}`);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 secondes
    keepPreviousData: true,
  });

  // Mutation création utilisateur
  const createUserMutation = useMutation({
    mutationFn: async (
      userData: Omit<AdminUser, "id" | "createdAt" | "updatedAt">
    ) => {
      const response = await axios.post("/api/admin/users", userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Utilisateur créé avec succès");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Erreur lors de la création"
      );
    },
  });

  // Mutation modification utilisateur
  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      ...userData
    }: Partial<AdminUser> & { id: string }) => {
      const response = await axios.put(`/api/admin/users/${id}`, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Utilisateur modifié avec succès");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Erreur lors de la modification"
      );
    },
  });

  // Mutation suppression utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await axios.delete(`/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Utilisateur supprimé avec succès");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression"
      );
    },
  });

  // Mutation changement rôle
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await axios.put(`/api/admin/users/${userId}/role`, {
        role,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Rôle modifié avec succès");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Erreur lors du changement de rôle"
      );
    },
  });

  return {
    users: usersData?.users || [],
    totalUsers: usersData?.total || 0,
    totalPages: usersData?.totalPages || 0,
    currentPage: usersData?.page || 1,
    isLoading,
    error,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    changeRole: changeRoleMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isChangingRole: changeRoleMutation.isPending,
  };
};
```

### 🔔 **Hook Notifications** (`hooks/useNotifications.ts`)

```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "ERROR"
    | "PAYMENT"
    | "ORDER"
    | "MESSAGE"
    | "SYSTEM";
  priority: "FAIBLE" | "NORMALE" | "HAUTE" | "URGENTE";
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export const useNotifications = () => {
  const queryClient = useQueryClient();

  // Query liste notifications
  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<Notification[]> => {
      const response = await axios.get("/api/notifications");
      return response.data.notifications;
    },
    refetchInterval: 15000, // Polling 15 secondes
    staleTime: 10000, // 10 secondes
    retry: 3,
  });

  // Query compteur non lues
  const { data: unreadCount } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async (): Promise<number> => {
      const response = await axios.get("/api/notifications/unread-count");
      return response.data.count;
    },
    refetchInterval: 15000,
    staleTime: 10000,
  });

  // Mutation marquer comme lue
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axios.put(`/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      // Mise à jour optimiste
      queryClient.setQueryData(
        ["notifications"],
        (old: Notification[] | undefined) =>
          old?.map((notif) =>
            notif.id === arguments[0] ? { ...notif, isRead: true } : notif
          )
      );
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  // Mutation marquer toutes comme lues
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await axios.put("/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.setQueryData(
        ["notifications"],
        (old: Notification[] | undefined) =>
          old?.map((notif) => ({ ...notif, isRead: true }))
      );
      queryClient.setQueryData(["notifications", "unread-count"], 0);
    },
  });

  // Mutation suppression notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axios.delete(`/api/notifications/${notificationId}`);
    },
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(
        ["notifications"],
        (old: Notification[] | undefined) =>
          old?.filter((notif) => notif.id !== notificationId)
      );
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  // Notifications par type
  const notificationsByType = useMemo(() => {
    if (!notifications) return {};

    return notifications.reduce((acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = [];
      }
      acc[notification.type].push(notification);
      return acc;
    }, {} as Record<string, Notification[]>);
  }, [notifications]);

  // Notifications non lues
  const unreadNotifications = useMemo(
    () => notifications?.filter((n) => !n.isRead) || [],
    [notifications]
  );

  return {
    notifications: notifications || [],
    unreadNotifications,
    notificationsByType,
    unreadCount: unreadCount || 0,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
};
```

---

## 📄 **Pages Architecture**

### 🏠 **Landing Page** (`pages/LandingPage.tsx`)

```typescript
const LandingPage: React.FC = () => {
  const { data: pricing, isLoading } = usePricing();

  useEffect(() => {
    // SEO meta tags
    document.title = "Staka Livres - Correction professionnelle de manuscrits";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Services professionnels de correction et d'édition de manuscrits. Expertise reconnue, délais respectés, qualité garantie."
      );
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement de la page..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation sticky */}
      <Navigation />

      {/* Hero section */}
      <Hero />

      {/* Services */}
      <Services />

      {/* Calculateur de prix */}
      <PricingCalculator />

      {/* Packs services */}
      <Packs pricing={pricing} />

      {/* Échantillon gratuit */}
      <FreeSample />

      {/* Témoignages */}
      <Testimonials />

      {/* FAQ */}
      <FAQ />

      {/* Section contact */}
      <Contact />

      {/* Footer */}
      <Footer />

      {/* WhatsApp widget flottant */}
      <WhatsAppWidget />
    </div>
  );
};
```

### 👨‍💼 **Dashboard Admin** (`pages/admin/AdminDashboard.tsx`)

```typescript
const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useAdminStats();
  const { unreadCount } = useNotifications();

  const statCards = [
    {
      title: "Chiffre d'affaires",
      value: stats?.revenue.total || 0,
      format: "currency",
      evolution: stats?.revenue.evolution || 0,
      icon: CurrencyEuroIcon,
      color: "blue",
    },
    {
      title: "Nouveaux utilisateurs",
      value: stats?.users.newThisMonth || 0,
      format: "number",
      evolution: stats?.users.evolution || 0,
      icon: UsersIcon,
      color: "green",
    },
    {
      title: "Commandes",
      value: stats?.orders.thisMonth || 0,
      format: "number",
      evolution: stats?.orders.evolution || 0,
      icon: ShoppingCartIcon,
      color: "purple",
    },
    {
      title: "Notifications",
      value: unreadCount,
      format: "number",
      evolution: 0,
      icon: BellIcon,
      color: "red",
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Chargement du dashboard..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Vue d'ensemble de votre activité</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              Évolution du chiffre d'affaires
            </h3>
            <RevenueChart data={stats?.revenue.monthly} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Commandes par statut</h3>
            <OrderStatusChart data={stats?.orders.byStatus} />
          </div>
        </div>

        {/* Recent activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Activités récentes</h3>
          </div>
          <RecentActivities />
        </div>
      </div>
    </AdminLayout>
  );
};
```

### 💬 **Page Messagerie** (`pages/MessagesPage.tsx`)

```typescript
const MessagesPage: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const { user } = useAuth();

  const {
    conversations,
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    isSendingMessage,
  } = useMessages(selectedConversationId);

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedConversationId) return;

    await sendMessage({
      content,
      conversationId: selectedConversationId,
      attachments,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex">
          {/* Sidebar conversations */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            </div>

            <div className="overflow-y-auto h-full">
              {isLoading ? (
                <div className="p-4">
                  <LoadingSpinner size="md" text="Chargement..." />
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversationId}
                  onSelect={setSelectedConversationId}
                />
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 flex flex-col">
            {selectedConversationId ? (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  <MessageThread
                    messages={messages}
                    currentUserId={user?.id}
                    onMarkAsRead={markAsRead}
                  />
                </div>

                <div className="border-t p-4">
                  <MessageComposer
                    onSend={handleSendMessage}
                    isLoading={isSendingMessage}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <InboxIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Sélectionnez une conversation pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🐳 **Déploiement OVH Cloud**

### 🏗️ **Configuration Docker Frontend**

#### **Dockerfile Multi-stage**

```dockerfile
# Dockerfile frontend optimisé
FROM node:18.20.2-alpine AS builder

WORKDIR /app

# Installation dépendances
COPY package*.json ./
RUN npm ci --only=production

# Build application
COPY . .
RUN npm run build

# Production avec Nginx
FROM nginx:1.25-alpine AS production

# Configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copy build
COPY --from=builder /app/dist /usr/share/nginx/html

# Permissions
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### **Configuration Nginx**

```nginx
# nginx.conf - Configuration production
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Handle client routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy to backend
        location /api/ {
            proxy_pass http://backend:3000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### 📡 **Scripts Déploiement**

#### **Script Déploiement Frontend**

```bash
#!/bin/bash
# deploy-frontend.sh - Déploiement frontend OVH

set -e

echo "🎨 Déploiement Frontend Staka Livres sur OVH..."

# Variables
SERVER="your-server.ovh.net"
USER="ubuntu"
APP_DIR="/opt/staka-livres"

# Build local
echo "🔨 Build local de l'application..."
npm run build

# Upload via rsync
echo "📤 Upload des fichiers..."
rsync -avz --delete ./dist/ ${USER}@${SERVER}:${APP_DIR}/frontend/dist/
rsync -avz ./nginx.conf ${USER}@${SERVER}:${APP_DIR}/frontend/
rsync -avz ./Dockerfile ${USER}@${SERVER}:${APP_DIR}/frontend/

# Commandes serveur distant
ssh ${USER}@${SERVER} << 'REMOTE_COMMANDS'
cd /opt/staka-livres/frontend

# Rebuild container
echo "🐳 Rebuild container frontend..."
docker build -t staka-frontend .

# Restart service
echo "🔄 Restart service frontend..."
docker stop staka-frontend || true
docker rm staka-frontend || true

docker run -d \
  --name staka-frontend \
  --restart unless-stopped \
  -p 3001:80 \
  --network staka-network \
  staka-frontend

# Health check
echo "🏥 Vérification santé..."
sleep 5
curl -f http://localhost:3001/health || exit 1

echo "✅ Frontend déployé avec succès!"
REMOTE_COMMANDS

echo "🎉 Frontend accessible sur https://your-domain.com"
```

#### **Docker Compose Production**

```yaml
# docker-compose.prod.yml - Stack complète
version: "3.8"

services:
  frontend:
    build: ./frontend
    ports:
      - "3001:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - staka-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - staka-network

  db:
    image: mysql:8.4
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=stakalivres
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped
    networks:
      - staka-network

networks:
  staka-network:
    driver: bridge

volumes:
  mysql_data:
```

---

## 🛠️ **Scripts & Commandes**

### 📦 **Scripts NPM**

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx,ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext js,jsx,ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run",
    "test:integration": "vitest run tests/integration/",
    "test:all": "vitest run --config vite.config.integration.ts",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:e2e:critical": "cypress run --config-file cypress.config.critical.cjs",
    "test:e2e:smoke": "cypress run --config-file cypress.config.smoke.cjs",
    "test:e2e:integration": "cypress run --spec 'cypress/e2e/integration/**/*.cy.{js,jsx,ts,tsx}'",
    "test:e2e:payment": "cypress run --spec 'cypress/e2e/critical/payment-*.cy.ts,cypress/e2e/integration/*payment*.cy.ts'",
    "test:e2e:ci": "npm run test:e2e:critical && npm run test:e2e:smoke",
    "test:e2e:local": "npm run test:e2e:critical && npm run test:e2e:integration",
    "test:e2e:all": "npm run test:e2e:critical && npm run test:e2e:smoke && npm run test:e2e:integration"
  }
}
```

### 🧪 **Commandes Tests**

```bash
# Tests unitaires (CI/CD optimisé)
npm run test:unit        # Tests avec mocks uniquement
npm run test:coverage    # Coverage avec rapport HTML

# Tests intégration (local avec backend)
npm run test:integration # Tests avec API réelle
npm run test:all         # Suite complète

# Tests E2E Cypress (3 niveaux)
npm run test:e2e:ci      # Critical + Smoke (< 3min)
npm run test:e2e:local   # Critical + Integration
npm run test:e2e:payment # Tests paiement Stripe

# Mode développement
npm run test --watch     # Mode watch unitaire
npm run test:e2e:open    # Interface Cypress interactive

# Qualité code
npm run lint             # ESLint
npm run lint:fix         # Fix automatique
npm run type-check       # Vérification TypeScript
```

### 🚀 **Commandes Build & Deploy**

```bash
# Développement
npm run dev              # Serveur dev Vite (port 5173)
npm run preview          # Preview build production

# Production
npm run build            # Build optimisé pour production
./deploy-frontend.sh     # Déploiement OVH automatisé

# Docker
docker build -t staka-frontend .
docker run -p 3001:80 staka-frontend

# Health checks
curl http://localhost:3001/health  # Santé application
curl http://localhost:3001/api/health  # Santé backend via proxy
```

---

## 🔍 **Troubleshooting**

### 🐛 **Problèmes Courants**

#### **Erreurs Build**

```bash
# Error: Cannot resolve module
- Vérifier les imports relatifs/absolus
- npm install pour dépendances manquantes
- Nettoyer cache : rm -rf node_modules .vite dist

# Error: TypeScript errors
- npm run type-check pour détails
- Vérifier types dans src/types/
- Redémarrer TS server dans IDE
```

#### **Erreurs Tests**

```bash
# Tests unitaires échouent en CI/CD
- Vérifier exclusion tests/integration/ dans vite.config.ts
- S'assurer que les mocks sont corrects
- Tests doivent être indépendants du backend

# Tests intégration échouent en local
- Vérifier que le backend tourne (docker compose up backend)
- Vérifier variables d'environnement
- Attendre démarrage complet stack Docker
```

#### **Erreurs E2E Cypress**

```bash
# Timeouts Cypress
- Augmenter timeout dans cypress.config.cjs
- Vérifier que l'application est accessible
- Nettoyer navigateur : cypress cache clear

# Tests flaky (instables)
- Ajouter wait explicites cy.wait(1000)
- Utiliser cy.intercept pour mock API calls
- Vérifier sélecteurs CSS robustes
```

### 📊 **Performance & Debug**

#### **Outils Debug**

```bash
# React DevTools
- Extension navigateur pour composants React
- Profiler pour performance rendering

# React Query DevTools
- Activé en développement automatiquement
- Voir cache, queries, mutations

# Vite DevTools
- Console navigateur pour HMR logs
- Network tab pour assets loading
```

#### **Optimisation Performance**

```bash
# Bundle analyzer
npx vite-bundle-analyzer dist

# Lighthouse audit
npx lighthouse http://localhost:3001 --view

# Memory leaks
- React DevTools Profiler
- Nettoyer listeners dans useEffect cleanup
- Éviter closures lourdes dans useCallback
```

---

## 📚 **Documentation & Ressources**

### 🏗️ **Guides Internes**

- **[Guide Backend API](README-backend.md)** : 139+ endpoints avec exemples
- **[Guide Base de Données](Base-de-donnees-guide.md)** : 15 modèles Prisma optimisés
- **[Tests Complets](TESTS_COMPLETE_GUIDE.md)** : Architecture 3 niveaux unifiée
- **[Guide Admin](ADMIN_GUIDE_UNIFIED.md)** : 10 pages administration

### 🔧 **Ressources Externes**

- **[React Documentation](https://react.dev/)** : Guide officiel React 18
- **[TanStack Query](https://tanstack.com/query/latest)** : Documentation React Query
- **[Tailwind CSS](https://tailwindcss.com/)** : Framework CSS utility-first
- **[Vite](https://vitejs.dev/)** : Build tool moderne
- **[Cypress](https://cypress.io/)** : Tests E2E
- **[Vitest](https://vitest.dev/)** : Framework tests unitaires

### 📖 **Standards & Bonnes Pratiques**

#### **TypeScript**

- Types stricts activés (`strict: true`)
- Pas de `any` sauf cas exceptionnels
- Interfaces pour props composants
- Types partagés dans `src/types/`

#### **React**

- Composants fonctionnels uniquement
- Hooks personnalisés pour logique réutilisable
- Memoization avec `useMemo`/`useCallback` si nécessaire
- Error boundaries pour gestion erreurs

#### **Styling**

- Tailwind CSS utility-first
- Composants réutilisables dans `components/ui/`
- Variables CSS custom properties
- Mobile-first responsive design

#### **Tests**

- Couverture minimum 80%
- Tests unitaires isolés (CI/CD)
- Tests intégration avec backend (local)
- Tests E2E critiques < 2min

---

## 👨‍💻 **Développement & Maintenance**

### 🔄 **Workflow Développement**

1. **Setup environnement**

   ```bash
   npm install
   npm run dev  # Port 5173
   ```

2. **Développement fonctionnalité**

   ```bash
   # Créer branche feature
   git checkout -b feature/nouvelle-fonctionnalite

   # Tests pendant développement
   npm run test --watch
   npm run type-check
   ```

3. **Tests avant commit**

   ```bash
   npm run lint:fix      # Fix problèmes ESLint
   npm run type-check    # Vérification TypeScript
   npm run test:unit     # Tests unitaires
   npm run build         # Vérification build
   ```

4. **Tests complets local**

   ```bash
   # Démarrer backend
   docker compose up backend db

   # Tests intégration
   npm run test:integration

   # Tests E2E
   npm run test:e2e:local
   ```

### 📝 **Standards Qualité**

- **ESLint** : Configuration stricte avec Airbnb
- **Prettier** : Formatage automatique
- **TypeScript strict** : Pas de `any`, types complets
- **Tests obligatoires** : Coverage > 80%
- **Performance** : Bundle size < 500KB gzipped
- **Accessibilité** : WCAG 2.1 AA compliance

---

**✨ Développé par Christophe Mostefaoui - Juillet 2025**  
**🎨 Frontend React enterprise-grade déployé sur OVH Cloud**  
**⚛️ 71 composants + 31 hooks + 28 pages production-ready avec 85% coverage tests**
