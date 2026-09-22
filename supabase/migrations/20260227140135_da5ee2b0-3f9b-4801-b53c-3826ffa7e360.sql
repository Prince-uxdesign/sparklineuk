
-- Fix the SECURITY DEFINER view issue by recreating as SECURITY INVOKER
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

GRANT SELECT ON public.public_business_profiles TO anon, authenticated;
