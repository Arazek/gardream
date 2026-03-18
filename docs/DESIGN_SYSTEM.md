# GarDream — Design System

> Baseline design conventions for all UI work in this project.
> When building a new page or component, consult this document first.

---

## 1. Design Principles

| Principle | Meaning in practice |
|-----------|---------------------|
| **Organic & Grounded** | Rounded corners, soft shadows, earthy greens — never harsh or clinical |
| **Data at a glance** | Dashboard surfaces show numbers first; detail is one tap away |
| **Content-first** | Components exist to present information, not to decorate it |
| **Accessible by default** | WCAG AA contrast, keyboard nav, ARIA labels — never optional |
| **Predictable motion** | Transitions convey spatial meaning; decorative animation is avoided |

---

## 2. Color Palette

The garden feature uses the **Moss accent** palette derived from the app's existing theming system (`variables.scss`). All values are exposed as CSS custom properties so dark mode is handled automatically.

### Semantic tokens (garden feature)

| Token | Light value | Usage |
|-------|-------------|-------|
| `$garden-green` | `#4a7c59` | Primary actions, active states, headings |
| `$garden-green-light` | `#f0fdf4` | Page section backgrounds, hero tint |
| `$garden-green-muted` | `#e8f4ec` | Progress track backgrounds, muted surfaces |
| `$garden-border` | `#c8e6d0` | Card and section borders |
| `$garden-amber` | `#d97706` | Accent: warnings, overdue indicators |

These variables are defined locally in each feature SCSS file via:

```scss
@use 'theme/variables' as v;

$garden-green: #4a7c59;
// ...
```

### Status colors

Status is conveyed with both color **and** an icon or label (never color alone).

| Status | Color token | Badge variant |
|--------|------------|---------------|
| Growing | `--ion-color-warning` | `warning` |
| Ready | `--ion-color-success` | `success` |
| Overdue | `--ion-color-danger` | `danger` |
| Herb | `--ion-color-success` | `success` |
| Vegetable | `--ion-color-primary` | `primary` |
| Fruit | `--ion-color-danger` | `danger` |

### Crop color convention

Each crop is assigned a **single representative hex color** used consistently across:
- Grid cell background tint (color + `18` alpha)
- Progress bar fill
- Legend dot
- Hero icon background tint

These colors are data, not theme tokens. They live in the crop data model (`color: string`).

---

## 3. Typography

The app uses **Source Sans 3** (declared in `src/theme/variables.scss`).

### Type scale

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 26–28 px | 700 | Hero headlines |
| Title | 22 px | 700 | Page/section headings |
| Subtitle | 16–18 px | 600 | Card headings, primary labels |
| Body | 14–15 px | 400 | Descriptions, list content |
| Caption | 11–12 px | 500–600 | Metadata, units, labels |
| Micro | 10–11 px | 700 | Grid cell abbreviations, badges |

### Rules
- Body line-height: `1.6`
- Heading letter-spacing: `-0.01em` to `-0.02em` for polish
- Caption letter-spacing: `+0.06em` when all-caps
- Minimum 16 px on mobile to prevent iOS auto-zoom
- Never use emojis as icons; use Ionicons SVG throughout

---

## 4. Spacing System

Based on a **4 pt base unit** (8 dp grid for touch targets).

| Token | Value | Usage |
|-------|-------|-------|
| `2xs` | 4 px | Inner chip/badge padding |
| `xs` | 8 px | Gap between touch targets |
| `sm` | 12 px | Card inner gap |
| `md` | 16 px | Standard section padding, card padding |
| `lg` | 24 px | Section top padding |
| `xl` | 32 px | Page-level vertical rhythm |
| `2xl` | 48 px | Hero vertical padding |

Page horizontal padding is always **16 px**. Section content is never full-bleed unless intentional (e.g., hero banner).

---

## 5. Elevation & Borders

| Level | Usage | Shadow |
|-------|-------|--------|
| 0 – Flat | In-page text elements | none |
| 1 – Card | `app-card` default | `0 1px 3px rgba(0,0,0,.08)` |
| 2 – Raised | Active/focused card | `0 4px 12px rgba(0,0,0,.10)` |
| 3 – Modal | Bottom sheets, dialogs | `0 8px 24px rgba(0,0,0,.14)` |
| 4 – Overlay | FABs, tooltips | `0 12px 32px rgba(0,0,0,.18)` |

Border radius scale:

| Element | Radius |
|---------|--------|
| Chips, badges, pills | `100 px` |
| Buttons | `10–12 px` |
| Cards | `16 px` |
| Hero / featured card | `20 px` |
| Grid cells | `8 px` |
| Icon wraps | `12–16 px` |

---

## 6. Component Conventions

### Using shared components

Always prefer components from `src/app/shared` before creating new ones.

| Need | Component |
|------|-----------|
| Page title bar | `<app-page-header>` |
| Grouping with title | `<app-section>` |
| Container surface | `<app-card>` |
| KPI numbers | `<app-stat-card>` |
| Status label | `<app-badge>` |
| Filter / selection pill | `<app-chip [selected]>` |
| No-data state | `<app-empty-state>` |
| Skeleton loading | `<app-loading-skeleton>` |
| Toast messages | `ToastService` |
| Destructive confirm | `ConfirmDialogService` |

### app-page-header

```html
<!-- Top-level page (tab root) -->
<app-page-header title="My Garden" />

<!-- Child page (with back button) -->
<app-page-header title="Crop Detail" [showBack]="true" backHref="/tabs/garden" />

<!-- With action button in end slot -->
<app-page-header title="Builder">
  <ion-button slot="end" fill="clear">Save</ion-button>
</app-page-header>
```

### app-section

```html
<app-section title="Upcoming Harvests" seeAllLabel="View all" (seeAll)="onSeeAll()">
  <!-- content -->
</app-section>
```

- Always add `16px` horizontal padding inside section content.
- Use `seeAllLabel` + `(seeAll)` for navigable sections; omit for static ones.

### Progress bars

Progress bars are custom HTML/CSS (no library). Use the pattern:

```html
<div class="progress-track">
  <div class="progress-fill" [style.width.%]="percent" [style.background]="color"></div>
</div>
```

```scss
.progress-track {
  height: 6–8px;
  background: $garden-green-muted;
  border-radius: 100px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 300–600ms ease-out;
}
```

---

## 7. Icons

All icons come from **Ionicons** (`ionicons/icons`).

- Register each icon with `addIcons({ ... })` in the component constructor.
- Use the `-outline` variant for navigation and supporting icons.
- Use the filled variant for primary/active states only.
- Never use emoji as icons.

### Garden feature icon vocabulary

| Concept | Icon name |
|---------|-----------|
| Crop / plant | `leaf-outline` / `leaf` |
| Garden grid | `grid-outline` |
| Harvest date | `calendar-outline` |
| Time remaining | `time-outline` |
| Watering | `water-outline` |
| Sunlight | `sunny-outline` |
| Temperature | `thermometer-outline` |
| Builder tool | `construct-outline` |
| Add new | `add-outline` / `add-circle-outline` |
| Delete / clear | `trash-outline` |
| Growing stage | `flower-outline` |
| Ready | `checkmark-circle-outline` |
| Warning | `alert-circle-outline` |

---

## 8. Grid & Responsive Layout

Breakpoints (from `variables.scss`):

| Name | Width |
|------|-------|
| Mobile | ≤ 767 px |
| Tablet | 768–1023 px |
| Desktop | ≥ 1024 px |

Usage in SCSS:

```scss
@include v.mobile { ... }
@include v.tablet-up { ... }
@include v.desktop-up { ... }
```

### Column patterns

| Use case | Mobile | Tablet+ |
|----------|--------|---------|
| Stat cards | 3 cols | 3–4 cols |
| Planter overview | 2 cols | 3–4 cols |
| Tech info grid | 2 cols | 3 cols |
| Harvest list | 1 col | 1 col |

### Touch targets
- Minimum interactive size: **44 × 44 px** (iOS), **48 × 48 dp** (Android/MD)
- Grid cells: `min-width: 44px; min-height: 44px; aspect-ratio: 1`
- Extend `hitSlop` or padding when visual element is smaller than min size

---

## 9. Animation & Motion

All transitions use `transform` and `opacity` only — never `width`, `height`, `top`, or `left`.

| Type | Duration | Easing |
|------|----------|--------|
| Micro-interaction (press, hover) | 100–150 ms | `ease` |
| State change (tab select, chip toggle) | 150 ms | `ease` |
| Page entrance | 200–300 ms | `ease-out` |
| Progress bar fill | 300–600 ms | `ease-out` |

```scss
transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
```

Respect `prefers-reduced-motion`:

```scss
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

Scale feedback on interactive cards/cells: `transform: scale(0.97)` on `:active`.

---

## 10. SCSS Conventions

### File structure

```
feature-name.page.scss
├── // ─── Semantic tokens ─────
├── $garden-green: #4a7c59;
│
├── // ─── Top-level container ─
├── .feature-content { ... }
│
├── // ─── Hero / header ────────
├── .feature-hero { ... }
│
└── // ─── [Component blocks] ──
    .card-name { ... }
    .card-name__element { ... }
    .card-name--modifier { ... }
```

### Naming

- BEM methodology: `.block__element--modifier`
- Feature prefix for top-level containers: `.garden-*`, `.dashboard-*`, `.builder-*`
- No global class pollution — all styles are scoped to the component file

### Do / Don't

| Do | Don't |
|----|-------|
| Use `var(--ion-*)` tokens for text and background | Hardcode `#ffffff` or `#000000` for text |
| Use `$garden-*` variables defined at the top | Repeat hex values inline |
| Use `@use 'theme/variables' as v` for breakpoint mixins | Use raw `@media` queries directly |
| Use `gap` for spacing between flex/grid children | Use `margin-right` / `margin-bottom` on children |
| Define `[style.background]="crop.color"` for data-driven colors | Hard-code crop colors in SCSS |

---

## 11. Data Model Conventions

### Crop object shape

```typescript
interface CropData {
  id: string;                              // Stable identifier
  name: string;                            // Display name
  scientificName: string;                  // Binomial nomenclature
  category: 'vegetable' | 'herb' | 'fruit';
  color: string;                           // Hex — used for visual identity
  daysToGerminate: number;
  daysToHarvest: number;
  wateringIntervalDays: number;
  sunlight: 'full' | 'partial' | 'shade';
  spacingCm: number;
  depthCm: number;
  minTempC: number;
  maxTempC: number;
  companionPlants: string[];
  avoidPlants: string[];
  tips: string[];
  plantedDate?: Date;                      // Present only if planted
}
```

### Planter grid shape

```typescript
interface Planter {
  id: string;
  name: string;
  rows: number;
  cols: number;
  grid: (string | null)[][];  // cropId or null per cell
}
```

Grid access pattern: `grid[rowIndex][colIndex]`.

---

## 12. Accessibility Checklist

Before delivering any page or component, verify:

- [ ] Text contrast ≥ 4.5:1 (body), ≥ 3:1 (large text / icons)
- [ ] Every interactive element has an `aria-label` or visible text label
- [ ] Focus rings are visible (do not override `:focus` outline to `none`)
- [ ] Tab order follows visual reading order
- [ ] Status is conveyed by icon + text, not color alone
- [ ] Touch targets ≥ 44 × 44 px
- [ ] Empty states have a message and a suggested action
- [ ] Loading states use `<app-loading-skeleton>` (not a blank layout)
- [ ] Destructive actions use `ConfirmDialogService` before executing

---

## 13. File Location Reference

```
frontend/src/app/
├── features/
│   └── garden/
│       ├── garden.routes.ts
│       └── pages/
│           ├── garden-dashboard/   ← /tabs/garden
│           ├── garden-builder/     ← /tabs/garden/builder
│           └── crop-detail/        ← /tabs/garden/crop/:id
├── shared/
│   ├── components/                 ← Reusable UI components
│   └── index.ts                    ← Barrel exports
└── theme/
    └── variables.scss              ← Color tokens, breakpoints, accent mixins
```
