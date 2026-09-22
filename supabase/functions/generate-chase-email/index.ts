import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TONES = ["Friendly", "Professional", "Firm"];

async function callAI(prompt: string, maxTokens = 600): Promise<string> {
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

    const body = await req.json();
    const { businessName, ownerFirstName, clientName, invoiceNumber, amount, dueDate, daysOverdue, tone } = body;

    if (!clientName || typeof clientName !== "string" || clientName.length > 200)
      return new Response(JSON.stringify({ error: "Invalid client name" }), { status: 400, headers: corsHeaders });
    if (!invoiceNumber || typeof invoiceNumber !== "string" || invoiceNumber.length > 50)
      return new Response(JSON.stringify({ error: "Invalid invoice number" }), { status: 400, headers: corsHeaders });
    if (!VALID_TONES.includes(tone))
      return new Response(JSON.stringify({ error: "Invalid tone" }), { status: 400, headers: corsHeaders });
    if (typeof daysOverdue !== "number" || daysOverdue < 0 || daysOverdue > 3650)
      return new Response(JSON.stringify({ error: "Invalid daysOverdue" }), { status: 400, headers: corsHeaders });
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0 || amountNum > 1000000)
      return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: corsHeaders });

    const safe = (s: string, max = 200) => String(s).slice(0, max).replace(/[`${}\\]/g, "");

    const prompt = `You are writing a payment reminder email on behalf of a UK cleaning business owner to a client who has an overdue invoice.

Details:
Business Name: ${safe(businessName || "Our Business")}
Business Owner First Name: ${safe(ownerFirstName || "Team", 50)}
Client Name: ${safe(clientName)}
Invoice Number: ${safe(invoiceNumber, 50)}
Invoice Amount: £${amountNum.toFixed(2)}
Due Date: ${safe(dueDate || "", 20)}
Days Overdue: ${Math.floor(daysOverdue)}
Tone Required: ${tone} (Friendly/Professional/Firm)

Write a payment reminder email appropriate for ${Math.floor(daysOverdue)} days overdue with a ${tone} tone.

Return ONLY a valid JSON object, no markdown, no backticks:
{
  "subject": "string",
  "body": "string (the full email body, plain text, use \\n for line breaks)"
}

Guidelines by tone:
- Friendly (1-7 days): warm, assume it was forgotten, easy way out, no pressure
- Professional (8-21 days): polite but clear, reference invoice number specifically
- Firm (22+ days): direct, mention potential disruption to services, clear deadline to pay

NEVER be rude or threatening. Always professional.
Sign off with the owner's first name.
Keep it concise — under 150 words.
British English spelling throughout.`;

    const raw = await callAI(prompt, 600);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify({ success: true, email: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-chase-email error:", e);
    return new Response(
      JSON.stringify({ error: "Could not generate email. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
