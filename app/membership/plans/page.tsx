'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Award, Check, Loader2, ArrowLeft, ShieldCheck, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MembershipPlansPage() {
  const router = useRouter();
  const { user, openLoginModal } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchActivePlan = async () => {
      try {
        const { data } = await supabase
          .from('memberships')
          .select('plan_type, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (data) {
          setActivePlan(data.plan_type);
        }
      } catch (err) {
        console.error('Error loading active membership:', err);
      }
    };
    fetchActivePlan();
  }, [user]);

  const handleSubscribe = async (planType: 'basic' | 'premium', price: number) => {
    if (!user) {
      openLoginModal();
      return;
    }

    setLoading(true);
    try {
      let dbSuccess = false;

      // Update/insert membership
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const renewalDate = new Date();
        renewalDate.setFullYear(renewalDate.getFullYear() + 1); // 1 year renewal

        const { error } = await supabase.from('memberships').upsert({
          user_id: user.id,
          plan_type: planType,
          status: 'active',
          usage_counter: planType === 'basic' ? 3 : 999, // basic has 3 free calls, premium unlimited
          renewal_date: renewalDate.toISOString(),
        });

        if (!error) dbSuccess = true;
      }

      router.push('/membership/status');
    } catch (err) {
      console.error('Subscribe failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-background flex items-center justify-center py-12 px-4 relative">
      {/* Background accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-safety-amber/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[680px] rounded-2xl border border-border bg-card shadow-2xl p-8 flex flex-col gap-6 relative glassmorphism">
        {/* Navigation back */}
        <div className="flex items-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-bold text-muted-foreground hover:text-foreground border border-border transition-all active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-safety-amber to-safety-orange text-navy-dark shadow-md mb-2">
            <Zap className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber mb-0.5">
            Knive Club memberships
          </span>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            Choose Assistance Plan
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-[340px]">
            Lock in free emergency breakdown assists, flat tyre fixes, battery replacements, and
            towing coverage.
          </p>
        </div>

        {/* PLANS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* BASIC RESCUE PLAN */}
          <div className="p-6 rounded-2xl border border-border bg-background/40 flex flex-col gap-5 relative hover:border-safety-amber/40 transition-all">
            <div className="flex flex-col gap-1 text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Standard Guard
              </span>
              <h3 className="text-lg font-black text-primary dark:text-foreground">Basic Rescue</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black">₹299</span>
                <span className="text-[10px] text-muted-foreground">/ year</span>
              </div>
            </div>

            <ul className="space-y-2.5 text-left text-xs font-medium text-muted-foreground flex-grow">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span>3 Free Emergency Calls per year</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span>Tyre puncture & Battery Jumpstart</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span>15% discount on emergency Towing</span>
              </li>
            </ul>

            <Button
              onClick={() => handleSubscribe('basic', 299)}
              disabled={loading}
              className="w-full h-10 rounded-xl font-bold bg-secondary hover:bg-muted text-primary dark:text-foreground"
            >
              {activePlan === 'basic' ? 'Active Plan' : 'Subscribe Basic'}
            </Button>
          </div>

          {/* PREMIUM ELITE PLAN */}
          <div className="p-6 rounded-2xl border-2 border-safety-amber bg-safety-amber/5 flex flex-col gap-5 relative hover:opacity-95 transition-all shadow-md shadow-safety-amber/5">
            <div className="absolute top-3 right-3 bg-safety-amber text-navy-dark text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
              Best value
            </div>

            <div className="flex flex-col gap-1 text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-safety-amber">
                Unlimited Elite
              </span>
              <h3 className="text-lg font-black text-primary dark:text-foreground flex items-center gap-1.5">
                <span>Premium Elite</span>
                <Star className="h-4 w-4 fill-safety-amber text-safety-amber" />
              </h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-glow-warning text-safety-amber">
                  ₹999
                </span>
                <span className="text-[10px] text-muted-foreground">/ year</span>
              </div>
            </div>

            <ul className="space-y-2.5 text-left text-xs font-medium text-primary dark:text-foreground flex-grow">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span>Unlimited Emergency Calls</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span>Free Punctures, Battery, & Fuel</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span>Free Towing up to 20 km radius</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span>Priority Dispatch Matcher SLA</span>
              </li>
            </ul>

            <Button
              onClick={() => handleSubscribe('premium', 999)}
              disabled={loading}
              className="w-full h-10 rounded-xl font-bold bg-safety-amber hover:opacity-90 text-navy-dark"
            >
              {activePlan === 'premium' ? 'Active Plan' : 'Subscribe Premium'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
