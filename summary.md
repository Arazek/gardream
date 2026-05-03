# Garden Task Planner (gardream)

A mobile-first PWA for hobbyist and urban gardeners to organize plots, track crops, auto-generate gardening tasks, and manage specimens offline-first.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Ionic 8 + Angular 19 (standalone, no NgModules) |
| State | NgRx 19 (Store, Effects, Router-Store, DevTools) |
| Native | Capacitor 6 (iOS + Android) |
| PWA | @angular/service-worker + ngsw-config |
| Styling | SCSS + BEM, Ionic CSS props, dark mode + 4 accent themes |
| Backend | FastAPI (async Python), SQLAlchemy 2.x, Alembic |
| Auth | Keycloak 26 (OIDC, PKCE, Google/Facebook OAuth) |
| Database | PostgreSQL 17 + TimescaleDB + PostGIS |
| Infra | Docker Compose, Traefik, pgAdmin, Garage (S3-compatible storage) |
| Testing | Jasmine/Karma (unit), Playwright (e2e), pytest/httpx (backend) |
| Docs | Storybook 8 (40+ stories) |

## Architecture

- **Monorepo**: `frontend/`, `backend/`, `infra/`, `docs/`, `scripts/`
- **Offline-first**: All writes go to local SQLite first, queued in an outbox, synced to server via push/pull cycle with temp ID rewriting
- **Clean Architecture (backend)**: endpoints (thin handlers) → services (business logic) → models (ORM) → schemas (Pydantic), plus core/ for cross-cutting concerns
- **Feature-first (frontend)**: each feature has pages/, components/, services/, store/, and a routes.ts file
- **API versioning**: all routes under `/api/v1/`
- **NgRx store** for shared server data; **Angular signals** for transient UI state (sync status, theme)

## Route Structure

```
/login                  → LoginPage (redirects if already logged in)
/tabs                   → TabsPage (auth-guarded)
  /tabs/home            → Home dashboard
  /tabs/calendar        → Task calendar
  /tabs/library         → Crop library (+ /:id detail)
  /tabs/plots           → Plot list (+ /new, /:id detail, /:id/slots/:slotId/specimen)
  /tabs/profile         → User profile
  /tabs/settings        → Theme picker, accent color, sign out
  /tabs/example         → Reference CRUD feature
```

## Key Frontend Files

| File | Purpose |
|---|---|
| `app.config.ts` | Root DI config (router, Ionic, NgRx, Keycloak, service worker) |
| `app.routes.ts` | Root routing table |
| `core/auth/` | Auth service, guards, interceptor |
| `core/db/local-db.service.ts` | Local SQLite via @capacitor-community/sqlite |
| `core/sync/` | Sync engine, network monitor, sync status signals |
| `core/task-generator/` | Auto-generates tasks from crop schedules |
| `core/notifications/` | Local push notifications via Capacitor |
| `core/theme/` | Signal-based dark mode + accent theme persistence |
| `store/index.ts` | Root NgRx store config |
| `theme/variables.scss` | All CSS variable overrides, dark mode, accent themes |

## Key Backend Files

| File | Purpose |
|---|---|
| `main.py` | App factory, lifespan (scheduler, engine), CORS, static mounts |
| `core/config.py` | pydantic-settings config from env |
| `core/security.py` | JWT verification via Keycloak JWKS (cached, key-rotation-aware) |
| `core/dependencies.py` | get_db, get_current_user, require_role |
| `models/` | SQLAlchemy ORM models (plot, crop, task, specimen, etc.) |
| `services/task_generator.py` | Task schedule generation logic |
| `services/scheduler.py` | APScheduler for morning/evening notifications |

## Data Model Highlights

- **Plot**: ground_bed/raised_bed/container/vertical/seedling_tray, rows/cols grid, watering/fertilise days
- **Crop**: category, days to germination/harvest, care frequencies, sun requirement, companion/avoid crops
- **Task**: water/fertilise/prune/harvest/check/custom, due_date, linked to plot_slot
- **Specimen**: note_entries JSONB, photo_log JSONB, milestones JSONB, growth tracking
- **Outbox**: offline write queue with temp ID rewriting on sync

## Key Patterns

- All components are standalone (no NgModules)
- Actions are past-tense events, not imperative commands
- One `createActionGroup` per feature
- SCSS with BEM, no IDs in stylesheets, no raw px, max 2-level nesting
- Backend uses strict layering: endpoints never contain business logic
- Two databases on one PostgreSQL: `app_db` (Alembic-managed) + `keycloak_db` (Keycloak-managed)
- Infra services in `infra/docker-compose.yml` (persist), app services in `docker-compose.local.yml` (restart frequently)
- User-uploaded photos stored in Garage (S3-compatible object storage) — not on local filesystem
- Files served via `GET /api/v1/files/{key}` endpoint (auth-protected, streams from Garage)
- Garage (`dxflrs/garage:v2.3.0`) with `--single-node --default-bucket` auto-creates bucket + access key on first start using env vars
