# Local-First Sync — Design Spec

**Date:** 2026-04-13  
**Status:** Approved

## Goal

Move all data logic client-side while keeping Keycloak for auth and the existing server as the source of truth. The app must work fully offline (reads and writes), sync transparently when online, and support multiple devices with server-wins conflict resolution.

---

## Architecture Overview

The app splits into two layers:

**Local layer (always active)**
- SQLite on device via `@capacitor-community/sqlite`
- NgRx effects read/write SQLite directly instead of calling the REST API
- Task generation runs client-side in TypeScript (port of the Python generator)
- Local notifications via `@capacitor/local-notifications`

**Sync layer (network-dependent)**
- An `outbox` table in SQLite queues every write that hasn't reached the server
- `SyncService` wakes on reconnect and app foreground, drains outbox (push), then pulls server state (server wins on conflict)
- Push failures due to conflict are surfaced to the user via the offline banner

**What stays on the server**
- Keycloak auth — unchanged
- Crop encyclopedia — pulled once on first login, cached by version
- All user data as source of truth (plots, slots, tasks, schedules)

**NgRx store** stays as-is for in-memory state. Effects are the only layer that changes — HTTP calls replaced with SQLite reads/writes. `SyncService` handles server communication independently in the background.

---

## Sync Flow

### Initial login / first run
1. Keycloak auth completes
2. Pull all user data from server → write to local SQLite (replaces existing local data)
3. Pull crop encyclopedia → cache locally (only if version changed)
4. Schedule local notifications for next 30 days of tasks
5. App ready — all subsequent reads are local

### Write path (online or offline)
1. User makes a change (create plot, update schedule, complete task)
2. Write immediately to local SQLite → NgRx store updates → UI reflects instantly
3. Operation added to `outbox` table
4. If online: SyncService picks it up within seconds and pushes to server
5. If offline: stays in outbox, banner appears showing pending count

### Sync trigger events
- App comes to foreground
- Network reconnects (Capacitor Network plugin)
- Every 5 minutes while online

### Sync sequence
1. **Push first:** drain outbox oldest-first, one request at a time
   - Success → mark synced, remove from outbox
   - 409 conflict → mark `failed`, add to banner warning list
   - Network error → stop, retry on next trigger
2. **Pull after push:** GET all user data from server → overwrite matching local records
3. Reschedule local notifications from fresh task data

### Conflict handling
- Server always wins on pull
- Outbox items rejected with 409 are marked `failed`
- User sees: *"1 change could not be saved — tap to review"* in the banner
- Review modal lets user discard or retry each failed item

---

## Local Database Schema

### Mirrored tables

```sql
plots
  id TEXT PRIMARY KEY,
  name TEXT,
  substrate TEXT,
  watering_days TEXT,       -- JSON array
  fertilise_days TEXT,      -- JSON array
  synced_at INTEGER         -- Unix timestamp

plot_slots
  id TEXT PRIMARY KEY,
  plot_id TEXT,
  crop_id TEXT,
  row INTEGER,
  col INTEGER,
  sow_date TEXT,
  watering_days_override TEXT,    -- JSON array or null
  watering_interval_weeks INTEGER,
  fertilise_days_override TEXT,   -- JSON array or null
  fertilise_interval_weeks INTEGER,
  synced_at INTEGER

crops
  id TEXT PRIMARY KEY,
  name TEXT,
  days_to_harvest INTEGER,
  watering_interval_days INTEGER,
  fertilise_frequency_days INTEGER,
  soil_mix TEXT
  -- read-only, never in outbox

tasks
  id TEXT PRIMARY KEY,
  slot_id TEXT,
  type TEXT,                -- 'water' | 'fertilise' | 'prune' | 'harvest'
  due_date TEXT,
  completed INTEGER,        -- 0 | 1
  completed_at TEXT,
  synced_at INTEGER
```

### New tables

```sql
outbox
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT,         -- 'plot' | 'plot_slot' | 'task'
  entity_id TEXT,           -- server id or tmp_<uuid> for offline creates
  operation TEXT,           -- 'create' | 'update' | 'delete'
  payload TEXT,             -- JSON snapshot of the full object
  created_at INTEGER,       -- Unix timestamp
  status TEXT,              -- 'pending' | 'failed'
  error TEXT                -- server error message on failure

sync_meta
  key TEXT PRIMARY KEY,     -- e.g. 'last_pull_at', 'crops_version'
  value TEXT
```

### Temporary IDs for offline creates
New records created offline get a `tmp_<uuid>` local ID. When SyncService pushes the create to the server, it receives the real server ID back and rewrites all local references (outbox entries, child records) before the pull step.

---

## Offline Banner & User Feedback

The banner appears at the top of every page (below the navbar, inside the main layout) when the device is offline or the outbox has pending/failed items. It is closable per-session and does not block interaction.

### Banner states

| State | Message | Colour |
|---|---|---|
| Offline, no pending | "You're offline — changes will sync when you reconnect" | Amber |
| Online, syncing | "Syncing changes…" | Blue |
| Online, pending items | "3 changes pending sync" | Amber |
| Failed items | "1 change could not be saved — tap to review" | Red |

### Failed items review modal
Tapping the red banner opens a modal listing failed operations:
```
Plot "Balcony Bed" — watering schedule update failed
  Server message: "Record was modified by another device"
  [Discard local change]  [Retry]
```

### SyncStatus signal
A single computed signal exposed app-wide — banner subscribes to it directly, no NgRx involvement (sync state is transient UI, not app data):

```typescript
type SyncStatus = 'idle' | 'syncing' | 'offline' | 'pending' | 'error'
```

---

## Local Task Generation

Port the Python task generator to TypeScript. Inputs: `slot`, `plot`, `crop`. Output: array of task objects. Runs:
- After initial pull (replace all tasks in local DB)
- After any slot schedule change (delete future uncompleted tasks for that slot, regenerate)
- After pull (merge server tasks, reschedule notifications)

The TypeScript implementation follows the same logic as `backend/app/services/task_generator.py`: 30-day rolling window (extended to 90 days for notification pre-scheduling), weekday filter, cadence check (`weeks_since_sow % interval == 0`).

---

## Local Notifications

- Plugin: `@capacitor/local-notifications`
- Scheduled after every successful sync pull and after any task/schedule change
- Window: next 30 days
- On reschedule: cancel all existing gardening notifications, recreate from current task list
- Notification body format: `"Time to water your Tomatoes in Balcony Bed"`
- Requires notification permission prompt on first run

---

## Key Files to Create / Modify

**Create:**
- `frontend/src/app/core/db/local-db.service.ts` — SQLite init, schema migrations, typed query methods
- `frontend/src/app/core/sync/sync.service.ts` — outbox drain, pull, conflict handling
- `frontend/src/app/core/sync/sync-status.signal.ts` — shared SyncStatus signal
- `frontend/src/app/core/sync/network.service.ts` — Capacitor Network plugin wrapper
- `frontend/src/app/core/notifications/local-notifications.service.ts` — schedule/cancel notifications
- `frontend/src/app/core/task-generator/task-generator.service.ts` — TypeScript port of Python generator
- `frontend/src/app/shared/components/offline-banner/offline-banner.component.ts`
- `frontend/src/app/shared/components/offline-banner/offline-banner.component.html`

**Modify:**
- All NgRx effects in `frontend/src/app/features/plots/store/plots.effects.ts` — swap HTTP for LocalDbService
- `frontend/src/app/app.component.ts` — init LocalDbService, SyncService on startup; add offline banner to layout
- `frontend/src/app/app.config.ts` — register new services
- `frontend/angular.json` — no change (Capacitor handles native plugins)
- `package.json` — add `@capacitor-community/sqlite`, `@capacitor/local-notifications`, `@capacitor/network`

---

## Out of Scope

- Real-time multi-device sync (changes on device A appear on device B without manual sync trigger)
- Collaborative editing (single user only)
- Selective sync (all user data syncs, no filtering)
- Background sync while app is fully closed (OS restrictions; sync on next foreground)
