'use client';

import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  FileText,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Phone,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

interface WorkerApplication {
  id: string;
  name: string;
  phone: string;
  base_latitude: number;
  base_longitude: number;
  vehicle_type?: string;
  vehicle_plate?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  document_url?: string; // Signed URL fallback
  services?: { category: string; base_price: number }[];
}

const MOCK_APPLICATIONS: WorkerApplication[] = [
  {
    id: 'mworker-1',
    name: 'Dilip Kumar Calicut',
    phone: '9876543220',
    base_latitude: 11.2588,
    base_longitude: 75.7804,
    vehicle_type: 'Bolero Camper',
    vehicle_plate: 'KL-11-Z-9988',
    verification_status: 'pending',
    document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    services: [
      { category: 'tyre', base_price: 250 },
      { category: 'towing', base_price: 1800 },
    ],
  },
  {
    id: 'mworker-2',
    name: 'Suhail Mavoor',
    phone: '9876543221',
    base_latitude: 11.2612,
    base_longitude: 75.7845,
    vehicle_type: 'Royal Enfield Bullet',
    vehicle_plate: 'KL-11-AB-1234',
    verification_status: 'pending',
    document_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    services: [
      { category: 'mechanic', base_price: 450 },
      { category: 'battery', base_price: 300 },
    ],
  },
];

export default function AdminWorkerQueuePage() {
  const [apps, setApps] = useState<WorkerApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Rejection Dialog states
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        let dbSuccess = false;

        // 1. Query Supabase
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data: workersData, error: workersError } = await supabase
            .from('workers')
            .select('*')
            .eq('verification_status', 'pending');

          if (!workersError && workersData) {
            dbSuccess = true;

            // Map services and documents
            const formattedApps: WorkerApplication[] = [];
            for (const worker of workersData) {
              const { data: services } = await supabase
                .from('worker_services')
                .select('category, base_price')
                .eq('worker_id', worker.id);

              formattedApps.push({
                ...worker,
                services: services || [],
                document_url: 'mock-signed-url.pdf', // in production we query the storage folder bucket list
              });
            }
            setApps(formattedApps);
          }
        }

        // 2. Mock fallback
        if (!dbSuccess) {
          setApps(MOCK_APPLICATIONS);
        }
      } catch (err) {
        console.error('Error fetching applications queue:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleApproveWorker = async (appId: string) => {
    setActionLoading(appId);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { error } = await supabase
          .from('workers')
          .update({ verification_status: 'verified' })
          .eq('id', appId);

        if (!error) {
          dbSuccess = true;
          // Also verify the user has the 'worker' role
          await supabase.from('users').update({ role: 'worker' }).eq('id', appId);
        }
      }

      // Update locally
      setApps((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRejectDialog = (appId: string) => {
    setRejectingAppId(appId);
    setRejectionReason('');
  };

  const handleCloseRejectDialog = () => {
    setRejectingAppId(null);
    setRejectionReason('');
  };

  const handleRejectWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingAppId || !rejectionReason.trim()) return;

    setActionLoading(rejectingAppId);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { error } = await supabase
          .from('workers')
          .update({
            verification_status: 'rejected',
            rejection_reason: rejectionReason.trim(),
          })
          .eq('id', rejectingAppId);

        if (!error) dbSuccess = true;
      }

      setApps((prev) => prev.filter((a) => a.id !== rejectingAppId));
      handleCloseRejectDialog();
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setActionLoading(null);
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
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Loading applications queue...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
          Moderator Back Office
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          Worker Approvals Queue
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Verify registrations, review credentials, check business IDs, and approve/reject roadside
          mechanics.
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center p-6 border border-dashed border-border rounded-2xl bg-card/30">
          <UserCheck className="h-10 w-10 text-success mb-3 animate-pulse" />
          <span className="text-sm font-bold text-primary dark:text-foreground mb-1">
            Queue is Clear!
          </span>
          <p className="text-xs text-muted-foreground max-w-xs">
            No worker applications are currently pending moderation review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {apps.map((app) => {
            const isProcessing = actionLoading === app.id;
            return (
              <div
                key={app.id}
                className="p-6 rounded-2xl border border-border bg-card/60 shadow-sm flex flex-col gap-5 relative overflow-hidden"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-border/60 pb-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-success uppercase tracking-widest flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 animate-pulse" />
                      <span>Pending Verification</span>
                    </span>
                    <h3 className="text-lg font-black text-primary dark:text-foreground mt-1 leading-none">
                      {app.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {app.phone}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Lat: {app.base_latitude.toFixed(4)}, Lng: {app.base_longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5 text-xs">
                    {app.vehicle_type && (
                      <span className="font-semibold text-primary dark:text-foreground">
                        {app.vehicle_type} ({app.vehicle_plate || 'No Plate'})
                      </span>
                    )}
                  </div>
                </div>

                {/* Services & Document attachments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Details */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Pricing & Categories
                    </span>
                    <div className="flex flex-col gap-2">
                      {app.services && app.services.length > 0 ? (
                        app.services.map((s, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-xs p-2 rounded-xl bg-background/50 border border-border"
                          >
                            <span className="font-semibold text-primary dark:text-foreground">
                              {getCategoryLabel(s.category)}
                            </span>
                            <span className="font-black text-success">
                              ₹{s.base_price} base rate
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">
                          No services declared.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document Box */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Verification Credentials
                    </span>

                    <a
                      href={app.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl border border-dashed border-border bg-background/20 hover:bg-background/45 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-safety-amber" />
                        <div className="flex flex-col">
                          <span className="font-bold text-primary dark:text-foreground">
                            Review Credentials ID Document
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Click to view/download attachment
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-safety-amber bg-safety-amber/10 px-2 py-1 rounded">
                        View File
                      </span>
                    </a>
                  </div>
                </div>

                {/* Queue Actions */}
                <div className="flex justify-end gap-3 border-t border-border/60 pt-4 mt-1">
                  <Button
                    onClick={() => handleOpenRejectDialog(app.id)}
                    disabled={isProcessing}
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5 h-10 rounded-xl px-4"
                  >
                    <X className="h-4 w-4" />
                    <span>Reject Application</span>
                  </Button>
                  <Button
                    onClick={() => handleApproveWorker(app.id)}
                    disabled={isProcessing}
                    className="bg-success text-white hover:opacity-90 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5 h-10 rounded-xl px-5 border border-success"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Verify & Approve Partner</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-destructive border-b border-border pb-2">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-bold text-primary dark:text-foreground">Rejection Reason</h3>
            </div>

            <form onSubmit={handleRejectWorker} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="rej-text"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Explain what needs correction *
                </Label>
                <textarea
                  id="rej-text"
                  placeholder="e.g. License document copy is blurred. Please upload a clear photo or PDF scan."
                  className="w-full min-h-[100px] rounded-xl border border-border bg-background p-3 text-xs font-medium focus:outline-none focus:border-safety-amber focus:ring-1 focus:ring-safety-amber transition-all"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleCloseRejectDialog}
                  variant="secondary"
                  className="h-10 rounded-xl text-xs font-bold border border-border bg-secondary hover:bg-muted active:scale-95 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  Confirm Reject
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
