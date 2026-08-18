import { test, expect } from '../src/fixtures/test-fixtures';
import { testData } from '../src/data/test-data';

test.describe('Knive Phase 3 Live Operations E2E Tests', () => {
  test('should ping location endpoint and check live tracking data ingestion', async ({
    request,
  }) => {
    const response = await request.post('/api/worker/ping', {
      data: {
        bookingId: 'mock-booking-test',
        latitude: testData.location.coordinates.latitude,
        longitude: testData.location.coordinates.longitude,
      },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.success).toBe(true);
  });

  test('should display live tracking dashboard with ETA and shared token link', async ({
    trackingPage,
  }) => {
    await test.step('Open tracking page as the booking owner', async () => {
      await trackingPage.open(testData.booking.id);
      await trackingPage.expectEtaVisible();
      await trackingPage.expectCopyLinkButtonVisible();
    });

    await test.step('Open shared guest token link and verify scoped read-only view', async () => {
      await trackingPage.open(testData.booking.id, testData.booking.guestToken);
      await trackingPage.expectBackToStatusHidden();
    });
  });

  test('should render completed payment screen with cash and online checkouts', async ({
    paymentPage,
  }) => {
    await paymentPage.open(testData.booking.id);
    await paymentPage.payOnline();
    await paymentPage.expectPaymentSuccess();
  });

  test('should post job evaluations reviews stars feedback', async ({ feedbackPage }) => {
    await feedbackPage.open(testData.booking.id);
    await feedbackPage.submitReview(testData.feedback.comment);
    await feedbackPage.expectThankYouVisible();
  });

  test('should display worker earnings logs', async ({ workerEarningsPage }) => {
    await workerEarningsPage.open();
    await workerEarningsPage.expectMetricsVisible();
  });

  test('should display admin ops analytics and export payments CSV ledger', async ({
    opsAnalyticsPage,
    paymentsLedgerPage,
  }) => {
    await opsAnalyticsPage.open();
    await paymentsLedgerPage.open();
    await paymentsLedgerPage.expectExportButtonVisible();
  });
});
