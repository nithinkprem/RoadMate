'use client';

import React, { useEffect, useState } from 'react';
import { useWorker } from '../layout';
import { supabase } from '@/lib/supabase';
import {
  Activity,
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  Check,
  AlertTriangle,
  Loader2,
  Play,
  CheckCircle,
  Power,
  Clock,
  Compass,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isShopOpenNow } from '@/lib/hours';

interface WorkerService {
  category: string;
  base_price: number;
  is_paused: boolean;
}

export default function WorkerDashboardPage() {
  const { worker, refreshWorker } = useWorker();

  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [services, setServices] = useState<WorkerService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Realtime Booking states (W7 / W8 flows)
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [incomingBooking, setIncomingBooking] = useState<any | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!worker) return;
    setIsOnline(worker.is_online);

    const loadServices = async () => {
      setLoading(true);
      try {
        let dbSuccess = false;

        // 1. Fetch worker services
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data } = await supabase
            .from('worker_services')
            .select('category, base_price, is_paused')
            .eq('worker_id', worker.id);

          if (data) {
            setServices(data as WorkerService[]);
            dbSuccess = true;
          }

          // Check if worker has active/incoming bookings already
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select('*')
            .eq('worker_id', worker.id)
            .in('status', ['searching', 'assigned', 'on_the_way', 'arrived'])
            .order('created_at', { ascending: false });

          if (bookingsData && bookingsData.length > 0) {
            const current = bookingsData[0];
            if (current.status === 'searching') {
              setIncomingBooking(current);
              // Calculate remaining countdown based on created_at
              const elapsed = Math.floor(
                (Date.now() - new Date(current.updated_at).getTime()) / 1000
              );
              setCountdown(Math.max(0, 60 - elapsed));
            } else {
              setActiveBooking(current);
            }
          }
        }

        if (!dbSuccess) {
          // Mock services
          setServices([
            { category: 'tyre', base_price: 250, is_paused: false },
            { category: 'mechanic', base_price: 450, is_paused: true },
          ]);
        }
      } catch (err) {
        console.error('Error loading dashboard services:', err);
      } finally {
        setLoading(false);
      }
    };

    loadServices();

    // 2. Setup Realtime Booking Subscriptions (Listen for assigned/searching bookings)
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
    ) {
      const channel = supabase
        .channel(`worker-jobs-${worker.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings', filter: `worker_id=eq.${worker.id}` },
          (payload: any) => {
            const newRecord = payload.new;

            if (!newRecord || ['completed', 'cancelled'].includes(newRecord.status)) {
              setActiveBooking(null);
              setIncomingBooking(null);
            } else if (newRecord.status === 'searching') {
              setIncomingBooking(newRecord);
              setCountdown(60);
              setActiveBooking(null);
            } else if (['assigned', 'on_the_way', 'arrived'].includes(newRecord.status)) {
              setActiveBooking(newRecord);
              setIncomingBooking(null);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [worker]);

  // SLA Timer countdown hook for incoming jobs (W7)
  useEffect(() => {
    if (!incomingBooking) return;
    if (countdown <= 0) {
      // SLA timeout - auto-reject job
      handleRejectJob();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingBooking, countdown]);

  // Online / Offline Toggle Action (W6)
  const handleToggleOnline = async () => {
    if (!worker) return;
    const nextState = !isOnline;
    setIsOnline(nextState);

    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        await supabase.from('workers').update({ is_online: nextState }).eq('id', worker.id);
      }
    } catch (err) {
      console.error('Error toggling online state:', err);
    }
  };

  // Toggle individual service pause action (W6)
  const handleToggleServicePause = async (category: string, currentPaused: boolean) => {
    if (!worker) return;

    // Update local state
    setServices((prev) =>
      prev.map((s) => (s.category === category ? { ...s, is_paused: !currentPaused } : s))
    );

    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        await supabase
          .from('worker_services')
          .update({ is_paused: !currentPaused })
          .eq('worker_id', worker.id)
          .eq('category', category);
      }
    } catch (err) {
      console.error('Error toggling service pause:', err);
    }
  };

  // Accept incoming booking (W7)
  const handleAcceptJob = async () => {
    if (!incomingBooking || !worker) return;
    setActionLoading(true);

    try {
      let accepted = false;

      // Conditional Update (Optimistic Locking) to avoid concurrent double accepts
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('bookings')
          .update({ status: 'assigned' })
          .eq('id', incomingBooking.id)
          .eq('status', 'searching') // Ensures booking is still searching
          .select();

        if (!error && data && data.length > 0) {
          accepted = true;
          setActiveBooking(data[0]);
          setIncomingBooking(null);
        }
      } else {
        // Mock fallback accept
        accepted = true;
        setActiveBooking({
          ...incomingBooking,
          status: 'assigned',
        });
        setIncomingBooking(null);
      }

      if (!accepted) {
        alert('This booking was already accepted by another helper or cancelled by the customer.');
        setIncomingBooking(null);
      }
    } catch (err) {
      console.error('Accept job error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject incoming booking / SLA Timeout (W7)
  const handleRejectJob = async () => {
    if (!incomingBooking) return;
    setActionLoading(true);

    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        // Clear worker_id and reset status back to pending so routing matcher can pick up next mechanics
        await supabase
          .from('bookings')
          .update({
            worker_id: null,
            status: 'pending',
            updated_at: new Date().toISOString(), // refresh timestamp for matching countdown
          })
          .eq('id', incomingBooking.id);
      }

      setIncomingBooking(null);
    } catch (err) {
      console.error('Reject job error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Progress active job states (W8)
  const handleTransitionStatus = async (nextStatus: string) => {
    if (!activeBooking) return;
    setActionLoading(true);

    try {
      let updatedBooking = null;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const updatePayload: any = { status: nextStatus };
        if (nextStatus === 'arrived') {
          updatePayload.arrived_at = new Date().toISOString();
        } else if (nextStatus === 'completed') {
          updatePayload.completed_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', activeBooking.id)
          .select()
          .single();

        if (!error && data) {
          updatedBooking = data;
        }
      } else {
        // Mock transition
        updatedBooking = {
          ...activeBooking,
          status: nextStatus,
        };
      }

      if (updatedBooking) {
        if (['completed', 'cancelled'].includes(nextStatus)) {
          setActiveBooking(null);
        } else {
          setActiveBooking(updatedBooking);
        }
      }
    } catch (err) {
      console.error('Transition status error:', err);
    } finally {
      setActionLoading(false);
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

  // UI STATE RENDERS
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Resolving duty metrics...</span>
      </div>
    );
  }

  // --- SCREEN W8: ACTIVE JOB DETAIL CARD ---
  if (activeBooking) {
    const isAssigned = activeBooking.status === 'assigned';
    const isEnRoute = activeBooking.status === 'on_the_way';
    const isArrived = activeBooking.status === 'arrived';

    return (
      <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-xl mx-auto">
        <div className="flex flex-col gap-1 border-b border-border pb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-success animate-pulse">
            Active Job Call
          </span>
          <h1 className="text-2xl font-black text-primary dark:text-foreground font-sans">
            Breakdown Assistance Request
          </h1>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-lg flex flex-col gap-4">
          {/* Customer Address */}
          <div className="flex items-start gap-3 text-xs">
            <MapPin className="h-5 w-5 text-success shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">
                Breakdown location
              </span>
              <span className="font-semibold text-primary dark:text-foreground mt-0.5">
                {activeBooking.address}
              </span>
            </div>
          </div>

          {/* Issue notes */}
          <div className="p-4 rounded-xl bg-background/50 border border-border text-xs space-y-1">
            <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">
              Requested Service
            </span>
            <p className="font-black text-primary dark:text-foreground uppercase tracking-wider text-[10px]">
              {getCategoryLabel(activeBooking.issue_type)}
            </p>
            {activeBooking.notes && (
              <p className="text-muted-foreground mt-1 font-medium italic">
                &ldquo;{activeBooking.notes}&rdquo;
              </p>
            )}
          </div>

          {/* Deep link communication */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <a
              href="tel:9876543210" // In production, we read the customer phone number
              className="h-10 rounded-xl bg-secondary hover:bg-muted text-primary dark:text-foreground text-xs font-bold border border-border flex items-center justify-center gap-1.5 transition-all"
            >
              <Phone className="h-4 w-4 text-glow-success" />
              <span>Call Client</span>
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeBooking.latitude},${activeBooking.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 rounded-xl bg-secondary hover:bg-muted text-primary dark:text-foreground text-xs font-bold border border-border flex items-center justify-center gap-1.5 transition-all"
            >
              <Navigation className="h-4 w-4" />
              <span>Get Route Map</span>
            </a>
          </div>
        </div>

        {/* Transition Buttons */}
        <div className="flex flex-col gap-3">
          {isAssigned && (
            <Button
              onClick={() => handleTransitionStatus('on_the_way')}
              disabled={actionLoading}
              className="w-full h-12 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Start Travel (On the Way)</span>
            </Button>
          )}

          {isEnRoute && (
            <Button
              onClick={() => handleTransitionStatus('arrived')}
              disabled={actionLoading}
              className="w-full h-12 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>Mark Arrived at Location</span>
            </Button>
          )}

          {isArrived && (
            <Button
              onClick={() => handleTransitionStatus('completed')}
              disabled={actionLoading}
              className="w-full h-12 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-success/15"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Mark Work Completed</span>
            </Button>
          )}

          <Button
            onClick={() => handleTransitionStatus('cancelled')}
            disabled={actionLoading}
            variant="outline"
            className="w-full h-12 rounded-xl text-xs font-bold border-destructive/20 hover:bg-destructive/10 text-destructive active:scale-95 transition-all"
          >
            Cancel Job Booking
          </Button>
        </div>
      </div>
    );
  }

  // --- SCREEN W6: STANDARD DUTY CONSOLE ---
  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-xl mx-auto">
      {/* Title */}
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-success">
          Verified Partner Console
        </span>
        <h1 className="text-2xl font-black text-primary dark:text-foreground font-sans">
          Duty Control Panel
        </h1>
      </div>

      {/* Global toggle card */}
      <div
        className={`p-6 rounded-2xl border flex flex-col items-center text-center gap-4 transition-all shadow-md ${
          isOnline ? 'border-success/30 bg-success/5 shadow-success/5' : 'border-border bg-card/60'
        }`}
      >
        <div
          className={`h-14 w-14 rounded-full flex items-center justify-center border transition-all ${
            isOnline
              ? 'bg-success text-white border-success shadow-md shadow-success/20 animate-pulse'
              : 'bg-secondary text-muted-foreground border-border'
          }`}
        >
          <Power className="h-6 w-6" />
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Duty Status
          </span>
          <span
            className={`text-xl font-black mt-0.5 tracking-tight ${isOnline ? 'text-success' : 'text-primary dark:text-foreground'}`}
          >
            {isOnline ? 'Online - Receiving Calls' : 'Offline - Off Duty'}
          </span>
          <p className="text-[10px] text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
            {isOnline
              ? 'Your base location is active on customer breakdown maps. Stay near your console to accept jobs.'
              : 'Turn online to receive emergency tyre puncture and battery calls in Kozhikode area.'}
          </p>
        </div>

        <button
          onClick={handleToggleOnline}
          className={`w-full h-11 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm border ${
            isOnline
              ? 'bg-secondary text-primary dark:text-foreground border-border hover:bg-muted'
              : 'bg-success hover:bg-success/90 text-white border-success'
          }`}
        >
          <span>{isOnline ? 'Go Offline' : 'Go Online & Set Duty'}</span>
        </button>
      </div>

      {/* Checklist toggles */}
      {isOnline && (
        <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
            Online Services Checklist
          </h3>

          <div className="flex flex-col gap-2.5">
            {services.map((s) => (
              <div
                key={s.category}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  !s.is_paused
                    ? 'border-success/20 bg-success/[0.02]'
                    : 'border-border bg-background/25'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary dark:text-foreground">
                    {getCategoryLabel(s.category)}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    Call charge: ₹{s.base_price}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleServicePause(s.category, s.is_paused)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                    !s.is_paused
                      ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                      : 'bg-secondary text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {!s.is_paused ? 'Receiving' : 'Paused'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SCREEN W7: INCOMING JOB ALERT DIALOG DRAWER --- */}
      {incomingBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-float relative overflow-hidden">
            {/* Top countdown banner bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-secondary overflow-hidden">
              <div
                className="h-full bg-success transition-all duration-1000"
                style={{ width: `${(countdown / 60) * 100}%` }}
              />
            </div>

            <div className="flex justify-between items-start border-b border-border pb-3 pt-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-success flex items-center gap-1">
                  <Activity className="h-3 w-3 animate-ping" />
                  <span>Incoming Job Alert</span>
                </span>
                <h3 className="text-lg font-black text-primary dark:text-foreground mt-0.5 leading-none">
                  {getCategoryLabel(incomingBooking.issue_type)}
                </h3>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 text-success text-xs font-black">
                <Clock className="h-3.5 w-3.5" />
                <span>{countdown}s</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <MapPin className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-[9px] uppercase tracking-widest">
                    Client Breakdown Spot
                  </span>
                  <span className="font-semibold text-primary dark:text-foreground">
                    {incomingBooking.address}
                  </span>
                </div>
              </div>

              {incomingBooking.notes && (
                <div className="p-3.5 rounded-xl bg-background/55 border border-border text-xs italic font-medium text-muted-foreground leading-relaxed">
                  &ldquo;{incomingBooking.notes}&rdquo;
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleRejectJob}
                disabled={actionLoading}
                variant="outline"
                className="flex-1 h-11 rounded-xl text-xs font-bold border-destructive/20 hover:bg-destructive/10 text-destructive active:scale-95 transition-all"
              >
                Pass / Ignore
              </Button>

              <Button
                onClick={handleAcceptJob}
                disabled={actionLoading}
                className="flex-grow h-11 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>Accept Job Call</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
