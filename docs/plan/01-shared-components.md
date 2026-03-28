# 01 — Shared Components

All components live in `frontend/src/app/shared/components/`.
Each requires: `.component.ts`, `.component.scss` (BEM), `.component.stories.ts`.
Build in dependency order — primitives first.

---

## Build order

### 1. `IconContainerComponent`
**BEM block:** `icon-container`
**Inputs:** `icon: string` (Material symbol name), `size: 'sm'|'md'|'lg'|'xl'` (default `'md'`), `variant: 'primary'|'secondary'|'surface'|'tertiary'` (default `'primary'`)
**Behaviour:** Circular container (`--radius-full`), renders `<span class="material-symbols-outlined">`. Size maps to `--icon-container-*` tokens. Variant sets background + icon color from design system tokens.
**Used by:** Every other component.

---

### 2. `ProgressBarComponent`
**BEM block:** `progress-bar`
**Inputs:** `value: number` (0–100), `label?: string`
**Behaviour:** Track height `0.375rem`, `--radius-full`, fill animates from 0 → value on mount (`--duration-complex`, `--ease-decelerate`). Fill color `--color-primary`.

---

### 3. `FilterChipComponent`
**BEM block:** `filter-chip`
**Inputs:** `label: string`, `active: boolean`
**Outputs:** `toggled: EventEmitter<void>`
**Behaviour:** `--radius-full` pill. Active: `--color-primary` bg + `--color-on-primary` text. Inactive: `--color-surface-container` bg + `--color-on-surface` text. Transition on toggle: `--duration-quick` / `--ease-standard`.

---

### 4. `SearchBarComponent`
**BEM block:** `search-bar`
**Inputs:** `placeholder?: string`, `value?: string`
**Outputs:** `valueChange: EventEmitter<string>`
**Behaviour:** `--radius-md` input, leading `search` icon in `IconContainerComponent` (size `sm`), `--color-surface-container-low` background, focus ring via `:focus-visible`.

---

### 5. `TaskCardComponent`
**BEM block:** `task-card`
**Inputs:** `icon: string`, `title: string`, `description?: string`, `timestamp?: string`, `completed: boolean`
**Outputs:** `completedChange: EventEmitter<boolean>`
**Behaviour:** Lifted card (`--color-surface-container-lowest`, `--shadow-card`, `--radius-lg`). Left: `IconContainerComponent`. Right: headline title (`type-heading-4`), body description (`type-body`), label timestamp (`type-label-sm`). Circular checkbox (right edge). Hover shifts bg to `--color-surface-container-high`.

---

### 6. `TaskListItemComponent`
**BEM block:** `task-list-item`
**Inputs:** `icon: string`, `title: string`, `subtitle?: string`, `completed: boolean`, `overdue?: boolean`
**Outputs:** `completedChange: EventEmitter<boolean>`
**Behaviour:** Horizontal row. Left: `IconContainerComponent` (size `sm`). Center: title (`type-label-lg`) + subtitle (`type-body-sm`). Right: circular checkbox. Overdue modifier: icon container tertiary variant.

---

### 7. `StatChipComponent`
**BEM block:** `stat-chip`
**Inputs:** `icon: string`, `label: string`, `value: string`
**Behaviour:** Horizontal pill — small `IconContainerComponent` (size `sm`, variant `surface`) + stacked label (`type-label-sm`) + value (`type-label-lg`). `--color-surface-container-low` bg, `--radius-full`.

---

### 8. `DayPickerComponent`
**BEM block:** `day-picker`
**Inputs:** `selected: number[]` (0=Mon … 6=Sun)
**Outputs:** `selectedChange: EventEmitter<number[]>`
**Behaviour:** Row of 7 circular buttons (Mon–Sun abbreviated). Each `--icon-container-md` sized, `--radius-full`. Active: `--color-primary` bg. Multi-select. Transition: `--duration-quick`.

---

### 9. `PlotTypeSelectorComponent`
**BEM block:** `plot-type-selector`
**Inputs:** `options: { value: string; label: string; icon: string }[]`, `selected: string`
**Outputs:** `selectedChange: EventEmitter<string>`
**Behaviour:** Row of large card buttons. Each: `IconContainerComponent` (size `xl`) + label (`type-label-lg`). Selected state: `--color-primary` border + `--color-surface-container-low` bg. `--radius-lg` cards.

---

### 10. `GardenGridSlotComponent`
**BEM block:** `garden-grid-slot`
**Inputs:** `crop?: { name: string; latinName: string; imageUrl: string; progress: number }`, `empty?: boolean`
**Outputs:** `slotClicked: EventEmitter<void>`
**Behaviour:** Circular crop image (hover: `scale(1.1)`, `--duration-standard`). Below: crop name (`type-label-lg`), latin name (`type-latin-name`), `ProgressBarComponent`. Empty variant: dashed outline circle + `add` icon.

---

### 11. `SpecimenCardComponent`
**BEM block:** `specimen-card`
**Inputs:** `crop: CropSummary`, `size: 'large'|'compact'` (default `'large'`)
**Behaviour:**
- **Large:** `--radius-xl` card, full crop image top, metadata rows (latin name, category chip, days-to-harvest stat). `--shadow-card`.
- **Compact:** Circular image + name + single stat. Used in bento grid.
- Hover (large): image rotates 3deg → 0 (`--duration-complex`).

---

### 12. `WeatherWidgetComponent`
**BEM block:** `weather-widget`
**Inputs:** `current: CurrentWeather`, `forecast: DayForecast[]`
**Behaviour:** Dark `--color-primary-container` background card (`--radius-xl`). Top: large weather icon + temperature + condition text. Bottom: horizontal scroll row of 7 day strips (day label + icon + high/low). Rain days marked with `water_drop` accent.

---

### 13. `InsightCardComponent`
**BEM block:** `insight-card`
**Inputs:** `insight: string`, `cta?: string`
**Outputs:** `ctaClicked: EventEmitter<void>`
**Behaviour:** Split panel. Left: italic insight quote (`type-body-lg`). Bottom: "Arboretum AI Assistant" identity row (avatar icon + label). Optional CTA button (`btn--inverse`). Dark `--color-primary-container` bg.

---

### 14. `HeroSectionComponent`
**BEM block:** `hero-section`
**Inputs:** `greeting: string`, `subtitle?: string`
**Behaviour:** Gradient background (`--color-primary` → `--color-primary-container`). Decorative blur circle (CSS, `--color-primary-fixed` at 20% opacity). `ng-content` for body. Display heading (`type-display`).

---

### 15. `TopAppBarComponent`
**BEM block:** `top-app-bar`
**Inputs:** `title?: string`
**Content slots:** `ng-content select="[leading]"` (logo), `ng-content select="[trailing]"` (avatar)
**Behaviour:** Fixed, glassmorphism (`@mixin glassmorphism`), `--shadow-nav` (inverted — downward). Title uses `type-nav-title`.

---

### 16. `BottomNavBarComponent`
**BEM block:** `bottom-nav-bar`
**Inputs:** `items: NavItem[]`, `activeRoute: string`
**Behaviour:** Fixed bottom, glassmorphism, rounded top corners (`--radius-2xl`), `--shadow-nav`. Active item: `--radius-full` pill bg (`--color-primary`), icon filled variant. Transition: `--duration-quick`.

---

## Barrel export

All new components added to `frontend/src/app/shared/index.ts`.
