# Development Summary

## Overview

This document summarises the development work done on the Garden Task Planner — a mobile app for hobbyist gardeners to plan plots, track crops, and manage watering/fertilisation tasks automatically.

---

## Features Delivered

### Per-Crop Watering & Fertilisation Schedule
**Spec:** `docs/superpowers/specs/2026-04-10-per-crop-watering-fertilisation-schedule.md`  
**Plan:** `docs/superpowers/plans/2026-04-10-per-crop-watering-fertilisation-schedule.md`

Users can now override the watering and fertilisation schedule per individual crop, instead of being bound to the plot-level default.

**What was built:**
- New `ScheduleSectionComponent` — reusable toggle + day-of-week picker + cadence chips (every 1/2/3/4 weeks). Appears in both the specimen detail page and the planting flow.
- Specimen detail page — two schedule sections (WATERING, FERTILISATION) inserted between GROWTH and STAGE. Toggling off "Use plot default" reveals the custom day picker and cadence selector. Changes are applied immediately and future uncompleted tasks are regenerated server-side.
- Planting flow (`CropPickerComponent`) — two-step: pick a crop from the grid, then configure its schedule before planting. Plot defaults are pre-filled with toggle ON.
- Plot creation form — fertilisation day picker added, mirroring the existing watering days picker.

**Backend changes:**
- DB migration: `fertilise_days` (ARRAY of int) added to `plots`; `watering_days_override`, `watering_interval_weeks`, `fertilise_days_override`, `fertilise_interval_weeks` added to `plot_slots`.
- Task generator updated: resolves effective schedule from slot overrides → plot defaults; applies weekday filter + cadence (`weeks_since_sow % interval == 0`).
- `PATCH /plots/{id}/slots/{id}` — detects schedule field changes and deletes/regenerates all future uncompleted water and fertilise tasks from today.

**Data model:**
```
PlotSlot
  watering_days_override  int[] | null   # null = use plot.watering_days
  watering_interval_weeks int            # default 1
  fertilise_days_override int[] | null   # null = use plot.fertilise_days
  fertilise_interval_weeks int           # default 1

Plot
  fertilise_days          int[]          # default []
```

---

### Notification Centre & Rain Alerts
Real-time notifications for gardening events, including rain alerts that suppress watering tasks when rain is forecast. Notification button added to all page top bars.

---

### Authentication — Keycloak Session Persistence
Fixed a bug where users were redirected to `/login` on every page reload.

**Root cause:** `app.config.ts` wrapped `keycloak.init()` in a `Promise.race` against a timeout. With `onLoad: 'check-sso'`, Keycloak uses a silent iframe that sometimes takes longer than the timeout, causing the app to initialise as unauthenticated.

**Fix:** Migrated from deprecated `KeycloakAngularModule` + manual `APP_INITIALIZER` to `provideKeycloak()` (keycloak-angular v19 API). Also migrated `auth.guard.ts`, `login.guard.ts`, `auth.interceptor.ts`, and `auth.service.ts` from the deprecated `KeycloakService` wrapper to injecting the raw `Keycloak` instance directly. Added `silent-check-sso.html` and registered it in `angular.json`.

---

### Crop Stages Dashboard Bug Fix
Fixed a bug where only 1 of N crops showed in the Crop Stages dashboard widget.

**Root cause:** The `loadSlots$` NgRx effect used `switchMap`, which cancels in-flight requests when a new action of the same type arrives. Since multiple `loadSlots` actions fire concurrently (one per plot), all but the last were cancelled.

**Fix:** Changed `switchMap` → `mergeMap` so all concurrent slot requests complete independently.

---

### Lifecycle Cleanup (Memory Leak Prevention)
Added `ngOnDestroy` / `ionViewWillLeave` cleanup across all 9 route pages (home, plot detail, plot new, specimen detail, calendar, crops, settings, profile, notifications) to unsubscribe observables and prevent memory leaks on navigation.

---

## Architecture Notes

- **Frontend:** Angular 19 standalone components, NgRx signals store, Ionic 8, `ChangeDetectionStrategy.OnPush` + `computed()` signals for reactive UI updates.
- **Backend:** FastAPI + SQLAlchemy async + Alembic migrations, PostgreSQL.
- **Auth:** Keycloak with `check-sso` + silent iframe. Raw `Keycloak` from `keycloak-js` injected directly (no deprecated wrapper).
- **Task generation:** 90-day rolling window, tasks regenerated on schedule change. Completed past tasks are never modified.

---

## Key Files

| Area | File |
|---|---|
| Schedule component | `frontend/src/app/shared/components/schedule-section/` |
| Specimen detail | `frontend/src/app/features/plots/specimen-detail.page.ts` |
| Planting flow | `frontend/src/app/features/plots/components/crop-picker/` |
| NgRx store | `frontend/src/app/features/plots/store/` |
| Task generator | `backend/app/services/task_generator.py` |
| Slot endpoint | `backend/app/api/v1/endpoints/plots.py` |
| Auth config | `frontend/src/app/app.config.ts` |
| DB migration | `backend/app/alembic/versions/89cd97ad7a08_add_per_crop_schedule_fields.py` |
