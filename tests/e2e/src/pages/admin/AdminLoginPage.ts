import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class AdminLoginPage extends BasePage {
  readonly bypassButton = this.page.getByRole('button', { name: 'Simulate Mock Admin Bypass' });

  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.goto('/admin/login');
    await this.expectHeading('Admin Back Office');
  }

  async signInWithMockBypass() {
    await expect(this.bypassButton).toBeVisible();
    await this.bypassButton.click();
    await this.page.waitForURL(/\/admin\/analytics/);
  }
}
