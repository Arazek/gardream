# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Quick Reference: Common Commands

All commands run from the project root via `./run.sh`. This is the entry point for all development tasks.

### Environment & First-Time Setup

```bash
./run.sh setup:dev           # Complete bootstrap: infra + TLS + migrations + dev user
./run.sh certs               # Generate self-signed TLS certificates
./run.sh infra:start         # Start persistent infra services only
./run.sh infra:stop          # Stop infra services
./run.sh infra:logs [svc]    # Tail logs: keycloak, postgres, garage, etc.
```

### Development & Production

```bash
./run.sh dev                 # Start all app services with hot reload (frontend + backend)
./run.sh stop                # Stop all services
./run.sh restart             # Stop + dev
./run.sh logs [svc]          # Tail logs: backend, frontend, etc.
./run.sh shell [svc]         # Bash shell in a service (default: backend)
./run.sh build               # Rebuild all Docker images
```

### Database

```bash
./run.sh db:setup            # Create Postgres users, databases, extensions (idempotent)
./run.sh db:migrate          # Run Alembic migrations (upgrade head)
./run.sh db:revision "msg"   # Create a new autogenerate migration after model changes
./run.sh db:reset            # Destructive: drop + recreate app database (dev only)
```

### Frontend (inside `frontend/` directory)

```bash
npm run build                # Build Angular app for production
npm run start                # Serve locally via ionic serve (dev)
npm run test                 # Run unit tests (Jasmine/Karma)
npm run lint                 # Run ESLint
npm run e2e                  # Run Playwright e2e tests
npm run e2e:ui               # Run e2e with UI
npm run storybook            # Start Storybook locally at http://localhost:6006
npm run build-storybook      # Build Storybook static output
```

### Backend (inside `backend/` directory or via Docker)

```bash
./run.sh shell backend       # Enter backend container for direct Python work
# Inside the container or with docker compose run:
pytest                       # Run tests
pytest -xvs tests/test_example.py::test_create_example  # Single test
alembic current              # Show current migration version
alembic upgrade head         # Apply all pending migrations
alembic downgrade -1         # Revert one migration
```

### Keycloak & Auth

```bash
./run.sh keycloak:user [u] [p] [email]  # Create a dev user (default: testuser/testpass123)
./run.sh keycloak:export               # Export realm config to infra/keycloak/realm-config.json
./run.sh keycloak:import               # Import realm from realm-config.json (destructive)
```

### Component Documentation (Storybook)

```bash
./run.sh storybook           # Via Docker at http://localhost:6006
# Or from frontend/:
npm run storybook            # Via local Node at http://localhost:6006
```

### Native Builds (Capacitor)

```bash
./run.sh frontend:sync       # Build Angular + sync to native projects
cd frontend
npx cap open android         # Open Android Studio
npx cap open ios             # Open Xcode
```

---

## Services & URLs

**Local dev** (via Traefik at `https://localhost` + `https://gateway.localhost`):
- Frontend: `https://localhost` (or `http://localhost:4200` directly)
- API: `https://localhost/api/v1/` (Swagger docs at `/api/v1/docs`)
- Keycloak: `https://gateway.localhost/keycloak` (admin / changeme_dashboard)
- pgAdmin: `https://gateway.localhost/pgadmin` (admin@local.dev / changeme)
- Traefik dashboard: `https://gateway.localhost/traefik/dashboard/` (dev only)
- Storybook: `http://localhost:6006`

**Test user** (created by `setup:dev`):
- Username: `testuser`
- Password: `testpass123`

---

## Architecture Overview

### Monorepo Structure

```
gardream/
├── frontend/               # Ionic/Angular 19 PWA + Capacitor 6
├── backend/                # FastAPI 0.115.x (async Python)
├── infra/                  # Docker Compose, Traefik, Postgres, Keycloak, Garage, Webhook
├── docs/                   # Architecture, conventions, design docs
└── run.sh                  # Task runner for all development commands
```

### Tech Stack at a Glance

| Layer | Tech |
|-------|------|
| Frontend | Ionic 8 + Angular 19 (standalone, no NgModules) |
| State | NgRx 19 (Store, Effects, Router-Store) |
| Native | Capacitor 6 (iOS + Android) |
| Styling | SCSS + BEM, dark mode + 4 accent themes |
| Backend | FastAPI (async), SQLAlchemy 2.x (async), Alembic |
| Auth | Keycloak 26 (OIDC/PKCE, Google/Facebook OAuth) |
| Database | PostgreSQL 17 + TimescaleDB + PostGIS |
| Storage | Garage (S3-compatible) |
| Infra | Docker Compose, Traefik v3 |
| Docs | Storybook 8 (40+ stories) |

---

## Key Architecture Decisions

### Frontend: Feature-First Organization

Each feature (plots, crops, tasks, etc.) lives in `src/app/features/[name]/` with:
- `pages/` — routed pages
- `components/` — feature-local components
- `services/` — data access, API calls
- `store/` — NgRx (state, actions, effects, selectors)
- `[name].routes.ts` — lazy-loaded route config

**Shared components** (27 reusable UI pieces) are in `src/app/shared/` and exported from a barrel at `src/app/shared/index.ts`. Never duplicate; always extract to shared.

**Store pattern**: NgRx for server data shared across features. Local UI state (form values, loading states) stays local in components using Angular signals.

**Actions are past-tense events**, not imperative commands:
```ts
// Correct
ExampleActions.exampleLoaded({ items: [...] })
ExampleActions.exampleLoadFailed({ error: '...' })

// Wrong
ExampleActions.loadExamples()  // imperative
ExampleActions.setLoading()    // not an event
```

### Backend: Clean Layering

```
endpoints/          (thin HTTP handlers, validation only)
  ↓
services/           (business logic, DB queries via ORM)
  ↓
models/             (SQLAlchemy ORM)
  ↓
schemas/            (Pydantic in/out contracts)
```

**Rule: endpoints never contain business logic.** All logic lives in services. This keeps routes readable and testable.

### Database: Two Databases, One Postgres Instance

- `app_db` (Alembic-managed) — your app data
- `keycloak_db` (Keycloak-managed) — auth data

Never edit already-applied migrations; always create new revisions.

### Offline-First Sync

Frontend writes to local SQLite first, queues in an outbox table, syncs to server via a push/pull cycle with temp ID rewriting. This is in `core/sync/sync.service.ts` and `core/db/local-db.service.ts`.

### Infrastructure: Separate Infra & App Stacks

- `infra/docker-compose.yml` — persistent services (Postgres, Keycloak, Garage, Traefik). Start once with `setup:dev` or `infra:start`.
- `docker-compose.local.yml` — app services (frontend, backend). Restart frequently during development.

**Garage** (S3-compatible object storage) auto-creates bucket + access key on first start. Photos are stored there, not on the filesystem.

---

## Conventions to Follow

All conventions are in `docs/CONVENTIONS.md`. Key highlights:

### Commits (Conventional Commits)

```
feat(scope): description
fix(scope): description
chore(scope): description
```

Example: `feat(frontend): add dark mode toggle`, `fix(backend): resolve auth guard loop`

### Frontend: SCSS + BEM

- No IDs in stylesheets
- No raw `px` (use rem/em)
- Max 2-level nesting
- Class names follow BEM: `.block__element--modifier`

Example:
```scss
.task-card {
  &__header { }
  &__title { }
  &--completed { }
}
```

### Frontend: Standalone Components

All components are standalone (no NgModules). No `@NgModule` anywhere.

### Backend: Dependencies & Security

FastAPI uses dependency injection for:
- `get_db()` — async SQLAlchemy session
- `get_current_user()` — current authenticated user
- `require_role("admin")` — role-based access

### Naming

- **Tables**: plural snake_case (`plots`, `user_profiles`)
- **Primary keys**: `id` (UUID string)
- **Foreign keys**: `{table_singular}_id` (e.g., `plot_id`)
- **Timestamps**: `created_at`, `updated_at` on every table

---

## Key Files to Understand

### Frontend

| File | Purpose |
|------|---------|
| `src/app.config.ts` | Root DI config (Ionic, NgRx, Keycloak, router, interceptors) |
| `src/app.routes.ts` | Root lazy-loaded routes |
| `src/app/core/auth/` | Keycloak integration, guards, auth interceptor |
| `src/app/core/db/local-db.service.ts` | Local SQLite (Capacitor) |
| `src/app/core/sync/` | Offline sync engine |
| `src/app/shared/index.ts` | Barrel export for 27 shared components |
| `src/app/store/` | Root NgRx store config |
| `src/theme/variables.scss` | Global CSS variables, dark mode, accent themes |

### Backend

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app factory, CORS, lifespan (scheduler, async engine) |
| `app/core/config.py` | Pydantic settings from `.env` |
| `app/core/security.py` | JWT verification via Keycloak JWKS (cached, rotation-aware) |
| `app/core/dependencies.py` | `get_db()`, `get_current_user()`, `require_role()` |
| `app/models/` | SQLAlchemy ORM (plot, crop, task, specimen, etc.) |
| `app/services/task_generator.py` | Auto-generate tasks from crop schedules |
| `app/services/scheduler.py` | APScheduler for notifications |

### Infrastructure

| File | Purpose |
|------|---------|
| `.env.example` | All environment variables, documented |
| `infra/docker-compose.yml` | Postgres, Keycloak, Garage, Traefik, pgAdmin |
| `infra/traefik/traefik.yml` | Traefik static config (ports, TLS, Docker provider) |
| `infra/keycloak/realm-config.json` | Pre-configured Keycloak realm (OAuth, roles, clients) |

---

## Common Patterns

### Adding a Backend Endpoint

1. Create model: `backend/app/models/my_model.py` (SQLAlchemy)
2. Create schemas: `backend/app/schemas/my_model.py` (Pydantic: Base, Create, Update, Response)
3. Create service: `backend/app/services/my_service.py` (business logic)
4. Create endpoint: `backend/app/api/v1/endpoints/my_model.py` (thin HTTP handlers)
5. Register in `backend/app/api/v1/router.py`
6. Create migration: `./run.sh db:revision "add my_model table"`
7. Apply: `./run.sh db:migrate`

### Adding a Frontend Feature

1. Create folder: `frontend/src/app/features/my-feature/`
2. Create routes: `my-feature.routes.ts` (lazy-loaded)
3. Create store: `store/` (state, actions, effects, selectors)
4. Register reducer & effects in `src/app/store/index.ts`
5. Register route in `src/app/app.routes.ts`
6. Use Storybook for shared components; test pages in the app

### NgRx Pattern Example

See `frontend/src/app/features/example/` for a complete working example of:
- Action creation (`example.actions.ts`)
- Reducer logic (`example.reducer.ts`)
- Effects (HTTP + side effects)
- Selectors (memoized state slices)
- Component usage (dispatch actions, subscribe to selectors)

---

## Testing

### Frontend Unit Tests

```bash
cd frontend
npm run test                                    # All tests
npm run test -- --include='**/my.spec.ts'      # Single file
npm run test -- --code-coverage                # Coverage report
```

Tests use Jasmine/Karma. Co-locate `.spec.ts` files with components.

### Backend Unit Tests

```bash
./run.sh shell backend
pytest                                         # All tests
pytest tests/test_endpoints/test_example.py   # Single file
pytest -k test_create_example                 # By test name
pytest --cov                                   # Coverage
```

Tests use pytest + httpx. Fixtures in `conftest.py`.

### E2E Tests (Playwright)

```bash
cd frontend
npm run e2e                                    # Headless
npm run e2e:ui                                 # UI runner
npm run e2e:report                             # View last report
```

Tests in `frontend/e2e/`. Target `http://localhost:4200` in dev.

---

## Debugging Tips

### Frontend
- **Angular DevTools extension**: View component tree, NgRx state, route changes
- **Chrome DevTools**: Inspect network, localStorage (tokens), IndexedDB (SQLite)
- **NGRx DevTools**: `store-devtools` enabled in dev; check Redux extension

### Backend
- **Swagger docs**: `https://localhost/api/v1/docs` — try endpoints live
- **Logs**: `./run.sh logs backend` — FastAPI logs all requests
- **pgAdmin**: `https://gateway.localhost/pgadmin` — browse tables, run queries
- **Shell access**: `./run.sh shell backend` — Python REPL, direct DB access

### Database
- **pgAdmin**: Visual table browser, query editor
- **Alembic revisions**: Always review generated migrations (`backend/alembic/versions/`)
- **DB state**: `./run.sh db:reset` to wipe and rebuild (dev only)

---

## Important Notes for AI Assistants

1. **Always check CONVENTIONS.md** before making code changes. Follow naming, structure, and pattern rules.

2. **Convention violations require user confirmation.** If a task would break a convention, flag it explicitly and ask for confirmation before proceeding. Do not proceed silently.

3. **No silent refactoring.** Only fix what the task asks for. Don't "improve" code outside scope.

4. **Backend services handle all logic.** Keep endpoints thin; put business logic in services.

5. **Frontend: extract to shared.** If a component is reused across 2+ features, move it to `src/app/shared/components/`.

6. **Past-tense actions.** NgRx actions describe events that happened, not imperative commands.

7. **Test locally before claiming done.** Start the app with `./run.sh dev` and verify the feature works in a browser.

---

## Useful Doc Links

- `docs/CONVENTIONS.md` — Complete coding standards (read this first for any task)
- `docs/ARCHITECTURE.md` — Deep architecture and service routing
- `docs/DESIGN_SYSTEM.md` — UI component library and design tokens
- `README.md` — Quick start, tech stack, production deployment
- `docs/PROMPT.md` — Project context primer for AI assistants

---

## Environment Setup Checklist

```
[ ] Clone the repo
[ ] cp .env.example .env
[ ] Fill in .env (at minimum: change "changeme" values)
[ ] ./run.sh setup:dev       # One-time: infra + certs + migrations + test user
[ ] ./run.sh dev             # Start all services
[ ] Open https://localhost, ignore cert warning, login as testuser/testpass123
```

---

## Production Deployment Notes

See `README.md` "Production Deployment" section. Key steps:

1. Edit `.env`: set `DOMAIN`, `TLS_MODE=letsencrypt`, `ACME_EMAIL`
2. Replace all "changeme" secrets with strong values
3. Configure OAuth credentials (Google/Facebook) in `.env`
4. Run `./run.sh prod`
5. Traefik auto-obtains Let's Encrypt certificate

---
