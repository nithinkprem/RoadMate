'use client';

import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Trash2,
  Check,
  AlertTriangle,
  Clock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Review } from '@/types';

// Mock flagged reviews to populate if the database query fails
const MOCK_REVIEWS: Review[] = [
  {
    id: 'mrev-1',
    shop_id: 'mock-shop-1',
    user_id: 'u-10',
    rating: 1,
    text: 'This shop charged me double for a tyre puncture fix. Totally abusive and fake prices.',
    flagged: true,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    user: { name: 'Kiran Das' },
  },
  {
    id: 'mrev-2',
    shop_id: 'mock-shop-2',
    user_id: 'u-11',
    rating: 5,
    text: 'Great service, highly professional and friendly staff.',
    flagged: false,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    user: { name: 'Sujith' },
  },
  {
    id: 'mrev-3',
    shop_id: 'mock-shop-3',
    user_id: 'u-12',
    rating: 2,
    text: 'Bad behavior. He refused to travel to fix my chain and cut the phone call.',
    flagged: true,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    user: { name: 'Sandra' },
  },
];

export default function AdminReviewsModerationPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        let dbSuccess = false;

        // 1. Query Supabase
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data, error } = await supabase
            .from('reviews')
            .select('*, user:users(name)')
            .order('flagged', { ascending: false })
            .order('created_at', { ascending: false });

          if (!error && data) {
            setReviews(data as Review[]);
            dbSuccess = true;
          }
        }

        // 2. Fallback to Mock Reviews
        if (!dbSuccess) {
          setReviews(MOCK_REVIEWS);
        }
      } catch (err) {
        console.error('Error fetching reviews: ', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // 1. Action: Approve (dismiss flags)
  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { error } = await supabase
          .from('reviews')
          .update({ flagged: false })
          .eq('id', reviewId);

        if (!error) dbSuccess = true;
      }

      // Update state locally (for both live and mock fallback)
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, flagged: false } : r)));
    } catch (err) {
      console.error('Error approving review:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Action: Delete review
  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review permanently?')) return;

    setActionLoading(reviewId);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

        if (!error) dbSuccess = true;
      }

      // Update state locally (for both live and mock fallback)
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('Error deleting review:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Loading reviews queue...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
          Content Moderation
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          Review Moderation Queue
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Approve or delete user reviews. Flagged reviews are highlighted at the top of the queue.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center p-6 border border-dashed border-border rounded-2xl bg-card/30">
          <CheckCircle2 className="h-10 w-10 text-success mb-3 animate-bounce" />
          <span className="text-sm font-bold text-primary dark:text-foreground mb-1">
            Queue is Clear!
          </span>
          <p className="text-xs text-muted-foreground max-w-xs">
            No motorist reviews are waiting for approval or moderation right now.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((rev) => {
            const isProcessing = actionLoading === rev.id;
            return (
              <div
                key={rev.id}
                className={`p-5 rounded-2xl border bg-card/60 shadow-sm flex flex-col sm:flex-row justify-between gap-4 transition-all ${
                  rev.flagged ? 'border-destructive/30 bg-destructive/5' : 'border-border'
                }`}
              >
                <div className="flex flex-col gap-2 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-primary dark:text-foreground">
                      {rev.user?.name || 'Anonymous User'}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                    {rev.flagged && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/20 animate-pulse">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        <span>Flagged</span>
                      </span>
                    )}
                  </div>

                  {rev.text ? (
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      &ldquo;{rev.text}&rdquo;
                    </p>
                  ) : (
                    <span className="text-xs text-muted-foreground/50 italic">
                      No text comment provided.
                    </span>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(rev.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(rev.created_at).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Moderate Actions */}
                <div className="flex sm:flex-col justify-end gap-2 self-center sm:self-stretch">
                  {rev.flagged && (
                    <Button
                      onClick={() => handleApprove(rev.id)}
                      disabled={isProcessing}
                      size="sm"
                      className="bg-success text-white hover:opacity-90 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1 h-9 rounded-xl border border-success"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Approve</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(rev.id)}
                    disabled={isProcessing}
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1 h-9 rounded-xl"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple Helper Component for Star Icon (reuse)
const Star = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
