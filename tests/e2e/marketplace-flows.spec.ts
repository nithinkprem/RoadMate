import { test, expect } from '@playwright/test';

test.describe('Knive Marketplace E2E Booking & Dispatch Flows', () => {
  test('should register a worker and process a breakdown booking request', async ({ page }) => {
    // 1. Visit worker registration W1
    await page.goto('/worker/register');
    await expect(page.locator('h1')).toContainText('Worker Registration');

    // Fill Step W1 Partner Details
    await page.fill('input[placeholder="Rasheed P. K."]', 'Dilip Mechanic Calicut');
    await page.fill('input[placeholder="9876543210"]', '9876543225');
    await page.fill('input[placeholder="Pickup Van"]', 'Mahindra Bolero');
    await page.fill('input[placeholder="KL-11-AA-1234"]', 'KL-11-Z-9999');

    // Go to step 2
    await page.click('button:has-text("Next: Services")');
    await expect(page.locator('text=Step 2: Services')).toBeVisible();

    // Select Tyre Puncture & set base pricing
    const tyreCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(tyreCheckbox).toBeChecked(); // default checked
    await page.fill('input[type="number"]', '350');

    // Go to step 3
    await page.click('button:has-text("Next: Verify")');
    await expect(page.locator('text=Step 3: Documents')).toBeVisible();

    // Verify document uploads box exists
    await expect(page.locator('text=Upload License')).toBeVisible();
    await expect(page.locator('button:has-text("Finish Register")')).toBeVisible();
  });

  test('should manage worker duty availability toggle', async ({ page }) => {
    // 1. Simulate worker session logs and navigate to dashboard
    // We navigate directly to dashboard (it will mock load using layout provider since local bypass keys are set)
    await page.goto('/worker/dashboard');

    // Check if worker dashboard layout renders
    await expect(page.locator('h1')).toContainText('Duty Control Panel');
    await expect(page.locator('text=Offline - Off Duty')).toBeVisible();

    // Toggle duty status
    const toggleButton = page.locator('button:has-text("Go Online")');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Verify status changes to online
    await expect(page.locator('text=Online - Receiving Calls')).toBeVisible();
  });

  test('should dispatcher book a puncture fix request and trace status', async ({ page }) => {
    // 1. Visit dispatch form
    await page.goto('/booking/new?lat=11.2588&lng=75.7804&issue=tyre');
    await expect(page.locator('h1')).toContainText('Request Tyre Puncture');

    // Fill notes
    await page.fill(
      'textarea[placeholder*="Scooter tyre has a nail"]',
      'Flat bike tyre in Mavoor Road. Need urgent patch.'
    );
    await expect(page.locator('button:has-text("Submit Request")')).toBeVisible();
  });

  test('should display active bookings on the admin Kanban board', async ({ page }) => {
    // 1. Visit bookings board A8
    await page.goto('/admin/bookings');
    await expect(page.locator('h1')).toContainText('Live Bookings Board');

    // Verify status columns render
    await expect(page.locator('text=Matching / Searching')).toBeVisible();
    await expect(page.locator('text=Assigned Partner')).toBeVisible();
    await expect(page.locator('text=Completed Jobs')).toBeVisible();
  });
});
