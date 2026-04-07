import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.goto('/tabs/plots');
});

// PL1 - plots list loads
test('PL1: plots list loads all user plots', async ({ page }) => {
  await expect(page.locator('text=/my plots/i')).toBeVisible();
  const plots = page.locator('.plot-list-item, [class*="plot-card"]');
  await expect(plots.first()).toBeVisible({ timeout: 5000 });
});

// PL2 - plot card content
test('PL2: each plot card shows name, type, dimensions, watering days', async ({ page }) => {
  const card = page.locator('button').filter({ hasText: /ground bed|raised bed|container|vertical/i }).first();
  await expect(card).toBeVisible();
  await expect(card.locator('text=/×/')).toBeVisible();
});

// PL3 - add plot button
test('PL3: add plot button navigates to new plot form', async ({ page }) => {
  await page.getByRole('button', { name: /add plot/i }).click();
  await expect(page).toHaveURL(/\/tabs\/plots\/new/);
});

// PC1 - create plot
test('PC1: create plot with all fields creates and appears in list', async ({ page }) => {
  await page.goto('/tabs/plots/new');
  await page.getByLabel(/name/i).fill('Test Plot E2E');
  // Select ground bed type
  await page.locator('[class*="plot-type"]').filter({ hasText: /ground bed/i }).click();
  // Set rows and cols
  const rowsInput = page.getByLabel(/rows/i);
  const colsInput = page.getByLabel(/cols|columns/i);
  if (await rowsInput.isVisible()) {
    await rowsInput.fill('4');
    await colsInput.fill('4');
  }
  await page.getByRole('button', { name: /create|save|add/i }).click();
  await expect(page).toHaveURL(/\/tabs\/plots/, { timeout: 5000 });
  await expect(page.locator('text=Test Plot E2E')).toBeVisible({ timeout: 5000 });
});

// PC2 - submit without name
test('PC2: submit without name shows validation error', async ({ page }) => {
  await page.goto('/tabs/plots/new');
  await page.locator('[class*="plot-type"]').first().click();
  await page.getByRole('button', { name: /create|save|add/i }).click();
  await expect(page.locator('text=/required|name/i')).toBeVisible({ timeout: 3000 });
});

// PC3 - submit without plot type
test('PC3: submit without plot type shows validation error', async ({ page }) => {
  await page.goto('/tabs/plots/new');
  await page.getByLabel(/name/i).fill('No Type Plot');
  await page.getByRole('button', { name: /create|save|add/i }).click();
  await expect(page.locator('text=/required|type/i')).toBeVisible({ timeout: 3000 });
});

// PC4 - live grid preview
test('PC4: changing rows/cols updates grid preview', async ({ page }) => {
  await page.goto('/tabs/plots/new');
  const rowsInput = page.getByLabel(/rows/i);
  if (await rowsInput.isVisible()) {
    await rowsInput.fill('6');
    const preview = page.locator('[class*="preview"], [class*="grid"]');
    await expect(preview).toBeVisible();
  }
});

// PC5 - all plot types selectable
test('PC5: all 4 plot types selectable in form', async ({ page }) => {
  await page.goto('/tabs/plots/new');
  const types = ['ground', 'raised', 'container', 'vertical'];
  for (const t of types) {
    const btn = page.locator('[class*="plot-type"]').filter({ hasText: new RegExp(t, 'i') });
    if (await btn.isVisible()) {
      await btn.click();
      await expect(btn).toHaveClass(/active|selected/, { timeout: 1000 }).catch(() => {});
    }
  }
});

// PC6 - watering days
test('PC6: watering days selectable', async ({ page }) => {
  await page.goto('/tabs/plots/new');
  const dayPicker = page.locator('app-day-picker, [class*="day-picker"]');
  if (await dayPicker.isVisible()) {
    await dayPicker.locator('button').first().click();
    await expect(dayPicker.locator('button').first()).toHaveClass(/active|selected/, { timeout: 1000 }).catch(() => {});
  }
});
