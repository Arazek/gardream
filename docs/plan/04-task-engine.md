# 04 — Task Engine

Tasks are the core of the product. They are auto-generated from crop data when a crop is assigned to a plot slot, and can be manually edited or marked complete.

---

## Task types

| Type | Icon | Generated from |
|---|---|---|
| `water` | `water_drop` | Crop `watering_frequency_days` × plot watering schedule |
| `fertilise` | `compost` | Crop `fertilise_frequency_days` |
| `prune` | `content_cut` | Crop `prune_frequency_days` (if set) |
| `harvest` | `grocery` | Crop `days_to_harvest` from `sow_date` |
| `check` | `search` | Weekly crop health check (all crops) |
| `custom` | `edit_note` | User-created |

---

## Generation logic (backend)

Triggered by: `POST /api/v1/plots/:id/slots` (crop assigned).

```
sow_date = slot.sow_date
crop = slot.crop

# Watering — generate for next 90 days on plot's watering_days schedule
for each day in next 90 days:
    if day.weekday in plot.watering_days:
        create Task(type=water, due_date=day, plot_slot_id=slot.id)

# Fertilise — every N days from sow_date for 90 days
for i in range(0, 90, crop.fertilise_frequency_days):
    create Task(type=fertilise, due_date=sow_date + i days)

# Prune — if crop has prune_frequency_days
if crop.prune_frequency_days:
    for i in range(crop.prune_start_day, 90, crop.prune_frequency_days):
        create Task(type=prune, due_date=sow_date + i days)

# Harvest — single task
create Task(type=harvest, due_date=sow_date + crop.days_to_harvest)
```

90-day rolling window: a background job re-generates tasks 30 days before the window expires (future feature — for MVP generate on assignment only).

---

## Task completion

- `PUT /api/v1/tasks/:id` with `{ completed: true, completed_at: ISO timestamp }`
- Completion is stored; task remains visible (greyed) on the day it was due.
- Completing a recurring task (water, fertilise) does NOT auto-create the next one — the next occurrence was already pre-generated.

---

## Overdue logic

A task is overdue if `due_date < today && completed = false`.
Overdue tasks surface:
- On Home dashboard — shown first in today's list with tertiary (red) icon variant.
- On Calendar — shown with a red dot marker on the past day.

---

## Weather-based watering skip

When weather forecast shows `precipitation_sum > 5mm` for a given day:
- That day's `water` tasks get a `suggested_skip: true` flag (computed client-side from weather store, not stored in DB).
- Home dashboard shows an `InlineAlertComponent` — "Rain expected today — skip watering?"
- User can dismiss or act; the task still exists and must be explicitly completed or skipped.

---

## Frontend — task surfaces

Tasks appear in three places. They are NOT a dedicated tab.

| Surface | Where | Component |
|---|---|---|
| Today's tasks | Home tab | `TaskListItemComponent` |
| Day tasks | Calendar tab | `TaskListItemComponent` |
| Slot tasks | Plot detail (future) | `TaskListItemComponent` |

---

## Manual task creation

Available from Home FAB or "Add" menu.
Form: type selector, plot selector, due date, optional note.
`POST /api/v1/tasks` with `type=custom`.

---

## NgRx store slice — `tasks`

```
features/tasks/store/
  tasks.actions.ts     — loadTasks, loadTasksSuccess, completeTask,
                         completeTaskSuccess, createTask, updateTask, deleteTask
  tasks.effects.ts
  tasks.reducer.ts
  tasks.selectors.ts   — selectTasksByDate, selectTodayTasks, selectOverdueTasks,
                         selectTasksByPlotSlot
  tasks.state.ts       — { tasks: Task[], status }
```

---

## API calls

| Action | Endpoint |
|---|---|
| Load tasks (by date range) | `GET /api/v1/tasks?from=&to=` |
| Load today's tasks | `GET /api/v1/tasks?date=today` |
| Complete task | `PUT /api/v1/tasks/:id` `{ completed: true }` |
| Uncomplete task | `PUT /api/v1/tasks/:id` `{ completed: false }` |
| Create manual task | `POST /api/v1/tasks` |
| Update task | `PUT /api/v1/tasks/:id` |
| Delete task | `DELETE /api/v1/tasks/:id` |
