# Photo / Grid Sync — Design Spec

**Date:** 2026-04-19
**Status:** Approved

---

## Overview

A `PlotSlot` can hold both grid coordinates (`row`/`col`) and photo coordinates (`x_pct`/`y_pct`/`w_pct`/`h_pct`) simultaneously. Currently the two position sets are mutually exclusive in the UI. This feature makes them coexist: crops placed in the grid can also be annotated on the plot photo, and vice versa.

---

## Data model

No schema changes. `PlotSlot` already carries both coordinate sets — they just aren't populated together today. A slot is considered:

| State | Condition |
|---|---|
| Grid-only | `row`/`col` set, `x_pct` null |
| Photo-only | `x_pct` set, `row`/`col` null (existing photo-draw slots) |
| Both | `row`/`col` AND `x_pct` set |
| Unplaced on photo | has `row`/`col`, `x_pct` is null |

---

## Photo mode — side panel

### Layout

The photo overlay area splits into two columns:

- **Left (flex: 1):** the existing `PlotPhotoOverlayComponent` with the photo and placed slot rects.
- **Right (fixed ~5rem):** a new `PhotoUnplacedPanelComponent` listing all slots that have `row`/`col` but no `x_pct`.

The panel uses `--color-surface-container-low` background, `--radius-md` corners, `--space-4` padding, and `--shadow-card` elevation to lift it above the photo background.

### Unplaced crop chips

Each chip:
- Background: `--color-surface-container-lowest`
- Border: `0.0625rem dashed` `--color-outline-variant`
- Border radius: `--radius-full`
- Typography: crop name truncated to ~6 chars, `type-label-sm`, `--color-on-surface`
- Min touch target: `2.75rem × 2.75rem`

**Selected state** (user tapped this chip — next draw will place it):
- Background: `--color-primary-container`
- Border: `0.125rem solid` `--color-primary`
- Text: `--color-on-primary-container`
- Small "PLACE" label below name, `type-label-sm`, `--color-primary`

Tapping a selected chip deselects it (toggle).

### Placing a chip onto the photo

1. User taps a chip → it enters selected state.
2. User draws a rect on the photo (existing pointer-event draw logic).
3. On `newRectDrawn` emit: instead of opening the crop picker, the overlay detects that a chip is selected and emits a new `slotPlaced` event: `{ slot: PlotSlot, rect: PhotoRect }`.
4. `PlotDetailPage` handles `slotPlaced` → dispatches `PlotsActions.updateSlot` with `{ x_pct, y_pct, w_pct, h_pct }` on the existing slot id.
5. After success the slot gains photo coords → it disappears from the panel and appears on the photo.

When no chip is selected, drawing a rect still opens the crop picker (existing behaviour — creates a new photo-only slot).

### Panel counter

At the bottom of the panel: `{placed} of {total}` in `type-label-sm`, `--color-on-surface-variant`. Total = all slots in the plot (grid + photo). Placed = slots with `x_pct` set.

---

## Removing a placed slot from the photo

**Slot has both grid + photo coords** (grid-only source placed onto photo):
- Tapping ✕ on the photo rect clears `x_pct`/`y_pct`/`w_pct`/`h_pct` on the slot (dispatches `updateSlot` with those fields set to `null`).
- No confirmation dialog — non-destructive (slot stays in the grid).
- Slot reappears in the unplaced panel.

**Slot has only photo coords** (drawn directly in photo mode, no grid position):
- Tapping ✕ opens the existing confirmation dialog and deletes the slot entirely.

`PlotPhotoOverlayComponent` cannot distinguish these two cases — it receives a `PlotSlot`. `PlotDetailPage.onRemovePhotoSlot()` checks `slot.row != null` to decide which path to take.

---

## Grid view — photo badge

When a slot has `x_pct != null`, `GardenGridSlotComponent` shows a small badge at the top-right of the cell:

- Icon: `photo_camera` (Material Symbols Outlined), `--icon-size-sm`
- Container: `--color-info-container` background, `--radius-full`, `1.25rem × 1.25rem`
- Icon color: `--color-info`

This uses `--color-info` / `--color-info-container` because it is purely informational — the crop is also annotated on the photo. It does not imply success, warning, or error.

The badge is added via a new optional `@Input() hasPhotoPlacement: boolean` on `GardenGridSlotComponent`. `PlotDetailPage` passes `!!slot.x_pct` for each cell.

---

## Component changes

### `PlotPhotoOverlayComponent`

- New `@Input() unplacedSlots: PlotSlot[]` — slots to show in the side panel.
- New `@Output() slotPlaced: EventEmitter<{ slot: PlotSlot; rect: PhotoRect }>` — emitted when user draws a rect while a chip is selected.
- Internal state: `selectedUnplacedSlot: PlotSlot | null`.
- The existing `newRectDrawn` output fires only when `selectedUnplacedSlot` is null.
- The side panel is rendered inside `PlotPhotoOverlayComponent` as a sibling to the photo container div (not a separate component — it's tightly coupled to the selection state).

### `PlotDetailPage`

- `unplacedSlots` computed signal: `slots().filter(s => s.row != null && s.x_pct == null)`.
- Pass `[unplacedSlots]="unplacedSlots()"` to `PlotPhotoOverlayComponent`.
- Handle `(slotPlaced)` → dispatch `PlotsActions.updateSlot({ plotId, slotId: event.slot.id, payload: { x_pct, y_pct, w_pct, h_pct } })`.
- Update `onRemovePhotoSlot`: if `slot.row != null`, dispatch `updateSlot` with nulled photo coords; else dispatch `deleteSlot` (existing behaviour).

### `GardenGridSlotComponent`

- New `@Input() hasPhotoPlacement = false`.
- Renders the photo badge conditionally inside the filled slot anatomy.

### `PlotsActions` / backend

No new actions needed — `updateSlot` already accepts a partial payload and the backend already handles nullable photo coord fields via the PATCH endpoint.

---

## Key design constraints from the design system

- All backgrounds via surface/semantic tokens — no raw hex values.
- Chip border radius: `--radius-full`.
- Touch target minimum `2.75rem` on all chips.
- `type-label-sm` for panel label and counter (uppercase + tracked, `--color-secondary`).
- Photo badge uses `--color-info` (not `--color-primary`) — informational only, not a status.
- No 1px solid dividers — surface tier shifts separate the panel from the photo area.
