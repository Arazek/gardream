# Per-Crop Watering & Fertilisation Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-crop watering and fertilisation schedule overrides (day-of-week picker + cadence 1–4 weeks) accessible from both the specimen detail page and the planting flow.

**Architecture:** 4 new nullable columns on `PlotSlot` + `fertilise_days` on `Plot`; task generator resolves effective schedule from slot override or plot default; new `ScheduleSectionComponent` reused in specimen detail and planting flow; NgRx action/effect/reducer for slot schedule updates.

**Tech Stack:** Python/SQLAlchemy/Alembic (backend), Angular 19/NgRx/Ionic (frontend), PostgreSQL

---

## File Map

**Create:**
- `backend/app/alembic/versions/<hash>_add_per_crop_schedule_fields.py`
- `frontend/src/app/shared/components/schedule-section/schedule-section.component.ts`
- `frontend/src/app/shared/components/schedule-section/schedule-section.component.html`

**Modify:**
- `backend/app/models/plot.py` — add `fertilise_days`
- `backend/app/models/plot_slot.py` — add 4 schedule fields
- `backend/app/schemas/plot.py` — add `fertilise_days` to Create/Update
- `backend/app/schemas/plot_slot.py` — add 4 schedule fields to Create/Update
- `backend/app/services/task_generator.py` — resolve effective schedule, apply cadence
- `backend/app/api/v1/endpoints/plots.py` — `PATCH /slots/{slot_id}` triggers regeneration; `POST /slots` accepts schedule fields
- `frontend/src/app/features/plots/store/plots.actions.ts` — add `updateSlotSchedule`
- `frontend/src/app/features/plots/store/plots.state.ts` — extend `PlotSlot` interface
- `frontend/src/app/features/plots/store/plots.effects.ts` — add `updateSlotSchedule$` effect
- `frontend/src/app/features/plots/store/plots.reducer.ts` — handle new action
- `frontend/src/app/features/plots/services/plots-api.service.ts` — add `updateSlotSchedule()`
- `frontend/src/app/features/plots/specimen-detail.page.ts` — add two schedule sections
- `frontend/src/app/features/plots/specimen-detail.page.html` — add two `<app-schedule-section>`
- `frontend/src/app/features/plots/components/crop-picker/crop-picker.component.ts` — add schedule sections to planting flow
- `frontend/src/app/features/plots/components/crop-picker/crop-picker.component.html`
- `frontend/src/app/features/plots/plot-new.page.ts` — add `fertilise_days` picker
- `frontend/src/app/features/plots/plot-new.page.html`

---

## Task 1: Alembic Migration

**Files:**
- Create: `backend/app/alembic/versions/<hash>_add_per_crop_schedule_fields.py`
- Modify: `backend/app/models/plot.py`
- Modify: `backend/app/models/plot_slot.py`

- [ ] **Step 1: Check most recent migration for head revision**

```bash
cd backend && docker compose exec backend alembic heads
# or read the latest migration file
```

Look for the `revision` value in `backend/app/alembic/versions/6e1782178bf9_replace_specimen_notes_with_note_entries.py`.

- [ ] **Step 2: Create the migration file**

Generate a new migration:
```bash
docker compose exec backend alembic revision --autogenerate -m "add_per_crop_schedule_fields"
```

Or create manually at `backend/app/alembic/versions/<new_hash>_add_per_crop_schedule_fields.py`:

```python
"""add_per_crop_schedule_fields

Revision ID: <new_hash>
Revises: 6e1782178bf9
Create Date: 2026-04-10
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '<new_hash>'
down_revision = '6e1782178bf9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Plot: add fertilise_days (default empty array)
    op.add_column(
        'plots',
        sa.Column(
            'fertilise_days',
            postgresql.ARRAY(sa.Integer()),
            nullable=False,
            server_default='{}',
        ),
    )

    # PlotSlot: add 4 schedule override fields
    op.add_column(
        'plot_slots',
        sa.Column(
            'watering_days_override',
            postgresql.ARRAY(sa.Integer()),
            nullable=True,
        ),
    )
    op.add_column(
        'plot_slots',
        sa.Column(
            'watering_interval_weeks',
            sa.Integer(),
            nullable=False,
            server_default='1',
        ),
    )
    op.add_column(
        'plot_slots',
        sa.Column(
            'fertilise_days_override',
            postgresql.ARRAY(sa.Integer()),
            nullable=True,
        ),
    )
    op.add_column(
        'plot_slots',
        sa.Column(
            'fertilise_interval_weeks',
            sa.Integer(),
            nullable=False,
            server_default='1',
        ),
    )


def downgrade() -> None:
    op.drop_column('plot_slots', 'fertilise_interval_weeks')
    op.drop_column('plot_slots', 'fertilise_days_override')
    op.drop_column('plot_slots', 'watering_interval_weeks')
    op.drop_column('plot_slots', 'watering_days_override')
    op.drop_column('plots', 'fertilise_days')
```

- [ ] **Step 3: Update Plot model**

In `backend/app/models/plot.py`, add after the existing `watering_days` column:

```python
fertilise_days: Mapped[list[int]] = mapped_column(
    ARRAY(Integer), nullable=False, default=list, server_default="{}"
)
```

- [ ] **Step 4: Update PlotSlot model**

In `backend/app/models/plot_slot.py`, add after existing fields:

```python
watering_days_override: Mapped[list[int] | None] = mapped_column(
    ARRAY(Integer), nullable=True, default=None
)
watering_interval_weeks: Mapped[int] = mapped_column(
    Integer, nullable=False, default=1, server_default="1"
)
fertilise_days_override: Mapped[list[int] | None] = mapped_column(
    ARRAY(Integer), nullable=True, default=None
)
fertilise_interval_weeks: Mapped[int] = mapped_column(
    Integer, nullable=False, default=1, server_default="1"
)
```

- [ ] **Step 5: Run migration**

```bash
docker compose exec backend alembic upgrade head
```

Expected: `Running upgrade 6e1782178bf9 -> <new_hash>, add_per_crop_schedule_fields`

- [ ] **Step 6: Verify columns exist**

```bash
docker compose exec db psql -U postgres -d gardream -c "\d plot_slots"
docker compose exec db psql -U postgres -d gardream -c "\d plots"
```

Expected: 4 new columns on `plot_slots`, `fertilise_days` on `plots`.

- [ ] **Step 7: Commit**

```bash
git add backend/app/models/plot.py backend/app/models/plot_slot.py \
        backend/app/alembic/versions/<new_hash>_add_per_crop_schedule_fields.py
git commit -m "feat: add per-crop schedule fields to PlotSlot and fertilise_days to Plot"
```

---

## Task 2: Update Pydantic Schemas

**Files:**
- Modify: `backend/app/schemas/plot.py`
- Modify: `backend/app/schemas/plot_slot.py`

- [ ] **Step 1: Update plot schemas**

In `backend/app/schemas/plot.py`, add `fertilise_days` to `PlotCreate` and `PlotUpdate`:

```python
class PlotCreate(BaseModel):
    name: str
    substrate: str | None = None
    watering_days: list[int] = []
    fertilise_days: list[int] = []

class PlotUpdate(BaseModel):
    name: str | None = None
    substrate: str | None = None
    watering_days: list[int] | None = None
    fertilise_days: list[int] | None = None
```

Also add `fertilise_days: list[int] = []` to the `PlotRead` (or `Plot`) response schema.

- [ ] **Step 2: Update plot_slot schemas**

In `backend/app/schemas/plot_slot.py`, add schedule fields to `PlotSlotCreate` and `PlotSlotUpdate`, and add them to the read schema:

```python
class PlotSlotCreate(BaseModel):
    crop_id: int
    sow_date: date
    row: int
    col: int
    watering_days_override: list[int] | None = None
    watering_interval_weeks: int = 1
    fertilise_days_override: list[int] | None = None
    fertilise_interval_weeks: int = 1

class PlotSlotUpdate(BaseModel):
    crop_id: int | None = None
    sow_date: date | None = None
    watering_days_override: list[int] | None = None
    watering_interval_weeks: int | None = None
    fertilise_days_override: list[int] | None = None
    fertilise_interval_weeks: int | None = None
```

Add the same 4 fields to the `PlotSlotRead` (or `PlotSlot`) response schema with their defaults.

- [ ] **Step 3: Restart backend and confirm no import errors**

```bash
docker compose restart backend
docker compose logs backend --tail=20
```

Expected: No `ImportError` or `ValidationError` at startup.

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/plot.py backend/app/schemas/plot_slot.py
git commit -m "feat: add schedule fields to plot and plot_slot schemas"
```

---

## Task 3: Update Task Generator

**Files:**
- Modify: `backend/app/services/task_generator.py`

Current behavior (read the file for exact function signatures before editing):
- `generate_tasks_for_slot(slot, plot, crop, db)` generates watering tasks using `plot.watering_days` and fertilise tasks using `crop.fertilise_frequency_days` as a flat interval from sow_date.

- [ ] **Step 1: Read current task_generator.py**

```bash
cat backend/app/services/task_generator.py
```

Identify: the loop structure, how `due_date` is calculated, how task type is determined.

- [ ] **Step 2: Update watering task generation**

Replace the watering section so it resolves the effective schedule:

```python
# Resolve effective watering schedule
effective_watering_days = slot.watering_days_override if slot.watering_days_override is not None else plot.watering_days
effective_watering_interval = slot.watering_interval_weeks  # default 1

# Anchor week number to sow_date
sow_week = slot.sow_date.isocalendar()[1]  # ISO week number

for day_offset in range(90):
    candidate = start_date + timedelta(days=day_offset)
    candidate_weekday = candidate.weekday()  # 0=Mon
    candidate_week = candidate.isocalendar()[1]
    weeks_since_sow = (candidate - slot.sow_date).days // 7

    if candidate_weekday not in effective_watering_days:
        continue
    if effective_watering_interval > 1 and weeks_since_sow % effective_watering_interval != 0:
        continue

    # create water task for candidate date (existing logic)
```

- [ ] **Step 3: Update fertilisation task generation**

Replace the fertilisation section to use day-of-week + interval instead of flat interval:

```python
# Resolve effective fertilisation schedule
effective_fertilise_days = slot.fertilise_days_override if slot.fertilise_days_override is not None else plot.fertilise_days
effective_fertilise_interval = slot.fertilise_interval_weeks  # default 1

for day_offset in range(90):
    candidate = start_date + timedelta(days=day_offset)
    candidate_weekday = candidate.weekday()
    weeks_since_sow = (candidate - slot.sow_date).days // 7

    if not effective_fertilise_days:
        continue  # no fertilise days configured — skip
    if candidate_weekday not in effective_fertilise_days:
        continue
    if effective_fertilise_interval > 1 and weeks_since_sow % effective_fertilise_interval != 0:
        continue

    # create fertilise task for candidate date (existing logic)
```

- [ ] **Step 4: Add `start_date` and `task_types` parameters to `generate_tasks_for_slot`**

The regeneration service (Task 4) needs to call this with a custom start_date and filtered task types. Update the signature:

```python
def generate_tasks_for_slot(
    slot,
    plot,
    crop,
    db,
    start_date: date | None = None,
    task_types: list[str] | None = None,
) -> None:
    if start_date is None:
        start_date = date.today()
    if task_types is None:
        task_types = ['water', 'fertilise']
    # ... existing generation logic, guard each section with `if 'water' in task_types` etc.
```

- [ ] **Step 5: Restart backend, check logs for no errors**

```bash
docker compose restart backend && docker compose logs backend --tail=20
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/task_generator.py
git commit -m "feat: update task generator to use per-slot schedule overrides and cadence"
```

---

## Task 4: Regeneration Service + API Endpoint

**Files:**
- Modify: `backend/app/api/v1/endpoints/plots.py`

- [ ] **Step 1: Add `regenerate_future_tasks` helper inside plots.py (or a service file)**

Add this function (can be inline in plots.py above the endpoint, or in a new `backend/app/services/task_regeneration.py` imported there):

```python
async def regenerate_future_tasks(
    db: AsyncSession,
    slot: PlotSlot,
    plot: Plot,
    crop: Crop,
    task_types: list[str],
) -> None:
    from datetime import date
    today = date.today()

    # Delete future uncompleted tasks of the given types
    await db.execute(
        delete(Task).where(
            Task.slot_id == slot.id,
            Task.type.in_(task_types),
            Task.completed == False,
            Task.due_date >= today,
        )
    )

    # Regenerate from today
    generate_tasks_for_slot(slot, plot, crop, db, start_date=today, task_types=task_types)
    await db.commit()
```

Make sure `Task`, `delete`, `generate_tasks_for_slot` are imported.

- [ ] **Step 2: Update `PATCH /plots/{plot_id}/slots/{slot_id}` to detect schedule changes**

Read the existing `update_slot` endpoint in `backend/app/api/v1/endpoints/plots.py`. Add schedule field detection:

```python
@router.patch("/{plot_id}/slots/{slot_id}", response_model=PlotSlotRead)
async def update_slot(
    plot_id: int,
    slot_id: int,
    data: PlotSlotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slot = await get_slot_or_404(db, slot_id, plot_id, current_user.id)

    schedule_fields = {
        'watering_days_override', 'watering_interval_weeks',
        'fertilise_days_override', 'fertilise_interval_weeks',
    }
    schedule_changed = any(
        getattr(data, f) is not None for f in schedule_fields
    )

    # Apply updates
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(slot, field, value)

    await db.commit()
    await db.refresh(slot)

    if schedule_changed:
        plot = await get_plot_or_404(db, plot_id, current_user.id)
        crop = await get_crop_or_404(db, slot.crop_id)
        await regenerate_future_tasks(db, slot, plot, crop, task_types=['water', 'fertilise'])

    return slot
```

- [ ] **Step 3: Update `POST /plots/{plot_id}/slots` to pass schedule fields to generator**

In the create slot endpoint, after creating the slot, pass the schedule fields through `generate_tasks_for_slot` (they are already on the slot object if the model is set correctly from `PlotSlotCreate`).

No additional code change needed if the model fields are set from the schema — the generator reads them off `slot`.

- [ ] **Step 4: Update `PATCH /plots/{plot_id}` to accept `fertilise_days`**

Verify the existing plot update endpoint applies all fields from `PlotUpdate` via `model_dump`. If it uses a loop like `for field, value in data.model_dump(exclude_unset=True).items(): setattr(plot, field, value)`, no change is needed — the schema update in Task 2 is sufficient.

- [ ] **Step 5: Test endpoints manually**

```bash
# Create a plot with fertilise_days
curl -X POST http://localhost:8000/api/v1/plots \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","watering_days":[1,3],"fertilise_days":[5]}'

# Check returned plot has fertilise_days
# Update a slot schedule
curl -X PATCH http://localhost:8000/api/v1/plots/1/slots/1 \
  -H "Content-Type: application/json" \
  -d '{"watering_days_override":[0,2],"watering_interval_weeks":2}'
```

Expected: 200 responses with updated fields; tasks table shows new water tasks only on Mon/Wed every 2 weeks from today.

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/endpoints/plots.py
git commit -m "feat: regenerate future tasks on slot schedule update"
```

---

## Task 5: Frontend — Update TypeScript Interfaces & API Service

**Files:**
- Modify: `frontend/src/app/features/plots/store/plots.state.ts`
- Modify: `frontend/src/app/features/plots/services/plots-api.service.ts`

- [ ] **Step 1: Update `PlotSlot` interface in plots.state.ts**

```typescript
export interface PlotSlot {
  id: number;
  plot_id: number;
  crop_id: number;
  row: number;
  col: number;
  sow_date: string;
  crop?: Crop;
  // New schedule fields
  watering_days_override: number[] | null;
  watering_interval_weeks: number;
  fertilise_days_override: number[] | null;
  fertilise_interval_weeks: number;
}
```

Also add `fertilise_days: number[]` to the `Plot` interface.

- [ ] **Step 2: Add `updateSlotSchedule` to plots-api.service.ts**

Read the file first, then add:

```typescript
updateSlotSchedule(
  plotId: number,
  slotId: number,
  payload: {
    watering_days_override: number[] | null;
    watering_interval_weeks: number;
    fertilise_days_override: number[] | null;
    fertilise_interval_weeks: number;
  }
): Observable<PlotSlot> {
  return this.http.patch<PlotSlot>(
    `${this.baseUrl}/plots/${plotId}/slots/${slotId}`,
    payload
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/plots/store/plots.state.ts \
        frontend/src/app/features/plots/services/plots-api.service.ts
git commit -m "feat: extend PlotSlot interface and API service with schedule fields"
```

---

## Task 6: NgRx — Action, Effect, Reducer

**Files:**
- Modify: `frontend/src/app/features/plots/store/plots.actions.ts`
- Modify: `frontend/src/app/features/plots/store/plots.effects.ts`
- Modify: `frontend/src/app/features/plots/store/plots.reducer.ts`

- [ ] **Step 1: Add `updateSlotSchedule` action to plots.actions.ts**

Read the file first to find the existing action group pattern, then add:

```typescript
updateSlotSchedule: props<{
  plotId: number;
  slotId: number;
  watering_days_override: number[] | null;
  watering_interval_weeks: number;
  fertilise_days_override: number[] | null;
  fertilise_interval_weeks: number;
}>(),
updateSlotScheduleSuccess: props<{ slot: PlotSlot }>(),
updateSlotScheduleFailure: props<{ error: string }>(),
```

- [ ] **Step 2: Add effect in plots.effects.ts**

Read the file first to find the pattern, then add after existing effects:

```typescript
updateSlotSchedule$ = createEffect(() =>
  this.actions$.pipe(
    ofType(PlotsActions.updateSlotSchedule),
    mergeMap(({ plotId, slotId, watering_days_override, watering_interval_weeks, fertilise_days_override, fertilise_interval_weeks }) =>
      this.api.updateSlotSchedule(plotId, slotId, {
        watering_days_override,
        watering_interval_weeks,
        fertilise_days_override,
        fertilise_interval_weeks,
      }).pipe(
        map((slot) => PlotsActions.updateSlotScheduleSuccess({ slot })),
        catchError((error) =>
          of(PlotsActions.updateSlotScheduleFailure({ error: error.message }))
        )
      )
    )
  )
);
```

- [ ] **Step 3: Add reducer case in plots.reducer.ts**

Read the file first to find the pattern, then add:

```typescript
on(PlotsActions.updateSlotScheduleSuccess, (state, { slot }) => ({
  ...state,
  slots: {
    ...state.slots,
    [slot.plot_id]: (state.slots[slot.plot_id] ?? []).map((s) =>
      s.id === slot.id ? slot : s
    ),
  },
})),
```

- [ ] **Step 4: Compile check**

```bash
cd frontend && npx ng build --configuration development 2>&1 | tail -30
```

Expected: No TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/features/plots/store/plots.actions.ts \
        frontend/src/app/features/plots/store/plots.effects.ts \
        frontend/src/app/features/plots/store/plots.reducer.ts
git commit -m "feat: add updateSlotSchedule NgRx action, effect, and reducer"
```

---

## Task 7: Shared ScheduleSectionComponent

**Files:**
- Create: `frontend/src/app/shared/components/schedule-section/schedule-section.component.ts`
- Create: `frontend/src/app/shared/components/schedule-section/schedule-section.component.html`

- [ ] **Step 1: Read DayPickerComponent to understand its API**

```bash
find frontend/src/app/shared -name "day-picker*" | head -5
cat <path-to-day-picker.component.ts>
```

Note the `@Input()` and `@Output()` names exactly.

- [ ] **Step 2: Create schedule-section.component.ts**

```typescript
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonToggle, IonLabel } from '@ionic/angular/standalone';
import { DayPickerComponent } from '../day-picker/day-picker.component';

export interface ScheduleValue {
  days: number[] | null;
  intervalWeeks: number;
}

@Component({
  selector: 'app-schedule-section',
  standalone: true,
  imports: [CommonModule, IonToggle, IonLabel, DayPickerComponent],
  templateUrl: './schedule-section.component.html',
})
export class ScheduleSectionComponent implements OnInit {
  @Input() label = '';
  @Input() toggleLabel = 'Use plot default';
  @Input() defaultDays: number[] = [];
  @Input() days: number[] | null = null;
  @Input() intervalWeeks = 1;

  @Output() scheduleChange = new EventEmitter<ScheduleValue>();

  useDefault = true;
  localDays: number[] = [];
  localInterval = 1;

  readonly cadenceOptions = [
    { label: 'Every week', value: 1 },
    { label: '2 weeks', value: 2 },
    { label: '3 weeks', value: 3 },
    { label: '4 weeks', value: 4 },
  ];

  ngOnInit() {
    this.useDefault = this.days === null;
    this.localDays = this.days ?? [...this.defaultDays];
    this.localInterval = this.intervalWeeks;
  }

  onToggle(checked: boolean) {
    this.useDefault = checked;
    if (checked) {
      this.scheduleChange.emit({ days: null, intervalWeeks: this.localInterval });
    } else {
      this.localDays = [...this.defaultDays];
      this.scheduleChange.emit({ days: this.localDays, intervalWeeks: this.localInterval });
    }
  }

  onDaysChange(days: number[]) {
    this.localDays = days;
    if (!this.useDefault) {
      this.scheduleChange.emit({ days: this.localDays, intervalWeeks: this.localInterval });
    }
  }

  onCadenceSelect(value: number) {
    this.localInterval = value;
    this.scheduleChange.emit({
      days: this.useDefault ? null : this.localDays,
      intervalWeeks: this.localInterval,
    });
  }
}
```

- [ ] **Step 3: Create schedule-section.component.html**

```html
<div class="schedule-section">
  <div class="section-label">{{ label }}</div>

  <div class="toggle-row">
    <span class="toggle-text">{{ toggleLabel }}</span>
    <ion-toggle [checked]="useDefault" (ionChange)="onToggle($event.detail.checked)" />
  </div>

  @if (!useDefault) {
    <div class="custom-controls">
      <div class="sub-label">Days</div>
      <app-day-picker [selectedDays]="localDays" (daysChange)="onDaysChange($event)" />

      <div class="sub-label">Cadence</div>
      <div class="cadence-chips">
        @for (opt of cadenceOptions; track opt.value) {
          <button
            class="chip"
            [class.chip--active]="localInterval === opt.value"
            (click)="onCadenceSelect(opt.value)"
          >
            {{ opt.label }}
          </button>
        }
      </div>
    </div>
  }
</div>
```

> **Note:** Check the actual `@Input()`/`@Output()` names on `DayPickerComponent` from Step 1 — adjust `[selectedDays]` and `(daysChange)` to match.

- [ ] **Step 4: Export from shared module / barrel**

Check if `frontend/src/app/shared/components/index.ts` exists. If so, add:

```typescript
export * from './schedule-section/schedule-section.component';
```

- [ ] **Step 5: Compile check**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -20
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shared/components/schedule-section/
git commit -m "feat: add ScheduleSectionComponent with toggle, day picker, and cadence chips"
```

---

## Task 8: Specimen Detail Page

**Files:**
- Modify: `frontend/src/app/features/plots/specimen-detail.page.ts`
- Modify: `frontend/src/app/features/plots/specimen-detail.page.html`

- [ ] **Step 1: Read specimen-detail.page.ts**

```bash
cat frontend/src/app/features/plots/specimen-detail.page.ts
```

Identify: how `slot` and `plot` are selected from store, where actions are dispatched.

- [ ] **Step 2: Add computed properties for schedule inputs**

Add in the component class:

```typescript
import { ScheduleSectionComponent } from '../../shared/components/schedule-section/schedule-section.component';
import { PlotsActions } from './store/plots.actions';

// Inside component:
readonly wateringDays = computed(() => this.slot()?.watering_days_override ?? null);
readonly wateringInterval = computed(() => this.slot()?.watering_interval_weeks ?? 1);
readonly fertiliseDays = computed(() => this.slot()?.fertilise_days_override ?? null);
readonly fertiliseInterval = computed(() => this.slot()?.fertilise_interval_weeks ?? 1);
readonly plotWateringDays = computed(() => this.plot()?.watering_days ?? []);
readonly plotFertiliseDays = computed(() => this.plot()?.fertilise_days ?? []);
```

Add to `imports` array: `ScheduleSectionComponent`

Add handler method:

```typescript
onWateringScheduleChange(value: { days: number[] | null; intervalWeeks: number }) {
  const slot = this.slot();
  const plot = this.plot();
  if (!slot || !plot) return;
  this.store.dispatch(PlotsActions.updateSlotSchedule({
    plotId: plot.id,
    slotId: slot.id,
    watering_days_override: value.days,
    watering_interval_weeks: value.intervalWeeks,
    fertilise_days_override: slot.fertilise_days_override,
    fertilise_interval_weeks: slot.fertilise_interval_weeks,
  }));
}

onFertiliseScheduleChange(value: { days: number[] | null; intervalWeeks: number }) {
  const slot = this.slot();
  const plot = this.plot();
  if (!slot || !plot) return;
  this.store.dispatch(PlotsActions.updateSlotSchedule({
    plotId: plot.id,
    slotId: slot.id,
    watering_days_override: slot.watering_days_override,
    watering_interval_weeks: slot.watering_interval_weeks,
    fertilise_days_override: value.days,
    fertilise_interval_weeks: value.intervalWeeks,
  }));
}
```

- [ ] **Step 3: Add schedule sections to HTML**

In `specimen-detail.page.html`, after the GROWTH section and before the STAGE section:

```html
<app-schedule-section
  label="WATERING"
  toggleLabel="Use plot default"
  [defaultDays]="plotWateringDays()"
  [days]="wateringDays()"
  [intervalWeeks]="wateringInterval()"
  (scheduleChange)="onWateringScheduleChange($event)"
/>

<app-schedule-section
  label="FERTILISATION"
  toggleLabel="Use plot default"
  [defaultDays]="plotFertiliseDays()"
  [days]="fertiliseDays()"
  [intervalWeeks]="fertiliseInterval()"
  (scheduleChange)="onFertiliseScheduleChange($event)"
/>
```

- [ ] **Step 4: Compile check**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -20
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/features/plots/specimen-detail.page.ts \
        frontend/src/app/features/plots/specimen-detail.page.html
git commit -m "feat: add watering and fertilisation schedule sections to specimen detail"
```

---

## Task 9: Planting Flow (CropPickerComponent)

**Files:**
- Modify: `frontend/src/app/features/plots/components/crop-picker/crop-picker.component.ts`
- Modify: `frontend/src/app/features/plots/components/crop-picker/crop-picker.component.html`
- Modify: `frontend/src/app/features/plots/store/plots.actions.ts` (extend `createSlot` payload)

- [ ] **Step 1: Read crop-picker.component.ts**

```bash
cat frontend/src/app/features/plots/components/crop-picker/crop-picker.component.ts
```

Identify: how it outputs the selected crop, where `createSlot` is dispatched.

- [ ] **Step 2: Add schedule state to CropPickerComponent**

```typescript
import { ScheduleSectionComponent, ScheduleValue } from '../../../../shared/components/schedule-section/schedule-section.component';

// Inputs from parent (resolved plot defaults)
@Input() plotWateringDays: number[] = [];
@Input() plotFertiliseDays: number[] = [];

// Local schedule state (starts as "use plot default")
wateringSchedule: ScheduleValue = { days: null, intervalWeeks: 1 };
fertiliseSchedule: ScheduleValue = { days: null, intervalWeeks: 1 };

onWateringChange(value: ScheduleValue) { this.wateringSchedule = value; }
onFertiliseChange(value: ScheduleValue) { this.fertiliseSchedule = value; }
```

Add `ScheduleSectionComponent` to `imports`.

- [ ] **Step 3: Pass schedule to createSlot dispatch**

Find the existing `createSlot` dispatch and extend it:

```typescript
this.store.dispatch(PlotsActions.createSlot({
  plotId: this.plotId,
  crop_id: selectedCrop.id,
  sow_date: this.sowDate,
  row: this.row,
  col: this.col,
  watering_days_override: this.wateringSchedule.days,
  watering_interval_weeks: this.wateringSchedule.intervalWeeks,
  fertilise_days_override: this.fertiliseSchedule.days,
  fertilise_interval_weeks: this.fertiliseSchedule.intervalWeeks,
}));
```

- [ ] **Step 4: Extend `createSlot` action props**

In `plots.actions.ts`, add the 4 schedule fields to `createSlot` props (all optional):

```typescript
createSlot: props<{
  plotId: number;
  crop_id: number;
  sow_date: string;
  row: number;
  col: number;
  watering_days_override?: number[] | null;
  watering_interval_weeks?: number;
  fertilise_days_override?: number[] | null;
  fertilise_interval_weeks?: number;
}>(),
```

Update the `createSlot$` effect in `plots.effects.ts` to pass these fields to the API call.

- [ ] **Step 5: Add schedule sections to crop-picker HTML**

After the crop is selected (find the existing crop selection confirmation UI), add:

```html
<app-schedule-section
  label="WATERING"
  toggleLabel="Use plot default"
  [defaultDays]="plotWateringDays"
  [days]="wateringSchedule.days"
  [intervalWeeks]="wateringSchedule.intervalWeeks"
  (scheduleChange)="onWateringChange($event)"
/>

<app-schedule-section
  label="FERTILISATION"
  toggleLabel="Use plot default"
  [defaultDays]="plotFertiliseDays"
  [days]="fertiliseSchedule.days"
  [intervalWeeks]="fertiliseSchedule.intervalWeeks"
  (scheduleChange)="onFertiliseChange($event)"
/>
```

- [ ] **Step 6: Pass plot defaults from parent page**

In `plot-new.page.ts` (or wherever `crop-picker` is hosted), pass the selected plot's watering/fertilise days:

```html
<app-crop-picker
  [plotWateringDays]="selectedPlot()?.watering_days ?? []"
  [plotFertiliseDays]="selectedPlot()?.fertilise_days ?? []"
  ...
/>
```

- [ ] **Step 7: Compile check**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -20
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/features/plots/components/crop-picker/ \
        frontend/src/app/features/plots/store/plots.actions.ts \
        frontend/src/app/features/plots/store/plots.effects.ts \
        frontend/src/app/features/plots/plot-new.page.ts \
        frontend/src/app/features/plots/plot-new.page.html
git commit -m "feat: add per-crop schedule selection to planting flow"
```

---

## Task 10: Plot Creation Form — fertilise_days

**Files:**
- Modify: `frontend/src/app/features/plots/plot-new.page.ts`
- Modify: `frontend/src/app/features/plots/plot-new.page.html`

- [ ] **Step 1: Read plot-new.page.ts**

```bash
cat frontend/src/app/features/plots/plot-new.page.ts
```

Find how `watering_days` is handled in the form — identify the form control name and the day picker binding.

- [ ] **Step 2: Add fertilise_days form field**

In `plot-new.page.ts`, add `fertilise_days` alongside `watering_days`:

```typescript
// In FormGroup or reactive state:
fertilise_days: [[] as number[]],
```

Or if using signals:

```typescript
fertiliseDays = signal<number[]>([]);
```

Add handler:

```typescript
onFertiliseDaysChange(days: number[]) {
  this.fertiliseDays.set(days);
}
```

Pass `fertilise_days` in the `createPlot` dispatch:

```typescript
this.store.dispatch(PlotsActions.createPlot({
  name: ...,
  watering_days: this.wateringDays(),
  fertilise_days: this.fertiliseDays(),
}));
```

- [ ] **Step 3: Add day picker to plot form HTML**

In `plot-new.page.html`, after the existing watering days picker, add:

```html
<div class="section-label">FERTILISATION DAYS</div>
<app-day-picker
  [selectedDays]="fertiliseDays()"
  (daysChange)="onFertiliseDaysChange($event)"
/>
```

- [ ] **Step 4: Compile check**

```bash
cd frontend && npx ng build --configuration development 2>&1 | grep -i error | head -20
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/features/plots/plot-new.page.ts \
        frontend/src/app/features/plots/plot-new.page.html
git commit -m "feat: add fertilise_days picker to plot creation form"
```

---

## Verification

Follow the spec verification steps:

1. **Create a plot** with `watering_days=[1,3]` (Tue, Thu) and `fertilise_days=[5]` (Sat) using the updated plot creation form.

2. **Plant a crop** — tasks should be generated using plot defaults. Check the tasks table:
   ```bash
   docker compose exec db psql -U postgres -d gardream \
     -c "SELECT due_date, type FROM tasks WHERE slot_id=<id> ORDER BY due_date LIMIT 20"
   ```
   Expected: water tasks on Tue/Thu every week, fertilise on Sat every week.

3. **Open specimen detail** — both WATERING and FERTILISATION sections appear with toggle ON (plot defaults shown).

4. **Toggle watering OFF** → pick Mon (0) and Wed (2), cadence = 2 weeks → save.
   Expected: Future water tasks deleted, new ones appear on Mon/Wed every 2 weeks.

5. **Toggle fertilisation OFF** → pick Fri (4), cadence = 3 weeks → save.
   Expected: Future fertilise tasks regenerated on Fri every 3 weeks.

6. **Plant a second crop** → in planting flow, adjust schedule → confirm tasks created with custom schedule from day 1.

7. **Create a new plot** → verify `fertilise_days` picker appears and saves correctly.
