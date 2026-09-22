-- Remove overly permissive anon INSERT policy on bookings.
-- Public bookings are inserted via the create-public-booking Edge Function using service_role,
-- so this policy is unnecessary and is a security risk (allows arbitrary user_id injection).
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;