'use client';

import React, { useEffect, useState } from 'react';
import { useWorker } from '../../layout';
import { supabase } from '@/lib/supabase';
import {
  History,
  Loader2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
} from 'lucide-react';

interface PastJob {
  id: string;
  status: 'completed' | 'cancelled';
  issue_type: string;
  address: string;
  notes?: string;
  created_at: string;
}

export default function WorkerJobHistoryPage() {
  const { worker } = useWorker();

  const [jobs, setJobs] = useState<PastJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!worker) return;

    const fetchHistory = async () => {
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
            .eq('worker_id', worker.id)
            .in('status', ['completed', 'cancelled'])
            .order('created_at', { ascending: false });

          if (!error && data) {
            setJobs(data as PastJob[]);
            dbSuccess = true;
          }
        }

        // 2. Mock fallback
        if (!dbSuccess) {
          setJobs([
            {
              id: 'h-1',
              status: 'completed',
              issue_type: 'tyre',
              address: 'Near KSRTC Stand, Mavoor Road, Calicut',
              notes: 'Scooter front tyre puncture fixed',
              created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            },
            {
              id: 'h-2',
              status: 'cancelled',
              issue_type: 'battery',
              address: 'Palayam Junction, Kozhikode',
              notes: 'Client resolved battery issue before arrival',
              created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error compiling job history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
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
        <span className="text-sm font-semibold">Compiling job ledger history...</span>
      </div>
    );
  }

  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const cancellationCount = jobs.filter((j) => j.status === 'cancelled').length;

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-success">
          Landed Assistance Records
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          Job History
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review completed orders, cancelled requests, and area service logs.
        </p>
      </div>

      {/* METRIC SUMMARY CARDS */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-success" />
            <span>Success rate</span>
          </span>
          <span className="text-2xl font-black text-primary dark:text-foreground">
            {jobs.length > 0 ? `${Math.round((completedCount / jobs.length) * 100)}%` : '100%'}
          </span>
          <span className="text-[8px] text-muted-foreground">
            {completedCount} of {jobs.length} completed
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1 shadow-sm">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span>Completed Calls</span>
          </span>
          <span className="text-2xl font-black text-primary dark:text-foreground">
            {completedCount}
          </span>
          <span className="text-[8px] text-muted-foreground">Successful interventions</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-1 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            <span>Cancellations</span>
          </span>
          <span className="text-2xl font-black text-primary dark:text-foreground">
            {cancellationCount}
          </span>
          <span className="text-[8px] text-muted-foreground">Aborted or timed out</span>
        </div>
      </section>

      {/* HISTORY STREAM */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center p-6 border border-dashed border-border rounded-2xl bg-card/30">
          <History className="h-10 w-10 text-muted-foreground mb-3" />
          <span className="text-sm font-bold text-primary dark:text-foreground mb-1">
            No Jobs Found
          </span>
          <p className="text-xs text-muted-foreground max-w-xs">
            You haven't completed or cancelled any roadside requests yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
            const isCompleted = job.status === 'completed';
            return (
              <div
                key={job.id}
                className={`p-5 rounded-2xl border bg-card/60 shadow-sm flex flex-col sm:flex-row justify-between gap-4 transition-all border-border`}
              >
                <div className="flex flex-col gap-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-xs text-primary dark:text-foreground uppercase tracking-wider">
                      {getCategoryLabel(job.issue_type)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                        isCompleted
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}
                    >
                      {isCompleted ? 'Completed' : 'Cancelled'}
                    </span>
                  </div>

                  <div className="text-xs text-primary dark:text-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-muted-foreground leading-relaxed">
                      {job.address}
                    </span>
                  </div>

                  {job.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed italic mt-0.5">
                      &ldquo;{job.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground self-start sm:self-center font-bold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {new Date(job.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
