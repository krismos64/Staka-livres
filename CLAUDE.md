# CLAUDE.md

> **Purpose** : Ce document sert de _single‑source of truth_ pour Claude Code (`claude.ai/code`). Il lui fournit les conventions, scripts et chemins à jour pour travailler efficacement sur le dépôt **Staka‑Livres** (monorepo TypeScript / Docker multi‑arch).
>
> **Dernière mise à jour** : **Juil 2025** – couverture tests : **63 / 63 passed – 87 %**.

---

## 1 · Vue d’ensemble du projet

| Côté              | Tech‑stack clé                                          | Ports (Docker)               | Tests                   | Couverture |
| ----------------- | ------------------------------------------------------- | ---------------------------- | ----------------------- | ---------- |
| **Backend**       | Node 18 · Express 4 · TypeScript 5 · Prisma 6 · MySQL 8 | `3000`                       | Vitest (63 + 7 skipped) | 87 %       |
| **Frontend**      | React 18 · Vite 5 · React‑Query 5 · Tailwind 3          | `3001` (prod) / `5173` (dev) | Vitest + Cypress        | 85 %       |
| **Docs & Shared** | MD guides · TS types (workspace)                        | —                            | n/a                     | —          |

Fonctionnalités premium : upload S3, paiements Stripe, PDFKit, messagerie temps réel, audit logs, notifications, réservation de consultations.

---

## 2 · Structure du monorepo

```
Staka-livres/
├─ backend/      # API Express + Prisma
├─ frontend/     # React + Vite UI
├─ shared/       # Types & utils communs
├─ docs/         # Documentation technique
├─ docker-compose.yml
└─ README.md
```

### 2.1 Back‑end

- **src/server.ts** : bootstrap express
- **src/controllers/** : 16 contrôleurs (auth, admin\*, files, notifications…)
- **src/routes/** : 49+ endpoints REST déjà câblés
- **src/services/** : logique métier (Stripe, Invoice, Audit…) – _à tester de préférence en isolation_
- **src/tests/** : Vitest (`vitest run --coverage`)
- **test‑helpers/utils.ts** : `hasValidAwsCreds()` & `skipIfNoAws` pour skipper les tests S3 lorsqu’`AWS_ACCESS_KEY_ID` commence par `test-` ou est vide.

### 2.2 Front‑end

- **src/hooks/** : 13 hooks React‑Query (messages, invoices, audit…)
- **src/components/** : 130+ composants modulaires
- **src/pages/** : 25 pages (10 admin, 12 client, 1 landing, etc.)
- **tests/** : Vitest UT + Cypress E2E (`npm run test:e2e`).

---

## 3 · Scripts & commandes de référence

### 3.1 Top‑level workspace

```bash
# Installation (toutes workspaces)
npm run install:all

# Lancement Docker complet (backend 3000, frontend 3001)
npm run docker:dev

# Mode hot‑reload (backend nodemon + Vite dev 5173)
npm run dev:watch
```

### 3.2 Backend

```bash
# Build TS
docker compose run --rm app npm run build

# Tests (inclut couverture Istanbul)
docker compose run --rm app npm run test:ci   # = vitest --coverage

# Tests S3 réels (skippés si creds factices)
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
  docker compose run --rm app npm run test:s3

# Prisma
npm run db:migrate   # exécute dans le conteneur
npm run db:generate
npm run prisma:seed
```

### 3.3 Frontend

```bash
# Dev hot‑reload
npm run dev           # proxy Nginx + Vite HMR

# Tests
npm run test          # Vitest
npm run test:e2e      # Cypress
```

---

## 4 · Règles de code, sécurité & qualité

1. **TypeScript strict** : `noImplicitAny`, `strictNullChecks`, etc.
2. **Validation entrées / sorties** : Zod (backend) + React‑Hook‑Form + zodResolver (frontend).
3. **Auth** : JWT 7 jours, rôles (`USER` `ADMIN` `CORRECTOR`), middleware `requireRole`.
4. **Tests** :

   - unitaires services & controllers
   - intégration routes (Prisma SQLite in‑mem ou DB Docker)
   - tests conditionnels S3 via `skipIfNoAws`
   - E2E Cypress (landing, signup, paiement Stripe Playground)

5. **Audit logs** : tout accès admin = entrée `AuditLog` (service `auditService.ts`).
6. **Style** : ESLint + Prettier (monorepo), style Tailwind en composants.

---

## 5 · Guidelines spécifiques pour Claude Code

### 5.1 Génération de code

- **Respecter l’architecture** : ajouter un service → `backend/src/services/*Service.ts` + test + mise à jour index route.
- **Toujours écrire / adapter tests Vitest** : `backend/src/tests/**/*.test.ts`.
- **Mocks Prisma** :

  - Utiliser `vi.mock("@prisma/client", …)` en début de fichier test avant `import *`.
  - Injecter enums manquants (`Role`, `FileType`, etc.).

- **Streams & PDF** : utiliser `Readable.from(Buffer)` + `for await` dans mocks.
- **S3** : pour tests unit → mock `@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`.
- **Cache singleton** : réinitialiser entre tests via `delete (global as any).<symbol>` ou exp expose `reset()`.

### 5.2 Documentation & mise à jour

- Toute modification de scripts npm, structure dossiers ou commandes **=>** met à jour :

  1. `README.md`
  2. `CLAUDE.md`
  3. Guides spécifiques dans `docs/`

- Ajouter un rappel dans la PR : _“Docs updated ? yes/no”_.

### 5.3 Tests & CI

- **Objectif couverture** : ≥ 90 % backend, ≥ 85 % frontend.
- Pipeline GitHub Actions (non inclus ici) lance :

  - Lint → Tests backend → Tests frontend → Build Docker multi‑arch.

- Échecs tests S3 ignorés si `AWS_ACCESS_KEY_ID` factice.

---

## 6 · Variables d’environnement (backend/.env)

```env
DATABASE_URL="mysql://staka:staka@db:3306/stakalivres"
JWT_SECRET="dev_secret_key_change_in_production"
FRONTEND_URL="http://localhost:3001"
PORT=3000

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AWS (optionnel – tests unit pass even if unset)
AWS_ACCESS_KEY_ID="test-key"      # Commence par test- ⇒ tests S3 skip
AWS_SECRET_ACCESS_KEY="test-secret"
AWS_REGION="eu-west-3"
AWS_S3_BUCKET="staka-livres-files"
```

---

## 7 · FAQ rapide

| Problème                            | Solution rapide                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| **“Prisma: libssl not found”** (CI) | Image backend basée Alpine → ajouter `apk add openssl1.1-compat` (déjà fait). |
| Tests backend trop lents            | Vérifier mock Prisma, éviter requêtes DB réelles pour unitaires.              |
| Vitest “worker stuck” sur Mac M1    | `node --openssl-legacy-provider $(which vitest)` ou passer à Node 20.         |
| Cypress 504 vite dev                | Effacer `.vite` et relancer `npm run dev:watch`.                              |
| AWS creds dev                       | Laisser `AWS_ACCESS_KEY_ID` commençant par `test-` pour skip.                 |

---

### Merci !

Ce guide doit rester **court, exact et opérationnel**. Toute évolution majeure de l’architecture ou des scripts doit s’accompagner d’une mise à jour de ce fichier.
