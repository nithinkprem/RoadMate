import { test, expect } from '@playwright/test';

test.describe('Knive Phase 4 Growth & Differentiation E2E Tests', () => {
  test('should manage membership plans subscription and cancellations', async ({ page }) => {
    // 1. Visit plans page C16
    await page.goto('/membership/plans');
    await expect(page.locator('h1')).toContainText('Choose Assistance Plan');

    // Subscribe to Basic
    await page.click('button:has-text("Subscribe Basic")');
    await page.waitForURL('**/membership/status');

    // 2. Check active membership status C17
    await expect(page.locator('h3')).toContainText('BASIC GUARD');
    await expect(page.locator('text=usage_counter')).not.toBeVisible(); // custom text representation

    // Cancel plan
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });
    await page.click('button:has-text("Cancel Membership Renewal")');
    await expect(page.locator('text=renewal is cancelled')).toBeVisible();
  });

  test('should run AI snapshot image diagnoses scans and checkup suggestions', async ({ page }) => {
    // 1. Visit Image Diagnosis C18
    await page.goto('/diagnose/image');
    await expect(page.locator('h1')).toContainText('Snapshot Issue Diagnosis');

    // Simulate file input trigger
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('span:has-text("choose file")').click();
    const fileChooser = await fileChooserPromise;

    // Provide a dummy buffer for validation
    await fileChooser.setFiles({
      name: 'tyre_crack.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-bytes'),
    });

    // Wait for AI results suggestion resolving
    await expect(page.locator('text=Confidence score')).toBeVisible({ timeout: 6000 });
    await expect(page.locator('text=Tyre Puncture defect')).toBeVisible();

    // Proceed to booking matcher pre-fill C8
    await page.click('button:has-text("Confirm & Book Rescue")');
    await page.waitForURL('**/booking/new**');
    await expect(page.locator('text=Pre-filled with AI Diagnoser suggestion')).toBeVisible();
  });

  test('should run acoustical spectrographic diagnoses checks', async ({ page }) => {
    // 1. Visit Audio Diagnosis C19
    await page.goto('/diagnose/audio');
    await expect(page.locator('h1')).toContainText('Engine Noise diagnostics');

    // Click Record
    await page.click('button:has-text("Record Noise")');
    // Wait for microphone listening and parsing Suggestion
    await expect(page.locator('text=Battery dead')).toBeVisible({ timeout: 7000 });

    // Handoff to booking dispatch C8
    await page.click('button:has-text("Confirm & Book Rescue")');
    await page.waitForURL('**/booking/new**');
    await expect(page.locator('text=Pre-filled with AI').first()).toBeVisible();
  });

  test('should add trusted contacts and test SOS panic triggers', async ({ page }) => {
    // 1. Visit contacts manager C21
    await page.goto('/contacts');
    await expect(page.locator('h1')).toContainText('Trusted Contacts');

    // Add Aswathy
    await page.fill('input[placeholder="e.g. Aswathy Nair"]', 'Aswathy Nair');
    await page.fill('input[placeholder="e.g. 9876543230"]', '9876543230');
    await page.click('button:has-text("Save Contact Details")');

    // Check Aswathy is listed
    await expect(page.locator('text=Aswathy Nair')).toBeVisible();

    // 2. Visit Emergency Desk C20
    await page.goto('/emergency');
    await expect(page.locator('h1')).toContainText('Emergency SOS Desk');

    // Click SOS Alert Button
    await page.click('button:has-text("Trigger SOS")');
    await expect(page.locator('text=SOS Dispatch Active!')).toBeVisible();
    await expect(page.locator('text=Aswathy Nair')).toBeVisible();
  });

  test('should test travel route search mechanics along the corridor path', async ({ page }) => {
    // 1. Visit Travel C22
    await page.goto('/travel');
    await expect(page.locator('h1')).toContainText('Travel Mode Search');

    // Input route
    await page.fill('input[placeholder="e.g. Palayam, Kozhikode"]', 'Palayam, Kozhikode');
    await page.fill('input[placeholder="e.g. Beypore Beach, Calicut"]', 'Beypore Beach, Calicut');
    await page.click('button:has-text("Scan Providers Along Route")');

    // Check results are rendered
    await expect(page.locator('text=Beypore Tyre Puncture')).toBeVisible();
  });

  test('should list vehicle registrations and maintenance workshop costs', async ({ page }) => {
    // 1. Visit Fleet C23
    await page.goto('/fleet');
    await expect(page.locator('h1')).toContainText('Fleet Operations Console');

    // Add truck
    await page.fill('input[placeholder="KL-11-AA-5555"]', 'KL-11-CC-7777');
    await page.fill('input[placeholder="Tata"]', 'Mahindra');
    await page.fill('input[placeholder="Ace Gold"]', 'Bolero');
    await page.fill('input[id="v-expiry"]', '2026-12-31');
    await page.click('button:has-text("Save Vehicle")');

    // Check truck listed
    await expect(page.locator('text=KL-11-CC-7777')).toBeVisible();
  });

  test('should verify Super Admin configuration panels', async ({ page }) => {
    // 1. Visit Cities settings A14
    await page.goto('/admin/cities');
    await expect(page.locator('h1')).toContainText('City configurations');

    // 2. Visit Users roles assignments A15
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('Operator User Directory');

    // 3. Visit Memberships auditor list A11
    await page.goto('/admin/memberships');
    await expect(page.locator('h1')).toContainText('Assistance Subscriptions');

    // 4. Visit AI diagnoses list A12
    await page.goto('/admin/diagnoses');
    await expect(page.locator('h1')).toContainText('AI Diagnoses logs');

    // 5. Visit emergencies SOS list A13
    await page.goto('/admin/emergencies');
    await expect(page.locator('h1')).toContainText('SOS Emergency Logs');
  });
});
