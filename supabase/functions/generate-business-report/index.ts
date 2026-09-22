import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function callAI(prompt: string, maxTokens = 1500): Promise<string> {
  const apiKey = Deno.env.get("AI_API_KEY");
  if (!apiKey) throw new Error("AI_API_KEY not configured");

  const apiUrl = Deno.env.get("AI_API_URL");
  if (!apiUrl) throw new Error("AI_API_URL not configured");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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

    // Rate limit: max once per hour
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_report_updated_at, ai_report, business_name")
      .eq("id", userId)
      .single();

    if (profile?.ai_report_updated_at) {
      const lastGen = new Date(profile.ai_report_updated_at).getTime();
      const hourAgo = Date.now() - 60 * 60 * 1000;
      if (lastGen > hourAgo && profile.ai_report) {
        return new Response(
          JSON.stringify({ success: true, report: profile.ai_report, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Collect business data
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split("T")[0];

    const [
      allBookingsRes, thisMonthBookingsRes, lastMonthBookingsRes,
      paidInvThisMonthRes, paidInvLastMonthRes, paidInv3MonthRes,
      clientsRes, newClientsThisMonthRes, newClientsLastMonthRes,
      outstandingInvRes, overdueInvRes, teamRes,
    ] = await Promise.all([
      supabase.from("bookings").select("service,scheduled_date,amount").eq("user_id", userId),
      supabase.from("bookings").select("id", { count: "exact" }).eq("user_id", userId).gte("scheduled_date", monthStart),
      supabase.from("bookings").select("id", { count: "exact" }).eq("user_id", userId).gte("scheduled_date", lastMonthStart).lte("scheduled_date", lastMonthEnd),
      supabase.from("invoices").select("total").eq("user_id", userId).eq("status", "paid").gte("issue_date", monthStart),
      supabase.from("invoices").select("total").eq("user_id", userId).eq("status", "paid").gte("issue_date", lastMonthStart).lte("issue_date", lastMonthEnd),
      supabase.from("invoices").select("total").eq("user_id", userId).eq("status", "paid").gte("issue_date", threeMonthsAgo),
      supabase.from("clients").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("clients").select("id", { count: "exact" }).eq("user_id", userId).gte("created_at", monthStart),
      supabase.from("clients").select("id", { count: "exact" }).eq("user_id", userId).gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
      supabase.from("invoices").select("total,id", { count: "exact" }).eq("user_id", userId).eq("status", "unpaid"),
      supabase.from("invoices").select("total,id", { count: "exact" }).eq("user_id", userId).eq("status", "overdue"),
      supabase.from("team_members").select("id", { count: "exact" }).eq("user_id", userId),
    ]);

    const allBookings = allBookingsRes.data || [];
    const revenueThisMonth = (paidInvThisMonthRes.data || []).reduce((s: number, i: any) => s + Number(i.total), 0);
    const revenueLastMonth = (paidInvLastMonthRes.data || []).reduce((s: number, i: any) => s + Number(i.total), 0);
    const revenue3Month = (paidInv3MonthRes.data || []).reduce((s: number, i: any) => s + Number(i.total), 0);
    const outstandingValue = (outstandingInvRes.data || []).reduce((s: number, i: any) => s + Number(i.total), 0);
    const overdueValue = (overdueInvRes.data || []).reduce((s: number, i: any) => s + Number(i.total), 0);

    const serviceCount: Record<string, number> = {};
    allBookings.forEach((b: any) => { serviceCount[b.service] = (serviceCount[b.service] || 0) + 1; });
    const mostBookedServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);

    const dayCount: Record<string, number> = {};
    allBookings.forEach((b: any) => {
      const day = new Date(b.scheduled_date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long" });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const busiestDayOfWeek = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    const avgJobValue = allBookings.length > 0
      ? allBookings.reduce((s: number, b: any) => s + Number(b.amount), 0) / allBookings.length : 0;

    const businessData = {
      businessName: profile?.business_name || "Your Business",
      totalBookingsAllTime: allBookings.length,
      bookingsThisMonth: thisMonthBookingsRes.count || 0,
      bookingsLastMonth: lastMonthBookingsRes.count || 0,
      revenueThisMonth, revenueLastMonth,
      revenueThreeMonthAvg: revenue3Month / 3,
      activeClientsCount: clientsRes.count || 0,
      newClientsThisMonth: newClientsThisMonthRes.count || 0,
      newClientsLastMonth: newClientsLastMonthRes.count || 0,
      outstandingInvoicesCount: outstandingInvRes.count || 0,
      outstandingInvoicesValue: outstandingValue,
      overdueInvoicesCount: overdueInvRes.count || 0,
      overdueInvoicesValue: overdueValue,
      mostBookedServices, averageJobValue: avgJobValue,
      busiestDayOfWeek, totalTeamMembers: teamRes.count || 0,
    };

    const prompt = `You are an expert business advisor specialising in UK cleaning businesses. Analyse the following business data and produce a clear, honest, actionable business health report written in warm, direct, plain English.

Business Data:
${JSON.stringify(businessData, null, 2)}

Return ONLY a valid JSON object with NO markdown, NO backticks, NO explanation. Just raw JSON:
{
  "performance_summary": "string (2-3 paragraphs)",
  "whats_working": ["string", "string", "string"],
  "opportunities": ["string", "string", "string"],
  "weekly_priority": "string (one specific action)",
  "revenue_forecast": number,
  "revenue_forecast_explanation": "string",
  "overall_health_score": number,
  "health_score_label": "string (Excellent/Good/Fair/Needs Attention)"
}

Be specific, not generic. Reference actual numbers from the data. Give real, honest advice even if some metrics are low. Tone: like a trusted advisor, not a corporate report.`;

    const raw = await callAI(prompt, 1500);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    await supabase.from("profiles").update({
      ai_report: parsed,
      ai_report_updated_at: new Date().toISOString(),
    }).eq("id", userId);

    return new Response(JSON.stringify({ success: true, report: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-business-report error:", e);
    return new Response(
      JSON.stringify({ error: "Could not generate report. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
