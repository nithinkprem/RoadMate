# RoadMate — Copy-Pastable Build Prompts

Each block below is ready to paste into Lovable / Claude Code as-is. They follow the sequence and dependencies from the RoadMate Prompt Library. Run them in order within each phase, and don't start a phase until the prior phase's QA gate has passed. Wherever a prompt references a screen ID (C1, W3, A9, etc.) or a field name, pull the exact spec from your System Design Document / UI-UX Specification before running — I've written these from the scope descriptions in the library, so double-check field names and screen layouts against your source docs before pasting.

---

## Phase 1 — Directory & Discovery

### Prompt 1 — Project scaffold

```
Set up a new Next.js (App Router) + TypeScript project styled with Tailwind CSS and shadcn/ui.
Establish the base layout (header, footer, content container), a design tokens file (colors, spacing,
typography, radius) matching a clean, mobile-first roadside-assistance product, and a clear folder
structure: /app, /components, /lib, /styles, /types. Add ESLint + Prettier config. Include a placeholder
home page that renders the base layout so we can confirm the scaffold builds and deploys cleanly.
```

### Prompt 2 — Supabase schema setup

```
Set up a Supabase project and write the initial schema migration for these tables: shops, shop_photos,
reviews, users, search_logs. Include appropriate primary keys, foreign keys, timestamps
(created_at/updated_at), and indexes for common lookups (e.g. shop location, review shop_id).
Enable Row Level Security (RLS) on all five tables (policies come in the next prompt — for now just
turn RLS on with no policies, so all access is denied by default). Add the Supabase client setup
(lib/supabase.ts) to the Next.js app using environment variables for the project URL and anon key.
```

### Prompt 3 — RLS policies

```
Add RLS policies on top of the shops, shop_photos, reviews, users, and search_logs tables created in
the previous migration:
- Public (anon) read access on shops, shop_photos, and reviews.
- Authenticated users can insert reviews, and can only update/delete their own reviews (owner-only write).
- Only the service role can insert/update/delete shops and shop_photos (no direct client writes).
- users table: a user can read/update only their own row.
- search_logs: insert-only from the client (no read/update/delete by anon or authenticated users).
Write these as SQL migration files and include a short README section documenting each policy's intent.
```

### Prompt 4 — Auth

```
Implement authentication using Supabase Auth with two methods: phone OTP and email. Build a lightweight
login modal component (not a full-page flow) that can be triggered from anywhere in the app, supports
both sign-in methods with a toggle, and handles OTP verification for phone. Wire up session handling so
the Next.js app has access to the current user and JWT on both client and server (middleware or server
components as appropriate). Add a simple useAuth hook / context exposing { user, session, signOut,
openLoginModal }. No dedicated screens yet — this is infrastructure other screens will consume.
```

### Prompt 5 — Screen C1: Home / Location capture

```
Build Screen C1, the Home / Location capture screen, per the UI/UX Specification. On load, request
geolocation permission; if granted, capture coordinates and reverse-geocode to a readable location label.
If denied or unavailable, fall back to a manual location search input (address/area autocomplete). Persist
the resolved location in app state so downstream screens can read it. Show a clear loading state while
resolving location and a friendly error state if both geolocation and search fail. This screen uses the
auth infrastructure from Prompt 4 only if a login-gated action is triggered — location capture itself
should work for anonymous users.
```

### Prompt 6 — Screen C2: Issue selection grid

```
Build Screen C2, the Issue selection grid, per the UI/UX Specification. Display the set of supported
issue types as a tappable grid (icons + labels). On selection, route to the Results screen (C3) passing
the selected issue and the location captured in Screen C1 as query state (URL params or a shared store —
pick whichever matches how C1 persisted location). Make sure a user landing directly on C2 without a
resolved location is redirected back to C1.
```

### Prompt 7 — Geo-ranked search Edge Function

```
Write a Supabase Edge Function that powers geo-ranked shop search. Given a lat/lng and an issue/category
filter, it should:
1. Calculate distance from the query point to each candidate shop (use PostGIS if available, otherwise a
   haversine calculation in SQL).
2. Evaluate open/closed status for each shop right now, using the shop's hours_json field (handle
   overnight hours correctly, e.g. 22:00–06:00).
3. Compute a blended ranking score combining distance, open-now status, and rating (weight open-now and
   proximity most heavily).
Return results sorted by this score, with distance_km and is_open_now included in the payload. Write this
as a reusable function so both the Results screen and the booking-matcher (later prompt) can call it.
```

### Prompt 8 — Screen C3: Results (map + list)

```
Build Screen C3, the Results screen, combining a Google Maps embed with a synced list view. Selecting a
pin highlights the corresponding list item and vice versa. Call the geo-ranked search Edge Function from
Prompt 7 using the location + issue from Prompts 5/6. Add controls for sort (distance, rating) and an
Open-Now filter toggle that re-queries or client-filters the result set. Handle empty results with a
clear "no shops found nearby" state, and a loading skeleton while the search is in flight.
```

### Prompt 9 — Screen C4: Shop detail

```
Build Screen C4, the Shop detail screen. Show hours (formatted from hours_json, including current
open/closed status), photo gallery (shop_photos), the proprietary fields — UPI accepted, mobile mechanic
available, night service available, languages spoken — and a list of reviews for the shop. Add Call,
Navigate (deep-link to Google/Apple Maps), and WhatsApp action buttons using the shop's stored contact
details. This screen reads from the shops/shop_photos/reviews tables set up in Prompt 2 and links from
the results list in Prompt 8.
```

### Prompt 10 — Screen C5: Write a review

```
Build Screen C5, the Write a review flow, launched from Screen C4. If the user isn't authenticated, open
the login modal from Prompt 4 before allowing submission. The form should capture a star rating and
optional text, validate on the client, and insert into the reviews table (relying on the owner-only write
RLS policy from Prompt 3). On success, return to C4 with the new review optimistically appended and the
shop's aggregate rating recalculated in the UI.
```

### Prompt 11 — Admin shell (A1–A3)

```
Build the Admin shell: Screen A1 is an admin login screen backed by Supabase Auth, gating a role-protected
route group (e.g. /admin/*) so only users with an admin role can access it. Add a role check (custom claim
or a role column on users) and redirect non-admins away. Within the shell, build Screen A2 (listings table
for shops — searchable, paginated, with basic status indicators) and Screen A3 (add/edit shop form
covering all shops table fields including the proprietary fields from Prompt 9). Writes here use the
service-role-authorized path established in Prompt 3.
```

### Prompt 12 — Admin: reviews moderation + analytics

```
Build Screen A4, reviews moderation — a table of all reviews with the ability to hide/delete inappropriate
ones — and Screen A5, an analytics overview that aggregates the search_logs table (e.g. searches per day,
top issue types searched, top areas). Both screens live inside the admin shell from Prompt 11 and require
the admin role.
```

### Prompt 13 — Seed script

```
Write a one-off seed script (Node/TypeScript, run outside the app) that imports initial shop data from
Google Places for our launch categories in Calicut, and maps the Places fields into the shops schema from
Prompt 2 (name, address, lat/lng, hours_json, category, contact info). Log any records that fail to map
cleanly instead of silently dropping them, and make the script idempotent (safe to re-run without
duplicating rows).
```

### Prompt 14 — Playwright E2E: core customer journey

```
Write a Playwright end-to-end test covering the core customer journey: land on Home (C1) → grant/enter
location → select an issue (C2) → view results (C3) → open a shop detail (C4) → trigger a contact action
(Call/Navigate/WhatsApp). Assert the correct data flows through at each step (selected issue and location
persist into the results query, the right shop's data renders on C4). Use test fixtures/seeded data rather
than depending on live external APIs.
```

### Prompt 15 — Playwright + axe-core: admin regression & accessibility

```
Write a Playwright regression suite for the Admin shell (A1–A5): login, listings CRUD via A2/A3, review
moderation via A4, and analytics rendering via A5. Integrate axe-core into these tests to run an
accessibility scan on each Phase 1 screen (C1–C5 and A1–A5) and fail the build on any critical/serious
violations. Output a summary report of violations by screen.
```

---

## Phase 2 — Marketplace Foundations

### Prompt 16 — Schema: workers, bookings, notifications

```
Write a schema migration adding: workers, worker_services, bookings, notifications tables, with foreign
keys back to users where appropriate. Add RLS policies: workers can read/update their own worker row and
worker_services; customers can read/insert their own bookings and read bookings where they're the
customer; workers can read/update bookings where they're the assigned worker; notifications are readable
only by their target user. Follow the same RLS pattern established in Prompt 3.
```

### Prompt 17 — Worker role + route guarding

```
Add a worker role to the users/auth model (alongside the existing admin role from Phase 1) and add
role-based route guarding for a new /worker route group, the same way /admin was guarded in Prompt 11.
Unauthenticated or wrong-role users should be redirected appropriately.
```

### Prompt 18 — Screens W1–W3: Worker registration

```
Build the worker registration flow across three screens per the UI/UX Specification:
- W1: Identity (name, phone, ID verification fields).
- W2: Services & pricing (select from worker_services categories, set base pricing).
- W3: Documents & base location (upload required documents, set a home/base location).
Persist progress across the three steps (don't lose data on refresh) and write final data into the
workers/worker_services tables from Prompt 16 on completion.
```

### Prompt 19 — Document upload to Supabase Storage

```
Wire Screen W3's document upload (from Prompt 18) to Supabase Storage, generating signed URLs for secure
access rather than public URLs. On successful upload, set the worker's verification_status to "pending" on
the workers table. Handle upload failures gracefully with retry, and validate file type/size client-side
before upload.
```

### Prompt 20 — Screen W4 + Admin worker queue (A6)

```
Build Screen W4, the verification-pending state shown to a worker after registering (from Prompt 19),
explaining that documents are under review. Build Screen A6, the Admin worker applications queue inside
the admin shell (Prompt 11), listing workers with verification_status = pending, with a document viewer
that renders the signed URLs from Prompt 19 for review.
```

### Prompt 21 — Admin worker approve/reject flow

```
On Screen A6 (Prompt 20), add approve/reject actions. Approving sets verification_status to "verified" on
the workers table; rejecting sets it to "rejected" and requires the admin to enter a rejection_reason,
which should be stored and surfaced back to the worker (e.g. shown on their W4 equivalent state or via
notification once Prompt 26 is in place).
```

### Prompt 22 — Screen W5: Worker profile edit

```
Build Screen W5, allowing a verified worker to edit their profile: services and pricing (worker_services),
and profile photo. Reuse the services/pricing form pattern from W2 (Prompt 18) rather than rebuilding it,
and persist changes to the workers/worker_services tables.
```

### Prompt 23 — Screen W6: Availability toggle

```
Build Screen W6, an availability control for workers with a global online/offline toggle plus a per-service
pause option (so a worker can go offline for one service type while remaining online for others). Persist
this state on the workers/worker_services tables so it's available to the booking-matcher function built
next. Guard this screen so only workers with verification_status = verified can access it (per Prompt 17's
role guarding).
```

### Prompt 24 — Screen C8: Booking request flow

```
Build Screen C8, the booking request flow, launched from a shop or worker detail screen (Prompt 9's
pattern). Capture issue type, location (default to the user's last resolved location from C1, editable),
free-text notes, and an optional photo upload. On submit, insert a row into the bookings table from
Prompt 16 with status "pending" and route the user into the searching state (Screen C9, built in Prompt
29).
```

### Prompt 25 — Booking-matcher Edge Function

```
Write a Supabase Edge Function that, given a new booking request, finds the nearest N eligible online
workers (using the availability state from Prompt 23 and the geo-ranking logic pattern from Prompt 7,
adapted for workers instead of shops). Implement optimistic-locking accept logic: when a worker accepts,
use a conditional update (e.g. UPDATE ... WHERE status = 'pending') so only one worker can win the booking
even under concurrent accepts. Return a clear success/already-taken result so the calling UI can react
appropriately.
```

### Prompt 26 — Notification service integration

```
Integrate a push notification service (OneSignal or FCM) and define three event types: job_request,
job_accepted, job_completed. Build a thin notification-sending utility that the booking-matcher (Prompt
25) and later booking-status-change logic can call, writing a corresponding row to the notifications
table from Prompt 16 as well as sending the push.
```

### Prompt 27 — Screen W7: Incoming job request

```
Build Screen W7, shown to a worker when they receive a job_request notification (Prompt 26). Display the
booking details from Prompt 24 and a 60-second countdown timer with Accept/Reject actions. Accept should
call the booking-matcher's accept endpoint (Prompt 25) and handle the "already taken" case gracefully by
returning the worker to their available state with a clear message.
```

### Prompt 28 — Re-routing logic

```
Extend the booking-matcher Edge Function (Prompt 25) with re-routing: if no worker accepts within the SLA
window (the 60 seconds from Screen W7 in Prompt 27), automatically re-route the request to the next
nearest 5 eligible online workers, and repeat until accepted or a max-attempts/timeout ceiling is reached.
Log each routing attempt for later analytics (Screen A9 in Phase 3 will use this).
```

### Prompt 29 — Screen C9: Searching for a worker

```
Build Screen C9, shown to the customer immediately after submitting a booking request (Prompt 24) while
the booking-matcher (Prompts 25/28) searches for a worker. Show a searching animation/state and a cancel
option that updates the booking status to "cancelled" if the customer backs out before a worker accepts.
```

### Prompt 30 — Screen C10: Worker assigned

```
Build Screen C10, shown once a worker accepts (Prompt 27/25). Display the worker's photo, rating, vehicle
info, ETA, and contact options, pulling from the workers table and the accepted booking record. Transition
here automatically from Screen C9 (Prompt 29) via a realtime subscription or polling on the booking's
status field.
```

### Prompt 31 — Screen W8: Active job

```
Build Screen W8, the worker's active-job screen after accepting a booking. Show the customer's location,
a navigate action, and status-transition buttons (e.g. "On the way" → "Arrived" — full status set defined
in the System Design Document). Each transition should update the bookings table's status field and
trigger the appropriate notification via Prompt 26.
```

### Prompt 32 — Screens C11/C12: My Jobs

```
Build Screen C11 (My Jobs list for the customer — active and past bookings) and Screen C12 (job detail),
reading from the bookings table filtered by the current customer. Add a cancel-with-reason action on
active jobs that updates status to "cancelled" and stores the reason, following the same status-transition
pattern used in Screen W8 (Prompt 31).
```

### Prompt 33 — Screen A8: Admin bookings live board

```
Build Screen A8 inside the admin shell (Prompt 11): a Kanban-style live board of bookings grouped by
status column, reading from the bookings table and updating in near-real-time (Supabase Realtime
subscription) as statuses change via the booking-matcher (Prompt 25) and worker actions (Prompt 31).
```

### Prompt 34 — Screen W9: Worker job history

```
Build Screen W9, a worker-facing job history list reading from the bookings table filtered to the current
worker, showing past jobs with status, customer, and basic earnings/rating info per job (earnings/payout
detail comes later in Phase 3 — for now just show what's available on the bookings record).
```

### Prompt 35 — Playwright E2E: booking & routing flows

```
Write Playwright end-to-end tests covering: a customer submitting a booking request (C8) through to
worker assignment (C9 → C10); a worker receiving and accepting a request (W7) through to an active job
(W8); the re-routing path when a worker doesn't respond in time (Prompt 28); and cancellation from both
the customer (C11/C12) and pre-assignment (C9) sides. Cover both the Customer and Worker app surfaces in
one suite, using seeded workers with controllable online/offline state.
```

---

## Phase 3 — Live Operations

### Prompt 36 — Schema: payments, tracking_events

```
Write a schema migration adding payments and tracking_events tables, plus extending the bookings table
from Prompt 16 with arrived_at and completed_at timestamp columns. Add RLS policies consistent with the
existing pattern: customers and the assigned worker can read a booking's payments/tracking_events; only
the worker (or a trusted server-side function) can insert tracking_events.
```

### Prompt 37 — Location-ping ingestion endpoint

```
Build an endpoint (Edge Function or API route) that accepts location pings from the Worker app during an
active job (Screen W8 from Prompt 31) and writes them to the tracking_events table from Prompt 36. Rate-
limit or throttle client-side pings to a sane interval (e.g. every 5–10 seconds) to avoid excessive writes.
```

### Prompt 38 — Realtime subscription wiring

```
Wire up a Supabase Realtime subscription on the Customer client for tracking_events scoped to the current
active booking, so new location pings from Prompt 37 stream in live. Expose this as a hook (e.g.
useLiveTracking(bookingId)) other screens can consume.
```

### Prompt 39 — Screen C13: Live tracking map

```
Build Screen C13, a live tracking map for the customer during an active job, consuming the realtime hook
from Prompt 38 to move the worker's marker in real time, with a dynamically recalculated ETA based on the
latest ping and the customer's location.
```

### Prompt 40 — Share tracking link

```
Add a share-tracking-link feature to Screen C13 (Prompt 39): generate a public, token-scoped, read-only
link that a trusted contact can open without logging in to see the same live tracking view (read-only,
no booking-management actions). Scope the token to expire when the job completes.
```

### Prompt 41 — Screen W8 extension: Arrived / Completed

```
Extend Screen W8 (Prompt 31) with Arrived and Completed action buttons, wiring them to update the
bookings table's status field and the new arrived_at/completed_at timestamps from Prompt 36. Trigger the
appropriate notification (Prompt 26) on each transition.
```

### Prompt 42 — Razorpay order creation

```
Integrate Razorpay for one-time job payments: on job completion (triggered from Prompt 41), create a
Razorpay order for the job amount via a server-side function (never expose Razorpay secret keys to the
client), and return the order details needed for the client-side checkout flow.
```

### Prompt 43 — Screen C14: Job completed / payment

```
Build Screen C14, shown to the customer when a job is marked completed (Prompt 41). Launch the Razorpay
checkout using the order created in Prompt 42, and include a cash-on-completion fallback option that skips
online payment and marks the booking accordingly.
```

### Prompt 44 — Razorpay webhook handler

```
Build a webhook handler for Razorpay payment events: verify the webhook signature, update payment status
on the payments table (Prompt 36), and update a commission ledger entry reflecting the platform's cut of
the completed, paid booking. Make the handler idempotent so retried webhook deliveries don't double-process
a payment.
```

### Prompt 45 — Payout ledger logic

```
Build payout ledger logic that, for every completed and paid booking (confirmed via the webhook handler in
Prompt 44), records a commission split entry — platform commission vs. worker payout amount — on a ledger
table, so worker earnings can be aggregated later.
```

### Prompt 46 — Screen C15: Post-job rating

```
Build Screen C15, a post-job rating flow shown to the customer after payment (Prompt 43/44). Capture a
star rating and optional comment, write it in a way consistent with the existing reviews pattern (Prompt
10), and recalculate the worker's aggregate rating on the workers table.
```

### Prompt 47 — Screen W10: Worker earnings & payouts

```
Build Screen W10, a worker-facing earnings and payouts view, aggregating the payout ledger entries from
Prompt 45 for the current worker: total earned, pending payout, and a per-job breakdown.
```

### Prompt 48 — Screen A9: Admin ops analytics

```
Build Screen A9 inside the admin shell (Prompt 11): an operations analytics dashboard covering completion
rate, average time-to-accept (using the routing data logged in Prompt 28), ETA accuracy (comparing
Prompt 39's estimates to actual arrival from Prompt 41), GMV, and count of currently active workers.
```

### Prompt 49 — Screen A10: Admin payments ledger

```
Build Screen A10 inside the admin shell: a payments ledger view reading from the payments and payout
ledger tables (Prompts 44/45), with reconciliation status indicators and an export action (CSV/Excel) for
finance review.
```

### Prompt 50 — PostHog funnel instrumentation

```
Integrate PostHog across the Customer and Worker apps and instrument the full funnel: location capture →
issue selection → results view → booking request → assignment → active job → payment → rating on the
Customer side, and registration → verification → online → job accept → job complete on the Worker side.
Name events consistently and include booking_id as a property where relevant so funnels can be joined with
backend data.
```

### Prompt 51 — k6 load test scripts

```
Write k6 load test scripts targeting the geo-ranked search Edge Function (Prompt 7) and the booking-matcher
Edge Function (Prompt 25). Simulate realistic concurrent load (staggered ramp-up, sustained peak, ramp-down)
and assert on p95 latency and error rate thresholds. Include a scenario that specifically stresses the
optimistic-locking accept path in the booking-matcher to catch race-condition regressions.
```

### Prompt 52 — OWASP ZAP baseline scan + RLS negative tests

```
Set up an OWASP ZAP baseline scan against the staging environment as part of CI. Separately, write RLS
cross-user access negative tests (e.g. using Supabase's REST/RPC directly with different user JWTs)
confirming that a customer cannot read another customer's bookings/payments/tracking_events, and a worker
cannot read another worker's data, per the policies established in Prompt 36 and earlier RLS prompts.
```

### Prompt 53 — Playwright E2E: tracking, payment, rating

```
Write Playwright end-to-end tests covering: live tracking updates rendering correctly on Screen C13
(Prompt 39) as tracking_events arrive; the payment flow on Screen C14 (Prompt 43) for both successful
Razorpay payment and the cash-on-completion fallback, including a simulated payment failure; and the
post-job rating flow on Screen C15 (Prompt 46) updating the worker's aggregate rating.
```

---

## Phase 4 — Growth & Differentiation

### Prompt 54 — Schema: memberships + Razorpay Subscriptions

```
Write a schema migration adding a memberships table (plan type, status, renewal date, linked user) with
RLS consistent with the existing pattern, and integrate Razorpay Subscriptions for recurring membership
billing, following the same server-side-only secret-key pattern used for one-time payments in Prompt 42.
```

### Prompt 55 — Screens C16/C17: Membership plans & status

```
Build Screen C16 (membership plans — display available plans and their benefits, with a subscribe action
wired to the Razorpay Subscriptions flow from Prompt 54) and Screen C17 (membership status/management —
current plan, renewal date, cancel action).
```

### Prompt 56 — Membership-aware booking completion

```
Extend the job-completion/payment logic from Prompt 43 to check the customer's membership status (Prompt
54): if they have an active plan with remaining limits for this job type, bypass the payment step entirely
and mark the booking as covered-by-membership, decrementing the plan's usage counter.
```

### Prompt 57 — Schema: ai_diagnosis_logs

```
Write a schema migration adding an ai_diagnosis_logs table (user, input type, input reference, AI
suggestion, timestamp) with RLS restricting read/write to the owning user (and admin read access for
Screen A12 later).
```

### Prompt 58 — Image diagnosis integration + Screen C18

```
Integrate a hosted image classification API for vehicle-issue diagnosis from a photo. Build Screen C18
where the customer uploads/takes a photo, the image is sent to the classification API, and the result is
logged to ai_diagnosis_logs from Prompt 57.
```

### Prompt 59 — Audio diagnosis integration + Screen C19

```
Integrate a hosted audio classification API for vehicle-issue diagnosis from a sound recording (e.g. an
engine noise). Build Screen C19 where the customer records/uploads audio, the recording is sent to the
classification API, and the result is logged to ai_diagnosis_logs from Prompt 57.
```

### Prompt 60 — Diagnosis-to-results handoff

```
Wire the AI diagnosis results from Screens C18/C19 (Prompts 58/59) into the issue-selection flow from
Screen C2 (Prompt 6): pre-fill the suggested issue type but always let the user override it before
proceeding to results. Clearly label the pre-fill as an AI suggestion in the UI.
```

### Prompt 61 — Schema: emergency_requests

```
Write a schema migration adding an emergency_requests table (user, type, location, status, timestamp) with
RLS consistent with the existing pattern.
```

### Prompt 62 — Screen C20: Emergency panel

```
Build Screen C20, an emergency panel offering: water, first aid, air pump, fuel, ambulance, police, and EV
charging. Reuse the core geo-ranked search infrastructure from Prompt 7 to find nearby providers for each
type, and log each request to emergency_requests from Prompt 61.
```

### Prompt 63 — SOS action: trusted-contact trigger

```
Add an SOS action to the emergency panel (Prompt 62) that, when triggered, notifies the user's trusted
contacts (via the notification infrastructure from Prompt 26, extended to support SMS if trusted contacts
aren't app users) with the user's current location and a clear "SOS triggered" message.
```

### Prompt 64 — Screen C21: Trusted contacts management

```
Build Screen C21, letting a customer add, edit, and remove trusted contacts (name, phone). These are the
recipients used by both the SOS trigger (Prompt 63) and the share-tracking-link feature (Prompt 40) — wire
both to read from this same contacts list.
```

### Prompt 65 — "Verified mechanics only" mode

```
Add a filter flag, "verified mechanics only," to both the geo-ranked search (Prompt 7) and the
booking-matcher (Prompt 25), restricting results/matching to workers who carry an enhanced-verification
flag (added in the next prompt). Surface this as a toggle in the relevant search/booking UI.
```

### Prompt 66 — Enhanced worker verification tier

```
Add an enhanced-verification tier to the worker approval flow: extend the admin approve/reject logic from
Prompt 21 with an additional verification step (e.g. background check confirmation, extra document type)
required before a worker is eligible for the "verified mechanics only" pool used in Prompt 65.
```

### Prompt 67 — Schema: fleet + Fleet Admin account type

```
Write a schema migration adding fleet_vehicles and fleet_maintenance_logs tables, and add a Fleet Admin
account type to the users/role model (alongside customer, worker, and admin from earlier prompts), with
RLS scoping fleet data access to the owning fleet admin.
```

### Prompt 68 — Screen C23: Fleet dashboard

```
Build Screen C23, a fleet dashboard for Fleet Admin accounts (Prompt 67): a vehicle list, an add-vehicle
form, and a maintenance log entry form, all reading/writing the fleet_vehicles/fleet_maintenance_logs
tables.
```

### Prompt 69 — Due-date alerting job

```
Build a scheduled function that checks fleet_vehicles/fleet_maintenance_logs for upcoming service, tyre,
and insurance due dates, and sends alerts via the notification infrastructure from Prompt 26 to the
relevant Fleet Admin.
```

### Prompt 70 — Screen C22: Travel Mode

```
Build Screen C22, Travel Mode: the customer inputs a route (origin/destination), and the app queries for
mechanics, fuel stations, hospitals, and EV chargers along that route, reusing the geo-ranked search
infrastructure from Prompt 7 applied to points along the route rather than a single location.
```

### Prompt 71 — Multi-city configuration

```
Add a city configuration table/config covering service radius and launch-category settings per city, and
refactor existing location-dependent logic (search, booking-matcher) to read these settings per city
instead of assuming a single hardcoded city.
```

### Prompt 72 — Screen A14: Super Admin city configuration

```
Build Screen A14 inside the admin shell, gated to a new Super Admin role: a UI for managing the city
configuration table from Prompt 71 — add cities, set service radius, and enable/disable launch categories
per city.
```

### Prompt 73 — Screen A15: Super Admin user management

```
Build Screen A15, also gated to Super Admin: an admin-user management screen for assigning/revoking admin
roles, extending the role model first introduced for the admin shell in Prompt 11.
```

### Prompt 74 — Screens A11/A12/A13: Membership, AI diagnosis, Emergency/SOS admin

```
Build three admin screens inside the admin shell: A11 (membership management, reading from the
memberships table in Prompt 54), A12 (AI diagnosis review, reading from ai_diagnosis_logs in Prompt 57),
and A13 (Emergency/SOS log, reading from emergency_requests in Prompt 61).
```

### Prompt 75 — Playwright E2E: Phase 4 flows

```
Write Playwright end-to-end tests covering: membership subscribe and cancel (Screens C16/C17, Prompt 55);
the AI diagnosis-to-results handoff (Prompt 60) for both image and audio paths; the emergency/SOS flow
including trusted-contact notification (Prompts 62–64); and the fleet due-date alerting job firing
correctly (Prompt 69).
```

---

## Cross-cutting / hardening prompts

### Prompt 76 — Error monitoring

```
Integrate an error-monitoring tool (e.g. Sentry) across both the Next.js client and all Supabase Edge
Functions, capturing unhandled exceptions with useful context (user id where available, route/function
name, request id once Prompt 77 is in place).
```

### Prompt 77 — Structured logging

```
Add structured logging with request IDs across all Edge Functions (starting with the geo-ranked search
from Prompt 7 and booking-matcher from Prompt 25), so a single request can be traced end-to-end through
logs. Use a consistent log format (JSON) so it's queryable in whatever log aggregation tool is in use.
```

### Prompt 78 — Accessibility remediation pass

```
Run a full accessibility remediation pass across all screens flagged by axe-core over the project's
lifetime (from the Phase 1 admin scan in Prompt 15 and the Phase 3 tracking/payment scan in Prompt 53).
Fix critical and serious violations first, and re-run the axe-core suites to confirm they're resolved.
```

### Prompt 79 — Localization

```
Set up localization infrastructure: extract all user-facing English strings into a translation resource
file structure, and add Malayalam translations. Wire the app to switch language based on user preference
or device locale, defaulting to English.
```

### Prompt 80 — Production readiness checklist automation

```
Build automation for a production readiness checklist: validate required environment variables are set
before deploy, verify recent database backups exist, and document/automate a webhook signature rotation
runbook for the Razorpay webhook handler from Prompt 44 and any other signed webhooks in use.
```
