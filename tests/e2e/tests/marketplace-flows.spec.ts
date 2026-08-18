import { test } from '../src/fixtures/test-fixtures';
import { testData } from '../src/data/test-data';

test.describe('Knive Marketplace E2E Booking & Dispatch Flows', () => {
  test('should register a worker and process a breakdown booking request', async ({
    workerRegistrationPage,
  }) => {
    await workerRegistrationPage.open();
    await workerRegistrationPage.fillPartnerDetails(
      testData.worker.name,
      testData.worker.phone,
      testData.worker.vehicleType,
      testData.worker.plate
    );
    await workerRegistrationPage.setServicePricing(testData.worker.basePrice);
    await workerRegistrationPage.expectDocumentUploadStepVisible();
  });

  test('should manage worker duty availability toggle', async ({ workerDashboardPage }) => {
    await workerDashboardPage.open();
    await workerDashboardPage.expectOffDuty();
    await workerDashboardPage.goOnline();
  });

  test('should dispatch a puncture fix request and trace status', async ({ bookingPage }) => {
    await bookingPage.openNewRequest(testData.location.bookingQuery);
    await bookingPage.expectRequestHeading('Request Tyre Puncture');
    await bookingPage.fillNotes('Scooter tyre has a nail', testData.booking.notes);
    await bookingPage.expectSubmitVisible();
  });

  test('should display active bookings on the admin Kanban board', async ({
    bookingsBoardPage,
  }) => {
    await bookingsBoardPage.open();
    await bookingsBoardPage.expectStatusColumnsVisible();
  });
});
