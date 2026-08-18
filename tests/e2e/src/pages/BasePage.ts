import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage centralizes navigation and assertion helpers shared by every
 * page object in the framework. Domain page objects extend this class
 * instead of duplicating `page.goto` / heading-check boilerplate.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async expectHeading(text: string | RegExp, level: 'h1' | 'h2' | 'h3' = 'h1') {
    await expect(this.page.locator(level).first()).toContainText(text);
  }

  async expectVisibleText(text: string) {
    await expect(this.page.locator(`text=${text}`)).toBeVisible();
  }

  async clickButton(name: string) {
    await this.page.getByRole('button', { name }).click();
  }

  async clickLink(name: string) {
    await this.page.getByRole('link', { name }).click();
  }

  buttonByName(name: string): Locator {
    return this.page.getByRole('button', { name });
  }

  linkByName(name: string): Locator {
    return this.page.getByRole('link', { name });
  }
}
