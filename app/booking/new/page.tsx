'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, FileText, Send, Loader2, CheckCircle2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Wrap the actual form in a client component that reads search params
function BookingNewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, openLoginModal } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Read pre-filled query params
  const latStr = searchParams.get('lat') || '11.2588';
  const lngStr = searchParams.get('lng') || '75.7804';
  const addressParam = decodeURIComponent(searchParams.get('address') || '');
  const issueParam = searchParams.get('issue') || 'tyre';

  // Form Fields
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  useEffect(() => {
    setAddress(addressParam || 'Mavoor Road, Kozhikode');
    setLat(latStr);
    setLng(lngStr);
  }, [addressParam, latStr, lngStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Gate check: Auth Required
    if (!user) {
      openLoginModal();
      return;
    }

    if (!address) {
      setError('Breakdown address is required.');
      return;
    }

    const latVal = parseFloat(lat);
    const lngVal = parseFloat(lng);
    if (isNaN(latVal) || isNaN(lngVal)) {
      setError('Latitude and Longitude must be valid numerical parameters.');
      return;
    }

    setError(null);
    setLoading(true);

    const bookingPayload = {
      customer_id: user.id,
      worker_id: null, // assigned by routing matcher next
      status: 'searching', // initially goes to searching radar
      issue_type: issueParam,
      latitude: latVal,
      longitude: lngVal,
      address: address.trim(),
      notes: notes.trim() || null,
    };

    try {
      let bookingId = `mock-booking-${Date.now()}`;
      let dbSuccess = false;

      // 2. Insert into Supabase bookings table
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error: insertError } = await supabase
          .from('bookings')
          .insert(bookingPayload)
          .select('id')
          .single();

        if (!insertError && data) {
          bookingId = data.id;
          dbSuccess = true;
        } else {
          console.error('Error inserting booking: ', insertError?.message);
        }
      }

      // 3. Trigger booking routing matcher in the background
      // (This fires the Next.js API matcher route asynchronously so the customer goes to radar instantly!)
      fetch(`/api/bookings/match?bookingId=${bookingId}`, { method: 'POST' }).catch((err) => {
        console.error('Background matcher call failed:', err);
      });

      // 4. Redirect to searching radar Screen C9
      router.push(`/booking/searching?id=${bookingId}`);
    } catch (err: any) {
      console.error('Failed creating request:', err);
      setError(err.message || 'Could not post service booking.');
      setLoading(false);
    }
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

  return (
    <div className="flex-1 w-full bg-background flex items-center justify-center py-12 px-4">
      {/* Background accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-safety-amber/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card shadow-2xl glassmorphism p-8 flex flex-col gap-6 relative">
        {/* Back navigation */}
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground border border-border transition-all active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-safety-amber to-safety-orange text-navy-dark shadow-md mb-2">
            <Wrench className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber mb-0.5">
            Emergency Dispatch
          </span>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            Request {getCategoryLabel(issueParam)}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            Please confirm your breakdown coordinates and describe your issue for the responding
            mechanic.
          </p>
        </div>

        {searchParams.get('ai_suggested') === 'true' && (
          <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-success text-[10.5px] font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
            <span>✨ Pre-filled with AI Diagnoser suggestion</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="book-addr"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >
              Breakdown Spot Landmark Address *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="book-addr"
                className="pl-10 h-11 rounded-xl text-xs font-semibold border-border bg-background"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="book-notes"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >
              Problem Description / Notes
            </Label>
            <textarea
              id="book-notes"
              placeholder="e.g. Scooter tyre has a nail in Palayam junction. Need tubeless puncture repair kit."
              className="w-full min-h-[90px] rounded-xl border border-border bg-background p-3 text-xs font-medium focus:outline-none focus:border-safety-amber focus:ring-1 focus:ring-safety-amber transition-all"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Hidden coordinate inputs */}
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Latitude
              </Label>
              <Input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="h-9 rounded-lg text-xs border-border bg-secondary/40"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Longitude
              </Label>
              <Input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="h-9 rounded-lg text-xs border-border bg-secondary/40"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl font-bold button-warning-gradient hover:opacity-90 active:scale-95 transition-all text-navy-dark mt-2 flex items-center justify-center gap-1.5 shadow-md shadow-safety-amber/10"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Posting Request...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Request & Match</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function BookingNewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full bg-background flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
          <span className="text-sm font-semibold">Initializing dispatch form...</span>
        </div>
      }
    >
      <BookingNewForm />
    </Suspense>
  );
}
