# Navbar Padding Refactor

**Date**: April 2, 2026  
**Status**: ✅ Complete  
**Impact**: Centralized navbar spacing with flexible component-level padding architecture

## Problem

Previously, every page in the application had to manually calculate and add padding/margin to account for:
- **Top navbar** (`--top-app-bar-height`): A fixed-position top bar with responsive height
- **Bottom navbar** (mobile only): A fixed-position bottom navigation bar

This led to:
- **Inconsistency**: Different pages calculated padding differently
- **Maintenance burden**: Changes to navbar heights required updating multiple page SCSS files
- **Error-prone**: Easy to forget or miscalculate navbar dimensions
- **Code duplication**: Same calculations repeated across 10+ page components

### Example of Old Pattern

```scss
// OLD: Each page had to manually calculate padding
.home-body {
  padding: var(--space-4) var(--space-4) calc(var(--bottom-nav-height) + var(--space-4));
}

.plots-list {
  padding: calc(var(--top-app-bar-height) + var(--space-4)) var(--space-4) calc(var(--bottom-nav-height) + var(--space-4));
}
```

## Solution

Created a **centralized `PageContentComponent`** that wraps `IonContent` and automatically handles **navbar vertical spacing only**. Each component inside `PageContentComponent` is responsible for its own horizontal padding, enabling flexible layouts with full-width and padded sections coexisting.

### Architecture

```
PageContentComponent (handles top/bottom navbar offset only)
  ↓
Page Components (each manages its own horizontal padding)
  ├─ HeroSection (full-width, no padding)
  ├─ CardList (adds own padding-left/right)
  ├─ PageBodyWrapper (optional utility wrapper for loose content)
  └─ ...
```

The component automatically:
1. Respects fixed-height navbar space via design system tokens (top/bottom only)
2. Applies vertical padding to account for navbar heights
3. Allows components to maintain their own horizontal padding
4. Supports full-width sections alongside padded content sections
5. Maintains consistent spacing across all pages

## Implementation

### New Component Structure

**File**: `/frontend/src/app/shared/components/page-content/page-content.component.ts`

```typescript
@Component({
  selector: 'app-page-content',
  standalone: true,
  imports: [IonContent],
  styleUrl: './page-content.component.scss',
  host: { class: 'page-content-host' },
  template: `
    <ion-content class="page-content" [attr.data-component]="'page-content'">
      <ng-content />
    </ion-content>
  `,
})
export class PageContentComponent {
  /**
   * Optional: Custom background color. Defaults to --color-surface
   */
  @Input() background?: string;
}
```

**File**: `/frontend/src/app/shared/components/page-content/page-content.component.scss`

Handles **vertical spacing only** (top/bottom navbar offsets). Horizontal padding (left/right) is **NOT** applied here.

```scss
:host.page-content-host {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.page-content {
  // ─── Layout ───────────────────────────────────────────────────────────────
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  // ─── Ionic overrides ──────────────────────────────────────────────────────
  --background: var(--page-background, var(--color-surface));

  // ─── Padding: Navbar spacing only (top/bottom) ────────────────────────────
  // Top: navbar height + top content padding
  // Bottom: bottom nav height + bottom content padding
  // Left/Right: 0 (each component manages its own horizontal padding)
  --padding-top: calc(var(--top-app-bar-height) + var(--page-padding-top, var(--space-4)));
  --padding-bottom: calc(var(--bottom-nav-height) + var(--page-padding-bottom, var(--space-4)));
  --padding-start: 0;
  --padding-end: 0;

  // ─── Direct padding as well (for safety) ──────────────────────────────────
  padding-top: calc(var(--top-app-bar-height) + var(--page-padding-top, var(--space-4)));
  padding-bottom: calc(var(--bottom-nav-height) + var(--page-padding-bottom, var(--space-4)));
  padding-left: 0;
  padding-right: 0;
}
```

### Optional: PageBodyWrapperComponent

For cases where you have loose content (not wrapped in dedicated components) that needs horizontal padding, use `PageBodyWrapperComponent`:

**File**: `/frontend/src/app/shared/components/page-body-wrapper/page-body-wrapper.component.ts`

```typescript
@Component({
  selector: 'app-page-body-wrapper',
  standalone: true,
  styleUrl: './page-body-wrapper.component.scss',
  template: `<ng-content />`,
})
export class PageBodyWrapperComponent {}
```

**File**: `/frontend/src/app/shared/components/page-body-wrapper/page-body-wrapper.component.scss`

```scss
:host {
  display: block;
  padding-left: var(--page-body-padding-start, var(--space-4));
  padding-right: var(--page-body-padding-end, var(--space-4));
}
```

### Updated Pages

The following pages were refactored to use `PageContentComponent`:

1. **Home Page** (`/features/home/home.page.ts`)
2. **Plots Page** (`/features/plots/plots.page.ts`)
3. **Calendar Page** (`/features/calendar/calendar.page.ts`)
4. **Settings Page** (`/features/settings/settings.page.ts`)
5. **Crops Page** (`/features/crops/crops.page.ts`)
6. **Profile Page** (`/features/profile/profile.page.ts`)

### Migration Example: Approach 1 - Components Handle Their Own Padding

**Before:**
```typescript
import { IonContent } from '@ionic/angular/standalone';

@Component({
  imports: [IonContent, ...],
  template: `
    <app-top-app-bar title="My Plots">
      <!-- buttons -->
    </app-top-app-bar>
    <ion-content class="plots-content">
      <div class="plots-list">
        <!-- cards -->
      </div>
    </ion-content>
  `,
})
export class PlotsPage { }
```

**SCSS Before:**
```scss
.plots-content {
  --background: var(--color-surface);
}

.plots-list {
  padding: calc(var(--top-app-bar-height) + var(--space-4)) var(--space-4) calc(var(--bottom-nav-height) + var(--space-4));
}
```

---

**After (Recommended):**
```typescript
import { PageContentComponent } from '../../shared';

@Component({
  imports: [PageContentComponent, ...],
  template: `
    <app-top-app-bar title="My Plots">
      <!-- buttons -->
    </app-top-app-bar>
    <app-page-content>
      <div class="plots-list">
        <!-- cards -->
      </div>
    </app-page-content>
  `,
})
export class PlotsPage { }
```

**SCSS After:**
```scss
.plots-list {
  padding: var(--space-4); // Only content padding, navbar is handled by PageContentComponent
}
```

---

### Migration Example: Approach 2 - Using PageBodyWrapperComponent

If your page has loose content not wrapped in dedicated components, use `PageBodyWrapperComponent`:

```typescript
import { PageContentComponent, PageBodyWrapperComponent } from '../../shared';

@Component({
  imports: [PageContentComponent, PageBodyWrapperComponent, ...],
  template: `
    <app-top-app-bar title="My Garden">
      <!-- buttons -->
    </app-top-app-bar>
    <app-page-content>
      <app-hero-section></app-hero-section>
      <!-- Hero is full-width, no padding -->
      
      <app-page-body-wrapper>
        <!-- Loose content here gets padding automatically -->
        <div class="content-section">...</div>
        <div class="content-section">...</div>
      </app-page-body-wrapper>
    </app-page-content>
  `,
})
export class HomePage { }
```

**SCSS:**
```scss
// No padding styles needed for loose content - PageBodyWrapperComponent handles it
.content-section {
  margin-bottom: var(--space-6);
}
```

## CSS Custom Properties

The `PageContentComponent` supports customization of background color via CSS variables:

| Property | Default | Description |
|----------|---------|-------------|
| `--page-background` | `--color-surface` | Background color |

**Note**: 
- Vertical padding is automatically set to navbar heights only (no additional padding)
- Horizontal padding (`--padding-start` / `--padding-end`) is intentionally **NOT** applied by `PageContentComponent`. Components inside must manage their own horizontal padding.

### Custom Padding Example

```html
<!-- Use default vertical spacing -->
<app-page-content>
  <!-- content handles its own horizontal padding -->
</app-page-content>

<!-- Custom vertical padding -->
<app-page-content style="--page-padding-top: 2rem;">
  <!-- content -->
</app-page-content>

<!-- Custom background -->
<app-page-content style="--page-background: var(--color-accent);">
  <!-- content -->
</app-page-content>
```

### PageBodyWrapperComponent Custom Properties

For the optional `PageBodyWrapperComponent`:

| Property | Default | Description |
|----------|---------|-------------|
| `--page-body-padding-start` | `--space-4` | Left padding (1rem) |
| `--page-body-padding-end` | `--space-4` | Right padding (1rem) |

```html
<!-- Use default horizontal padding -->
<app-page-body-wrapper>
  <!-- content -->
</app-page-body-wrapper>

<!-- Custom horizontal padding -->
<app-page-body-wrapper style="--page-body-padding-start: 2rem; --page-body-padding-end: 2rem;">
  <!-- content -->
</app-page-body-wrapper>
```

## Design System Integration

The component leverages design system tokens for consistency:

- **Navbar Heights**: `--top-app-bar-height`, `--bottom-nav-height`
- **Spacing Scale**: `--space-*` tokens (1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24)
- **Colors**: `--color-surface` and other color tokens
- **Responsive**: Heights adjust via safe-area-inset for notches/safe areas

## Testing & Verification

### Visual Testing
- ✅ Home page: Hero section properly spaced from navbar
- ✅ Plots page: Cards have consistent left/right padding
- ✅ Calendar page: Calendar grid properly positioned
- ✅ Settings page: Content doesn't overlap navbar

### Responsive Testing
- ✅ Desktop (sidebar visible): Content properly positioned
- ✅ Mobile (no sidebar): Content fills available width
- ✅ Dark mode: Padding applies correctly
- ✅ Landscape orientation: Heights adjust properly

## Files Modified

### New Files
- `/frontend/src/app/shared/components/page-content/page-content.component.ts`
- `/frontend/src/app/shared/components/page-content/page-content.component.scss`
- `/frontend/src/app/shared/components/page-body-wrapper/page-body-wrapper.component.ts` — Optional utility for loose content padding
- `/frontend/src/app/shared/components/page-body-wrapper/page-body-wrapper.component.scss` — Horizontal padding styles

### Updated Files
- `/frontend/src/app/shared/index.ts` — Added PageContentComponent and PageBodyWrapperComponent exports
- `/frontend/src/app/features/home/home.page.ts` — Migrated to PageContentComponent
- `/frontend/src/app/features/home/home.page.scss` — Removed navbar padding calculations, components now handle own padding
- `/frontend/src/app/features/plots/plots.page.ts` — Migrated to PageContentComponent
- `/frontend/src/app/features/plots/plots.page.scss` — Removed navbar padding calculations
- `/frontend/src/app/features/calendar/calendar.page.ts` — Migrated to PageContentComponent
- `/frontend/src/app/features/calendar/calendar.page.scss` — Removed navbar padding calculations
- `/frontend/src/app/features/settings/settings.page.ts` — Migrated to PageContentComponent
- `/frontend/src/app/features/settings/settings.page.scss` — Removed navbar padding calculations
- `/frontend/src/app/features/crops/crops.page.ts` — Migrated to PageContentComponent
- `/frontend/src/app/features/crops/crops.page.scss` — Removed navbar padding calculations
- `/frontend/src/app/features/profile/profile.page.ts` — Migrated to PageContentComponent
- `/frontend/src/app/features/profile/profile.page.scss` — Removed navbar padding calculations

## Benefits

| Benefit | Impact |
|---------|--------|
| **Centralization** | Single source of truth for navbar padding logic |
| **Consistency** | All pages automatically have uniform spacing |
| **Flexibility** | Components can be full-width or padded independently |
| **Layout Control** | Full-width sections (heroes, banners) coexist with padded content |
| **Maintainability** | Changes to navbar heights update all pages automatically |
| **Scalability** | New pages inherit correct navbar spacing without calculation |
| **Design Alignment** | Integrates with design system tokens |

## Layout Approaches & Best Practices

### Approach 1: Component-Level Padding (Recommended for Dedicated Components)

Each component is responsible for its own horizontal padding. Use this when content is organized in dedicated, reusable components.

**Structure:**
```html
<app-page-content>
  <app-hero-section></app-hero-section>        <!-- Full-width, no padding -->
  <app-card-list></app-card-list>              <!-- Component adds own padding -->
  <app-feature-section></app-feature-section>  <!-- Component adds own padding -->
</app-page-content>
```

**Component SCSS Example:**
```scss
:host {
  display: block;
  padding: 0 var(--space-4); // Component manages own horizontal padding
}
```

**Advantages:**
- Components are self-contained and reusable
- Clear separation of concerns
- Easy to test individual component spacing
- Flexible layout mixing full-width and padded content

### Approach 2: PageBodyWrapperComponent (For Loose Content)

Use `PageBodyWrapperComponent` when you have loose, non-component content that needs padding.

**Structure:**
```html
<app-page-content>
  <app-hero-section></app-hero-section>
  
  <app-page-body-wrapper>
    <h2>Section Title</h2>
    <p>Loose content here...</p>
    <div class="card">...</div>
  </app-page-body-wrapper>
</app-page-content>
```

**Advantages:**
- Reduces wrapper boilerplate for simple content
- Useful for prototype/quick pages
- Maintains consistent spacing for non-component content

### Key Rules

**Always maintain these styling and layout principles:**

1. **PageContentComponent** handles **ONLY** top/bottom navbar spacing
   - ✅ `--padding-top: calc(var(--top-app-bar-height) + ...)`
   - ✅ `--padding-bottom: calc(var(--bottom-nav-height) + ...)`
   - ❌ NO `--padding-start` / `--padding-end`

2. **Each component/wrapper** manages its own **horizontal padding**
   - ✅ `padding-left: var(--space-4)`
   - ✅ `padding-right: var(--space-4)`
   - ✅ Can be 0 for full-width sections

3. **Full-width sections** never have horizontal padding
   - ✅ Hero sections: `padding: 0`
   - ✅ Full-width banners: `padding: 0`
   - ✅ Modals/overlays: `padding: 0`

4. **Consistency across pages**
   - ✅ All pages use PageContentComponent
   - ✅ All padded content uses either component-level padding or PageBodyWrapperComponent
   - ✅ Default horizontal padding is `var(--space-4)` (1rem)

## Migration Checklist

If you need to migrate additional pages in the future:

- [ ] Replace `import { IonContent, ... }` with import from `@ionic/angular/standalone`
- [ ] Add `PageContentComponent` to imports from `../../shared`
- [ ] Add `PageContentComponent` to `@Component.imports` array
- [ ] Replace `<ion-content class="...">` with `<app-page-content class="...">`
- [ ] Replace `</ion-content>` with `</app-page-content>`
- [ ] Remove `--background: var(--color-surface);` from component SCSS
- [ ] Remove navbar height calculations from top-level content sections
- [ ] Add horizontal padding (`padding-left/right`) to components or wrap loose content in `PageBodyWrapperComponent`
- [ ] Verify full-width sections (hero, banners) have `padding: 0`
- [ ] Test on mobile, tablet, and desktop viewports
- [ ] Test dark mode

## Future Improvements

1. **Responsive Padding**: Consider adjusting padding based on viewport
2. **Safe Area Handling**: Further optimize for devices with notches
3. **Animation Support**: Add optional transitions when navbar visibility changes
4. **A11y Enhancements**: Ensure proper focus management with navbar

## References

- Design System: [`/frontend/src/theme/variables.scss`](../frontend/src/theme/variables.scss)
- Top App Bar: [`/frontend/src/app/shared/components/top-app-bar/`](../frontend/src/app/shared/components/top-app-bar/)
- Bottom Nav: [`/frontend/src/app/shared/components/bottom-nav-bar/`](../frontend/src/app/shared/components/bottom-nav-bar/)
