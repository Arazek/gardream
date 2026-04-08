# Navigation Stacking Fix — Design Spec

**Date:** 2026-04-08  
**Status:** Approved  
**Scope:** Fix component lifecycle cleanup to prevent overlapping route components in DOM

---

## Problem Statement

Navigation between tabs shows multiple route components simultaneously (stacking). For example, clicking Library shows both Home and Library content on the same page. Root cause: route components don't clean up properly when unmounted, leaving subscriptions and effects active.

**Affected Routes:**
- Home (`/tabs/home`)
- Plots (`/tabs/plots` and child routes)
- Calendar (`/tabs/calendar`)
- Library (`/tabs/library`)
- Settings (`/tabs/settings`)

---

## Root Cause Analysis

All route page components have **unmanaged resources**:

1. **Unmanaged subscriptions:** `store.select().subscribe()` without `unsubscribe()`
2. **Unmanaged effects:** `effect()` calls in `ngOnInit` without cleanup
3. **Missing `OnDestroy`:** No component cleanup when route unmounts

When a user navigates away, the component instance stays in memory with active subscriptions and effects, causing multiple components to render simultaneously in the router outlet.

---

## Solution

### Architecture

Implement Angular's standard component lifecycle cleanup pattern:

```
Component mounted → subscriptions/effects active
User navigates away → OnDestroy fires → unsubscribe + cleanup → component destroyed
New route mounts → clean component instance with fresh subscriptions
```

### Implementation Strategy

**Pattern 1: Replace subscriptions with `takeUntilDestroyed()`**

```typescript
// Before
ngOnInit() {
  this.store.select(selectData).subscribe(data => {
    this.data = data;
  });
}

// After
constructor() {
  this.store.select(selectData)
    .pipe(takeUntilDestroyed())
    .subscribe(data => {
      this.data = data;
    });
}
```

**Pattern 2: Wrap effects with cleanup context**

```typescript
// Before
ngOnInit() {
  effect(() => {
    this.value = this.signal();
  });
}

// After
constructor() {
  effect(() => {
    this.value = this.signal();
  }, { injector: this.injector });
}
// (effects already destroy on component destruction if created in constructor)
```

**Pattern 3: Add explicit `OnDestroy` for complex cleanup**

```typescript
implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.store.select(selectData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.data = data);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Files to Update

**Home:**
- `frontend/src/app/features/home/home.page.ts`

**Plots (5 files):**
- `frontend/src/app/features/plots/plots.page.ts`
- `frontend/src/app/features/plots/plot-detail.page.ts`
- `frontend/src/app/features/plots/plot-new.page.ts`
- `frontend/src/app/features/plots/specimen-detail.page.ts`

**Calendar:**
- `frontend/src/app/features/calendar/calendar.page.ts`

**Library (Crops):**
- `frontend/src/app/features/crops/crops.page.ts`

**Settings:**
- `frontend/src/app/features/settings/settings.page.ts`

**Profile:**
- `frontend/src/app/features/profile/profile.page.ts`

### Testing Plan

1. **Manual navigation test:** Cycle through all tabs (Home → Plots → Calendar → Library → Settings → Profile → Home)
   - Verify only one tab's content visible at a time
   - Verify URL updates correctly
   - Verify no duplicate content

2. **DevTools inspection:** Check DOM for duplicate components
   - Open DevTools Elements panel
   - Navigate and verify old components unmount (removed from DOM)

3. **Memory check:** Verify no memory leaks
   - Open DevTools Memory tab
   - Take heap snapshot before/after navigation cycles
   - Verify heap size stabilizes (no growth)

4. **Browser DevTools Network:** Verify no duplicate API calls
   - Navigate between tabs
   - Confirm each route only loads data once

---

## Success Criteria

✅ Each tab fully unmounts before next tab mounts  
✅ No duplicate content visible when navigating  
✅ URLs update correctly on each navigation  
✅ No console errors related to subscriptions or effects  
✅ Memory usage stable across navigation cycles  
✅ All 6 route pages cleaned up and tested

---

## Implementation Approach

1. **Inject `DestroyRef`** in each component constructor (Angular 17+)
   - Cleaner than manual `OnDestroy`
   - Automatic cleanup when component destroys

2. **Use `takeUntilDestroyed()` operator** on all subscriptions
   - Works with `DestroyRef` automatically
   - No manual unsubscribe needed

3. **Verify effects** are created in constructor context
   - Angular's `effect()` auto-destroys when component destroys if created in constructor

4. **Test each route** independently and as a navigation cycle

---

## Out of Scope

- Refactoring component state management (leave NgRx patterns as-is)
- Adding new features to route pages
- Updating route configurations
- Modifying Ionic ion-tabs behavior

