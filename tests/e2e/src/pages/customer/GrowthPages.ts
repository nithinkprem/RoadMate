import { BasePage } from '../BasePage';

export class TravelPage extends BasePage {
  async open() {
    await this.goto('/travel');
    await this.expectHeading('Travel Mode Search');
  }

  async searchRoute(from: string, to: string) {
    await this.page.fill('input[placeholder="e.g. Palayam, Kozhikode"]', from);
    await this.page.fill('input[placeholder="e.g. Beypore Beach, Calicut"]', to);
    await this.clickButton('Scan Providers Along Route');
  }

  async expectResultVisible(shopName: string) {
    await this.expectVisibleText(shopName);
  }
}

export class FleetPage extends BasePage {
  async open() {
    await this.goto('/fleet');
    await this.expectHeading('Fleet Operations Console');
  }

  async addVehicle(plate: string, make: string, model: string, expiry: string) {
    await this.page.fill('input[placeholder="KL-11-AA-5555"]', plate);
    await this.page.fill('input[placeholder="Tata"]', make);
    await this.page.fill('input[placeholder="Ace Gold"]', model);
    await this.page.fill('input[id="v-expiry"]', expiry);
    await this.clickButton('Save Vehicle');
  }

  async expectVehicleListed(plate: string) {
    await this.expectVisibleText(plate);
  }
}
