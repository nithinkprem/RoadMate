import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/** Live Bookings Board (A8) */
export class BookingsBoardPage extends BasePage {
  async open() {
    await this.goto('/admin/bookings');
    await this.expectHeading('Live Bookings Board');
  }

  async expectStatusColumnsVisible() {
    await this.expectVisibleText('Matching / Searching');
    await this.expectVisibleText('Assigned Partner');
    await this.expectVisibleText('Completed Jobs');
  }
}

/** Ops Performance Dashboard (A9) */
export class OpsAnalyticsPage extends BasePage {
  async open() {
    await this.goto('/admin/ops-analytics');
    await this.expectHeading('Ops Performance Dashboard');
    await this.expectVisibleText('Completion Rate');
  }
}

/** Payments & Payouts Ledger (A10) */
export class PaymentsLedgerPage extends BasePage {
  async open() {
    await this.goto('/admin/payments');
    await this.expectHeading('Payments & Payouts Ledger');
  }

  async expectExportButtonVisible() {
    await expect(this.buttonByName('Export Ledger to CSV')).toBeVisible();
  }
}

/** Super Admin configuration panels (A11-A15) */
export class AdminConfigPages extends BasePage {
  async openCities() {
    await this.goto('/admin/cities');
    await this.expectHeading('City configurations');
  }

  async openUsers() {
    await this.goto('/admin/users');
    await this.expectHeading('Operator User Directory');
  }

  async openMemberships() {
    await this.goto('/admin/memberships');
    await this.expectHeading('Assistance Subscriptions');
  }

  async openDiagnoses() {
    await this.goto('/admin/diagnoses');
    await this.expectHeading('AI Diagnoses logs');
  }

  async openEmergencies() {
    await this.goto('/admin/emergencies');
    await this.expectHeading('SOS Emergency Logs');
  }
}
