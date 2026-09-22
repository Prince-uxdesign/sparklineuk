import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callAI(prompt: string, maxTokens = 1000): Promise<string> {
  const apiKey = Deno.env.get("AI_API_KEY");
  if (!apiKey) throw new Error("AI_API_KEY not configured");
  const apiUrl = Deno.env.get("AI_API_URL");
  if (!apiUrl) throw new Error("AI_API_URL not configured");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`AI error: ${response.status} - ${JSON.stringify(err)}`);
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No response from AI");
  return text;
}

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const forceRefresh = body.forceRefresh === true;
    const rawClientId = body.clientId;
    const clientId = rawClientId && typeof rawClientId === "string" && /^[0-9a-f-]{36}$/.test(rawClientId)
      ? rawClientId : null;

    // Check 24h cache (global insights only)
    if (!clientId && !forceRefresh) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("ai_insights, ai_insights_updated_at")
        .eq("id", userId)
        .single();

      if (profile?.ai_insights_updated_at) {
        const lastGen = new Date(profile.ai_insights_updated_at).getTime();
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (lastGen > dayAgo && profile.ai_insights) {
          return new Response(
            JSON.stringify({ success: true, insights: profile.ai_insights, cached: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const [clientsRes, bookingsRes] = await Promise.all([
      supabase.from("clients").select("*").eq("user_id", userId),
      supabase.from("bookings").select("*").eq("user_id", userId),
    ]);

    const clients = clientsRes.data || [];
    const bookings = bookingsRes.data || [];

    if (clients.length < 1) {
      return new Response(
        JSON.stringify({ error: "not_enough_data", message: "Add at least 3 clients to unlock AI insights." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (clientId && !clients.some((c: any) => c.id === clientId)) {
      return new Response(JSON.stringify({ error: "Client not found" }), { status: 403, headers: corsHeaders });
    }

    const clientsData = clients
      .filter((c: any) => !clientId || c.id === clientId)
      .map((client: any) => {
        const clientBookings = bookings.filter((b: any) => b.client_name === client.name);
        const totalSpend = clientBookings.reduce((s: number, b: any) => s + Number(b.amount), 0);
        const sortedBookings = [...clientBookings].sort((a: any, b: any) => a.scheduled_date.localeCompare(b.scheduled_date));
        const lastBookingDate = sortedBookings[sortedBookings.length - 1]?.scheduled_date || null;
        let avgDaysBetween = null;
        if (sortedBookings.length > 1) {
          const gaps: number[] = [];
          for (let i = 1; i < sortedBookings.length; i++) {
            const a = new Date(sortedBookings[i - 1].scheduled_date).getTime();
            const b2 = new Date(sortedBookings[i].scheduled_date).getTime();
            gaps.push((b2 - a) / (1000 * 60 * 60 * 24));
          }
          avgDaysBetween = Math.round(gaps.reduce((s: number, g: number) => s + g, 0) / gaps.length);
        }
        const serviceCount: Record<string, number> = {};
        clientBookings.forEach((b: any) => { serviceCount[b.service] = (serviceCount[b.service] || 0) + 1; });
        const mostBookedService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        return { id: client.id, name: client.name, totalBookings: clientBookings.length, totalSpend, lastBookingDate, averageDaysBetweenBookings: avgDaysBetween, mostBookedService, firstBookingDate: client.created_at };
      });

    const prompt = clientId
      ? `You are a business growth advisor for a UK cleaning business. Analyse the following data for a single client and provide personalised insights.

Client Data:
${JSON.stringify(clientsData[0], null, 2)}

Today's Date: ${new Date().toISOString()}

Return ONLY a valid JSON array with NO markdown, NO backticks. Just raw JSON:
[{ "type": "string (overdue|opportunity|warning|positive)", "headline": "string (max 10 words)", "explanation": "string (max 25 words)", "suggested_action": "string (max 8 words)", "priority": number }]

Include insights about: booking frequency, spending pattern, churn risk, upsell opportunities. Return up to 5 insights.`
      : `You are a business growth advisor for a UK cleaning business. Identify the top 4 most valuable, actionable insights the business owner should act on RIGHT NOW.

Client Data:
${JSON.stringify(clientsData, null, 2)}

Today's Date: ${new Date().toISOString()}

Return ONLY a valid JSON array with NO markdown, NO backticks. Just raw JSON:
[{ "type": "string (overdue|opportunity|warning|positive)", "client_id": "string or null", "client_name": "string or null", "headline": "string (max 10 words)", "explanation": "string (max 25 words)", "suggested_action": "string (max 8 words)", "priority": number }]

Rules: Be SPECIFIC, reference actual names/numbers, prioritise churn risk, max 4 insights. If fewer than 3 clients, return general growth advice.`;

    const raw = await callAI(prompt, 1000);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const sorted = Array.isArray(parsed) ? [...parsed].sort((a: any, b: any) => a.priority - b.priority) : parsed;

    if (!clientId) {
      await supabase.from("profiles").update({
        ai_insights: sorted,
        ai_insights_updated_at: new Date().toISOString(),
      }).eq("id", userId);
    }

    return new Response(JSON.stringify({ success: true, insights: sorted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-client-insights error:", e);
    return new Response(
      JSON.stringify({ error: "Could not generate insights. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
