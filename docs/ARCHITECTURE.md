# Garden Task Planner — Architecture Definition

## Overview

A mobile-first Progressive Web App for hobbyist and urban gardeners to organize plots and manage gardening tasks.
Built as a monorepo with production-ready infrastructure. All services run in Docker; local and prod environments
share the same compose structure with environment-level overrides.

**Vision**: Help hobbyist and urban gardeners organize their plots and automatically manage gardening tasks through intelligent scheduling and simple visual planning.

**Core Value Proposition**: Plan your garden visually, and always know what to do next.

---

## Tech Stack

| Layer          | Technology                          | Version  |
|----------------|-------------------------------------|----------|
| Frontend       | Ionic + Angular                     | v8 / v19 |
| State Mgmt     | NgRx                                | v19      |
| Native Bridge  | Capacitor                           | v6       |
| Backend        | FastAPI (Python)                    | 0.115.x  |
| ORM            | SQLAlchemy (async)                  | 2.x      |
| Migrations     | Alembic                             | latest   |
| Auth           | Keycloak (social: Google, Facebook) | 26.x     |
| Database       | PostgreSQL                          | v17      |
| DB Admin       | pgAdmin 4                           | latest   |
| Reverse Proxy  | Traefik                             | v3       |
| Containerization | Docker + Docker Compose           | latest   |
| Component Docs  | Storybook                         | v8       |

---

## Services & Routing

All traffic enters through Traefik (ports 80/443). App services use the root domain; infra services use path-based routing under a single gateway domain.

```
https://localhost                          → frontend  (Angular PWA — ng serve in dev, nginx in prod)
https://localhost/api/                     → backend   (FastAPI)
https://gateway.localhost/keycloak         → keycloak  (Keycloak server)
https://gateway.localhost/pgadmin          → pgadmin   (pgAdmin 4)
https://gateway.localhost/traefik/dashboard/ → traefik (Traefik dashboard — dev only)
https://gateway.localhost/webhook          → webhook   (CI/CD deploy trigger)
```

TLS:
- **Local**: Traefik self-signed certificate (auto-generated). On first visit browsers warn — type `thisisunsafe` (Chrome) or accept the exception (Firefox).
- **Prod**: Traefik ACME / Let's Encrypt (env variable toggle)

---

## Monorepo Directory Structure

```
gardream/
├── frontend/                        # Ionic/Angular PWA + Capacitor
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                # Auth, HTTP interceptors, guards, error handling
│   │   │   │   ├── auth/            # Keycloak service, auth guard, token interceptor, LoginPage
│   │   │   │   ├── interceptors/    # HTTP error interceptor
│   │   │   │   └── theme/           # ThemeService — scheme + accent, persisted to localStorage
│   │   │   ├── features/            # Feature slices (one folder per domain)
│   │   │   │   ├── tabs/            # TabsPage — bottom tab navigation shell
│   │   │   │   ├── home/            # HomePage — garden dashboard with tasks and plots overview
│   │   │   │   ├── plots/           # Plot management (create, view, edit plots)
│   │   │   │   ├── crops/           # Crop library/encyclopedia
│   │   │   │   ├── calendar/        # Task calendar and scheduling
│   │   │   │   ├── tasks/           # Task management
│   │   │   │   ├── profile/         # User profile
│   │   │   │   ├── settings/        # SettingsPage — profile, appearance picker, sign out
│   │   │   │   └── example/         # Example feature (full NgRx pattern)
│   │   │   │       ├── components/
│   │   │   │       ├── pages/
│   │   │   │       ├── store/
│   │   │   │       │   ├── example.actions.ts
│   │   │   │       │   ├── example.effects.ts
│   │   │   │       │   ├── example.reducer.ts
│   │   │   │       │   ├── example.selectors.ts
│   │   │   │       │   └── example.state.ts
│   │   │   │       └── example.routes.ts
│   │   │   ├── shared/              # Shared components, pipes, directives (27 components)
│   │   │   │   └── index.ts         # Barrel — re-exports all shared components/types
│   │   │   ├── store/               # Root NgRx store registration
│   │   │   │   └── app.state.ts
│   │   │   ├── app.config.ts        # Standalone app config (provideRouter, provideStore...)
│   │   │   └── app.routes.ts        # Root routes (lazy-loaded features)
│   │   ├── environments/
│   │   │   ├── environment.ts       # Local dev
│   │   │   └── environment.prod.ts  # Production
│   │   └── theme/                   # Ionic/SCSS global theme
│   ├── android/                     # Capacitor Android (generated)
│   ├── ios/                         # Capacitor iOS (generated)
│   ├── capacitor.config.ts
│   ├── angular.json
│   ├── package.json
│   └── Dockerfile                   # Multi-stage: build → nginx
│
├── backend/                         # FastAPI Python API
│   ├── app/
│   │   ├── main.py                  # FastAPI app factory, lifespan, CORS
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py        # Aggregates all v1 endpoint routers
│   │   │       └── endpoints/
│   │   │           ├── health.py    # GET /api/v1/health
│   │   │           ├── example.py   # Example CRUD endpoints
│   │   │           ├── crops.py     # Crop management endpoints
│   │   │           ├── plots.py     # Plot management endpoints
│   │   │           ├── tasks.py     # Task management endpoints
│   │   │           ├── weather.py   # Weather integration endpoints
│   │   │           └── notification_settings.py # User notification settings
│   │   ├── core/
│   │   │   ├── config.py            # Settings via pydantic-settings (.env)
│   │   │   ├── security.py          # JWT verification via Keycloak JWKS
│   │   │   └── dependencies.py      # FastAPI dependencies (current_user, db session)
│   │   ├── db/
│   │   │   ├── base.py              # SQLAlchemy declarative base
│   │   │   ├── session.py           # Async engine + session factory
│   │   │   └── init_db.py           # DB initialization helper
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── example.py           # Example model
│   │   │   ├── crop.py              # Crop model
│   │   │   ├── plot.py              # Plot model
│   │   │   ├── plot_slot.py         # Plot slot model
│   │   │   ├── task.py              # Task model
│   │   │   ├── user_profile.py      # User profile model
│   │   │   └── notification_settings.py # Notification settings model
│   │   └── schemas/                 # Pydantic request/response schemas
│   │       ├── example.py           # Example schemas
│   │       ├── crop.py              # Crop schemas
│   │       ├── plot.py              # Plot schemas
│   │       ├── plot_slot.py         # Plot slot schemas
│   │       ├── task.py              # Task schemas
│   │       ├── weather.py           # Weather schemas
│   │       └── notification_settings.py # Notification settings schemas
│   ├── alembic/
│   │   ├── versions/                # Migration files
│   │   └── env.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
│
├── infra/                           # Infrastructure stack (Traefik, Postgres, Keycloak, pgAdmin, Webhook)
│   ├── docker-compose.yml           # Infra services — start once, run persistently
│   ├── traefik/
│   │   ├── traefik.yml              # Static config (entrypoints :80/:443, Docker provider)
│   │   └── certs/                   # Self-signed certs (gitignored)
│   ├── keycloak/
│   │   └── realm-config.json        # Realm "gardream" — imported on first Keycloak start
│   ├── postgres/
│   │   ├── Dockerfile               # TimescaleDB + PostGIS image
│   │   └── init.sh                  # Creates keycloak_db + enables extensions on first start
│   ├── pgadmin/
│   │   ├── config_local.py          # OAuth2 SSO via Keycloak + SSL bypass for dev
│   │   └── servers.json             # Pre-registered postgres server
│   └── webhooks/
│       ├── webhook-server.py        # HTTP deploy trigger server (port 9000)
│       ├── deploy-gardream.sh       # Pull + redeploy app services
│       └── Dockerfile
│
├── docker-compose.local.yml         # App services only (backend + frontend, hot reload)
├── docker-compose.prod.yml          # Prod overrides (Let's Encrypt, resource limits)
├── .env.example                     # All environment variables documented
├── .env                             # Local secrets (gitignored)
├── run.sh                           # Developer task runner (see below)
├── .gitignore
└── README.md
```

---

## Authentication Flow

```
User
 │
 ▼
Angular (keycloak-angular lib)
 │  redirect to https://gateway.localhost/keycloak/realms/gardream/protocol/openid-connect/auth
 ▼
Keycloak
 │  offers "Login with Google" / "Login with Facebook"
 ▼
Google or Facebook OAuth2
 │  returns code to Keycloak callback
 ▼
Keycloak
 │  issues access_token (JWT) + refresh_token
 ▼
Angular stores tokens (memory + keycloak-js session)
 │
 ▼
FastAPI receives Bearer token on every request
 │  verifies signature via GET http://keycloak:8080/keycloak/realms/gardream/protocol/openid-connect/certs (JWKS)
 │  extracts user claims (sub, email, roles)
 ▼
Protected endpoint responds
```

Keycloak Realm pre-configured with:
- Realm: `gardream`
- Client: `pwa-frontend` (public, PKCE S256, redirect URIs for `https://localhost/*`, `http://localhost:4200/*`, `capacitor://localhost/*`)
- Identity Providers: Google and Facebook (disabled by default — enable after adding credentials to `.env`)
- Roles: `user`, `admin`
- Login theme: `pwa` (custom FTL templates — not yet in repo, falls back to Keycloak default)

**Realm import quirk**: On fresh DB, Keycloak imports `infra/keycloak/realm-config.json` automatically. If the realm already exists, import is silently skipped. To force-apply changes: `./run.sh infra:stop` then restart with `-v` to wipe the Keycloak volume, or use the Admin UI at `https://gateway.localhost/keycloak/admin`.

### Frontend: Extracting User Profile from JWT Claims

The frontend should extract user profile information directly from the JWT token payload rather than making additional HTTP calls to Keycloak endpoints. This reduces latency and network dependencies.

**JWT Token Structure:**

JWTs have three base64-encoded parts separated by dots: `header.payload.signature`

The payload contains user claims. Example claims included in gardream tokens:

```json
{
  "sub": "12345-user-id",
  "preferred_username": "john.doe",
  "email": "john@example.com",
  "given_name": "John",
  "family_name": "Doe",
  "email_verified": true,
  "realm_access": {
    "roles": ["user", "admin"]
  }
}
```

**Extracting Profile in Angular:**

```typescript
async getProfile(): Promise<KeycloakProfile> {
  try {
    const token = await this.keycloak.getToken();
    if (!token) {
      return {};
    }

    // Decode JWT payload (format: header.payload.signature)
    const payload = JSON.parse(atob(token.split('.')[1]));

    return {
      id: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      emailVerified: payload.email_verified,
    };
  } catch (err) {
    console.error('[AuthService] Failed to extract profile from token:', err);
    return {};
  }
}
```

**Why This Approach?**

1. **No HTTP overhead**: Avoids GET to `/realms/gardream/account` endpoint
2. **Resilient**: Doesn't depend on Keycloak account service availability
3. **Performance**: Instant access to user info (token already in memory)
4. **Offline-capable**: Works even when Keycloak is temporarily unreachable

**Limitations:**

- Only claims in the JWT are available (custom claims can be added via Keycloak client mappers)
- Token claims are static until refresh; user changes (email, name) only appear after token refresh
- Decoding is not validation; the JWT signature is already validated by keycloak-angular during initialization

**Role Access in Frontend:**

Extract realm roles for UI conditional rendering:

```typescript
const realmRoles: string[] = payload.realm_access?.roles || [];
if (realmRoles.includes('admin')) {
  // Show admin UI
}
```

The `keycloak-angular` library's `hasRole()` method uses the same mechanism internally.

---

## Backend API Design

- Base path: `/api/v1/`
- Auth: Bearer JWT (verified against Keycloak JWKS, no Keycloak SDK on backend)
- WebSocket: `/api/v1/ws/{channel}` — authenticated via token query param
- All responses: JSON
- Async throughout (asyncpg driver + SQLAlchemy async sessions)

```
GET  /api/v1/health              → public, returns service status
GET  /api/v1/example             → protected, list example items
POST /api/v1/example             → protected, create example item
GET  /api/v1/example/{id}        → protected, get example item by ID
PUT  /api/v1/example/{id}        → protected, update example item
DELETE /api/v1/example/{id}      → protected, delete example item
GET  /api/v1/crops               → protected, list all crops
GET  /api/v1/crops/{id}          → protected, get crop by ID
GET  /api/v1/plots               → protected, list user's plots
POST /api/v1/plots               → protected, create new plot
GET  /api/v1/plots/{id}          → protected, get plot by ID
PUT  /api/v1/plots/{id}          → protected, update plot
DELETE /api/v1/plots/{id}        → protected, delete plot
GET  /api/v1/tasks               → protected, list user's tasks
POST /api/v1/tasks               → protected, create new task
PUT  /api/v1/tasks/{id}          → protected, update task
DELETE /api/v1/tasks/{id}        → protected, delete task
GET  /api/v1/weather             → protected, get weather data
GET  /api/v1/notification-settings → protected, get notification settings
PUT  /api/v1/notification-settings → protected, update notification settings
WS   /api/v1/ws/{channel}        → protected WebSocket
```

---

## Frontend App Structure (Angular v19 Standalone)

- **No NgModules** — fully standalone components
- **Routing**: lazy-loaded feature routes
- **NgRx**: signal store pattern per feature, root store for auth/app state
- **Ionic**: mobile-first layout with tab navigation scaffold
- **Capacitor**: configured for iOS + Android native builds
- **PWA**: `@angular/pwa` service worker, `manifest.webmanifest`, offline shell

### Screens

| Route             | Component        | Description                                          |
|-------------------|------------------|------------------------------------------------------|
| `/login`          | `LoginPage`      | Logo + social login buttons + "sign in with email"   |
| `/tabs/home`      | `HomePage`       | Garden dashboard with tasks, plots overview, insights |
| `/tabs/plots`     | `PlotsPage`      | List and manage garden plots                         |
| `/tabs/calendar`  | `CalendarPage`   | Task calendar and scheduling                         |
| `/tabs/library`   | `CropsPage`      | Crop library/encyclopedia                            |
| `/tabs/profile`   | `ProfilePage`    | User profile information                             |
| `/tabs/settings`  | `SettingsPage`   | App settings, theme/accent picker, sign out          |
| `/tabs/example`   | `ExampleListPage`| Example CRUD feature (list + detail)                 |

### Theming System

`ThemeService` (`core/theme/theme.service.ts`) is a signal-based singleton that:
- Persists `scheme` (`'light' | 'dark' | 'system'`) to `localStorage` and applies `body.light` / `body.dark` class
- Persists `accent` (`'clay' | 'moss' | 'dune' | 'slate' | null`) to `localStorage` and sets `body[data-accent]`

CSS is in `src/theme/variables.scss`:
- `:root` — default blue palette + semantic colors
- `@mixin dark-base` — dark surface/text tokens
- `@mixin accent-{name}-{light|dark}` — 4 accents × 2 modes (8 mixins)
- `body.dark` + `body:not(.light):not(.dark) @media (prefers-color-scheme: dark)` — applies dark tokens
- `body[data-accent='*']` — applies light accent tokens; dark overrides nested inside `body.dark`

The `SettingsPage` exposes the full picker UI (scheme segment + 5 accent swatches).

### Shared Component Library

40+ standalone components in `shared/components/`, all barrel-exported from `shared/index.ts`.
Every component has a co-located `.stories.ts` (Storybook) and `.scss` (BEM-styled).

| Category        | Components |
|-----------------|------------|
| Garden          | TaskCard, TaskListItem, ProgressBar, StatChip, FilterChip, WeatherWidget, InsightCard, GardenGridSlot, SpecimenCard, DayPicker, PlotTypeSelector, HeroSection, IconContainer, TopAppBar (supports `[actions]: NavAction[]` + `(actionClick)` for declarative trailing icon buttons), BottomNavBar |
| Layout          | Card, Section, Divider, PageHeader, ListItem |
| Identity        | Avatar, Badge, Logo |
| Forms           | FormField, SelectField, TextareaField, ToggleField, SearchBar |
| Feedback        | InlineAlert, ErrorState, SuccessState, EmptyState, LoadingSkeleton |
| Media           | ImageWithFallback |
| Auth            | SocialLoginButton, Chip, ChipList |
| Admin Dashboard | StatCard, DataTable, ActionMenu, Drawer, Sidebar |

### NgRx Store Layout
```
store/
  app.state.ts         ← root state interface

features/example/store/
  example.state.ts     ← feature state interface + initial state
  example.actions.ts   ← load, loadSuccess, loadFailure, create, update, delete
  example.reducer.ts   ← pure reducer
  example.selectors.ts ← memoized selectors
  example.effects.ts   ← side effects (HTTP calls via service)
```

### Frontend Authentication Best Practices

**1. Initialization & Token Readiness**

`AuthService` is initialized by `keycloak-angular` at app startup. Always check `isLoggedIn()` before accessing user data:

```typescript
async ngOnInit(): Promise<void> {
  if (await this.auth.isLoggedIn()) {
    const profile = await this.auth.getProfile();
    // Use profile
  }
}
```

**2. HTTP Interceptor Integration**

The HTTP interceptor (`core/interceptors/http-error.interceptor.ts`) automatically adds the Bearer token to all outgoing requests. No manual token injection needed.

**3. Minimal API Calls to Keycloak**

- ✅ Extract user profile from JWT token (no HTTP call)
- ✅ Extract roles from JWT `realm_access.roles` (no HTTP call)
- ✅ Check token expiry with `keycloak.getTokenParsed().exp`
- ❌ Avoid calling `/realms/gardream/account` endpoint (not necessary, data is in JWT)
- ❌ Avoid redundant `/realms/gardream/protocol/openid-connect/userinfo` calls

**4. Token Refresh Lifecycle**

`keycloak-angular`'s `getToken()` does **not** auto-refresh the access token — it returns the current token as-is, which may be expired. The `authInterceptor` must call `updateToken(30)` before calling `getToken()`. This silently refreshes the access token if it expires within 30 seconds, preventing stale tokens from reaching the API:

```typescript
// In auth.interceptor.ts — always refresh before use
await keycloak.updateToken(30); // refresh if expiring within 30s
const token = await keycloak.getToken();
```

Skipping `updateToken` leads to 401 responses from the API, which the error interceptor converts into a redirect to `/login`. The login guard then bounces the user back (Keycloak session is still valid via refresh token), causing a redirect loop.

**5. Error Handling**

If token extraction fails (corrupted token, missing claims), return empty profile:

```typescript
catch (err) {
  console.error('[AuthService] Failed to extract profile from token:', err);
  return {}; // safe fallback
}
```

**6. PWA Offline Behavior**

Tokens are stored in keycloak-js session storage. On offline:
- User can still access cached pages (service worker)
- User cannot make API calls (no network)
- Refresh tokens won't work; user will need to re-login when online

**7. Testing Auth Services**

Mock `keycloak-angular` in tests:

```typescript
const mockKeycloak = {
  isLoggedIn: () => Promise.resolve(true),
  getToken: () => Promise.resolve('eyJh...'),
  getTokenParsed: () => ({ sub: '123', email: 'test@example.com', realm_access: { roles: ['user'] } })
};
```

---

## Database

- **PostgreSQL 17** with two databases:
  - `app_db` — application data (managed by Alembic)
  - `keycloak_db` — Keycloak internal data (managed by Keycloak)
- Alembic autogenerate enabled; migration workflow via `run.sh`
- pgAdmin pre-configured to connect to both databases

---

## Environment Variables (`.env.example`)

A single `.env` file at the repo root drives both the app and infra stacks.

```env
# App — PostgreSQL connection (backend)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=appuser
POSTGRES_PASSWORD=changeme
POSTGRES_DB=app_db

# App — Keycloak connection (backend)
KEYCLOAK_INTERNAL_URL=http://keycloak:8080              # container-to-container JWKS fetch
KEYCLOAK_PUBLIC_URL=https://gateway.localhost/keycloak  # must match iss claim in tokens
KEYCLOAK_REALM=gardream

# App — Backend
SECRET_KEY=changeme
BACKEND_CORS_ORIGINS=["https://localhost", "https://gateway.localhost"]
LOG_LEVEL=info

# Infra — PostgreSQL database (Keycloak + app)
KEYCLOAK_DB=keycloak_db
KEYCLOAK_DB_USER=keycloak
KEYCLOAK_DB_PASSWORD=changeme

# Infra — Keycloak admin
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=changeme

# Infra — Gateway (all infra services served under this domain)
GATEWAY_HOSTNAME=gateway.localhost

# Infra — Traefik
TRAEFIK_DASHBOARD_AUTH=admin:<bcrypt_hash>   # generate: docker run --rm httpd:2-alpine htpasswd -nbB admin yourpassword

# Infra — pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@local.dev
PGADMIN_DEFAULT_PASSWORD=changeme
PGADMIN_OAUTH_CLIENT_SECRET=changeme_pgadmin_secret

# Infra — Webhook
WEBHOOK_SECRET=changeme

# Infra — TLS / domain (prod only)
TLS_MODE=local
DOMAIN=localhost
ACME_EMAIL=your@email.com
```

> **Keycloak issuer note**: The JWT `iss` claim equals `https://<GATEWAY_HOSTNAME>/keycloak/realms/<KEYCLOAK_REALM>`.
> `KEYCLOAK_PUBLIC_URL` is the base Keycloak URL with path (includes `/keycloak`) — the backend appends the realm path itself.
> JWKS fetching uses `KEYCLOAK_INTERNAL_URL` (container-to-container, no TLS overhead) and includes the `/keycloak` path.
> Both are configured in `backend/app/core/config.py`.

---

## `run.sh` — Task Runner

```
# Infra (run once — persists across dev sessions)
./run.sh infra:start          # Start Traefik, Postgres, Keycloak, pgAdmin, Webhook
./run.sh infra:stop           # Stop infra services
./run.sh infra:logs [svc]     # Tail infra logs

# App services
./run.sh dev                  # Start backend + frontend (hot reload) — requires infra:start first
./run.sh prod                 # Start all services (production mode, detached)
./run.sh stop                 # Stop app services
./run.sh restart              # Stop + dev
./run.sh logs [svc]           # Tail app logs
./run.sh build                # Rebuild app images

# Database
./run.sh db:migrate           # Run Alembic migrations (upgrade head)
./run.sh db:revision <msg>    # Create new Alembic autogenerate revision
./run.sh db:reset             # Drop + recreate app_db (dev only, destructive)
./run.sh db:setup             # Idempotently create app_db / keycloak_db and extensions
./run.sh setup:dev            # Full dev bootstrap: certs → infra → DB setup → Keycloak → migrations → dev user

# Frontend / mobile
./run.sh frontend:sync        # Angular build + Capacitor sync (iOS/Android)
./run.sh storybook            # Start Storybook at http://localhost:6006

# Keycloak
./run.sh keycloak:user [u] [p]  # Create a dev user in the gardream realm
./run.sh keycloak:export        # Export realm config to infra/keycloak/realm-config.json

# Misc
./run.sh certs                # Generate self-signed TLS certs for local dev
./run.sh shell [svc]          # Open bash shell in a service (default: backend)
```

---

## Docker Compose Services

Two compose files — start infra once, restart app as needed.

### `infra/docker-compose.yml` — infrastructure (persistent)

| Service  | Image                          | URL                                   | Notes                                    |
|----------|--------------------------------|---------------------------------------|------------------------------------------|
| traefik  | traefik:v3.6                   | https://gateway.localhost/traefik/dashboard/ | Ports 80/443, Docker label autodiscovery |
| postgres | timescale/timescaledb + PostGIS| —                                     | TimescaleDB + PostGIS, two databases     |
| keycloak | quay.io/keycloak/keycloak:26.0 | https://gateway.localhost/keycloak    | Realm `gardream` imported on first start |
| pgadmin  | dpage/pgadmin4                 | https://gateway.localhost/pgadmin     | OAuth2 SSO via Keycloak                  |
| webhook  | custom (Python)                | https://gateway.localhost/webhook     | CI/CD deploy trigger on push to main     |

### `docker-compose.local.yml` — app services (dev)

| Service  | Image             | Notes                                         |
|----------|-------------------|-----------------------------------------------|
| backend  | ./backend         | FastAPI, hot-reload, joins `proxy-network`    |
| frontend | ./frontend        | `ng serve` on :4200, joins `proxy-network`    |
| storybook| ./frontend        | `npm run storybook`, profile `storybook`      |

All services communicate via the `proxy-network` Docker bridge network. Infra creates it; app services join it as external.

---

## Local Dev TLS Notes

Traefik uses a self-signed certificate. On first visit to any `.localhost` domain:
- Chrome: type `thisisunsafe` on the warning page
- Firefox: Advanced → Accept Risk
- For mobile testing on the same network: access via machine IP, same browser override

---

## Storybook

Storybook is set up in `frontend/` for developing and documenting shared UI components in isolation.

- **Version**: `@storybook/angular` v8
- **Config**: `frontend/.storybook/` (`main.ts`, `preview.ts`, `preview-head.html`)
- **Builder**: `@storybook/angular:start-storybook` Angular architect target (NOT legacy `storybook dev`)
- **Scripts**: `ng run pwa-template:storybook` (via `angular.json` architect target)
- **tsconfig**: `tsconfig.storybook.json` — extends base, includes `.storybook/**/*.ts`
- **Addons**: `addon-essentials`, `addon-interactions`, `@chromatic-com/storybook`
- **Autodocs**: enabled — stories tagged with `autodocs` get an auto-generated docs page
- **Theme toggle**: Light/Dark switcher in toolbar — sets `body.dark` class via `withTheme` decorator in `preview.ts`
- **Font**: Source Sans 3 injected via `preview-head.html` (NOT imported in `preview.ts` — Angular builder handles global styles via `styles` array)
- **Coverage**: stories across all 40+ shared components

### Story locations

Stories live co-located with their component, exclusively inside `shared/components/`:

```
shared/components/<name>/
  <name>.component.ts
  <name>.component.stories.ts   ← story file
```

Features do not have stories — only `shared/` components are documented in Storybook.

### Running Storybook

```bash
./run.sh storybook         # via Docker (recommended) → http://localhost:6006
# or from frontend/:
npm run storybook          # dev server with hot reload
npm run build-storybook    # static build
```

---

## Production Deployment Checklist

1. Set `TLS_MODE=letsencrypt` and `DOMAIN=yourdomain.com` in `.env`
2. Set `GATEWAY_HOSTNAME=gateway.yourdomain.com` in `.env`
3. Point DNS A records to server IP for `yourdomain.com` and `gateway.yourdomain.com`
4. Update `KEYCLOAK_PUBLIC_URL=https://gateway.yourdomain.com/keycloak` in `.env`
5. Update frontend `environment.prod.ts` `keycloak.url` to `https://gateway.yourdomain.com/keycloak`
6. Fill all `changeme` values with strong secrets
7. Fill Google and Facebook OAuth credentials
8. `./run.sh infra:start && ./run.sh prod`
9. After Keycloak boots: configure social IdP redirect URIs in Google/Facebook console
   - `https://gateway.yourdomain.com/keycloak/realms/gardream/broker/google/endpoint`
   - `https://gateway.yourdomain.com/keycloak/realms/gardream/broker/facebook/endpoint`
