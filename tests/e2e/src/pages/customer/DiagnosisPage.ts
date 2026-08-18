import { expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ImageDiagnosisPage extends BasePage {
  async open() {
    await this.goto('/diagnose/image');
    await this.expectHeading('Snapshot Issue Diagnosis');
  }

  async uploadImage(fileName: string) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.locator('span:has-text("choose file")').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: fileName,
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-bytes'),
    });
  }

  async expectDiagnosisResult(defectLabel: string) {
    await expect(this.page.locator('text=Confidence score')).toBeVisible({ timeout: 6000 });
    await this.expectVisibleText(defectLabel);
  }

  async confirmAndBookRescue() {
    await this.clickButton('Confirm & Book Rescue');
  }
}

export class AudioDiagnosisPage extends BasePage {
  async open() {
    await this.goto('/diagnose/audio');
    await this.expectHeading('Engine Noise diagnostics');
  }

  async recordNoise() {
    await this.clickButton('Record Noise');
  }

  async expectDiagnosisResult(label: string, timeout = 7000) {
    await expect(this.page.locator(`text=${label}`)).toBeVisible({ timeout });
  }

  async confirmAndBookRescue() {
    await this.clickButton('Confirm & Book Rescue');
  }
}
