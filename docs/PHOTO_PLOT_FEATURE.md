# Photo-Based Plot View

## Overview

Any plot can optionally have a background photo. When a photo is set, the plot detail page switches from the fixed rows×cols grid to a **photo overlay mode** where the user drags rectangles directly on the photo to mark slot positions. Plots without a photo are completely unaffected.

---

## How It Works

### Mode switch

`plot.photo_url` (nullable) is the single switch. A non-null value activates photo mode; `null` keeps the existing grid view.

### Slot coordinates

Photo slots use percentage-based coordinates (`x_pct`, `y_pct`, `w_pct`, `h_pct`) instead of `row`/`col`. The `row` and `col` columns were made nullable so photo slots can store `NULL` without violating the existing unique constraint — PostgreSQL does not consider `NULL = NULL`, so photo slots never collide.

### Drag-to-draw

`PlotPhotoOverlayComponent` uses the Pointer Events API (`pointerdown` / `pointermove` / `pointerup`) so it works for both mouse and touch. A rectangle must be at least 5% wide and 5% tall to be accepted; smaller drags are treated as taps and cancelled.

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/app/models/plot.py` | Added `photo_url: str \| None` column |
| `backend/app/models/plot_slot.py` | Made `row`/`col` nullable; added `x_pct`, `y_pct`, `w_pct`, `h_pct` float columns |
| `backend/alembic/versions/e5f6a7b8c9d0_add_photo_plot_support.py` | Migration: adds new columns, relaxes row/col nullability |
| `backend/app/schemas/plot.py` | Added `photo_url` to `PlotBase`, `PlotUpdate`, `PlotResponse` |
| `backend/app/schemas/plot_slot.py` | Made `row`/`col` optional in `PlotSlotCreate`/`PlotSlotResponse`; added pct fields |
| `backend/app/api/v1/endpoints/plots.py` | New `POST /{plot_id}/photo` upload endpoint; grid-bounds validation skipped for photo slots (`row is None`) |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/app/features/plots/store/plots.state.ts` | Added `photo_url` to `Plot`; made `row`/`col` optional, added pct fields to `PlotSlot`/`PlotSlotCreate` |
| `frontend/src/app/features/plots/store/plots.effects.ts` | Passes pct fields through when creating a slot; added `photo_url: null` to locally-constructed `Plot` objects |
| `frontend/src/app/core/api/plots-api.service.ts` | Added `uploadPlotPhoto(plotId, file)` — `POST /plots/{plotId}/photo` as multipart FormData |
| `frontend/src/app/core/db/local-db.service.ts` | Added `photo_url` to plots schema; added pct columns to plot_slots schema; bumped SQLite DB version to 3 with `ALTER TABLE` migrations; updated `upsertPlots` and `upsertSlots` to persist new fields |
| `frontend/src/app/features/plots/plot-photo-overlay.component.ts` | **New component** — renders photo with slot rectangles overlaid, handles drag-to-draw via pointer events |
| `frontend/src/app/features/plots/plot-photo-overlay.component.scss` | Styles for overlay, slot rectangles, preview, and remove button |
| `frontend/src/app/features/plots/plot-detail.page.ts` | Added `isPhotoMode` computed signal; camera icon in top bar triggers file input; `onNewPhotoRect` opens crop picker and dispatches `createSlot` with pct coords; `onPhotoSlotClick` navigates to specimen detail |
| `frontend/src/app/features/plots/specimen-detail.page.ts` | Guard against nullable `row`/`col` when building the title string |
| `frontend/proxy.conf.json` | Dev server proxy: forwards `/uploads/*` to the backend container so photos load in development |
| `frontend/Dockerfile` | Added `--proxy-config proxy.conf.json` to `ng serve` command |
| `docker-compose.yml` | Added `PathPrefix('/uploads')` to the backend Traefik router rule for production |

---

## Uploading a Photo

1. Open any plot detail page.
2. Tap the **camera icon** (top-right, next to notifications).
3. Choose an image from the device.
4. The backend saves the file to `/app/uploads/plots/{plot_id}/photo_{uuid}.ext` and returns the updated plot with `photo_url` set.
5. The frontend dispatches `updatePlotSuccess` — the store updates, `isPhotoMode` becomes `true`, and the page switches to the photo overlay view.

## Drawing a Slot

1. Press and drag on the photo to draw a rectangle (min 5%×5%).
2. Release — the crop picker opens (same sheet as grid mode).
3. Choose a crop, set sow date and schedule, tap **Plant**.
4. The slot appears as a labelled rectangle on the photo.

## Removing a Slot

Tap the **×** button on any slot rectangle → confirmation alert → slot deleted.

---

## Development Notes

- Photo uploads bypass the outbox (binary files can't be serialised to JSON). The upload hits the backend directly and the response is used to update the store.
- All other slot operations (create, delete, sync) go through the standard outbox → sync push path unchanged.
- In development, `/uploads` is proxied from the Vite/Angular dev server (`localhost:4200`) to the backend container (`gardream-backend-1:8000`). In production, Traefik routes both `/api` and `/uploads` to the backend.
