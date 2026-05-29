# AGENTS.md — Gardream

## Stack

- **Frontend**: Angular 19 standalone (no NgModules), Ionic 8, NgRx 19, Capacitor 6, SCSS+BEM
- **Backend**: FastAPI async (Python 3.12), SQLAlchemy 2.x async, Alembic, `python-jose` (JWT verify, no Keycloak SDK)
- **Auth**: Keycloak 26 — realm `gardream`, client `pwa-frontend` (PKCE). Backend verifies JWT via JWKS
- **DB**: PostgreSQL 17 + TimescaleDB + PostGIS
- **Files**: Garage S3 (self-hosted, `aioboto3` backend client)
- **Infra**: All Docker. Traefik reverse proxy. Multi-env compose: base + local/prod overrides
- **Paths**: `@app/*` → `src/app/*`, `@env/*` → `src/environments/*`
- **Realm**: `gardream` (not `pwa` as some docs say — `.env.example`, `config.py`, conftest all confirm)

## Dev setup

1. `cp .env.example .env` + edit changeme values
2. `./run.sh setup:dev` (one-time: certs → infra → db → keycloak realm → migrations → dev user)
3. `./run.sh dev` (every session; requires infra already running)

## Commands

All via `./run.sh`. Requires infra running unless noted.

| Command | What |
|---|---|
| `setup:dev` | Full bootstrap (one-time) |
| `infra:start` / `infra:stop` / `infra:logs` | Persistent infra stack |
| `dev` | Backend + frontend hot reload |
| `prod` | Full stack detached (prod mode) |
| `stop` / `restart` / `logs [svc]` / `build` | App lifecycle |
| `db:migrate` | Alembic upgrade head |
| `db:revision "msg"` | Autogenerate migration |
| `db:reset` | Drop+recreate app_db (destructive, asks confirmation) |
| `db:setup` | Idempotent user/db/extension creation |
| `frontend:sync` | Angular build + Capacitor sync |
| `storybook` | Storybook at localhost:6006 |
| `keycloak:user [u] [p]` | Dev user (default testuser/testpass123) |
| `keycloak:export` | Export realm to `infra/keycloak/realm-config.json` |
| `shell [svc]` | Bash in container (default backend) |
| `certs` | Regenerate self-signed TLS |

## Services

All behind Traefik. Local: `https://localhost:4443` (type `thisisunsafe` in Chrome on first visit). Infra services under `https://gateway.localhost/`.

| Service | URL |
|---|---|
| Angular PWA | `https://localhost:4443/` |
| FastAPI Swagger | `https://localhost:4443/api/v1/docs` |
| Keycloak admin | `https://gateway.localhost/keycloak` |
| pgAdmin | `https://gateway.localhost/pgadmin` |
| Traefik dashboard | `https://gateway.localhost/traefik/dashboard/` |

## Frontend conventions

- **NgRx actions**: past-tense event names (`Load Items`, `Items Loaded`, `Item Created`)
- **Styling**: `rem`-only. No pure black (`--color-on-surface: #1b1c1a`). Icons `border-radius: 9999px`. Token-only colors (`variables.scss`)
- **All components standalone**, `app-` selector prefix
- **Routes**: lazy-loaded children per feature
- **Store**: `store/index.ts` registers all reducers+effects
- **Shared**: barrel export at `shared/index.ts`
- **Auth**: `provideKeycloak()` (v19 API, not deprecated `KeycloakAngularModule`). Token refresh requires `updateToken(30)` before `getToken()` in interceptor — missing this causes 401 redirect loop
- **Theme**: `ThemeService` (injectable) — scheme (`light`/`dark`/`system`) + accent (`clay`/`moss`/`dune`/`slate`). Persists to localStorage. Never manipulate `body.dark` directly.

## Backend conventions

- **FastAPI** `async def` endpoints, `async_session_factory` from `db/session.py`
- **Models** in `app/models/`, schemas in `app/schemas/`
- **Pydantic pattern**: `*Base`, `*Create`, `*Update`, `*Response`
- **Table names**: plural snake_case. PK = UUID `id`. FK = `<table_singular>_id`. Every table has `created_at`, `updated_at`
- **Alembic only** — no `Base.metadata.create_all()` in prod. Lifespan only starts scheduler (`apscheduler`) + disposes engine
- **CORS**: `BACKEND_CORS_ORIGINS` env var is comma-separated OR JSON string (not List[str]). `backend/.env.override` adds `http://localhost:4200`
- **Config** (`core/config.py`) loads `.env` from project root, not backend/
- **New Alembic revision** = import new model in `alembic/env.py` (each model imported explicitly via noqa)

## Testing

- **Backend**: `pytest` (from `backend/` or via container). Requires live Docker stack — uses real Keycloak token. `httpx` with `verify=False` (self-signed cert). Fixtures in `conftest.py` create test plot/crop. `pytest` not in `requirements.txt` — install manually or run in dev container
- **Frontend unit**: `npm test` (Karma+Jasmine)
- **Frontend e2e**: `npm run e2e` (Playwright, `e2e/`). Chromium desktop + Pixel 5 mobile

## Gotchas

- `::part()` SCSS selectors don't work under Angular emulated ViewEncapsulation — put them in `src/global.scss`
- Keycloak `iss` claim = public URL (`KEYCLOAK_PUBLIC_URL`). Backend verifies JWKS against internal URL (`KEYCLOAK_INTERNAL_URL`). Both in `config.py`
- If realm already exists in DB, Keycloak silently skips re-import. To force: wipe `keycloak_data` volume or use `kcadm.sh`
- Keycloak 26 FreeMarker: `?html` is parse error (auto-escaping on). Use plain `${}`
- `switchMap` in effects cancels in-flight requests — use `mergeMap` for concurrent loads (e.g., per-plot slot loading)
- Auth guards must return `UrlTree`, not `navigate() + false` (avoids redirect loop)
- `provideIonicAngular()` must be in `app.config.ts` providers

## Conventions (from `docs/CONVENTIONS.md`)

- **Git**: Conventional Commits — `feat(scope): summary`
- **Black** (88) + **Ruff** for Python. Type hints everywhere
- **SCSS + BEM**: max 2 nesting levels. No `px` — only `rem` or CSS var tokens
- **Stories** only for `shared/components/`, co-located, always `tags: ['autodocs']`
- No silent refactoring outside scope — flag convention violations, ask double confirmation before overriding

## Adding code

**Backend endpoint**: Model → Schema → Endpoint → register in `api/v1/router.py` → `db:revision "msg"` + `db:migrate`
**Frontend feature**: Folder `features/<name>/` with `pages/`, `components/`, `services/`, `store/` → routes file → register in `store/index.ts` → add lazy route to `app.routes.ts`

---

## Project Context

**Gardream** is a mobile-first PWA for hobbyist/urban gardeners to plan garden plots, track crops, auto-generate gardening tasks, and manage specimens. "Plan your garden visually, and always know what to do next."

### Stack

| Layer | Tech |
|---|---|
| Frontend | Angular 19 standalone + Ionic 8 + NgRx 19 + SCSS/BEM |
| Native | Capacitor 6 (Android build working) |
| Backend | FastAPI (Python 3.12, async) + SQLAlchemy 2.x + Alembic |
| Auth | Keycloak 26 (OIDC PKCE, Google/Facebook OAuth) |
| DB | PostgreSQL 17 + TimescaleDB + PostGIS |
| Files | Garage S3 (self-hosted) |
| Infra | Docker + Traefik v3 (all services at `gateway.localhost`) |

### Features Delivered

- **Home dashboard** — crop stages widget, weather widget, notification centre
- **Plot planner** — create plots, assign crops with per-crop watering/fertilisation schedule overrides, manage specimens with photo logs & milestones
- **Task engine** — auto-generates tasks from crop schedules, task calendar view with create/update/delete
- **Crop encyclopedia** — browse crops with detail pages
- **Offline-first sync** — local SQLite → outbox → server push/pull with temp ID rewriting
- **Auth** — Keycloak PKCE with silent SSO, Google/Facebook login, token refresh
- **Theme system** — light/dark + 4 accent colours (clay, moss, dune, slate)
- **Notifications** — rain alerts that suppress watering, local push notifications
- **Production setup** — interactive wizard script that generates `.env.prod`, prod compose overrides

### Routes

```
/tabs/home      → Home dashboard
/tabs/calendar  → Task calendar
/tabs/library   → Crop library (+ /:id detail)
/tabs/plots     → Plot list (+ /new, /:id detail, /:id/slots/:slotId/specimen)
/tabs/profile   → User profile
/tabs/settings  → Theme picker, accent colour, sign out
```

### Architecture

- **Monorepo**: `frontend/` `backend/` `infra/` `docs/` `scripts/`
- **Frontend**: Feature-first — each feature has `pages/`, `components/`, `services/`, `store/`, and a `routes.ts` file
- **Backend**: Clean architecture — thin endpoints → services (business logic) → models (ORM) → schemas (Pydantic), plus `core/` for cross-cutting concerns
- **Data model core loop**: Create Plot → Assign Crop (Specimen) → Generate Tasks → Execute Tasks
- **NgRx store** for shared server data; **Angular signals** for transient UI state (sync status, theme)
- **API versioning**: all routes under `/api/v1/`
