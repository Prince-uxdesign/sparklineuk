import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { BusinessHealthCard, ClientInsightsWidget } from "@/components/dashboard/AIFeatures";
import {
  CalendarCheck,
  PoundSterling,
  Users,
  FileText,
  ArrowUpRight,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.08 },
});

const fmt = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const statusStyles: Record<string, string> = {
  confirmed: "bg-accent/10 text-accent",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  pending: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const DashboardHome = () => {
  const { profile, user } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const todayKey = now.toISOString().split("T")[0];

  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [clientCount, setClientCount] = useState(0);
  const [pendingInvoiceCount, setPendingInvoiceCount] = useState(0);
  const [chartData, setChartData] = useState<{ day: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) { setLoading(false); return; }
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [todayRes, monthInvRes, clientRes, pendingInvRes, weekBookingsRes] = await Promise.all([
      supabase.from("bookings").select("*").eq("user_id", user.id).eq("scheduled_date", todayKey).order("scheduled_time"),
      supabase.from("invoices").select("total").eq("user_id", user.id).eq("status", "paid").gte("issue_date", monthStart).lte("issue_date", monthEnd),
      supabase.from("clients").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("invoices").select("id", { count: "exact" }).eq("user_id", user.id).in("status", ["unpaid", "overdue"]),
      supabase.from("bookings").select("scheduled_date,amount").eq("user_id", user.id).gte("scheduled_date", (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split("T")[0]; })()),
    ]);

    if (todayRes.data) setTodayBookings(todayRes.data);
    if (monthInvRes.data) setMonthRevenue(monthInvRes.data.reduce((s: number, i: any) => s + Number(i.total), 0));
    if (clientRes.count !== null) setClientCount(clientRes.count);
    if (pendingInvRes.count !== null) setPendingInvoiceCount(pendingInvRes.count);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().split("T")[0], day: d.toLocaleDateString("en-GB", { weekday: "short" }) };
    });
    const revenueByDate: Record<string, number> = {};
    (weekBookingsRes.data || []).forEach((b: any) => {
      revenueByDate[b.scheduled_date] = (revenueByDate[b.scheduled_date] || 0) + Number(b.amount);
    });
    setChartData(days.map((d) => ({ day: d.day, revenue: revenueByDate[d.date] || 0 })));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const timeout = setTimeout(() => setLoading(false), 8000);
    loadData().finally(() => clearTimeout(timeout));

    // Realtime: refresh today's jobs when a booking is inserted or updated
    const channel = supabase
      .channel("dashboard-home-bookings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const b = payload.new as any;
          // Only prepend if it's scheduled for today
          if (b.scheduled_date === todayKey) {
            setTodayBookings((prev) =>
              prev.some((x) => x.id === b.id) ? prev : [...prev, b].sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
            );
          }
        }
      )
      .subscribe();

    return () => { clearTimeout(timeout); supabase.removeChannel(channel); };
  }, [user]);

  const statCards = [
    { label: "Today's Bookings", value: loading ? "—" : String(todayBookings.length), sub: "View bookings", icon: CalendarCheck, to: "/dashboard/bookings" },
    { label: "Revenue This Month", value: loading ? "—" : fmt(monthRevenue), sub: "View invoices", icon: PoundSterling, to: "/dashboard/invoices" },
    { label: "Active Clients", value: loading ? "—" : String(clientCount), sub: "View clients", icon: Users, to: "/dashboard/clients" },
    { label: "Pending Invoices", value: loading ? "—" : String(pendingInvoiceCount), sub: "Requires attention", icon: FileText, to: "/dashboard/invoices?status=unpaid", badge: pendingInvoiceCount > 0 },
  ];

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const hasRevenue = chartData.some((d) => d.revenue > 0);

  return (
    <div className="p-6 lg:p-10 max-w-[1200px]">
      {/* Greeting */}
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="font-heading text-[28px] font-bold text-foreground">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{dateStr}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} {...fadeUp(i + 1)}>
            <Link
              to={stat.to}
              className="group block p-6 rounded-2xl border border-border bg-card transition-all hover:border-accent hover:shadow-sm cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="flex items-center gap-1">
                  <stat.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <ArrowRight className="w-3.5 h-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform" />
                </div>
              </div>
              <p className="font-mono text-4xl font-bold text-foreground mb-1">
                {stat.value}
                {stat.badge && Number(stat.value) > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full bg-destructive text-destructive-foreground align-middle">
                    {stat.value}
                  </span>
                )}
              </p>
              <p className="text-xs font-medium text-muted-foreground">{stat.sub}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* AI Business Health Card */}
      <motion.div {...fadeUp(5)} className="mb-8">
        <BusinessHealthCard />
      </motion.div>

      {/* Jobs + Activity + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div {...fadeUp(6)} className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-5">
            Upcoming Jobs Today
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : todayBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarCheck className="w-8 h-8 text-muted-foreground/40 mb-3" strokeWidth={1} />
              <p className="text-sm font-medium text-foreground mb-1">No jobs scheduled today.</p>
              <p className="text-xs text-muted-foreground mb-4">Add your first booking to get started.</p>
              <Link
                to="/dashboard/bookings"
                className="inline-flex items-center gap-1.5 h-[36px] px-4 bg-primary text-primary-foreground text-xs font-medium rounded-[10px] hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" /> Add Booking
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-border bg-background hover:border-accent transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground w-16 flex-shrink-0">
                      {formatTime(job.scheduled_time)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{job.client_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{job.address || job.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">{job.assigned_cleaner || "—"}</span>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md capitalize ${statusStyles[job.status] || "bg-muted text-muted-foreground"}`}>
                      {job.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div {...fadeUp(7)} className="lg:col-span-1">
          <ClientInsightsWidget />
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <motion.div {...fadeUp(8)} className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-lg font-semibold text-foreground">Revenue — Last 7 Days</h2>
          {hasRevenue && (
            <div className="flex items-center gap-1 text-xs text-success font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Active
            </div>
          )}
        </div>
        {!hasRevenue && !loading ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <PoundSterling className="w-8 h-8 text-muted-foreground/40 mb-3" strokeWidth={1} />
            <p className="text-sm font-medium text-foreground mb-1">No revenue data yet.</p>
            <p className="text-xs text-muted-foreground">Revenue from completed bookings will appear here.</p>
          </div>
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v === 0 ? "£0" : `£${v / 1000}k`} dx={-5} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "hsl(217, 91%, 60%)", stroke: "hsl(var(--card))", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardHome;
