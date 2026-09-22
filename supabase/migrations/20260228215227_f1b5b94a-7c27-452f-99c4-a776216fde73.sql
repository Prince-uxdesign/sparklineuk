-- Drop the overly permissive public SELECT policy on profiles
-- This was exposing stripe_customer_id, phone, email, billing info to the public
DROP POLICY IF EXISTS "Public can view profiles by slug" ON profiles;