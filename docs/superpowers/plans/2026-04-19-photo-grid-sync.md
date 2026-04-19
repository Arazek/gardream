# Photo / Grid Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a `PlotSlot` to carry both grid coordinates and photo coordinates simultaneously, so crops placed in the grid can be annotated on the plot photo via a side panel, and vice versa.

**Architecture:** No backend or schema changes are needed — `PlotSlot` already has both coordinate sets. The UI is extended in three places: `GardenGridSlotComponent` gets a photo-placement badge input, `PlotPhotoOverlayComponent` gains a side panel and a `slotPlaced` output, and `PlotDetailPage` wires everything together using computed signals and existing `updateSlot` / `deleteSlot` actions.

**Tech Stack:** Angular 19 standalone + NgRx 19 + SCSS design tokens (`variables.scss`). No new dependencies.

---

## File Map

| File | Change |
|---|---|
| `frontend/src/app/shared/components/garden-grid-slot/garden-grid-slot.component.ts` | Add `@Input() hasPhotoPlacement = false`, render badge |
| `frontend/src/app/shared/components/garden-grid-slot/garden-grid-slot.component.scss` | Badge styles |
| `frontend/src/app/features/plots/plot-photo-overlay.component.ts` | Add `unplacedSlots` input, `slotPlaced` output, side panel, selection state |
| `frontend/src/app/features/plots/plot-photo-overlay.component.scss` | Side panel + chip styles |
| `frontend/src/app/features/plots/plot-detail.page.ts` | Wire `unplacedSlots`, handle `slotPlaced`, fix `onRemovePhotoSlot`, pass `hasPhotoPlacement` to grid |

---

## Task 1: Photo badge on GardenGridSlotComponent

**Files:**
- Modify: `frontend/src/app/shared/components/garden-grid-slot/garden-grid-slot.component.ts`
- Modify: `frontend/src/app/shared/components/garden-grid-slot/garden-grid-slot.component.scss`

- [ ] **Step 1: Add `hasPhotoPlacement` input and badge markup**

  Open `garden-grid-slot.component.ts`. Inside the filled-slot `<button class="garden-grid-slot__content">` block, add the badge immediately after the `@if (germinationDate !== undefined)` block:

  ```typescript
  @if (hasPhotoPlacement) {
    <span class="garden-grid-slot__photo-badge" aria-label="Also placed on plot photo">
      <span class="material-symbols-outlined">photo_camera</span>
    </span>
  }
  ```

  Add the input to the class:

  ```typescript
  @Input() hasPhotoPlacement = false;
  ```

  Full updated class signature (inputs only — do not remove existing logic):

  ```typescript
  @Input() crop?: GridCropInfo;
  @Input() empty = false;
  @Input() germinationDate?: string | null;
  @Input() hasPhotoPlacement = false;
  @Output() slotClicked = new EventEmitter<void>();
  @Output() slotRemoveRequested = new EventEmitter<void>();
  ```

- [ ] **Step 2: Add badge styles**

  In `garden-grid-slot.component.scss`, inside the `.garden-grid-slot { }` block, add after the `&__press-feedback` block:

  ```scss
  &__photo-badge {
    position: absolute;
    bottom: var(--space-1);
    right: var(--space-1);
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--radius-full);
    background: var(--color-info-container);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    .material-symbols-outlined {
      font-size: var(--icon-size-sm);
      color: var(--color-info);
    }
  }
  ```

  > Note: the badge is `bottom` / `right` so it does not conflict with the `__remove-btn` which sits `top` / `right`.

- [ ] **Step 3: Verify visually**

  In `plot-detail.page.ts`, temporarily add `hasPhotoPlacement="true"` to one `<app-garden-grid-slot>` in the template. Run `ng serve` (or confirm the dev server is running at `http://localhost:4200`), open a plot with a grid view, and confirm the camera badge appears bottom-right of the cell. Remove the temporary attribute after confirming.

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/app/shared/components/garden-grid-slot/garden-grid-slot.component.ts \
          frontend/src/app/shared/components/garden-grid-slot/garden-grid-slot.component.scss
  git commit -m "feat: add hasPhotoPlacement badge to GardenGridSlotComponent"
  ```

---

## Task 2: Side panel and slotPlaced output in PlotPhotoOverlayComponent

**Files:**
- Modify: `frontend/src/app/features/plots/plot-photo-overlay.component.ts`
- Modify: `frontend/src/app/features/plots/plot-photo-overlay.component.scss`

- [ ] **Step 1: Add inputs, output, and selection state to the component class**

  In `plot-photo-overlay.component.ts`, update the class to add:

  ```typescript
  @Input() unplacedSlots: PlotSlot[] = [];
  @Output() slotPlaced = new EventEmitter<{ slot: PlotSlot; rect: PhotoRect }>();

  selectedUnplacedSlot: PlotSlot | null = null;
  ```

  Update `onPointerUp` so that when a rect is completed and `selectedUnplacedSlot` is set, emit `slotPlaced` instead of `newRectDrawn`:

  ```typescript
  onPointerUp(event: PointerEvent): void {
    if (!this.drawing || event.pointerId !== this.pointerId) return;
    event.preventDefault();
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const curX = (event.clientX - rect.left) / rect.width * 100;
    const curY = (event.clientY - rect.top) / rect.height * 100;
    const final = this.buildRect(this.startX, this.startY, curX, curY);
    this.cancelDraw();
    if (final.w_pct >= 2 && final.h_pct >= 2) {
      if (this.selectedUnplacedSlot) {
        this.slotPlaced.emit({ slot: this.selectedUnplacedSlot, rect: final });
        this.selectedUnplacedSlot = null;
        this.cdr.markForCheck();
      } else {
        this.newRectDrawn.emit(final);
      }
    }
  }
  ```

  Add a method to toggle chip selection:

  ```typescript
  selectUnplacedSlot(slot: PlotSlot): void {
    this.selectedUnplacedSlot = this.selectedUnplacedSlot?.id === slot.id ? null : slot;
    this.cdr.markForCheck();
  }
  ```

- [ ] **Step 2: Update the template to wrap photo + side panel**

  Replace the existing root `<div #container class="photo-overlay" ...>` with a wrapper that puts the photo container and the side panel side by side. The `#container` ref (used for pointer capture and bounding rect) must stay on the inner photo div, not the outer wrapper.

  New template structure:

  ```html
  <div class="photo-overlay-wrapper">
    <div
      #container
      class="photo-overlay"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="cancelDraw()"
    >
      <img [src]="photoUrl" class="photo-overlay__img" draggable="false" />

      @for (slot of slots; track slot.id) {
        <div
          class="photo-slot"
          [class.photo-slot--occupied]="!!slot.crop"
          [ngStyle]="slotStyle(slot)"
          (click)="onSlotClick($event, slot)"
        >
          <span class="photo-slot__label">{{ slot.crop?.name ?? '?' }}</span>
          <button
            class="photo-slot__remove"
            aria-label="Remove slot"
            (click)="onRemoveClick($event, slot)"
          >×</button>
        </div>
      }

      @if (drawing && preview) {
        <div class="photo-slot photo-slot--preview" [ngStyle]="previewStyle()"></div>
      }
    </div>

    @if (unplacedSlots.length > 0) {
      <div class="photo-unplaced-panel">
        <span class="photo-unplaced-panel__label">UNPLACED</span>
        <div class="photo-unplaced-panel__chips">
          @for (slot of unplacedSlots; track slot.id) {
            <button
              type="button"
              class="photo-unplaced-chip"
              [class.photo-unplaced-chip--selected]="selectedUnplacedSlot?.id === slot.id"
              (click)="selectUnplacedSlot(slot)"
              [attr.aria-label]="'Place ' + (slot.crop?.name ?? 'crop') + ' on photo'"
              [attr.aria-pressed]="selectedUnplacedSlot?.id === slot.id"
            >
              <span class="photo-unplaced-chip__name">{{ slot.crop?.name ?? '?' }}</span>
              @if (selectedUnplacedSlot?.id === slot.id) {
                <span class="photo-unplaced-chip__hint">PLACE</span>
              }
            </button>
          }
        </div>
        <span class="photo-unplaced-panel__counter">
          {{ slots.length }} of {{ slots.length + unplacedSlots.length }} placed
        </span>
      </div>
    }
  </div>
  ```

- [ ] **Step 3: Add styles for wrapper, panel, and chips**

  In `plot-photo-overlay.component.scss`, add at the end of the file:

  ```scss
  .photo-overlay-wrapper {
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
    width: 100%;

    .photo-overlay {
      flex: 1;
      min-width: 0;
    }
  }

  .photo-unplaced-panel {
    width: 5rem;
    flex-shrink: 0;
    background: var(--color-surface-container-low);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    align-items: stretch;

    &__label {
      @include type-label-sm;
      color: var(--color-secondary);
      text-align: center;
    }

    &__chips {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    &__counter {
      @include type-label-sm;
      color: var(--color-on-surface-variant);
      text-align: center;
      border-top: none; // surface tier shift is enough — no divider line
      padding-top: var(--space-2);
    }
  }

  .photo-unplaced-chip {
    width: 100%;
    min-height: 2.75rem;
    padding: var(--space-2) var(--space-1);
    border-radius: var(--radius-full);
    border: 0.0625rem dashed var(--color-outline-variant);
    background: var(--color-surface-container-lowest);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    transition: background-color var(--duration-quick) var(--ease-standard),
                border-color var(--duration-quick) var(--ease-standard);

    &:focus-visible {
      outline: 0.125rem solid var(--color-primary);
      outline-offset: 0.125rem;
      border-radius: var(--radius-full);
    }

    &__name {
      @include type-label-sm;
      color: var(--color-on-surface);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    &__hint {
      @include type-label-sm;
      color: var(--color-primary);
    }

    &--selected {
      background: var(--color-primary-container);
      border: 0.125rem solid var(--color-primary);

      .photo-unplaced-chip__name {
        color: var(--color-on-primary-container);
      }
    }
  }
  ```

  Also add `@use 'theme/mixins' as *;` at the top of the SCSS file if not already present (it already is).

- [ ] **Step 4: Verify photo mode with unplaced slots**

  Open a plot that has both grid slots and a plot photo. Switch to photo mode. Confirm:
  1. The side panel appears to the right of the photo listing grid-only slots.
  2. Tapping a chip highlights it (selected state).
  3. Drawing a rect on the photo while a chip is selected emits `slotPlaced` (check browser console briefly if needed — full wiring is in Task 3).
  4. Tapping the selected chip again deselects it.
  5. Drawing a rect with no chip selected still fires the crop picker (existing behaviour).

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/app/features/plots/plot-photo-overlay.component.ts \
          frontend/src/app/features/plots/plot-photo-overlay.component.scss
  git commit -m "feat: add unplaced slots panel and slotPlaced output to PlotPhotoOverlayComponent"
  ```

---

## Task 3: Wire everything in PlotDetailPage

**Files:**
- Modify: `frontend/src/app/features/plots/plot-detail.page.ts`

- [ ] **Step 1: Add `unplacedSlots` computed signal**

  In `plot-detail.page.ts`, after the existing `readonly photoSlots` computed signal add:

  ```typescript
  readonly unplacedSlots = computed(() =>
    this.slots().filter(s => s.row != null && s.x_pct == null)
  );
  ```

- [ ] **Step 2: Pass `unplacedSlots` and handle `slotPlaced` in the template**

  Find the `<app-plot-photo-overlay>` element in the template. Update it:

  ```html
  <app-plot-photo-overlay
    [photoUrl]="uploadsBase + plot.photo_url!"
    [slots]="photoSlots()"
    [unplacedSlots]="unplacedSlots()"
    [isSeedlingTray]="isSeedlingTray()"
    (slotClicked)="onPhotoSlotClick(plot.id, $event)"
    (slotRemoveRequested)="onRemovePhotoSlot(plot.id, $event)"
    (newRectDrawn)="onNewPhotoRect(plot.id, $event)"
    (slotPlaced)="onSlotPlacedOnPhoto(plot.id, $event)"
  />
  ```

- [ ] **Step 3: Implement `onSlotPlacedOnPhoto`**

  Add the method to the class:

  ```typescript
  onSlotPlacedOnPhoto(plotId: string, event: { slot: PlotSlot; rect: PhotoRect }): void {
    this.store.dispatch(PlotsActions.updateSlot({
      plotId,
      slotId: event.slot.id,
      payload: {
        x_pct: event.rect.x_pct,
        y_pct: event.rect.y_pct,
        w_pct: event.rect.w_pct,
        h_pct: event.rect.h_pct,
      },
    }));
  }
  ```

  Ensure `PhotoRect` is imported from `plot-photo-overlay.component.ts` — it's already imported via `PlotPhotoOverlayComponent`, but the type itself must be in the import list if referenced directly. Add to the existing import line:

  ```typescript
  import { PlotPhotoOverlayComponent, PhotoRect } from './plot-photo-overlay.component';
  ```

- [ ] **Step 4: Fix `onRemovePhotoSlot` to clear coords instead of deleting for grid slots**

  Replace the existing `onRemovePhotoSlot` method:

  ```typescript
  async onRemovePhotoSlot(plotId: string, slot: PlotSlot): Promise<void> {
    if (!slot.id) return;

    if (slot.row != null) {
      // Slot also exists in the grid — only clear photo coords, don't delete
      this.store.dispatch(PlotsActions.updateSlot({
        plotId,
        slotId: slot.id,
        payload: { x_pct: null, y_pct: null, w_pct: null, h_pct: null },
      }));
      return;
    }

    // Photo-only slot — confirm then delete
    const cropName = slot.crop?.name ?? 'this slot';
    const alertEl = await this.alert.create({
      header: 'Remove slot?',
      message: `Remove ${cropName} from this position?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(PlotsActions.deleteSlot({ plotId, slotId: slot.id }));
          },
        },
      ],
    });
    await alertEl.present();
  }
  ```

- [ ] **Step 5: Pass `hasPhotoPlacement` to grid cells**

  In the `buildGrid` method, the returned `GridCell` interface needs a `hasPhotoPlacement` field. Update the interface:

  ```typescript
  interface GridCell {
    key: string;
    row: number;
    col: number;
    slotId?: string;
    germination_date?: string | null;
    hasPhotoPlacement?: boolean;
    crop?: GridCropInfo;
  }
  ```

  In `buildGrid`, add the field to the pushed cell:

  ```typescript
  cells.push({
    key: `${r}-${c}`,
    row: r,
    col: c,
    slotId: slot?.id,
    germination_date: slot?.germination_date ?? null,
    hasPhotoPlacement: slot ? slot.x_pct != null : false,
    crop: slot?.crop
      ? {
          name: slot.crop.name,
          latinName: slot.crop.latin_name,
          imageUrl: slot.crop.thumbnail_url ?? '',
          progress: this.growthProgress(slot.sow_date, slot.crop.days_to_harvest),
        }
      : undefined,
  });
  ```

  In the template, pass it to `<app-garden-grid-slot>`:

  ```html
  <app-garden-grid-slot
    [crop]="cell.crop"
    [empty]="!cell.crop"
    [germinationDate]="isSeedlingTray() ? cell.germination_date : undefined"
    [hasPhotoPlacement]="cell.hasPhotoPlacement ?? false"
    (slotClicked)="onSlotClick(plot.id, cell)"
    (slotRemoveRequested)="onRemoveSlot(plot.id, cell)"
  />
  ```

- [ ] **Step 6: End-to-end verification**

  With the dev server running:

  1. Open a plot that has a grid layout and a plot photo uploaded.
  2. In grid view: confirm no camera badge yet on any cell (no slots have photo coords).
  3. Switch to photo mode: confirm the side panel lists all grid slots.
  4. Tap a crop chip in the side panel (it should highlight in `--color-primary-container`).
  5. Draw a rect on the photo → the slot should appear as a placed slot on the photo and disappear from the side panel.
  6. Switch back to grid view: the placed slot should now show the camera badge (bottom-right, `--color-info-container` circle).
  7. Switch back to photo mode: tap ✕ on the placed slot → it should return to the side panel without a confirmation dialog (non-destructive).
  8. Draw a rect on the photo with NO chip selected → crop picker opens as before.
  9. Test a photo-only slot (row is null): tap ✕ → confirmation dialog appears → delete removes the slot entirely.

- [ ] **Step 7: Commit**

  ```bash
  git add frontend/src/app/features/plots/plot-detail.page.ts
  git commit -m "feat: wire photo/grid sync — unplaced panel, slotPlaced handler, grid badge"
  ```

---

## Task 4: Backend — support null photo coords in updateSlot PATCH

**Files:**
- Verify: `backend/app/schemas/plot_slot.py`
- Verify: `backend/app/api/v1/endpoints/plots.py`

The backend PATCH `/plots/{plot_id}/slots/{slot_id}` must accept `x_pct: null` to clear photo coordinates. Verify this is already handled before marking done.

- [ ] **Step 1: Confirm `PlotSlotUpdate` schema accepts null photo coords**

  Open `backend/app/schemas/plot_slot.py`. Confirm `PlotSlotUpdate` includes:

  ```python
  x_pct: float | None = None
  y_pct: float | None = None
  w_pct: float | None = None
  h_pct: float | None = None
  ```

  If these fields are absent, add them. If present, verify they are `float | None` (not just `float`).

- [ ] **Step 2: Confirm the PATCH endpoint passes None values through to the model**

  In the PATCH handler in `plots.py`, confirm the update loop uses `model_dump(exclude_unset=True)` (Pydantic v2) or `dict(exclude_unset=True)` (Pydantic v1), so that fields explicitly set to `None` in the payload are written to the DB (not skipped as "unset").

  The distinction: `exclude_unset=True` keeps explicit `None` values. `exclude_none=True` would drop them — that is wrong here.

  If the endpoint uses `exclude_none=True`, change it to `exclude_unset=True`.

- [ ] **Step 3: Commit if any backend changes were needed**

  ```bash
  git add backend/app/schemas/plot_slot.py backend/app/api/v1/endpoints/plots.py
  git commit -m "fix: allow null photo coords in PlotSlot PATCH endpoint"
  ```

  If no changes were needed, skip this step.

---

## Task 5: Local DB — updateSlotLocal supports null photo coords

**Files:**
- Verify: `frontend/src/app/core/db/local-db.service.ts`

The `updateSlotLocal` method writes a partial update to SQLite. Verify it correctly writes `NULL` for photo coord fields when set to `null`.

- [ ] **Step 1: Check updateSlotLocal implementation**

  Open `local-db.service.ts` and find `updateSlotLocal`. Confirm it builds a dynamic `UPDATE` statement from the partial payload keys and correctly handles `null` values (they should write SQL `NULL`, not the string `"null"`).

  If it uses a prepared statement with named parameters, `null` in JavaScript correctly maps to SQL `NULL` in `@capacitor-community/sqlite`. No change needed if this is the case.

  If it serialises values via `JSON.stringify` before storing, photo coord `null` values will be stored as the string `"null"` — that is a bug. Fix by ensuring numeric/null fields bypass JSON serialisation.

- [ ] **Step 2: Manual smoke test**

  After placing a grid slot on the photo and then removing it from the photo (clearing coords), reload the page (F5). Verify the slot still appears in the unplaced panel (i.e., `x_pct` is truly `null` in SQLite, not `"null"`).

- [ ] **Step 3: Commit if any DB changes were needed**

  ```bash
  git add frontend/src/app/core/db/local-db.service.ts
  git commit -m "fix: ensure null photo coords write SQL NULL in updateSlotLocal"
  ```

  If no changes were needed, skip this step.
