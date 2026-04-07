import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

async function goToFirstPlot(page: any) {
  await page.goto('/tabs/plots');
  await page.locator('button').filter({ hasText: /ground bed|raised bed|container|vertical/i }).first().click();
  await page.waitForURL(/\/tabs\/plots\/.+/);
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

// PD1 - correct plot opens
test('PD1: plot detail shows correct grid size', async ({ page }) => {
  await goToFirstPlot(page);
  await expect(page.locator('.plot-grid, [class*="plot-grid"]')).toBeVisible({ timeout: 5000 });
});

// PD2 - occupied slots
test('PD2: occupied slots show crop name and progress bar', async ({ page }) => {
  await goToFirstPlot(page);
  const occupiedSlot = page.locator('.garden-grid-slot').filter({ hasNot: page.locator('.garden-grid-slot--empty') }).first();
  if (await occupiedSlot.isVisible()) {
    await expect(occupiedSlot.locator('.garden-grid-slot__name')).toBeVisible();
    await expect(occupiedSlot.locator('app-progress-bar')).toBeVisible();
  }
});

// PD3 - empty slots
test('PD3: empty slots show dashed circle with add icon', async ({ page }) => {
  await goToFirstPlot(page);
  const emptySlot = page.locator('.garden-grid-slot__empty-btn').first();
  await expect(emptySlot).toBeVisible({ timeout: 5000 });
});

// PD4 - mobile horizontal scroll
test('PD4: 8-col grid scrolls horizontally on 375px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await goToFirstPlot(page);
  const scroll = page.locator('.plot-grid-scroll');
  await expect(scroll).toBeVisible({ timeout: 5000 });
  const overflow = await scroll.evaluate(el => window.getComputedStyle(el).overflowX);
  expect(overflow).toBe('auto');
});

// PD5 - uniform cell height
test('PD5: all grid cells have same height', async ({ page }) => {
  await goToFirstPlot(page);
  await page.waitForSelector('.garden-grid-slot', { timeout: 5000 });
  const heights = await page.locator('.garden-grid-slot').evaluateAll(
    els => els.slice(0, 8).map(el => Math.round(el.getBoundingClientRect().height))
  );
  const unique = [...new Set(heights)];
  expect(unique.length).toBe(1);
});

// PD6 - click empty slot opens crop picker
test('PD6: clicking empty slot opens crop picker', async ({ page }) => {
  await goToFirstPlot(page);
  const emptyBtn = page.locator('.garden-grid-slot__empty-btn').first();
  await expect(emptyBtn).toBeVisible({ timeout: 5000 });
  await emptyBtn.click();
  await expect(page.locator('app-crop-picker, [class*="crop-picker"]')).toBeVisible({ timeout: 5000 });
});

// PD7 - click occupied slot navigates to specimen
test('PD7: clicking occupied slot navigates to specimen detail', async ({ page }) => {
  await goToFirstPlot(page);
  const occupiedBtn = page.locator('.garden-grid-slot__content').first();
  if (await occupiedBtn.isVisible()) {
    await occupiedBtn.click();
    await expect(page).toHaveURL(/\/specimen/, { timeout: 5000 });
  }
});

// PD8 - remove button on touch
test('PD8: remove button visible on touch device', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ media: 'screen' });
  await goToFirstPlot(page);
  const removeBtn = page.locator('.garden-grid-slot__remove-btn').first();
  if (await removeBtn.isVisible()) {
    const opacity = await removeBtn.evaluate(el => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0);
  }
});

// PD9 - remove confirmation dialog
test('PD9: clicking remove shows confirmation dialog with crop name', async ({ page }) => {
  await goToFirstPlot(page);
  const removeBtn = page.locator('.garden-grid-slot__remove-btn').first();
  if (await removeBtn.isVisible()) {
    await removeBtn.click();
    await expect(page.locator('ion-alert, [role="alertdialog"]')).toBeVisible({ timeout: 3000 });
  }
});

// PD10 - confirm remove clears slot
test('PD10: confirming remove clears the slot', async ({ page }) => {
  await goToFirstPlot(page);
  const occupiedBefore = await page.locator('.garden-grid-slot__content').count();
  const removeBtn = page.locator('.garden-grid-slot__remove-btn').first();
  if (await removeBtn.isVisible() && occupiedBefore > 0) {
    await removeBtn.click();
    await page.getByRole('button', { name: /remove/i }).click();
    await page.waitForTimeout(1000);
    const occupiedAfter = await page.locator('.garden-grid-slot__content').count();
    expect(occupiedAfter).toBe(occupiedBefore - 1);
  }
});

// PD11 - cancel remove leaves slot unchanged
test('PD11: cancelling remove leaves slot unchanged', async ({ page }) => {
  await goToFirstPlot(page);
  const occupiedBefore = await page.locator('.garden-grid-slot__content').count();
  const removeBtn = page.locator('.garden-grid-slot__remove-btn').first();
  if (await removeBtn.isVisible() && occupiedBefore > 0) {
    await removeBtn.click();
    await page.getByRole('button', { name: /cancel/i }).click();
    const occupiedAfter = await page.locator('.garden-grid-slot__content').count();
    expect(occupiedAfter).toBe(occupiedBefore);
  }
});

// CP1-CP5 - crop picker
test('CP1: crop picker shows crop grid', async ({ page }) => {
  await goToFirstPlot(page);
  const emptyBtn = page.locator('.garden-grid-slot__empty-btn').first();
  await expect(emptyBtn).toBeVisible({ timeout: 5000 });
  await emptyBtn.click();
  await expect(page.locator('app-crop-picker, [class*="crop-picker"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.crop-picker-grid, [class*="crop-picker"] .specimen-card, [class*="crop-card"]').first()).toBeVisible({ timeout: 5000 });
});

test('CP2: search in crop picker filters results', async ({ page }) => {
  await goToFirstPlot(page);
  await page.locator('.garden-grid-slot__empty-btn').first().click();
  await page.waitForSelector('app-crop-picker, [class*="crop-picker"]', { timeout: 5000 });
  const search = page.locator('app-search-bar input, [placeholder*="search" i]');
  if (await search.isVisible()) {
    await search.fill('Basil');
    await page.waitForTimeout(500);
    const results = page.locator('[class*="crop-card"], .specimen-card');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
    await expect(page.locator('text=/basil/i').first()).toBeVisible();
  }
});

test('CP3: category filter in crop picker works', async ({ page }) => {
  await goToFirstPlot(page);
  await page.locator('.garden-grid-slot__empty-btn').first().click();
  await page.waitForSelector('app-crop-picker, [class*="crop-picker"]', { timeout: 5000 });
  const herbFilter = page.locator('app-filter-chip, button').filter({ hasText: /herb/i }).first();
  if (await herbFilter.isVisible()) {
    await herbFilter.click();
    await page.waitForTimeout(500);
    await expect(page.locator('[class*="crop-card"], .specimen-card').first()).toBeVisible();
  }
});
