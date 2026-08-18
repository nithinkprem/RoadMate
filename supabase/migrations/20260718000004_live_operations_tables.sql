-- Migration: Create live operations tables (tracking_events, payments, payout_ledgers), extend bookings/reviews/workers tables, and configure RLS

-- 1. Extend Bookings Table with arrived_at and completed_at timestamps
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. Extend Workers Table with rating metrics
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS aggregate_rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS reviews_count INT NOT NULL DEFAULT 0;

-- 3. Extend Reviews Table to support worker reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
ALTER COLUMN shop_id DROP NOT NULL;

-- 4. Create Tracking Events Table
CREATE TABLE IF NOT EXISTS public.tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on tracking_events
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- 5. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    method TEXT NOT NULL CHECK (method IN ('online', 'cash')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 6. Create Payout Ledgers Table
CREATE TABLE IF NOT EXISTS public.payout_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL,
    platform_commission NUMERIC(10, 2) NOT NULL,
    worker_payout NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payout_ledgers
ALTER TABLE public.payout_ledgers ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Tracking Events Policies
CREATE POLICY "Allow customers to read active tracking_events"
    ON public.tracking_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = tracking_events.booking_id AND bookings.customer_id = auth.uid()
        )
    );

CREATE POLICY "Allow workers to read and insert active tracking_events"
    ON public.tracking_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = tracking_events.booking_id AND bookings.worker_id = auth.uid()
        )
    );

CREATE POLICY "Allow workers to insert active tracking_pings"
    ON public.tracking_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = booking_id AND bookings.worker_id = auth.uid()
        )
    );

-- Payments Policies
CREATE POLICY "Allow customers to read their own payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = payments.booking_id AND bookings.customer_id = auth.uid()
        )
    );

CREATE POLICY "Allow workers to read assigned job payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = payments.booking_id AND bookings.worker_id = auth.uid()
        )
    );

CREATE POLICY "Allow admins to read all payments logs"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Allow system checkout functions to insert and update payments"
    ON public.payments FOR ALL
    USING (true)
    WITH CHECK (true); -- service-role overrides this, client simulation can write payments logs

-- Payout Ledgers Policies
CREATE POLICY "Allow workers to read their own payout ledgers"
    ON public.payout_ledgers FOR SELECT
    USING (auth.uid() = worker_id);

CREATE POLICY "Allow admins to read all payout ledgers"
    ON public.payout_ledgers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Allow system checkout functions to write payouts"
    ON public.payout_ledgers FOR ALL
    USING (true)
    WITH CHECK (true);
