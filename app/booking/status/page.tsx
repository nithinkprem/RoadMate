'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  MapPin,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  Navigation,
  Compass,
  User,
  Truck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function BookingStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  const [booking, setBooking] = useState<any>(null);
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingStatus = async () => {
    if (!bookingId) return;
    try {
      // 1. Fetch booking details
      const { data: bData, error: bError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bError || !bData) {
        // Fallback mock check
        if (bookingId.startsWith('mock-')) {
          setBooking({
            id: bookingId,
            status: 'assigned',
            issue_type: 'tyre',
            address: 'Mavoor Road, Kozhikode',
            latitude: 11.2588,
            longitude: 75.7804,
          });
          setWorker({
            name: 'Dilip Kumar Calicut',
            phone: '9876543220',
            vehicle_type: 'Bolero Camper',
            vehicle_plate: 'KL-11-Z-9988',
          });
          setLoading(false);
        } else {
          setError('Booking details could not be found.');
          setLoading(false);
        }
        return;
      }

      setBooking(bData);

      // 2. Fetch worker profile if assigned
      if (bData.worker_id) {
        const { data: wData } = await supabase
          .from('workers')
          .select('*')
          .eq('id', bData.worker_id)
          .single();
        if (wData) {
          setWorker(wData);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching booking status:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingStatus();

    // Setup periodic polling
    const interval = setInterval(fetchBookingStatus, 4000);

    // Setup Supabase Realtime changes subscription
    let channel: any;
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co') &&
      bookingId
    ) {
      channel = supabase
        .channel(`booking-tracking-${bookingId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
          async (payload: any) => {
            const updated = payload.new;
            setBooking(updated);

            if (updated.worker_id) {
              const { data: wData } = await supabase
                .from('workers')
                .select('*')
                .eq('id', updated.worker_id)
                .single();
              if (wData) setWorker(wData);
            }
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const handleCancelBooking = async () => {
    if (!bookingId) return;
    if (!confirm('Are you sure you want to cancel this emergency request?')) return;

    setLoading(true);
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancellation_reason: 'Cancelled by motorist after mechanic assignment.',
          })
          .eq('id', bookingId);
      }
      router.push('/');
    } catch (err) {
      console.error('Cancellation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const mapping: Record<string, string> = {
      pending: 'Dispatched to matching engine...',
      searching: 'Searching for nearest partner...',
      assigned: 'Partner Assigned - Preparing to travel',
      on_the_way: 'Partner En Route - Travelling to your spot',
      arrived: 'Partner Arrived - Inspecting vehicle problems',
      completed: 'Assistance Completed - Drive safe!',
      cancelled: 'Booking Request Cancelled',
    };
    return mapping[status] || status;
  };

  const getCategoryLabel = (cat: string) => {
    const mapping: Record<string, string> = {
      tyre: 'Tyre Puncture',
      battery: 'Battery Jump',
      mechanic: 'Mechanic Help',
      fuel: 'Fuel Delivery',
      towing: 'Towing Truck',
      car_wash: 'Water / Wash',
    };
    return mapping[cat] || cat;
  };

  if (loading) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Updating tracking console...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <MapPin className="h-6 w-6" />
        </div>
        <span className="text-lg font-bold text-primary dark:text-foreground mb-1">
          Tracking Not Found
        </span>
        <p className="text-xs text-muted-foreground max-w-xs">
          {error || 'The requested booking details do not exist.'}
        </p>
        <Button
          onClick={() => router.push('/')}
          className="mt-4 button-warning-gradient rounded-xl text-navy-dark"
        >
          Return Home
        </Button>
      </div>
    );
  }

  const isTerminal = ['completed', 'cancelled'].includes(booking.status);
  const showCancel = ['assigned', 'on_the_way'].includes(booking.status);

  return (
    <div className="flex-grow w-full bg-background relative py-8 px-4 sm:px-6 lg:px-8">
      {/* Background accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-safety-amber/5 blur-[120px] pointer-events-none" />

      <div className="max-w-xl mx-auto flex flex-col gap-6 z-10 relative">
        {/* Status Heading */}
        <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-md flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
              {getCategoryLabel(booking.issue_type)} Dispatch
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                isTerminal
                  ? 'bg-secondary text-secondary-foreground border-border'
                  : 'bg-success/10 text-success border-success/20 animate-pulse'
              }`}
            >
              {booking.status}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-primary dark:text-foreground mt-1">
            {getStatusText(booking.status)}
          </h1>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>Spot: {booking.address}</span>
          </p>
        </div>

        {/* WORKER PROFILE SECTION */}
        {worker && (
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col gap-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Responding Partner Details
            </h3>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary dark:text-foreground">
                <User className="h-5 w-5 text-safety-amber" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-primary dark:text-foreground">
                  {worker.name}
                </span>
                {worker.vehicle_type ? (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Truck className="h-3.5 w-3.5 text-safety-amber" />
                    <span>
                      {worker.vehicle_type} ({worker.vehicle_plate || 'No Plate'})
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Knive verified helper</span>
                )}
              </div>
            </div>

            {/* Quick deep links */}
            {!isTerminal && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`tel:${worker.phone}`}
                  className="h-10 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm text-xs border border-border"
                >
                  <Phone className="h-3.5 w-3.5 text-safety-amber" />
                  <span>Call Mechanic</span>
                </a>
                <a
                  href={`https://wa.me/${worker.phone}?text=Hi,%20I'm%20the%20motorist%20you%20accepted%20on%20Knive.%20I'm%20waiting%20at%20${encodeURIComponent(booking.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm text-xs border border-emerald-700"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* C10 Status Progress steps visualizer */}
        <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
            Dispatched Progress Timeline
          </h3>

          <div className="flex flex-col gap-3 pt-1">
            {[
              { status: 'assigned', label: 'Dispatched & Assigned' },
              { status: 'on_the_way', label: 'Mechanic En Route' },
              { status: 'arrived', label: 'Mechanic Arrived at Spot' },
              { status: 'completed', label: 'Call Intervention Completed' },
            ].map((step, index) => {
              const activeStatuses = ['assigned', 'on_the_way', 'arrived', 'completed'];
              const currentIdx = activeStatuses.indexOf(booking.status);
              const stepIdx = activeStatuses.indexOf(step.status);

              const isDone = stepIdx < currentIdx || booking.status === 'completed';
              const isCurrent = step.status === booking.status;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isDone
                        ? 'bg-success text-white border-success'
                        : isCurrent
                          ? 'bg-safety-amber/15 text-safety-amber border-safety-amber animate-pulse'
                          : 'bg-secondary text-muted-foreground border-border'
                    }`}
                  >
                    {isDone ? '✓' : index + 1}
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isDone
                        ? 'text-primary dark:text-foreground'
                        : isCurrent
                          ? 'text-safety-amber'
                          : 'text-muted-foreground/60'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions cancel */}
        {showCancel && (
          <Button
            onClick={handleCancelBooking}
            variant="outline"
            className="w-full h-11 rounded-xl text-xs font-bold border-destructive/20 hover:bg-destructive/10 text-destructive active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>Cancel Request Booking</span>
          </Button>
        )}

        {isTerminal && (
          <Button
            onClick={() => router.push('/')}
            className="w-full h-11 rounded-xl font-bold button-warning-gradient hover:opacity-90 active:scale-95 transition-all text-navy-dark mt-2"
          >
            Return to Home Screen
          </Button>
        )}
      </div>
    </div>
  );
}

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full bg-background flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
          <span className="text-sm font-semibold">Initializing status monitor...</span>
        </div>
      }
    >
      <BookingStatusContent />
    </Suspense>
  );
}
