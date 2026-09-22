import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { PoundSterling, CalendarCheck, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip,
} from "recharts";
import { FullBusinessReport } from "@/components/dashboard/AIFeatures";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.05 },
});

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n);

const Analytics = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => setLoading(false), 5000);
    const load = async () => {
      setLoading(true);
      const [bRes, iRes, cRes] = await Promise.all([
        supabase.from("bookings").select("*").eq("user_id", user.id),
        supabase.from("invoices").select("*").eq("user_id", user.id),
        supabase.from("clients").select("id,name").eq("user_id", user.id),
      ]);
      if (bRes.data) setBookings(bRes.data);
      if (iRes.data) setInvoices(iRes.data);
      if (cRes.data) setClients(cRes.data);
      setLoading(false);
      clearTimeout(timeout);
    };
    load();
    return () => clearTimeout(timeout);
  }, [user]);

  const stats = useMemo(() => {
    const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
    const totalBookings = bookings.length;
    const totalClients = clients.length;
    const avgJobValue = totalBookings > 0 ? bookings.reduce((s, b) => s + Number(b.amount), 0) / totalBookings : 0;
    return { totalRevenue, totalBookings, totalClients, avgJobValue };
  }, [bookings, invoices, clients]);

  const revenueData = useMemo(() => {
    const weeks: { week: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const label = d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay() + 1);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
      const ws = weekStart.toISOString().split("T")[0];
      const we = weekEnd.toISOString().split("T")[0];
      const revenue = bookings.filter(b => b.scheduled_date >= ws && b.scheduled_date <= we).reduce((s, b) => s + Number(b.amount), 0);
      weeks.push({ week: label, revenue });
    }
    return weeks;
  }, [bookings]);

  const statusData = useMemo(() => {
    const map: Record<string, number> = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach(b => { if (map[b.status] !== undefined) map[b.status]++; });
    return Object.entries(map).map(([status, count]) => ({ status: status.charAt(0).toUpperCase() + status.slice(1), count }));
  }, [bookings]);

  const topClients = useMemo(() => {
    const map: Record<string, { totalJobs: number; totalSpend: number }> = {};
    bookings.forEach(b => {
      if (!map[b.client_name]) map[b.client_name] = { totalJobs: 0, totalSpend: 0 };
      map[b.client_name].totalJobs++;
      map[b.client_name].totalSpend += Number(b.amount);
    });
    return Object.entries(map)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);
  }, [bookings]);

  const summaryCards = [
    { label: "Total Revenue", value: fmtGBP(stats.totalRevenue), icon: PoundSterling },
    { label: "Total Bookings", value: String(stats.totalBookings), icon: CalendarCheck },
    { label: "Total Clients", value: String(stats.totalClients), icon: Users },
    { label: "Avg Job Value", value: fmtGBP(stats.avgJobValue), icon: TrendingUp },
  ];

  return (
    <div className="p-6 lg:p-10">
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Your business performance at a glance.</p>
      </motion.div>

      {/* AI Business Report */}
      <motion.div {...fadeUp(1)} className="mb-8">
        <FullBusinessReport />
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card, i) => (
          <motion.div key={card.label} {...fadeUp(i + 1)} className="p-6 rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-mono text-3xl font-bold text-foreground">
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {!loading && bookings.length === 0 && invoices.length === 0 && (
        <motion.div {...fadeUp(5)} className="rounded-2xl border border-border bg-card p-10 text-center mb-6">
          <TrendingUp className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1} />
          <p className="text-sm font-medium text-foreground mb-1">No data yet.</p>
          <p className="text-xs text-muted-foreground">Your analytics will populate as you add bookings and invoices.</p>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div {...fadeUp(5)} className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-base font-semibold text-foreground mb-6">Revenue — Last 12 Weeks</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loading ? [] : revenueData}>
                <CartesianGrid horizontal vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={2} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v === 0 ? "£0" : `£${v / 1000}k`} />
                <Tooltip formatter={(v) => [fmtGBP(Number(v)), "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...fadeUp(6)} className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-base font-semibold text-foreground mb-6">Bookings by Status</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loading ? [] : statusData} barSize={32}>
                <CartesianGrid horizontal vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top clients */}
      <motion.div {...fadeUp(7)} className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-heading text-base font-semibold text-foreground">Top Clients by Spend</h2>
        </div>
        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : topClients.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No client data yet. Add bookings to see top clients.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Client</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Total Jobs</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">Total Spend</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map((c, i) => (
                <tr key={c.name} className={`border-b border-border last:border-0 h-12 ${i === 0 ? "bg-accent/5" : ""}`}>
                  <td className="px-6 py-3 text-sm font-medium text-foreground">{c.name}</td>
                  <td className="px-6 py-3 text-right font-mono text-sm text-muted-foreground">{c.totalJobs}</td>
                  <td className="px-6 py-3 text-right font-mono text-sm font-semibold text-foreground">{fmtGBP(c.totalSpend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
};

export default Analytics;
