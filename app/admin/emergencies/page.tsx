'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ShieldAlert, MapPin, Calendar, Users, CheckCircle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmergencyRecord {
  id: string;
  name?: string;
  phone?: string;
  category: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

export default function AdminEmergenciesPage() {
  const [records, setRecords] = useState<EmergencyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('emergency_requests')
          .select('*, users(name, phone)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setRecords(
            data.map((r: any) => ({
              id: r.id,
              name: r.users?.name,
              phone: r.users?.phone,
              category: r.category,
              latitude: Number(r.latitude),
              longitude: Number(r.longitude),
              status: r.status,
              created_at: r.created_at,
            }))
          );
          dbSuccess = true;
        }
      }

      if (!dbSuccess) {
        setRecords([
          {
            id: 'emerg-1',
            name: 'Aswathy Calicut',
            phone: '9876543230',
            category: 'SOS_alert',
            latitude: 11.2588,
            longitude: 75.7804,
            status: 'active',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'emerg-2',
            name: 'Ravi Verma Kochi',
            phone: '9876543221',
            category: 'police',
            latitude: 11.2688,
            longitude: 75.7904,
            status: 'resolved',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching emergencies list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const handleResolveEmergency = async (id: string) => {
    setActionLoading(id);
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        await supabase.from('emergency_requests').update({ status: 'resolved' }).eq('id', id);
      }
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'resolved' } : r)));
    } catch (err) {
      console.error('Resolve failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col border-b border-border/60 pb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 font-mono">
          Operations Monitoring
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          SOS Emergency Logs
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor incoming SOS panic signals and emergency provider lookups triggered by motorists.
        </p>
      </div>

      {/* Grid */}
      <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-4 shadow-sm">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          <span>Active SOS signals Feed</span>
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
            <span className="text-sm font-semibold">Resolving SOS feeds...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
            No emergency requests logged.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold text-[9px] uppercase tracking-wider">
                  <th className="pb-3">Logged Date</th>
                  <th className="pb-3">Motorist Details</th>
                  <th className="pb-3">Alert Category</th>
                  <th className="pb-3">Coordinates</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-semibold text-primary dark:text-foreground">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 text-muted-foreground">
                      {new Date(rec.created_at).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span>{rec.name || 'Assistance Motorist'}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {rec.phone || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                          rec.category === 'SOS_alert'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {rec.category}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground font-mono text-[10.5px]">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <span>
                          {rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      {rec.status === 'active' ? (
                        <Button
                          onClick={() => handleResolveEmergency(rec.id)}
                          disabled={actionLoading === rec.id}
                          className="h-7 rounded-lg text-[8.5px] font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white px-2.5 flex items-center justify-center gap-0.5"
                        >
                          {actionLoading === rec.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Activity className="h-3 w-3 animate-pulse" />
                          )}
                          <span>Resolve SOS</span>
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded border bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3" />
                          <span>Resolved</span>
                        </span>
                      )}
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
