# 08 — Backend: DB Models & Migrations

All models in `backend/app/models/`. UUID PKs, `created_at` / `updated_at` on every table. Alembic only — no `create_all` in prod.

---

## Models

### `Crop` (`crops`)
Seeded table — read-only for users.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `name` | VARCHAR(100) | e.g. "Tomato" |
| `latin_name` | VARCHAR(150) | e.g. "Solanum lycopersicum" |
| `category` | ENUM | `vegetable`, `herb`, `fruit`, `flower` |
| `description` | TEXT | |
| `thumbnail_url` | VARCHAR(500) | |
| `days_to_germination` | INTEGER | |
| `days_to_harvest` | INTEGER | From sow date |
| `watering_frequency_days` | INTEGER | |
| `fertilise_frequency_days` | INTEGER | |
| `prune_frequency_days` | INTEGER NULLABLE | |
| `prune_start_day` | INTEGER NULLABLE | Day from sow to start pruning |
| `sun_requirement` | ENUM | `full_sun`, `partial_shade`, `shade` |
| `spacing_cm` | INTEGER | |
| `soil_mix` | JSONB | `{ name, topsoil_pct, compost_pct, perlite_pct, description }` |
| `companion_crops` | ARRAY(VARCHAR) | Crop names |
| `avoid_crops` | ARRAY(VARCHAR) | Crop names |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

### `Plot` (`plots`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | VARCHAR(100) | Keycloak `sub` claim |
| `name` | VARCHAR(100) | |
| `plot_type` | ENUM | `ground_bed`, `raised_bed`, `container`, `vertical` |
| `rows` | INTEGER | Grid rows |
| `cols` | INTEGER | Grid columns |
| `substrate` | VARCHAR(100) | |
| `watering_days` | ARRAY(INTEGER) | 0=Mon … 6=Sun |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

### `PlotSlot` (`plot_slots`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `plot_id` | UUID FK → `plots.id` CASCADE DELETE | |
| `crop_id` | UUID FK → `crops.id` | |
| `row` | INTEGER | 0-indexed |
| `col` | INTEGER | 0-indexed |
| `sow_date` | DATE | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

Unique constraint: `(plot_id, row, col)`.

---

### `Task` (`tasks`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | VARCHAR(100) | Keycloak `sub` |
| `plot_slot_id` | UUID FK → `plot_slots.id` CASCADE DELETE NULLABLE | NULL for custom tasks |
| `type` | ENUM | `water`, `fertilise`, `prune`, `harvest`, `check`, `custom` |
| `title` | VARCHAR(200) NULLABLE | Used for custom tasks |
| `note` | TEXT NULLABLE | |
| `due_date` | DATE | |
| `completed` | BOOLEAN | Default FALSE |
| `completed_at` | TIMESTAMP NULLABLE | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

Index: `(user_id, due_date)`, `(plot_slot_id)`.

---

### `NotificationSettings` (`notification_settings`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | VARCHAR(100) UNIQUE | Keycloak `sub` |
| `morning_reminder` | BOOLEAN | Default TRUE |
| `evening_reminder` | BOOLEAN | Default TRUE |
| `in_app_alerts` | BOOLEAN | Default TRUE |
| `push_token` | VARCHAR(500) NULLABLE | FCM device token |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

## Migrations

Alembic migration order:
1. `create_crops_table`
2. `create_plots_table`
3. `create_plot_slots_table`
4. `create_tasks_table`
5. `create_notification_settings_table`
6. `seed_crops` (data migration — inserts starter dataset from `12-crop-seed-data.md`)

Commands:
```bash
./run.sh db:revision "create crops table"
./run.sh db:migrate
```
