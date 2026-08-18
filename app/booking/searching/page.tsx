'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, X, Compass, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function BookingSearchingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    // 1. Poll database periodically or listen to Realtime updates
    let interval: NodeJS.Timeout;

    const checkBookingStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('status, cancellation_reason')
          .eq('id', bookingId)
          .single();

        if (error) {
          console.error('Error fetching status:', error.message);
          return;
        }

        if (data) {
          if (['assigned', 'on_the_way', 'arrived', 'completed'].includes(data.status)) {
            // Re-route to status tracking screen C10
            router.push(`/booking/status?id=${bookingId}`);
          } else if (data.status === 'cancelled') {
            setError(data.cancellation_reason || 'Booking request was cancelled or expired.');
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error checking status:', err);
      }
    };

    // Initial check
    checkBookingStatus();

    // Poll every 3 seconds
    interval = setInterval(checkBookingStatus, 3000);

    // 2. Suppress/Disconnect Realtime channel on cleanup
    let channel: any;
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
    ) {
      channel = supabase
        .channel(`booking-radar-${bookingId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
          (payload: any) => {
            const nextStatus = payload.new.status;
            if (['assigned', 'on_the_way', 'arrived', 'completed'].includes(nextStatus)) {
              router.push(`/booking/status?id=${bookingId}`);
            } else if (nextStatus === 'cancelled') {
              setError(payload.new.cancellation_reason || 'Booking request was cancelled.');
            }
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [bookingId, router]);

  const handleCancelSearch = async () => {
    if (!bookingId) return;
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
            cancellation_reason: 'Cancelled by motorist.',
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

  return (
    <div className="flex-1 w-full bg-background flex items-center justify-center py-16 px-4">
      {/* Background accents */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-safety-amber/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card shadow-2xl glassmorphism p-8 flex flex-col gap-6 text-center items-center relative">
        {/* Pulsing Radar Animation */}
        {!error ? (
          <div className="relative flex h-24 w-24 items-center justify-center mb-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-safety-amber/10 opacity-75"></span>
            <span className="absolute inline-flex h-[80%] w-[80%] animate-ping rounded-full bg-safety-amber/20 opacity-75"></span>
            <span className="absolute inline-flex h-[60%] w-[60%] animate-ping rounded-full bg-safety-amber/30 opacity-75"></span>
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-safety-amber to-safety-orange text-navy-dark shadow-md border border-safety-amber/20">
              <Compass className="h-6 w-6 animate-spin-slow text-navy-dark" />
            </div>
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 shadow-md mb-2">
            <X className="h-6 w-6 animate-bounce" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
            Dispatch Matcher
          </span>
          <h1 className="text-xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            {!error ? 'Searching for Mechanic...' : 'Search Terminated'}
          </h1>
          <p className="text-xs text-muted-foreground mt-2 max-w-[320px] leading-relaxed">
            {!error
              ? 'Finding the nearest online partner in Calicut. Mechanics have 45 seconds to accept before the request is forwarded.'
              : error}
          </p>
        </div>

        {/* Cancel Button */}
        <Button
          onClick={handleCancelSearch}
          disabled={loading}
          variant="outline"
          className="w-full h-11 rounded-xl text-xs font-bold border-destructive/20 hover:bg-destructive/10 text-destructive active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          <span>{!error ? 'Cancel Search Request' : 'Return Home'}</span>
        </Button>
      </div>
    </div>
  );
}

export default function BookingSearchingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full bg-background flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
          <span className="text-sm font-semibold">Initializing dispatch radar...</span>
        </div>
      }
    >
      <BookingSearchingContent />
    </Suspense>
  );
}
