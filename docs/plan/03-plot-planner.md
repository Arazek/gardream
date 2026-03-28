# 03 — Plot Planner

**Routes:**
- `/tabs/plots` — plot list
- `/tabs/plots/new` — create plot
- `/tabs/plots/:id` — plot detail (grid view)
- `/tabs/plots/:id/edit` — edit plot metadata

**Feature folder:** `frontend/src/app/features/plots/`

---

## Screens

### Plot List (`/tabs/plots`)
`TopAppBarComponent` — title "My Plots", trailing FAB-style add button.
Grid of `PlotCardComponent` (2-col on tablet, 1-col on mobile).
Empty state: `EmptyStateComponent` — "Start by creating your first plot."

### Plot Setup — New/Edit (`/tabs/plots/new`, `/tabs/plots/:id/edit`)
Full-page form. Sections:

1. **Name field** — `FormFieldComponent`, text input.
2. **Plot type** — `PlotTypeSelectorComponent` — options: Ground Bed, Raised Bed, Container, Vertical.
3. **Dimensions** — two `FormFieldComponent` number inputs (rows × columns). Preview updates live.
4. **Substrate** — `SelectFieldComponent` — options pulled from crop seed data substrate list.
5. **Watering days** — `DayPickerComponent` — which days of the week to water.
6. **Layout preview** — `LayoutPreviewComponent` (feature component) — live grid canvas.

Submit: POST/PUT plot → redirect to `/tabs/plots/:id`.

### Plot Detail (`/tabs/plots/:id`)

**Plot header** (`PlotHeaderComponent`, feature component):
- Plot name (`type-heading-3`), type label (`type-label`).
- Type toggle: Ground / Raised Bed (segment control).
- Stat chips row: `StatChipComponent` × 3 — Health %, Hydration %, Next harvest date.

**Garden grid** (`GardenGridComponent`, feature component):
- CSS grid matching plot dimensions.
- Each cell: `GardenGridSlotComponent`.
- Tap filled slot → crop detail sheet.
- Tap empty slot → crop picker modal → assigns crop.

**Harvest insight row** (`HarvestInsightRowComponent`, feature component):
- Two info cards: "Next harvest" + "Active alerts" (overdue tasks).

---

## Feature components

### `GardenGridComponent`
Inputs: `plot: Plot`, `slots: PlotSlot[]`
Outputs: `slotTapped: EventEmitter<PlotSlot | null>` (null = empty slot)
Renders CSS grid: `grid-template-columns: repeat([cols], 1fr)`.

### `PlotHeaderComponent`
Inputs: `plot: Plot`, `stats: PlotStats`
Outputs: `typeChanged: EventEmitter<PlotType>`

### `HarvestInsightRowComponent`
Inputs: `nextHarvestDate: string | null`, `overdueCount: number`

### `LayoutPreviewComponent`
Inputs: `rows: number`, `cols: number`, `slots: SlotPreview[]`
Used in setup form — read-only canvas showing slot grid with crop thumbnails.

### `PlotSetupFormComponent`
Orchestrates all form sub-components.
Reactive form (`FormGroup`). Emits `formSubmitted: EventEmitter<PlotPayload>`.

---

## Crop assignment flow

1. User taps empty `GardenGridSlotComponent`
2. Bottom sheet opens → `CropPickerComponent` (feature component, search + filter chips)
3. User selects crop → chooses sow date (date picker)
4. `POST /api/v1/plots/:id/slots` → creates slot with `crop_id` + `sow_date`
5. Backend generates initial task set for that slot (see Task Engine)
6. Grid refreshes

---

## NgRx store slice — `plots`

```
features/plots/store/
  plots.actions.ts     — loadPlots, loadPlot, createPlot, updatePlot, deletePlot
                         assignCrop, removeCrop
  plots.effects.ts
  plots.reducer.ts
  plots.selectors.ts   — selectAllPlots, selectPlotById, selectSlotsByPlotId
  plots.state.ts       — { plots: Plot[], slots: PlotSlot[], status }
```

---

## API calls

| Action | Endpoint |
|---|---|
| Load all plots | `GET /api/v1/plots` |
| Load single plot | `GET /api/v1/plots/:id` |
| Create plot | `POST /api/v1/plots` |
| Update plot | `PUT /api/v1/plots/:id` |
| Delete plot | `DELETE /api/v1/plots/:id` |
| Load slots | `GET /api/v1/plots/:id/slots` |
| Assign crop to slot | `POST /api/v1/plots/:id/slots` |
| Remove crop from slot | `DELETE /api/v1/plots/:id/slots/:slotId` |
