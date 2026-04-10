# Per-Crop Watering & Fertilisation Schedule

**Date:** 2026-04-10  
**Status:** Approved

---

## Context

Currently, watering tasks are generated from the plot-level `watering_days` (which days of the week) with a fixed weekly cadence. There is no per-crop override, and fertilisation tasks use a flat interval from the crop model (`fertilise_frequency_days`) with no day-of-week control. Users want to override both schedules per individual crop, choosing which days to water/fertilise and how frequently (every 1–4 weeks).

---

## What We're Building

Two identical schedule sections added to the specimen detail page (and the planting flow), one for watering and one for fertilisation. Each section has:

- **"Use plot default" toggle** — on by default; when off, shows custom controls
- **Day picker** — select which weekdays (M T W T F S S), same component already used on plot settings
- **Cadence chips** — "Every week / 2 weeks / 3 weeks / 4 weeks"

When the schedule changes on an existing specimen, all future uncompleted tasks of that type are deleted from today onwards and regenerated with the new schedule.

---

## Data Model Changes

### Backend — `PlotSlot`

Add 4 new nullable columns (null = use plot default):

```python
watering_days_override: Mapped[list[int] | None]   # null = use plot.watering_days
watering_interval_weeks: Mapped[int]                # default 1
fertilise_days_override: Mapped[list[int] | None]   # null = use plot.fertilise_days
fertilise_interval_weeks: Mapped[int]               # default 1
```

A new Alembic migration is required.

### Backend — `Plot`

Add `fertilise_days` to mirror the existing `watering_days`:

```python
fertilise_days: Mapped[list[int]]  # default []
```

This is the plot-level default for fertilisation day(s). A new Alembic migration is required (can be combined with the slot migration above).

### Task Generator (`backend/app/services/task_generator.py`)

Update `generate_tasks_for_slot()` to resolve the effective schedule:

```python
# Watering
effective_watering_days     = slot.watering_days_override or plot.watering_days
effective_watering_interval = slot.watering_interval_weeks  # default 1

# Fertilisation
effective_fertilise_days     = slot.fertilise_days_override or plot.fertilise_days
effective_fertilise_interval = slot.fertilise_interval_weeks  # default 1
```

For cadence > 1 week, only generate tasks on weeks where `week_number % interval_weeks == 0` (anchored to `sow_date`).

---

## API Changes

### `PATCH /plots/{plot_id}` — add `fertilise_days` to the update schema.

### `PATCH /plots/{plot_id}/slots/{slot_id}` — new endpoint (or extend existing) accepting:

```json
{
  "watering_days_override": [1, 3],
  "watering_interval_weeks": 2,
  "fertilise_days_override": [5],
  "fertilise_interval_weeks": 2
}
```

After updating the slot, the endpoint calls a new service method:

```python
async def regenerate_future_tasks(slot_id, task_types, from_date)
```

This deletes all uncompleted tasks of the given types with `due_date >= from_date` for that slot, then re-runs `generate_tasks_for_slot()` scoped to those types.

---

## Frontend Changes

### Shared component — `ScheduleSectionComponent`

A new reusable component (in `shared/`) that renders one section (watering or fertilisation):

**Inputs:**
- `label: string` — "WATERING" or "FERTILISATION"
- `toggleLabel: string` — "Use plot default"
- `defaultDays: number[]` — resolved default to pre-fill when switching to custom
- `days: number[] | null` — current override (null = using default)
- `intervalWeeks: number` — current cadence (1–4)

**Outputs:**
- `scheduleChange: { days: number[] | null, intervalWeeks: number }`

Internally it uses the existing `DayPickerComponent` and adds the cadence chips.

### Specimen Detail (`frontend/src/app/features/plots/specimen-detail.page.ts`)

Add two `<app-schedule-section>` blocks after the GROWTH section, before STAGE. Wire changes to a new store action `PlotsActions.updateSlotSchedule` which calls the PATCH endpoint and handles task regeneration server-side.

### Planting Flow (`frontend/src/app/features/plots/plot-new.page.ts` → crop picker / slot creation)

After the user picks a crop in `CropPickerComponent`, show both schedule sections with plot defaults pre-filled and toggle on. If the user adjusts them, the values are sent with the `createSlot` payload.

Extend `PlotsActions.createSlot` payload to include the 4 schedule fields. Null values for `_override` fields mean "use plot default" — the backend applies the same resolution logic as on update.

### Plot Settings (`frontend/src/app/features/plots/plot-new.page.ts` and plot edit if it exists)

Add a `fertilise_days` day picker to the plot creation form, mirroring the existing `watering_days` picker.

---

## Store Changes

### New action
```typescript
PlotsActions.updateSlotSchedule({
  plotId, slotId,
  watering_days_override, watering_interval_weeks,
  fertilise_days_override, fertilise_interval_weeks,
})
```

### New effect
Calls `PATCH /plots/{plotId}/slots/{slotId}`, on success dispatches `PlotsActions.loadSlots({ plotId })` to refresh the grid with updated schedule data.

### State
`PlotSlot` interface gets the 4 new fields matching the backend model.

---

## Task Regeneration Detail

On `PATCH /slots/{slot_id}` with schedule fields:

1. Delete all rows from `tasks` where `slot_id = X AND type IN ('water', 'fertilise') AND completed = false AND due_date >= today`
2. Call `generate_tasks_for_slot(slot, plot, crop)` with `task_types=['water','fertilise']` and `start_date=today`

Completed past tasks are never touched.

---

## Verification

1. Create a plot with `watering_days=[1,3]` (Tue, Thu), add `fertilise_days=[5]` (Sat)
2. Plant a crop → tasks generate using plot defaults
3. Open specimen detail → both sections show with toggle ON and plot defaults visible
4. Toggle watering OFF → pick Mon/Wed, cadence = every 2 weeks → save
5. Confirm future water tasks are deleted and new ones appear on Mon/Wed every 2 weeks
6. Toggle fertilisation OFF → pick Fri, cadence = every 3 weeks → save
7. Confirm future fertilise tasks regenerated accordingly
8. Plant a second crop → adjust schedule in planting flow → confirm tasks created with custom schedule from day 1
