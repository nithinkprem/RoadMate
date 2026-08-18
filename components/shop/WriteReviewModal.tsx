'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Loader2, Send } from 'lucide-react';
import { Review } from '@/types';

// Let's create a simple textarea if we don't have shadcn textarea.
// Wait, we don't have shadcn textarea. Let's make sure we install it or write it inline.
// It is very easy to write inline using standard Tailwind styles.

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  onReviewSubmitted: (newReview: Review) => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  shopId,
  onReviewSubmitted,
}) => {
  const { user, openLoginModal } = useAuth();

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetStates = () => {
    setRating(0);
    setHoverRating(0);
    setText('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetStates();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Gate with Auth Modal
    if (!user) {
      openLoginModal();
      return;
    }

    if (rating === 0) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      let newReviewObj: Review;
      let dbSuccess = false;

      // 2. Attempt DB Insert in Supabase
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error: insertError } = await supabase
          .from('reviews')
          .insert({
            shop_id: shopId,
            user_id: user.id,
            rating: rating,
            text: text.trim() || null,
          })
          .select()
          .single();

        if (!insertError && data) {
          newReviewObj = {
            ...(data as Review),
            user: {
              name: user.name || 'Anonymous User',
            },
          };
          dbSuccess = true;
          onReviewSubmitted(newReviewObj);
        } else {
          console.error('Error inserting review: ', insertError?.message);
        }
      }

      // 3. Fallback Mock Flow
      if (!dbSuccess) {
        newReviewObj = {
          id: `mock-review-${Date.now()}`,
          shop_id: shopId,
          user_id: user.id,
          rating: rating,
          text: text.trim() || undefined,
          flagged: false,
          created_at: new Date().toISOString(),
          user: {
            name: user.name || 'Anonymous User',
          },
        };
        onReviewSubmitted(newReviewObj);
      }

      handleClose();
    } catch (err: any) {
      console.error('Unexpected error writing review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl border-border bg-card shadow-2xl glassmorphism p-6">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-2xl font-bold tracking-tight text-primary dark:text-foreground">
            Share Your Experience
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground max-w-[280px]">
            Help other stranded motorists in Kozhikode find the best mechanics by writing an honest
            review.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive text-center font-medium my-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Star selector */}
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tap to Rate
            </span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform active:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`h-7 w-7 transition-all ${
                        active
                          ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                          : 'text-muted-foreground/35 hover:text-muted-foreground/60'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <span className="text-xs font-bold text-safety-amber">
                {rating === 5
                  ? 'Excellent! 5/5'
                  : rating === 4
                    ? 'Good 4/5'
                    : rating === 3
                      ? 'Average 3/5'
                      : rating === 2
                        ? 'Poor 2/5'
                        : 'Terrible 1/5'}
              </span>
            )}
          </div>

          {/* Text Area */}
          <div className="space-y-2">
            <label
              htmlFor="review-text"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              Comments (Optional)
            </label>
            <textarea
              id="review-text"
              placeholder="Tell us about their service, response time, and pricing..."
              className="w-full min-h-[100px] rounded-xl border border-border bg-background p-3 text-xs font-medium focus:outline-none focus:border-safety-amber focus:ring-1 focus:ring-safety-amber transition-all"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl font-bold button-warning-gradient hover:opacity-90 active:scale-95 transition-all text-navy-dark"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                <span>Submit Review</span>
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
