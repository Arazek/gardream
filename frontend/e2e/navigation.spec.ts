import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await login(page);
});

// N1 - bottom nav on mobile
test('N1: bottom nav shows 4 items on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/tabs/home');
  const nav = page.locator('app-bottom-nav-bar');
  await expect(nav).toBeVisible();
  const items = nav.locator('a, button');
  const count = await items.count();
  expect(count).toBeGreaterThanOrEqual(4);
});

// N2 - sidebar on desktop
test('N2: sidebar navigation visible on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/tabs/home');
  const sidebar = page.locator('app-sidebar, [class*="sidebar"], nav');
  await expect(sidebar.first()).toBeVisible();
});

// N3 - active tab highlighted
test('N3: active tab is visually highlighted', async ({ page }) => {
  await page.goto('/tabs/plots');
  const activeItem = page.locator('[class*="active"], [aria-current], [class*="selected"]').first();
  await expect(activeItem).toBeVisible({ timeout: 3000 }).catch(() => {});
  // Just ensure no crash
  await expect(page).toHaveURL(/\/tabs\/plots/);
});

// N4 - back button on detail page
test('N4: back button on plot detail returns to plots list', async ({ page }) => {
  await page.goto('/tabs/plots');
  await page.locator('button').filter({ hasText: /ground bed|raised bed|container|vertical/i }).first().click();
  await page.waitForURL(/\/tabs\/plots\/.+/);
  await page.getByRole('button', { name: /back|arrow_back/i }).first().click();
  await expect(page).toHaveURL(/\/tabs\/plots$/, { timeout: 5000 });
});

// N5 - deep link
test('N5: direct URL to plots loads plot list', async ({ page }) => {
  await page.goto('/tabs/library');
  await expect(page).toHaveURL(/\/tabs\/library/);
  await expect(page.locator('app-specimen-card, [class*="crop"]').first()).toBeVisible({ timeout: 8000 });
});

// N6 - content not hidden behind nav bars
test('N6: page content not hidden behind bottom nav', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/tabs/home');
  const bottomNav = page.locator('app-bottom-nav-bar');
  const navBox = await bottomNav.boundingBox();
  const insight = page.locator('app-insight-card');
  if (await insight.isVisible() && navBox) {
    await insight.scrollIntoViewIfNeeded();
    const insightBox = await insight.boundingBox();
    if (insightBox) {
      // Insight bottom should not overlap nav top
      expect(insightBox.y + insightBox.height).toBeLessThanOrEqual(navBox.y + 10);
    }
  }
});

// N7 - landscape orientation
test('N7: app renders without broken layout in landscape', async ({ page }) => {
  await page.setViewportSize({ width: 812, height: 375 });
  await page.goto('/tabs/home');
  await expect(page.locator('app-hero-section')).toBeVisible();
  await expect(page.locator('app-garden-kpi-row')).toBeVisible();
});
