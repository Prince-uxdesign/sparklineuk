import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_PROPERTY_TYPES = ["Flat", "House", "Office", "Commercial", "Other"];
const VALID_PROPERTY_SIZES = ["Small (under 50m²)", "Medium (50–150m²)", "Large (150–300m²)", "Very Large (300m²+)"];
const VALID_SERVICE_TYPES = ["Regular Clean", "Deep Clean", "End of Tenancy", "Move-In Clean", "Office Clean", "Post-Construction", "Carpet Clean", "Window Clean", "Oven Clean"];
const VALID_CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Very Poor"];

async function callAI(prompt: string, maxTokens = 1500): Promise<string> {
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
    const { propertyType, bedrooms, propertySize, services, condition, location, specialRequirements } = body;

    if (!VALID_PROPERTY_TYPES.includes(propertyType))
      return new Response(JSON.stringify({ error: "Invalid property type" }), { status: 400, headers: corsHeaders });
    if (!VALID_PROPERTY_SIZES.includes(propertySize))
      return new Response(JSON.stringify({ error: "Invalid property size" }), { status: 400, headers: corsHeaders });
    if (!Array.isArray(services) || services.length === 0 || !services.every((s: string) => VALID_SERVICE_TYPES.includes(s)))
      return new Response(JSON.stringify({ error: "Invalid services" }), { status: 400, headers: corsHeaders });
    if (!VALID_CONDITIONS.includes(condition))
      return new Response(JSON.stringify({ error: "Invalid condition" }), { status: 400, headers: corsHeaders });
    if (!location || typeof location !== "string" || location.length > 200)
      return new Response(JSON.stringify({ error: "Invalid location" }), { status: 400, headers: corsHeaders });
    if (specialRequirements && (typeof specialRequirements !== "string" || specialRequirements.length > 2000))
      return new Response(JSON.stringify({ error: "Special requirements too long" }), { status: 400, headers: corsHeaders });
    const bedroomsNum = bedrooms !== undefined ? Number(bedrooms) : null;
    if (bedroomsNum !== null && (isNaN(bedroomsNum) || bedroomsNum < 0 || bedroomsNum > 20))
      return new Response(JSON.stringify({ error: "Invalid bedroom count" }), { status: 400, headers: corsHeaders });

    const prompt = `You are a professional cleaning business pricing expert in the United Kingdom. Generate a detailed, itemised quote for a cleaning job based on the following details:

Property Type: ${propertyType}
Bedrooms: ${bedroomsNum ?? "N/A"}
Property Size: ${propertySize}
Services Required: ${services.join(", ")}
Property Condition: ${condition}
Location: ${location}
Special Requirements: ${specialRequirements || "None"}

Return ONLY a valid JSON object with NO markdown, NO backticks, NO explanation. Just the raw JSON:
{
  "line_items": [{ "description": "string", "quantity": number, "unit": "string", "unit_price": number, "total": number }],
  "subtotal": number,
  "vat_amount": number,
  "total_inc_vat": number,
  "estimated_duration_hours": number,
  "notes": "string",
  "pricing_rationale": "string"
}

Pricing must reflect current UK market rates for professional cleaning services (2025). Be specific and detailed in descriptions. Split complex jobs into multiple line items. Account for property condition in pricing (poor condition = higher price).`;

    const raw = await callAI(prompt, 1500);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify({ success: true, quote: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-quote error:", e);
    return new Response(
      JSON.stringify({ error: "Could not generate quote. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
