-- Grant SELECT on public_business_profiles view to anon and authenticated roles
-- This allows the public booking page to look up businesses by slug without auth
GRANT SELECT ON public.public_business_profiles TO anon, authenticated;