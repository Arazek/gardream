import { Page } from '@playwright/test';

export const BASE_URL = 'http://localhost:4200';
export const CREDENTIALS = { username: 'admin', password: 'admin' };

export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: /sign in with email/i }).click();
  await page.getByLabel(/username or email/i).fill(CREDENTIALS.username);
  await page.getByLabel(/password/i).fill(CREDENTIALS.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/tabs/home', { timeout: 10000 });
}

export async function logout(page: Page): Promise<void> {
  await page.goto('/tabs/settings');
  await page.getByRole('button', { name: /sign out/i }).click();
  await page.waitForURL('**/login', { timeout: 10000 });
}
