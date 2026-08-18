'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Zap, Award, Calendar, Users, CheckCircle2, XOctagon } from 'lucide-react';

interface MemberRecord {
  id: string;
  name?: string;
  email?: string;
  plan_type: string;
  status: string;
  usage_counter: number;
  renewal_date: string;
}

export default function AdminMembershipsPage() {
  const [records, setRecords] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMemberships = async () => {
      setLoading(true);
      try {
        let dbSuccess = false;

        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data, error } = await supabase
            .from('memberships')
            .select('*, users!inner(name, email)');

          if (!error && data) {
            setRecords(
              data.map((r: any) => ({
                id: r.id,
                name: r.users?.name,
                email: r.users?.email,
                plan_type: r.plan_type,
                status: r.status,
                usage_counter: r.usage_counter,
                renewal_date: r.renewal_date,
              }))
            );
            dbSuccess = true;
          }
        }

        if (!dbSuccess) {
          setRecords([
            {
              id: 'member-1',
              name: 'Aswathy Calicut',
              email: 'aswathy@gmail.com',
              plan_type: 'premium',
              status: 'active',
              usage_counter: 999,
              renewal_date: new Date(Date.now() + 3600000 * 24 * 320).toISOString(),
            },
            {
              id: 'member-2',
              name: 'Haris Mavoor',
              email: 'haris@gmail.com',
              plan_type: 'basic',
              status: 'cancelled',
              usage_counter: 2,
              renewal_date: new Date(Date.now() + 3600000 * 24 * 12).toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching memberships logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberships();
  }, []);

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col border-b border-border/60 pb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber font-mono">
          Memberships Auditing
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          Assistance Subscriptions
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review customer rescue plan tiers, remaining usage counters, and cancellation statuses.
        </p>
      </div>

      {/* Grid */}
      <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-4 shadow-sm">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-success" />
          <span>Active Plans Register</span>
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
            <span className="text-sm font-semibold">Resolving plan ledger...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
            No subscriptions logs found.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold text-[9px] uppercase tracking-wider">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Tier</th>
                  <th className="pb-3">Remaining Free Calls</th>
                  <th className="pb-3">Renewal Date</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-semibold">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 font-bold text-primary dark:text-foreground">
                      <div className="flex flex-col">
                        <span>{rec.name || 'Assistance Customer'}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {rec.email || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 font-bold text-primary dark:text-foreground uppercase tracking-wider">
                      {rec.plan_type}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {rec.usage_counter === 999
                        ? 'Unlimited rescue calls'
                        : `${rec.usage_counter} calls left`}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(rec.renewal_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          rec.status === 'active'
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
