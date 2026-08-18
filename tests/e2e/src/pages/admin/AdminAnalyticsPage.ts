import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AdminAnalyticsPage extends BasePage {
  async expectLoaded() {
    await this.expectHeading('Operations Analytics');
    await this.expectVisibleText('Active Shops');
    await this.expectVisibleText('Total Searches');
  }

  async goToShopListings() {
    await this.clickLink('Shop Listings');
    await this.page.waitForURL(/\/admin\/listings/);
  }
}
