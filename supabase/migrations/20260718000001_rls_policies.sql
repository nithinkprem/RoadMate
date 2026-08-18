-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- 1. Policies for public.users
CREATE POLICY "Users can read their own profile row"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile row"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- 2. Policies for public.shops
CREATE POLICY "Public read access on shops"
    ON public.shops FOR SELECT
    USING (TRUE);

-- (No direct client writes allowed, insert/update/delete are blocked for anon/auth clients, only service_role bypasses RLS)

-- 3. Policies for public.shop_photos
CREATE POLICY "Public read access on shop photos"
    ON public.shop_photos FOR SELECT
    USING (TRUE);

-- (No direct client writes allowed, only service_role bypasses RLS)

-- 4. Policies for public.reviews
CREATE POLICY "Public read access on reviews"
    ON public.reviews FOR SELECT
    USING (TRUE);

CREATE POLICY "Authenticated users can insert reviews"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON public.reviews FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
    ON public.reviews FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 5. Policies for public.search_logs
CREATE POLICY "Public insert-only access on search logs"
    ON public.search_logs FOR INSERT
    USING (TRUE);

-- (No client reads or updates allowed for search logs, keeping search analytics private to service_role)


-- Trigger function to automatically sync public.users.role to auth.users.raw_app_meta_data
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role::text)
    WHERE id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync roles on user profile creation or updates
CREATE OR REPLACE TRIGGER on_public_user_role_sync
    AFTER INSERT OR UPDATE OF role ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_auth();
