# Local-First Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all REST API data calls with a local SQLite layer, add an outbox-based sync service that pushes writes and pulls server state in the background, port the task generator to TypeScript, add local notifications, and show an offline banner with pending change count.

**Architecture:** Local SQLite (via `@capacitor-community/sqlite`) is the single read source for all NgRx effects. Every mutation writes to SQLite + an outbox table simultaneously. A `SyncService` drains the outbox (push) then overwrites local records from the server (pull) whenever the device is online. Server remains the source of truth — server wins on conflict. Keycloak auth is unchanged.

**Tech Stack:** Angular 19, NgRx, Ionic 8, Capacitor 6, `@capacitor-community/sqlite`, `@capacitor/network`, `@capacitor/local-notifications`, Jasmine unit tests

**Spec:** `docs/superpowers/specs/2026-04-13-local-first-sync.md`

---

## File Map

**Create:**
- `frontend/src/app/core/db/local-db.service.ts` — SQLite init, schema, all typed CRUD methods
- `frontend/src/app/core/db/local-db.mock.ts` — test double for LocalDbService
- `frontend/src/app/core/sync/network.service.ts` — Capacitor Network plugin wrapper
- `frontend/src/app/core/sync/sync-status.signal.ts` — shared `SyncStatus` signal + type
- `frontend/src/app/core/sync/sync.service.ts` — push (outbox drain) + pull
- `frontend/src/app/core/task-generator/task-generator.service.ts` — TypeScript port of Python task generator
- `frontend/src/app/core/notifications/local-notifications.service.ts` — schedule/cancel local notifications
- `frontend/src/app/shared/components/offline-banner/offline-banner.component.ts`
- `frontend/src/app/shared/components/offline-banner/offline-banner.component.html`
- `frontend/src/app/shared/components/offline-banner/offline-banner.component.scss`

**Modify:**
- `frontend/package.json` — add 3 Capacitor plugins
- `frontend/capacitor.config.ts` — configure sqlite plugin
- `frontend/src/app/features/plots/store/plots.effects.ts` — swap HTTP for LocalDbService
- `frontend/src/app/features/tasks/store/tasks.effects.ts` — swap HTTP for LocalDbService
- `frontend/src/app/features/crops/store/crops.effects.ts` — swap HTTP for LocalDbService (read-only cache)
- `frontend/src/app/features/plots/store/specimens.effects.ts` — swap HTTP for LocalDbService
- `frontend/src/app/app.component.ts` — init DB + sync on startup, add offline banner
- `frontend/src/app/app.config.ts` — register SyncService, NetworkService, LocalNotificationsService

---

## Task 1: Install Capacitor Plugins

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/capacitor.config.ts`

- [ ] **Step 1: Install packages**

```bash
cd frontend
npm install @capacitor-community/sqlite @capacitor/network @capacitor/local-notifications
npx cap sync
```

Expected output: packages installed, `npx cap sync` runs without errors.

- [ ] **Step 2: Read capacitor.config.ts**

```bash
cat frontend/capacitor.config.ts
```

- [ ] **Step 3: Add SQLite plugin config to capacitor.config.ts**

Add `plugins.CapacitorSQLite` to the existing config object:

```typescript
plugins: {
  CapacitorSQLite: {
    iosDatabaseLocation: 'Library/CapacitorDatabase',
    iosIsEncryption: false,
    androidIsEncryption: false,
    electronWindowsLocation: 'C:\\ProgramData\\CapacitorDatabases',
  },
},
```

- [ ] **Step 4: Verify build still works**

```bash
cd frontend && npx ng build --configuration development 2>&1 | tail -20
```

Expected: build succeeds (no new errors).

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/capacitor.config.ts
git commit -m "chore: install capacitor sqlite, network, and local-notifications plugins"
```

---

## Task 2: LocalDbService — Init & Schema

**Files:**
- Create: `frontend/src/app/core/db/local-db.service.ts`

- [ ] **Step 1: Create local-db.service.ts**

```typescript
import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';

export interface OutboxEntry {
  id?: number;
  entity_type: 'plot' | 'plot_slot' | 'task' | 'specimen';
  entity_id: string;
  operation: 'create' | 'update' | 'delete';
  payload: string; // JSON
  created_at: number; // Unix ms
  status: 'pending' | 'failed';
  error: string | null;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS plots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plot_type TEXT NOT NULL,
  rows INTEGER NOT NULL,
  cols INTEGER NOT NULL,
  substrate TEXT,
  watering_days TEXT NOT NULL DEFAULT '[]',
  fertilise_days TEXT NOT NULL DEFAULT '[]',
  crop_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at INTEGER
);

CREATE TABLE IF NOT EXISTS plot_slots (
  id TEXT PRIMARY KEY,
  plot_id TEXT NOT NULL,
  crop_id TEXT NOT NULL,
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  sow_date TEXT NOT NULL,
  watering_days_override TEXT,
  watering_interval_weeks INTEGER NOT NULL DEFAULT 1,
  fertilise_days_override TEXT,
  fertilise_interval_weeks INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at INTEGER
);

CREATE TABLE IF NOT EXISTS crops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latin_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  days_to_germination INTEGER NOT NULL,
  days_to_harvest INTEGER NOT NULL,
  watering_frequency_days INTEGER NOT NULL,
  fertilise_frequency_days INTEGER NOT NULL,
  prune_frequency_days INTEGER,
  prune_start_day INTEGER,
  sun_requirement TEXT NOT NULL,
  spacing_cm INTEGER NOT NULL,
  soil_mix TEXT,
  companion_crops TEXT NOT NULL DEFAULT '[]',
  avoid_crops TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plot_slot_id TEXT,
  type TEXT NOT NULL,
  title TEXT,
  note TEXT,
  due_date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at INTEGER
);

CREATE TABLE IF NOT EXISTS specimens (
  id TEXT PRIMARY KEY,
  plot_slot_id TEXT NOT NULL,
  note_entries TEXT NOT NULL DEFAULT '[]',
  stage_override TEXT,
  photo_log TEXT NOT NULL DEFAULT '[]',
  milestones TEXT NOT NULL DEFAULT '[]',
  current_stage TEXT NOT NULL,
  progress_pct INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at INTEGER
);

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT
);

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

@Injectable({ providedIn: 'root' })
export class LocalDbService {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;

  async init(): Promise<void> {
    this.db = await this.sqlite.createConnection(
      'gardream',
      false,
      'no-encryption',
      1,
      false
    );
    await this.db.open();
    await this.db.execute(SCHEMA);
  }

  private get conn(): SQLiteDBConnection {
    if (!this.db) throw new Error('LocalDbService not initialized — call init() first');
    return this.db;
  }

  // ── Generic helpers ─────────────────────────────────────────────────────

  async run(sql: string, values: unknown[] = []): Promise<void> {
    await this.conn.run(sql, values);
  }

  async query<T>(sql: string, values: unknown[] = []): Promise<T[]> {
    const result = await this.conn.query(sql, values);
    return (result.values ?? []) as T[];
  }

  // ── Outbox ──────────────────────────────────────────────────────────────

  async addToOutbox(entry: Omit<OutboxEntry, 'id' | 'created_at' | 'status' | 'error'>): Promise<void> {
    await this.run(
      `INSERT INTO outbox (entity_type, entity_id, operation, payload, created_at, status, error)
       VALUES (?, ?, ?, ?, ?, 'pending', NULL)`,
      [entry.entity_type, entry.entity_id, entry.operation, entry.payload, Date.now()]
    );
  }

  async getPendingOutbox(): Promise<OutboxEntry[]> {
    return this.query<OutboxEntry>(
      `SELECT * FROM outbox WHERE status = 'pending' ORDER BY created_at ASC`
    );
  }

  async markOutboxSynced(id: number): Promise<void> {
    await this.run(`DELETE FROM outbox WHERE id = ?`, [id]);
  }

  async markOutboxFailed(id: number, error: string): Promise<void> {
    await this.run(`UPDATE outbox SET status = 'failed', error = ? WHERE id = ?`, [error, id]);
  }

  async getFailedOutbox(): Promise<OutboxEntry[]> {
    return this.query<OutboxEntry>(`SELECT * FROM outbox WHERE status = 'failed' ORDER BY created_at ASC`);
  }

  async deleteOutboxEntry(id: number): Promise<void> {
    await this.run(`DELETE FROM outbox WHERE id = ?`, [id]);
  }

  async getPendingCount(): Promise<number> {
    const rows = await this.query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM outbox WHERE status IN ('pending', 'failed')`
    );
    return rows[0]?.cnt ?? 0;
  }

  // ── SyncMeta ────────────────────────────────────────────────────────────

  async getSyncMeta(key: string): Promise<string | null> {
    const rows = await this.query<{ value: string }>(`SELECT value FROM sync_meta WHERE key = ?`, [key]);
    return rows[0]?.value ?? null;
  }

  async setSyncMeta(key: string, value: string): Promise<void> {
    await this.run(
      `INSERT INTO sync_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  }

  // ── Rewrite tmp IDs ─────────────────────────────────────────────────────

  async rewriteTmpId(tmpId: string, realId: string, entityType: 'plot' | 'plot_slot' | 'task'): Promise<void> {
    const table = entityType === 'plot' ? 'plots' : entityType === 'plot_slot' ? 'plot_slots' : 'tasks';
    await this.run(`UPDATE ${table} SET id = ? WHERE id = ?`, [realId, tmpId]);
    await this.run(`UPDATE outbox SET entity_id = ? WHERE entity_id = ?`, [realId, tmpId]);
    if (entityType === 'plot') {
      await this.run(`UPDATE plot_slots SET plot_id = ? WHERE plot_id = ?`, [realId, tmpId]);
      await this.run(`UPDATE tasks SET plot_slot_id = ? WHERE plot_slot_id = ?`, [realId, tmpId]);
    }
    if (entityType === 'plot_slot') {
      await this.run(`UPDATE tasks SET plot_slot_id = ? WHERE plot_slot_id = ?`, [realId, tmpId]);
      await this.run(`UPDATE specimens SET plot_slot_id = ? WHERE plot_slot_id = ?`, [realId, tmpId]);
    }
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -20
```

Expected: no TypeScript errors for the new file.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/core/db/local-db.service.ts
git commit -m "feat: add LocalDbService with SQLite schema and outbox methods"
```

---

## Task 3: LocalDbService — CRUD Methods

**Files:**
- Modify: `frontend/src/app/core/db/local-db.service.ts`

Add typed CRUD methods for each entity. Append these methods inside the `LocalDbService` class after `rewriteTmpId`.

- [ ] **Step 1: Add Plot CRUD methods**

```typescript
// ── Plots ────────────────────────────────────────────────────────────────

async upsertPlots(plots: import('../../features/plots/store/plots.state').Plot[]): Promise<void> {
  for (const p of plots) {
    await this.run(
      `INSERT INTO plots (id, name, plot_type, rows, cols, substrate, watering_days, fertilise_days, crop_count, created_at, updated_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, plot_type=excluded.plot_type, rows=excluded.rows, cols=excluded.cols,
         substrate=excluded.substrate, watering_days=excluded.watering_days,
         fertilise_days=excluded.fertilise_days, crop_count=excluded.crop_count,
         updated_at=excluded.updated_at, synced_at=excluded.synced_at`,
      [p.id, p.name, p.plot_type, p.rows, p.cols, p.substrate ?? null,
       JSON.stringify(p.watering_days), JSON.stringify(p.fertilise_days),
       p.crop_count, p.created_at, p.updated_at, Date.now()]
    );
  }
}

async getAllPlots(): Promise<import('../../features/plots/store/plots.state').Plot[]> {
  const rows = await this.query<Record<string, unknown>>(`SELECT * FROM plots ORDER BY created_at ASC`);
  return rows.map(r => ({
    ...(r as any),
    watering_days: JSON.parse(r['watering_days'] as string),
    fertilise_days: JSON.parse(r['fertilise_days'] as string),
  }));
}

async insertPlot(plot: import('../../features/plots/store/plots.state').Plot): Promise<void> {
  await this.upsertPlots([plot]);
}

async updatePlotLocal(id: string, changes: Partial<import('../../features/plots/store/plots.state').Plot>): Promise<void> {
  const fields = Object.keys(changes).filter(k => k !== 'id');
  if (!fields.length) return;
  const sets = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => {
    const v = (changes as Record<string, unknown>)[f];
    return Array.isArray(v) ? JSON.stringify(v) : v;
  });
  await this.run(`UPDATE plots SET ${sets}, updated_at = ? WHERE id = ?`,
    [...values, new Date().toISOString(), id]);
}

async deletePlotLocal(id: string): Promise<void> {
  await this.run(`DELETE FROM plots WHERE id = ?`, [id]);
}
```

- [ ] **Step 2: Add PlotSlot CRUD methods**

```typescript
// ── Plot Slots ───────────────────────────────────────────────────────────

async upsertSlots(slots: import('../../features/plots/store/plots.state').PlotSlot[]): Promise<void> {
  for (const s of slots) {
    await this.run(
      `INSERT INTO plot_slots (id, plot_id, crop_id, row, col, sow_date,
         watering_days_override, watering_interval_weeks,
         fertilise_days_override, fertilise_interval_weeks,
         created_at, updated_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         crop_id=excluded.crop_id, sow_date=excluded.sow_date,
         watering_days_override=excluded.watering_days_override,
         watering_interval_weeks=excluded.watering_interval_weeks,
         fertilise_days_override=excluded.fertilise_days_override,
         fertilise_interval_weeks=excluded.fertilise_interval_weeks,
         updated_at=excluded.updated_at, synced_at=excluded.synced_at`,
      [s.id, s.plot_id, s.crop_id, s.row, s.col, s.sow_date,
       s.watering_days_override ? JSON.stringify(s.watering_days_override) : null,
       s.watering_interval_weeks,
       s.fertilise_days_override ? JSON.stringify(s.fertilise_days_override) : null,
       s.fertilise_interval_weeks,
       s.created_at, s.updated_at, Date.now()]
    );
  }
}

async getSlotsByPlot(plotId: string): Promise<import('../../features/plots/store/plots.state').PlotSlot[]> {
  const rows = await this.query<Record<string, unknown>>(
    `SELECT * FROM plot_slots WHERE plot_id = ? ORDER BY row ASC, col ASC`, [plotId]
  );
  return rows.map(r => ({
    ...(r as any),
    watering_days_override: r['watering_days_override'] ? JSON.parse(r['watering_days_override'] as string) : null,
    fertilise_days_override: r['fertilise_days_override'] ? JSON.parse(r['fertilise_days_override'] as string) : null,
  }));
}

async insertSlot(slot: import('../../features/plots/store/plots.state').PlotSlot): Promise<void> {
  await this.upsertSlots([slot]);
}

async updateSlotLocal(id: string, changes: Partial<import('../../features/plots/store/plots.state').PlotSlot>): Promise<void> {
  const fields = Object.keys(changes).filter(k => k !== 'id' && k !== 'crop');
  if (!fields.length) return;
  const sets = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => {
    const v = (changes as Record<string, unknown>)[f];
    return Array.isArray(v) ? JSON.stringify(v) : v;
  });
  await this.run(`UPDATE plot_slots SET ${sets}, updated_at = ? WHERE id = ?`,
    [...values, new Date().toISOString(), id]);
}

async deleteSlotLocal(id: string): Promise<void> {
  await this.run(`DELETE FROM plot_slots WHERE id = ?`, [id]);
}
```

- [ ] **Step 3: Add Task CRUD methods**

```typescript
// ── Tasks ────────────────────────────────────────────────────────────────

async upsertTasks(tasks: import('../../features/tasks/store/tasks.state').Task[]): Promise<void> {
  for (const t of tasks) {
    await this.run(
      `INSERT INTO tasks (id, user_id, plot_slot_id, type, title, note, due_date, completed, completed_at, created_at, updated_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         type=excluded.type, title=excluded.title, note=excluded.note,
         due_date=excluded.due_date, completed=excluded.completed,
         completed_at=excluded.completed_at, updated_at=excluded.updated_at, synced_at=excluded.synced_at`,
      [t.id, t.user_id, t.plot_slot_id ?? null, t.type, t.title ?? null, t.note ?? null,
       t.due_date, t.completed ? 1 : 0, t.completed_at ?? null,
       t.created_at, t.updated_at, Date.now()]
    );
  }
}

async getTasksByDate(dueDate: string): Promise<import('../../features/tasks/store/tasks.state').Task[]> {
  const rows = await this.query<Record<string, unknown>>(
    `SELECT * FROM tasks WHERE due_date = ? ORDER BY type ASC`, [dueDate]
  );
  return rows.map(r => ({ ...(r as any), completed: r['completed'] === 1 }));
}

async getTasksBySlot(slotId: string): Promise<import('../../features/tasks/store/tasks.state').Task[]> {
  const rows = await this.query<Record<string, unknown>>(
    `SELECT * FROM tasks WHERE plot_slot_id = ? ORDER BY due_date ASC`, [slotId]
  );
  return rows.map(r => ({ ...(r as any), completed: r['completed'] === 1 }));
}

async insertTasksBulk(tasks: import('../../features/tasks/store/tasks.state').Task[]): Promise<void> {
  await this.upsertTasks(tasks);
}

async updateTaskLocal(id: string, changes: Partial<import('../../features/tasks/store/tasks.state').Task>): Promise<void> {
  const fields = Object.keys(changes).filter(k => k !== 'id');
  if (!fields.length) return;
  const sets = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => {
    const v = (changes as Record<string, unknown>)[f];
    return typeof v === 'boolean' ? (v ? 1 : 0) : v;
  });
  await this.run(`UPDATE tasks SET ${sets}, updated_at = ? WHERE id = ?`,
    [...values, new Date().toISOString(), id]);
}

async deleteTaskLocal(id: string): Promise<void> {
  await this.run(`DELETE FROM tasks WHERE id = ?`, [id]);
}

async deleteFutureUncompletedTasksForSlot(slotId: string, types: string[], fromDate: string): Promise<void> {
  const placeholders = types.map(() => '?').join(', ');
  await this.run(
    `DELETE FROM tasks WHERE plot_slot_id = ? AND type IN (${placeholders}) AND completed = 0 AND due_date >= ?`,
    [slotId, ...types, fromDate]
  );
}
```

- [ ] **Step 4: Add Crop and Specimen CRUD methods**

```typescript
// ── Crops ────────────────────────────────────────────────────────────────

async upsertCrops(crops: import('../../features/crops/store/crops.state').Crop[]): Promise<void> {
  for (const c of crops) {
    await this.run(
      `INSERT INTO crops (id, name, latin_name, category, description, thumbnail_url,
         days_to_germination, days_to_harvest, watering_frequency_days, fertilise_frequency_days,
         prune_frequency_days, prune_start_day, sun_requirement, spacing_cm,
         soil_mix, companion_crops, avoid_crops, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, updated_at=excluded.updated_at`,
      [c.id, c.name, c.latin_name, c.category, c.description ?? null, c.thumbnail_url ?? null,
       c.days_to_germination, c.days_to_harvest, c.watering_frequency_days, c.fertilise_frequency_days,
       c.prune_frequency_days ?? null, c.prune_start_day ?? null, c.sun_requirement, c.spacing_cm,
       c.soil_mix ? JSON.stringify(c.soil_mix) : null,
       JSON.stringify(c.companion_crops), JSON.stringify(c.avoid_crops),
       c.created_at, c.updated_at]
    );
  }
}

async getAllCrops(): Promise<import('../../features/crops/store/crops.state').Crop[]> {
  const rows = await this.query<Record<string, unknown>>(`SELECT * FROM crops ORDER BY name ASC`);
  return rows.map(r => ({
    ...(r as any),
    soil_mix: r['soil_mix'] ? JSON.parse(r['soil_mix'] as string) : null,
    companion_crops: JSON.parse(r['companion_crops'] as string),
    avoid_crops: JSON.parse(r['avoid_crops'] as string),
  }));
}

async getCropById(id: string): Promise<import('../../features/crops/store/crops.state').Crop | null> {
  const rows = await this.query<Record<string, unknown>>(`SELECT * FROM crops WHERE id = ?`, [id]);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    ...(r as any),
    soil_mix: r['soil_mix'] ? JSON.parse(r['soil_mix'] as string) : null,
    companion_crops: JSON.parse(r['companion_crops'] as string),
    avoid_crops: JSON.parse(r['avoid_crops'] as string),
  };
}

// ── Specimens ────────────────────────────────────────────────────────────

async upsertSpecimens(specimens: import('../../features/plots/store/specimens.state').Specimen[]): Promise<void> {
  for (const s of specimens) {
    await this.run(
      `INSERT INTO specimens (id, plot_slot_id, note_entries, stage_override, photo_log, milestones, current_stage, progress_pct, created_at, updated_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         note_entries=excluded.note_entries, stage_override=excluded.stage_override,
         photo_log=excluded.photo_log, milestones=excluded.milestones,
         current_stage=excluded.current_stage, progress_pct=excluded.progress_pct,
         updated_at=excluded.updated_at, synced_at=excluded.synced_at`,
      [s.id, s.plot_slot_id, JSON.stringify(s.note_entries), s.stage_override ?? null,
       JSON.stringify(s.photo_log), JSON.stringify(s.milestones),
       s.current_stage, s.progress_pct, s.created_at, s.updated_at, Date.now()]
    );
  }
}

async getSpecimenBySlot(slotId: string): Promise<import('../../features/plots/store/specimens.state').Specimen | null> {
  const rows = await this.query<Record<string, unknown>>(
    `SELECT * FROM specimens WHERE plot_slot_id = ?`, [slotId]
  );
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    ...(r as any),
    note_entries: JSON.parse(r['note_entries'] as string),
    photo_log: JSON.parse(r['photo_log'] as string),
    milestones: JSON.parse(r['milestones'] as string),
  };
}
```

- [ ] **Step 5: Verify build**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/core/db/local-db.service.ts
git commit -m "feat: add CRUD methods to LocalDbService for all entities"
```

---

## Task 4: NetworkService + SyncStatus Signal

**Files:**
- Create: `frontend/src/app/core/sync/network.service.ts`
- Create: `frontend/src/app/core/sync/sync-status.signal.ts`

- [ ] **Step 1: Write the failing test for NetworkService**

Create `frontend/src/app/core/sync/network.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { NetworkService } from './network.service';

describe('NetworkService', () => {
  let service: NetworkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetworkService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should expose online$ observable', () => {
    expect(service.online$).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx ng test --include='**/network.service.spec.ts' --watch=false 2>&1 | tail -20
```

Expected: FAILED — `NetworkService` not found.

- [ ] **Step 3: Create network.service.ts**

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkService implements OnDestroy {
  private onlineSubject = new BehaviorSubject<boolean>(true);

  readonly online$: Observable<boolean> = this.onlineSubject.asObservable();

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const status = await Network.getStatus();
    this.onlineSubject.next(status.connected);

    await Network.addListener('networkStatusChange', (status) => {
      this.onlineSubject.next(status.connected);
    });
  }

  get isOnline(): boolean {
    return this.onlineSubject.value;
  }

  ngOnDestroy(): void {
    Network.removeAllListeners();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npx ng test --include='**/network.service.spec.ts' --watch=false 2>&1 | tail -10
```

Expected: PASSED.

- [ ] **Step 5: Create sync-status.signal.ts**

```typescript
import { signal, computed } from '@angular/core';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'pending' | 'error';

// Writable signals — only SyncService mutates these
export const _syncOnline = signal(true);
export const _syncPendingCount = signal(0);
export const _syncIsSyncing = signal(false);
export const _syncHasError = signal(false);

// Public computed status — consumed by the banner and any component
export const syncStatus = computed<SyncStatus>(() => {
  if (!_syncOnline()) return 'offline';
  if (_syncIsSyncing()) return 'syncing';
  if (_syncHasError()) return 'error';
  if (_syncPendingCount() > 0) return 'pending';
  return 'idle';
});

export const syncPendingCount = _syncPendingCount.asReadonly();
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/core/sync/network.service.ts \
        frontend/src/app/core/sync/network.service.spec.ts \
        frontend/src/app/core/sync/sync-status.signal.ts
git commit -m "feat: add NetworkService and SyncStatus signal"
```

---

## Task 5: TaskGeneratorService

**Files:**
- Create: `frontend/src/app/core/task-generator/task-generator.service.ts`
- Create: `frontend/src/app/core/task-generator/task-generator.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/app/core/task-generator/task-generator.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { TaskGeneratorService } from './task-generator.service';
import { Plot } from '../../features/plots/store/plots.state';
import { PlotSlot } from '../../features/plots/store/plots.state';
import { Crop } from '../../features/crops/store/crops.state';

const basePlot: Partial<Plot> = {
  id: 'plot1', watering_days: [1, 3], fertilise_days: [5],
};

const baseSlot: Partial<PlotSlot> = {
  id: 'slot1', plot_id: 'plot1', crop_id: 'crop1', sow_date: '2026-04-14',
  watering_days_override: null, watering_interval_weeks: 1,
  fertilise_days_override: null, fertilise_interval_weeks: 1,
};

const baseCrop: Partial<Crop> = {
  id: 'crop1', name: 'Tomato', days_to_harvest: 90,
  prune_frequency_days: null, prune_start_day: null,
};

describe('TaskGeneratorService', () => {
  let service: TaskGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskGeneratorService);
  });

  it('should generate water tasks on plot watering_days', () => {
    const tasks = service.generate(
      baseSlot as PlotSlot, basePlot as Plot, baseCrop as Crop, 'user1'
    );
    const waterTasks = tasks.filter(t => t.type === 'water');
    expect(waterTasks.length).toBeGreaterThan(0);
    waterTasks.forEach(t => {
      const dow = new Date(t.due_date).getDay(); // 0=Sun
      // Mon=1, Wed=3 in JS getDay: Mon=1, Wed=3 (same as Python .weekday() for these days)
      expect([1, 3]).toContain(new Date(t.due_date).getDay());
    });
  });

  it('should use slot watering_days_override when set', () => {
    const slot = { ...baseSlot, watering_days_override: [2] } as PlotSlot; // Wed only
    const tasks = service.generate(slot, basePlot as Plot, baseCrop as Crop, 'user1');
    const waterTasks = tasks.filter(t => t.type === 'water');
    waterTasks.forEach(t => {
      expect(new Date(t.due_date).getDay()).toBe(3); // Wed in JS = 3
    });
  });

  it('should skip water tasks when watering_interval_weeks = 2', () => {
    const slot = { ...baseSlot, watering_interval_weeks: 2 } as PlotSlot;
    const tasks = service.generate(slot, basePlot as Plot, baseCrop as Crop, 'user1');
    const waterDates = tasks.filter(t => t.type === 'water').map(t => t.due_date).sort();
    // Dates must be at least 7 days apart (every other week)
    for (let i = 1; i < waterDates.length; i++) {
      const diff = (new Date(waterDates[i]).getTime() - new Date(waterDates[i - 1]).getTime()) / 86400000;
      expect(diff).toBeGreaterThanOrEqual(7);
    }
  });

  it('should generate a harvest task at sow_date + days_to_harvest', () => {
    const tasks = service.generate(baseSlot as PlotSlot, basePlot as Plot, baseCrop as Crop, 'user1');
    const harvest = tasks.find(t => t.type === 'harvest');
    expect(harvest).toBeTruthy();
    expect(harvest!.due_date).toBe('2026-07-13'); // 2026-04-14 + 90 days
  });

  it('should generate no tasks for empty watering_days and no override', () => {
    const plot = { ...basePlot, watering_days: [], fertilise_days: [] } as Plot;
    const tasks = service.generate(baseSlot as PlotSlot, plot, baseCrop as Crop, 'user1');
    expect(tasks.filter(t => t.type === 'water').length).toBe(0);
    expect(tasks.filter(t => t.type === 'fertilise').length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npx ng test --include='**/task-generator.service.spec.ts' --watch=false 2>&1 | tail -20
```

Expected: FAILED — `TaskGeneratorService` not found.

- [ ] **Step 3: Create task-generator.service.ts**

This is a TypeScript port of `backend/app/services/task_generator.py`. Python `.weekday()` returns 0=Mon…6=Sun. JavaScript `Date.getDay()` returns 0=Sun…6=Sat. The day values stored in the DB match Python convention (0=Mon). Convert when building dates.

```typescript
import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Plot, PlotSlot } from '../../features/plots/store/plots.state';
import { Crop } from '../../features/crops/store/crops.state';
import { Task, TaskCreate } from '../../features/tasks/store/tasks.state';

// Python weekday() convention: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
// JS Date.getDay() convention: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const pythonDowToJs = (dow: number): number => (dow + 1) % 7;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function jsDow(dateStr: string): number {
  return new Date(dateStr).getDay();
}

function isoDate(dateStr: string, offset: number): string {
  return addDays(dateStr, offset);
}

const WINDOW_DAYS = 90;

@Injectable({ providedIn: 'root' })
export class TaskGeneratorService {
  generate(
    slot: PlotSlot,
    plot: Plot,
    crop: Crop,
    userId: string,
    startDate?: string,
    taskTypes: string[] = ['water', 'fertilise'],
  ): Omit<Task, 'updated_at'>[] {
    const sowDate = slot.sow_date;
    const windowStart = startDate ?? sowDate;
    const endDate = addDays(sowDate, WINDOW_DAYS);
    const tasks: Omit<Task, 'updated_at'>[] = [];
    const now = new Date().toISOString();

    // ── Watering ────────────────────────────────────────────────────────
    if (taskTypes.includes('water')) {
      const effectiveDays = slot.watering_days_override ?? plot.watering_days;
      const interval = slot.watering_interval_weeks;
      const effectiveJsDows = effectiveDays.map(pythonDowToJs);

      if (effectiveDays.length > 0) {
        let current = windowStart < sowDate ? sowDate : windowStart;
        while (current <= endDate) {
          const dow = jsDow(current);
          const weeksSinceSow = Math.floor(daysBetween(sowDate, current) / 7);
          if (effectiveJsDows.includes(dow) && (interval <= 1 || weeksSinceSow % interval === 0)) {
            tasks.push({
              id: `tmp_${uuidv4()}`,
              user_id: userId,
              plot_slot_id: slot.id,
              type: 'water',
              title: null,
              note: null,
              due_date: current,
              completed: false,
              completed_at: null,
              created_at: now,
            });
          }
          current = addDays(current, 1);
        }
      }
    }

    // ── Fertilise ───────────────────────────────────────────────────────
    if (taskTypes.includes('fertilise')) {
      const effectiveDays = slot.fertilise_days_override ?? plot.fertilise_days;
      const interval = slot.fertilise_interval_weeks;
      const effectiveJsDows = effectiveDays.map(pythonDowToJs);

      if (effectiveDays.length > 0) {
        let current = windowStart < sowDate ? sowDate : windowStart;
        while (current <= endDate) {
          const dow = jsDow(current);
          const weeksSinceSow = Math.floor(daysBetween(sowDate, current) / 7);
          if (effectiveJsDows.includes(dow) && (interval <= 1 || weeksSinceSow % interval === 0)) {
            tasks.push({
              id: `tmp_${uuidv4()}`,
              user_id: userId,
              plot_slot_id: slot.id,
              type: 'fertilise',
              title: null,
              note: null,
              due_date: current,
              completed: false,
              completed_at: null,
              created_at: now,
            });
          }
          current = addDays(current, 1);
        }
      }
    }

    // ── Prune ───────────────────────────────────────────────────────────
    if (crop.prune_frequency_days && crop.prune_start_day) {
      let dayOffset = crop.prune_start_day;
      while (true) {
        const pruneDate = addDays(sowDate, dayOffset);
        if (pruneDate > endDate) break;
        tasks.push({
          id: `tmp_${uuidv4()}`,
          user_id: userId,
          plot_slot_id: slot.id,
          type: 'prune',
          title: null,
          note: null,
          due_date: pruneDate,
          completed: false,
          completed_at: null,
          created_at: now,
        });
        dayOffset += crop.prune_frequency_days;
      }
    }

    // ── Harvest ─────────────────────────────────────────────────────────
    tasks.push({
      id: `tmp_${uuidv4()}`,
      user_id: userId,
      plot_slot_id: slot.id,
      type: 'harvest',
      title: `Harvest ${crop.name}`,
      note: null,
      due_date: addDays(sowDate, crop.days_to_harvest),
      completed: false,
      completed_at: null,
      created_at: now,
    });

    return tasks;
  }
}
```

> **Note:** This requires `uuid` package. Install it: `npm install uuid && npm install -D @types/uuid`

- [ ] **Step 4: Install uuid**

```bash
cd frontend && npm install uuid && npm install -D @types/uuid
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd frontend && npx ng test --include='**/task-generator.service.spec.ts' --watch=false 2>&1 | tail -20
```

Expected: all 5 tests PASSED.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/core/task-generator/ frontend/package.json frontend/package-lock.json
git commit -m "feat: add TaskGeneratorService (TypeScript port of Python task generator)"
```

---

## Task 6: LocalNotificationsService

**Files:**
- Create: `frontend/src/app/core/notifications/local-notifications.service.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/core/notifications/local-notifications.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { LocalNotificationsService } from './local-notifications.service';
import { Task } from '../../features/tasks/store/tasks.state';
import { PlotSlot } from '../../features/plots/store/plots.state';

describe('LocalNotificationsService', () => {
  let service: LocalNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalNotificationsService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('buildNotificationTitle should format water task', () => {
    const task: Partial<Task> = { type: 'water', plot_slot_id: 'slot1' };
    const slotName = 'Tomato in Balcony Bed';
    expect(service.buildNotificationTitle(task as Task, slotName)).toBe('Time to water your Tomato in Balcony Bed');
  });

  it('buildNotificationTitle should format fertilise task', () => {
    const task: Partial<Task> = { type: 'fertilise', plot_slot_id: 'slot1' };
    expect(service.buildNotificationTitle(task as Task, 'Basil in Window Box'))
      .toBe('Time to fertilise your Basil in Window Box');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx ng test --include='**/local-notifications.service.spec.ts' --watch=false 2>&1 | tail -20
```

Expected: FAILED.

- [ ] **Step 3: Create local-notifications.service.ts**

```typescript
import { Injectable } from '@angular/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Task } from '../../features/tasks/store/tasks.state';

const NOTIFICATION_CHANNEL = 'gardream-tasks';
const NOTIFICATION_HOUR = 8; // 8 AM local time

@Injectable({ providedIn: 'root' })
export class LocalNotificationsService {

  async requestPermission(): Promise<boolean> {
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  }

  buildNotificationTitle(task: Task, slotLabel: string): string {
    const verb = task.type === 'water' ? 'water'
      : task.type === 'fertilise' ? 'fertilise'
      : task.type === 'prune' ? 'prune'
      : 'harvest';
    return `Time to ${verb} your ${slotLabel}`;
  }

  async scheduleTaskNotifications(
    tasks: Task[],
    slotLabels: Record<string, string>, // slotId → "CropName in PlotName"
  ): Promise<void> {
    await this.cancelAll();

    const today = new Date();
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(today.getDate() + 30);

    const upcoming = tasks.filter(t => {
      const d = new Date(t.due_date);
      return !t.completed && d >= today && d <= thirtyDaysOut;
    });

    if (upcoming.length === 0) return;

    const notifications: ScheduleOptions['notifications'] = upcoming
      .filter(t => t.plot_slot_id && slotLabels[t.plot_slot_id])
      .map((t, i) => {
        const dueDate = new Date(t.due_date);
        dueDate.setHours(NOTIFICATION_HOUR, 0, 0, 0);
        return {
          id: i + 1,
          title: 'Garden Task',
          body: this.buildNotificationTitle(t, slotLabels[t.plot_slot_id!]),
          schedule: { at: dueDate },
          channelId: NOTIFICATION_CHANNEL,
          extra: { taskId: t.id },
        };
      });

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
  }

  async cancelAll(): Promise<void> {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx ng test --include='**/local-notifications.service.spec.ts' --watch=false 2>&1 | tail -10
```

Expected: all 3 tests PASSED.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/core/notifications/
git commit -m "feat: add LocalNotificationsService for task reminders"
```

---

## Task 7: SyncService

**Files:**
- Create: `frontend/src/app/core/sync/sync.service.ts`

This service owns the outbox drain (push) and server pull. It calls the existing REST API services for HTTP operations, writes results to LocalDbService, and dispatches NgRx actions so the store stays in sync.

- [ ] **Step 1: Create sync.service.ts**

```typescript
import { Injectable, inject, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, interval } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { App } from '@capacitor/app';

import { LocalDbService, OutboxEntry } from '../db/local-db.service';
import { NetworkService } from './network.service';
import {
  _syncOnline,
  _syncPendingCount,
  _syncIsSyncing,
  _syncHasError,
} from './sync-status.signal';
import { PlotsApiService } from '../../features/plots/services/plots-api.service';
import { TasksApiService } from '../api/tasks-api.service';
import { CropsApiService } from '../api/crops-api.service';
import { PlotsActions } from '../../features/plots/store/plots.actions';
import { TasksActions } from '../../features/tasks/store/tasks.actions';
import { CropsActions } from '../../features/crops/store/crops.actions';
import { LocalNotificationsService } from '../notifications/local-notifications.service';

@Injectable({ providedIn: 'root' })
export class SyncService implements OnDestroy {
  private readonly db = inject(LocalDbService);
  private readonly network = inject(NetworkService);
  private readonly store = inject(Store);
  private readonly plotsApi = inject(PlotsApiService);
  private readonly tasksApi = inject(TasksApiService);
  private readonly cropsApi = inject(CropsApiService);
  private readonly notifications = inject(LocalNotificationsService);

  private subs = new Subscription();

  start(): void {
    // Track network changes
    this.subs.add(
      this.network.online$.subscribe(async (online) => {
        _syncOnline.set(online);
        if (online) await this.sync();
        await this.updatePendingCount();
      })
    );

    // Poll every 5 minutes while online
    this.subs.add(
      interval(5 * 60 * 1000).pipe(
        filter(() => this.network.isOnline)
      ).subscribe(() => this.sync())
    );

    // Sync on app foreground
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.network.isOnline) this.sync();
    });
  }

  // ── Push: drain outbox ──────────────────────────────────────────────────

  async push(): Promise<void> {
    const pending = await this.db.getPendingOutbox();
    for (const entry of pending) {
      try {
        await this.pushEntry(entry);
        await this.db.markOutboxSynced(entry.id!);
      } catch (err: any) {
        const status = err?.status ?? 0;
        if (status === 409) {
          await this.db.markOutboxFailed(entry.id!, err?.error?.detail ?? 'Conflict');
          _syncHasError.set(true);
        } else {
          // Network error — stop and retry later
          break;
        }
      }
    }
    await this.updatePendingCount();
  }

  private async pushEntry(entry: OutboxEntry): Promise<void> {
    const payload = JSON.parse(entry.payload);
    switch (entry.entity_type) {
      case 'plot':
        if (entry.operation === 'create') {
          const plot = await this.plotsApi.create(payload).toPromise();
          if (plot && entry.entity_id.startsWith('tmp_')) {
            await this.db.rewriteTmpId(entry.entity_id, plot.id, 'plot');
          }
        } else if (entry.operation === 'update') {
          await this.plotsApi.update(entry.entity_id, payload).toPromise();
        } else if (entry.operation === 'delete') {
          await this.plotsApi.delete(entry.entity_id).toPromise();
        }
        break;
      case 'plot_slot':
        if (entry.operation === 'create') {
          const slot = await this.plotsApi.createSlot(payload.plotId, payload).toPromise();
          if (slot && entry.entity_id.startsWith('tmp_')) {
            await this.db.rewriteTmpId(entry.entity_id, slot.id, 'plot_slot');
          }
        } else if (entry.operation === 'update') {
          await this.plotsApi.updateSlot(payload.plotId, entry.entity_id, payload).toPromise();
        } else if (entry.operation === 'delete') {
          await this.plotsApi.deleteSlot(payload.plotId, entry.entity_id).toPromise();
        }
        break;
      case 'task':
        if (entry.operation === 'update') {
          await this.tasksApi.update(entry.entity_id, payload).toPromise();
        }
        break;
    }
  }

  // ── Pull: overwrite local with server state ─────────────────────────────

  async pull(): Promise<void> {
    // Plots + slots
    const plots = await this.plotsApi.getAll().toPromise() ?? [];
    await this.db.upsertPlots(plots);
    this.store.dispatch(PlotsActions.loadPlotsSuccess({ plots }));

    for (const plot of plots) {
      const slots = await this.plotsApi.getSlots(plot.id).toPromise() ?? [];
      await this.db.upsertSlots(slots);
      this.store.dispatch(PlotsActions.loadSlotsSuccess({ plotId: plot.id, slots }));
    }

    // Tasks (today's tasks — keep existing date in store)
    const today = new Date().toISOString().slice(0, 10);
    const tasks = await this.tasksApi.getAll({ due_date: today }).toPromise() ?? [];
    await this.db.upsertTasks(tasks);
    this.store.dispatch(TasksActions.loadTasksSuccess({ tasks }));

    // Crops — check version before pulling
    const serverVersion = Date.now().toString(); // simplified: always pull
    const cached = await this.db.getSyncMeta('crops_version');
    if (!cached) {
      const crops = await this.cropsApi.getAll().toPromise() ?? [];
      await this.db.upsertCrops(crops);
      await this.db.setSyncMeta('crops_version', serverVersion);
      this.store.dispatch(CropsActions.loadCropsSuccess({ crops }));
    }

    await this.db.setSyncMeta('last_pull_at', Date.now().toString());

    // Reschedule notifications
    await this.rescheduleNotifications();
  }

  async sync(): Promise<void> {
    if (_syncIsSyncing()) return;
    _syncIsSyncing.set(true);
    try {
      await this.push();
      await this.pull();
      _syncHasError.set((await this.db.getFailedOutbox()).length > 0);
    } catch {
      // Network error — will retry
    } finally {
      _syncIsSyncing.set(false);
      await this.updatePendingCount();
    }
  }

  // ── Initial pull on first login ─────────────────────────────────────────

  async initialPull(): Promise<void> {
    await this.pull();
    const crops = await this.db.getAllCrops();
    this.store.dispatch(CropsActions.loadCropsSuccess({ crops }));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  async getFailedEntries(): Promise<OutboxEntry[]> {
    return this.db.getFailedOutbox();
  }

  async discardFailedEntry(id: number): Promise<void> {
    await this.db.deleteOutboxEntry(id);
    await this.updatePendingCount();
    _syncHasError.set((await this.db.getFailedOutbox()).length > 0);
  }

  async retryFailedEntry(id: number): Promise<void> {
    await this.db.run(`UPDATE outbox SET status = 'pending' WHERE id = ?`, [id]);
    await this.sync();
  }

  private async updatePendingCount(): Promise<void> {
    const count = await this.db.getPendingCount();
    _syncPendingCount.set(count);
  }

  private async rescheduleNotifications(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const allTasks = await this.db.getTasksByDate(today); // simplified — ideally 30-day range
    // Build slotLabels from local DB
    const plots = await this.db.getAllPlots();
    const slotLabels: Record<string, string> = {};
    for (const plot of plots) {
      const slots = await this.db.getSlotsByPlot(plot.id);
      for (const slot of slots) {
        const crop = await this.db.getCropById(slot.crop_id);
        if (crop) slotLabels[slot.id] = `${crop.name} in ${plot.name}`;
      }
    }
    await this.notifications.scheduleTaskNotifications(allTasks, slotLabels);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    App.removeAllListeners();
  }
}
```

> **Note:** This imports `PlotsApiService` from `features/plots/services/plots-api.service`. Verify the path matches the actual file. Also imports `TasksApiService` and `CropsApiService` from `core/api/`. Check these paths match what was found in the codebase exploration.

- [ ] **Step 2: Fix any import path issues**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -30
```

Fix any "Module not found" errors by checking actual import paths.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/core/sync/sync.service.ts
git commit -m "feat: add SyncService with push (outbox drain) and pull"
```

---

## Task 8: Plots NgRx Effects Refactor

**Files:**
- Modify: `frontend/src/app/features/plots/store/plots.effects.ts`

Replace all HTTP calls with LocalDbService reads/writes + outbox entries.

- [ ] **Step 1: Read current plots.effects.ts**

```bash
cat frontend/src/app/features/plots/store/plots.effects.ts
```

- [ ] **Step 2: Replace effects**

Rewrite the full file:

```typescript
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, mergeMap, of, switchMap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { PlotsActions } from './plots.actions';
import { LocalDbService } from '../../../core/db/local-db.service';
import { TaskGeneratorService } from '../../../core/task-generator/task-generator.service';
import { Plot, PlotCreate } from './plots.state';

@Injectable()
export class PlotsEffects {
  private actions$ = inject(Actions);
  private db = inject(LocalDbService);
  private taskGen = inject(TaskGeneratorService);

  loadPlots$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.loadPlots),
      switchMap(() =>
        from(this.db.getAllPlots()).pipe(
          map(plots => PlotsActions.loadPlotsSuccess({ plots })),
          catchError(err => of(PlotsActions.loadPlotsFailure({ error: err.message }))),
        )
      )
    )
  );

  createPlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.createPlot),
      mergeMap(({ payload }) => {
        const now = new Date().toISOString();
        const plot: Plot = {
          id: `tmp_${uuidv4()}`,
          user_id: '',
          name: payload.name,
          plot_type: payload.plot_type,
          rows: payload.rows,
          cols: payload.cols,
          substrate: payload.substrate ?? null,
          watering_days: payload.watering_days ?? [],
          fertilise_days: payload.fertilise_days ?? [],
          crop_count: 0,
          created_at: now,
          updated_at: now,
        };
        return from(
          this.db.insertPlot(plot).then(() =>
            this.db.addToOutbox({
              entity_type: 'plot',
              entity_id: plot.id,
              operation: 'create',
              payload: JSON.stringify(payload),
            })
          )
        ).pipe(
          map(() => PlotsActions.createPlotSuccess({ plot })),
          catchError(err => of(PlotsActions.createPlotFailure({ error: err.message }))),
        );
      })
    )
  );

  updatePlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.updatePlot),
      mergeMap(({ id, payload }) =>
        from(
          this.db.updatePlotLocal(id, payload as any).then(() =>
            this.db.addToOutbox({
              entity_type: 'plot',
              entity_id: id,
              operation: 'update',
              payload: JSON.stringify(payload),
            })
          ).then(() => this.db.getAllPlots().then(plots => plots.find(p => p.id === id)!))
        ).pipe(
          map(plot => PlotsActions.updatePlotSuccess({ plot })),
          catchError(err => of(PlotsActions.updatePlotFailure({ error: err.message }))),
        )
      )
    )
  );

  deletePlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.deletePlot),
      mergeMap(({ id }) =>
        from(
          this.db.deletePlotLocal(id).then(() =>
            this.db.addToOutbox({
              entity_type: 'plot',
              entity_id: id,
              operation: 'delete',
              payload: JSON.stringify({ id }),
            })
          )
        ).pipe(
          map(() => PlotsActions.deletePlotSuccess({ id })),
          catchError(err => of(PlotsActions.deletePlotFailure({ error: err.message }))),
        )
      )
    )
  );

  loadSlots$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.loadSlots),
      mergeMap(({ plotId }) =>
        from(this.db.getSlotsByPlot(plotId)).pipe(
          map(slots => PlotsActions.loadSlotsSuccess({ plotId, slots })),
          catchError(err => of(PlotsActions.loadSlotsFailure({ error: err.message }))),
        )
      )
    )
  );

  createSlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.createSlot),
      mergeMap(({ plotId, payload }) => {
        const now = new Date().toISOString();
        const slot = {
          id: `tmp_${uuidv4()}`,
          plot_id: plotId,
          crop_id: payload.crop_id,
          row: payload.row,
          col: payload.col,
          sow_date: payload.sow_date,
          watering_days_override: payload.watering_days_override ?? null,
          watering_interval_weeks: payload.watering_interval_weeks ?? 1,
          fertilise_days_override: payload.fertilise_days_override ?? null,
          fertilise_interval_weeks: payload.fertilise_interval_weeks ?? 1,
          created_at: now,
          updated_at: now,
        };
        return from(
          this.db.insertSlot(slot as any)
            .then(() => this.db.addToOutbox({
              entity_type: 'plot_slot',
              entity_id: slot.id,
              operation: 'create',
              payload: JSON.stringify({ plotId, ...payload }),
            }))
            .then(async () => {
              // Generate tasks locally
              const plot = (await this.db.getAllPlots()).find(p => p.id === plotId);
              const crop = await this.db.getCropById(payload.crop_id);
              if (plot && crop) {
                const tasks = this.taskGen.generate(slot as any, plot, crop, '');
                await this.db.insertTasksBulk(tasks as any);
              }
            })
        ).pipe(
          map(() => PlotsActions.createSlotSuccess({ plotId, slot: slot as any })),
          catchError(err => of(PlotsActions.createSlotFailure({ error: err.message }))),
        );
      })
    )
  );

  updateSlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.updateSlot),
      mergeMap(({ plotId, slotId, payload }) =>
        from(
          this.db.updateSlotLocal(slotId, payload as any)
            .then(() => this.db.addToOutbox({
              entity_type: 'plot_slot',
              entity_id: slotId,
              operation: 'update',
              payload: JSON.stringify({ plotId, ...payload }),
            }))
            .then(() => this.db.getSlotsByPlot(plotId).then(slots => slots.find(s => s.id === slotId)!))
        ).pipe(
          map(slot => PlotsActions.updateSlotSuccess({ plotId, slot })),
          catchError(err => of(PlotsActions.updateSlotFailure({ error: err.message }))),
        )
      )
    )
  );

  deleteSlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.deleteSlot),
      mergeMap(({ plotId, slotId }) =>
        from(
          this.db.deleteSlotLocal(slotId)
            .then(() => this.db.addToOutbox({
              entity_type: 'plot_slot',
              entity_id: slotId,
              operation: 'delete',
              payload: JSON.stringify({ plotId, slotId }),
            }))
        ).pipe(
          map(() => PlotsActions.deleteSlotSuccess({ plotId, slotId })),
          catchError(err => of(PlotsActions.deleteSlotFailure({ error: err.message }))),
        )
      )
    )
  );

  updateSlotSchedule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.updateSlotSchedule),
      mergeMap(({ plotId, slotId, watering_days_override, watering_interval_weeks, fertilise_days_override, fertilise_interval_weeks }) =>
        from(
          this.db.updateSlotLocal(slotId, {
            watering_days_override,
            watering_interval_weeks,
            fertilise_days_override,
            fertilise_interval_weeks,
          } as any)
            .then(() => this.db.addToOutbox({
              entity_type: 'plot_slot',
              entity_id: slotId,
              operation: 'update',
              payload: JSON.stringify({ plotId, watering_days_override, watering_interval_weeks, fertilise_days_override, fertilise_interval_weeks }),
            }))
            .then(async () => {
              // Regenerate tasks
              const today = new Date().toISOString().slice(0, 10);
              await this.db.deleteFutureUncompletedTasksForSlot(slotId, ['water', 'fertilise'], today);
              const slots = await this.db.getSlotsByPlot(plotId);
              const slot = slots.find(s => s.id === slotId);
              if (!slot) return slot;
              const plots = await this.db.getAllPlots();
              const plot = plots.find(p => p.id === plotId);
              const crop = slot ? await this.db.getCropById(slot.crop_id) : null;
              if (slot && plot && crop) {
                const tasks = this.taskGen.generate(slot, plot, crop, '', today, ['water', 'fertilise']);
                await this.db.insertTasksBulk(tasks as any);
              }
              return slot;
            })
            .then(() => this.db.getSlotsByPlot(plotId).then(slots => slots.find(s => s.id === slotId)!))
        ).pipe(
          map(slot => PlotsActions.updateSlotScheduleSuccess({ plotId, slot: slot! })),
          catchError(err => of(PlotsActions.updateSlotScheduleFailure({ error: err.message }))),
        )
      )
    )
  );
}
```

- [ ] **Step 3: Build check**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -30
```

Fix any type errors before continuing.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/features/plots/store/plots.effects.ts
git commit -m "feat: refactor plots effects to use LocalDbService instead of HTTP"
```

---

## Task 9: Tasks, Crops, Specimens Effects Refactor

**Files:**
- Modify: `frontend/src/app/features/tasks/store/tasks.effects.ts`
- Modify: `frontend/src/app/features/crops/store/crops.effects.ts`
- Modify: `frontend/src/app/features/plots/store/specimens.effects.ts`

- [ ] **Step 1: Read current files**

```bash
cat frontend/src/app/features/tasks/store/tasks.effects.ts
cat frontend/src/app/features/crops/store/crops.effects.ts
cat frontend/src/app/features/plots/store/specimens.effects.ts
```

- [ ] **Step 2: Rewrite tasks.effects.ts**

```typescript
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, mergeMap, of, switchMap } from 'rxjs';
import { TasksActions } from './tasks.actions';
import { LocalDbService } from '../../../core/db/local-db.service';

@Injectable()
export class TasksEffects {
  private actions$ = inject(Actions);
  private db = inject(LocalDbService);

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadTasks),
      switchMap(({ due_date }) =>
        from(this.db.getTasksByDate(due_date ?? new Date().toISOString().slice(0, 10))).pipe(
          map(tasks => TasksActions.loadTasksSuccess({ tasks })),
          catchError(err => of(TasksActions.loadTasksFailure({ error: err.message }))),
        )
      )
    )
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.updateTask),
      mergeMap(({ id, payload }) =>
        from(
          this.db.updateTaskLocal(id, payload as any)
            .then(() => this.db.addToOutbox({
              entity_type: 'task',
              entity_id: id,
              operation: 'update',
              payload: JSON.stringify(payload),
            }))
            .then(() => this.db.getTasksByDate(new Date().toISOString().slice(0, 10)))
            .then(tasks => tasks.find(t => t.id === id)!)
        ).pipe(
          map(task => TasksActions.updateTaskSuccess({ task })),
          catchError(err => of(TasksActions.updateTaskFailure({ error: err.message }))),
        )
      )
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteTask),
      mergeMap(({ id }) =>
        from(this.db.deleteTaskLocal(id)).pipe(
          map(() => TasksActions.deleteTaskSuccess({ id })),
          catchError(err => of(TasksActions.deleteTaskFailure({ error: err.message }))),
        )
      )
    )
  );
}
```

- [ ] **Step 3: Rewrite crops.effects.ts**

Crops are read-only — load from local DB cache only:

```typescript
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { CropsActions } from './crops.actions';
import { LocalDbService } from '../../../core/db/local-db.service';

@Injectable()
export class CropsEffects {
  private actions$ = inject(Actions);
  private db = inject(LocalDbService);

  loadCrops$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CropsActions.loadCrops),
      switchMap(() =>
        from(this.db.getAllCrops()).pipe(
          map(crops => CropsActions.loadCropsSuccess({ crops })),
          catchError(err => of(CropsActions.loadCropsFailure({ error: err.message }))),
        )
      )
    )
  );

  loadCrop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CropsActions.loadCrop),
      switchMap(({ id }) =>
        from(this.db.getCropById(id)).pipe(
          map(crop => {
            if (!crop) throw new Error(`Crop ${id} not found in local DB`);
            return CropsActions.loadCropSuccess({ crop });
          }),
          catchError(err => of(CropsActions.loadCropFailure({ error: err.message }))),
        )
      )
    )
  );
}
```

- [ ] **Step 4: Update specimens.effects.ts**

Read `frontend/src/app/core/api/specimens-api.service.ts` first to understand its methods:

```bash
cat frontend/src/app/core/api/specimens-api.service.ts
```

Then rewrite specimens.effects.ts to use `LocalDbService.getSpecimenBySlot()` for reads and keep HTTP for mutations (specimens include photo uploads which can't be done locally):

```typescript
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, mergeMap, of, switchMap } from 'rxjs';
import { SpecimensActions } from './specimens.actions';
import { PlotsActions } from './plots.actions';
import { LocalDbService } from '../../../core/db/local-db.service';
import { SpecimensApiService } from '../../../core/api/specimens-api.service';

@Injectable()
export class SpecimensEffects {
  private actions$ = inject(Actions);
  private db = inject(LocalDbService);
  private api = inject(SpecimensApiService);

  loadSpecimen$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.loadSpecimen),
      switchMap(({ plotId, slotId }) =>
        from(this.db.getSpecimenBySlot(slotId)).pipe(
          map(specimen => {
            if (!specimen) throw new Error('Specimen not found');
            return SpecimensActions.loadSpecimenSuccess({ specimen });
          }),
          catchError(() =>
            // Fallback to API if not in local DB yet
            this.api.getBySlot(plotId, slotId).pipe(
              map(specimen => SpecimensActions.loadSpecimenSuccess({ specimen })),
              catchError(err => of(SpecimensActions.loadSpecimenFailure({ error: err.message }))),
            )
          ),
        )
      )
    )
  );

  // updateSpecimen and uploadPhoto keep HTTP (photo uploads can't be local)
  updateSpecimen$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.updateSpecimen),
      switchMap(({ plotId, slotId, payload }) =>
        this.api.update(plotId, slotId, payload).pipe(
          map(specimen => SpecimensActions.updateSpecimenSuccess({ specimen })),
          catchError(err => of(SpecimensActions.updateSpecimenFailure({ error: err.message }))),
        )
      )
    )
  );

  uploadPhoto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.uploadPhoto),
      switchMap(({ plotId, slotId, file, takenAt, note }) =>
        this.api.uploadPhoto(plotId, slotId, file, takenAt, note).pipe(
          map(specimen => SpecimensActions.uploadPhotoSuccess({ specimen })),
          catchError(err => of(SpecimensActions.uploadPhotoFailure({ error: err.message }))),
        )
      )
    )
  );

  reloadSpecimenAfterSlotUpdate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.updateSlotSuccess),
      map(({ plotId, slot }) =>
        SpecimensActions.loadSpecimen({ plotId, slotId: slot.id })
      )
    )
  );
}
```

- [ ] **Step 5: Build check**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -30
```

Fix any errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/tasks/store/tasks.effects.ts \
        frontend/src/app/features/crops/store/crops.effects.ts \
        frontend/src/app/features/plots/store/specimens.effects.ts
git commit -m "feat: refactor tasks, crops, specimens effects to use LocalDbService"
```

---

## Task 10: OfflineBannerComponent

**Files:**
- Create: `frontend/src/app/shared/components/offline-banner/offline-banner.component.ts`
- Create: `frontend/src/app/shared/components/offline-banner/offline-banner.component.html`
- Create: `frontend/src/app/shared/components/offline-banner/offline-banner.component.scss`

- [ ] **Step 1: Read an existing shared component for style reference**

```bash
cat frontend/src/app/shared/components/schedule-section/schedule-section.component.ts
```

- [ ] **Step 2: Create offline-banner.component.ts**

```typescript
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline, syncOutline, alertCircleOutline, closeOutline } from 'ionicons/icons';

import { syncStatus, syncPendingCount } from '../../../core/sync/sync-status.signal';
import { SyncService } from '../../../core/sync/sync.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './offline-banner.component.html',
  styleUrls: ['./offline-banner.component.scss'],
})
export class OfflineBannerComponent {
  private sync = inject(SyncService);

  readonly status = syncStatus;
  readonly pendingCount = syncPendingCount;
  readonly dismissed = signal(false);
  readonly showFailedModal = signal(false);
  readonly failedEntries = signal<Awaited<ReturnType<SyncService['getFailedEntries']>>>([]);

  readonly visible = computed(() => {
    if (this.dismissed()) return false;
    const s = this.status();
    return s === 'offline' || s === 'pending' || s === 'error' || s === 'syncing';
  });

  readonly message = computed(() => {
    switch (this.status()) {
      case 'offline': return "You're offline — changes will sync when you reconnect";
      case 'syncing': return 'Syncing changes…';
      case 'pending': return `${this.pendingCount()} change${this.pendingCount() === 1 ? '' : 's'} pending sync`;
      case 'error': return '1 change could not be saved — tap to review';
      default: return '';
    }
  });

  readonly bannerClass = computed(() => {
    switch (this.status()) {
      case 'syncing': return 'banner--blue';
      case 'error': return 'banner--red';
      default: return 'banner--amber';
    }
  });

  constructor() {
    addIcons({ cloudOfflineOutline, syncOutline, alertCircleOutline, closeOutline });
  }

  dismiss(): void {
    this.dismissed.set(true);
  }

  async openFailedModal(): Promise<void> {
    if (this.status() !== 'error') return;
    const entries = await this.sync.getFailedEntries();
    this.failedEntries.set(entries);
    this.showFailedModal.set(true);
  }

  async discard(id: number): Promise<void> {
    await this.sync.discardFailedEntry(id);
    const entries = await this.sync.getFailedEntries();
    this.failedEntries.set(entries);
    if (entries.length === 0) this.showFailedModal.set(false);
  }

  async retry(id: number): Promise<void> {
    await this.sync.retryFailedEntry(id);
    this.showFailedModal.set(false);
  }
}
```

- [ ] **Step 3: Create offline-banner.component.html**

```html
@if (visible()) {
  <div class="offline-banner" [class]="bannerClass()" (click)="openFailedModal()">
    <ion-icon
      [name]="status() === 'offline' ? 'cloud-offline-outline' : status() === 'syncing' ? 'sync-outline' : 'alert-circle-outline'"
      class="banner-icon"
    />
    <span class="banner-message">{{ message() }}</span>
    <button class="banner-close" (click)="$event.stopPropagation(); dismiss()">
      <ion-icon name="close-outline" />
    </button>
  </div>
}

@if (showFailedModal()) {
  <div class="modal-backdrop" (click)="showFailedModal.set(false)">
    <div class="failed-modal" (click)="$event.stopPropagation()">
      <div class="modal-title">Changes that could not be saved</div>
      @for (entry of failedEntries(); track entry.id) {
        <div class="failed-entry">
          <div class="entry-label">{{ entry.entity_type }} — {{ entry.operation }}</div>
          <div class="entry-error">{{ entry.error }}</div>
          <div class="entry-actions">
            <button class="btn-discard" (click)="discard(entry.id!)">Discard</button>
            <button class="btn-retry" (click)="retry(entry.id!)">Retry</button>
          </div>
        </div>
      }
    </div>
  </div>
}
```

- [ ] **Step 4: Create offline-banner.component.scss**

```scss
.offline-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &.banner--amber { background: #b45309; color: #fef3c7; }
  &.banner--blue  { background: #1d4ed8; color: #dbeafe; }
  &.banner--red   { background: #b91c1c; color: #fee2e2; }
}

.banner-icon { font-size: 16px; flex-shrink: 0; }
.banner-message { flex: 1; }
.banner-close {
  background: none; border: none; cursor: pointer; padding: 0;
  color: inherit; font-size: 18px; opacity: 0.8;
  &:hover { opacity: 1; }
}

.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 1000; display: flex; align-items: flex-end;
}

.failed-modal {
  background: var(--color-surface, #1a2a1a);
  border-radius: 16px 16px 0 0;
  padding: 24px;
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #fee2e2; }

.failed-entry {
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  &:last-child { border-bottom: none; }
}

.entry-label { font-weight: 500; margin-bottom: 4px; }
.entry-error { font-size: 12px; opacity: 0.7; margin-bottom: 8px; }

.entry-actions { display: flex; gap: 8px; }
.btn-discard, .btn-retry {
  padding: 6px 14px; border-radius: 8px; font-size: 13px;
  border: none; cursor: pointer; font-weight: 500;
}
.btn-discard { background: rgba(255,255,255,0.1); color: #fff; }
.btn-retry { background: var(--color-primary, #4a7c59); color: #fff; }
```

- [ ] **Step 5: Build check**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -20
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shared/components/offline-banner/
git commit -m "feat: add OfflineBannerComponent with sync status and failed items modal"
```

---

## Task 11: App Initialization

**Files:**
- Modify: `frontend/src/app/app.component.ts`
- Modify: `frontend/src/app/app.config.ts`

- [ ] **Step 1: Update app.component.ts**

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import Keycloak from 'keycloak-js';

import { ThemeService } from './core/theme/theme.service';
import { LocalDbService } from './core/db/local-db.service';
import { SyncService } from './core/sync/sync.service';
import { LocalNotificationsService } from './core/notifications/local-notifications.service';
import { OfflineBannerComponent } from './shared/components/offline-banner/offline-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, OfflineBannerComponent],
  template: `
    <ion-app>
      <app-offline-banner />
      <ion-router-outlet />
    </ion-app>
  `,
})
export class AppComponent implements OnInit {
  private db = inject(LocalDbService);
  private syncService = inject(SyncService);
  private notifications = inject(LocalNotificationsService);
  private keycloak = inject(Keycloak);

  constructor() {
    inject(ThemeService);
  }

  async ngOnInit(): Promise<void> {
    // Init SQLite
    await this.db.init();

    // Start sync service (registers network + foreground listeners)
    this.syncService.start();

    // If authenticated, do initial pull to seed local DB
    if (this.keycloak.authenticated) {
      await this.syncService.initialPull();
    }

    // Request notification permission
    await this.notifications.requestPermission();
  }
}
```

- [ ] **Step 2: Build check**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -20
```

- [ ] **Step 3: Fix any import path issues and rebuild**

The `SyncService` imports `TasksApiService` from `core/api/tasks-api.service`. Verify this path is correct or adjust:

```bash
find frontend/src -name "tasks-api.service.ts" | head -5
find frontend/src -name "plots-api.service.ts" | head -5
```

Update any wrong paths in `sync.service.ts`.

- [ ] **Step 4: Full build + verify no regressions**

```bash
cd frontend && npx ng build --configuration development 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/app.component.ts
git commit -m "feat: initialize LocalDb and SyncService on app start, add offline banner"
```

---

## Task 12: Docker Smoke Test

Verify the full stack works end-to-end after all refactors.

- [ ] **Step 1: Start services**

```bash
docker compose up -d
docker compose logs frontend --tail=30
```

Expected: no startup errors.

- [ ] **Step 2: Open the app and verify basic flow**

Navigate to `http://localhost` (or app URL). Log in. Verify:
- App loads without console errors
- Plot list appears (loaded from local DB after initial pull)
- No TypeScript runtime errors in browser console

- [ ] **Step 3: Test offline behavior**

In browser DevTools → Network → set Offline. Then:
- Navigate between pages — should still work (reads from local DB)
- Mark a task complete — should save locally
- The offline banner should appear

Set back to Online — banner should show "Syncing…" then disappear.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat: complete local-first sync implementation"
```
