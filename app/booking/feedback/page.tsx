'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Star, Send, Loader2, Heart, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function FeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const bookingId = searchParams.get('id');

  const [booking, setBooking] = useState<any>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('Invalid Booking Reference.');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        let dbSuccess = false;

        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

          if (!error && data) {
            setBooking(data);
            dbSuccess = true;
          }
        }

        if (!dbSuccess) {
          setBooking({
            id: bookingId,
            worker_id: 'mworker-1',
            issue_type: 'tyre',
          });
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setSubmitLoading(true);
    setError(null);

    const reviewerId = user?.id || '00000000-0000-0000-0000-000000000000'; // fallback guest reviewer

    try {
      let dbSuccess = false;

      // 1. Insert review into db
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co') &&
        booking.worker_id
      ) {
        const { error: reviewError } = await supabase.from('reviews').insert({
          user_id: reviewerId,
          worker_id: booking.worker_id,
          rating,
          text: comment.trim() || null,
        });

        if (!reviewError) {
          dbSuccess = true;

          // 2. Fetch all reviews for this worker to recalculate aggregates
          const { data: allReviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('worker_id', booking.worker_id);

          if (allReviews && allReviews.length > 0) {
            const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
            const avg = Number((sum / allReviews.length).toFixed(1));

            // Update workers stats
            await supabase
              .from('workers')
              .update({
                aggregate_rating: avg,
                reviews_count: allReviews.length,
              })
              .eq('id', booking.worker_id);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      console.error('Submit review error:', err);
      setError('Failed to log rating details.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Loading feedback card...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-20 text-center px-4">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <span className="text-lg font-bold text-primary dark:text-foreground">Feedback Locked</span>
        <p className="text-xs text-muted-foreground mt-1">
          {error || 'This transaction review link is invalid.'}
        </p>
        <Button
          onClick={() => router.push('/')}
          className="mt-4 button-warning-gradient rounded-xl text-navy-dark"
        >
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full bg-background flex items-center justify-center py-12 px-4 relative">
      {/* Background accents */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-safety-amber/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] rounded-2xl border border-border bg-card shadow-2xl p-8 flex flex-col gap-6 text-center items-center relative glassmorphism">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-8 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-success/15 border border-success/35 text-success flex items-center justify-center shadow-lg shadow-success/10 animate-pulse">
              <Heart className="h-8 w-8 text-glow-success fill-success" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-primary dark:text-foreground">
                Thank You for Your Feedback!
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Your support helps improve Kozhikode road safety.
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="w-full flex flex-col gap-5 items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-safety-amber/10 text-safety-amber border border-safety-amber/20 shadow-md mb-1">
              <Star className="h-6 w-6 fill-safety-amber" />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
                Partner Evaluation
              </span>
              <h1 className="text-2xl font-black tracking-tight text-primary dark:text-foreground font-sans mt-0.5">
                Rate Responding Driver
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-[285px] leading-relaxed">
                Please rate your assistance experience. Ratings help reward top-performing local
                mechanics.
              </p>
            </div>

            {/* Stars Selector Row */}
            <div className="flex items-center gap-2.5 py-4">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isSelected = starValue <= (hoverRating || rating);
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-muted-foreground hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        isSelected
                          ? 'fill-safety-amber text-safety-amber text-glow-warning'
                          : 'text-border bg-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Textarea Comments */}
            <div className="w-full text-left space-y-1.5">
              <label
                htmlFor="feed-notes"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Write a comment (optional)
              </label>
              <textarea
                id="feed-notes"
                placeholder="How was the mechanic's response time and service quality? e.g. Rasheed arrived in 10 minutes and replaced the tyre puncture very professionally."
                className="w-full min-h-[90px] rounded-xl border border-border bg-background p-3 text-xs font-medium focus:outline-none focus:border-safety-amber focus:ring-1 focus:ring-safety-amber transition-all"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={submitLoading}
              className="w-full h-11 rounded-xl font-bold button-warning-gradient hover:opacity-90 active:scale-95 transition-all text-navy-dark mt-2 flex items-center justify-center gap-1.5 shadow-md shadow-safety-amber/10"
            >
              {submitLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Submit Evaluation Feedback</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full bg-background flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
          <span className="text-sm font-semibold">Initializing review card...</span>
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
