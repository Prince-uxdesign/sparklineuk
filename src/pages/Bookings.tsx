import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Eye, Pencil, X, Search, Calendar, Clock, User, PoundSterling, MapPin, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BookingDetailPanel from "@/components/dashboard/BookingDetailPanel";
import type { Booking } from "@/types/booking";
import { toast } from "sonner";

const tabs = ["All", "Pending", "Confirmed", "Completed", "Cancelled"] as const;

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-accent/10 text-accent",
  in_progress: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.05 },
});

const SERVICE_TYPES = ["Regular Clean", "Deep Clean", "Move-In Clean", "Move-Out Clean", "Office Clean", "Post-Construction Clean", "Other"];
const DURATIONS = [
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "3 hours", minutes: 180 },
  { label: "4 hours", minutes: 240 },
  { label: "Half day", minutes: 300 },
  { label: "Full day", minutes: 480 },
];
const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

interface BookingForm {
  client_name: string;
  client_email: string;
  client_phone: string;
  service: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  assigned_cleaner: string;
  address: string;
  notes: string;
  amount: string;
}

const AddBookingModal = ({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [form, setForm] = useState<BookingForm>({
    client_name: "", client_email: "", client_phone: "", service: SERVICE_TYPES[0],
    scheduled_date: new Date().toISOString().split("T")[0],
    scheduled_time: "10:00", duration_minutes: 120,
    assigned_cleaner: "", address: "", notes: "", amount: "",
  });

  useEffect(() => {
    if (!user || !open) return;
    supabase.from("clients").select("id,name,email,phone,address").eq("user_id", user.id).order("name").then(({ data }) => {
      if (data) setClients(data);
    });
  }, [user, open]);

  const filteredClients = clientSearch
    ? clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
    : clients;

  const selectClient = (c: any) => {
    setForm((f) => ({ ...f, client_name: c.name, client_email: c.email || "", client_phone: c.phone || "", address: c.address || "" }));
    setClientSearch(c.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.client_name.trim() || !form.scheduled_date || !form.scheduled_time) {
      toast.error("Please fill in required fields.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      client_name: form.client_name.trim(),
      client_email: form.client_email.trim() || null,
      client_phone: form.client_phone.trim() || null,
      service: form.service,
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time + ":00",
      duration_minutes: form.duration_minutes,
      assigned_cleaner: form.assigned_cleaner.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
      amount: parseFloat(form.amount) || 0,
      status: "pending",
      payment_status: "unpaid",
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to add booking. Please try again.");
      return;
    }
    toast.success("Booking added successfully.");
    onAdded();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-card rounded-2xl border border-border w-full max-w-[600px] max-h-[90vh] overflow-y-auto pointer-events-auto shadow-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-xl font-bold text-foreground">Add Booking</h2>
                  <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Client */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Client *</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text" value={clientSearch}
                        onChange={(e) => { setClientSearch(e.target.value); setForm((f) => ({ ...f, client_name: e.target.value })); }}
                        placeholder="Search or type client name…"
                        className="w-full h-[44px] pl-9 pr-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
                      />
                    </div>
                    {clientSearch && filteredClients.length > 0 && clientSearch !== filteredClients.find(c => c.name === clientSearch)?.name && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                        {filteredClients.slice(0, 6).map((c) => (
                          <button key={c.id} type="button" onClick={() => selectClient(c)}
                            className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                            {c.name} {c.email && <span className="text-muted-foreground text-xs ml-1">— {c.email}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                      <input type="email" value={form.client_email} onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
                        className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors" placeholder="client@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
                      <input type="tel" value={form.client_phone} onChange={(e) => setForm((f) => ({ ...f, client_phone: e.target.value }))}
                        className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors" placeholder="+44 7700 000000" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Service Type *</label>
                    <select value={form.service} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                      className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors">
                      {SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Date *</label>
                      <input type="date" value={form.scheduled_date} onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                        className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Time *</label>
                      <select value={form.scheduled_time} onChange={(e) => setForm((f) => ({ ...f, scheduled_time: e.target.value }))}
                        className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors">
                        {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Duration</label>
                      <select value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
                        className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors">
                        {DURATIONS.map((d) => <option key={d.minutes} value={d.minutes}>{d.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Price (£)</label>
                      <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors" placeholder="0.00" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Assigned Staff</label>
                    <input type="text" value={form.assigned_cleaner} onChange={(e) => setForm((f) => ({ ...f, assigned_cleaner: e.target.value }))}
                      className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors" placeholder="Staff member name" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
                    <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors" placeholder="Full address with postcode" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Special Instructions</label>
                    <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3}
                      className="w-full px-3.5 py-2.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors resize-none"
                      placeholder="Any special notes or instructions…" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose}
                      className="flex-1 h-[44px] rounded-[12px] border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                      Cancel
                    </button>
                    <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                      className="flex-1 h-[44px] rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                      {loading ? "Saving…" : "Save Booking"}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;
    const timeout = setTimeout(() => setLoading(false), 5000);
    const { data, error } = await supabase
      .from("bookings").select("*").eq("user_id", user.id)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });
    clearTimeout(timeout);
    if (!error && data) setBookings(data as unknown as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchBookings();

    // Realtime: prepend new bookings instantly and show toast
    const channel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setBookings((prev) => {
            // avoid duplicates if fetchBookings already picked it up
            if (prev.some((b) => b.id === (payload.new as Booking).id)) return prev;
            return [payload.new as Booking, ...prev];
          });
          toast(`New booking from ${(payload.new as Booking).client_name}`, {
            description: `${(payload.new as Booking).service} — just submitted via your booking link`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setBookings((prev) =>
            prev.map((b) => b.id === (payload.new as Booking).id ? (payload.new as Booking) : b)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleUpdateStatus = async (id: string, status: Booking["status"]) => {
    if (!user) return;
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id).eq("user_id", user.id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Booking ${status.replace("_", " ")}`);
    setSelected(null);
    fetchBookings();
  };

  const filtered = activeTab === "All"
    ? bookings
    : bookings.filter((b) => b.status === activeTab.toLowerCase());

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const fmtGBP = (n: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 lg:p-10">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Bookings</h1>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 h-[44px] px-5 bg-primary text-primary-foreground text-sm font-medium rounded-[12px] hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New Booking
        </motion.button>
      </motion.div>

      <motion.div {...fadeUp(1)} className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}>
            {tab}
          </button>
        ))}
      </motion.div>

      <motion.div {...fadeUp(2)} className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm font-medium text-foreground mb-1">No bookings found.</p>
            <p className="text-xs text-muted-foreground mb-4">Add your first booking to get started.</p>
            <button onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-[36px] px-4 bg-primary text-primary-foreground text-xs font-medium rounded-[10px] hover:opacity-90 transition-opacity">
              <Plus className="w-3.5 h-3.5" /> Add Booking
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Client</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Service</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Date & Time</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">Cleaner</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Amount</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <tr key={booking.id} onClick={() => setSelected(booking)}
                    className="border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer transition-colors h-14">
                    <td className="px-5 py-3"><span className="text-sm font-medium text-foreground">{booking.client_name}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-muted-foreground">{booking.service}</span></td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-foreground">{formatDate(booking.scheduled_date)}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">{formatTime(booking.scheduled_time)}</span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell"><span className="text-sm text-muted-foreground">{booking.assigned_cleaner || "—"}</span></td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md capitalize ${statusStyles[booking.status]}`}>
                        {booking.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-mono text-sm font-medium text-foreground">{fmtGBP(Number(booking.amount))}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setSelected(booking); }}
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <BookingDetailPanel booking={selected} onClose={() => setSelected(null)} onUpdateStatus={handleUpdateStatus} />
      <AddBookingModal open={modalOpen} onClose={() => setModalOpen(false)} onAdded={fetchBookings} />
    </div>
  );
};

export default Bookings;
