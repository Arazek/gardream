# The Digital Arboretum — Feature Plan Overview

## Core loop

```
Create Plot → Assign Crops → Generate Tasks → Execute Tasks
```

## Decisions

| Topic | Decision | Rationale |
|---|---|---|
| Weather API | Open-Meteo | No API key, 10k calls/day free forever, global coverage, 16-day forecast, precipitation probability |
| Crop data | Hand-curated starter dataset (~25 crops) | All external APIs (Perenual, OpenFarm) still require manual task-schedule curation. Faster and more reliable for MVP. Perenual can be added later for images + extended catalogue. |
| Notifications | In-app + Email + Capacitor Push | All three. In-app for web, email for re-engagement, push for native (iOS/Android via FCM). |
| AI insights | Hardcoded copy | Real integration post-MVP. |

---

## Build order

| # | File | Domain |
|---|---|---|
| 01 | `01-shared-components.md` | Shared UI primitives (Angular) |
| 02 | `02-home-dashboard.md` | Home tab — daily overview |
| 03 | `03-plot-planner.md` | Plot creation + grid editor |
| 04 | `04-task-engine.md` | Task generation + completion |
| 05 | `05-calendar.md` | Calendar tab |
| 06 | `06-crop-encyclopedia.md` | Crop library + detail |
| 07 | `07-settings-profile.md` | Settings + notifications toggle |
| 08 | `08-backend-models.md` | DB models + Alembic migrations |
| 09 | `09-backend-api.md` | FastAPI endpoints |
| 10 | `10-weather-integration.md` | Open-Meteo wrapper |
| 11 | `11-notifications.md` | In-app + email + push |
| 12 | `12-crop-seed-data.md` | Starter crop dataset |

---

## Tab structure

| Tab | Route | Icon |
|---|---|---|
| Home | `/tabs/home` | `home` |
| Plots | `/tabs/plots` | `grid_view` |
| Calendar | `/tabs/calendar` | `calendar_month` |
| Library | `/tabs/library` | `menu_book` |
| Settings | `/tabs/settings` | `person` |
