import { test, expect } from '@playwright/test';

test.describe('Knive Admin E2E & Accessibility Tests', () => {
  test('should sign in using mock bypass and manage shop directory', async ({ page }) => {
    // 1. Visit admin login
    await page.goto('/admin/login');
    await expect(page.locator('h1')).toContainText('Admin Back Office');

    // 2. Click mock bypass button
    const bypassButton = page.locator('button:has-text("Simulate Mock Admin Bypass")');
    await expect(bypassButton).toBeVisible();
    await bypassButton.click();

    // Verify redirected to dashboard
    await page.waitForURL(/\/admin\/analytics/);
    await expect(page.locator('h1')).toContainText('Operations Analytics');

    // Verify metric cards are loaded
    await expect(page.locator('text=Active Shops')).toBeVisible();
    await expect(page.locator('text=Total Searches')).toBeVisible();

    // 3. Navigate to Listings Directory
    const listingsLink = page.locator('a:has-text("Shop Listings")');
    await expect(listingsLink).toBeVisible();
    await listingsLink.click();
    await page.waitForURL(/\/admin\/listings/);

    // Verify table listings
    await expect(page.locator('h1')).toContainText('Calicut Shop Directory');
    await expect(page.locator('text=Owner / Contact')).toBeVisible();

    // 4. Load Create New Shop Form
    const addShopButton = page.locator('button:has-text("Add New Shop")');
    await expect(addShopButton).toBeVisible();
    await addShopButton.click();
    await page.waitForURL(/\/admin\/listings\/new/);

    // Verify form renders
    await expect(page.locator('h1')).toContainText('Add New Shop');
    await expect(page.locator('label:has-text("Shop Name")')).toBeVisible();
    await expect(page.locator('button:has-text("Save Shop Listing")')).toBeVisible();
  });

  test('should follow basic accessibility guidelines (Semantic & Keyboard-nav check)', async ({
    page,
  }) => {
    // Visit home page
    await page.goto('/');

    // 1. Verify page has appropriate structure landmarks
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // 2. Check form controls accessibility
    const addressInput = page.locator('input[placeholder*="Type landmark"]');
    await expect(addressInput).toBeVisible();
    // Inputs must be focusable
    await addressInput.focus();
    await expect(addressInput).toBeFocused();

    // 3. Ensure button role labels are present
    const locateButton = page.locator('button:has-text("GPS Location")');
    await expect(locateButton).toHaveRole('button');
  });
});
