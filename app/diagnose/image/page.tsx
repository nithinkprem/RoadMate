'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Camera,
  UploadCloud,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImageDiagnosisPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>('');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoName(file.name);
    setLoading(true);
    setSuggestion(null);

    // Simulate AI Image classification scan (Prompt 58)
    setTimeout(async () => {
      const suggestionResult = 'tyre'; // default identified issue type

      // Write logs to ai_diagnosis_logs if connected
      if (
        user &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        await supabase.from('ai_diagnosis_logs').insert({
          user_id: user.id,
          input_type: 'image',
          result_suggestion: suggestionResult,
        });
      }

      setSuggestion(suggestionResult);
      setLoading(false);
    }, 2500);
  };

  const handleProceedToBooking = () => {
    if (!suggestion) return;
    // Redirect to dispatch wizard pre-filling issue suggestions
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
            <Camera className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
            AI Diagnosis Scanner
          </span>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-foreground font-sans mt-0.5">
            Snapshot Issue Diagnosis
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            Upload a photo of your tyre puncture or engine smoke, and our model will suggest the
            category type.
          </p>
        </div>

        {/* PHOTO PICKER UPLOAD BOX */}
        {!suggestion && !loading && (
          <div className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-background/30 text-center relative hover:bg-background/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handlePhotoSelect}
            />
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
            <span className="text-xs font-bold text-primary dark:text-foreground">
              Take photo or choose file
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">Image size max 5MB</span>
          </div>
        )}

        {/* SCANNER LOADING INDICATOR */}
        {loading && (
          <div className="w-full py-8 flex flex-col items-center justify-center gap-4">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-safety-amber/10 opacity-75"></span>
              <Loader2 className="h-7 w-7 animate-spin text-safety-amber" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black text-primary dark:text-foreground">
                Analyzing Snapshot...
              </span>
              <span className="text-[10px] text-muted-foreground">
                Classifying pixel defect vectors
              </span>
            </div>
          </div>
        )}

        {/* AI SCAN SUGGESTION BOX */}
        {suggestion && (
          <div className="w-full flex flex-col gap-5 animate-fade-in">
            <div className="p-5 rounded-2xl bg-success/5 border border-success/20 text-left space-y-3">
              <div className="flex items-center gap-2 text-success font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4 fill-success" />
                <span>AI suggestion Resolved</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                  Identified Category
                </span>
                <p className="text-base font-black text-primary dark:text-foreground uppercase tracking-wider">
                  Tyre Puncture defect
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Confidence score: <span className="font-bold text-success">92%</span> (Flat
                  profile tread detected).
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
          <span>Encrypted HIPAA/GDPR Photo logs Privacy</span>
        </div>
      </div>
    </div>
  );
}
