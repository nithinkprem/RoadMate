'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  History,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerBooking {
  id: string;
  status:
    'pending' | 'searching' | 'assigned' | 'on_the_way' | 'arrived' | 'completed' | 'cancelled';
  issue_type: string;
  address: string;
  created_at: string;
}

export default function CustomerBookingsPage() {
  const router = useRouter();
  const { user, openLoginModal } = useAuth();

  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Auth gate check
    if (!user) {
      setLoading(false);
      openLoginModal();
      return;
    }

    const fetchCustomerBookings = async () => {
      setLoading(true);
      try {
        let dbSuccess = false;

        // 1. Fetch from Supabase
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setBookings(data as CustomerBooking[]);
            dbSuccess = true;
          }
        }

        // 2. Mock fallback
        if (!dbSuccess) {
          setBookings([
            {
              id: 'mock-b-1',
              status: 'completed',
              issue_type: 'tyre',
              address: 'Mavoor Road, Near KSRTC Stand, Calicut',
              created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            },
            {
              id: 'mock-b-2',
              status: 'cancelled',
              issue_type: 'battery',
              address: 'Link Road, Kozhikode',
              created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching customer bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerBookings();
  }, [user]);

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

  if (!user) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 text-center px-4">
        <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
        <span className="text-sm font-bold text-primary dark:text-foreground mb-1">
          Access Restrained
        </span>
        <p className="text-xs text-muted-foreground max-w-xs mb-4">
          Please log in to view your dispatch assistance history.
        </p>
        <Button
          onClick={openLoginModal}
          className="button-warning-gradient rounded-xl text-navy-dark px-6 font-bold"
        >
          Login Account
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Loading booking history...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
          Motorist History Logs
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          My Bookings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor active mechanic requests and review completed roadside sessions.
        </p>
      </div>

      {/* Bookings stream list */}
      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center p-6 border border-dashed border-border rounded-2xl bg-card/30">
          <History className="h-10 w-10 text-muted-foreground mb-3" />
          <span className="text-sm font-bold text-primary dark:text-foreground mb-1">
            No Bookings Found
          </span>
          <p className="text-xs text-muted-foreground max-w-xs">
            You haven't requested any roadside assistance calls on Knive yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => {
            const isCompleted = booking.status === 'completed';
            const isCancelled = booking.status === 'cancelled';
            const isActive = !isCompleted && !isCancelled;

            return (
              <div
                key={booking.id}
                className="p-5 rounded-2xl border border-border bg-card/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-muted-foreground/30 transition-all cursor-pointer"
                onClick={() => router.push(`/booking/status?id=${booking.id}`)}
              >
                <div className="flex flex-col gap-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-xs text-primary dark:text-foreground uppercase tracking-wider">
                      {getCategoryLabel(booking.issue_type)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                        isCompleted
                          ? 'bg-success/10 text-success border-success/20'
                          : isCancelled
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-safety-amber/10 text-safety-amber border-safety-amber/20 animate-pulse'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="text-xs text-primary dark:text-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-muted-foreground leading-relaxed truncate max-w-[280px] sm:max-w-md">
                      {booking.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {new Date(booking.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <button className="p-1 rounded bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
