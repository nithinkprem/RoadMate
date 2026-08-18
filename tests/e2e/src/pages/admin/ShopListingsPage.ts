import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ShopListingsPage extends BasePage {
  async expectLoaded() {
    await this.expectHeading('Calicut Shop Directory');
    await this.expectVisibleText('Owner / Contact');
  }

  async openNewShopForm() {
    await this.clickButton('Add New Shop');
    await this.page.waitForURL(/\/admin\/listings\/new/);
  }

  async expectNewShopFormVisible() {
    await this.expectHeading('Add New Shop');
    await expect(this.page.getByText('Shop Name')).toBeVisible();
    await expect(this.buttonByName('Save Shop Listing')).toBeVisible();
  }
}
