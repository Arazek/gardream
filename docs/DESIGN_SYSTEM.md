# Design System — The Digital Arboretum

## 1. Design Philosophy

**"The Botanical Journal"** — an editorial, heirloom aesthetic inspired by the intentionality of
a physical specimen journal. High-contrast serif typography against organic mineral surfaces.
Circular geometry throughout. Depth created by layering surface tiers, never by hard borders.

### Core principles

- **No pixel values anywhere.** All sizing, spacing, typography, radius, and shadow values must
  be expressed in `rem`. Base font size is `16px` (`1rem = 16px`), set on `<html>`. Never
  override the base font size.
- **No 1px solid borders for sectioning.** Section boundaries are defined by background color
  shifts between adjacent surface tiers. Borders are permitted only as ghost outlines on
  interactive elements (buttons, inputs, empty-state cards) at low opacity.
- **No pure black.** Always use `--color-on-surface` (`#1b1c1a`) for text.
- **Circular mandate.** Every icon, avatar, and primary action element must live inside a
  `border-radius: 9999px` container. Square or slightly-rounded icon containers are not allowed.
- **Intentional asymmetry.** Layouts use unequal column splits (e.g. 8/4, 5/7) rather than
  rigid full-width grids. Content breathes.

---

## 2. Color Tokens

All tokens are defined as CSS custom properties on `:root` in `src/theme/variables.scss`.
Never hard-code hex values in component SCSS — always reference a token.

This palette is a Material 3 forest-toned scheme. Dark mode tokens are included for future use
but the MVP ships light-mode only.

```scss
// src/theme/variables.scss

:root {
  // --- Primary ---
  --color-primary:                #163526;
  --color-on-primary:             #ffffff;
  --color-primary-container:      #2d4c3b;
  --color-on-primary-container:   #99bca6;
  --color-primary-fixed:          #c7ebd4;
  --color-primary-fixed-dim:      #accfb8;
  --color-on-primary-fixed:       #012113;
  --color-on-primary-fixed-variant: #2e4d3c;
  --color-inverse-primary:        #accfb8;

  // --- Secondary ---
  --color-secondary:              #556159;
  --color-on-secondary:           #ffffff;
  --color-secondary-container:    #d5e3d8;
  --color-on-secondary-container: #59665d;
  --color-secondary-fixed:        #d8e6db;
  --color-secondary-fixed-dim:    #bccabf;
  --color-on-secondary-fixed:     #121e17;
  --color-on-secondary-fixed-variant: #3d4a41;

  // --- Tertiary (reserved / accent) ---
  --color-tertiary:               #482527;
  --color-on-tertiary:            #ffffff;
  --color-tertiary-container:     #623b3d;
  --color-on-tertiary-container:  #dba6a8;
  --color-tertiary-fixed:         #ffdada;
  --color-tertiary-fixed-dim:     #f0b9bb;
  --color-on-tertiary-fixed:      #311214;
  --color-on-tertiary-fixed-variant: #633c3e;

  // --- Surface hierarchy (light → dark = lowest → highest) ---
  --color-surface:                  #faf9f5;  // app background
  --color-surface-bright:           #faf9f5;
  --color-surface-dim:              #dbdad6;
  --color-surface-container-lowest: #ffffff;  // lifted cards
  --color-surface-container-low:    #f4f4f0;  // secondary sections
  --color-surface-container:        #efeeea;  // intermediate
  --color-surface-container-high:   #e9e8e4;  // hover targets
  --color-surface-container-highest:#e3e2df;  // progress tracks, dividers
  --color-surface-tint:             #466553;
  --color-surface-variant:          #e3e2df;
  --color-inverse-surface:          #2f312e;
  --color-inverse-on-surface:       #f2f1ed;

  // --- On-surface ---
  --color-on-surface:               #1b1c1a;  // primary text
  --color-on-surface-variant:       #424843;  // secondary text
  --color-on-background:            #1b1c1a;
  --color-background:               #faf9f5;

  // --- Outline ---
  --color-outline:                  #727973;
  --color-outline-variant:          #c2c8c1;  // ghost borders (use at low opacity)

  // --- Error ---
  --color-error:                    #ba1a1a;
  --color-on-error:                 #ffffff;
  --color-error-container:          #ffdad6;
  --color-on-error-container:       #93000a;
}
```

### Surface hierarchy usage guide

| Token | Use case |
|---|---|
| `--color-surface` | App background — body, page root |
| `--color-surface-container-low` | Secondary content sections, form wrappers |
| `--color-surface-container` | Intermediate sections, active overlays |
| `--color-surface-container-high` | Hover state background on interactive cards |
| `--color-surface-container-highest` | Progress bar tracks, very subtle dividers |
| `--color-surface-container-lowest` | Actionable cards — "lifted" above the section they sit on |

---

## 3. Typography

All font sizes and line heights are in `rem`. Base: `1rem = 16px`.

```scss
// src/theme/variables.scss

:root {
  --font-headline: 'Noto Serif', Georgia, serif;
  --font-body:     'Manrope', system-ui, sans-serif;
  --font-label:    'Manrope', system-ui, sans-serif;
}
```

### Type scale

| Role | Font | Size | Line Height | Weight | Transform |
|---|---|---|---|---|---|
| `display` | headline | `2.5rem` | `1.15` | 700 | — |
| `heading-1` | headline | `2rem` | `1.2` | 700 | — |
| `heading-2` | headline | `1.75rem` | `1.25` | 700 | — |
| `heading-3` | headline | `1.5rem` | `1.3` | 600 | — |
| `heading-4` | headline | `1.25rem` | `1.35` | 600 | — |
| `nav-title` | headline | `1.125rem` | `1` | 600 | — |
| `body-lg` | body | `1rem` | `1.6` | 400 | — |
| `body` | body | `0.875rem` | `1.6` | 400 | — |
| `body-sm` | body | `0.8125rem` | `1.5` | 400 | — |
| `label-lg` | label | `0.875rem` | `1` | 600 | — |
| `label` | label | `0.75rem` | `1` | 600–700 | uppercase + tracked |
| `label-sm` | label | `0.625rem` | `1` | 700 | uppercase + tracked |
| `latin-name` | body | `0.6875rem` | `1` | 400 | uppercase, 0.05em tracking |

### Typography SCSS mixins

```scss
// Usage: @include type-display;
@mixin type-display {
  font-family: var(--font-headline);
  font-size: 2.5rem;
  line-height: 1.15;
  font-weight: 700;
}

@mixin type-heading-1 {
  font-family: var(--font-headline);
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 700;
}

@mixin type-heading-2 {
  font-family: var(--font-headline);
  font-size: 1.75rem;
  line-height: 1.25;
  font-weight: 700;
}

@mixin type-heading-3 {
  font-family: var(--font-headline);
  font-size: 1.5rem;
  line-height: 1.3;
  font-weight: 600;
}

@mixin type-heading-4 {
  font-family: var(--font-headline);
  font-size: 1.25rem;
  line-height: 1.35;
  font-weight: 600;
}

@mixin type-nav-title {
  font-family: var(--font-headline);
  font-size: 1.125rem;
  line-height: 1;
  font-weight: 600;
}

@mixin type-body-lg {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  font-weight: 400;
}

@mixin type-body {
  font-family: var(--font-body);
  font-size: 0.875rem;
  line-height: 1.6;
  font-weight: 400;
}

@mixin type-body-sm {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  line-height: 1.5;
  font-weight: 400;
}

@mixin type-label-lg {
  font-family: var(--font-label);
  font-size: 0.875rem;
  line-height: 1;
  font-weight: 600;
}

@mixin type-label {
  font-family: var(--font-label);
  font-size: 0.75rem;
  line-height: 1;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

@mixin type-label-sm {
  font-family: var(--font-label);
  font-size: 0.625rem;
  line-height: 1;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

@mixin type-latin-name {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  line-height: 1;
  font-weight: 400;
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 4. Spacing Scale

All spacing values are in `rem`. Derived from a base-4 scale (`0.25rem` = 4px).

```scss
:root {
  --space-1:  0.25rem;   // 4px  — micro gaps (icon padding)
  --space-2:  0.5rem;    // 8px  — tight gaps
  --space-3:  0.75rem;   // 12px — compact gaps
  --space-4:  1rem;      // 16px — base unit (card padding sm)
  --space-5:  1.25rem;   // 20px
  --space-6:  1.5rem;    // 24px — standard card padding
  --space-8:  2rem;      // 32px — section gap
  --space-10: 2.5rem;    // 40px — large section gap
  --space-12: 3rem;      // 48px — hero padding
  --space-16: 4rem;      // 64px — between major page sections
  --space-24: 6rem;      // 96px — top padding for fixed nav offset
}
```

---

## 5. Border Radius Scale

All values in `rem`.

```scss
:root {
  --radius-sm:   0.5rem;    // 8px  — inner elements, small tags
  --radius-md:   1rem;      // 16px — inputs, section cards (default)
  --radius-lg:   1.5rem;    // 24px — content cards
  --radius-xl:   2rem;      // 32px — large cards
  --radius-2xl:  3rem;      // 48px — hero panels, bottom nav
  --radius-full: 9999px;    // circles — all icons, avatars, buttons, nav pills
}
```

### Radius usage guide

| Token | Use case |
|---|---|
| `--radius-sm` | Small tags, compact chips |
| `--radius-md` | Input fields, form section wrappers |
| `--radius-lg` | Standard content cards |
| `--radius-xl` | Large feature cards, image containers |
| `--radius-2xl` | Bottom nav top corners, hero panels |
| `--radius-full` | Icon containers, avatars, all buttons, day picker, nav pills |

---

## 6. Elevation & Shadow

Depth is achieved through surface tier layering, not shadows. Reserve shadows for floating
elements only.

```scss
:root {
  // Lifted card (e.g. surface-container-lowest on surface-container-low)
  --shadow-card: 0 0.125rem 0.5rem rgba(27, 28, 26, 0.06);

  // Floating panels (dropdowns, expanded menus)
  --shadow-float: 0 0.25rem 1.5rem rgba(27, 28, 26, 0.06);

  // Bottom nav bar (upward shadow)
  --shadow-nav: 0 -0.25rem 1.5rem rgba(27, 28, 26, 0.06);

  // FAB
  --shadow-fab: 0 0.25rem 1rem rgba(22, 53, 38, 0.25);
}
```

### Glassmorphism (nav bars)

```scss
// Applied to TopAppBar and BottomNavBar
background: rgba(250, 249, 245, 0.85); // --color-surface at 85%
backdrop-filter: blur(0.75rem);         // 12px
-webkit-backdrop-filter: blur(0.75rem);
```

---

## 7. Icon System

All icons use **Material Symbols Outlined** variable font.

```scss
:root {
  --icon-size-sm:  1rem;      // 16px — inline, labels
  --icon-size-md:  1.25rem;   // 20px — compact rows
  --icon-size-base: 1.5rem;   // 24px — standard (default)
  --icon-size-lg:  2rem;      // 32px — section icons
  --icon-size-xl:  2.5rem;    // 40px — hero / decorative
  --icon-size-2xl: 6.25rem;   // 100px — large decorative (background panels)
}

// Standard icon rendering
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  font-size: var(--icon-size-base);
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

// Filled variant (active states)
.material-symbols-outlined--filled {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

### Icon container sizes

| Size token | Rem | Use case |
|---|---|---|
| `--icon-container-sm` | `2rem` | Small inline containers (stats, taxonomy badges) |
| `--icon-container-md` | `2.5rem` | Nav icons, app bar logo/avatar |
| `--icon-container-lg` | `3rem` | Task card icons, form section icons |
| `--icon-container-xl` | `4rem` | Plot type selector, garden setup |

All icon containers are `border-radius: var(--radius-full)`.

---

## 8. Component Inventory

Components are split between `shared/` (reusable across 2+ features, no feature deps) and
`features/<name>/components/` (feature-specific).

### Shared components (`frontend/src/app/shared/components/`)

These are pure UI primitives — they receive data via `@Input()` and emit events via `@Output()`.
They have zero knowledge of store, routing, or feature services.

| Component | BEM block | Description |
|---|---|---|
| `TopAppBarComponent` | `top-app-bar` | Fixed glassmorphism nav. Logo slot (left), title (center), avatar slot (right). |
| `BottomNavBarComponent` | `bottom-nav-bar` | Fixed glassmorphism nav, rounded-t-[--radius-2xl]. 4 nav items with active pill state. |
| `TaskCardComponent` | `task-card` | Icon circle + headline title + body description + label timestamp. Hover surface shift. |
| `TaskListItemComponent` | `task-list-item` | Horizontal row: icon circle, title + subtitle, circular checkbox. |
| `ProgressBarComponent` | `progress-bar` | Thin `0.375rem` track, primary fill, rounded-full. Accepts `[value]` 0–100. |
| `StatChipComponent` | `stat-chip` | Horizontal pill: small icon circle + stacked label + value. Used for plot health/hydration. |
| `FilterChipComponent` | `filter-chip` | Rounded-full pill, active/inactive states. Used for encyclopedia filters. |
| `SearchBarComponent` | `search-bar` | Rounded-md input, icon prefix, surface-container-low bg, focus ring. |
| `WeatherWidgetComponent` | `weather-widget` | Dark primary-container bg card. Current conditions + 7-day forecast scroll row. |
| `InsightCardComponent` | `insight-card` | Split panel: italic quote + AI identity row / prediction placeholder. |
| `GardenGridSlotComponent` | `garden-grid-slot` | Circular plant image + name + latin name + progress bar. Empty-slot variant. |
| `SpecimenCardComponent` | `specimen-card` | Two sizes via `[size]="'large' \| 'compact'"`. Large: image + metadata rows. Compact: circle image + stat grid. |
| `DayPickerComponent` | `day-picker` | Row of 7 circular day-of-week buttons. Multi-select with active state. |
| `PlotTypeSelectorComponent` | `plot-type-selector` | Large card button with icon circle + label. Selected / unselected state. |
| `HeroSectionComponent` | `hero-section` | Gradient bg (`primary` → `primary-container`), decorative blur circle, `ng-content` body. |
| `IconContainerComponent` | `icon-container` | Circular container for a Material icon. Accepts `[size]`, `[color]` variant props. |

### Feature components (created per feature, not in shared)

| Feature | Component | Description |
|---|---|---|
| `home` | `WelcomeHeroComponent` | Greeting label + display headline. |
| `home` | `PlotCardComponent` | Asymmetric plot preview: image + info panel + progress + buttons. Alternates layout direction. |
| `home` | `GardenIntelligencePanelComponent` | Dark `primary-container` card with AI insight text + CTA. |
| `plot` | `GardenGridComponent` | Responsive CSS grid of `GardenGridSlot` cells. Accepts plot dimensions. |
| `plot` | `PlotHeaderComponent` | Plot name, subtitle, toggle (Ground / Raised Bed), stat chips row. |
| `plot` | `HarvestInsightRowComponent` | 2-row list of info cards (next harvest, pest alert) with icon + text + link. |
| `setup` | `PlotSetupFormComponent` | Orchestrates dimensions fields, type selector, subdivision sliders, day picker, layout preview. |
| `setup` | `LayoutPreviewComponent` | Aspect-ratio grid canvas with slot overlays. Reflects setup form state. |
| `encyclopedia` | `SpecimenGridComponent` | Bento asymmetric grid of `SpecimenCard` entries. |
| `encyclopedia` | `EncyclopediaHeroComponent` | Full-width gradient hero for the encyclopedia page. |
| `soil` | `SoilMixCardComponent` | Article card: mix name, description, composition `ProgressBar` rows, category badge. |
| `soil` | `SubstrateSciencePanelComponent` | Asymmetric panel: circular image + three-pillars checklist text. |
| `calendar` | `CalendarGridComponent` | Month grid (7-col), today indicator (primary circle), task dot markers. |
| `calendar` | `DailyTaskListComponent` | Section with heading + list of `TaskListItem`. Grouped by date. |

---

## 9. Button Patterns

Buttons always use `border-radius: var(--radius-full)`. No square or lightly-rounded buttons.

```scss
// Primary — filled
.btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  padding: 0.625rem 1.5rem;    // 10px 24px
  font-family: var(--font-label);
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  border: none;

  &:hover { opacity: 0.9; }
  &:active { transform: scale(0.98); }
}

// Ghost — outline only
.btn--ghost {
  background: transparent;
  color: var(--color-primary);
  padding: 0.625rem 1.5rem;
  font-family: var(--font-label);
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  border: 0.0625rem solid rgba(194, 200, 193, 0.2); // outline-variant at 20%

  &:hover { background: var(--color-surface-container-low); }
}

// Inverse — white on dark bg (used inside dark panels)
.btn--inverse {
  background: var(--color-surface-container-lowest);
  color: var(--color-primary);
  padding: 0.625rem 1.5rem;
  font-family: var(--font-label);
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  border: none;

  &:hover { background: var(--color-surface-container-low); }
}
```

---

## 10. Form Patterns

```scss
// Field wrapper
.form-field {
  background: var(--color-surface-container-low);
  border-radius: var(--radius-md);
  padding: var(--space-6);

  label {
    @include type-label-sm;
    color: var(--color-secondary);
    display: block;
    margin-bottom: var(--space-4);
  }

  input,
  select,
  textarea {
    width: 100%;
    background: var(--color-surface-container-lowest);
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    font-family: var(--font-body);
    font-size: 1rem;
    color: var(--color-on-surface);
    outline: none;

    &:focus {
      box-shadow: 0 0 0 0.125rem rgba(22, 53, 38, 0.2); // primary at 20%
    }
  }
}

// Range slider
.range-slider {
  appearance: none;
  height: 0.375rem;
  background: var(--color-outline-variant);
  border-radius: var(--radius-full);
  accent-color: var(--color-primary);
  cursor: pointer;
}
```

---

## 11. Implementation Notes

### Angular / Ionic integration

- All CSS custom properties are defined on `:root` in `src/theme/variables.scss`.
- This file is imported via `src/global.scss` — do not import it inside component SCSS files.
- Ionic component overrides (e.g. `ion-content`, `ion-tab-bar`) use the Ionic CSS variable
  bridge where possible. When Ionic variables don't reach into shadow DOM, use `::part()` rules
  in `src/global.scss`.
- Component SCSS files use BEM class naming against the custom property tokens above. They do
  not hard-code hex values, rem values, or pixel values directly — always use a token or a
  spacing variable.
- All typography in component templates goes through the `@include type-*` mixins. Do not set
  `font-size` or `font-family` directly in a component — always via a mixin or a utility class.

### Fonts

Load both fonts in `src/index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
```

Note: fonts are injected via `src/index.html`, not imported in SCSS (Angular builder handles
global styles via the `styles` array in `angular.json`).

### Dark mode

Dark mode is out of MVP scope. The color tokens defined above are all light-mode values.
When dark mode is added, override the tokens inside `body.dark {}` in `variables.scss`,
following the same pattern as the existing `ThemeService` and `@mixin dark-base`.

### No Tailwind

Tailwind is not used in this project. It was evaluated and rejected due to Ionic conflicts.
All utility-like patterns (spacing, color) are implemented as SCSS custom properties + BEM
component styles. Do not introduce Tailwind.

---

## 12. UX Heuristics & Design Principles

These rules govern decision-making at all levels — layout, copy, interaction, and component
design. They exist alongside Nielsen's 10 heuristics but are adapted to this product.

### Core heuristics

| Heuristic | Application in this product |
|---|---|
| **Visibility of system status** | Always show task completion state, growth progress %, and plot health. Never leave the user wondering what just happened. |
| **Match the real world** | Use gardening vocabulary throughout. "Specimens" not "plants", "Plot" not "garden", "Substrate" not "soil mix", "Harvest window" not "ready to pick". |
| **User control & freedom** | Allow editing any task or plot detail. Support undo for destructive actions. Never trap the user in a flow with no back. |
| **Consistency & standards** | All section headings use Noto Serif. All icons live in circular containers. All CTA buttons are `radius-full`. No exceptions without double confirmation. |
| **Error prevention** | Disable submit buttons when forms are invalid. Confirm before deleting a plot or specimen. Surface constraints before the user hits them. |
| **Recognition over recall** | Show crop images alongside names everywhere. Show weather condition icons, not just text. Surface the most relevant task first — do not make the user search. |
| **Flexibility & efficiency** | Entire task cards are tappable, not just the checkbox. Quick-action cards on home reduce steps to common flows. |
| **Aesthetic & minimalist design** | Never fill space for the sake of filling it. Breathing room is a feature. Remove an element before adding a new one. |
| **Help users recover from errors** | Error states are specific ("Width must be between 0.5 and 20 ft") not generic ("Something went wrong"). Always pair with an action. |

### Do's and Don'ts

| Do | Don't |
|---|---|
| Use intentional asymmetry — unequal columns, bleeding images | Center everything on a rigid 12-col grid |
| Use circular containers for all action icons — they are "wax seals" | Use square or lightly-rounded icon containers |
| Define section boundaries through background color shifts | Draw 1px divider lines between sections |
| Use `--color-on-surface` (#1b1c1a) for all body text | Use pure black (#000000) anywhere |
| Write labels in ALL CAPS + `letter-spacing: 0.08em` | Use sentence-case for metadata labels |
| Apply Noto Serif to all display and heading text | Mix serif and sans-serif in the same heading hierarchy |
| Pair every icon with an `aria-label` or visible text | Use icon-only controls without accessible labels |
| Surface crop progress via a thin progress bar | Use numeric-only percentages without a visual bar |
| Use botanical/scientific language consistently | Mix casual and scientific terms in the same view |
| Give AI insights an "Arboretum AI Assistant" identity line | Present AI insights as anonymous system text |

---

## 13. Semantic / Status Colors

In addition to the brand palette, the following semantic colors are available for feedback states.
These are defined on `:root` in `variables.scss` alongside the brand tokens.

```scss
:root {
  // --- Success ---
  --color-success:              #1b6e3c;
  --color-on-success:           #ffffff;
  --color-success-container:    #d4f0e0;
  --color-on-success-container: #0a3d20;

  // --- Warning ---
  --color-warning:              #7a4f00;
  --color-on-warning:           #ffffff;
  --color-warning-container:    #ffe0b2;
  --color-on-warning-container: #4a2f00;

  // --- Error (already in brand palette, aliased here) ---
  --color-error:                #ba1a1a;
  --color-on-error:             #ffffff;
  --color-error-container:      #ffdad6;
  --color-on-error-container:   #93000a;

  // --- Info ---
  --color-info:                 #1a5c7a;
  --color-on-info:              #ffffff;
  --color-info-container:       #cce8f4;
  --color-on-info-container:    #0a3347;
}
```

### Semantic color usage guide

| Token | When to use |
|---|---|
| `success` / `success-container` | Task completed, harvest ready, healthy plot status |
| `warning` / `warning-container` | Hydration low, pest alert, schedule overdue |
| `error` / `error-container` | Form validation failure, API error, destructive confirmation |
| `info` / `info-container` | AI insight callouts, weather tips, informational banners |

**Rule:** Never use semantic colors for decoration. Only use them when the state they represent
(success, warning, error, info) is genuinely present.

---

## 14. Accessibility Contrast Guidance

Target: **WCAG 2.1 AA** for all production screens.
AA requires: 4.5:1 for normal text, 3:1 for large text (≥ `1.5rem` regular or ≥ `1.125rem` bold).

### Verified contrast pairs

| Foreground | Background | Ratio | Pass level | Use |
|---|---|---|---|---|
| `--color-on-surface` #1b1c1a | `--color-surface` #faf9f5 | ~18:1 | AAA | All body text |
| `--color-primary` #163526 | `--color-surface` #faf9f5 | ~9.5:1 | AAA | Headings, labels |
| `--color-primary` #163526 | `--color-surface-container-low` #f4f4f0 | ~8.8:1 | AAA | Card headings |
| `--color-on-primary` #ffffff | `--color-primary` #163526 | ~9.5:1 | AAA | Filled button text |
| `--color-on-surface-variant` #424843 | `--color-surface` #faf9f5 | ~8.2:1 | AAA | Secondary text |
| `--color-on-surface-variant` #424843 | `--color-surface-container-low` #f4f4f0 | ~7.5:1 | AAA | Card body text |
| `--color-secondary` #556159 | `--color-surface` #faf9f5 | ~5.7:1 | AA | Labels, metadata |
| `--color-secondary` #556159 | `--color-surface-container-low` #f4f4f0 | ~5.2:1 | AA | Labels on cards |
| `--color-outline` #727973 | `--color-surface` #faf9f5 | ~4.8:1 | AA | Placeholder text (≥ `0.875rem` only) |
| `--color-primary` #163526 | `--color-secondary-container` #d5e3d8 | ~7.5:1 | AAA | Icons/text on mint bg |
| `--color-on-primary-container` #99bca6 | `--color-primary-container` #2d4c3b | ~4.5:1 | AA | Use at ≥ `1rem` only |

### Pairs to avoid

| Combination | Issue |
|---|---|
| `--color-outline-variant` on `--color-surface` | ~2.2:1 — fails AA. Use only for decorative borders, never text. |
| `--color-secondary-container` text on `--color-surface` | Too low contrast for text use. |
| Any status container color as a text color on white | Container variants are backgrounds, not text colors. |

### Minimum touch target

All interactive elements must meet a minimum touch target of `2.75rem × 2.75rem` (44×44px).
This applies to icon-only buttons, checkboxes, and nav items. If the visual size is smaller,
use padding or an invisible hit area overlay to meet the minimum.

---

## 15. Grid System & Breakpoints

The layout system is mobile-first. All grid behavior defaults to single-column and expands
upward.

### Breakpoints

```scss
:root {
  --breakpoint-sm: 40rem;   // 640px  — large phone / small tablet
  --breakpoint-md: 48rem;   // 768px  — tablet portrait
  --breakpoint-lg: 64rem;   // 1024px — tablet landscape / small desktop
  --breakpoint-xl: 80rem;   // 1280px — standard desktop
}
```

SCSS usage (mobile-first):

```scss
// Mobile (default) → tablet → desktop
.my-block {
  padding: var(--space-4);

  @media (min-width: 48rem) {
    padding: var(--space-6);
  }

  @media (min-width: 64rem) {
    padding: var(--space-8);
  }
}
```

### Page layout

```scss
.page-container {
  max-width: 80rem;         // 1280px max content width
  margin-inline: auto;
  padding-inline: var(--space-6);   // 1.5rem side gutter (mobile)

  @media (min-width: 48rem) {
    padding-inline: var(--space-8); // 2rem side gutter (tablet+)
  }
}
```

### Column grid

Used for complex feature layouts (encyclopedia bento, plot detail asymmetric sections).

```scss
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

// Standard span helpers (used in feature components)
// .col-span-4  → 4 of 12 columns
// .col-span-5  → 5 of 12 columns
// .col-span-7  → 7 of 12 columns
// .col-span-8  → 8 of 12 columns
// .col-span-12 → full width
```

### Standard layout patterns

| Layout | Mobile | Tablet (≥48rem) | Desktop (≥64rem) |
|---|---|---|---|
| Task cards | 1 col | 2 col | 3 col |
| Plot cards | 1 col stacked | Asymmetric (image / info) | Asymmetric alternating |
| Encyclopedia bento | 1 col | 12-col (8+4) | 12-col (8+4) |
| Garden grid slots | 2 col | 4 col | 6 col |
| Soil mix cards | 1 col | 2 col | 3 col |
| Form sections | 1 col | 3 col (dimensions) | 3 col |

### Safe area (Capacitor / notch)

```scss
// Applied to TopAppBar and BottomNavBar in global.scss
.top-app-bar {
  padding-top: env(safe-area-inset-top);
}

.bottom-nav-bar {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 16. Component Specifications

Each shared component is specified below with: purpose, anatomy, variants, states, and
usage guidance.

---

### `IconContainer`

**Purpose:** The fundamental circular wrapper used around every icon in the system.
All other components that display an icon use this internally.

**Anatomy:**
```
[outer circle: border-radius: full, bg: variant color]
  └── [Material Symbol icon: size variant]
```

**Variants:**

| Variant | Background | Icon color | Use |
|---|---|---|---|
| `secondary` (default) | `secondary-container` at 40% opacity | `primary` | Most icons — task cards, nav, form |
| `primary` | `primary-container` | `on-primary` | Dark panel CTAs |
| `surface` | `surface-container-lowest` | `secondary` | Subtle / inline icons |
| `ghost` | transparent + `outline-variant` 20% border | `secondary` | Empty states, inactive |

**Sizes:**

| Size | Container rem | Icon rem |
|---|---|---|
| `sm` | `2rem` | `1rem` |
| `md` | `2.5rem` | `1.25rem` |
| `lg` (default) | `3rem` | `1.5rem` |
| `xl` | `4rem` | `2rem` |

**States:** No hover/active on the container itself. The parent interactive element handles state.

**Do:** Always use `IconContainer` for icons — never place a bare Material Symbol without a
circular container inside an interactive or structural context.

**Don't:** Don't apply `IconContainer` to purely decorative large icons (e.g., 100px background
panels) — those are placed directly and use `--icon-size-2xl`.

---

### `ProgressBar`

**Purpose:** Visualises a 0–100% scalar value (growth %, harvest readiness, soil composition).

**Anatomy:**
```
[track: full width, --radius-full, surface-container-highest]
  └── [fill: width = value%, --radius-full, primary]
```

**Variants:**

| Variant | Fill color | Use |
|---|---|---|
| `primary` (default) | `--color-primary` | Growth, harvest progress |
| `success` | `--color-success` | Completed/healthy states |
| `warning` | `--color-warning` | Attention-needed states |

**Track height:** `0.375rem` (6px).

**States:**
- Default: static fill width matching `[value]`
- On mount: animate width from `0` to `value` in `500ms` with decelerate easing

**Usage rules:**
- Always pair with a visible label showing the percentage value (e.g. "85%")
- Label uses `type-label-sm` and `--color-primary`
- Track always sits directly below or beside the label — never orphaned

**Do:** Use for any scalar progress value (0–100).
**Don't:** Use for binary states (done/not done) — use a checkbox or badge instead.

---

### `TaskCard`

**Purpose:** Displays a single upcoming or pending task in the home dashboard.

**Anatomy:**
```
[card: surface-container-low, --radius-lg, padding --space-6]
  ├── [icon container: lg, secondary variant]
  ├── [content]
  │   ├── [title: type-heading-4, on-surface]
  │   └── [description: type-body, on-surface-variant]
  └── [footer]
      ├── [schedule icon: sm]
      └── [timestamp: type-label-sm, secondary]
```

**Variants:** Single variant. The icon inside `IconContainer` changes per task type.

**States:**

| State | Treatment |
|---|---|
| Default | `surface-container-low` background |
| Hover | Background → `surface-container-high`, transition `200ms` |
| Active / pressed | `transform: scale(0.99)`, `100ms` |
| Completed | Icon fills, title `text-decoration: line-through`, opacity 60% |

**Usage:** Used exclusively on the home dashboard "Upcoming Garden Tasks" section.
Maximum 3 visible; remainder accessible via "View Schedule".

**Do:** Make the entire card tappable, not just the title.
**Don't:** Nest interactive elements (buttons) inside the card — the card is the action.

---

### `TaskListItem`

**Purpose:** Compact task row for the Calendar feature's daily task list.

**Anatomy:**
```
[row: surface-container-lowest, --radius-lg, padding --space-5]
  ├── [icon container: lg, secondary variant]
  ├── [content]
  │   ├── [title: type-label-lg, on-surface]
  │   └── [subtitle: type-label-sm, on-surface-variant]
  └── [checkbox: circular, --radius-full, outline-variant border]
        └── [check icon: hidden until hover/checked]
```

**States:**

| State | Treatment |
|---|---|
| Default | Unchecked, full opacity |
| Hover (checkbox) | Checkbox bg → `primary-container` |
| Checked | Check icon visible in `on-primary`, bg → `primary-container` |
| Row hover | `box-shadow: --shadow-card` |

---

### `StatChip`

**Purpose:** Compact metric display — a single KPI with an icon, label, and value.
Used in the plot view header row for health index and hydration status.

**Anatomy:**
```
[pill: surface-container-low, --radius-xl, padding --space-3 --space-5]
  ├── [icon container: sm, surface variant]
  └── [text stack]
      ├── [label: type-label-sm, on-surface-variant / secondary]
      └── [value: type-label-lg, on-surface / primary]
```

**Variants:** Variant is expressed through the icon and value color — no separate visual variants.
Use `--color-warning` for value text when the metric indicates an alert state.

**States:** No interactive states — `StatChip` is always read-only.

---

### `FilterChip`

**Purpose:** Toggle-button pill for filtering a list (e.g. encyclopedia categories).

**Anatomy:**
```
[pill: --radius-full]
  ├── [inactive] bg: surface-container-low, border: outline-variant 20%, text: on-surface-variant
  └── [active]   bg: primary, border: none, text: on-primary
```

**States:**

| State | Background | Text | Border |
|---|---|---|---|
| Default (inactive) | `surface-container-low` | `on-surface-variant` | `outline-variant` 20% |
| Hover (inactive) | `secondary-container` at 40% | `primary` | none |
| Active | `primary` | `on-primary` | none |
| Disabled | `surface-container-highest` | `outline` | none, opacity 40% |

**Do:** Use for mutually exclusive or multi-select category filters.
**Don't:** Use as navigation (use bottom nav). Don't use more than 5 chips in one row before
introducing a horizontal scroll container.

---

### `SearchBar`

**Purpose:** Text input for filtering a content list (encyclopedia, future search).

**Anatomy:**
```
[wrapper: surface-container-low, --radius-lg, padding --space-4]
  ├── [search icon: outline color, --icon-size-base, left-inset]
  └── [input: transparent bg, type-body, on-surface, placeholder: outline 60%]
```

**States:**

| State | Background | Ring |
|---|---|---|
| Default | `surface-container-low` | none |
| Focus | `surface-container-lowest` | `0.125rem solid` primary at 20% |
| Filled | `surface-container-lowest` | none |
| Disabled | `surface-container-highest` | none, opacity 40% |

**Do:** Always show the search icon as a persistent prefix — never hide it.
**Don't:** Add a visible border in the default state — surface shift is sufficient.

---

### `GardenGridSlot`

**Purpose:** A single cell in the garden grid. Represents either an assigned crop specimen
or an empty available slot.

**Anatomy (filled):**
```
[card: surface-container-lowest, --radius-xl, padding --space-4]
  ├── [status dot: top-right, 0.5rem circle, success/warning color, pulse animation]
  ├── [image container: 4rem circle, surface-container-low bg]
  │   └── [crop image: full circle, object-cover]
  ├── [name: type-heading-4 (sm), primary-container, centered]
  ├── [latin name: type-latin-name, outline, centered]
  └── [progress bar: primary variant, labeled with % value]
```

**Anatomy (empty):**
```
[card: surface-container-low, --radius-xl, border: 0.125rem dashed outline-variant 30%]
  ├── [icon container: lg, ghost variant]
  │   └── [add icon]
  └── [label: "New Specimen", type-label-sm, on-surface-variant]
```

**States:**

| State | Treatment |
|---|---|
| Default | No elevation |
| Hover (filled) | `--shadow-card`, crop image `scale(1.1)`, `300ms` |
| Hover (empty) | Background → `secondary-container` at 20% |
| Active | `transform: scale(0.98)`, `100ms` |

---

### `SpecimenCard`

**Purpose:** Displays a crop specimen entry in the encyclopedia.
Two sizes controlled by `[size]` input.

**Anatomy (large):**
```
[card: surface-container-low, --radius-xl, overflow hidden]
  ├── [content side]
  │   ├── [category badge: secondary-container, rounded-full, type-label-sm]
  │   ├── [name: type-heading-2, primary]
  │   ├── [description: type-body, on-surface-variant]
  │   ├── [detail rows: icon container sm + label + value, repeated]
  │   └── [CTA link: type-label-lg primary + arrow icon]
  └── [image side: surface-container-high bg]
      └── [circular image: large, border-8 surface-container-lowest, rotate(3deg) default → rotate(0) hover]
```

**Anatomy (compact):**
```
[card: surface-container-lowest, --radius-xl, border outline-variant 10%]
  ├── [circular image: 8rem, ring secondary-container 30%]
  ├── [name: type-heading-4, primary]
  ├── [latin name: type-latin-name, on-secondary-container]
  ├── [stat grid: 2 col, surface-container-low bg, type-label-sm labels + type-label values]
  └── [CTA button: ghost variant, full width]
```

**States:** Hover on large card: image rotation resets to 0deg, transition `500ms`.

---

### `WeatherWidget`

**Purpose:** Shows current growing conditions and a 7-day forecast.
Used in the Calendar feature.

**Anatomy:**
```
[card: primary-container bg, --radius-xl, padding --space-6]
  ├── [current conditions row]
  │   ├── [icon: weather symbol, --icon-size-xl, on-primary]
  │   ├── [temperature: type-heading-2, on-primary]
  │   ├── [dew point label: type-label-sm, on-primary 70%]
  │   └── [condition + wind: type-label-lg + type-label-sm, on-primary / 70%, right-aligned]
  └── [forecast row: horizontal scroll, gap --space-4]
      └── [day cell: min-width 3rem, centered]
          ├── [day: type-label-sm, on-primary 60%]
          ├── [weather icon: --icon-size-md, on-primary]
          └── [temp: type-label-lg, on-primary]
              // Active day: bg white/10, --radius-full, full opacity
```

**States:** The active/today day cell has `bg: rgba(255,255,255,0.1)` and full opacity.
All other days are 60% opacity.

---

### `TopAppBar`

**Purpose:** Fixed application header present on every screen.

**Anatomy:**
```
[nav: fixed top, full width, glassmorphism, h: 4rem]
  ├── [logo slot: icon container md, secondary variant, eco icon]
  ├── [title: "The Digital Arboretum", type-nav-title, primary-container]
  └── [avatar slot: 2.5rem circle, object-cover, outline-variant 10% border]
```

**States:** Static — no scroll behaviour changes. Glassmorphism always active.

**Do:** Keep the title text exactly "The Digital Arboretum" — this is the brand mark.
**Don't:** Replace the centered title with page-specific headings — page context lives in
the page body, not the app bar.

---

### `BottomNavBar`

**Purpose:** Fixed bottom navigation. The primary navigation surface of the app.

**Anatomy:**
```
[nav: fixed bottom, full width, glassmorphism, rounded-t --radius-2xl, --shadow-nav]
  └── [items row: justify-around, padding --space-3 top, --space-6 bottom + safe-area]
      └── [nav item × 4]
          ├── [inactive] icon + label: on-surface-variant / #4A4A4A
          └── [active]   icon in icon-container md (secondary variant), no visible label
```

**Nav items (fixed order):**

| Index | Label | Icon | Route |
|---|---|---|---|
| 0 | My Garden | `psychology_alt` (filled when active) | `/tabs/home` |
| 1 | Library | `local_library` (filled when active) | `/tabs/library` |
| 2 | Calendar | `calendar_today` (filled when active) | `/tabs/calendar` |
| 3 | Profile | `person` (filled when active) | `/tabs/profile` |

**States:**
- Inactive: icon + label, `on-surface-variant` color
- Active: icon only inside `secondary` `IconContainer`, no label, `primary` color
- Transition: background fade `200ms`

**Do:** Keep labels on inactive items at `type-label-sm`.
**Don't:** Add a 5th nav item. Max is 4.

---

### `DayPicker`

**Purpose:** A row of circular day-of-week toggle buttons for selecting an irrigation or
task recurrence schedule.

**Anatomy:**
```
[row: flex, gap --space-4, flex-wrap]
  └── [day button × 7: --radius-full, 3.5rem × 3.5rem]
      ├── [inactive] border: outline-variant, bg: transparent, text: on-surface-variant
      └── [active]   bg: primary, text: on-primary, --shadow-card
```

**States:**

| State | Background | Text | Border |
|---|---|---|---|
| Inactive | transparent | `on-surface-variant` | `outline-variant` |
| Inactive hover | `secondary-container` at 20% | `primary` | `secondary-container` |
| Active | `primary` | `on-primary` | none |

**Do:** Support multi-select. Selected days are independent.
**Don't:** Use abbreviations longer than 1 character (M T W T F S S).

---

### `PlotTypeSelector`

**Purpose:** Large card-button for choosing between Ground Plot and Raised Bed during setup.

**Anatomy:**
```
[button: flex-col, --radius-xl, padding --space-8]
  ├── [icon container: xl, variant by state]
  └── [label: type-label-lg]
// Selected: secondary-container/40 bg, primary border 0.125rem, icon bg: primary
// Unselected: surface-container-low bg, transparent border, icon bg: surface-container-highest
```

**States:** Selected / Unselected. Transition `200ms`.

---

## 17. Interaction & Motion

Motion in The Digital Arboretum should feel like a heavy, vellum page turning — deliberate,
smooth, and unhurried. Never snappy or bouncy.

### Easing functions

```scss
:root {
  --ease-standard:    cubic-bezier(0.2, 0, 0, 1);    // most transitions
  --ease-decelerate:  cubic-bezier(0, 0, 0, 1);       // elements entering the screen
  --ease-accelerate:  cubic-bezier(0.3, 0, 1, 1);     // elements leaving the screen
  --ease-emphasized:  cubic-bezier(0.2, 0, 0, 1);     // prominent state changes
}
```

### Duration scale

```scss
:root {
  --duration-micro:    100ms;   // button press, checkbox tick
  --duration-quick:    200ms;   // hover state changes, nav transitions
  --duration-standard: 300ms;   // card transitions, panel slides
  --duration-complex:  500ms;   // progress bar mounts, page-level transitions, image rotations
}
```

### Interaction patterns

| Element | Trigger | Property | Duration | Easing |
|---|---|---|---|---|
| Filled button | `:active` | `transform: scale(0.98)` | `--duration-micro` | `--ease-standard` |
| Card (TaskCard, etc.) | `:hover` | background color shift | `--duration-quick` | `--ease-standard` |
| Card (TaskCard, etc.) | `:active` | `transform: scale(0.99)` | `--duration-micro` | `--ease-standard` |
| `GardenGridSlot` image | `:hover` on parent | `transform: scale(1.1)` | `--duration-standard` | `--ease-standard` |
| `SpecimenCard` (large) image | `:hover` on parent | `rotate(3deg)` → `rotate(0)` | `--duration-complex` | `--ease-standard` |
| `ProgressBar` fill | on mount | `width: 0 → value%` | `--duration-complex` | `--ease-decelerate` |
| `IconContainer` | `:hover` on parent | `transform: scale(1.05)` | `--duration-quick` | `--ease-standard` |
| `BottomNavBar` active pill | tab change | background fade | `--duration-quick` | `--ease-standard` |
| `PlotTypeSelector` | selected | border + bg change | `--duration-quick` | `--ease-standard` |
| `FilterChip` | toggle | bg + text color | `--duration-quick` | `--ease-standard` |
| `DayPicker` button | toggle | bg + text color | `--duration-quick` | `--ease-standard` |
| Page transition (Ionic) | route change | slide from right (default Ionic) | `--duration-standard` | `--ease-decelerate` / `--ease-accelerate` |

### Animation principles

- **No bounce.** `cubic-bezier` easing only. Do not use spring physics or overshoot.
- **No spin loaders.** Use `LoadingSkeleton` for loading states — animated shimmer only.
- **Animate one thing at a time.** When a card changes state, only one property transitions.
  Do not animate `background-color + transform + opacity` simultaneously.
- **Respect `prefers-reduced-motion`.** Wrap all transitions:

```scss
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 18. Content & Voice

### Tone of voice

The Digital Arboretum speaks with the authority of a seasoned naturalist and the warmth of a
knowledgeable friend. It is:

- **Precise** — uses botanical terminology correctly and consistently
- **Warm** — addresses the user as "Gardener", not "User" or their username
- **Unhurried** — never uses urgency words like "Hurry!" or "Quick!" for non-critical actions
- **Encouraging** — celebrates progress ("85% harvest ready") without being patronising

### Vocabulary glossary

Always use the left column. Never use the right.

| Use | Avoid |
|---|---|
| Specimen | Plant, crop (in UI labels) |
| Plot | Garden, garden space |
| Bed / Raised Bed | Container, box |
| Substrate | Soil, dirt, growing medium |
| Harvest window | Ready to harvest, pick date |
| Irrigate / Irrigation cycle | Water / Watering schedule |
| Growth period | Time to grow, growing time |
| Arboretum AI Assistant | AI, bot, assistant |
| Establish | Plant, put in, start |
| Specimen list | Plant list, crop list |
| Initialise | Create, start, make |

### Greeting patterns

Greetings use the time of day and address the user as "Gardener":
- Morning: "Good Morning, Gardener"
- Afternoon: "Good Afternoon, Gardener"
- Evening: "Good Evening, Gardener"

### Microcopy guidelines

**Labels:** ALL CAPS, `letter-spacing: 0.08em`, `type-label-sm`, `--color-secondary`. Never
sentence case for metadata labels.

**Buttons:** Sentence case for action text. Specific verbs: "View Specimen List", "Initialise
Garden Plot", "Load More Specimens". Avoid generic labels like "Submit" or "OK".

**Placeholders:** Lowercase, example-format. `4.0`, `Search the arboretum…`, `12`.
Never use "Enter…" or "Type your…" phrasing.

**Timestamps:** Natural language over ISO dates. "Today, 7:00 AM", "Tomorrow, 9:30 AM",
"In 2 days". Use ISO only in data exports.

### Error messaging

Structure: `[What happened] + [Why] + [What to do]`.

| Context | Message |
|---|---|
| Empty required field | "Plot width is required. Enter a value between 0.5 and 20 ft." |
| Network error | "Could not reach the Arboretum. Check your connection and try again." |
| No tasks today | "No tasks scheduled for today. Your garden is resting." |
| Deletion confirm | "Remove [Heirloom Tomato] from Plot 04? This cannot be undone." |
| Session expired | "Your session has ended. Sign in to return to your garden." |

### Empty state copy

Every empty state must have: an icon, a headline (Noto Serif), a supporting sentence,
and a primary CTA.

| Screen | Headline | Support | CTA |
|---|---|---|---|
| No plots | "Your arboretum awaits." | "Create your first plot to begin planning your garden." | "Establish First Plot" |
| No tasks | "All quiet in the garden." | "No tasks are scheduled. Assign crops to your plots to begin." | "Go to My Plots" |
| No results (search) | "No specimens found." | "Try a different variety name or browse all categories." | "Clear Search" |
| No library items | "The library is empty." | "No substrates have been added yet." | "Add Substrate Mix" |

---

## 19. Accessibility

Target: **WCAG 2.1 Level AA** for all production screens.

### Colour & contrast

- All text contrast pairs must meet the ratios specified in Section 14.
- Colour must never be the **only** indicator of state. Always pair with an icon, label, or
  shape change.
  - ❌ A red border alone to show error
  - ✅ A red border + error icon + error message text
- The active `BottomNavBar` item uses `IconContainer` background (shape change) in addition to
  the filled icon variant — colour is not the sole indicator.

### Focus states

All focusable elements must have a visible `:focus-visible` ring:

```scss
// In global.scss
:focus-visible {
  outline: 0.125rem solid var(--color-primary);
  outline-offset: 0.125rem;
  border-radius: var(--radius-sm);
}

// Circular elements (buttons, IconContainer, avatar)
button:focus-visible,
.icon-container:focus-visible {
  outline: 0.125rem solid var(--color-primary);
  outline-offset: 0.125rem;
  border-radius: var(--radius-full);
}
```

### Keyboard navigation

- All interactive elements must be reachable via `Tab` / `Shift+Tab`.
- `DayPicker` buttons support `Arrow Left` / `Arrow Right` to move between days.
- `FilterChip` groups act as a `role="group"` with `aria-label`.
- `GardenGridSlot` (empty) must be keyboard-activatable to open crop assignment.
- Modal / `Drawer` traps focus within. On close, returns focus to the trigger element.

### Screen reader requirements

| Element | Required attribute |
|---|---|
| `IconContainer` used alone (no visible label) | `aria-label="[action description]"` on parent button |
| `ProgressBar` | `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"` |
| `GardenGridSlot` (filled) | `aria-label="[Crop name], [growth]% growth"` |
| `GardenGridSlot` (empty) | `aria-label="Empty slot. Tap to add a specimen."` |
| `WeatherWidget` forecast row | `aria-label="7-day forecast"` on container |
| `BottomNavBar` items | `aria-label="[tab name]"`, `aria-current="page"` on active item |
| `TopAppBar` avatar | `aria-label="Profile"` |
| Status dot (pulse animation) | `role="status"`, `aria-label="Active"` |

### Touch targets

Minimum interactive size: `2.75rem × 2.75rem` (44×44px).

Components that use smaller visual sizes must be padded to meet this:
- `FilterChip` (visual height may be ~`2rem`) → add `min-height: 2.75rem`
- `TaskListItem` checkbox (visual `1.5rem`) → use `padding` to expand hit area to `2.75rem`
- `CalendarGrid` day cells → minimum `2.75rem × 2.75rem` per cell

### Reduced motion

All CSS transitions must be wrapped as shown in Section 17. The `ProgressBar` mount animation
and any decorative transforms must be suppressed.

---

## 20. Responsive & Platform Adaptation

The application is **mobile-first**. The base experience is designed for a 390px-wide phone
screen (iPhone 14) and expands from there.

### Ionic / Capacitor specifics

- Use `ion-content`, `ion-page`, and `ion-router-outlet` for page structure — these handle
  scroll behaviour, safe areas, and platform-specific padding.
- Override Ionic CSS variables in `variables.scss` to align with this design system's tokens.
  Map `--ion-color-primary` → `--color-primary`, etc.
- For Ionic shadow DOM elements that cannot be styled via CSS variables, use `::part()` rules
  in `global.scss` only.
- Do not use Ionic's built-in card or button components for feature UI — the design diverges
  significantly from Ionic defaults. Use custom BEM components with Ionic layout primitives.

### Breakpoint behaviour per surface

**TopAppBar:** No layout change across breakpoints. Max-width container centres on desktop.

**BottomNavBar:** Remains at the bottom on all breakpoints. On desktop PWA, this is acceptable
for consistency; a sidebar is a future roadmap item.

**Page content container:** `max-width: 80rem`, centred, 1.5rem padding mobile → 2rem tablet+.

**Task cards grid:**
- Mobile: `grid-cols-1`
- Tablet (≥48rem): `grid-cols-2`
- Desktop (≥64rem): `grid-cols-3`

**Garden grid slots:**
- Mobile: `grid-cols-2`
- Tablet (≥48rem): `grid-cols-4`
- Desktop (≥64rem): `grid-cols-6`

**Plot card (asymmetric):**
- Mobile: image on top, info below (stacked)
- Tablet+ (≥48rem): image left / info right, alternating direction per card

**Encyclopedia bento:**
- Mobile: single column stacked
- Tablet+ (≥48rem): 12-column grid with 8+4 splits

**Calendar grid:** Stays single column at all sizes. Max-width `48rem`, centred.

**Garden setup form:**
- Mobile: dimensions in 1 column
- Tablet+ (≥48rem): dimensions in 3 columns side by side

### Platform-specific considerations

| Platform | Notes |
|---|---|
| iOS (Capacitor) | Apply `safe-area-inset-top` to `TopAppBar`, `safe-area-inset-bottom` to `BottomNavBar`. Use Capacitor Haptics on primary button taps and task completion. |
| Android (Capacitor) | Same safe-area treatment. Android back button should navigate back (Capacitor handles via Angular router). |
| Web PWA | App installs to home screen. Splash screen uses `--color-primary` background. Ensure the manifest `theme_color` matches `--color-primary`. |

---

## 21. Design Token Naming Convention

Tokens follow the pattern: `{category}.{role}.{variant?}`

### Token JSON structure (source of truth for future tooling)

```json
{
  "color": {
    "primary": {
      "default":    { "value": "#163526", "type": "color" },
      "container":  { "value": "#2d4c3b", "type": "color" },
      "on":         { "value": "#ffffff", "type": "color" },
      "on-container": { "value": "#99bca6", "type": "color" }
    },
    "secondary": {
      "default":    { "value": "#556159", "type": "color" },
      "container":  { "value": "#d5e3d8", "type": "color" },
      "on":         { "value": "#ffffff", "type": "color" }
    },
    "surface": {
      "default":          { "value": "#faf9f5", "type": "color" },
      "container-lowest": { "value": "#ffffff",  "type": "color" },
      "container-low":    { "value": "#f4f4f0",  "type": "color" },
      "container":        { "value": "#efeeea",  "type": "color" },
      "container-high":   { "value": "#e9e8e4",  "type": "color" },
      "container-highest":{ "value": "#e3e2df",  "type": "color" }
    },
    "on-surface": {
      "default":  { "value": "#1b1c1a", "type": "color" },
      "variant":  { "value": "#424843", "type": "color" }
    },
    "outline": {
      "default":  { "value": "#727973", "type": "color" },
      "variant":  { "value": "#c2c8c1", "type": "color" }
    },
    "success": {
      "default":    { "value": "#1b6e3c", "type": "color" },
      "container":  { "value": "#d4f0e0", "type": "color" },
      "on":         { "value": "#ffffff", "type": "color" }
    },
    "warning": {
      "default":    { "value": "#7a4f00", "type": "color" },
      "container":  { "value": "#ffe0b2", "type": "color" },
      "on":         { "value": "#ffffff", "type": "color" }
    },
    "error": {
      "default":    { "value": "#ba1a1a", "type": "color" },
      "container":  { "value": "#ffdad6", "type": "color" },
      "on":         { "value": "#ffffff", "type": "color" }
    }
  },
  "spacing": {
    "1":  { "value": "0.25rem",  "type": "spacing" },
    "2":  { "value": "0.5rem",   "type": "spacing" },
    "3":  { "value": "0.75rem",  "type": "spacing" },
    "4":  { "value": "1rem",     "type": "spacing" },
    "5":  { "value": "1.25rem",  "type": "spacing" },
    "6":  { "value": "1.5rem",   "type": "spacing" },
    "8":  { "value": "2rem",     "type": "spacing" },
    "10": { "value": "2.5rem",   "type": "spacing" },
    "12": { "value": "3rem",     "type": "spacing" },
    "16": { "value": "4rem",     "type": "spacing" },
    "24": { "value": "6rem",     "type": "spacing" }
  },
  "borderRadius": {
    "sm":   { "value": "0.5rem",  "type": "borderRadius" },
    "md":   { "value": "1rem",    "type": "borderRadius" },
    "lg":   { "value": "1.5rem",  "type": "borderRadius" },
    "xl":   { "value": "2rem",    "type": "borderRadius" },
    "2xl":  { "value": "3rem",    "type": "borderRadius" },
    "full": { "value": "9999px",  "type": "borderRadius" }
  },
  "fontSize": {
    "display":    { "value": "2.5rem",    "type": "fontSize" },
    "heading-1":  { "value": "2rem",      "type": "fontSize" },
    "heading-2":  { "value": "1.75rem",   "type": "fontSize" },
    "heading-3":  { "value": "1.5rem",    "type": "fontSize" },
    "heading-4":  { "value": "1.25rem",   "type": "fontSize" },
    "nav-title":  { "value": "1.125rem",  "type": "fontSize" },
    "body-lg":    { "value": "1rem",      "type": "fontSize" },
    "body":       { "value": "0.875rem",  "type": "fontSize" },
    "body-sm":    { "value": "0.8125rem", "type": "fontSize" },
    "label-lg":   { "value": "0.875rem",  "type": "fontSize" },
    "label":      { "value": "0.75rem",   "type": "fontSize" },
    "label-sm":   { "value": "0.625rem",  "type": "fontSize" },
    "latin-name": { "value": "0.6875rem", "type": "fontSize" }
  },
  "duration": {
    "micro":    { "value": "100ms", "type": "duration" },
    "quick":    { "value": "200ms", "type": "duration" },
    "standard": { "value": "300ms", "type": "duration" },
    "complex":  { "value": "500ms", "type": "duration" }
  }
}
```

### CSS custom property naming convention

The CSS variable names mirror the JSON path with `--` prefix and `.` replaced by `-`:

```
color.primary.default     → --color-primary
color.surface.container-low → --color-surface-container-low
spacing.6                 → --space-6
borderRadius.full         → --radius-full
fontSize.heading-2        → (no CSS var — use @include type-heading-2 mixin instead)
duration.standard         → --duration-standard
```

---

## 22. Governance

### Contribution rules

A new component may only be added to `shared/components/` if:

1. It is used in **two or more distinct features** (not hypothetically — actually needed now).
2. It has **no dependency** on `core/`, `features/`, NgRx store, or routing.
3. It ships with all three artefacts: `.component.ts`, `.component.scss`, `.component.stories.ts`.
4. Its Storybook story includes `tags: ['autodocs']` and covers at least Default + one variant.

Feature-specific components live in `features/<name>/components/` and do not need stories.

### Design token change process

1. All token changes (colour, spacing, radius, shadow, duration) happen **only in `variables.scss`**.
2. Never change a token value inline in a component SCSS file.
3. Adding a new token: add it to `variables.scss` AND to the JSON structure in Section 21.
4. Renaming a token: update the variable name everywhere it is referenced before merging.
   Use global search — no dangling references.

### PR review checklist for design system changes

Before merging any PR that touches the design system:

- [ ] No raw hex values in any component SCSS — only `var(--color-*)` references
- [ ] No pixel values anywhere — only `rem`, `%`, `em` (for `line-height` only), or `9999px`
      (for `--radius-full`)
- [ ] No `font-size` or `font-family` set directly — only `@include type-*` mixins used
- [ ] All new interactive elements have `:focus-visible` styles
- [ ] All new icon-only interactive elements have `aria-label`
- [ ] Touch targets meet `2.75rem × 2.75rem` minimum
- [ ] Storybook story added/updated for any new or modified shared component
- [ ] No Tailwind classes introduced
- [ ] `prefers-reduced-motion` respected for any new animation

### Versioning

This design system does not use semantic versioning in the MVP. All changes are tracked via
git history on this file and `variables.scss`.

When a breaking component API change is made (e.g. an `@Input()` is renamed or removed),
the PR description must explicitly state what breaks and how to migrate.

### Documentation standards

Each shared component must have an inline JSDoc comment on its class explaining purpose,
inputs, outputs, and variants. Stories serve as the living documentation.

```ts
/**
 * GardenGridSlotComponent
 *
 * A single cell in the garden plot grid. Displays either an assigned crop specimen
 * (with image, name, latin name, and growth progress) or an empty slot for adding
 * a new specimen.
 *
 * @input crop - The CropSpecimen to display. If null, renders the empty slot variant.
 * @input editable - When true, the empty slot is interactive. Default: true.
 * @output slotClicked - Emits the crop id (string) or null (empty slot) on click.
 */
```
