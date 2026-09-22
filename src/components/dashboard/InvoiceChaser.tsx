import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, CheckCircle2, Clock, AlertCircle, X, Copy, RefreshCw, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Invoice } from "@/types/invoice";

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const tones = ["Friendly", "Professional", "Firm"] as const;

const urgencyLabel = (days: number) => {
  if (days <= 7) return { label: "Gentle reminder", color: "bg-accent/10 text-accent" };
  if (days <= 21) return { label: "Follow-up", color: "bg-warning/10 text-warning" };
  if (days <= 45) return { label: "Firm reminder", color: "bg-destructive/10 text-destructive" };
  return { label: "Final notice", color: "bg-destructive/20 text-destructive font-semibold" };
};

const defaultTone = (days: number): "Friendly" | "Professional" | "Firm" => {
  if (days <= 7) return "Friendly";
  if (days <= 21) return "Professional";
  return "Firm";
};

interface ChaseInvoice extends Invoice {
  daysOverdue: number;
}

const InvoiceChaser = ({ invoices }: { invoices: Invoice[] }) => {
  const { profile } = useAuth();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [panelInvoice, setPanelInvoice] = useState<ChaseInvoice | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [tone, setTone] = useState<"Friendly" | "Professional" | "Firm">("Friendly");
  const [sending, setSending] = useState(false);
  const [chasedIds, setChasedIds] = useState<Set<string>>(new Set());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueInvoices = useMemo((): ChaseInvoice[] => {
    return invoices
      .filter(inv => (inv.status === "unpaid" || inv.status === "overdue") && new Date(inv.due_date + "T00:00:00") < today)
      .filter(inv => !chasedIds.has(inv.id))
      .map(inv => {
        const due = new Date(inv.due_date + "T00:00:00");
        const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        return { ...inv, daysOverdue };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [invoices, chasedIds]);

  const generateEmail = async (inv: ChaseInvoice, selectedTone: string) => {
    setGeneratingId(inv.id);
    try {
      const res = await supabase.functions.invoke("generate-chase-email", {
        body: {
          businessName: profile?.business_name || "Our Business",
          ownerFirstName: profile?.full_name?.split(" ")[0] || "Team",
          clientName: inv.client_name,
          invoiceNumber: inv.invoice_number,
          amount: Number(inv.total).toFixed(2),
          dueDate: inv.due_date,
          daysOverdue: inv.daysOverdue,
          tone: selectedTone,
          serviceDescription: "cleaning services",
        },
      });
      if (res.error || !res.data?.success) throw new Error();
      setEmailSubject(res.data.email.subject);
      setEmailBody(res.data.email.body);
    } catch {
      toast.error("Could not generate email. Please try again.");
    } finally {
      setGeneratingId(null);
    }
  };

  const openPanel = async (inv: ChaseInvoice) => {
    const t = defaultTone(inv.daysOverdue);
    setTone(t);
    setPanelInvoice(inv);
    setEmailSubject("");
    setEmailBody("");
    await generateEmail(inv, t);
  };

  const handleToneChange = async (newTone: "Friendly" | "Professional" | "Firm") => {
    setTone(newTone);
    if (panelInvoice) await generateEmail(panelInvoice, newTone);
  };

  const handleSend = async () => {
    if (!panelInvoice || !emailSubject || !emailBody) return;
    if (!panelInvoice.client_email) {
      toast.error("No email address on file for this client.");
      return;
    }
    setSending(true);
    try {
      const res = await supabase.functions.invoke("send-chase-email", {
        body: {
          invoiceId: panelInvoice.id,
          toEmail: panelInvoice.client_email,
          subject: emailSubject,
          body: emailBody,
          clientName: panelInvoice.client_name,
        },
      });
      if (res.error || !res.data?.success) throw new Error();
      toast.success(`Email sent to ${panelInvoice.client_name}`);
      setChasedIds(prev => new Set([...prev, panelInvoice.id]));
      setPanelInvoice(null);
    } catch {
      toast.error("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
    toast.success("Copied to clipboard.");
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <p className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            💬 Smart Invoice Chaser
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">AI-drafted follow-up emails ready to send</p>
        </div>
        {overdueInvoices.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
            {overdueInvoices.length} overdue
          </span>
        )}
      </div>

      {overdueInvoices.length === 0 ? (
        <div className="flex items-center gap-3 px-6 py-5">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">All invoices are up to date. Nothing to chase.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {overdueInvoices.map(inv => {
            const { label, color } = urgencyLabel(inv.daysOverdue);
            return (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{inv.client_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{inv.invoice_number}</p>
                </div>
                <p className="font-mono text-sm font-semibold text-foreground hidden sm:block">{fmtGBP(Number(inv.total))}</p>
                <p className="text-xs text-muted-foreground hidden md:block">{inv.daysOverdue}d overdue</p>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-md hidden sm:inline-block ${color}`}>{label}</span>
                <button
                  onClick={() => openPanel(inv)}
                  disabled={generatingId === inv.id}
                  className="h-8 px-3 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                >
                  {generatingId === inv.id ? <div className="w-3 h-3 border border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" /> : null}
                  Draft Email
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="px-6 py-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground">✨ Powered by AI — review before sending</p>
      </div>

      {/* Slide-over panel */}
      <AnimatePresence>
        {panelInvoice && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/20" onClick={() => setPanelInvoice(null)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-card border-l border-border flex flex-col shadow-xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">Draft Follow-up Email</p>
                  <p className="text-xs text-muted-foreground">{panelInvoice.client_name} · {panelInvoice.invoice_number}</p>
                </div>
                <button onClick={() => setPanelInvoice(null)} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Tone selector */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tone</p>
                  <div className="flex gap-2">
                    {tones.map(t => (
                      <button key={t} onClick={() => handleToneChange(t)}
                        disabled={generatingId === panelInvoice.id}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${tone === t ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">To</p>
                  <input type="email" readOnly value={panelInvoice.client_email || "No email on file"}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none" />
                </div>

                {generatingId === panelInvoice.id ? (
                  <div className="flex items-center gap-3 py-6">
                    <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin flex-shrink-0" />
                    <p className="text-sm text-muted-foreground animate-pulse">Generating email…</p>
                  </div>
                ) : (
                  <>
                    {/* Subject */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Subject</p>
                      <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
                    </div>

                    {/* Body */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Message</p>
                      <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={10}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none leading-relaxed" />
                    </div>
                  </>
                )}
              </div>

              <div className="px-6 py-4 border-t border-border space-y-3">
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend} disabled={sending || generatingId === panelInvoice.id || !emailBody}
                    className="flex-1 h-10 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                    {sending ? <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Email
                  </motion.button>
                  <button onClick={handleCopy} disabled={!emailBody}
                    className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <button onClick={() => generateEmail(panelInvoice, tone)} disabled={generatingId === panelInvoice.id}
                  className="w-full text-xs text-accent hover:underline disabled:opacity-50 flex items-center justify-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoiceChaser;
