# pwa-ionic-python-template

A personal, reusable monorepo template for building **mobile-first Progressive Web Apps**.
Production-ready out of the box: authentication, database, API, reverse proxy, TLS, and a component library — all running in Docker.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Services & URLs](#services--urls)
5. [Project Structure](#project-structure)
6. [Authentication](#authentication)
7. [Backend API](#backend-api)
8. [Frontend](#frontend)
9. [Shared Component Library](#shared-component-library)
10. [Storybook](#storybook)
11. [Database & Migrations](#database--migrations)
12. [Environment Variables](#environment-variables)
13. [run.sh Command Reference](#runsh-command-reference)
14. [Native Builds (Capacitor)](#native-builds-capacitor)
15. [Production Deployment](#production-deployment)

---

## Tech Stack

| Layer           | Technology                              | Version   |
|-----------------|-----------------------------------------|-----------|
| Frontend        | Ionic + Angular (standalone, no modules)| v8 / v19  |
| State           | NgRx                                    | v19       |
| Native bridge   | Capacitor                               | v6        |
| Styling         | SCSS + BEM                              | —         |
| Component docs  | Storybook                               | v8        |
| Backend         | FastAPI (Python 3.12, async)            | 0.115.x   |
| ORM             | SQLAlchemy async                        | 2.x       |
| Migrations      | Alembic                                 | 1.14.x    |
| Auth            | Keycloak (Google + Facebook OAuth)      | 26.x      |
| Database        | PostgreSQL                              | v17       |
| DB admin        | pgAdmin 4                               | latest    |
| Reverse proxy   | Traefik                                 | v3        |
| Containers      | Docker + Docker Compose                 | latest    |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with the Compose plugin
- `openssl` — for local TLS cert generation (usually pre-installed)
- `node` + `npm` — only needed for native (Capacitor) builds and running Storybook locally outside Docker

---

## Quick Start

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd pwa-ionic-python-template

# 2. Create your environment file
cp .env.example .env
# Edit .env — at minimum replace all "changeme" values

# 3. Start everything (generates TLS certs automatically on first run)
./run.sh dev
```

On the first run, `run.sh dev` will:
1. Generate a self-signed TLS certificate for `localhost` via `openssl`
2. Build all Docker images
3. Start all services with hot reload enabled

**TLS browser warning on first access:**
- Chrome: type `thisisunsafe` anywhere on the warning page
- Firefox: click *Advanced* → *Accept the Risk and Continue*

---

## Services & URLs

All traffic enters through Traefik. Local dev uses port `4443` (HTTPS) and `8090` (HTTP redirect) to avoid conflicts with ports 80/443.

| Service           | URL                                     | Notes                        |
|-------------------|-----------------------------------------|------------------------------|
| Angular PWA       | `https://localhost:4443/`               | Hot reload in dev            |
| FastAPI Swagger   | `https://localhost:4443/api/v1/docs`    | Interactive API docs         |
| Keycloak          | `https://localhost:4443/auth/`          | Auth admin console           |
| pgAdmin 4         | `https://localhost:4443/pgadmin/`       | DB admin, pre-configured     |
| Traefik dashboard | `https://localhost:8080/`               | Dev only                     |
| Storybook         | `http://localhost:6006`                 | Via `./run.sh storybook`     |

---

## Project Structure

```
pwa-ionic-python-template/
├── frontend/                        # Ionic/Angular PWA + Capacitor
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                # Auth, interceptors, guards
│   │   │   │   ├── auth/            # KeycloakService wrapper, authGuard, loginGuard, LoginPage
│   │   │   │   └── interceptors/    # auth (Bearer token), error (401 → re-login)
│   │   │   ├── features/            # One folder per domain/feature
│   │   │   │   ├── tabs/            # TabsPage — bottom navigation shell
│   │   │   │   ├── home/            # HomePage — welcome screen
│   │   │   │   └── example/         # Full CRUD feature with NgRx store
│   │   │   ├── shared/              # Reusable across features
│   │   │   │   ├── components/      # UI components (each with a .stories.ts)
│   │   │   │   ├── services/        # Overlay services (Toast, Modal, etc.)
│   │   │   │   ├── pipes/           # TimeAgo, Truncate, Initials
│   │   │   │   ├── directives/      # Autofocus, LongPress
│   │   │   │   └── index.ts         # Barrel export for all shared items
│   │   │   ├── store/               # Root NgRx store registration
│   │   │   ├── app.config.ts        # App providers (router, store, Keycloak, interceptors)
│   │   │   └── app.routes.ts        # Root routes (lazy-loaded)
│   │   ├── environments/            # environment.ts / environment.prod.ts
│   │   └── theme/                   # Ionic CSS variable overrides, global SCSS
│   ├── .storybook/                  # Storybook config (main.ts, preview.ts)
│   ├── android/                     # Capacitor Android project (generated)
│   ├── ios/                         # Capacitor iOS project (generated)
│   └── Dockerfile                   # Multi-stage: build → nginx
│
├── backend/                         # FastAPI Python API
│   ├── app/
│   │   ├── main.py                  # App factory, CORS, lifespan
│   │   ├── api/v1/
│   │   │   ├── router.py            # Aggregates all endpoint routers
│   │   │   └── endpoints/
│   │   │       ├── health.py        # GET /api/v1/health (public)
│   │   │       ├── example.py       # Full CRUD (protected, owner-scoped)
│   │   │       └── ws.py            # WebSocket /api/v1/ws/{channel}
│   │   ├── core/
│   │   │   ├── config.py            # pydantic-settings — all config from .env
│   │   │   ├── security.py          # JWT verification via Keycloak JWKS (cached, key rotation aware)
│   │   │   └── dependencies.py      # get_db, get_current_user, require_role
│   │   ├── db/
│   │   │   ├── base.py              # SQLAlchemy DeclarativeBase
│   │   │   └── session.py           # Async engine + session factory
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   └── schemas/                 # Pydantic request/response schemas
│   ├── alembic/                     # Migrations
│   │   ├── versions/                # Generated migration files
│   │   └── env.py
│   ├── requirements.txt
│   └── Dockerfile                   # Multi-stage: base → development → production
│
├── infra/
│   ├── traefik/
│   │   ├── traefik.yml              # Static config (entrypoints, providers, TLS)
│   │   ├── dynamic/tls.yml          # Dynamic TLS config (local self-signed cert)
│   │   └── certs/                   # Generated certs — gitignored
│   ├── keycloak/
│   │   └── realm-export.json        # Pre-configured realm (auto-imported on startup)
│   ├── pgadmin/
│   │   └── servers.json             # Pre-configured server connections
│   └── postgres/
│       └── init.sh                  # Creates keycloak_db and user on first start
│
├── docker-compose.yml               # Base services (shared by all envs)
├── docker-compose.local.yml         # Dev overrides (bind mounts, hot reload)
├── docker-compose.prod.yml          # Prod overrides (Let's Encrypt, resource limits)
├── .env.example                     # All variables documented
├── run.sh                           # Developer task runner
└── docs/
    ├── ARCHITECTURE.md              # Full architecture reference
    ├── CONVENTIONS.md               # All coding conventions
    └── PROMPT.md                    # AI assistant context primer
```

---

## Authentication

All authentication is handled by Keycloak. The backend never communicates with Google or Facebook directly.

```
User
 │
 ▼
Angular  (keycloak-angular + keycloak-js)
 │  redirects to /auth/realms/pwa/protocol/openid-connect/auth
 ▼
Keycloak
 │  offers "Login with Google" / "Login with Facebook"
 ▼
Google or Facebook OAuth2
 │  returns authorization code to Keycloak callback
 ▼
Keycloak
 │  issues access_token (JWT, RS256) + refresh_token
 ▼
Angular stores tokens in memory (keycloak-js session)
 │  auth interceptor attaches Bearer token to every /api/ request
 ▼
FastAPI receives Bearer token
 │  fetches JWKS from Keycloak (cached, invalidated on key rotation)
 │  verifies RS256 signature, extracts claims (sub, email, realm_roles)
 ▼
Protected endpoint responds
```

### Keycloak realm

The `pwa` realm is pre-configured and auto-imported on container startup from `infra/keycloak/realm-export.json`.

| Setting            | Value                                                  |
|--------------------|--------------------------------------------------------|
| Realm              | `pwa`                                                  |
| Client             | `pwa-frontend` (public, PKCE)                          |
| Redirect URIs      | `https://localhost:4443/*`, Capacitor URIs             |
| Roles              | `user` (assigned by default), `admin`                 |
| Identity Providers | Google, Facebook (disabled — enable after adding credentials to `.env`) |

### Creating a dev user

```bash
./run.sh keycloak:user                           # creates testuser / testpass123
./run.sh keycloak:user myuser mypassword         # custom credentials
./run.sh keycloak:user myuser pass user@x.com   # with email
```

### Role-based access (backend)

```python
# Any authenticated user
@router.get("")
async def list_items(user: dict = Depends(get_current_user)):
    ...

# Admin role required
@router.delete("/{id}")
async def delete_item(user: dict = Depends(require_role("admin"))):
    ...
```

---

## Backend API

Base path: `/api/v1/`
Auth: `Authorization: Bearer <token>` on all protected routes
All responses: JSON
Driver: asyncpg (async PostgreSQL)

### Endpoints

| Method   | Path                    | Auth     | Description               |
|----------|-------------------------|----------|---------------------------|
| `GET`    | `/api/v1/health`        | Public   | Service health check      |
| `GET`    | `/api/v1/example`       | Required | List items (owner-scoped) |
| `POST`   | `/api/v1/example`       | Required | Create item               |
| `GET`    | `/api/v1/example/{id}`  | Required | Get item by ID            |
| `PUT`    | `/api/v1/example/{id}`  | Required | Update item               |
| `DELETE` | `/api/v1/example/{id}`  | Required | Delete item               |
| `WS`     | `/api/v1/ws/{channel}`  | Required | WebSocket — token via `?token=` query param |

Interactive docs: `https://localhost:4443/api/v1/docs`

### Pydantic schema pattern

```python
class ExampleItemBase(BaseModel): ...           # shared fields
class ExampleItemCreate(ExampleItemBase): ...   # POST body
class ExampleItemUpdate(BaseModel): ...         # PUT body (all fields optional)
class ExampleItemResponse(ExampleItemBase): ... # API response
```

### Adding a new endpoint

1. Create `app/models/<name>.py` — SQLAlchemy model
2. Create `app/schemas/<name>.py` — Pydantic schemas
3. Create `app/api/v1/endpoints/<name>.py` — thin route handlers
4. Register the router in `app/api/v1/router.py`
5. Generate and apply a migration:

```bash
./run.sh db:revision "add <name> table"
./run.sh db:migrate
```

---

## Frontend

Angular v19, fully standalone — no NgModules anywhere.

### NgRx store pattern

The store is used for server data shared across components. Local UI state stays local.

```
Root store (store/index.ts)
 └── registers all feature reducers and effects

features/example/store/
  example.state.ts      → state interface + initial state
  example.actions.ts    → createActionGroup (past-tense event names)
  example.reducer.ts    → pure reducer
  example.selectors.ts  → memoized selectors (all prefixed with "select")
  example.effects.ts    → HTTP side effects via ExampleApiService
```

### Adding a new feature

1. Create `src/app/features/<name>/` with `pages/`, `components/`, `services/`, `store/`
2. Follow the NgRx store layout from `features/example/store/`
3. Create `<name>.routes.ts` with lazy-loaded routes
4. Register the reducer and effects in `src/app/store/index.ts`
5. Add the lazy route to `src/app/app.routes.ts`

---

## Shared Component Library

All reusable UI lives in `src/app/shared/` and is exported from a single barrel:

```ts
import { ToastService, AvatarComponent, TimeAgoPipe } from '@app/shared';
```

### Components

#### Feedback & State

| Component               | Selector              | Description                                     |
|-------------------------|-----------------------|-------------------------------------------------|
| `EmptyStateComponent`   | `app-empty-state`     | Empty list/results with icon + optional CTA     |
| `ErrorStateComponent`   | `app-error-state`     | Error state with retry action                   |
| `SuccessStateComponent` | `app-success-state`   | Success confirmation state                      |
| `LoadingSkeletonComponent` | `app-loading-skeleton` | Animated skeleton placeholder              |
| `InlineAlertComponent`  | `app-inline-alert`    | Inline message: `info` `success` `warning` `danger` |

#### Data Display

| Component           | Selector         | Description                                                  |
|---------------------|------------------|--------------------------------------------------------------|
| `AvatarComponent`   | `app-avatar`     | User avatar with image + initials fallback. Sizes: `xs` `sm` `md` `lg` `xl` |
| `BadgeComponent`    | `app-badge`      | Status badge. Variants: `primary` `success` `warning` `danger` `neutral` |
| `ChipComponent`     | `app-chip`       | Selectable/removable tag chip                                |
| `ChipListComponent` | `app-chip-list`  | Managed list of chips with add/remove                        |

#### Lists & Cards

| Component            | Selector          | Description                                     |
|----------------------|-------------------|-------------------------------------------------|
| `ListItemComponent`  | `app-list-item`   | Row item with leading/trailing content slots    |
| `CardComponent`      | `app-card`        | Content card with optional header/footer slots  |
| `SectionComponent`   | `app-section`     | Labelled content section with title slot        |

#### Forms

| Component                | Selector               | Description                          |
|--------------------------|------------------------|--------------------------------------|
| `FormFieldComponent`     | `app-form-field`       | Text input with label, hint, error   |
| `TextareaFieldComponent` | `app-textarea-field`   | Multiline text input                 |
| `SelectFieldComponent`   | `app-select-field`     | Dropdown with typed `SelectOption[]` |
| `SearchBarComponent`     | `app-search-bar`       | Search input with debounce           |
| `ToggleFieldComponent`   | `app-toggle-field`     | Labelled toggle switch               |

#### Layout & Navigation

| Component                    | Selector                   | Description                           |
|------------------------------|----------------------------|---------------------------------------|
| `PageHeaderComponent`        | `app-page-header`          | Page title + optional back button     |
| `DividerComponent`           | `app-divider`              | Horizontal rule with optional label   |
| `ImageWithFallbackComponent` | `app-image-with-fallback`  | Image with graceful error fallback    |

#### Auth & Branding

| Component                    | Selector                    | Description                          |
|------------------------------|-----------------------------|--------------------------------------|
| `SocialLoginButtonComponent` | `app-social-login-button`   | Google / Facebook login button       |
| `LogoComponent`              | `app-logo`                  | App logo. Sizes: `sm` `md` `lg`      |

### Overlay Services

All services are `providedIn: 'root'` and injectable anywhere.

| Service                  | Description                                                         |
|--------------------------|---------------------------------------------------------------------|
| `ToastService`           | `.success()` `.error()` `.warning()` `.show()` — Ionic toasts       |
| `ConfirmDialogService`   | `.confirm(options)` — resolves `true`/`false` from an alert dialog  |
| `LoadingOverlayService`  | `.show()` `.hide()` `.wrap(fn)` — full-screen loading spinner       |
| `BottomSheetService`     | `.open(options)` — Ionic modal as a bottom sheet with breakpoints   |
| `ActionSheetService`     | `.show(options)` — Ionic action sheet (Cancel always appended)      |

### Pipes

| Pipe           | Usage                    | Example output        |
|----------------|--------------------------|-----------------------|
| `TimeAgoPipe`  | `date \| timeAgo`        | `3h ago`, `just now`  |
| `TruncatePipe` | `text \| truncate:50`    | `Hello wor…`          |
| `InitialsPipe` | `'John Doe' \| initials` | `JD`                  |

### Directives

| Directive            | Selector          | Description                                              |
|----------------------|-------------------|----------------------------------------------------------|
| `AutofocusDirective` | `[appAutofocus]`  | Focuses the element (or its `<input>`) after view init   |
| `LongPressDirective` | `[appLongPress]`  | Emits `appLongPress` after 600ms hold (touch + mouse)    |

---

## Storybook

Storybook documents all shared components in isolation with Light/Dark theme support.

```bash
# Via run.sh (runs in Docker)
./run.sh storybook           # http://localhost:6006

# Or directly from frontend/
cd frontend
npm run storybook            # dev server
npm run build-storybook      # static build
```

### Coverage

22 story files, one per shared component, organized by category:

| Category      | Components                                                          |
|---------------|---------------------------------------------------------------------|
| `DataDisplay` | Avatar, Badge, Chip, ChipList                                       |
| `Feedback`    | EmptyState, ErrorState, SuccessState, InlineAlert, LoadingSkeleton  |
| `Forms`       | FormField, TextareaField, SelectField, SearchBar, ToggleField       |
| `Layout`      | Card, Section, ListItem, Divider, ImageWithFallback, PageHeader     |
| `Auth`        | SocialLoginButton, Logo                                             |

### Writing a new story

Stories are co-located with the component and always include `tags: ['autodocs']`:

```ts
// my-component.component.stories.ts
import type { Meta, StoryObj } from '@storybook/angular';
import { MyComponent } from './my-component.component';

const meta: Meta<MyComponent> = {
  title: 'Shared/<Category>/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'danger'] },
  },
};
export default meta;
type Story = StoryObj<MyComponent>;

export const Default: Story = { args: { variant: 'primary' } };
export const Danger: Story = { args: { variant: 'danger' } };
```

---

## Database & Migrations

Two databases share a single PostgreSQL 17 instance:

| Database      | Owner      | Managed by                |
|---------------|------------|---------------------------|
| `app_db`      | `appuser`  | Alembic (your migrations) |
| `keycloak_db` | `keycloak` | Keycloak (internal)       |

`infra/postgres/init.sh` creates `keycloak_db` and its user automatically on the first container start.

### Migration workflow

```bash
# Apply all pending migrations
./run.sh db:migrate

# Create a new migration after changing a model
./run.sh db:revision "add user_profile table"

# Reset the app database — dev only, destructive
./run.sh db:reset
```

Migration files live in `backend/alembic/versions/` and must be committed to source control. Never edit an already-applied migration — always create a new revision.

### Model conventions

- Table names: plural `snake_case` (`example_items`, `user_profiles`)
- Primary keys: `id` (string UUID)
- Foreign keys: `<table_singular>_id`
- Every table has `created_at` and `updated_at` columns

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values before starting.

```env
# General
DOMAIN=localhost
TLS_MODE=local                              # local | letsencrypt
ACME_EMAIL=your@email.com

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=appuser
POSTGRES_PASSWORD=changeme
POSTGRES_DB=app_db

# Keycloak DB (same Postgres instance, separate database)
KEYCLOAK_DB=keycloak_db
KEYCLOAK_DB_USER=keycloak
KEYCLOAK_DB_PASSWORD=changeme

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=changeme
KEYCLOAK_INTERNAL_URL=http://keycloak:8080  # container-to-container
KEYCLOAK_PUBLIC_URL=https://localhost/auth  # browser-facing
KEYCLOAK_REALM=pwa

# Social Identity Providers (leave empty to keep disabled)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Backend
SECRET_KEY=changeme-use-openssl-rand-hex-32
BACKEND_CORS_ORIGINS=["https://localhost"]
LOG_LEVEL=info

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@local.dev
PGADMIN_DEFAULT_PASSWORD=changeme
```

---

## run.sh Command Reference

```
./run.sh dev                    Start all services (local, hot reload)
./run.sh prod                   Start all services (production mode, detached)
./run.sh stop                   Stop all services
./run.sh restart                Stop + dev
./run.sh logs [service]         Tail logs (all services, or one: backend / frontend / keycloak...)
./run.sh build                  Rebuild all Docker images
./run.sh certs                  Generate self-signed TLS cert for localhost

./run.sh db:migrate             Run Alembic migrations (upgrade head)
./run.sh db:revision "msg"      Create a new autogenerate migration revision
./run.sh db:reset               Drop + recreate app_db (dev only — asks for confirmation)

./run.sh storybook              Start Storybook at http://localhost:6006
./run.sh frontend:sync          Build Angular + run Capacitor sync (for native builds)

./run.sh keycloak:user [u] [p]  Create a dev user in the pwa realm (default: testuser / testpass123)
./run.sh keycloak:export        Export Keycloak realm config to infra/keycloak/realm-export.json

./run.sh shell [service]        Open a bash shell in a running container (default: backend)
./run.sh help                   Print this reference
```

---

## Native Builds (Capacitor)

Capacitor is pre-configured for iOS and Android.

```bash
# Sync the web build into the native projects
./run.sh frontend:sync       # runs: npm run build && npx cap sync

# Open in the native IDE
cd frontend
npx cap open android         # Android Studio
npx cap open ios             # Xcode (macOS only)
```

The Keycloak client already includes Capacitor's custom scheme redirect URI (`capacitor://localhost`), so the OAuth flow works in native builds without any additional configuration.

---

## Production Deployment

### 1. Server requirements

- Linux server with Docker + Compose plugin
- Domain name with an A record pointing to the server IP
- Ports 80 and 443 open in the firewall

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DOMAIN=yourdomain.com
TLS_MODE=letsencrypt
ACME_EMAIL=you@yourdomain.com

# Replace ALL "changeme" values with strong secrets
# Generate a key: openssl rand -hex 32
SECRET_KEY=<generated>

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
```

### 3. Configure OAuth redirect URIs

In your Google and/or Facebook OAuth app console, add these authorized redirect URIs:

```
https://yourdomain.com/auth/realms/pwa/broker/google/endpoint
https://yourdomain.com/auth/realms/pwa/broker/facebook/endpoint
```

### 4. Deploy

```bash
./run.sh prod
./run.sh logs          # follow output until all services are healthy
```

Traefik will automatically obtain and renew a Let's Encrypt certificate for your domain.

### 5. Enable social login in Keycloak

Log into `https://yourdomain.com/auth/admin`, navigate to the `pwa` realm → *Identity Providers*, and enable Google and/or Facebook. The OAuth credentials are pre-populated from your `.env`.
