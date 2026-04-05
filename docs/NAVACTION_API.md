# NavAction API — TopAppBarComponent

**Date**: April 5, 2026
**Status**: Complete

## What it is

`TopAppBarComponent` accepts a declarative list of icon buttons via its `[actions]` input. Each action renders as an icon button in the trailing area of the bar. When a button is tapped, the component emits `(actionClick)` with the action's `id`.

This replaces the previous pattern of projecting `<button trailing>` boilerplate into every page template.

## NavAction interface

Exported from `shared/index.ts`:

```typescript
export interface NavAction {
  id: string;        // value emitted by (actionClick)
  icon: string;      // Material Symbols ligature name (e.g. 'add', 'person')
  label: string;     // aria-label for accessibility
  hidden?: boolean;
  disabled?: boolean;
}
```

## Usage

**Component class:**

```typescript
import { NavAction } from '@app/shared';

readonly topBarActions: NavAction[] = [
  { id: 'add-plot', icon: 'add',    label: 'Add plot' },
  { id: 'profile',  icon: 'person', label: 'Profile'  },
];

onTopBarAction(id: string): void {
  if (id === 'add-plot') this.addPlot();
  if (id === 'profile')  this.goToSettings();
}
```

**Template:**

```html
<app-top-app-bar
  title="My Plots"
  [actions]="topBarActions"
  (actionClick)="onTopBarAction($event)"
/>
```

## When to use [actions] vs [leading]

| Use case | Approach |
|----------|----------|
| Trailing icon buttons (profile, add, notifications) | `[actions]` input |
| Back button or cancel button (left side) | `[leading]` slot |
| Custom trailing content that is not a simple icon button | `[trailing]` slot |

Both `[leading]` and `[trailing]` content projection slots are preserved for backward compatibility.

## Current pages and their action arrays

| Page | Actions |
|------|---------|
| Home | `notifications`, `profile` |
| Plots | `add-plot`, `profile` |
| Crops | `add-crop`, `profile` |
| Calendar | `profile` |
| Settings | — (uses `[leading]` back button) |
| Profile | — (uses `[leading]` back button) |

## File locations

| File | Role |
|------|------|
| `frontend/src/app/shared/components/top-app-bar/top-app-bar.component.ts` | Component implementation — `@Input() actions`, `@Output() actionClick` |
| `frontend/src/app/shared/index.ts` | Barrel export of `NavAction` interface and `TopAppBarComponent` |
