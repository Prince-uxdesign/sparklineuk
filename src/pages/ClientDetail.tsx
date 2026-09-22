import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, MapPin, Pencil, CalendarCheck, DollarSign, BarChart3, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Client } from "@/types/client";
import type { Booking } from "@/types/booking";
import { toast } from "sonner";
import { ClientAIInsightsTab } from "@/components/dashboard/AIFeatures";

const tabs = ["Overview", "Job History", "Invoices", "Notes", "AI Insights"] as const;

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-accent/10 text-accent",
  in_progress: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const paymentStyles: Record<string, string> = {
  unpaid: "bg-destructive/10 text-destructive",
  paid: "bg-success/10 text-success",
  partial: "bg-warning/10 text-warning",
};

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.05 },
});

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const fetch = async () => {
      const [cRes, bRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).eq("user_id", user.id).single(),
        supabase.from("bookings").select("*").eq("user_id", user.id),
      ]);
      if (cRes.data) {
        const c = cRes.data as unknown as Client;
        setClient(c);
        setNotes(c.notes || "");
      }
      if (bRes.data) setBookings(bRes.data as unknown as Booking[]);
      setLoading(false);
    };
    fetch();
  }, [user, id]);

  const clientBookings = useMemo(
    () => bookings.filter((b) => client && b.client_name === client.name).sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date)),
    [bookings, client]
  );

  const stats = useMemo(() => {
    const total = clientBookings.length;
    const spend = clientBookings.reduce((s, b) => s + Number(b.amount), 0);
    return {
      totalJobs: total,
      totalSpend: spend,
      avgValue: total > 0 ? spend / total : 0,
      memberSince: client?.created_at
        ? new Date(client.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "—",
    };
  }, [clientBookings, client]);

  const handleSaveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    const { error } = await supabase.from("clients").update({ notes }).eq("id", id);
    setSavingNotes(false);
    if (error) toast.error("Failed to save notes.");
    else toast.success("Notes saved.");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground mb-4">Client not found.</p>
        <button onClick={() => navigate("/dashboard/clients")} className="text-sm text-accent hover:underline">
          ← Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Back */}
      <motion.button
        {...fadeUp(0)}
        onClick={() => navigate("/dashboard/clients")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </motion.button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column — Contact Card */}
        <motion.div {...fadeUp(1)} className="lg:w-[30%] rounded-2xl border border-border bg-card p-6 h-fit lg:sticky lg:top-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-xl font-semibold text-muted-foreground mb-3">
              {getInitials(client.name)}
            </div>
            <h2 className="font-heading text-lg font-bold text-foreground">{client.name}</h2>
            {client.service_preferences && (
              <p className="text-xs text-muted-foreground mt-1">{client.service_preferences}</p>
            )}
          </div>

          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                <span className="text-foreground truncate">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                <span className="text-foreground">{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-foreground">{client.address}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column — Tabs */}
        <motion.div {...fadeUp(2)} className="lg:w-[70%]">
          {/* Tab Bar */}
          <div className="flex gap-1 mb-6 overflow-x-auto">
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
          </div>

          {/* Overview */}
          {activeTab === "Overview" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={CalendarCheck} label="Total Jobs" value={String(stats.totalJobs)} />
              <StatCard icon={DollarSign} label="Total Spend" value={`$${stats.totalSpend.toFixed(0)}`} mono />
              <StatCard icon={BarChart3} label="Avg Job Value" value={`$${stats.avgValue.toFixed(0)}`} mono />
              <StatCard icon={Clock} label="Member Since" value={stats.memberSince} />
            </div>
          )}

          {/* Job History */}
          {activeTab === "Job History" && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {clientBookings.length === 0 ? (
                <p className="p-8 text-sm text-muted-foreground text-center">No jobs found for this client.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Service</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Cleaner</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientBookings.map((b) => (
                        <tr key={b.id} className="border-b border-border last:border-0 h-14 hover:bg-secondary/50 transition-colors">
                          <td className="px-5 py-3 text-sm text-foreground">
                            {formatDate(b.scheduled_date)} <span className="text-muted-foreground text-xs ml-1">{formatTime(b.scheduled_time)}</span>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{b.service}</td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{b.assigned_cleaner || "—"}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md capitalize ${statusStyles[b.status]}`}>
                              {b.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-sm font-medium text-foreground">${Number(b.amount).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Invoices */}
          {activeTab === "Invoices" && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {clientBookings.length === 0 ? (
                <p className="p-8 text-sm text-muted-foreground text-center">No invoices found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Invoice</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Service</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientBookings.map((b, idx) => (
                        <tr key={b.id} className="border-b border-border last:border-0 h-14 hover:bg-secondary/50 transition-colors">
                          <td className="px-5 py-3 font-mono text-sm text-foreground">INV-{(1000 + idx).toString()}</td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{b.service}</td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{formatDate(b.scheduled_date)}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md capitalize ${paymentStyles[b.payment_status]}`}>
                              {b.payment_status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-sm font-medium text-foreground">${Number(b.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {activeTab === "Notes" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm font-medium text-foreground mb-3">Client Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                maxLength={5000}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors resize-none leading-relaxed"
                placeholder="Add notes about this client — preferences, special requests, reminders…"
              />
              <div className="flex justify-end mt-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="h-[36px] px-5 rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {savingNotes ? "Saving…" : "Save Notes"}
                </motion.button>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {activeTab === "AI Insights" && client && (
            <ClientAIInsightsTab clientId={client.id} clientName={client.name} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) => (
  <div className="p-5 rounded-2xl border border-border bg-card">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
    </div>
    <p className={`text-2xl font-bold text-foreground ${mono ? "font-mono" : "font-heading"}`}>{value}</p>
  </div>
);

export default ClientDetail;
