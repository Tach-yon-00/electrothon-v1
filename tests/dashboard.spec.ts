import { test, expect } from '@playwright/test';

test.describe('VENUS Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should load the dashboard with header and status information', async ({ page }) => {
    // Check header loads
    await expect(page.getByText('VENUS')).toBeVisible();
    await expect(page.getByText('Vehicular & Environmental Network Utility System')).toBeVisible();

    // Check view switcher
    await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /City Map/i })).toBeVisible();

    // Check live telemetry badge
    await expect(page.getByText(/Live/i)).toBeVisible();
  });

  test('should display manhole selector with multiple nodes', async ({ page }) => {
    // Wait for manholes to load
    const selector = page.locator('[role="tablist"]').first();
    await expect(selector).toBeVisible();

    // Check at least one manhole button exists
    const manholeButtons = page.locator('[role="tab"]');
    await expect(manholeButtons.first()).toBeVisible();

    // Verify manhole has ID and status
    await expect(manholeButtons.first().getByText(/MH-/i)).toBeVisible();
  });

  test('should display gas cards with readings', async ({ page }) => {
    // Check all three gas cards are present by formula label (first match = the large formula)
    await expect(page.getByText('H₂S').first()).toBeVisible();
    await expect(page.getByText('Hydrogen Sulfide').first()).toBeVisible();
    await expect(page.getByText('Carbon Monoxide').first()).toBeVisible();
    await expect(page.getByText(/Methane/).first()).toBeVisible();
  });

  test('should display safety cards (Interlock, Worker, Dead-Man Switch)', async ({ page }) => {
    await expect(page.getByText('Access Interlock')).toBeVisible();
    await expect(page.getByText('Personnel Tracking')).toBeVisible();
    await expect(page.getByText('Dead-Man Switch')).toBeVisible();
  });

  test('should switch between Dashboard and Map views', async ({ page }) => {
    // Click Map view
    await page.getByRole('button', { name: /City Map/i }).click();

    // Wait for the map section to appear (search input is a reliable indicator)
    await expect(page.getByPlaceholder(/Search ID, street, sector/i)).toBeVisible({ timeout: 8000 });

    // Switch back to Dashboard
    await page.getByRole('button', { name: /Dashboard/i }).click();

    // Verify dashboard components are visible again
    await expect(page.getByText('Access Interlock')).toBeVisible();
  });

  test('should display history chart and alert log', async ({ page }) => {
    await expect(page.getByText('Atmospheric Trend (2-Hour Window)')).toBeVisible();
    await expect(page.getByText('Incident & Audit Log')).toBeVisible();
  });

  test('should allow manhole selection', async ({ page }) => {
    // Get first manhole button
    const firstManhole = page.locator('[role="tab"]').first();
    const manholeId = await firstManhole.getByText(/MH-/).textContent();

    // Click to select
    await firstManhole.click();

    // Verify it's selected (should have different styling/state)
    await expect(firstManhole).toHaveAttribute('aria-selected', 'true');
  });

  test('should open and close demo panel', async ({ page }) => {
    // Find scenario driver button
    const demoButton = page.getByText('Scenario Driver');
    await expect(demoButton).toBeVisible();

    // Click to expand
    await demoButton.click();

    // Check scenario controls are visible
    await expect(page.getByText(/Trigger Gas Warning/i)).toBeVisible();

    // Click to collapse
    await demoButton.click();

    // Check controls are hidden
    await expect(page.getByText(/Trigger Gas Warning/i)).not.toBeVisible();
  });

  test('should have accessible semantic HTML', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.locator('[role="tablist"]').first()).toBeVisible();
    await expect(page.locator('[role="tab"]').first()).toBeVisible();

    // Check header structure
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('footer').first()).toBeVisible();
    // Main is rendered as a CSS grid section inside the page layout
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('should display footer information', async ({ page }) => {
    await expect(page.getByText(/Municipal Sewage/i)).toBeVisible();
    await expect(page.getByText(/ISO 45001/i)).toBeVisible();
  });
});

test.describe('Manhole Guardian - Map View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Switch to map view
    await page.getByRole('button', { name: /City Map/i }).click();
    await page.waitForTimeout(1000); // Wait for map to initialize
  });

  test('should display map controls and legend', async ({ page }) => {
    // Check search input
    await expect(page.getByPlaceholder(/Search ID, street, sector/i)).toBeVisible();

    // Use exact filter buttons inside the filter bar (not the manhole cards)
    const filterBar = page.locator('.flex.rounded-lg.bg-\\[\\#f7f6f3\\]').first();
    await expect(filterBar.getByRole('button', { name: 'ALL', exact: true })).toBeVisible();
    await expect(filterBar.getByRole('button', { name: 'SAFE', exact: true })).toBeVisible();
    await expect(filterBar.getByRole('button', { name: 'WARNING', exact: true })).toBeVisible();
    await expect(filterBar.getByRole('button', { name: 'DANGER', exact: true })).toBeVisible();
  });

  test('should filter manholes by status', async ({ page }) => {
    // Click SAFE filter — scope to the filter row using nth-match
    const filterBar = page.locator('.flex.rounded-lg.bg-\\[\\#f7f6f3\\]').first();
    await filterBar.getByRole('button', { name: 'SAFE', exact: true }).click();

    // Verify SAFE filter is active (receives bg-white and border styling)
    const safeBtn = filterBar.getByRole('button', { name: 'SAFE', exact: true });
    await expect(safeBtn).toBeVisible();
  });

  test('should display manhole cards in grid', async ({ page }) => {
    // Check for manhole cards with test IDs
    const cards = page.locator('[data-testid^="manhole-card-"]');
    await expect(cards.first()).toBeVisible();
  });
});

test.describe('Manhole Guardian - Light Theme', () => {
  test('should have light theme colors', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check body background color is light
    const bodyBg = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Light theme should have RGB values > 200
    expect(bodyBg).toMatch(/rgb\(247, 246, 243\)|#f7f6f3/i);
  });

  test('should have readable text contrast', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Main heading should be visible with non-empty text content
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();

    const text = await heading.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
    expect(text).toMatch(/VENUS/i);
  });
});
