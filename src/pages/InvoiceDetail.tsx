import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Invoice, InvoiceItem } from "@/types/invoice";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  draft: "bg-secondary text-muted-foreground",
  unpaid: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
};

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.05 },
});

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const fetch = async () => {
      const [invRes, itemsRes] = await Promise.all([
        supabase.from("invoices").select("*").eq("id", id).eq("user_id", user.id).single(),
        supabase.from("invoice_items").select("*").eq("invoice_id", id).order("created_at"),
      ]);
      if (invRes.data) setInvoice(invRes.data as unknown as Invoice);
      if (itemsRes.data) setItems(itemsRes.data as unknown as InvoiceItem[]);
      setLoading(false);
    };
    fetch();
  }, [user, id]);

  const handleMarkPaid = async () => {
    if (!id) return;
    const { error } = await supabase.from("invoices").update({ status: "paid" }).eq("id", id);
    if (error) { toast.error("Failed to update."); return; }
    toast.success("Invoice marked as paid!");
    setInvoice((prev) => prev ? { ...prev, status: "paid" } : prev);
  };

  const handleSendReminder = () => {
    toast.success("Reminder sent to " + (invoice?.client_email || "client") + "!");
  };

  const handleDownload = () => {
    toast.success("PDF download started. (Feature coming soon)");
  };

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const fmtGBP = (n: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground mb-4">Invoice not found.</p>
        <button onClick={() => navigate("/dashboard/invoices")} className="text-sm text-accent hover:underline">← Back</button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      <motion.button
        {...fadeUp(0)}
        onClick={() => navigate("/dashboard/invoices")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Invoices
      </motion.button>

      {/* Action Bar */}
      <motion.div {...fadeUp(1)} className="flex flex-wrap items-center gap-3 mb-8">
        <span className={`text-xs font-medium px-3 py-1.5 rounded-md capitalize ${statusStyles[invoice.status]}`}>
          {invoice.status}
        </span>
        <div className="flex-1" />
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleDownload} className="inline-flex items-center gap-2 h-[36px] px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          <Download className="w-4 h-4" /> Download PDF
        </motion.button>
        {invoice.status !== "paid" && (
          <>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSendReminder} className="inline-flex items-center gap-2 h-[36px] px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              <Send className="w-4 h-4" /> Send Reminder
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleMarkPaid} className="inline-flex items-center gap-2 h-[36px] px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <CheckCircle2 className="w-4 h-4" /> Mark as Paid
            </motion.button>
          </>
        )}
      </motion.div>

      {/* Invoice Document */}
      <motion.div {...fadeUp(2)} className="max-w-[800px] mx-auto rounded-2xl border border-border bg-card p-8 lg:p-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 mb-10">
          <div>
            <p className="font-heading text-2xl font-bold text-foreground mb-1">Sparkline</p>
            <p className="text-sm text-muted-foreground">{profile?.business_name || "Your Business"}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-mono text-lg font-bold text-foreground mb-1">{invoice.invoice_number}</p>
            <p className="text-sm text-muted-foreground">Issued: {formatDate(invoice.issue_date)}</p>
            <p className="text-sm text-muted-foreground">Due: {formatDate(invoice.due_date)}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-10 pb-8 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bill To</p>
          <p className="text-sm font-semibold text-foreground">{invoice.client_name}</p>
          {invoice.client_email && <p className="text-sm text-muted-foreground">{invoice.client_email}</p>}
          {invoice.client_address && <p className="text-sm text-muted-foreground">{invoice.client_address}</p>}
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3">Description</th>
                <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3 w-16">Qty</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3 w-24">Unit Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider pb-3 w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-3 text-sm text-foreground">{item.description}</td>
                  <td className="py-3 text-sm text-muted-foreground text-center font-mono">{Number(item.quantity)}</td>
                  <td className="py-3 text-sm text-muted-foreground text-right font-mono">{fmtGBP(Number(item.unit_price))}</td>
                  <td className="py-3 text-sm font-medium text-foreground text-right font-mono">{fmtGBP(Number(item.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-10">
          <div className="w-[240px] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono text-foreground">{fmtGBP(Number(invoice.subtotal))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT ({Number(invoice.tax_rate)}%)</span>
              <span className="font-mono text-foreground">{fmtGBP(Number(invoice.tax_amount))}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="font-semibold text-foreground">Total (inc. VAT)</span>
              <span className="font-mono text-xl font-bold text-foreground">{fmtGBP(Number(invoice.total))}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{invoice.notes}</p>
          </div>
        )}

        {/* Payment Instructions */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Payment Instructions</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please make payment within the due date. For questions about this invoice, contact us at billing@sparkline.io.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InvoiceDetail;
