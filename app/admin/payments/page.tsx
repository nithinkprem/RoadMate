'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  Download,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentLedgerRecord {
  id: string;
  booking_id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  commission: number;
  payout: number;
  worker_name?: string;
  payout_status: string;
}

const MOCK_PAYMENTS: PaymentLedgerRecord[] = [
  {
    id: 'pay-1',
    booking_id: 'booking-a1',
    amount: 350,
    method: 'online',
    status: 'paid',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    commission: 52.5,
    payout: 297.5,
    worker_name: 'Dilip Kumar Calicut',
    payout_status: 'pending',
  },
  {
    id: 'pay-2',
    booking_id: 'booking-a2',
    amount: 1500,
    method: 'cash',
    status: 'paid',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    commission: 225.0,
    payout: 1275.0,
    worker_name: 'Suhail Mavoor',
    payout_status: 'paid',
  },
];

export default function AdminPaymentsLedgerPage() {
  const [records, setRecords] = useState<PaymentLedgerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      let dbSuccess = false;

      // 1. Fetch from Supabase
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('payments')
          .select(
            '*, bookings!inner(worker_id, workers(name)), payout_ledgers(platform_commission, worker_payout, status)'
          )
          .order('created_at', { ascending: false });

        if (!error && data) {
          dbSuccess = true;
          setRecords(
            data.map((p: any) => {
              const ledger = p.payout_ledgers?.[0] || {};
              return {
                id: p.id,
                booking_id: p.booking_id,
                amount: Number(p.amount),
                method: p.method,
                status: p.status,
                created_at: p.created_at,
                commission: Number(ledger.platform_commission || p.amount * 0.15),
                payout: Number(ledger.worker_payout || p.amount * 0.85),
                worker_name: p.bookings?.workers?.name || 'Assigned Partner',
                payout_status: ledger.status || 'pending',
              };
            })
          );
        }
      }

      // 2. Mock fallback
      if (!dbSuccess) {
        setRecords(MOCK_PAYMENTS);
      }
    } catch (err) {
      console.error('Error compiling payments ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  // Export to CSV Action (Screen A10 CSV generation)
  const handleExportCSV = () => {
    if (records.length === 0) return;

    // Header row
    const headers = [
      'Date',
      'Booking ID',
      'Method',
      'Total Paid (INR)',
      'Platform commission (INR)',
      'Worker Payout (INR)',
      'Worker Name',
      'Payout Status',
    ];

    // Body rows
    const rows = records.map((r) => [
      new Date(r.created_at).toLocaleDateString(),
      r.booking_id,
      r.method.toUpperCase(),
      r.amount,
      r.commission,
      r.payout,
      r.worker_name || 'N/A',
      r.payout_status.toUpperCase(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `knive_payouts_reconciliation_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Compiling back office ledgers...</span>
      </div>
    );
  }

  // Aggregate stats
  const totalGMV = records.reduce((sum, r) => sum + r.amount, 0);
  const totalCommission = records.reduce((sum, r) => sum + r.commission, 0);
  const totalPayouts = records.reduce((sum, r) => sum + r.payout, 0);

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
            Finance Reconciliation Back Office
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            Payments & Payouts Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Audit emergency driver payments, check commission splits, verify cash transactions, and
            export data.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          className="h-10 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Export Ledger to CSV</span>
        </Button>
      </div>

      {/* RECON METRIC TILES */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-success" />
            <span>Gross Billings (GMV)</span>
          </span>
          <span className="text-2xl font-black text-primary dark:text-foreground">
            ₹{totalGMV.toLocaleString()}
          </span>
          <span className="text-[8px] text-muted-foreground">Total settled assistance costs</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span>Platform Commission (15%)</span>
          </span>
          <span className="text-2xl font-black text-success">
            ₹{totalCommission.toLocaleString()}
          </span>
          <span className="text-[8px] text-muted-foreground">Net commission cut captured</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
            <span>Net Partner Payouts</span>
          </span>
          <span className="text-2xl font-black text-primary dark:text-foreground">
            ₹{totalPayouts.toLocaleString()}
          </span>
          <span className="text-[8px] text-muted-foreground">Distributed to mechanics (85%)</span>
        </div>
      </section>

      {/* DETAILED LEDGER GRID */}
      <div className="p-6 rounded-2xl border border-border bg-card/50 glassmorphism flex flex-col gap-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-safety-amber" />
          <span>Settled Transaction Stream</span>
        </h3>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl">
            <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <span className="text-xs font-bold">No settled transactions logged.</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold text-[9px] uppercase tracking-wider">
                  <th className="pb-3">Recon Date</th>
                  <th className="pb-3">Booking ID</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Recipient Partner</th>
                  <th className="pb-3 text-right">Job GMV</th>
                  <th className="pb-3 text-right">Commission Cut</th>
                  <th className="pb-3 text-right">Net Payout</th>
                  <th className="pb-3 text-center">Payout Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 text-muted-foreground">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-mono font-semibold text-primary dark:text-foreground">
                      {rec.booking_id.slice(0, 8)}...
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-0.5 text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          rec.method === 'online'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {rec.method}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-primary dark:text-foreground">
                      {rec.worker_name}
                    </td>
                    <td className="py-3 text-right font-semibold">₹{rec.amount}</td>
                    <td className="py-3 text-right text-success font-semibold">
                      ₹{rec.commission}
                    </td>
                    <td className="py-3 text-right font-black text-primary dark:text-foreground">
                      ₹{rec.payout}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          rec.payout_status === 'paid'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {rec.payout_status}
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
