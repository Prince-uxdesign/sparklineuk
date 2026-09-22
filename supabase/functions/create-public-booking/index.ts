import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      business_slug,
      service,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      first_name,
      last_name,
      email,
      phone,
      address,
      notes,
      amount,
    } = await req.json();

    // Validate required fields
    if (!business_slug || !service || !scheduled_date || !scheduled_time || !first_name || !last_name || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate field lengths
    if (first_name.trim().length < 1 || first_name.length > 50) {
      return new Response(
        JSON.stringify({ error: "Invalid first name." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (last_name.trim().length < 1 || last_name.length > 50) {
      return new Response(
        JSON.stringify({ error: "Invalid last name." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (service.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid service." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (business_slug.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid business." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Email too long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone if provided
    if (phone && !phone.match(/^[\d\s+().-]{7,20}$/)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate date format (YYYY-MM-DD) and reject past dates
    if (!scheduled_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Response(
        JSON.stringify({ error: "Invalid date format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (scheduled_date < todayStr) {
      return new Response(
        JSON.stringify({ error: "Booking date must be in the future." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate time format HH:MM[:SS] 24h
    if (!String(scheduled_time).match(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/)) {
      return new Response(
        JSON.stringify({ error: "Invalid time format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate duration 30-480 mins
    const duration = Number(duration_minutes) || 120;
    if (!Number.isInteger(duration) || duration < 30 || duration > 480) {
      return new Response(
        JSON.stringify({ error: "Invalid duration." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate address length
    if (address && address.length > 500) {
      return new Response(
        JSON.stringify({ error: "Address too long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate notes length
    if (notes && notes.length > 500) {
      return new Response(
        JSON.stringify({ error: "Notes too long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side pricing: ignore client amount to prevent £0 manipulation.
    // Keep in sync with frontend PublicBooking SERVICES.
    const SERVICE_PRICES: Record<string, number> = {
      "Regular Clean": 120,
      "Deep Clean": 250,
      "Move-In / Move-Out": 350,
      "Move-In Clean": 350,
      "Move-Out Clean": 350,
      "Office Clean": 300,
      "Post-Construction": 500,
      "Post-Construction Clean": 500,
    };
    const serverAmount = SERVICE_PRICES[service] ?? 0;
    if (!serverAmount) {
      return new Response(
        JSON.stringify({ error: "Invalid service." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up business owner via the restricted public view
    const { data: profile, error: profileErr } = await supabase
      .from("public_business_profiles")
      .select("id, business_name")
      .eq("business_slug", business_slug)
      .single();

    if (profileErr || !profile) {
      return new Response(
        JSON.stringify({ error: "Business not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 5 bookings per email per hour
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("client_email", email.trim())
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());

    if (count !== null && count >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many booking requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientName = `${first_name.trim()} ${last_name.trim()}`;

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        user_id: profile.id,
        client_name: clientName,
        client_email: email.trim(),
        client_phone: phone?.trim() || null,
        service,
        scheduled_date,
        scheduled_time,
        duration_minutes: duration,
        amount: serverAmount,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        status: "pending",
        payment_status: "unpaid",
      })
      .select("id")
      .single();

    if (bookingErr) {
      return new Response(
        JSON.stringify({ error: "Failed to create booking." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, booking_id: booking.id, business_name: profile.business_name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
