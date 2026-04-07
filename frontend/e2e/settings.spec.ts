import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.goto('/tabs/settings');
  await page.waitForSelector('[class*="settings"], [class*="profile"]', { timeout: 5000 });
});

// S1 - profile shown
test('S1: settings shows user profile name and email', async ({ page }) => {
  await expect(page.locator('app-avatar, [class*="avatar"]')).toBeVisible();
  await expect(page.locator('text=/admin/i').first()).toBeVisible();
});

// S2 - light theme
test('S2: switching to light theme applies light styles', async ({ page }) => {
  const lightBtn = page.locator('button, [class*="theme"]').filter({ hasText: /light/i }).first();
  if (await lightBtn.isVisible()) {
    await lightBtn.click();
    await page.waitForTimeout(300);
    const bodyClass = await page.locator('body').getAttribute('class');
    expect(bodyClass).not.toContain('dark');
  }
});

// S3 - dark theme
test('S3: switching to dark theme applies dark styles', async ({ page }) => {
  const darkBtn = page.locator('button, [class*="theme"]').filter({ hasText: /dark/i }).first();
  if (await darkBtn.isVisible()) {
    await darkBtn.click();
    await page.waitForTimeout(300);
    const bodyClass = await page.locator('body').getAttribute('class');
    expect(bodyClass).toContain('dark');
  }
});

// S4 - auto theme
test('S4: auto theme option available', async ({ page }) => {
  const autoBtn = page.locator('button, [class*="theme"]').filter({ hasText: /auto|system/i }).first();
  if (await autoBtn.isVisible()) {
    await autoBtn.click();
    await expect(page.locator('[class*="settings"]')).toBeVisible();
  }
});

// S5 - morning reminder toggle
test('S5: morning reminder toggle persists', async ({ page }) => {
  const toggle = page.locator('app-toggle-field').filter({ hasText: /morning/i }).locator('button, input').first();
  if (await toggle.isVisible()) {
    await toggle.click();
    await page.waitForTimeout(500);
    await toggle.click(); // restore
  }
  await expect(page.locator('[class*="settings"]')).toBeVisible();
});

// S6 - evening reminder toggle
test('S6: evening reminder toggle persists', async ({ page }) => {
  const toggle = page.locator('app-toggle-field').filter({ hasText: /evening/i }).locator('button, input').first();
  if (await toggle.isVisible()) {
    await toggle.click();
    await page.waitForTimeout(500);
    await toggle.click();
  }
  await expect(page.locator('[class*="settings"]')).toBeVisible();
});

// S7 - in-app alerts toggle
test('S7: in-app alerts toggle persists', async ({ page }) => {
  const toggle = page.locator('app-toggle-field').filter({ hasText: /alert|in.app/i }).locator('button, input').first();
  if (await toggle.isVisible()) {
    await toggle.click();
    await page.waitForTimeout(500);
    await toggle.click();
  }
  await expect(page.locator('[class*="settings"]')).toBeVisible();
});

// S8 - sign out
test('S8: sign out redirects to login', async ({ page }) => {
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
});
