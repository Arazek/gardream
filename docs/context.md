# Session Context — Debugging & Fixes

## Infrastructure

### Problem: Conflicting Traefik routers
Another project's Traefik (`pwa-infra-traefik-1`) shared Docker socket with gardream's Traefik. Both created routers with same names (`keycloak`, `pgadmin`) but different rules. Traefik logged `Router defined multiple times with different configurations`. Made Keycloak routing unpredictable — auth endpoint would 504 while well-known worked.

**Fix:** Stopped and removed all `pwa-infra-*` and `pwa-ionic-python-template-*` containers, networks, volumes. Reverted router names to original.

### Problem: HTTP/HTTPS mismatch
`KC_HOSTNAME` was hardcoded to `https://` in docker-compose. `KEYCLOAK_PUBLIC_URL` in `.env` was `https://localhost/keycloak`. Frontend `environment.ts` used `http://localhost/...`. After login, Keycloak redirected to HTTPS → SSL cert error → auth state lost.

**Fix:** Changed `KC_HOSTNAME` to use `${KC_HOSTNAME_URL}` variable (defaults to `http://` for local dev). Updated `.env` → `KEYCLOAK_PUBLIC_URL=http://localhost/keycloak`.

### Problem: Backend env var stale
After changing `.env`, backend container kept old value because `docker compose restart` didn't re-read `.env`. Needed `--force-recreate`.

---

## Login Flow

### Problem: Keycloak init failure
`Keycloak initialization failed` with "Timeout when waiting for 3rd party check iframe message". Caused by conflicting Traefik routing + broken silent SSO check.

**Fix:** Removed `silentCheckSsoRedirectUri` from keycloak config. Set `checkLoginIframe: false`. Traefik cleanup fixed the routing.

### Problem: 403 redirect loop
`SyncService` immediately called `/api/v1/plots` on startup (network listener emit). No token → backend `HTTPBearer` returns 403. Error interceptor redirected to `/login`, creating loop.

**Fix:**
- `sync.service.ts:sync()` — added auth guard (`if (!this.keycloak.authenticated) return;`)
- `error.interceptor.ts` — skip redirect to `/login` if already there

---

## Task Creation

### Problem: Modal initialBreakpoint mismatch
`calendar.page.ts`: `initialBreakpoint: 0.9` not in `breakpoints: [0, 0.75, 1]`. Ionic warning: "Your breakpoints array must include the initialBreakpoint value."

**Fix:** Added `0.9` to breakpoints: `[0, 0.75, 0.9, 1]`.

### Problem: Missing createTask effect
`TasksActions.createTask` was dispatched by calendar page but had no NgRx effect handler. `updateTask`, `deleteTask`, `markTasksCompleted` all had handlers — `createTask` was missing.

**Fix:** Added `createTask$` effect in `tasks.effects.ts`. Creates `Task` with `tmp_` UUID, saves to local DB, adds outbox entry, calls `sync.push()`.

### Problem: Sync service missing task create handling
`sync.service.ts:pushEntry()` for `task` entity only handled `update` and `delete`. `create` was silently ignored.

**Fix:** Added `case 'task': operation === 'create'` → calls `tasksApi.create()`, rewrites temp ID via `rewriteTmpId()`.

---

## Sync (Marking Tasks Done)

### Problem: Stale tmp_xxx IDs in push()
`push()` loaded all pending outbox entries into memory. When `create` entry processed → `rewriteTmpId` updated DB — but in-memory `update` entry still had old `tmp_xxx` ID. Then `PATCH /api/v1/tasks/tmp_xxx` → 404.

**Fix:** `sync.service.ts:push()` — re-fetches pending entries from DB after any entry with `tmp_` ID is processed.

### Problem: Update on tmp_xxx task not syncing
Tasks created locally (via FAB) had `tmp_xxx` IDs. When user clicked "done", the `update` outbox entry tried to `PATCH /api/v1/tasks/tmp_xxx` → 404 (server never saw this ID).

**Fix:** `sync.service.ts:pushEntry()` for task `update` — if `entity_id` starts with `tmp_`, first reads task from local DB, creates it on server via POST, rewrites ID, THEN applies the PATCH update.

### Problem: push() not returning rewritten IDs
Effects that called `sync.push()` couldn't know if IDs were rewritten.

**Fix:** `push()` now returns `Record<string, string>` mapping old `tmp_` IDs to real server UUIDs. `createTask$` and `updateTask$` effects use this to look up tasks by the correct ID after sync.

### Problem: updateTaskSuccess not updating pendingTasks
`tasks.reducer.ts`: `updateTaskSuccess` only updated `state.tasks`, not `state.pendingTasks`. Notification service and overdue badges read from `pendingTasks` — so badge never updated when task was marked done.

**Fix:** Added `pendingTasks` mapping to `updateTaskSuccess` handler in reducer.

### Problem: updateTask$ can't find task after ID rewrite
After `sync.push()` rewrites `tmp_xxx` → real UUID, `getTaskById(id)` returned null (old ID gone). `updateTaskSuccess` dispatched with undefined → store not updated.

**Fix:** After push, tries `getTaskById(rewritten[id] ?? id)`. If still not found (fallback), dispatches `loadAllPendingTasks` to refresh store from DB.

---

## Calendar Scroll

### Problem: Task list not scrollable on mobile
Mobile layout stacked calendar grid + tasks vertically. `.cal-tasks-body` had `flex: 1; overflow-y: auto` but parent chain had no height propagation. Calendar grid (604px) filled almost entire viewport (681px), leaving 0px for tasks body.

**Fix:**
- Removed `[scrollY]="false"` from `app-page-content` — page scrolls naturally on mobile
- Mobile: `.cal-layout` / `.cal-layout__tasks` no longer have `flex: 1` / `height: 100%` — content flows naturally
- Desktop (>=64rem): still uses fixed two-column grid with independent task scroll
