-- Fix P0: remove overly-open public RLS policies
-- 1) profiles: anon could SELECT * (emails, phones, addresses, stripe ids)
--    Keep only the safe limited view public_business_profiles.
-- 2) bookings: anon could INSERT arbitrary user_id/amount/status.
--    Public bookings must go via create-public-booking edge function (service_role).

DROP POLICY IF EXISTS "Public can view profiles by business slug" ON public.profiles;
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;

-- Recreate safe public projection as definer view (limited columns only)
DROP VIEW IF EXISTS public.public_business_profiles;

CREATE VIEW public.public_business_profiles
WITH (security_invoker = false)
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

GRANT SELECT ON public.public_business_profiles TO anon, authenticated;
