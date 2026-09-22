-- Grant SELECT on public_business_profiles view to anon and authenticated roles
-- This is intentionally public — it only exposes safe, non-sensitive fields
GRANT SELECT ON public.public_business_profiles TO anon, authenticated;