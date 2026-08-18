import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class BookingPage extends BasePage {
  async openNewRequest(query: string) {
    await this.goto(`/booking/new?${query}`);
  }

  async expectRequestHeading(text: string) {
    await this.expectHeading(text);
  }

  async fillNotes(placeholderFragment: string, notes: string) {
    await this.page.fill(`textarea[placeholder*="${placeholderFragment}"]`, notes);
  }

  async expectSubmitVisible() {
    await expect(this.buttonByName('Submit Request')).toBeVisible();
  }

  async expectPrefilledFromDiagnosis() {
    await this.page.waitForURL('**/booking/new**');
    await expect(this.page.locator('text=Pre-filled with AI').first()).toBeVisible();
  }
}
