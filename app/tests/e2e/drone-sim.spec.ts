import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('drone simulation: play, arrive, signal banner, release on confirm', async ({
  page,
}) => {
  // Drone marker visible from the start (paused at stop 1).
  const drone = page.getByTestId('drone-marker');
  await expect(drone).toBeVisible();
  await expect(drone).toHaveAttribute('data-arrived', 'false');

  // Press Play; wait for arrival latch (segment is ~6s; allow generous slack).
  await page.getByTestId('sim-play').click();
  await expect(page.getByTestId('drone-marker')).toHaveAttribute(
    'data-arrived',
    'true',
    { timeout: 15_000 },
  );

  // Arrival banner appears.
  await expect(page.getByTestId('arrival-banner')).toBeVisible();
  await expect(page.getByTestId('arrival-banner')).toContainText(/Drone has arrived/i);

  // Mark Arrived — banner disappears (active stop's status is no longer pending).
  // Drone is still latched at the stop because pickup is not yet terminal.
  await page.getByTestId('btn-arrived-stop-1').click();
  await expect(page.getByTestId('arrival-banner')).toBeHidden();
  await expect(page.getByTestId('drone-marker')).toHaveAttribute(
    'data-arrived',
    'true',
  );

  // Mark Departed — pickup becomes terminal, active stop advances, drone releases.
  await page.getByTestId('btn-departed-stop-1').click();
  await expect(page.getByTestId('drone-marker')).toHaveAttribute(
    'data-arrived',
    'false',
  );
});

test('camera modal: opens live, rewinds 10 min, returns to live, ESC closes', async ({
  page,
}) => {
  await expect(page.getByTestId('camera-modal')).toBeHidden();

  await page.getByTestId('camera-button').click();
  await expect(page.getByTestId('camera-modal')).toBeVisible();
  await expect(page.getByTestId('camera-video')).toBeVisible();
  const src = await page.getByTestId('camera-video').getAttribute('src');
  expect(src).toMatch(/\.mp4/);

  // Defaults to Live; rewind button visible, go-live not yet.
  await expect(page.getByTestId('camera-status')).toContainText(/live/i);
  await expect(page.getByTestId('camera-rewind')).toBeVisible();

  // Rewind -> status flips to past, go-live button appears.
  await page.getByTestId('camera-rewind').click();
  await expect(page.getByTestId('camera-status')).toContainText(/playback|−10|-10/i);
  await expect(page.getByTestId('camera-go-live')).toBeVisible();

  // Back to live -> status flips back, rewind reappears.
  await page.getByTestId('camera-go-live').click();
  await expect(page.getByTestId('camera-status')).toContainText(/live/i);
  await expect(page.getByTestId('camera-rewind')).toBeVisible();

  // ESC closes.
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('camera-modal')).toBeHidden();
});

test('reset returns the drone to the first stop', async ({ page }) => {
  await page.getByTestId('sim-play').click();
  await expect(page.getByTestId('drone-marker')).toHaveAttribute(
    'data-arrived',
    'true',
    { timeout: 15_000 },
  );

  await page.getByTestId('sim-reset').click();
  await expect(page.getByTestId('drone-marker')).toHaveAttribute(
    'data-arrived',
    'false',
  );
  // Play button is back (was Pause while playing — reset pauses).
  await expect(page.getByTestId('sim-play')).toBeVisible();
});
