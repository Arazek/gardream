# 06 — Crop Encyclopedia (Library)

**Route:** `/tabs/library`
**Sub-route:** `/tabs/library/:cropId`
**Feature folder:** `frontend/src/app/features/library/`

Browse and search the crop database. Read-only for MVP. Powers crop assignment in Plot Planner.

---

## Screens

### Library Index (`/tabs/library`)

```
TopAppBarComponent (title: "Library")
─────────────────────────────────────
EncyclopediaHeroComponent     ← gradient hero + search bar
─────────────────────────────────────
FilterChipComponent × 5       ← All | Vegetables | Herbs | Fruit | Flowers
─────────────────────────────────────
SpecimenGridComponent         ← bento asymmetric grid
─────────────────────────────────────
BottomNavBarComponent
```

### Crop Detail (`/tabs/library/:cropId`)

```
Back button + crop name in top bar
──────────────────────────────────
Hero image (full width, --radius-xl bottom corners)
Crop name (type-heading-2) + latin name (type-latin-name)
Category chip (FilterChipComponent, non-interactive)
──────────────────────────────────
Growing info section:
  - Days to germinate       StatChipComponent
  - Days to harvest         StatChipComponent
  - Sun requirement         StatChipComponent
  - Spacing                 StatChipComponent
──────────────────────────────────
Task schedule section:
  TaskListItemComponent rows (read-only) — water every N days, fertilise every N days, harvest on day X
──────────────────────────────────
Substrate section:
  SoilMixCardComponent (feature component)
──────────────────────────────────
"Add to plot" CTA button (--btn--primary) → navigates to /tabs/plots (crop pre-selected)
```

---

## Feature components

### `EncyclopediaHeroComponent`
Full-width gradient hero (`--color-primary` → `--color-primary-container`).
Large decorative blur circle. `SearchBarComponent` inset at the bottom edge.
Inputs: none. Emits `search: EventEmitter<string>`.

### `SpecimenGridComponent`
Asymmetric CSS grid — alternates large (2-col span) and compact `SpecimenCard` layout.
Pattern (repeat): [large, compact, compact, large, compact, compact, …]
Inputs: `crops: CropSummary[]`
Outputs: `cropSelected: EventEmitter<string>` (cropId)

### `SoilMixCardComponent`
Article card — mix name (`type-heading-4`), description (`type-body`), 3 composition `ProgressBarComponent` rows (e.g. "Topsoil 40%", "Compost 30%", "Perlite 30%"), category badge.
Inputs: `soilMix: SoilMix`

### `CropPickerComponent`
Used inside the plot slot assignment bottom sheet (not in Library tab).
`SearchBarComponent` + `FilterChipComponent` row + scrollable `SpecimenCardComponent` compact list.
Outputs: `cropSelected: EventEmitter<string>`

---

## Search & filter behaviour

- Search filters by `name` or `latin_name` (client-side, all crops loaded at once for MVP).
- Category chips filter by `category` field.
- Combined: search text AND active category chip must both match.
- Debounce search input 300ms.

---

## NgRx store slice — `library`

```
features/library/store/
  library.actions.ts    — loadCrops, loadCropsSuccess, loadCrop, loadCropSuccess, setFilter, setSearch
  library.effects.ts
  library.reducer.ts
  library.selectors.ts  — selectFilteredCrops, selectCropById, selectActiveFilter, selectSearchQuery
  library.state.ts      — { crops: Crop[], selectedCrop: Crop | null, filter, search, status }
```

All crops loaded once on first Library visit and cached. Individual crop detail fetched on demand.

---

## API calls

| Action | Endpoint |
|---|---|
| Load all crops | `GET /api/v1/crops` |
| Load crop detail | `GET /api/v1/crops/:id` |
| Search crops | `GET /api/v1/crops?q=&category=` |
