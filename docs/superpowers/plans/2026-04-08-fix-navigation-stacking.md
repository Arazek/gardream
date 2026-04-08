# Navigation Stacking Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix navigation stacking by implementing proper component lifecycle cleanup across all 6 route pages (home, plots, calendar, crops, settings, profile) so only one tab's content renders at a time.

**Architecture:** Replace unmanaged subscriptions and effects with Angular's `DestroyRef` + `takeUntilDestroyed()` pattern. Inject `DestroyRef` in constructor and pipe all subscriptions through `takeUntilDestroyed()`. This ensures automatic cleanup when components unmount, preventing stale component instances from staying in the DOM.

**Tech Stack:** Angular 17+, RxJS (takeUntilDestroyed), NgRx (store selectors), Ionic standalone components

---

## File Structure

**Route pages to modify (9 files total):**
- `frontend/src/app/features/home/home.page.ts` — Home tab
- `frontend/src/app/features/plots/plots.page.ts` — Plots list tab
- `frontend/src/app/features/plots/plot-detail.page.ts` — Plot detail child route
- `frontend/src/app/features/plots/plot-new.page.ts` — Create plot child route
- `frontend/src/app/features/plots/specimen-detail.page.ts` — Crop specimen detail child route
- `frontend/src/app/features/calendar/calendar.page.ts` — Calendar tab
- `frontend/src/app/features/crops/crops.page.ts` — Library (crops) tab
- `frontend/src/app/features/settings/settings.page.ts` — Settings tab
- `frontend/src/app/features/profile/profile.page.ts` — Profile tab

Each file: inject `DestroyRef`, apply `takeUntilDestroyed()` to all subscriptions, clean up or move `effect()` calls.

---

## Task 1: Fix home.page.ts

**Files:**
- Modify: `frontend/src/app/features/home/home.page.ts:1-50`
- Test: Manual navigation test (covered in Task 10)

- [ ] **Step 1: Add DestroyRef import**

Open `frontend/src/app/features/home/home.page.ts`. At the top, add `DestroyRef` to the Angular imports (line 1):

```typescript
import { Component, OnInit, inject, effect, DestroyRef } from '@angular/core';
```

- [ ] **Step 2: Add takeUntilDestroyed import**

In the same imports section, add:

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
```

- [ ] **Step 3: Inject DestroyRef in constructor**

Find the `HomePageComponent` class. Add a new line in the class to inject `DestroyRef`:

```typescript
export class HomePageComponent implements OnInit {
  readonly breakpoint = inject(BreakpointService);
  readonly store = inject(Store);
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  readonly destroy = inject(DestroyRef);  // Add this line
```

- [ ] **Step 4: Find and wrap all store subscriptions**

Search for all `.subscribe(` calls in `ngOnInit()`. For each subscription, add `.pipe(takeUntilDestroyed(this.destroy))` before `.subscribe()`.

Example: If you find:
```typescript
this.store.select(selectCurrentWeather).subscribe(weather => {
  this.weather = weather;
});
```

Change to:
```typescript
this.store.select(selectCurrentWeather)
  .pipe(takeUntilDestroyed(this.destroy))
  .subscribe(weather => {
    this.weather = weather;
  });
```

Apply this pattern to ALL `store.select()` subscriptions in the component.

- [ ] **Step 5: Verify the component compiles**

Run:
```bash
cd frontend && npm run build
```

Expected: Build completes without errors for `home.page.ts`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/home/home.page.ts
git commit -m "fix: add lifecycle cleanup to home page

Use DestroyRef and takeUntilDestroyed to automatically unsubscribe from store selectors when component unmounts. Prevents stale component instances from persisting in DOM.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Fix plots.page.ts

**Files:**
- Modify: `frontend/src/app/features/plots/plots.page.ts`

- [ ] **Step 1: Add imports**

Open `frontend/src/app/features/plots/plots.page.ts`. Update imports:

```typescript
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
```

- [ ] **Step 2: Inject DestroyRef**

In the component class, add:

```typescript
export class PlotsPage implements OnInit {
  // ... existing properties
  readonly destroy = inject(DestroyRef);
```

- [ ] **Step 3: Wrap all subscriptions with takeUntilDestroyed**

Find all `.subscribe(` calls in `ngOnInit()` and wrap with `.pipe(takeUntilDestroyed(this.destroy))`.

Example:
```typescript
this.store.select(selectAllPlots)
  .pipe(takeUntilDestroyed(this.destroy))
  .subscribe(plots => {
    this.plots = plots;
  });
```

- [ ] **Step 4: Check for effect() calls and verify they're in constructor**

If there are `effect()` calls in `ngOnInit()`, move them to the constructor so they auto-cleanup when the component destroys.

- [ ] **Step 5: Verify build**

```bash
cd frontend && npm run build
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/plots/plots.page.ts
git commit -m "fix: add lifecycle cleanup to plots page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Fix plot-detail.page.ts

**Files:**
- Modify: `frontend/src/app/features/plots/plot-detail.page.ts`

- [ ] **Step 1: Apply same pattern as Task 2**

1. Add `DestroyRef` and `takeUntilDestroyed` imports
2. Inject `DestroyRef` in class
3. Wrap all `.subscribe(` calls with `.pipe(takeUntilDestroyed(this.destroy))`
4. Move `effect()` calls to constructor if in `ngOnInit()`

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/plots/plot-detail.page.ts
git commit -m "fix: add lifecycle cleanup to plot detail page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Fix plot-new.page.ts

**Files:**
- Modify: `frontend/src/app/features/plots/plot-new.page.ts`

- [ ] **Step 1: Apply cleanup pattern**

Same as Task 2-3:
1. Add imports
2. Inject `DestroyRef`
3. Wrap subscriptions
4. Move effects to constructor

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/plots/plot-new.page.ts
git commit -m "fix: add lifecycle cleanup to plot new page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Fix specimen-detail.page.ts

**Files:**
- Modify: `frontend/src/app/features/plots/specimen-detail.page.ts`

- [ ] **Step 1: Apply cleanup pattern**

Same as previous tasks:
1. Add imports
2. Inject `DestroyRef`
3. Wrap subscriptions
4. Move effects to constructor

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/plots/specimen-detail.page.ts
git commit -m "fix: add lifecycle cleanup to specimen detail page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Fix calendar.page.ts

**Files:**
- Modify: `frontend/src/app/features/calendar/calendar.page.ts`

- [ ] **Step 1: Apply cleanup pattern**

1. Add imports: `DestroyRef`, `takeUntilDestroyed`
2. Inject `DestroyRef`
3. Wrap all `.subscribe(` with `.pipe(takeUntilDestroyed(this.destroy))`
4. Move any `effect()` calls to constructor

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/calendar/calendar.page.ts
git commit -m "fix: add lifecycle cleanup to calendar page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Fix crops.page.ts (Library tab)

**Files:**
- Modify: `frontend/src/app/features/crops/crops.page.ts:1-120`

This file has the most problems (unmanaged subscription at line 110 + unmanaged effect at line 116).

- [ ] **Step 1: Add imports**

```typescript
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
```

- [ ] **Step 2: Inject DestroyRef**

```typescript
export class CropsPage implements OnInit {
  // ... existing
  readonly destroy = inject(DestroyRef);
```

- [ ] **Step 3: Fix the subscription at line 110**

Find:
```typescript
this.store.select(selectFilteredCrops).subscribe(crops => {
  this.allFiltered = crops;
  this.applySearch();
});
```

Change to:
```typescript
this.store.select(selectFilteredCrops)
  .pipe(takeUntilDestroyed(this.destroy))
  .subscribe(crops => {
    this.allFiltered = crops;
    this.applySearch();
  });
```

- [ ] **Step 4: Move the effect() call to constructor**

Find the `effect()` call at line 116 in `ngOnInit()`. Cut it and paste it into the constructor (after `super()` if it's a class extending something, or just at the start of constructor body).

The effect should now be:
```typescript
constructor() {
  // ... other injections
  effect(() => {
    this.notifications = this.notificationService.notifications();
    this.updateTopBarBadge();
  });
}
```

Then remove the `ngOnInit()` method entirely if it's now empty, or keep it if other code needs it.

- [ ] **Step 5: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/crops/crops.page.ts
git commit -m "fix: add lifecycle cleanup to crops (library) page

Wrap unmanaged subscription with takeUntilDestroyed and move effect to constructor for proper cleanup. This was causing stacked content when navigating to Library tab.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Fix settings.page.ts

**Files:**
- Modify: `frontend/src/app/features/settings/settings.page.ts`

- [ ] **Step 1: Apply cleanup pattern**

1. Add imports
2. Inject `DestroyRef`
3. Wrap all subscriptions
4. Move effects to constructor

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/settings/settings.page.ts
git commit -m "fix: add lifecycle cleanup to settings page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Fix profile.page.ts

**Files:**
- Modify: `frontend/src/app/features/profile/profile.page.ts`

- [ ] **Step 1: Apply cleanup pattern**

1. Add imports
2. Inject `DestroyRef`
3. Wrap all subscriptions
4. Move effects to constructor

- [ ] **Step 2: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/profile/profile.page.ts
git commit -m "fix: add lifecycle cleanup to profile page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Manual Navigation Test

**Files:**
- Test: No files modified (manual testing only)

- [ ] **Step 1: Start the dev server**

```bash
cd frontend && npm run serve
```

Wait for the dev server to start and the app to be accessible at `http://localhost:4200`.

- [ ] **Step 2: Reload the page and log in**

Open `http://localhost:4200` in browser, log in with admin/admin.

- [ ] **Step 3: Test each tab navigation in sequence**

Click through tabs in this order, verifying each step:

**Home → Plots**
- URL should change to `/tabs/plots`
- Only Plots content visible
- Home content fully gone (not stacked below)

**Plots → Calendar**
- URL should change to `/tabs/calendar`
- Only Calendar content visible
- Previous tab content gone

**Calendar → Library**
- URL should change to `/tabs/library`
- Only Library/Crops content visible (the previously broken tab)
- **CRITICAL:** No Home content below Library content

**Library → Settings**
- URL should change to `/tabs/settings`
- Only Settings content visible

**Settings → Profile**
- URL should change to `/tabs/profile`
- Only Profile content visible

**Profile → Home**
- URL should change to `/tabs/home`
- Only Home content visible

- [ ] **Step 4: Verify no console errors**

Open DevTools Console (F12). Check for any errors during navigation. Should see none related to subscriptions or effects.

Expected console: Clean (no red errors), only info/debug logs from the app.

- [ ] **Step 5: Verify browser back/forward works**

- Click Home
- Click Plots
- Click browser back button
- Should show Home again with correct URL

- [ ] **Step 6: Note test results**

If all steps pass, the fix is complete. Document that all tabs now properly unmount when navigating away.

---

## Task 11: Verify Memory Stability

**Files:**
- Test: No files modified (performance verification only)

- [ ] **Step 1: Open DevTools Memory tab**

Open DevTools → Memory tab (Chrome/Edge) or Inspector (Firefox).

- [ ] **Step 2: Take initial heap snapshot**

Click "Take snapshot" button. Name it "initial".

- [ ] **Step 3: Navigate through all tabs 3 times**

- Home → Plots → Calendar → Library → Settings → Profile → Home (repeat 3 times total)

- [ ] **Step 4: Take final heap snapshot**

Click "Take snapshot" again. Name it "after_navigation".

- [ ] **Step 5: Compare heap sizes**

In the DevTools Memory panel, compare the two snapshots:
- Initial heap: Note the size (e.g., ~50 MB)
- Final heap: Should be similar or slightly higher, not doubled/tripled

If final heap is significantly larger (e.g., 150+ MB for a 50 MB initial), there's still a memory leak.

Expected: Heap size stable (not growing unbounded).

- [ ] **Step 6: Verify no duplicate components in DOM**

Open DevTools Elements panel. Navigate to Library tab. Search for `<app-shell>` or `<ion-tabs>`. Should see only ONE copy of each tab's content in the DOM, not multiple.

Expected: Clean DOM structure with only active tab's content.

---

## Summary

All 9 route pages now implement proper Angular component lifecycle cleanup using `DestroyRef` + `takeUntilDestroyed()`. This ensures:

✅ Subscriptions automatically unsubscribe when components unmount  
✅ Only one tab's content renders at a time (no stacking)  
✅ Browser URLs update correctly on each navigation  
✅ No memory leaks from persistent component instances  
✅ Clean DOM without duplicate components  

**Total changes:** 9 files, ~10-20 lines added per file (imports + inject + pipe calls).

**Testing:** Manual navigation test validates all 6 tabs work correctly. Memory profiling confirms no leaks.

