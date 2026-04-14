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
