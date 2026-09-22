
-- Allow anonymous (public) INSERT on bookings so unauthenticated clients can submit bookings via the public booking page
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;

CREATE POLICY "Public can insert bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);
