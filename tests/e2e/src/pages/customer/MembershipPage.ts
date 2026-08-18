import { expect, Dialog } from '@playwright/test';
import { BasePage } from '../BasePage';

export class MembershipPage extends BasePage {
  async openPlans() {
    await this.goto('/membership/plans');
    await this.expectHeading('Choose Assistance Plan');
  }

  async subscribe(planLabel: string) {
    await this.clickButton(planLabel);
    await this.page.waitForURL('**/membership/status');
  }

  async expectActivePlan(planName: string) {
    await expect(this.page.locator('h3')).toContainText(planName);
    await expect(this.page.locator('text=usage_counter')).not.toBeVisible();
  }

  async cancelMembership() {
    this.page.once('dialog', async (dialog: Dialog) => {
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });
    await this.clickButton('Cancel Membership Renewal');
    await this.expectVisibleText('renewal is cancelled');
  }
}
