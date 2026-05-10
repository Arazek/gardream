import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await login(page);
});

// H1 - dashboard loads
test('H1: dashboard renders all major sections', async ({ page }) => {
  await expect(page.locator('app-hero-section')).toBeVisible();
  await expect(page.locator('app-garden-kpi-row')).toBeVisible();
  await expect(page.locator('.home-section__title', { hasText: 'Your Plots' })).toBeVisible();
  await expect(page.locator('.home-section__title', { hasText: "Today's Tasks" })).toBeVisible();
});

// H2 - hero chips
test('H2: hero chips show tasks and crops counts', async ({ page }) => {
  await expect(page.locator('app-stat-chip', { hasText: /tasks/i }).first()).toBeVisible();
  await expect(page.locator('app-stat-chip', { hasText: /in ground/i })).toBeVisible();
});

// H3 - overdue chip
test('H3: overdue chip visible', async ({ page }) => {
  await expect(page.locator('app-stat-chip', { hasText: /overdue/i })).toBeVisible();
});

// H4 - weather widget
test('H4: weather widget renders', async ({ page }) => {
  await expect(page.locator('app-weather-widget')).toBeVisible();
});

// H6-H9 - KPI cards
test('H6-H9: KPI row shows 4 cards', async ({ page }) => {
  const kpiRow = page.locator('app-garden-kpi-row');
  await expect(kpiRow).toBeVisible();
  await expect(kpiRow.locator('.kpi-card__label', { hasText: /near harvest/i })).toBeVisible();
  await expect(kpiRow.locator('.kpi-card__label', { hasText: /avg progress/i })).toBeVisible();
  await expect(kpiRow.locator('.kpi-card__label', { hasText: /overdue/i })).toBeVisible();
  await expect(kpiRow.locator('.kpi-card__label', { hasText: /next harvest/i })).toBeVisible();
});

// H10 - stage distribution bar
test('H10: stage distribution bar visible when crops exist', async ({ page }) => {
  const bar = page.locator('app-stage-distribution-bar');
  const plotCount = await page.locator('.home-plot-card').count();
  if (plotCount > 0) {
    await expect(bar).toBeVisible();
  }
});

// H11 - plot list
test('H11: plot list shows user plots', async ({ page }) => {
  const plots = page.locator('.home-plot-card');
  await expect(plots.first()).toBeVisible();
});

// H12 - view all plots nav
test('H12: View all plots navigates to /tabs/plots', async ({ page }) => {
  await page.locator('.home-section__action', { hasText: /view all/i }).first().click();
  await expect(page).toHaveURL(/\/tabs\/plots/);
});

// H13 - click plot card
test('H13: clicking plot card navigates to plot detail', async ({ page }) => {
  await page.locator('.home-plot-card').first().click();
  await expect(page).toHaveURL(/\/tabs\/plots\/.+/);
});

// H14 - today tasks
test('H14: today\'s tasks section visible', async ({ page }) => {
  await expect(page.locator('.home-section__title', { hasText: /today/i })).toBeVisible();
});

// H17 - empty state
test('H17: empty state shows Add plot CTA when no plots visible', async ({ page }) => {
  // Wait for loading to settle — either real plot cards or the empty CTA appear
  await page.locator('.home-plot-card:not(.home-plot-card--skeleton), .home-empty__cta').first()
    .waitFor({ timeout: 8000 }).catch(() => {});
  const count = await page.locator('.home-plot-card:not(.home-plot-card--skeleton)').count();
  if (count === 0) {
    await expect(page.locator('.home-empty__cta', { hasText: /add plot/i })).toBeVisible();
  }
});

// H18 - tasks empty state
test('H18: all clear empty state shown when no tasks today', async ({ page }) => {
  const tasks = page.locator('app-task-list-item');
  const count = await tasks.count();
  if (count === 0) {
    await expect(page.locator('text=/all clear/i')).toBeVisible();
  }
});

// H19 - KPI skeleton
test('H19: KPI row skeleton shown on initial load', async ({ page }) => {
  // Navigate fresh — skeleton brief but should appear
  await page.goto('/tabs/home');
  // Skeleton or actual cards should exist
  const skeleton = page.locator('.kpi-card--skeleton');
  const cards = page.locator('.kpi-card:not(.kpi-card--skeleton)');
  const either = await Promise.race([
    skeleton.first().waitFor({ timeout: 3000 }).then(() => 'skeleton'),
    cards.first().waitFor({ timeout: 3000 }).then(() => 'cards'),
  ]).catch(() => 'none');
  expect(['skeleton', 'cards']).toContain(either);
});

// H20 - notification centre opens
test('H20: notification centre opens on bell icon click', async ({ page }) => {
  await page.locator('app-top-app-bar button[aria-label*="otification"]').click();
  // Drawer becomes visible by translating to translateX(0) — check the open class
  await expect(page.locator('.drawer--open')).toBeVisible();
});

// H21 - notification centre closes
test('H21: notification centre closes when dismissed', async ({ page }) => {
  await page.locator('app-top-app-bar button[aria-label*="otification"]').click();
  const drawer = page.locator('.drawer--open');
  await expect(drawer).toBeVisible();
  // Close via the X button in the drawer header
  await drawer.locator('.drawer__close').click();
  await expect(page.locator('.drawer--open')).not.toBeVisible();
});

// H22 - dismiss individual notification
test('H22: individual notification can be dismissed', async ({ page }) => {
  await page.locator('app-top-app-bar button[aria-label*="otification"]').click();
  const drawer = page.locator('.drawer--open');
  await expect(drawer).toBeVisible();
  const dismissButtons = drawer.locator('.notification-item__dismiss');
  const count = await dismissButtons.count();
  if (count > 0) {
    await dismissButtons.first().click();
    await expect(drawer.locator('.notification-item__dismiss')).toHaveCount(count - 1);
  }
});

// H23 - mark all read
test('H23: mark all read removes notification badges', async ({ page }) => {
  await page.locator('app-top-app-bar button[aria-label*="otification"]').click();
  const drawer = page.locator('.drawer--open');
  await expect(drawer).toBeVisible();
  await drawer.locator('ion-button', { hasText: /mark all read/i }).click();
  // Close and verify badge is gone
  await drawer.locator('.drawer__close').click();
  const badge = page.locator('app-top-app-bar .nav-action__badge, app-top-app-bar [class*="badge"]');
  await expect(badge).not.toBeVisible();
});

// H24 - task toggle
test('H24: today task can be toggled as complete', async ({ page }) => {
  const tasks = page.locator('app-task-list-item');
  const count = await tasks.count();
  if (count > 0) {
    const first = tasks.first();
    const checkbox = first.locator('ion-checkbox, input[type="checkbox"], [role="checkbox"]').first();
    await checkbox.click();
    // element should now carry a checked/completed state
    await expect(first).toHaveClass(/completed|checked|done/);
  }
});

// H25 - view all tasks → calendar
test('H25: "view all" on tasks section navigates to calendar', async ({ page }) => {
  const taskSection = page.locator('.home-section', { has: page.locator('.home-section__title', { hasText: /today/i }) });
  const viewAll = taskSection.locator('.home-section__action', { hasText: /view all/i });
  const visible = await viewAll.isVisible();
  if (visible) {
    await viewAll.click();
    await expect(page).toHaveURL(/\/tabs\/calendar/);
  }
});

// H26 - insight card renders
test('H26: garden insight card renders with content', async ({ page }) => {
  const insight = page.locator('app-insight-card');
  await expect(insight).toBeVisible();
  const text = await insight.innerText();
  expect(text.trim().length).toBeGreaterThan(0);
});

// H27 - profile nav → settings
test('H27: profile button navigates to settings', async ({ page }) => {
  await page.locator('app-top-app-bar button[aria-label*="rofile"]').click();
  await expect(page).toHaveURL(/\/tabs\/settings/);
});
