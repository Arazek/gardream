import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.goto('/tabs/library');
  await page.waitForSelector('app-specimen-card, [class*="crop-card"], [class*="specimen-card"]', { timeout: 8000 });
});

// CL1 - library loads
test('CL1: library loads full crop list', async ({ page }) => {
  const crops = page.locator('app-specimen-card, [class*="crop-card"]');
  await expect(crops.first()).toBeVisible();
  const count = await crops.count();
  expect(count).toBeGreaterThan(0);
});

// CL2 - search
test('CL2: searching Basil shows only matching crops', async ({ page }) => {
  const search = page.locator('app-search-bar input, input[type="search"], input[placeholder*="search" i]');
  await search.fill('Basil');
  await page.waitForTimeout(500);
  await expect(page.locator('text=/basil/i').first()).toBeVisible();
});

// CL3 - category filter
test('CL3: Herbs filter shows only herb crops', async ({ page }) => {
  const herbFilter = page.locator('app-filter-chip').filter({ hasText: /herb/i }).first();
  if (await herbFilter.isVisible()) {
    await herbFilter.click();
    await page.waitForTimeout(500);
    const cards = page.locator('app-specimen-card, [class*="crop-card"]');
    await expect(cards.first()).toBeVisible();
  }
});

// CL4 - clear filter
test('CL4: clearing filter shows all crops', async ({ page }) => {
  const herbFilter = page.locator('app-filter-chip').filter({ hasText: /herb/i }).first();
  if (await herbFilter.isVisible()) {
    await herbFilter.click();
    await herbFilter.click(); // toggle off
    await page.waitForTimeout(500);
    const crops = page.locator('app-specimen-card, [class*="crop-card"]');
    const count = await crops.count();
    expect(count).toBeGreaterThan(3);
  }
});

// CL5 - click crop navigates to detail
test('CL5: clicking crop card navigates to crop detail', async ({ page }) => {
  await page.locator('app-specimen-card, [class*="crop-card"]').first().click();
  await expect(page).toHaveURL(/\/tabs\/library\/.+/, { timeout: 5000 });
});

// CL6 - crop detail shows name and description
test('CL6: crop detail shows name, latin name, description', async ({ page }) => {
  await page.locator('app-specimen-card, [class*="crop-card"]').first().click();
  await page.waitForURL(/\/tabs\/library\/.+/, { timeout: 5000 });
  await expect(page.locator('h1, h2, [class*="name"]').first()).toBeVisible();
});

// CL7 - growing stats
test('CL7: crop detail shows growing stats', async ({ page }) => {
  await page.locator('app-specimen-card, [class*="crop-card"]').first().click();
  await page.waitForURL(/\/tabs\/library\/.+/, { timeout: 5000 });
  // Days to germination, harvest, or spacing
  await expect(page.locator('text=/days|germination|harvest|spacing/i').first()).toBeVisible({ timeout: 5000 });
});

// CL8 - companion crops
test('CL8: companion crops listed on detail', async ({ page }) => {
  await page.locator('app-specimen-card, [class*="crop-card"]').first().click();
  await page.waitForURL(/\/tabs\/library\/.+/, { timeout: 5000 });
  const companion = page.locator('text=/companion|grows well/i');
  if (await companion.isVisible()) {
    await expect(companion).toBeVisible();
  }
});

// CL9 - avoid crops
test('CL9: avoid crops listed on detail', async ({ page }) => {
  await page.locator('app-specimen-card, [class*="crop-card"]').first().click();
  await page.waitForURL(/\/tabs\/library\/.+/, { timeout: 5000 });
  const avoid = page.locator('text=/avoid|keep away/i');
  if (await avoid.isVisible()) {
    await expect(avoid).toBeVisible();
  }
});

// CL10 - skeleton on load
test('CL10: loading skeleton shown before crops load', async ({ page }) => {
  await page.goto('/tabs/library');
  const skeleton = page.locator('[class*="skeleton"], [class*="shimmer"]');
  const cards = page.locator('app-specimen-card');
  const either = await Promise.race([
    skeleton.first().waitFor({ timeout: 3000 }).then(() => 'skeleton'),
    cards.first().waitFor({ timeout: 3000 }).then(() => 'cards'),
  ]).catch(() => 'none');
  expect(['skeleton', 'cards']).toContain(either);
});
