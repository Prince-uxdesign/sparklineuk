import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Mail, Phone, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AddClientModal from "@/components/dashboard/AddClientModal";
import type { Client } from "@/types/client";
import type { Booking } from "@/types/booking";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.05 },
});

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n);

const Clients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 5000);
    const [clientRes, bookingRes] = await Promise.all([
      supabase.from("clients").select("*").eq("user_id", user.id).order("name"),
      supabase.from("bookings").select("client_name,amount,scheduled_date").eq("user_id", user.id),
    ]);
    if (clientRes.data) setClients(clientRes.data as unknown as Client[]);
    if (bookingRes.data) setBookings(bookingRes.data as unknown as Booking[]);
    setLoading(false);
    clearTimeout(timeout);
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const clientStats = useMemo(() => {
    const map: Record<string, { totalJobs: number; totalSpend: number; lastDate: string | null }> = {};
    bookings.forEach((b) => {
      const key = b.client_name;
      if (!map[key]) map[key] = { totalJobs: 0, totalSpend: 0, lastDate: null };
      map[key].totalJobs++;
      map[key].totalSpend += Number(b.amount);
      if (!map[key].lastDate || b.scheduled_date > map[key].lastDate!) map[key].lastDate = b.scheduled_date;
    });
    return map;
  }, [bookings]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q));
  }, [clients, search]);

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const formatDate = (d: string | null) =>
    d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { month: "short", day: "numeric" }) : "—";

  return (
    <div className="p-6 lg:p-10">
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Clients</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="h-[40px] pl-9 pr-4 rounded-[12px] border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors w-[220px]" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 h-[40px] px-4 bg-primary text-primary-foreground text-sm font-medium rounded-[12px] hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add Client
          </motion.button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-8 h-8 text-muted-foreground/40 mb-3" strokeWidth={1} />
          <p className="text-sm font-medium text-foreground mb-1">No clients yet.</p>
          <p className="text-xs text-muted-foreground mb-4">Add your first client to get started.</p>
          <button onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-[36px] px-4 bg-primary text-primary-foreground text-xs font-medium rounded-[10px] hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" /> Add Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client, i) => {
            const stats = clientStats[client.name];
            return (
              <motion.div key={client.id} {...fadeUp(i + 1)}
                whileHover={{ scale: 1.01, borderColor: "hsl(217, 91%, 60%)" }}
                className="p-6 rounded-2xl border border-border bg-card transition-colors cursor-pointer"
                onClick={() => navigate(`/dashboard/clients/${client.id}`)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-muted-foreground flex-shrink-0">
                    {getInitials(client.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                    {client.email && (
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 flex-shrink-0" />{client.email}
                      </p>
                    )}
                  </div>
                </div>
                {client.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                    <Phone className="w-3 h-3" />{client.phone}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Jobs</p>
                    <p className="font-mono text-sm font-semibold text-foreground">{stats?.totalJobs ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Spend</p>
                    <p className="font-mono text-sm font-semibold text-foreground">{fmtGBP(stats?.totalSpend ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Job</p>
                    <p className="text-xs font-medium text-foreground">{formatDate(stats?.lastDate ?? null)}</p>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/clients/${client.id}`); }}
                  className="w-full mt-4 h-[36px] rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary transition-colors">
                  View Profile
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddClientModal open={modalOpen} onClose={() => setModalOpen(false)} onAdded={fetchData} />
    </div>
  );
};

export default Clients;
