import { BasePage } from '../BasePage';

export class WorkerDashboardPage extends BasePage {
  async open() {
    await this.goto('/worker/dashboard');
    await this.expectHeading('Duty Control Panel');
  }

  async expectOffDuty() {
    await this.expectVisibleText('Offline - Off Duty');
  }

  async goOnline() {
    await this.clickButton('Go Online');
    await this.expectVisibleText('Online - Receiving Calls');
  }
}

export class WorkerEarningsPage extends BasePage {
  async open() {
    await this.goto('/worker/earnings');
    await this.expectHeading('Earnings & Payouts');
  }

  async expectMetricsVisible() {
    await this.expectVisibleText('Gross Billings');
    await this.expectVisibleText('Platform Cut');
  }
}
