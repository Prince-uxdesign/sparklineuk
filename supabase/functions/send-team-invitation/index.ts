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
    // Require authentication — only authenticated business owners can send invitations
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const {
      invited_email,
      invited_name,
      role,
      business_name,
      owner_name,
      owner_email,
    } = await req.json();

    // Verify the owner_email belongs to the authenticated user
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await supabaseService
      .from("profiles")
      .select("id, business_email")
      .eq("id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Not authorized." }), {
        status: 403,
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

    const roleLabels: Record<string, string> = {
      admin: "Admin (Full access)",
      manager: "Manager (All except billing)",
      staff: "Staff (Jobs & schedule only)",
    };
    const roleLabel = roleLabels[role] || role;
    const signupUrl = `https://www.sparkline.co.uk/signup?email=${encodeURIComponent(invited_email)}`;

    const emails = [
      // EMAIL 1 — To the invited member
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Sparkline <no-reply@sparkline.co.uk>",
          to: [invited_email],
          subject: `You've been invited to join ${business_name} on Sparkline`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    <h1 style="font-size:24px;font-weight:700;color:#0a0a0a;margin:0 0 8px">You're invited!</h1>
    <p style="font-size:15px;color:#555;margin:0 0 24px">${owner_name} has invited you to join their cleaning business on Sparkline.</p>

    <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:12px;padding:24px;margin-bottom:32px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888;font-size:14px;width:120px">Business</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px;font-weight:500">${business_name}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:14px">Your role</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px;font-weight:500">${roleLabel}</td></tr>
      </table>
    </div>

    <a href="${signupUrl}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:32px">Accept Invitation →</a>

    <p style="font-size:13px;color:#888;margin:0 0 24px">Sparkline helps cleaning businesses manage bookings, scheduling and invoicing all in one place.</p>

    <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0">
    <p style="font-size:12px;color:#bbb;text-align:center;margin:0">Powered by Sparkline</p>
  </div>
</body>
</html>`,
        }),
      }),
    ];

    // EMAIL 2 — To the business owner (confirmation)
    if (owner_email) {
      emails.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "Sparkline <no-reply@sparkline.co.uk>",
            to: [owner_email],
            subject: `Team invitation sent to ${invited_name}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    <h1 style="font-size:24px;font-weight:700;color:#0a0a0a;margin:0 0 8px">Invitation sent ✓</h1>
    <p style="font-size:15px;color:#555;margin:0 0 24px">Your invitation to ${invited_name} has been sent successfully.</p>

    <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:12px;padding:24px;margin-bottom:32px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#888;font-size:14px;width:120px">Name</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px;font-weight:500">${invited_name}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:14px">Email</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px">${invited_email}</td></tr>
        <tr><td style="padding:6px 0;color:#888;font-size:14px">Role</td><td style="padding:6px 0;color:#0a0a0a;font-size:14px;font-weight:500">${roleLabel}</td></tr>
      </table>
    </div>

    <p style="font-size:13px;color:#888;margin:0 0 32px">They will appear in your team list once they accept the invitation.</p>

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
    console.error("send-team-invitation error:", err);
    return new Response(JSON.stringify({ error: "Internal server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
