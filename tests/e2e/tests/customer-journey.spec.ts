import { test } from '../src/fixtures/test-fixtures';
import { testData } from '../src/data/test-data';

test.describe('Knive Customer E2E Journey', () => {
  test('should locate user and search tyre puncture shops in Calicut', async ({
    homePage,
    resultsPage,
    shopDetailPage,
  }) => {
    await test.step('Visit home page and verify brand header', async () => {
      await homePage.open();
    });

    await test.step('Locate user via mock geolocation fallback', async () => {
      const banner = await homePage.locateUser();
      await banner.waitFor();
    });

    await test.step('Select the Tyre Puncture category', async () => {
      await homePage.selectCategory(testData.categories.tyrePuncture);
    });

    await test.step('Verify results directory and shop card', async () => {
      await resultsPage.expectDirectoryLoaded('Tyre Puncture Directory');
      await resultsPage.expectCallButtonLinksToTel();
    });

    await test.step('Open shop detail page and verify content', async () => {
      await resultsPage.openShop(testData.shop.name);
      await shopDetailPage.expectLoaded(testData.shop.name);
      await shopDetailPage.expectCredentialsVisible();
      await shopDetailPage.expectRatingsSectionVisible();
    });
  });
});
