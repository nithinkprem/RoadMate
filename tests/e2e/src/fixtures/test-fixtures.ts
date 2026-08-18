import { test as base, Page } from '@playwright/test';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage';
import { ShopListingsPage } from '../pages/admin/ShopListingsPage';
import {
  BookingsBoardPage,
  OpsAnalyticsPage,
  PaymentsLedgerPage,
  AdminConfigPages,
} from '../pages/admin/AdminOperationsPages';
import { HomePage } from '../pages/customer/HomePage';
import { ResultsPage, ShopDetailPage } from '../pages/customer/ResultsPage';
import { BookingPage } from '../pages/customer/BookingPage';
import { TrackingPage } from '../pages/customer/TrackingPage';
import { PaymentPage } from '../pages/customer/PaymentPage';
import { FeedbackPage } from '../pages/customer/FeedbackPage';
import { MembershipPage } from '../pages/customer/MembershipPage';
import { ImageDiagnosisPage, AudioDiagnosisPage } from '../pages/customer/DiagnosisPage';
import { ContactsPage, EmergencyPage } from '../pages/customer/SafetyPages';
import { TravelPage, FleetPage } from '../pages/customer/GrowthPages';
import { WorkerRegistrationPage } from '../pages/worker/WorkerRegistrationPage';
import { WorkerDashboardPage, WorkerEarningsPage } from '../pages/worker/WorkerDashboardPage';

type Fixtures = {
  // Pre-authenticated admin page (signed in via mock bypass before the test body runs)
  adminAuthedPage: Page;

  // Page objects
  adminLoginPage: AdminLoginPage;
  adminAnalyticsPage: AdminAnalyticsPage;
  shopListingsPage: ShopListingsPage;
  bookingsBoardPage: BookingsBoardPage;
  opsAnalyticsPage: OpsAnalyticsPage;
  paymentsLedgerPage: PaymentsLedgerPage;
  adminConfigPages: AdminConfigPages;

  homePage: HomePage;
  resultsPage: ResultsPage;
  shopDetailPage: ShopDetailPage;
  bookingPage: BookingPage;
  trackingPage: TrackingPage;
  paymentPage: PaymentPage;
  feedbackPage: FeedbackPage;
  membershipPage: MembershipPage;
  imageDiagnosisPage: ImageDiagnosisPage;
  audioDiagnosisPage: AudioDiagnosisPage;
  contactsPage: ContactsPage;
  emergencyPage: EmergencyPage;
  travelPage: TravelPage;
  fleetPage: FleetPage;

  workerRegistrationPage: WorkerRegistrationPage;
  workerDashboardPage: WorkerDashboardPage;
  workerEarningsPage: WorkerEarningsPage;
};

export const test = base.extend<Fixtures>({
  adminAuthedPage: async ({ page }, use) => {
    const loginPage = new AdminLoginPage(page);
    await loginPage.open();
    await loginPage.signInWithMockBypass();
    await use(page);
  },

  adminLoginPage: async ({ page }, use) => use(new AdminLoginPage(page)),
  adminAnalyticsPage: async ({ page }, use) => use(new AdminAnalyticsPage(page)),
  shopListingsPage: async ({ page }, use) => use(new ShopListingsPage(page)),
  bookingsBoardPage: async ({ page }, use) => use(new BookingsBoardPage(page)),
  opsAnalyticsPage: async ({ page }, use) => use(new OpsAnalyticsPage(page)),
  paymentsLedgerPage: async ({ page }, use) => use(new PaymentsLedgerPage(page)),
  adminConfigPages: async ({ page }, use) => use(new AdminConfigPages(page)),

  homePage: async ({ page }, use) => use(new HomePage(page)),
  resultsPage: async ({ page }, use) => use(new ResultsPage(page)),
  shopDetailPage: async ({ page }, use) => use(new ShopDetailPage(page)),
  bookingPage: async ({ page }, use) => use(new BookingPage(page)),
  trackingPage: async ({ page }, use) => use(new TrackingPage(page)),
  paymentPage: async ({ page }, use) => use(new PaymentPage(page)),
  feedbackPage: async ({ page }, use) => use(new FeedbackPage(page)),
  membershipPage: async ({ page }, use) => use(new MembershipPage(page)),
  imageDiagnosisPage: async ({ page }, use) => use(new ImageDiagnosisPage(page)),
  audioDiagnosisPage: async ({ page }, use) => use(new AudioDiagnosisPage(page)),
  contactsPage: async ({ page }, use) => use(new ContactsPage(page)),
  emergencyPage: async ({ page }, use) => use(new EmergencyPage(page)),
  travelPage: async ({ page }, use) => use(new TravelPage(page)),
  fleetPage: async ({ page }, use) => use(new FleetPage(page)),

  workerRegistrationPage: async ({ page }, use) => use(new WorkerRegistrationPage(page)),
  workerDashboardPage: async ({ page }, use) => use(new WorkerDashboardPage(page)),
  workerEarningsPage: async ({ page }, use) => use(new WorkerEarningsPage(page)),
});

export { expect } from '@playwright/test';
