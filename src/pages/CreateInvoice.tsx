import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, Search, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Client } from "@/types/client";
import { toast } from "sonner";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.05 },
});

const CreateInvoice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [taxRate, setTaxRate] = useState(20);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    if (!user) return;
    supabase.from("clients").select("*").eq("user_id", user.id).order("name").then(({ data }) => {
      if (data) setClients(data as unknown as Client[]);
    });
  }, [user]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const subtotal = items.reduce((s, item) => s + item.quantity * item.unit_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const generateInvoiceNumber = async (): Promise<string> => {
    if (!user) return "INV-001";
    try {
      const { data } = await supabase
        .from("invoices")
        .select("invoice_number")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      let maxNum = 0;
      if (data) {
        data.forEach((inv) => {
          const match = inv.invoice_number?.match(/^INV-(\d+)$/);
          if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
        });
      }
      return `INV-${String(maxNum + 1).padStart(3, "0")}`;
    } catch {
      return `INV-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;
    }
  };

  const handleSubmit = async (status: "draft" | "unpaid") => {
    if (!user) return;
    if (!selectedClient) { toast.error("Please select a client."); return; }
    if (items.some((i) => !i.description.trim() || i.unit_price <= 0)) {
      toast.error("Please complete all line items.");
      return;
    }

    setLoading(true);
    try {
      const invoiceNumber = await generateInvoiceNumber();
      const invoiceData = {
        user_id: user.id,
        invoice_number: invoiceNumber,
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        client_email: selectedClient.email,
        client_address: selectedClient.address,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        status,
        notes: notes.trim() || null,
      };

      const { data: inserted, error } = await supabase
        .from("invoices")
        .insert(invoiceData)
        .select("id")
        .single();

      if (error) throw error;
      if (!inserted) throw new Error("No invoice returned");

      const lineItems = items.map((item) => ({
        invoice_id: inserted.id,
        description: item.description.trim(),
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase.from("invoice_items").insert(lineItems);
      if (itemsError) throw itemsError;

      toast.success(status === "draft" ? "Invoice saved as draft." : "Invoice created!");
      navigate(`/dashboard/invoices/${inserted.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[900px]">
      <motion.button
        {...fadeUp(0)}
        onClick={() => navigate("/dashboard/invoices")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Invoices
      </motion.button>

      <motion.h1 {...fadeUp(0)} className="font-heading text-[28px] font-bold text-foreground mb-8">
        Create Invoice
      </motion.h1>

      {/* Client Selector */}
      <motion.div {...fadeUp(1)} className="mb-6 relative">
        <label className="block text-sm font-medium text-foreground mb-1.5">Client</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={clientSearch}
            onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); setSelectedClient(null); }}
            onFocus={() => setShowClientDropdown(true)}
            placeholder="Search clients…"
            className="w-full h-[44px] pl-9 pr-4 rounded-[12px] border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
          />
        </div>
        {showClientDropdown && filteredClients.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-sm max-h-[200px] overflow-y-auto">
            {filteredClients.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectClient(c)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <span className="font-medium text-foreground">{c.name}</span>
                {c.email && <span className="text-muted-foreground ml-2 text-xs">{c.email}</span>}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Dates */}
      <motion.div {...fadeUp(2)} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Invoice Date</label>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
            className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors" />
        </div>
      </motion.div>

      {/* Line Items */}
      <motion.div {...fadeUp(3)} className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-3">Line Items</label>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Description</th>
                <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-20">Qty</th>
                <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-28">Unit Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-24">Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">
                    <input type="text" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)}
                      placeholder="Service description" maxLength={255}
                      className="w-full h-[36px] px-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min={1} value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", Math.max(1, Number(e.target.value)))}
                      className="w-full h-[36px] px-2.5 rounded-lg border border-border bg-background text-sm text-foreground text-center font-mono focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min={0} step={0.01} value={item.unit_price || ""}
                      onChange={(e) => updateItem(i, "unit_price", Math.max(0, Number(e.target.value)))}
                      placeholder="0.00"
                      className="w-full h-[36px] px-2.5 rounded-lg border border-border bg-background text-sm text-foreground text-center font-mono focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors" />
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm font-medium text-foreground">
                    £{(item.quantity * item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-2 py-2">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="p-1 rounded hover:bg-secondary transition-colors">
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addItem} className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="w-4 h-4" /> Add Line Item
        </button>
      </motion.div>

      {/* Totals */}
      <motion.div {...fadeUp(4)} className="flex justify-end mb-6">
        <div className="w-full sm:w-[280px] space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono font-medium text-foreground">£{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">VAT</span>
              <input type="number" min={0} max={100} step={0.5} value={taxRate}
                onChange={(e) => setTaxRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-14 h-[28px] px-2 rounded-md border border-border bg-background text-xs text-foreground text-center font-mono focus:outline-none focus:ring-1 focus:ring-ring/20" />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <span className="font-mono font-medium text-foreground">£{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-border">
            <span className="font-medium text-foreground">Total (inc. VAT)</span>
            <span className="font-mono text-lg font-bold text-foreground">£{total.toFixed(2)}</span>
          </div>
        </div>
      </motion.div>

      {/* Notes */}
      <motion.div {...fadeUp(5)} className="mb-8">
        <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000}
          className="w-full px-3.5 py-2.5 rounded-[12px] border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors resize-none"
          placeholder="Payment terms, special instructions…" />
      </motion.div>

      {/* Actions */}
      <motion.div {...fadeUp(6)} className="flex gap-3">
        <motion.button whileTap={{ scale: 0.97 }} disabled={loading} onClick={() => handleSubmit("draft")}
          className="h-[44px] px-6 rounded-[12px] border border-border bg-card text-foreground text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50">
          {loading ? "Saving…" : "Save as Draft"}
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} disabled={loading} onClick={() => handleSubmit("unpaid")}
          className="h-[44px] px-6 rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? "Creating…" : "Send Invoice"}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default CreateInvoice;
