import { test, expect } from '@playwright/test';

test.describe('Knive Customer E2E Journey', () => {
  test('should locate user and search tyre puncture shops in Calicut', async ({ page }) => {
    // 1. Visit the home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Knive/);

    // Verify main brand header renders
    await expect(page.locator('h1')).toContainText('Stranded?');

    // 2. Locate user (Trigger mock geolocation fallback)
    const locateButton = page.locator('button:has-text("GPS Location")');
    await expect(locateButton).toBeVisible();
    await locateButton.click();

    // Verify location resolved block is displayed
    const successBanner = page.locator('text=Location Set:');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText('Mavoor Road');

    // 3. Select Category: Tyre Puncture
    const tyreButton = page.locator('button:has-text("Tyre Puncture")');
    await expect(tyreButton).toBeVisible();

    // Clicking redirects to results
    await tyreButton.click();
    await page.waitForURL(/\/results/);

    // 4. Verify Results Page
    const resultsHeader = page.locator('text=Tyre Puncture Directory');
    await expect(resultsHeader).toBeVisible();

    // Verify mock shop cards are listed
    const shopCard = page.locator('text=Calicut Tyre Hub & Puncture Clinic');
    await expect(shopCard).toBeVisible();

    // Verify deep links (Call / Navigate buttons) exist on the card
    const callButton = page.locator('a:has-text("Call Shop")').first();
    await expect(callButton).toBeVisible();
    await expect(callButton).toHaveAttribute('href', /tel:/);

    // 5. Open Shop Detail Page
    await shopCard.click();
    await page.waitForURL(/\/shop\/mock-shop-1/);

    // Verify Shop detail page renders
    await expect(page.locator('h1')).toContainText('Calicut Tyre Hub & Puncture Clinic');

    // Check credentials panel
    await expect(page.locator('text=UPI Accepted')).toBeVisible();
    await expect(page.locator('text=Mobile Mechanic Available')).toBeVisible();

    // Check ratings section
    await expect(page.locator('h2:has-text("Ratings")')).toBeVisible();
  });
});
