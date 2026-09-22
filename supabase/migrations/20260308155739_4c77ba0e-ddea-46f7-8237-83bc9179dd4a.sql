-- Enable realtime for bookings table so the dashboard gets instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;