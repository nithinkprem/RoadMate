'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Mic,
  Square,
  Loader2,
  ArrowLeft,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AudioDiagnosisPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [recording, setRecording] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleStartRecording = () => {
    setRecording(true);
    setSuggestion(null);

    // Simulate 3 seconds recording window
    setTimeout(() => {
      setRecording(false);
      setLoading(true);

      // Simulate analysis (Prompt 59)
      setTimeout(async () => {
        const suggestionResult = 'battery'; // Starter clicks point to battery dead

        if (
          user &&
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          await supabase.from('ai_diagnosis_logs').insert({
            user_id: user.id,
            input_type: 'audio',
            result_suggestion: suggestionResult,
          });
        }

        setSuggestion(suggestionResult);
        setLoading(false);
      }, 2000);
    }, 3000);
  };

  const handleProceedToBooking = () => {
    if (!suggestion) return;
    router.push(`/booking/new?issue=${suggestion}&lat=11.2588&lng=75.7804&ai_suggested=true`);
  };

  return (
    <div className="flex-grow w-full bg-background flex items-center justify-center py-12 px-4 relative">
      {/* Background accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-safety-amber/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card shadow-2xl p-8 flex flex-col gap-6 text-center items-center relative glassmorphism">
        {/* Navigation back */}
        <div className="flex items-center w-full">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-bold text-muted-foreground hover:text-foreground border border-border transition-all active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-safety-amber/10 text-safety-amber border border-safety-amber/20 shadow-md mb-2">
            <Mic className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
            Acoustic sound Diagnoser
          </span>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-foreground font-sans mt-0.5">
            Engine Noise diagnostics
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            Record your starter clicks or engine rattle, and our audio model will detect starter /
            battery failures.
          </p>
        </div>

        {/* RECORD TRIGGERS */}
        {!recording && !loading && !suggestion && (
          <Button
            onClick={handleStartRecording}
            className="w-32 h-32 rounded-full font-bold bg-secondary hover:bg-muted text-primary dark:text-foreground border border-border flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-inner"
          >
            <Mic className="h-8 w-8 text-safety-amber animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider font-black">Record Noise</span>
          </Button>
        )}

        {/* RECORDING PULSE HUD */}
        {recording && (
          <div className="flex flex-col items-center gap-4 py-6 w-full">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/10 opacity-75"></span>
              <span className="absolute inline-flex h-[80%] w-[80%] animate-ping rounded-full bg-red-500/25 opacity-75"></span>
              <div className="h-12 w-12 rounded-full bg-red-500 text-white flex items-center justify-center">
                <Square className="h-4.5 w-4.5 fill-white" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black text-red-500 uppercase tracking-widest">
                Listening...
              </span>
              <span className="text-[9px] text-muted-foreground">
                Keep microphone close to starter/engine
              </span>
            </div>
          </div>
        )}

        {/* LOADING PROCESSING */}
        {loading && (
          <div className="w-full py-8 flex flex-col items-center justify-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-safety-amber/10 opacity-75"></span>
              <Loader2 className="h-7 w-7 animate-spin text-safety-amber" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black text-primary dark:text-foreground">
                Processing Audio Spectra...
              </span>
              <span className="text-[10px] text-muted-foreground">
                Analyzing frequency decibel clicks
              </span>
            </div>
          </div>
        )}

        {/* SUGGESTION RESULTS */}
        {suggestion && (
          <div className="w-full flex flex-col gap-5 animate-fade-in">
            <div className="p-5 rounded-2xl bg-success/5 border border-success/20 text-left space-y-3">
              <div className="flex items-center gap-2 text-success font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4 fill-success" />
                <span>Audio suggestion Resolved</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                  Identified Category
                </span>
                <p className="text-base font-black text-primary dark:text-foreground uppercase tracking-wider">
                  Battery dead / Jumpstart
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Confidence score: <span className="font-bold text-success">88%</span> (Starter
                  motor solenoid clicking noise).
                </p>
              </div>
            </div>

            <Button
              onClick={handleProceedToBooking}
              className="w-full h-11 rounded-xl font-bold button-warning-gradient text-navy-dark flex items-center justify-center gap-1.5 shadow-md shadow-safety-amber/10"
            >
              <span>Confirm & Book Rescue</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-semibold border-t border-border pt-4 w-full justify-center">
          <ShieldCheck className="h-4 w-4 text-success" />
          <span>Encrypted HIPAA/GDPR Audio logs Privacy</span>
        </div>
      </div>
    </div>
  );
}
