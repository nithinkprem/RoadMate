'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Loader2,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BookingRecord {
  id: string;
  status:
    'pending' | 'searching' | 'assigned' | 'on_the_way' | 'arrived' | 'completed' | 'cancelled';
  issue_type: string;
  address: string;
  customer_name?: string;
  worker_name?: string;
  created_at: string;
}

const MOCK_BOARD_BOOKINGS: BookingRecord[] = [
  {
    id: 'b-board-1',
    status: 'searching',
    issue_type: 'tyre',
    address: 'Mavoor Road KSRTC Stand, Calicut',
    customer_name: 'Anand Kumar',
    created_at: new Date(Date.now() - 60000 * 2).toISOString(),
  },
  {
    id: 'b-board-2',
    status: 'assigned',
    issue_type: 'battery',
    address: 'Kozhikode Beach, Gandhi Park',
    customer_name: 'Meera Nair',
    worker_name: 'Suhail Mavoor',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'b-board-3',
    status: 'on_the_way',
    issue_type: 'mechanic',
    address: 'Palayam Junction, Kozhikode',
    customer_name: 'Sandra Das',
    worker_name: 'Dilip Kumar Calicut',
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: 'b-board-4',
    status: 'completed',
    issue_type: 'towing',
    address: 'Bypass Road, Calicut',
    customer_name: 'Rahul Devan',
    worker_name: 'Biju Calicut',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export default function AdminBookingsBoardPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBookings = async () => {
    try {
      let dbSuccess = false;

      // 1. Fetch from Supabase
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, customer:users!bookings_customer_id_fkey(name), worker:workers(name)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbSuccess = true;
          setBookings(
            data.map((b: any) => ({
              id: b.id,
              status: b.status,
              issue_type: b.issue_type,
              address: b.address,
              customer_name: b.customer?.name || 'Customer',
              worker_name: b.worker?.name || undefined,
              created_at: b.created_at,
            }))
          );
        }
      }

      // 2. Mock fallback
      if (!dbSuccess) {
        setBookings(MOCK_BOARD_BOOKINGS);
      }
    } catch (err) {
      console.error('Error fetching bookings board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Setup periodic polling
    const interval = setInterval(fetchBookings, 5000);

    // Setup Supabase Realtime channel
    let channel: any;
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
    ) {
      channel = supabase
        .channel('admin-bookings-board')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
          fetchBookings();
        })
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

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

  // Status column setup
  const columns: { id: string; label: string; bg: string; text: string }[] = [
    {
      id: 'searching',
      label: 'Matching / Searching',
      bg: 'bg-amber-500/10',
      text: 'text-amber-500',
    },
    { id: 'assigned', label: 'Assigned Partner', bg: 'bg-blue-500/10', text: 'text-blue-500' },
    {
      id: 'on_the_way',
      label: 'Partner En Route',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-500',
    },
    { id: 'arrived', label: 'At Breakdown Spot', bg: 'bg-purple-500/10', text: 'text-purple-500' },
    { id: 'completed', label: 'Completed Jobs', bg: 'bg-success/10', text: 'text-success' },
    { id: 'cancelled', label: 'Cancelled Jobs', bg: 'bg-destructive/10', text: 'text-destructive' },
  ];

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Loading live bookings feed...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full h-full max-w-[1280px] mx-auto overflow-hidden">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border/60 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
            Realtime Dispatch HUD
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            Live Bookings Board
          </h1>
        </div>
        <div className="text-[10px] font-bold text-muted-foreground bg-secondary/80 border border-border px-3 py-1.5 rounded-full flex items-center gap-1.5 self-start">
          <Activity className="h-3.5 w-3.5 text-success animate-pulse" />
          <span>Postgres changes feed active</span>
        </div>
      </div>

      {/* KANBAN SCROLL BOARD */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-grow items-start h-[600px]">
        {columns.map((col) => {
          const colBookings = bookings.filter(
            (b) => b.status === col.id || (col.id === 'searching' && b.status === 'pending')
          );
          return (
            <div
              key={col.id}
              className="w-[300px] shrink-0 flex flex-col gap-3.5 p-4 rounded-2xl bg-card/60 glassmorphism border border-border/80 h-full overflow-y-auto"
            >
              {/* Header column */}
              <div className="flex justify-between items-center border-b border-border pb-2 shrink-0">
                <span className={`text-[10px] font-black uppercase tracking-widest ${col.text}`}>
                  {col.label}
                </span>
                <span className="text-[10px] font-bold bg-secondary border border-border text-muted-foreground px-2 py-0.5 rounded-full">
                  {colBookings.length}
                </span>
              </div>

              {/* Booking Cards in this column */}
              <div className="flex flex-col gap-3 flex-grow overflow-y-auto pr-0.5">
                {colBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/45 border border-dashed border-border/60 rounded-xl bg-background/10 flex-grow">
                    <span className="text-[10px] font-semibold">No bookings</span>
                  </div>
                ) : (
                  colBookings.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-xl border border-border bg-background/55 hover:border-muted-foreground/30 transition-all flex flex-col gap-2.5 text-xs shadow-sm`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-black text-[10px] text-primary dark:text-foreground uppercase tracking-wider">
                          {getCategoryLabel(b.issue_type)}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          {new Date(b.created_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[200px]">
                          {b.address}
                        </span>
                      </div>

                      <div className="border-t border-border/50 pt-2 flex flex-col gap-1 text-[10px]">
                        <span className="font-semibold text-primary dark:text-foreground">
                          Client: <span className="text-muted-foreground">{b.customer_name}</span>
                        </span>
                        {b.worker_name && (
                          <span className="font-semibold text-primary dark:text-foreground flex items-center gap-1">
                            <Truck className="h-3 w-3 text-success shrink-0" />
                            <span>
                              Mechanic:{' '}
                              <span className="text-muted-foreground">{b.worker_name}</span>
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
