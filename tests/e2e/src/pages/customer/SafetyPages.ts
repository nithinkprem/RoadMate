import { BasePage } from '../BasePage';

export class ContactsPage extends BasePage {
  async open() {
    await this.goto('/contacts');
    await this.expectHeading('Trusted Contacts');
  }

  async addContact(name: string, phone: string) {
    await this.page.fill('input[placeholder="e.g. Aswathy Nair"]', name);
    await this.page.fill('input[placeholder="e.g. 9876543230"]', phone);
    await this.clickButton('Save Contact Details');
  }

  async expectContactListed(name: string) {
    await this.expectVisibleText(name);
  }
}

export class EmergencyPage extends BasePage {
  async open() {
    await this.goto('/emergency');
    await this.expectHeading('Emergency SOS Desk');
  }

  async triggerSos() {
    await this.clickButton('Trigger SOS');
  }

  async expectSosActive(contactName: string) {
    await this.expectVisibleText('SOS Dispatch Active!');
    await this.expectVisibleText(contactName);
  }
}
