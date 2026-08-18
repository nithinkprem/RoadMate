import { test } from '../src/fixtures/test-fixtures';
import { testData } from '../src/data/test-data';

test.describe('Knive Phase 4 Growth & Differentiation E2E Tests', () => {
  test('should manage membership plan subscription and cancellation', async ({
    membershipPage,
  }) => {
    await membershipPage.openPlans();
    await membershipPage.subscribe(testData.membership.planLabel);
    await membershipPage.expectActivePlan(testData.membership.planName);
    await membershipPage.cancelMembership();
  });

  test('should run AI image diagnosis and hand off to booking', async ({
    imageDiagnosisPage,
    bookingPage,
  }) => {
    await imageDiagnosisPage.open();
    await imageDiagnosisPage.uploadImage(testData.diagnosis.imageFile);
    await imageDiagnosisPage.expectDiagnosisResult(testData.diagnosis.imageDefect);
    await imageDiagnosisPage.confirmAndBookRescue();
    await bookingPage.expectPrefilledFromDiagnosis();
  });

  test('should run acoustic engine-noise diagnosis and hand off to booking', async ({
    audioDiagnosisPage,
    bookingPage,
  }) => {
    await audioDiagnosisPage.open();
    await audioDiagnosisPage.recordNoise();
    await audioDiagnosisPage.expectDiagnosisResult(testData.diagnosis.audioDefect);
    await audioDiagnosisPage.confirmAndBookRescue();
    await bookingPage.expectPrefilledFromDiagnosis();
  });

  test('should add a trusted contact and trigger SOS panic alert', async ({
    contactsPage,
    emergencyPage,
  }) => {
    await contactsPage.open();
    await contactsPage.addContact(testData.contacts.name, testData.contacts.phone);
    await contactsPage.expectContactListed(testData.contacts.name);

    await emergencyPage.open();
    await emergencyPage.triggerSos();
    await emergencyPage.expectSosActive(testData.contacts.name);
  });

  test('should search providers along a travel route', async ({ travelPage }) => {
    await travelPage.open();
    await travelPage.searchRoute(testData.travel.from, testData.travel.to);
    await travelPage.expectResultVisible(testData.travel.expectedShop);
  });

  test('should register a fleet vehicle', async ({ fleetPage }) => {
    await fleetPage.open();
    await fleetPage.addVehicle(
      testData.fleet.plate,
      testData.fleet.make,
      testData.fleet.model,
      testData.fleet.expiry
    );
    await fleetPage.expectVehicleListed(testData.fleet.plate);
  });

  test('should verify Super Admin configuration panels', async ({ adminConfigPages }) => {
    await adminConfigPages.openCities();
    await adminConfigPages.openUsers();
    await adminConfigPages.openMemberships();
    await adminConfigPages.openDiagnoses();
    await adminConfigPages.openEmergencies();
  });
});
