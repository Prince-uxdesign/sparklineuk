import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Eye, DollarSign, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import InvoiceChaser from "@/components/dashboard/InvoiceChaser";

import type { Invoice } from "@/types/invoice";
import { toast } from "sonner";

const tabs = ["All", "Unpaid", "Paid", "Overdue", "Draft"] as const;

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

const Invoices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    if (!user) return;
    const timeout = setTimeout(() => setLoading(false), 5000);
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("issue_date", { ascending: false });
    if (data) setInvoices(data as unknown as Invoice[]);
    setLoading(false);
    clearTimeout(timeout);
  };

  useEffect(() => {
    if (!user) return;
    fetchInvoices();
  }, [user]);

  const summary = useMemo(() => {
    const total = invoices.reduce((s, i) => s + Number(i.total), 0);
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
    const outstanding = invoices.filter((i) => i.status === "unpaid").reduce((s, i) => s + Number(i.total), 0);
    const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.total), 0);
    return { total, paid, outstanding, overdue };
  }, [invoices]);

  const filtered = activeTab === "All"
    ? invoices
    : invoices.filter((i) => i.status === activeTab.toLowerCase());

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const fmtGBP = (n: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Invoices</h1>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/dashboard/invoices/new")}
          className="inline-flex items-center gap-2 h-[44px] px-5 bg-primary text-primary-foreground text-sm font-medium rounded-[12px] hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </motion.button>
      </motion.div>

      {/* Summary Pills */}
      <motion.div {...fadeUp(1)} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryPill icon={DollarSign} label="Total Revenue" value={fmtGBP(summary.total)} />
        <SummaryPill icon={CheckCircle2} label="Paid" value={fmtGBP(summary.paid)} color="text-success" />
        <SummaryPill icon={Clock} label="Outstanding" value={fmtGBP(summary.outstanding)} color="text-warning" />
        <SummaryPill icon={AlertTriangle} label="Overdue" value={fmtGBP(summary.overdue)} color="text-destructive" />
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp(2)} className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUp(3)} className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading invoices…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No invoices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Invoice #</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Client</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5 hidden md:table-cell">Date Issued</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">Due Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Amount</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/dashboard/invoices/${inv.id}`)}
                    className="border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors h-14"
                  >
                    <td className="px-5 py-3 font-mono text-sm font-medium text-foreground">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-sm text-foreground">{inv.client_name}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{formatDate(inv.issue_date)}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">{formatDate(inv.due_date)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md capitalize ${statusStyles[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-sm font-medium text-foreground">{fmtGBP(Number(inv.total))}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/invoices/${inv.id}`); }}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Invoice Chaser */}
      <motion.div {...{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.2 } }} className="mt-6">
        <InvoiceChaser invoices={invoices} />
      </motion.div>
    </div>
  );
};

const SummaryPill = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card">
    <Icon className={`w-4 h-4 flex-shrink-0 ${color || "text-muted-foreground"}`} strokeWidth={1.5} />
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`font-mono text-sm font-semibold ${color || "text-foreground"}`}>{value}</p>
    </div>
  </div>
);

export default Invoices;
