import { test, expect } from '@playwright/test';
import { login, logout } from './helpers/auth';

// A1 - unauthenticated redirect
test('A1: unauthenticated user redirected to /login', async ({ page }) => {
  await page.goto('/tabs/home');
  await expect(page).toHaveURL(/\/login/);
});

// A2 - valid login
test('A2: valid login redirects to home with greeting', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/tabs\/home/);
  await expect(page.locator('app-hero-section')).toBeVisible();
});

// A3 - invalid login
test('A3: invalid credentials shows error', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /sign in with email/i }).click();
  await page.getByLabel(/username or email/i).fill('wrong');
  await page.getByLabel(/password/i).fill('wrong');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 5000 });
  await expect(page).toHaveURL(/keycloak|login/);
});

// A4 - logout
test('A4: logout from settings clears session and redirects to /login', async ({ page }) => {
  await login(page);
  await logout(page);
  await expect(page).toHaveURL(/\/login/);
});

// A5 - direct URL without auth
test('A5: direct URL to /tabs/plots without auth redirects to /login', async ({ page }) => {
  await page.goto('/tabs/plots');
  await expect(page).toHaveURL(/\/login/);
});

// A6 - protected tabs route
test('A6: accessing /tabs/calendar without auth redirects to /login', async ({ page }) => {
  await page.goto('/tabs/calendar');
  await expect(page).toHaveURL(/\/login/);
});
