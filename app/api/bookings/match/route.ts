import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Haversine distance calculator
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Async background matching loop
async function runMatchingEngine(bookingId: string) {
  console.log(`[Knive Matcher] Initiating matching loop for booking: ${bookingId}`);

  let attempts = 0;
  const maxAttempts = 5;
  const routedWorkerIds = new Set<string>();

  while (attempts < maxAttempts) {
    try {
      // 1. Fetch latest booking details
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        console.error(`[Knive Matcher] Booking not found: ${bookingId}`, fetchError?.message);
        return;
      }

      // Exit matching if booking is cancelled or already assigned
      if (
        ['assigned', 'on_the_way', 'arrived', 'completed', 'cancelled'].includes(booking.status)
      ) {
        console.log(
          `[Knive Matcher] Booking ${bookingId} has terminal status: ${booking.status}. Terminating matcher.`
        );
        return;
      }

      // 2. Query all active, verified online workers who support this category and are not paused
      const { data: workerServices, error: sError } = await supabase
        .from('worker_services')
        .select('*, workers!inner(*)')
        .eq('category', booking.issue_type)
        .eq('is_paused', false)
        .eq('workers.is_online', true)
        .eq('workers.verification_status', 'verified');

      if (sError || !workerServices || workerServices.length === 0) {
        console.log(
          `[Knive Matcher] No active online workers found supporting category "${booking.issue_type}".`
        );
        // Wait 15 seconds before retrying to see if someone comes online
        await new Promise((resolve) => setTimeout(resolve, 15000));
        attempts++;
        continue;
      }

      // 3. Rank workers by distance
      const rankedWorkers = workerServices
        .map((ws: any) => {
          const distance = getDistanceKm(
            booking.latitude,
            booking.longitude,
            Number(ws.workers.base_latitude),
            Number(ws.workers.base_longitude)
          );
          return {
            workerId: ws.worker_id,
            name: ws.workers.name,
            distance,
          };
        })
        .filter((w) => !routedWorkerIds.has(w.workerId)) // Skip already routed mechanics
        .sort((a, b) => a.distance - b.distance);

      if (rankedWorkers.length === 0) {
        console.log(
          `[Knive Matcher] All online mechanics have already been routed for booking: ${bookingId}. Clearing history and widening search.`
        );
        routedWorkerIds.clear();
        await new Promise((resolve) => setTimeout(resolve, 10000));
        attempts++;
        continue;
      }

      // 4. Assign booking to the nearest worker
      const target = rankedWorkers[0];
      routedWorkerIds.add(target.workerId);
      console.log(
        `[Knive Matcher] Routing booking ${bookingId} to worker ${target.name} (dist: ${target.distance.toFixed(2)} km)`
      );

      // Update booking to searching status with worker assigned
      const { error: routeError } = await supabase
        .from('bookings')
        .update({
          worker_id: target.workerId,
          status: 'searching',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (routeError) {
        console.error('[Knive Matcher] Error updating route assignment:', routeError.message);
        return;
      }

      // 5. Send Dispatch notification to worker profile notifications ledger
      await supabase.from('notifications').insert({
        user_id: target.workerId,
        title: 'Emergency Roadside Dispatch',
        body: `Stranded motorist needs help with ${booking.issue_type} category services at ${booking.address}. Click to accept.`,
        type: 'job_request',
        booking_id: bookingId,
      });

      // 6. SLA Timer Window: Wait 45 seconds for worker response
      await new Promise((resolve) => setTimeout(resolve, 45000));

      // 7. Check if booking was accepted
      const { data: checkBooking } = await supabase
        .from('bookings')
        .select('status, worker_id')
        .eq('id', bookingId)
        .single();

      if (checkBooking) {
        if (checkBooking.status === 'assigned' && checkBooking.worker_id === target.workerId) {
          console.log(
            `[Knive Matcher] Booking ${bookingId} successfully accepted by ${target.name}! Matcher complete.`
          );

          // Send acceptance alert notification to customer
          const { data: customerData } = await supabase
            .from('bookings')
            .select('customer_id')
            .eq('id', bookingId)
            .single();
          if (customerData) {
            await supabase.from('notifications').insert({
              user_id: customerData.customer_id,
              title: 'Mechanic Assigned',
              body: `Partner ${target.name} accepted your request and is preparing to travel.`,
              type: 'job_accepted',
              booking_id: bookingId,
            });
          }
          return;
        }

        // If booking status was cancelled or reassigned during wait, exit
        if (['completed', 'cancelled'].includes(checkBooking.status)) {
          return;
        }

        // If status remains searching and assigned to the same worker, SLA timed out
        if (checkBooking.status === 'searching' && checkBooking.worker_id === target.workerId) {
          console.log(
            `[Knive Matcher] SLA timed out (45s) for worker ${target.name}. Re-routing...`
          );

          // Clear current worker assignment
          await supabase
            .from('bookings')
            .update({
              worker_id: null,
              status: 'pending',
              updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId);
        }
      }
    } catch (err) {
      console.error('[Knive Matcher] Unexpected loop error:', err);
    }

    attempts++;
  }

  // If we exit loop without success: mark booking as cancelled or pending review
  console.log(
    `[Knive Matcher] SLA match attempts exceeded for booking: ${bookingId}. Cancelling booking due to lack of available workers.`
  );

  await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: 'No available online mechanics found near your location.',
    })
    .eq('id', bookingId)
    .eq('status', 'searching'); // Only cancel if it's still searching
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('bookingId');

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required.' }, { status: 400 });
  }

  // Run the matching loop asynchronously in the background
  runMatchingEngine(bookingId);

  return NextResponse.json({
    success: true,
    message: 'Matching background loop initialized.',
  });
}
