import { BasePage } from '../BasePage';

export class FeedbackPage extends BasePage {
  async open(bookingId: string) {
    await this.goto(`/booking/feedback?id=${bookingId}`);
    await this.expectHeading('Rate Responding Driver');
  }

  async submitReview(comment: string) {
    await this.page.fill('textarea[placeholder*="How was the mechanic"]', comment);
    await this.clickButton('Submit Evaluation');
  }

  async expectThankYouVisible() {
    await this.expectVisibleText('Thank You');
  }
}
