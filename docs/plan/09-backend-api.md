# 09 — Backend: API Endpoints

Base path: `/api/v1/`. All endpoints protected (Bearer JWT) unless noted. Owner-scoped throughout — users only see their own data.

---

## Crops — read-only

| Method | Path | Description |
|---|---|---|
| GET | `/crops` | List all crops. Query: `?category=`, `?q=` (name/latin search) |
| GET | `/crops/:id` | Single crop detail |

No auth required (crops are public seed data).

---

## Plots

| Method | Path | Description |
|---|---|---|
| GET | `/plots` | List user's plots |
| POST | `/plots` | Create plot |
| GET | `/plots/:id` | Plot detail + slots |
| PUT | `/plots/:id` | Update plot metadata |
| DELETE | `/plots/:id` | Delete plot + cascade slots + tasks |

### POST `/plots` body
```json
{
  "name": "Raised Bed A",
  "plot_type": "raised_bed",
  "rows": 4,
  "cols": 6,
  "substrate": "loam",
  "watering_days": [0, 3, 5]
}
```

---

## Plot Slots

| Method | Path | Description |
|---|---|---|
| GET | `/plots/:id/slots` | All slots for a plot |
| POST | `/plots/:id/slots` | Assign crop to a slot → triggers task generation |
| DELETE | `/plots/:id/slots/:slotId` | Remove crop from slot → deletes future uncompleted tasks |

### POST `/plots/:id/slots` body
```json
{
  "crop_id": "uuid",
  "row": 0,
  "col": 2,
  "sow_date": "2026-03-24"
}
```

Side effect: triggers `TaskGenerationService.generate_for_slot(slot)` — creates all tasks for the next 90 days.

---

## Tasks

| Method | Path | Description |
|---|---|---|
| GET | `/tasks` | List user's tasks. Query: `?date=today`, `?from=`, `?to=`, `?plot_id=`, `?completed=` |
| POST | `/tasks` | Create manual (custom) task |
| PUT | `/tasks/:id` | Update task (complete, reschedule, add note) |
| DELETE | `/tasks/:id` | Delete task |

### GET `/tasks` response
```json
{
  "tasks": [
    {
      "id": "uuid",
      "type": "water",
      "title": "Water Tomatoes",
      "due_date": "2026-03-24",
      "completed": false,
      "plot_slot": {
        "id": "uuid",
        "crop": { "id": "uuid", "name": "Tomato", "thumbnail_url": "..." },
        "plot": { "id": "uuid", "name": "Raised Bed A" }
      }
    }
  ]
}
```

### PUT `/tasks/:id` body (complete)
```json
{ "completed": true, "completed_at": "2026-03-24T09:00:00Z" }
```

---

## Weather

| Method | Path | Description |
|---|---|---|
| GET | `/weather` | Current + 7-day forecast. Query: `?lat=`, `?lon=` |

Wraps Open-Meteo. Cached in memory for 1 hour (same coords). See `10-weather-integration.md`.

---

## Notification Settings

| Method | Path | Description |
|---|---|---|
| GET | `/notifications/settings` | Load user's notification prefs (creates default if none) |
| PUT | `/notifications/settings` | Update prefs |
| POST | `/notifications/push-token` | Register FCM device token |

---

## Services (backend, not endpoints)

### `TaskGenerationService`
`backend/app/services/task_generation.py`
Called by the slot assignment endpoint. Pure function — takes `slot`, `crop`, `plot` → returns list of `Task` objects to insert.

### `NotificationSchedulerService`
`backend/app/services/notification_scheduler.py`
APScheduler (or Celery-less cron via `asyncio`) runs at 8:00 AM and 7:00 PM UTC.
Queries users with `morning_reminder=True` / `evening_reminder=True` → builds task summary → sends email + FCM push.

### `WeatherService`
`backend/app/services/weather.py`
Wraps Open-Meteo API. In-memory TTL cache (1 hour). See `10-weather-integration.md`.

---

## Error responses

All errors follow:
```json
{ "detail": "Human-readable message", "code": "MACHINE_CODE" }
```

| HTTP | Code | Scenario |
|---|---|---|
| 401 | `UNAUTHORIZED` | Missing or expired token |
| 403 | `FORBIDDEN` | Resource belongs to another user |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `SLOT_OCCUPIED` | Plot slot already has a crop |
| 422 | `VALIDATION_ERROR` | Request body fails validation |
