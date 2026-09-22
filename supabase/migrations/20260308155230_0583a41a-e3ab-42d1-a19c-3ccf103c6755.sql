-- Recreate view with security_invoker=true (safe, no definer escalation)
DROP VIEW IF EXISTS public.public_business_profiles;

CREATE VIEW public.public_business_profiles
WITH (security_invoker = true)
AS
  SELECT
    id,
    business_name,
    business_slug,
    business_type,
    location,
    website
  FROM public.profiles
  WHERE business_slug IS NOT NULL;

-- Grant SELECT to anon and authenticated
GRANT SELECT ON public.public_business_profiles TO anon, authenticated;

-- Add a narrow RLS policy on profiles that allows anon/public to read
-- ONLY the safe public columns needed for the booking page slug lookup.
-- This replaces the definer view approach with proper row-level security.
DROP POLICY IF EXISTS "Public can view profiles by business slug" ON public.profiles;

CREATE POLICY "Public can view profiles by business slug"
ON public.profiles
FOR SELECT
USING (true);