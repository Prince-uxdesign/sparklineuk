import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limit: max 10 calls per IP per minute
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const {
      business_id,
      business_name,
      client_name,
      client_email,
      client_phone,
      service,
      scheduled_date,
      scheduled_time,
      address,
      notes,
    } = await req.json();

    // Validate required fields to prevent spam with empty data
    if (!business_id || !client_email || !service || !scheduled_date || !scheduled_time) {
      return new Response(JSON.stringify({ error: "Missing required fields." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email format
    if (!String(client_email).match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || client_email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate business_id is a valid UUID to prevent probing
    if (!String(business_id).match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return new Response(JSON.stringify({ error: "Invalid business." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping emails");
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify business_id exists and fetch owner contact details
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("business_email, business_name, phone, full_name")
      .eq("id", business_id)
      .maybeSingle();

    // If business doesn't exist, silently succeed to avoid business enumeration
    if (!ownerProfile) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: max 3 confirmation emails per email per hour (double-check via DB)
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("client_email", String(client_email).trim())
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());

    if (count !== null && count > 3) {
      return new Response(JSON.stringify({ error: "Too many requests." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // HTML escape helper — prevents HTML injection in email content
    const esc = (str: string) =>
      String(str).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" }[c] ?? c)
      );

    const safeClientName = esc(client_name ?? "");
    const safeService = esc(service ?? "");
    const safeScheduledTime = esc(scheduled_time ?? "");
    const safeAddress = address ? esc(address) : "";
    const safeNotes = notes ? esc(notes) : "";
    const safeClientEmail = esc(client_email ?? "");
    const safeClientPhone = client_phone ? esc(client_phone) : "";

    const ownerEmail = ownerProfile?.business_email;
    const displayBusinessName = esc(business_name || ownerProfile?.business_name || "Your cleaner");

    // Format date nicely
    const dateFormatted = new Date(scheduled_date + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });

    const emails = [];

    // EMAIL 1 — To the client
    if (client_email) {
      emails.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "Sparkline <no-reply@sparkline.co.uk>",
            to: [client_email],
            subject: `Booking confirmed with ${displayBusinessName}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    <h1 style="font-size:24px;font-weight:700;color:#0a0a0a;margin:0 0 8px">${displayBusinessName}</h1>
    <p style="font-size:16px;color:#555;margin:0 0 32px">${displayBusinessName} has received your booking request.</p>

    <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:12px;padding:24px;margin-bottom:32px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#888;font-size:14px;width:100px">Service</td><td style="padding:8px 0;color:#0a0a0a;font-size:14px;font-weight:500">${safeService}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:14px">Date</td><td style="padding:8px 0;color:#0a0a0a;font-size:14px;font-weight:500">${dateFormatted}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:14px">Time</td><td style="padding:8px 0;color:#0a0a0a;font-size:14px;font-weight:500">${safeScheduledTime}</td></tr>
        ${safeAddress ? `<tr><td style="padding:8px 0;color:#888;font-size:14px">Address</td><td style="padding:8px 0;color:#0a0a0a;font-size:14px;font-weight:500">${safeAddress}</td></tr>` : ""}
      </table>
    </div>

    <p style="font-size:15px;font-weight:600;color:#0a0a0a;margin:0 0 8px">What happens next</p>
    <p style="font-size:14px;color:#555;margin:0 0 32px">Your cleaner will confirm your appointment within 24 hours. You'll receive another email once confirmed.</p>

    ${ownerEmail || ownerProfile?.phone ? `<p style="font-size:13px;color:#888;margin:0 0 32px">Need to make changes? Contact ${ownerEmail ? `<a href="mailto:${ownerEmail}" style="color:#0a0a0a">${ownerEmail}</a>` : ""}${ownerEmail && ownerProfile?.phone ? " or " : ""}${ownerProfile?.phone || ""}.</p>` : ""}

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0">
    <p style="font-size:12px;color:#bbb;text-align:center;margin:0">Powered by Sparkline</p>
  </div>
</body>
</html>`,
          }),
        })
      );
    }

    // EMAIL 2 — To the business owner
    if (ownerEmail) {
      emails.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "Sparkline <no-reply@sparkline.co.uk>",
            to: [ownerEmail],
            subject: `🆕 New booking request from ${safeClientName}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    <h1 style="font-size:24px;font-weight:700;color:#0a0a0a;margin:0 0 8px">New booking request!</h1>
    <p style="font-size:15px;color:#555;margin:0 0 24px">You have a new booking request from a client.</p>

    <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:12px;padding:24px;margin-bottom:24px">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px">Client Details</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888;font-size:14px;width:100px">Name</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px;font-weight:500">${safeClientName}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:14px">Email</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px">${safeClientEmail}</td></tr>
        ${safeClientPhone ? `<tr><td style="padding:6px 0;color:#888;font-size:14px">Phone</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px">${safeClientPhone}</td></tr>` : ""}
      </table>
    </div>

    <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:12px;padding:24px;margin-bottom:24px">
      <p style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px">Booking Details</p>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888;font-size:14px;width:100px">Service</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px;font-weight:500">${safeService}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:14px">Date</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px;font-weight:500">${dateFormatted}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:14px">Time</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px;font-weight:500">${safeScheduledTime}</td></tr>
        ${safeAddress ? `<tr><td style="padding:6px 0;color:#888;font-size:14px">Address</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px">${safeAddress}</td></tr>` : ""}
        ${safeNotes ? `<tr><td style="padding:6px 0;color:#888;font-size:14px">Notes</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px">${safeNotes}</td></tr>` : ""}
      </table>
    </div>

    <a href="https://www.sparkline.co.uk/dashboard/bookings" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:32px">View Booking in Dashboard →</a>

    <p style="font-size:13px;color:#888;margin:0 0 32px">Log in to your dashboard to confirm or manage this booking.</p>

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0">
    <p style="font-size:12px;color:#bbb;text-align:center;margin:0">Powered by Sparkline</p>
  </div>
</body>
</html>`,
          }),
        })
      );
    }

    await Promise.allSettled(emails);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-booking-confirmation error:", err);
    return new Response(JSON.stringify({ error: "Internal server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
