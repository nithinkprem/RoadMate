'use client';

import React, { Suspense } from 'react';
import { ResultsContent } from '@/components/results/ResultsContent';
import { Loader2 } from 'lucide-react';

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full bg-background flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
          <span className="text-sm font-semibold">Initializing Kozhikode results map...</span>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
