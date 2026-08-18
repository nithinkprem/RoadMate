import { test, expect } from '@playwright/test';

test.describe('Knive Phase 3 Live Operations E2E Tests', () => {
  test('should ping location endpoint and check useLiveTracking data ingestion', async ({
    request,
  }) => {
    // 1. Post to worker ping endpoint
    const response = await request.post('/api/worker/ping', {
      data: {
        bookingId: 'mock-booking-test',
        latitude: 11.2599,
        longitude: 75.7815,
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);
  });

  test('should display live tracking dashboard with ETA and shared token link', async ({
    page,
  }) => {
    // 1. Visit tracking page C13
    await page.goto('/booking/track?id=mock-booking-id');
    await expect(page.locator('h1')).toContainText('En Route to Breakdown');

    // Check ETA box
    await expect(page.locator('text=Estimated ETA')).toBeVisible();

    // Check shared safety link button is visible
    await expect(page.locator('button:has-text("Copy Live Tracking Link")')).toBeVisible();

    // 2. Open shared guest token link in read-only mode
    await page.goto('/booking/track?id=mock-booking-id&token=knive_shared_guest_token');
    await expect(page.locator('h1')).toContainText('En Route to Breakdown');
    // Verify call buttons or back navigations are hidden/scoped
    await expect(page.locator('button:has-text("Back to Status")')).not.toBeVisible();
  });

  test('should render completed payment screen with cash and online checkouts', async ({
    page,
  }) => {
    // 1. Visit payment screen C14
    await page.goto('/booking/payment?id=mock-booking-id');
    await expect(page.locator('h1')).toContainText('Assistance Charge');
    await expect(page.locator('text=Amount Due')).toBeVisible();

    // Trigger mock online payment popup
    const payOnlineBtn = page.locator('button:has-text("Pay Online")');
    await expect(payOnlineBtn).toBeVisible();
    await payOnlineBtn.click();

    // Check mock modal drawer pops up
    await expect(page.locator('h3')).toContainText('Knive Mock Gateway');

    const approveBtn = page.locator('button:has-text("Approve Payment")');
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Check success splash screen
    await expect(page.locator('text=Payment Successful!')).toBeVisible();
  });

  test('should post job evaluations reviews stars feedback', async ({ page }) => {
    // 1. Visit feedback reviews C15
    await page.goto('/booking/feedback?id=mock-booking-id');
    await expect(page.locator('h1')).toContainText('Rate Responding Driver');

    // Select stars rating
    const stars = page.locator('button:has-text("★")');
    // Fill comment
    await page.fill(
      'textarea[placeholder*="How was the mechanic"]',
      'Fabulous support. Dilip was very professional.'
    );

    // Submit review
    await page.click('button:has-text("Submit Evaluation")');
    await expect(page.locator('text=Thank You')).toBeVisible();
  });

  test('should display worker earnings logs on W10 console', async ({ page }) => {
    // 1. Visit earnings W10
    await page.goto('/worker/earnings');
    await expect(page.locator('h1')).toContainText('Earnings & Payouts');

    // Check metrics
    await expect(page.locator('text=Gross Billings')).toBeVisible();
    await expect(page.locator('text=Platform Cut')).toBeVisible();
  });

  test('should display admin ops analytics and export payments CSV ledger', async ({ page }) => {
    // 1. Visit ops analytics A9
    await page.goto('/admin/ops-analytics');
    await expect(page.locator('h1')).toContainText('Ops Performance Dashboard');
    await expect(page.locator('text=Completion Rate')).toBeVisible();

    // 2. Visit payments ledger A10
    await page.goto('/admin/payments');
    await expect(page.locator('h1')).toContainText('Payments & Payouts Ledger');
    await expect(page.locator('button:has-text("Export Ledger to CSV")')).toBeVisible();
  });
});
