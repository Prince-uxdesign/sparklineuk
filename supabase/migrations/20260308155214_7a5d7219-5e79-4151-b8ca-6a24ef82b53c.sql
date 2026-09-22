-- Drop and recreate the view with security_invoker=false so it runs as the view owner
-- bypassing the profiles RLS for this limited, safe public projection
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

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.public_business_profiles TO anon, authenticated;