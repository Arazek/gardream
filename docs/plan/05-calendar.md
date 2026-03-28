# 05 — Calendar

**Route:** `/tabs/calendar`
**Feature folder:** `frontend/src/app/features/calendar/`

Visual month overview with per-day task lists.

---

## Layout

```
TopAppBarComponent (title: "Calendar", trailing: month/year label)
─────────────────────────────────────────────
CalendarGridComponent        ← month grid, tap day to select
─────────────────────────────────────────────
DailyTaskListComponent       ← task list for selected day
─────────────────────────────────────────────
BottomNavBarComponent
```

---

## Feature components

### `CalendarGridComponent`
7-column grid, Mon–Sun headers.
Each day cell:
- Day number (`type-label-lg`)
- Today: circle highlight (`--color-primary`, `--radius-full`)
- Task dot markers: up to 3 colored dots below the number
  - Green dot = has tasks
  - Red dot = has overdue tasks
  - Blue dot = has harvest task
- Selected day: `--color-surface-container-high` bg

Inputs: `year: number`, `month: number`, `taskSummaries: DayTaskSummary[]`, `selectedDate: string`
Outputs: `dateSelected: EventEmitter<string>`

### `DailyTaskListComponent`
Heading: selected date formatted as "Tuesday, 24 March" (`type-heading-4`).
List of `TaskListItemComponent` rows — sorted: overdue → pending → completed.
Grouped by plot name (section label in `type-label`).
Empty state: `EmptyStateComponent` — "No tasks for this day."

Inputs: `date: string`, `tasks: Task[]`
Outputs: `taskCompleted: EventEmitter<{ id: string; completed: boolean }>`

---

## Interactions

| Action | Result |
|---|---|
| Tap a day | `selectedDate` updates, `DailyTaskList` refreshes below |
| Swipe left/right on grid | Navigate to next/previous month |
| Tap `TaskListItem` checkbox | Dispatches `completeTask` action inline |
| Tap task row | Opens task detail sheet (edit due date / add note / delete) |

---

## NgRx store slice — `calendar`

```
features/calendar/store/
  calendar.actions.ts   — selectMonth, selectDate, loadMonthTasks, loadMonthTasksSuccess
  calendar.effects.ts   — loads tasks for the full month on selectMonth
  calendar.reducer.ts
  calendar.selectors.ts — selectSelectedDate, selectTasksForDate, selectDayTaskSummaries
  calendar.state.ts     — { selectedDate, selectedMonth, tasks: Task[], status }
```

On `selectMonth` → effect calls `GET /api/v1/tasks?from=YYYY-MM-01&to=YYYY-MM-31`.
All tasks for the month loaded at once; day filtering done client-side in selectors.

---

## API calls

| Action | Endpoint |
|---|---|
| Load month tasks | `GET /api/v1/tasks?from=YYYY-MM-01&to=YYYY-MM-31` |
| Complete task | `PUT /api/v1/tasks/:id` |
