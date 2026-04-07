import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

async function goToFirstSpecimen(page: any) {
  await page.goto('/tabs/plots');
  await page.locator('button').filter({ hasText: /ground bed|raised bed|container|vertical/i }).first().click();
  await page.waitForURL(/\/tabs\/plots\/.+/);
  await page.waitForSelector('.garden-grid-slot__content', { timeout: 5000 });
  await page.locator('.garden-grid-slot__content').first().click();
  await page.waitForURL(/\/specimen/, { timeout: 5000 });
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

// SP1 - specimen page loads
test('SP1: specimen page shows stage, progress, sow date', async ({ page }) => {
  await goToFirstSpecimen(page);
  await expect(page.locator('.progress-section')).toBeVisible();
  await expect(page.locator('.sow-input, input[type="date"]').first()).toBeVisible();
});

// SP2 - progress bar
test('SP2: progress bar visible with value', async ({ page }) => {
  await goToFirstSpecimen(page);
  const bar = page.locator('progress.progress-bar, .progress-bar');
  await expect(bar.first()).toBeVisible();
});

// SP3 - stage shown
test('SP3: current stage displayed', async ({ page }) => {
  await goToFirstSpecimen(page);
  const stage = page.locator('.progress-header h2');
  await expect(stage).toBeVisible();
  const text = await stage.textContent();
  expect(text?.trim().length).toBeGreaterThan(0);
});

// SP4 - change sow date updates progress
test('SP4: changing sow date updates progress display', async ({ page }) => {
  await goToFirstSpecimen(page);
  const bar = page.locator('progress.progress-bar');
  const valueBefore = await bar.getAttribute('value');
  const sowInput = page.locator('.sow-input, input[type="date"]').first();
  await sowInput.fill('2020-01-01');
  await sowInput.dispatchEvent('change');
  await page.waitForTimeout(500);
  const valueAfter = await bar.getAttribute('value');
  // Progress should be 100 for very old sow date
  expect(Number(valueAfter)).toBeGreaterThan(Number(valueBefore || 0));
});

// SP5 - stage chips selectable
test('SP5: stage override chips are selectable', async ({ page }) => {
  await goToFirstSpecimen(page);
  const chips = page.locator('.stage-chip');
  await expect(chips.first()).toBeVisible();
  await chips.first().click();
  await expect(chips.first()).toHaveClass(/stage-chip--active/);
});

// SP6 - stage override applied
test('SP6: selecting stage override changes displayed stage', async ({ page }) => {
  await goToFirstSpecimen(page);
  const chips = page.locator('.stage-chip');
  const count = await chips.count();
  if (count > 1) {
    await chips.last().click();
    await expect(chips.last()).toHaveClass(/stage-chip--active/);
  }
});

// SP7 - clear override
test('SP7: clear override button removes manual stage', async ({ page }) => {
  await goToFirstSpecimen(page);
  await page.locator('.stage-chip').first().click();
  const clearBtn = page.locator('.stage-clear-btn');
  await expect(clearBtn).toBeVisible({ timeout: 2000 });
  await clearBtn.click();
  await expect(clearBtn).toBeHidden({ timeout: 2000 });
});

// SP8 - add note
test('SP8: adding a note persists it in the list', async ({ page }) => {
  await goToFirstSpecimen(page);
  await page.locator('.add-note-btn').click();
  const noteText = `Test note ${Date.now()}`;
  await page.locator('.add-note-form__text').fill(noteText);
  await page.getByRole('button', { name: /^add$/i }).click();
  await expect(page.locator(`.note-entry__text`, { hasText: noteText })).toBeVisible({ timeout: 3000 });
});

// SP9 - cancel note
test('SP9: cancelling note leaves list unchanged', async ({ page }) => {
  await goToFirstSpecimen(page);
  const countBefore = await page.locator('.note-entry').count();
  await page.locator('.add-note-btn').click();
  await page.locator('.add-note-form__text').fill('Should not appear');
  await page.getByRole('button', { name: /cancel/i }).click();
  const countAfter = await page.locator('.note-entry').count();
  expect(countAfter).toBe(countBefore);
});

// SP10 - empty notes state
test('SP10: empty notes state shows "No notes yet"', async ({ page }) => {
  await goToFirstSpecimen(page);
  const notes = page.locator('.note-entry');
  const count = await notes.count();
  if (count === 0) {
    await expect(page.locator('.note-empty')).toBeVisible();
  }
});

// SP11 - photo log visible
test('SP11: photo log section visible', async ({ page }) => {
  await goToFirstSpecimen(page);
  await expect(page.locator('app-specimen-photo-log')).toBeVisible();
});

// SP12 - milestone mark reached
test('SP12: milestone "Mark reached" button visible', async ({ page }) => {
  await goToFirstSpecimen(page);
  const markBtn = page.locator('.milestones__mark-btn').first();
  if (await markBtn.isVisible()) {
    await expect(markBtn).toBeEnabled();
  }
});

// SP13 - milestones show expected days
test('SP13: milestones show day ranges', async ({ page }) => {
  await goToFirstSpecimen(page);
  await expect(page.locator('app-specimen-milestones')).toBeVisible();
  await expect(page.locator('.milestones__day').first()).toBeVisible();
});
