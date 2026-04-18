# Seedling Tray Feature

## Overview

Added a new `seedling_tray` plot type that tracks seed germination per cell and supports transplanting seedlings to regular plots once they're ready.

## What was built

### New plot type: Seedling Tray

A seedling tray is a special plot where each cell represents a seed. Instead of the full water/fertilise/prune/harvest task cycle, each cell gets a single **"Check germination"** task scheduled at `sow_date + crop.days_to_germination`.

The user flow:
1. Create a new plot and select "Seedling Tray" as the type
2. Tap a cell to assign a crop (seeds a slot)
3. When the germination date arrives, tap the cell → "Mark as germinated" to record the date
4. Once germinated, tap the cell → "Transplant to plot" to move the seedling to a real plot (picking the target plot and cell in a 2-step modal)

### Transplant readiness suggestion

The action sheet for a germinated slot shows the **suggested transplant date** (`sow_date + days_to_germination`) but the user decides when to actually transplant. The app never auto-transplants.

---

## Backend changes

### Migration
`backend/alembic/versions/d1e2f3a4b5c6_add_seedling_tray.py`

- Adds `seedling_tray` to the `plot_type` Postgres enum (`ALTER TYPE ... ADD VALUE` run outside a transaction via `COMMIT/BEGIN` workaround)
- Adds `germination_date DATE NULL` column to `plot_slots`

### Models
- `backend/app/models/plot.py` — `PlotType.seedling_tray` enum value
- `backend/app/models/plot_slot.py` — `germination_date: Mapped[date | None]`

### Schemas
- `backend/app/schemas/plot_slot.py` — `germination_date` in `PlotSlotUpdate` and `PlotSlotResponse`; new `TransplantRequest(target_plot_id, target_row, target_col)` schema

### Task generator
- `backend/app/services/task_generator.py` — when `plot.plot_type == PlotType.seedling_tray`, skip all regular tasks and generate only a single `TaskType.check` task titled "Check germination – {crop name}" due at `sow_date + crop.days_to_germination`

### Transplant endpoint
- `backend/app/api/v1/endpoints/plots.py` — `POST /plots/{plot_id}/slots/{slot_id}/transplant`
  - Validates target plot belongs to the same user and target cell is empty
  - Creates a new slot in the target plot with the same `crop_id` and `sow_date`
  - Transfers the `Specimen` FK to the new slot before deleting the source slot
  - Generates tasks appropriate for the target plot type

---

## Frontend changes

### State
- `plots.state.ts` — `'seedling_tray'` added to `PlotType`; `germination_date: string | null` added to `PlotSlot`

### NgRx actions
- `plots.actions.ts` — two new action groups:
  - `markGerminated` / `markGerminatedSuccess` / `markGerminatedFailure`
  - `transplantSlot` / `transplantSlotSuccess` / `transplantSlotFailure`

### Reducer
- `plots.reducer.ts` — handles `markGerminatedSuccess` (patches `germination_date` on the slot) and `transplantSlotSuccess` (removes slot from source plot, appends to target plot, adjusts `crop_count` on both)

### Effects
- `plots.effects.ts` — local-first effects: both actions update SQLite immediately and queue an outbox entry before any server sync

### Selectors
- `plots.selectors.ts` — `selectNonSeedlingPlots` for the transplant modal; KPI selectors (`selectAllSlots`, `selectCropsNearHarvest`, etc.) now **exclude seedling tray slots** so germinating seeds don't distort harvest predictions and plant counts

### Local DB
- `local-db.service.ts` — DB version bumped from 1 → 2; upgrade statement adds `germination_date TEXT` to `plot_slots` for existing installs; `upsertSlots` SQL updated to include the column

### Task generator (frontend)
- `task-generator.service.ts` — mirrors backend: seedling tray plots return only one `check` task

### Plot creation
- `plot-new.page.ts` — "Seedling Tray" option added to the plot type selector (icon: `grass`)
- `home.page.ts` / `plots.page.ts` — `seedling_tray` added to the `PLOT_TYPE_ICON` and `PLOT_TYPE_LABEL` record maps

### Grid slot component
- `garden-grid-slot.component.ts` — new `germinationDate` input; when set, shows a 🌱 (germinated) or 🌰 (not yet) badge on the slot

### Plot detail page
- `plot-detail.page.ts` — `isSeedlingTray` computed signal; passes `germinationDate` to each grid slot when in seedling tray mode; tapping an occupied cell opens an **action sheet** with:
  - "Mark as germinated" (if not yet germinated)
  - "Transplant to plot — suggested: {date}" (if germinated)
  - "View {crop} details" (always)

### Transplant modal
- `seedling-transplant-modal.component.ts` (new) — 2-step bottom sheet:
  1. List of non-seedling-tray plots → user picks target
  2. Mini grid of empty cells in the chosen plot → user picks cell
  - Dispatches `transplantSlot` on confirm

---

## Key technical notes

- **Postgres enum limitation**: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction. The migration uses `op.execute(COMMIT)` / `op.execute(BEGIN)` around it so Alembic can still stamp the version inside a transaction afterwards.
- **Specimen transfer**: the transplant endpoint reassigns the `Specimen.plot_slot_id` FK to the new slot *before* deleting the source slot to avoid a cascade delete wiping the specimen.
- **KPI exclusion**: seedling tray slots are excluded from all dashboard KPIs so seeds in germination don't count as active plants or skew harvest timelines.
