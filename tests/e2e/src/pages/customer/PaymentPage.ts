import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class PaymentPage extends BasePage {
  async open(bookingId: string) {
    await this.goto(`/booking/payment?id=${bookingId}`);
    await this.expectHeading('Assistance Charge');
    await this.expectVisibleText('Amount Due');
  }

  async payOnline() {
    await this.clickButton('Pay Online');
    await expect(this.page.locator('h3')).toContainText('Knive Mock Gateway');
    await this.clickButton('Approve Payment');
  }

  async expectPaymentSuccess() {
    await this.expectVisibleText('Payment Successful!');
  }
}
