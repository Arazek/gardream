# 02 — Home Dashboard

**Route:** `/tabs/home`
**Feature folder:** `frontend/src/app/features/home/`

The first screen after login. Task-focused daily overview.

---

## Sections (top → bottom)

### 1. Top app bar
`TopAppBarComponent` — logo left, avatar right (from Keycloak profile).

### 2. Welcome hero
`HeroSectionComponent` — "Good morning, [firstName]" + current date subtitle.
Date formatted as "Tuesday, 24 March".

### 3. Weather widget
`WeatherWidgetComponent` — loaded from NgRx `weather` slice.
Rain days surface a "Skip watering today?" inline alert below the widget.

### 4. Today's tasks
Heading: "Today" (`type-heading-3`).
List of `TaskListItemComponent` rows — tasks due today, sorted overdue first.
Empty state: `EmptyStateComponent` ("No tasks today — enjoy the garden.").
"View all" link → `/tabs/calendar`.

### 5. Plot cards
Heading: "Your Plots" (`type-heading-3`) + "Add" icon button → `/tabs/plots/new`.
`PlotCardComponent` (feature component, not shared) per plot.
Horizontal scroll on mobile if >2 plots.

### 6. Garden Intelligence panel
`InsightCardComponent` — hardcoded insight copy, rotated daily from a fixed set.
CTA: "View plots" → `/tabs/plots`.

### 7. Bottom nav bar
`BottomNavBarComponent` — 5 tabs, Home active.

---

## Feature components

### `WelcomeHeroComponent`
Wraps `HeroSectionComponent`.
Inputs: `user: UserProfile` (from auth store).
Reads `firstName` from Keycloak token claims.

### `PlotCardComponent`
Asymmetric layout: left panel (60%) image thumbnail, right panel (40%) info.
Info panel: plot name (`type-heading-4`), crop count (`type-body-sm`), next task label (`type-label`), `ProgressBarComponent` (overall health), two ghost buttons ("View" / "Add crop").
Alternates image-left / image-right on even/odd index.

### `GardenIntelligencePanelComponent`
Wraps `InsightCardComponent`.
Insight copy pool (hardcoded array, pick by day-of-year % pool.length):
- "You have 3 crops approaching harvest window this week."
- "Basil thrives when kept above 15°C — bring it indoors tonight."
- "Rotate your brassicas next season to prevent soil depletion."
- "Your tomatoes are on track. Keep up the weekly feed."
- (+ 6 more)

---

## NgRx store slice — `home`

```
features/home/store/
  home.actions.ts      — loadDashboard, loadDashboardSuccess, loadDashboardFailure
  home.effects.ts      — dispatches parallel: loadPlots + loadTodayTasks + loadWeather
  home.reducer.ts
  home.selectors.ts
  home.state.ts        — { plots, todayTasks, weather, status }
```

Reuses `plots`, `tasks`, `weather` slices — home store orchestrates loading only.

---

## API calls on load

| Call | Endpoint |
|---|---|
| Today's tasks | `GET /api/v1/tasks?date=today` |
| User's plots | `GET /api/v1/plots` |
| Weather | `GET /api/v1/weather?lat=&lon=` (lat/lon from browser geolocation or stored profile) |
