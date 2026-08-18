'use client';

import React, { useEffect, useState } from 'react';
import { useWorker } from '../layout';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  Loader2,
  IndianRupee,
  Clock,
  CheckCircle2,
  Award,
  Wallet,
  ArrowUpRight,
  BookOpen,
} from 'lucide-react';

interface PayoutRecord {
  id: string;
  booking_id: string;
  total_amount: number;
  platform_commission: number;
  worker_payout: number;
  status: 'pending' | 'paid';
  created_at: string;
  issue_type?: string;
  address?: string;
}

export default function WorkerEarningsPage() {
  const { worker } = useWorker();

  const [records, setRecords] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!worker) return;

    const fetchEarningsLedger = async () => {
      setLoading(true);
      try {
        let dbSuccess = false;

        // 1. Fetch payout_ledgers for this worker
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data, error } = await supabase
            .from('payout_ledgers')
            .select('*, bookings!inner(issue_type, address)')
            .eq('worker_id', worker.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            dbSuccess = true;
            setRecords(
              data.map((r: any) => ({
                id: r.id,
                booking_id: r.booking_id,
                total_amount: Number(r.total_amount),
                platform_commission: Number(r.platform_commission),
                worker_payout: Number(r.worker_payout),
                status: r.status,
                created_at: r.created_at,
                issue_type: r.bookings?.issue_type,
                address: r.bookings?.address,
              }))
            );
          }
        }

        // 2. Mock fallback
        if (!dbSuccess) {
          setRecords([
            {
              id: 'pay-ledger-1',
              booking_id: 'b-board-1',
              total_amount: 350,
              platform_commission: 52.5,
              worker_payout: 297.5,
              status: 'pending',
              created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
              issue_type: 'tyre',
              address: 'Mavoor Road near KSRTC Stand, Calicut',
            },
            {
              id: 'pay-ledger-2',
              booking_id: 'b-board-2',
              total_amount: 1500,
              platform_commission: 225.0,
              worker_payout: 1275.0,
              status: 'paid',
              created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
              issue_type: 'towing',
              address: 'Bypass Road, Kozhikode',
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching payouts metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarningsLedger();
  }, [worker]);

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
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Consolidating partner ledger...</span>
      </div>
    );
  }

  // Aggregate stats
  const totalGMV = records.reduce((sum, r) => sum + r.total_amount, 0);
  const totalCommission = records.reduce((sum, r) => sum + r.platform_commission, 0);
  const netEarnings = records.reduce((sum, r) => sum + r.worker_payout, 0);

  const pendingPayouts = records
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.worker_payout, 0);

  const clearedPayouts = records
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.worker_payout, 0);

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-success">
          Partner Revenue Ledger
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          Earnings & Payouts
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor your emergency service payouts, commission calculations, and ledger splits.
        </p>
      </div>

      {/* METRIC CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-success" />
            <span>Gross Billings</span>
          </span>
          <span className="text-xl font-black text-primary dark:text-foreground">
            ₹{totalGMV.toLocaleString()}
          </span>
          <span className="text-[8px] text-muted-foreground">Total client charges</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Platform Cut (15%)</span>
          </span>
          <span className="text-xl font-black text-muted-foreground">
            ₹{totalCommission.toLocaleString()}
          </span>
          <span className="text-[8px] text-muted-foreground">Commission fee</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5 text-success" />
            <span>Pending Payout</span>
          </span>
          <span className="text-xl font-black text-safety-amber">
            ₹{pendingPayouts.toLocaleString()}
          </span>
          <span className="text-[8px] text-muted-foreground">In settlement queue</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span>Cleared Payouts</span>
          </span>
          <span className="text-xl font-black text-success">
            ₹{clearedPayouts.toLocaleString()}
          </span>
          <span className="text-[8px] text-muted-foreground">Disbursed to bank</span>
        </div>
      </section>

      {/* DETAILED TRANSACTION LOGS */}
      <div className="p-6 rounded-2xl border border-border bg-card/50 glassmorphism flex flex-col gap-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-success" />
          <span>Job Payout Ledger</span>
        </h3>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl">
            <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <span className="text-xs font-bold">No payout records found.</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold text-[9px] uppercase tracking-wider">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3 text-right">Job Fee</th>
                  <th className="pb-3 text-right">Commission</th>
                  <th className="pb-3 text-right">Your Payout</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 font-semibold text-muted-foreground">
                      {new Date(rec.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 font-bold text-primary dark:text-foreground">
                      {rec.issue_type ? getCategoryLabel(rec.issue_type) : 'Roadside Call'}
                    </td>
                    <td className="py-3 text-muted-foreground max-w-[180px] truncate">
                      {rec.address || 'Kozhikode'}
                    </td>
                    <td className="py-3 text-right font-semibold">₹{rec.total_amount}</td>
                    <td className="py-3 text-right text-muted-foreground">
                      -₹{rec.platform_commission}
                    </td>
                    <td className="py-3 text-right font-black text-success">
                      ₹{rec.worker_payout}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          rec.status === 'paid'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
