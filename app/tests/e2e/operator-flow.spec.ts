import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('operator can complete a full route end-to-end', async ({ page }) => {
  // 1. Get assigned a route
  await expect(page.getByRole('heading', { name: /Hi, Maria Chen/i })).toBeVisible();
  await expect(page.getByTestId('progress-counter')).toContainText('0');
  await expect(page.getByTestId('progress-counter')).toContainText('5');
  await expect(page.getByTestId('stop-list')).toBeVisible();
  await expect(page.getByTestId('route-map')).toBeVisible();

  // 2. Stop 1 — pickup at Tartine
  await expect(page.getByTestId('status-stop-1')).toHaveText(/pending/i);
  await page.getByTestId('btn-arrived-stop-1').click();
  await expect(page.getByTestId('status-stop-1')).toHaveText(/arrived/i);
  await page.getByTestId('btn-departed-stop-1').click();
  await expect(page.getByTestId('status-stop-1')).toHaveText(/departed/i);
  await expect(page.getByTestId('progress-counter')).toContainText('1');

  // 3. Stop 2 — pickup at La Taqueria
  await page.getByTestId('btn-arrived-stop-2').click();
  await page.getByTestId('btn-departed-stop-2').click();
  await expect(page.getByTestId('progress-counter')).toContainText('2');

  // 4. Stop 3 — successful delivery
  await page.getByTestId('btn-arrived-stop-3').click();
  await page.getByTestId('btn-completed-stop-3').click();
  await expect(page.getByTestId('status-stop-3')).toHaveText(/completed/i);
  await expect(page.getByTestId('progress-counter')).toContainText('3');

  // 5. Stop 4 — successful delivery
  await page.getByTestId('btn-arrived-stop-4').click();
  await page.getByTestId('btn-completed-stop-4').click();

  // 6. Stop 5 — successful delivery
  await page.getByTestId('btn-arrived-stop-5').click();
  await page.getByTestId('btn-completed-stop-5').click();

  // 7. Route complete state
  await expect(page.getByTestId('progress-counter')).toContainText(/Route Complete/i);
});

test('only the next legal action button is shown', async ({ page }) => {
  // Initially: only "Mark Arrived" on stop 1, no other action buttons
  await expect(page.getByTestId('btn-arrived-stop-1')).toBeVisible();
  await expect(page.getByTestId('btn-departed-stop-1')).not.toBeVisible();

  await page.getByTestId('btn-arrived-stop-1').click();
  await expect(page.getByTestId('btn-departed-stop-1')).toBeVisible();
  await expect(page.getByTestId('btn-arrived-stop-1')).not.toBeVisible();
});

test('reset button returns the route to pending', async ({ page }) => {
  await page.getByTestId('btn-arrived-stop-1').click();
  await page.getByTestId('btn-departed-stop-1').click();
  await expect(page.getByTestId('progress-counter')).toContainText('1');

  page.once('dialog', (d) => d.accept());
  await page.getByTestId('reset-button').click();

  await expect(page.getByTestId('progress-counter')).toContainText('0');
  await expect(page.getByTestId('status-stop-1')).toHaveText(/pending/i);
});
