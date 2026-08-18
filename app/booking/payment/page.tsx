'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  CreditCard,
  Coins,
  Check,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Award,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mock payment modal visibility
  const [showMockModal, setShowMockModal] = useState<boolean>(false);
  const [mockPaymentSuccess, setMockPaymentSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!bookingId) {
      setError('Invalid Booking Reference.');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        let dbSuccess = false;

        const getPricingFor = (issue: string) => {
          const pricing: Record<string, number> = {
            tyre: 350,
            battery: 400,
            mechanic: 500,
            fuel: 250,
            towing: 1500,
            car_wash: 300,
          };
          return pricing[issue] || 350;
        };

        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

          if (!error && data) {
            setBooking(data);
            dbSuccess = true;

            // Check active membership plan (Prompt 56)
            const { data: member } = await supabase
              .from('memberships')
              .select('*')
              .eq('user_id', data.customer_id)
              .eq('status', 'active')
              .maybeSingle();

            if (member && member.usage_counter > 0) {
              const amount = getPricingFor(data.issue_type);

              // Write payment ledger record
              await supabase.from('payments').insert({
                booking_id: bookingId,
                amount,
                status: 'paid',
                method: 'online',
                razorpay_order_id: 'membership_covered',
                razorpay_payment_id: 'membership_covered',
              });

              // Decrement usage limits
              if (member.usage_counter !== 999) {
                await supabase
                  .from('memberships')
                  .update({ usage_counter: member.usage_counter - 1 })
                  .eq('id', member.id);
              }

              // Record split to driver payouts
              const commission = amount * 0.15;
              const payout = amount - commission;
              await supabase.from('payout_ledgers').insert({
                booking_id: bookingId,
                worker_id: data.worker_id,
                total_amount: amount,
                platform_commission: commission,
                worker_payout: payout,
                status: 'pending',
              });

              router.push(`/booking/feedback?id=${bookingId}`);
              return;
            }
          }
        }

        if (!dbSuccess) {
          // Fallback mock booking
          const mockData = {
            id: bookingId,
            status: 'completed',
            issue_type: 'tyre',
            address: 'Mavoor Road Kozhikode',
            worker_id: 'mworker-1',
          };
          setBooking(mockData);

          // Local storage bypass simulation for E2E testing
          if (
            typeof window !== 'undefined' &&
            localStorage.getItem('knive_mock_membership') === 'true'
          ) {
            router.push(`/booking/feedback?id=${bookingId}`);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching booking detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, router]);

  // Load service price (fallback tyre ₹350, towing ₹1500)
  const getJobAmount = () => {
    if (!booking) return 0;
    const pricing: Record<string, number> = {
      tyre: 350,
      battery: 400,
      mechanic: 500,
      fuel: 250,
      towing: 1500,
      car_wash: 300,
    };
    return pricing[booking.issue_type] || 350;
  };

  // Launch Razorpay online order payment (Screen C14 checkout trigger)
  const handleOnlinePayment = async () => {
    setActionLoading(true);
    setError(null);

    const amount = getJobAmount();

    try {
      // 1. Call server-side Razorpay order endpoint
      const response = await fetch('/api/payments/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount }),
      });

      const orderData = await response.json();

      if (!response.ok || orderData.error) {
        setError(orderData.error || 'Failed to initialize payment gateway.');
        setActionLoading(false);
        return;
      }

      // 2. If it's a mock order: trigger our premium local modal simulation
      if (orderData.mock_checkout) {
        setShowMockModal(true);
        setActionLoading(false);
        return;
      }

      // 3. Otherwise: Load real Razorpay SDK dynamically
      const loadScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const res = await loadScript();
      if (!res) {
        setError('Failed to load Razorpay SDK. Check network connections.');
        setActionLoading(false);
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Knive India',
        description: 'Roadside Assistance payment call',
        order_id: orderData.id,
        handler: async function (response: any) {
          // Send verification callback details
          const verifyRes = await fetch('/api/payments/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
              amount,
            }),
          });

          if (verifyRes.ok) {
            router.push(`/booking/feedback?id=${bookingId}`);
          } else {
            setError('Payment verification failed.');
          }
        },
        theme: { color: '#f59e0b' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      setActionLoading(false);
    } catch (err: any) {
      console.error('Payment checkout error:', err);
      setError('An unexpected error occurred during checkouts.');
      setActionLoading(false);
    }
  };

  // Perform Mock Payment Success triggers (Webhook simulator)
  const handleExecuteMockPayment = async () => {
    setActionLoading(true);
    setShowMockModal(false);

    const amount = getJobAmount();

    try {
      let dbSuccess = false;

      // Simulate webhook callbacks to write transactions to db
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        // Insert Payment log
        const { error: pError } = await supabase.from('payments').insert({
          booking_id: bookingId,
          amount,
          status: 'paid',
          method: 'online',
          razorpay_order_id: `ord_mock_${Date.now()}`,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
        });

        if (!pError) {
          dbSuccess = true;
          // Calculate payout splits (15% platform cut)
          const commission = amount * 0.15;
          const payout = amount - commission;

          await supabase.from('payout_ledgers').insert({
            booking_id: bookingId,
            worker_id: booking.worker_id,
            total_amount: amount,
            platform_commission: commission,
            worker_payout: payout,
            status: 'pending',
          });
        }
      }

      setMockPaymentSuccess(true);
      setTimeout(() => {
        router.push(`/booking/feedback?id=${bookingId}`);
      }, 1500);
    } catch (err) {
      console.error('Mock checkout error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Cash / Completion Payment option fallback (Screen C14 cash checkout)
  const handleCashPayment = async () => {
    if (!confirm('Confirm you will pay cash directly to the responding partner?')) return;
    setActionLoading(true);

    const amount = getJobAmount();

    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        // Write cash payments ledger log
        const { error: pError } = await supabase.from('payments').insert({
          booking_id: bookingId,
          amount,
          status: 'paid',
          method: 'cash',
        });

        if (!pError) {
          dbSuccess = true;
          // Record ledger splits
          const commission = amount * 0.15;
          const payout = amount - commission;

          await supabase.from('payout_ledgers').insert({
            booking_id: bookingId,
            worker_id: booking.worker_id,
            total_amount: amount,
            platform_commission: commission,
            worker_payout: payout,
            status: 'pending',
          });
        }
      }

      router.push(`/booking/feedback?id=${bookingId}`);
    } catch (err) {
      console.error('Cash checkout error:', err);
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

  if (loading) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Preparing payment gateway...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-20 text-center px-4">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <span className="text-lg font-bold text-primary dark:text-foreground">
          Payment Inaccessible
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          {error || 'This transaction has been resolved or cancelled.'}
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

  const jobAmount = getJobAmount();

  return (
    <div className="flex-grow w-full bg-background flex items-center justify-center py-12 px-4 relative">
      {/* Background accents */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-success/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card shadow-2xl p-8 flex flex-col gap-6 text-center items-center relative glassmorphism">
        {/* Success splash */}
        {mockPaymentSuccess ? (
          <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-success/15 border border-success/35 text-success flex items-center justify-center shadow-lg shadow-success/10 animate-pulse">
              <Check className="h-8 w-8 text-glow-success" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-primary dark:text-foreground">
                Payment Successful!
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Redirecting to rating panels...
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success border border-success/20 shadow-md mb-2">
              <Award className="h-6 w-6 text-glow-success" />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-success">
                Emergency Call Complete
              </span>
              <h1 className="text-2xl font-black tracking-tight text-primary dark:text-foreground font-sans mt-0.5">
                Assistance Charge
              </h1>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Thank you for choosing Knive. Please settle the service invoice for your{' '}
                {getCategoryLabel(booking.issue_type)}.
              </p>
            </div>

            {/* Total Cost Display box */}
            <div className="w-full p-6 rounded-2xl bg-secondary/50 border border-border flex flex-col items-center justify-center shadow-inner">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Amount Due
              </span>
              <span className="text-3xl font-black text-primary dark:text-foreground mt-1">
                ₹{jobAmount}
              </span>
              <span className="text-[9px] text-muted-foreground mt-1 font-bold">
                Inclusive of all local dispatch taxes
              </span>
            </div>

            {/* Payment selectors */}
            <div className="flex flex-col gap-3 w-full mt-2">
              <Button
                onClick={handleOnlinePayment}
                disabled={actionLoading}
                className="w-full h-12 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-success/10 border border-success"
              >
                {actionLoading ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <CreditCard className="h-4.5 w-4.5" />
                )}
                <span>Pay Online (UPI / Card)</span>
              </Button>

              <Button
                onClick={handleCashPayment}
                disabled={actionLoading}
                variant="outline"
                className="w-full h-12 rounded-xl text-xs font-bold border-border hover:bg-muted active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Coins className="h-4.5 w-4.5 text-safety-amber" />
                <span>Pay Cash to Responder</span>
              </Button>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-semibold border-t border-border pt-4 w-full justify-center">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span>Razorpay Secured Encrypted Checkout Link</span>
            </div>
          </>
        )}
      </div>

      {/* MOCK CHECKOUT MODAL DRAWER SIMULATION */}
      {showMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-float">
            <div className="flex items-center gap-2 text-success border-b border-border pb-3">
              <Wallet className="h-5 w-5 text-glow-success" />
              <div className="flex flex-col text-left">
                <h3 className="font-black text-primary dark:text-foreground text-sm">
                  Knive Mock Gateway
                </h3>
                <span className="text-[9px] text-muted-foreground -mt-0.5">
                  Razorpay Local Sandbox
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary border border-border text-left text-xs space-y-2">
              <div className="flex justify-between font-bold text-primary dark:text-foreground">
                <span>Description:</span>
                <span>Assistance Invoice</span>
              </div>
              <div className="flex justify-between font-black text-success">
                <span>Charge:</span>
                <span>₹{jobAmount}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-center">
              <p className="text-[10px] text-muted-foreground">
                This is a simulation of the payment checkout gateway. Click "Approve Payment" to
                trigger transaction webhook events.
              </p>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setShowMockModal(false)}
                  variant="outline"
                  className="flex-1 h-10 rounded-xl text-xs font-bold border-border bg-card"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecuteMockPayment}
                  className="flex-grow h-10 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve Payment</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full bg-background flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
          <span className="text-sm font-semibold">Initializing payment sheet...</span>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
