import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('operator can mark a delivery failed with a quick-pick reason', async ({ page }) => {
  // Get to a delivery first
  await page.getByTestId('btn-arrived-stop-1').click();
  await page.getByTestId('btn-departed-stop-1').click();
  await page.getByTestId('btn-arrived-stop-2').click();
  await page.getByTestId('btn-departed-stop-2').click();
  await page.getByTestId('btn-arrived-stop-3').click();

  // Open failure modal
  await page.getByTestId('btn-failed-stop-3').click();
  await expect(page.getByTestId('fail-modal-stop-3')).toBeVisible();

  // Pick a quick-pick reason and confirm
  await page.getByTestId('fail-quick-No-one-home').click();
  await page.getByTestId('fail-confirm-stop-3').click();

  // Modal closes, status reflects, reason badge visible
  await expect(page.getByTestId('fail-modal-stop-3')).not.toBeVisible();
  await expect(page.getByTestId('status-stop-3')).toHaveText(/failed/i);
  await expect(page.getByTestId('failure-reason-stop-3')).toContainText('No one home');
});

test('operator can type a custom failure reason', async ({ page }) => {
  await page.getByTestId('btn-arrived-stop-1').click();
  await page.getByTestId('btn-departed-stop-1').click();
  await page.getByTestId('btn-arrived-stop-2').click();
  await page.getByTestId('btn-departed-stop-2').click();
  await page.getByTestId('btn-arrived-stop-3').click();

  await page.getByTestId('btn-failed-stop-3').click();
  await page.getByTestId('fail-reason-input-stop-3').fill('Building locked, no buzzer');
  await page.getByTestId('fail-confirm-stop-3').click();

  await expect(page.getByTestId('failure-reason-stop-3')).toContainText(
    'Building locked, no buzzer',
  );
});

test('confirm button is disabled when reason is empty', async ({ page }) => {
  await page.getByTestId('btn-arrived-stop-1').click();
  await page.getByTestId('btn-departed-stop-1').click();
  await page.getByTestId('btn-arrived-stop-2').click();
  await page.getByTestId('btn-departed-stop-2').click();
  await page.getByTestId('btn-arrived-stop-3').click();

  await page.getByTestId('btn-failed-stop-3').click();
  await expect(page.getByTestId('fail-confirm-stop-3')).toBeDisabled();
});

test('progress survives a page reload', async ({ page }) => {
  await page.getByTestId('btn-arrived-stop-1').click();
  await page.getByTestId('btn-departed-stop-1').click();
  await page.getByTestId('btn-arrived-stop-2').click();
  await page.getByTestId('btn-departed-stop-2').click();
  await page.getByTestId('btn-arrived-stop-3').click();
  await page.getByTestId('btn-completed-stop-3').click();

  await expect(page.getByTestId('progress-counter')).toContainText('3');

  await page.reload();

  await expect(page.getByTestId('progress-counter')).toContainText('3');
  await expect(page.getByTestId('status-stop-1')).toHaveText(/departed/i);
  await expect(page.getByTestId('status-stop-3')).toHaveText(/completed/i);
});
