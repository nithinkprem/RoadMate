-- Migration: Create marketplace tables (workers, worker_services, bookings, notifications) and configure RLS

-- 1. Create Workers Table
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    base_latitude NUMERIC(10, 7) NOT NULL,
    base_longitude NUMERIC(10, 7) NOT NULL,
    vehicle_type TEXT,
    vehicle_plate TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    is_online BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on workers
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- 2. Create Worker Services Table
CREATE TABLE IF NOT EXISTS public.worker_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('tyre', 'battery', 'mechanic', 'fuel', 'towing', 'car_wash')),
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(worker_id, category)
);

-- Enable RLS on worker_services
ALTER TABLE public.worker_services ENABLE ROW LEVEL SECURITY;

-- 3. Create Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'searching', 'assigned', 'on_the_way', 'arrived', 'completed', 'cancelled')),
    issue_type TEXT NOT NULL CHECK (issue_type IN ('tyre', 'battery', 'mechanic', 'fuel', 'towing', 'car_wash')),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    photo_url TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('job_request', 'job_accepted', 'job_completed', 'verification_status', 'general')),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Workers Policies
CREATE POLICY "Allow public read access to workers"
    ON public.workers FOR SELECT
    USING (true);

CREATE POLICY "Allow workers to insert their own profile"
    ON public.workers FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow workers to update their own profile"
    ON public.workers FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Worker Services Policies
CREATE POLICY "Allow public read access to worker_services"
    ON public.worker_services FOR SELECT
    USING (true);

CREATE POLICY "Allow workers to insert their own services"
    ON public.worker_services FOR INSERT
    WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Allow workers to update their own services"
    ON public.worker_services FOR UPDATE
    USING (auth.uid() = worker_id)
    WITH CHECK (auth.uid() = worker_id);

-- Bookings Policies
CREATE POLICY "Allow customers to read their own bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Allow workers to read assigned bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() = worker_id);

CREATE POLICY "Allow admins to read all bookings"
    ON public.bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Allow customers to create bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Allow customers or workers or admins to update bookings"
    ON public.bookings FOR UPDATE
    USING (
        auth.uid() = customer_id OR 
        auth.uid() = worker_id OR 
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Notifications Policies
CREATE POLICY "Allow users to read their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow system functions to insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true); -- system-role / service-role overrides RLS, but client simulation can write notifications
