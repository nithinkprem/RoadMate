'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useWorker } from '../layout';
import { Clock, AlertOctagon, CheckCircle2, FileText, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WorkerPendingPage() {
  const router = useRouter();
  const { worker, refreshWorker } = useWorker();

  const handleEditSubmission = () => {
    router.push('/worker/register');
  };

  if (!worker) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 text-center px-4">
        <Clock className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
        <span className="text-sm font-semibold">Resolving worker status...</span>
      </div>
    );
  }

  const isPending = worker.verification_status === 'pending';
  const isRejected = worker.verification_status === 'rejected';
  const isVerified = worker.verification_status === 'verified';

  return (
    <div className="flex-1 w-full bg-background flex items-center justify-center py-16 px-4">
      {/* Background accents */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-success/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card shadow-2xl glassmorphism p-8 flex flex-col gap-6 text-center items-center relative">
        {/* Status Icon Header */}
        {isPending && (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-md mb-2">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
        )}
        {isRejected && (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-md mb-2">
            <AlertOctagon className="h-8 w-8 animate-bounce" />
          </div>
        )}
        {isVerified && (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success border border-success/20 shadow-md mb-2">
            <CheckCircle2 className="h-8 w-8 text-glow-success" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Verification Queue
          </span>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            {isPending && 'Application Under Review'}
            {isRejected && 'Application Rejected'}
            {isVerified && 'Account Active & Verified!'}
          </h1>
          <p className="text-xs text-muted-foreground mt-2 max-w-[320px] leading-relaxed">
            {isPending &&
              'Thank you for registering as a Knive Partner. Our safety team in Calicut is currently checking your submitted business licenses and documents. This usually takes under 2 hours.'}
            {isRejected &&
              'Your application could not be verified by our review team. Please review the details below, correct the issues, and re-submit your profile.'}
            {isVerified &&
              'Your account has been fully authorized. You can now configure your services, pricing structures, and toggle your availability online.'}
          </p>
        </div>

        {/* Action Panel details */}
        {isRejected && worker.rejection_reason && (
          <div className="w-full p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-left text-xs space-y-1 my-2">
            <span className="font-bold text-destructive">Reason for Rejection:</span>
            <p className="text-muted-foreground leading-relaxed font-semibold italic">
              &ldquo;{worker.rejection_reason}&rdquo;
            </p>
          </div>
        )}

        {isPending && (
          <div className="w-full p-4 rounded-xl bg-secondary border border-border text-left text-[11px] text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-safety-amber" />
              <span>Reviewing license ID uploads</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-safety-amber" />
              <span>Verifying mobile mechanic category credentials</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
          <Button
            onClick={() => refreshWorker()}
            variant="outline"
            className="flex-1 h-11 rounded-xl text-xs font-bold border border-border bg-secondary text-primary dark:text-foreground hover:bg-muted active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Check Status</span>
          </Button>

          {isRejected && (
            <Button
              onClick={handleEditSubmission}
              className="flex-grow h-11 rounded-xl font-bold bg-destructive hover:bg-destructive/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Edit & Resubmit</span>
            </Button>
          )}

          {isVerified && (
            <Button
              onClick={() => router.push('/worker/dashboard')}
              className="flex-grow h-11 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Go to Dashboard</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
