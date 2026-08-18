import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class WorkerRegistrationPage extends BasePage {
  async open() {
    await this.goto('/worker/register');
    await this.expectHeading('Worker Registration');
  }

  async fillPartnerDetails(name: string, phone: string, vehicleType: string, plate: string) {
    await this.page.fill('input[placeholder="Rasheed P. K."]', name);
    await this.page.fill('input[placeholder="9876543210"]', phone);
    await this.page.fill('input[placeholder="Pickup Van"]', vehicleType);
    await this.page.fill('input[placeholder="KL-11-AA-1234"]', plate);
    await this.clickButton('Next: Services');
    await this.expectVisibleText('Step 2: Services');
  }

  async setServicePricing(basePrice: string) {
    const tyreCheckbox = this.page.locator('input[type="checkbox"]').first();
    await expect(tyreCheckbox).toBeChecked();
    await this.page.fill('input[type="number"]', basePrice);
    await this.clickButton('Next: Verify');
    await this.expectVisibleText('Step 3: Documents');
  }

  async expectDocumentUploadStepVisible() {
    await this.expectVisibleText('Upload License');
    await expect(this.buttonByName('Finish Register')).toBeVisible();
  }
}
