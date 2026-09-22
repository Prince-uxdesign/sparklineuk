import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claims.claims.sub;

    const body = await req.json();
    const { invoiceId, toEmail, subject, clientName } = body;
    const emailBody: string = body.body;

    // Input validation
    if (!invoiceId || typeof invoiceId !== "string") {
      return new Response(JSON.stringify({ error: "Invalid invoiceId" }), { status: 400, headers: corsHeaders });
    }
    if (!toEmail || typeof toEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), { status: 400, headers: corsHeaders });
    }
    if (!subject || typeof subject !== "string" || subject.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid subject" }), { status: 400, headers: corsHeaders });
    }
    if (!emailBody || typeof emailBody !== "string" || emailBody.length > 5000) {
      return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400, headers: corsHeaders });
    }

    // Verify invoice belongs to authenticated user before sending
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("id, chase_count, user_id")
      .eq("id", invoiceId)
      .eq("user_id", userId)
      .single();

    if (invError || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found or access denied" }), { status: 403, headers: corsHeaders });
    }

    // Send via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "Sparkline <onboarding@resend.dev>",
        to: [toEmail],
        subject,
        text: emailBody,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      throw new Error("Failed to send email");
    }

    // Single atomic update of chase tracking
    await supabase.from("invoices")
      .update({
        last_chased_at: new Date().toISOString(),
        chase_count: (invoice.chase_count || 0) + 1,
      })
      .eq("id", invoiceId)
      .eq("user_id", userId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-chase-email error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to send email. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
