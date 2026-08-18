import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class TrackingPage extends BasePage {
  async open(bookingId: string, token?: string) {
    const query = token ? `id=${bookingId}&token=${token}` : `id=${bookingId}`;
    await this.goto(`/booking/track?${query}`);
    await this.expectHeading('En Route to Breakdown');
  }

  async expectEtaVisible() {
    await this.expectVisibleText('Estimated ETA');
  }

  async expectCopyLinkButtonVisible() {
    await expect(this.buttonByName('Copy Live Tracking Link')).toBeVisible();
  }

  async expectBackToStatusHidden() {
    await expect(this.buttonByName('Back to Status')).not.toBeVisible();
  }
}
