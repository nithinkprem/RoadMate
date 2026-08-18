import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ResultsPage extends BasePage {
  async expectDirectoryLoaded(directoryLabel: string) {
    await this.expectVisibleText(directoryLabel);
  }

  shopCard(shopName: string) {
    return this.page.locator(`text=${shopName}`);
  }

  async openShop(shopName: string) {
    const card = this.shopCard(shopName);
    await expect(card).toBeVisible();
    await card.click();
  }

  async expectCallButtonLinksToTel() {
    const callButton = this.page.getByRole('link', { name: 'Call Shop' }).first();
    await expect(callButton).toBeVisible();
    await expect(callButton).toHaveAttribute('href', /tel:/);
  }
}

export class ShopDetailPage extends BasePage {
  async expectLoaded(shopName: string) {
    await this.expectHeading(shopName);
  }

  async expectCredentialsVisible() {
    await this.expectVisibleText('UPI Accepted');
    await this.expectVisibleText('Mobile Mechanic Available');
  }

  async expectRatingsSectionVisible() {
    await expect(this.page.locator('h2:has-text("Ratings")')).toBeVisible();
  }
}
