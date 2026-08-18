-- Create custom enums if they do not exist
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'worker');
CREATE TYPE shop_category AS ENUM ('tyre', 'battery', 'mechanic', 'fuel', 'towing', 'car_wash', 'air_filling');
CREATE TYPE shop_source AS ENUM ('google_maps', 'manual', 'worker_registered');

-- 1. Create public.users profile table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT,
    email TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create public.shops table
CREATE TABLE public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_name TEXT,
    phone TEXT NOT NULL,
    category shop_category NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    address TEXT NOT NULL,
    hours_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    price_range TEXT,
    supports_upi BOOLEAN NOT NULL DEFAULT TRUE,
    mobile_mechanic BOOLEAN NOT NULL DEFAULT FALSE,
    night_service BOOLEAN NOT NULL DEFAULT FALSE,
    languages TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    source shop_source NOT NULL DEFAULT 'manual',
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create public.shop_photos table
CREATE TABLE public.shop_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

-- 4. Create public.reviews table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create public.search_logs table
CREATE TABLE public.search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    issue_type shop_category NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    result_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance optimizations
CREATE INDEX idx_shops_category ON public.shops(category);
CREATE INDEX idx_shops_verified ON public.shops(verified);
CREATE INDEX idx_shops_geo ON public.shops(latitude, longitude);
CREATE INDEX idx_reviews_shop_id ON public.reviews(shop_id);
CREATE INDEX idx_shop_photos_shop_id ON public.shop_photos(shop_id);
CREATE INDEX idx_search_logs_created_at ON public.search_logs(created_at);

-- Trigger function to auto-create user record in public.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, phone, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'User'),
        new.phone,
        new.email,
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'customer'::user_role)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to hook into auth.users signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger function to update updated_at timestamp on shops
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_shop_updated_at
    BEFORE UPDATE ON public.shops
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
