import { test, expect } from '../src/fixtures/test-fixtures';

test.describe('Knive Admin E2E & Accessibility Tests', () => {
  test('should sign in using mock bypass and manage shop directory', async ({
    adminAuthedPage,
    adminAnalyticsPage,
    shopListingsPage,
  }) => {
    await test.step('Land on Operations Analytics after bypass sign-in', async () => {
      await adminAnalyticsPage.expectLoaded();
    });

    await test.step('Navigate to Shop Listings directory', async () => {
      await adminAnalyticsPage.goToShopListings();
      await shopListingsPage.expectLoaded();
    });

    await test.step('Open the Add New Shop form', async () => {
      await shopListingsPage.openNewShopForm();
      await shopListingsPage.expectNewShopFormVisible();
    });
  });

  test('should follow basic accessibility guidelines (semantic & keyboard-nav check)', async ({
    homePage,
  }) => {
    await test.step('Visit home page', async () => {
      await homePage.goto('/');
    });

    await test.step('Verify landmark structure (header/main/footer)', async () => {
      await homePage.expectStructuralLandmarks();
    });

    await test.step('Verify form controls are keyboard-focusable', async () => {
      await homePage.expectAddressInputFocusable();
    });

    await test.step('Verify interactive elements expose correct roles', async () => {
      await homePage.expectGpsButtonHasRole();
    });
  });
});
