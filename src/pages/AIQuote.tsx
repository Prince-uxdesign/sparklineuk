import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, ChevronDown, X, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.05 },
});

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const propertyTypes = ["Flat", "House", "Office", "Commercial", "Other"] as const;
const propertySizes = ["Small (under 50m²)", "Medium (50–150m²)", "Large (150–300m²)", "Very Large (300m²+)"] as const;
const serviceTypes = ["Regular Clean", "Deep Clean", "End of Tenancy", "Move-In Clean", "Office Clean", "Post-Construction", "Carpet Clean", "Window Clean", "Oven Clean"] as const;
const conditions = ["Excellent", "Good", "Fair", "Poor", "Very Poor"] as const;

interface QuoteResult {
  line_items: { description: string; quantity: number; unit: string; unit_price: number; total: number }[];
  subtotal: number;
  vat_amount: number;
  total_inc_vat: number;
  estimated_duration_hours: number;
  notes: string;
  pricing_rationale: string;
}

const AIQuote = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropOpen, setClientDropOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [propertyType, setPropertyType] = useState<string>("");
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [propertySize, setPropertySize] = useState<string>("");
  const [services, setServices] = useState<string[]>([]);
  const [condition, setCondition] = useState<string>("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteNumber, setQuoteNumber] = useState("Q-001");
  const [savingInvoice, setSavingInvoice] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("clients").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) setClients(data);
    });
    // Generate quote number
    supabase.from("invoices").select("invoice_number").eq("user_id", user.id).then(({ data }) => {
      const nums = (data || []).map((r: any) => r.invoice_number).filter((n: string) => n.startsWith("Q-"));
      const next = nums.length > 0
        ? Math.max(...nums.map((n: string) => parseInt(n.replace("Q-", "")) || 0)) + 1
        : 1;
      setQuoteNumber(`Q-${String(next).padStart(3, "0")}`);
    });
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setClientDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredClients = useMemo(() =>
    clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())),
    [clients, clientSearch]
  );

  const toggleService = (s: string) => {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleGenerate = async () => {
    if (!propertyType || !propertySize || services.length === 0 || !condition || !location) {
      toast.error("Please fill in property type, size, at least one service, condition, and location.");
      return;
    }
    setLoading(true);
    setQuote(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("generate-quote", {
        body: {
          propertyType,
          bedrooms: ["Flat", "House"].includes(propertyType) ? bedrooms : undefined,
          propertySize,
          services,
          condition,
          location,
          specialRequirements,
        },
      });
      if (res.error || !res.data?.success) throw new Error(res.data?.error || "Failed");
      setQuote(res.data.quote);
    } catch {
      toast.error("AI is temporarily unavailable. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async (status: "draft" | "unpaid") => {
    if (!quote || !user) return;
    setSavingInvoice(true);
    try {
      const { data: inv, error: invErr } = await supabase.from("invoices").insert({
        user_id: user.id,
        invoice_number: quoteNumber,
        client_id: selectedClient?.id || null,
        client_name: selectedClient?.name || clientSearch || "Client",
        client_email: selectedClient?.email || null,
        client_address: selectedClient?.address || null,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        subtotal: quote.subtotal,
        tax_rate: 20,
        tax_amount: quote.vat_amount,
        total: quote.total_inc_vat,
        status,
        notes: quote.notes,
      }).select().single();
      if (invErr) throw invErr;

      // Insert line items
      await supabase.from("invoice_items").insert(
        quote.line_items.map(item => ({
          invoice_id: inv.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }))
      );

      toast.success(status === "draft" ? "Saved as draft." : "Invoice created.");
      navigate(`/dashboard/invoices/${inv.id}`);
    } catch {
      toast.error("Failed to save invoice.");
    } finally {
      setSavingInvoice(false);
    }
  };

  return (
    <div className="p-6 lg:p-10">
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="font-heading text-[28px] font-bold text-foreground flex items-center gap-2.5">
          <Wand2 className="w-7 h-7 text-primary" strokeWidth={1.5} />
          AI Quote Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Describe the job and get a professional quote in seconds.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <motion.div {...fadeUp(1)} className="rounded-2xl border border-border bg-card p-6 space-y-5">
          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Client</label>
            <div className="relative" ref={dropRef}>
              <input
                type="text"
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setClientDropOpen(true); setSelectedClient(null); }}
                onFocus={() => setClientDropOpen(true)}
                placeholder="Search or type client name…"
                className="w-full h-10 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
              />
              {clientDropOpen && filteredClients.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-border bg-card shadow-lg max-h-40 overflow-y-auto">
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(c.name); setClientDropOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Property Type</label>
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map(t => (
                <button key={t} onClick={() => setPropertyType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${propertyType === t ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms */}
          {["Flat", "House"].includes(propertyType) && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Number of Bedrooms</label>
              <input type="number" min={0} max={20} value={bedrooms} onChange={e => setBedrooms(e.target.value ? parseInt(e.target.value) : "")}
                className="w-32 h-10 px-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
          )}

          {/* Property Size */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Property Size</label>
            <select value={propertySize} onChange={e => setPropertySize(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
              <option value="">Select size…</option>
              {propertySizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Service Type</label>
            <div className="flex flex-wrap gap-2">
              {serviceTypes.map(s => (
                <button key={s} onClick={() => toggleService(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${services.includes(s) ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Condition of Property</label>
            <div className="flex flex-wrap gap-2">
              {conditions.map(c => (
                <button key={c} onClick={() => setCondition(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${condition === c ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. London, SW1A 1AA"
              className="w-full h-10 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Special Requirements <span className="normal-case text-muted-foreground font-normal">(optional)</span></label>
            <textarea value={specialRequirements} onChange={e => setSpecialRequirements(e.target.value)} rows={3}
              placeholder="e.g. pet hair, specific products needed, access restrictions, extra bathrooms…"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring resize-none" />
          </div>

          {/* Generate */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                Generating your quote…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" strokeWidth={1.5} />
                Generate Quote
              </>
            )}
          </motion.button>
          <p className="text-center text-[10px] text-muted-foreground">✨ Powered by AI — review before sending</p>
        </motion.div>

        {/* RIGHT: Quote Preview */}
        <motion.div {...fadeUp(2)}>
          <AnimatePresence mode="wait">
            {!quote && !loading ? (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl border-2 border-dashed border-border bg-card h-full min-h-[400px] flex flex-col items-center justify-center text-center p-10">
                <Wand2 className="w-10 h-10 text-muted-foreground/30 mb-4" strokeWidth={1} />
                <p className="text-sm font-medium text-foreground mb-1">Your AI-generated quote will appear here.</p>
                <p className="text-xs text-muted-foreground">Fill in the details and click Generate Quote.</p>
              </motion.div>
            ) : loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl border border-border bg-card h-full min-h-[400px] flex flex-col items-center justify-center p-10">
                <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-foreground animate-pulse">Generating your quote…</p>
              </motion.div>
            ) : quote ? (
              <motion.div key="quote" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-6 space-y-5">
                {/* Quote Header */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <p className="font-heading text-lg font-bold text-foreground">{profile?.business_name || "Your Business"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">AI-Generated Quote</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-foreground">{quoteNumber}</p>
                    <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>

                {/* Client */}
                {(selectedClient?.name || clientSearch) && (
                  <div className="border-b border-border pb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">For</p>
                    <p className="text-sm font-medium text-foreground">{selectedClient?.name || clientSearch}</p>
                    {selectedClient?.address && <p className="text-xs text-muted-foreground">{selectedClient.address}</p>}
                  </div>
                )}

                {/* Line Items */}
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-2 pr-3">Description</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-2 px-3">Qty</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-2 px-3">Unit Price</th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-2 pl-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quote.line_items.map((item, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="py-2.5 pr-3 text-foreground">{item.description}</td>
                            <td className="py-2.5 px-3 text-right text-muted-foreground font-mono">{item.quantity} {item.unit}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{fmtGBP(item.unit_price)}</td>
                            <td className="py-2.5 pl-3 text-right font-mono font-medium text-foreground">{fmtGBP(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-mono">{fmtGBP(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>VAT (20%)</span>
                    <span className="font-mono">{fmtGBP(quote.vat_amount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground text-base border-t border-border pt-2 mt-2">
                    <span>Total (inc. VAT)</span>
                    <span className="font-mono">{fmtGBP(quote.total_inc_vat)}</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="rounded-xl bg-secondary/50 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Estimated Duration: </span>
                  <span className="font-medium text-foreground">Approx. {quote.estimated_duration_hours} hours</span>
                </div>

                {/* Notes */}
                {quote.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Notes</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{quote.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSaveInvoice("unpaid")} disabled={savingInvoice}
                    className="flex-1 h-10 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                    Send to Client
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleSaveInvoice("draft")} disabled={savingInvoice}
                    className="flex-1 h-10 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-60">
                    Save as Draft
                  </motion.button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AIQuote;
