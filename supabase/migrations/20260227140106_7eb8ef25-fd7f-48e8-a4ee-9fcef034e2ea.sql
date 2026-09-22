
-- 1. Drop the overly permissive "Anyone can read profiles by slug" policy
DROP POLICY IF EXISTS "Anyone can read profiles by slug" ON public.profiles;

-- 2. Create a restricted view for public booking page (only non-sensitive fields)
CREATE OR REPLACE VIEW public.public_business_profiles AS
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

-- 3. Drop the overly permissive anonymous insert policy on bookings
DROP POLICY IF EXISTS "Anonymous can insert public bookings" ON public.bookings;

-- 4. Fix the authenticated insert policy from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users can insert own bookings" ON public.bookings;
CREATE POLICY "Authenticated users can insert own bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Add DB-level validation constraints for bookings
ALTER TABLE public.bookings 
  ADD CONSTRAINT check_booking_amount_non_negative CHECK (amount >= 0),
  ADD CONSTRAINT check_booking_client_name_length CHECK (length(client_name) >= 1 AND length(client_name) <= 200),
  ADD CONSTRAINT check_booking_duration_positive CHECK (duration_minutes > 0);

-- 6. Add DB-level validation constraints for clients
ALTER TABLE public.clients
  ADD CONSTRAINT check_client_name_length CHECK (length(name) >= 1 AND length(name) <= 200);
