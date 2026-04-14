import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import type { Plot, PlotSlot } from '../../features/plots/store/plots.state';
import type { Task } from '../../features/tasks/store/tasks.state';
import type { Crop } from '../../features/crops/store/crops.state';
import type { Specimen } from '../../features/plots/store/specimens.state';

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
    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.initWebStore();
    }
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

  // ── Plot CRUD ────────────────────────────────────────────────────────────

  async upsertPlots(plots: Plot[]): Promise<void> {
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

  async getAllPlots(): Promise<Plot[]> {
    const rows = await this.query<Record<string, unknown>>(`SELECT * FROM plots ORDER BY created_at ASC`);
    return rows.map(r => ({
      ...(r as any),
      watering_days: JSON.parse(r['watering_days'] as string),
      fertilise_days: JSON.parse(r['fertilise_days'] as string),
    }));
  }

  async updatePlotLocal(id: string, changes: Partial<Plot>): Promise<void> {
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

  // ── PlotSlot CRUD ────────────────────────────────────────────────────────

  async upsertSlots(slots: PlotSlot[]): Promise<void> {
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

  async insertSlot(slot: PlotSlot): Promise<void> {
    await this.upsertSlots([slot]);
  }

  async getSlotsByPlot(plotId: string): Promise<PlotSlot[]> {
    const rows = await this.query<Record<string, unknown>>(
      `SELECT * FROM plot_slots WHERE plot_id = ? ORDER BY row ASC, col ASC`, [plotId]
    );
    return rows.map(r => ({
      ...(r as any),
      watering_days_override: r['watering_days_override'] ? JSON.parse(r['watering_days_override'] as string) : null,
      fertilise_days_override: r['fertilise_days_override'] ? JSON.parse(r['fertilise_days_override'] as string) : null,
    }));
  }

  async updateSlotLocal(id: string, changes: Partial<PlotSlot>): Promise<void> {
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

  // ── Task CRUD ────────────────────────────────────────────────────────────

  async upsertTasks(tasks: Task[]): Promise<void> {
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

  async insertTasksBulk(tasks: Omit<Task, 'updated_at'>[]): Promise<void> {
    const now = new Date().toISOString();
    await this.upsertTasks(tasks.map(t => ({ ...t, updated_at: now } as Task)));
  }

  async getTasksByDate(dueDate: string): Promise<Task[]> {
    const rows = await this.query<Record<string, unknown>>(
      `SELECT * FROM tasks WHERE due_date = ? ORDER BY type ASC`, [dueDate]
    );
    return rows.map(r => ({ ...(r as any), completed: r['completed'] === 1 }));
  }

  async getTasksBySlot(slotId: string): Promise<Task[]> {
    const rows = await this.query<Record<string, unknown>>(
      `SELECT * FROM tasks WHERE plot_slot_id = ? ORDER BY due_date ASC`, [slotId]
    );
    return rows.map(r => ({ ...(r as any), completed: r['completed'] === 1 }));
  }

  async updateTaskLocal(id: string, changes: Partial<Task>): Promise<void> {
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

  // ── Crop CRUD ────────────────────────────────────────────────────────────

  async upsertCrops(crops: Crop[]): Promise<void> {
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

  async getAllCrops(): Promise<Crop[]> {
    const rows = await this.query<Record<string, unknown>>(`SELECT * FROM crops ORDER BY name ASC`);
    return rows.map(r => ({
      ...(r as any),
      soil_mix: r['soil_mix'] ? JSON.parse(r['soil_mix'] as string) : null,
      companion_crops: JSON.parse(r['companion_crops'] as string),
      avoid_crops: JSON.parse(r['avoid_crops'] as string),
    }));
  }

  async getCropById(id: string): Promise<Crop | null> {
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

  // ── Specimen CRUD ────────────────────────────────────────────────────────

  async upsertSpecimens(specimens: Specimen[]): Promise<void> {
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

  async getSpecimenBySlot(slotId: string): Promise<Specimen | null> {
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
}
