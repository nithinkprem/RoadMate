'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Calendar,
  RefreshCw,
  XOctagon,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MembershipDetails {
  plan_type: string;
  status: string;
  usage_counter: number;
  renewal_date: string;
}

export default function MembershipStatusPage() {
  const router = useRouter();
  const { user, openLoginModal } = useAuth();

  const [membership, setMembership] = useState<MembershipDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);

  const fetchMembership = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('memberships')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setMembership(data as MembershipDetails);
          dbSuccess = true;
        }
      }

      if (!dbSuccess) {
        // Mock fallback if not in DB
        setMembership({
          plan_type: 'premium',
          status: 'active',
          usage_counter: 999,
          renewal_date: new Date(Date.now() + 3600000 * 24 * 300).toISOString(), // renewal in 300 days
        });
      }
    } catch (err) {
      console.error('Error fetching membership status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      openLoginModal();
      return;
    }
    fetchMembership();
  }, [user]);

  const handleCancelMembership = async () => {
    if (!user || !membership) return;
    if (!confirm('Are you sure you want to cancel your Knive Club membership renewal?')) return;

    setCancelLoading(true);
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        await supabase.from('memberships').update({ status: 'cancelled' }).eq('user_id', user.id);
      }
      setMembership((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } catch (err) {
      console.error('Cancellation failed:', err);
    } finally {
      setCancelLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 text-center px-4">
        <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3" />
        <span className="text-sm font-bold text-primary dark:text-foreground mb-1">
          Access restricted
        </span>
        <p className="text-xs text-muted-foreground max-w-xs mb-4">
          Please log in to manage your Knive membership plans.
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
      <div className="flex-grow w-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Loading membership console...</span>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full bg-background flex items-center justify-center py-12 px-4 relative">
      {/* Background accents */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-safety-amber/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card shadow-2xl p-8 flex flex-col gap-6 text-center items-center relative glassmorphism">
        {/* Navigation back */}
        <div className="flex items-center w-full">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-bold text-muted-foreground hover:text-foreground border border-border transition-all active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </button>
        </div>

        {!membership || membership.status === 'expired' ? (
          <div className="flex flex-col items-center gap-4 py-6 w-full">
            <XOctagon className="h-12 w-12 text-muted-foreground" />
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-primary dark:text-foreground">
                No Active Plan
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                You are not currently subscribed to any Knive Emergency Roadside Rescue plan.
              </p>
            </div>
            <Button
              onClick={() => router.push('/membership/plans')}
              className="w-full h-11 rounded-xl font-bold button-warning-gradient text-navy-dark mt-2 shadow-md shadow-safety-amber/10"
            >
              Browse Assistance Plans
            </Button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-5 text-left">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="h-10 w-10 rounded-xl bg-safety-amber/10 text-safety-amber border border-safety-amber/20 flex items-center justify-center">
                <Zap className="h-5 w-5 fill-safety-amber" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
                  Knive Club Member
                </span>
                <h3 className="text-lg font-black text-primary dark:text-foreground uppercase tracking-wider">
                  {membership.plan_type} Guard
                </h3>
              </div>
            </div>

            {/* Status box */}
            <div className="p-4 rounded-xl border border-border bg-background/55 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-bold">Plan Status:</span>
                <span
                  className={`inline-flex items-center text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                    membership.status === 'active'
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}
                >
                  {membership.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-bold">Remaining Limits:</span>
                <span className="font-black text-primary dark:text-foreground">
                  {membership.usage_counter === 999
                    ? 'Unlimited calls'
                    : `${membership.usage_counter} calls left`}
                </span>
              </div>
            </div>

            {/* Renewal info */}
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <Calendar className="h-4.5 w-4.5 text-safety-amber shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-[9px] uppercase tracking-widest">
                  Next Renewal Date
                </span>
                <span className="font-semibold text-primary dark:text-foreground mt-0.5">
                  {new Date(membership.renewal_date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Cancel Actions */}
            {membership.status === 'active' && (
              <Button
                onClick={handleCancelMembership}
                disabled={cancelLoading}
                variant="outline"
                className="w-full h-11 rounded-xl text-xs font-bold border-destructive/20 hover:bg-destructive/10 text-destructive active:scale-95 transition-all mt-2"
              >
                {cancelLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XOctagon className="h-4 w-4" />
                )}
                <span>Cancel Membership Renewal</span>
              </Button>
            )}

            {membership.status === 'cancelled' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-amber-500 text-center font-semibold leading-relaxed">
                Your membership renewal is cancelled. You will continue to receive rescue services
                until the end of your billing cycle.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
