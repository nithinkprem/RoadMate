import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class HomePage extends BasePage {
  readonly addressInput = this.page.locator('input[placeholder*="Type landmark"]');
  readonly gpsLocationButton = this.page.getByRole('button', { name: 'GPS Location' });

  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.goto('/');
    await expect(this.page).toHaveTitle(/Knive/);
    await this.expectHeading('Stranded?');
  }

  async locateUser() {
    await expect(this.gpsLocationButton).toBeVisible();
    await this.gpsLocationButton.click();
    const successBanner = this.page.locator('text=Location Set:');
    await expect(successBanner).toBeVisible();
    return successBanner;
  }

  async selectCategory(category: string) {
    const categoryButton = this.buttonByName(category);
    await expect(categoryButton).toBeVisible();
    await categoryButton.click();
    await this.page.waitForURL(/\/results/);
  }

  async expectStructuralLandmarks() {
    await expect(this.page.locator('header')).toBeVisible();
    await expect(this.page.locator('main')).toBeVisible();
    await expect(this.page.locator('footer')).toBeVisible();
  }

  async expectAddressInputFocusable() {
    await expect(this.addressInput).toBeVisible();
    await this.addressInput.focus();
    await expect(this.addressInput).toBeFocused();
  }

  async expectGpsButtonHasRole() {
    await expect(this.gpsLocationButton).toHaveRole('button');
  }
}
