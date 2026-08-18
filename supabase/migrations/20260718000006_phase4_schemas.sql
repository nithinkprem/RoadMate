-- Migration: Create Phase 4 schemas (memberships, ai_diagnosis_logs, trusted_contacts, emergency_requests, fleet_vehicles, fleet_maintenance_logs, city_configurations), extend workers table, and configure RLS

-- 1. Extend Workers Table to support enhanced verification tier (Prompt 66)
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS is_enhanced_verified BOOLEAN NOT NULL DEFAULT false;

-- 2. Create Memberships Table (Prompt 54)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    usage_counter INT NOT NULL DEFAULT 5,
    renewal_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- 3. Create AI Diagnosis Logs Table (Prompt 57)
CREATE TABLE IF NOT EXISTS public.ai_diagnosis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    input_type TEXT NOT NULL CHECK (input_type IN ('image', 'audio')),
    result_suggestion TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_diagnosis_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Trusted Contacts Table (Prompt 64)
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;

-- 5. Create Emergency Requests Table (Prompt 61)
CREATE TABLE IF NOT EXISTS public.emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

-- 6. Create Fleet Vehicles Table (Prompt 67)
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plate TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT,
    insurance_expiry DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;

-- 7. Create Fleet Maintenance Logs Table (Prompt 67)
CREATE TABLE IF NOT EXISTS public.fleet_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost NUMERIC(10, 2) NOT NULL,
    maintenance_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fleet_maintenance_logs ENABLE ROW LEVEL SECURITY;

-- 8. Create City Configurations Table (Prompt 71)
CREATE TABLE IF NOT EXISTS public.city_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name TEXT NOT NULL UNIQUE,
    service_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    launch_categories TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.city_configurations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Memberships policies
CREATE POLICY "Allow users to read their own memberships"
    ON public.memberships FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow admins to read all memberships"
    ON public.memberships FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

CREATE POLICY "Allow system checkout to write memberships"
    ON public.memberships FOR ALL USING (true) WITH CHECK (true);

-- AI Diagnosis Logs policies
CREATE POLICY "Allow users to read and insert their own diagnosis logs"
    ON public.ai_diagnosis_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create their own diagnosis logs"
    ON public.ai_diagnosis_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to read all diagnosis logs"
    ON public.ai_diagnosis_logs FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Trusted Contacts policies
CREATE POLICY "Allow users to manage their own trusted contacts"
    ON public.trusted_contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Emergency Requests policies
CREATE POLICY "Allow users to manage their own emergency requests"
    ON public.emergency_requests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to read all emergency requests"
    ON public.emergency_requests FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Fleet Vehicles policies
CREATE POLICY "Allow fleet admins to manage their own vehicles"
    ON public.fleet_vehicles FOR ALL USING (auth.uid() = fleet_admin_id) WITH CHECK (auth.uid() = fleet_admin_id);

-- Fleet Maintenance Logs policies
CREATE POLICY "Allow fleet admins to manage vehicle maintenance logs"
    ON public.fleet_maintenance_logs FOR ALL USING (
        EXISTS (SELECT 1 FROM public.fleet_vehicles WHERE fleet_vehicles.id = vehicle_id AND fleet_vehicles.fleet_admin_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.fleet_vehicles WHERE fleet_vehicles.id = vehicle_id AND fleet_vehicles.fleet_admin_id = auth.uid())
    );

-- City Configurations policies
CREATE POLICY "Allow public read of city configurations"
    ON public.city_configurations FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage city configurations"
    ON public.city_configurations FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
    );
