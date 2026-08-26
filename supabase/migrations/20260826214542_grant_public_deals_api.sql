-- DealTiki public_deals Data API privileges.
-- Required because new Supabase projects no longer automatically
-- expose newly-created public tables to API roles.

GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.public_deals
TO service_role;

GRANT SELECT
ON TABLE public.public_deals
TO anon, authenticated;

-- Covers identity/serial columns if public_deals uses one.
GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO service_role;

NOTIFY pgrst, 'reload schema';
