import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BookingDetailPanel from "@/components/dashboard/BookingDetailPanel";
import type { Booking } from "@/types/booking";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  pending: "border-l-warning bg-warning/5",
  confirmed: "border-l-accent bg-accent/5",
  in_progress: "border-l-accent bg-accent/5",
  completed: "border-l-success bg-success/5",
  cancelled: "border-l-destructive bg-destructive/5",
};

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.05 },
});

function getWeekDays(referenceDate: Date) {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function formatDateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Schedule = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);
  const todayKey = formatDateKey(new Date());

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    const startDate = formatDateKey(weekDays[0]);
    const endDate = formatDateKey(weekDays[6]);
    const { data, error } = await supabase
      .from("bookings").select("*").eq("user_id", user.id)
      .gte("scheduled_date", startDate).lte("scheduled_date", endDate)
      .order("scheduled_time", { ascending: true });
    if (!error && data) setBookings(data as unknown as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchBookings();
  }, [user, weekOffset]);

  const handleUpdateStatus = async (id: string, status: Booking["status"]) => {
    if (!user) return;
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id).eq("user_id", user.id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Booking ${status.replace("_", " ")}`);
    setSelected(null);
    fetchBookings();
  };

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (!map[b.scheduled_date]) map[b.scheduled_date] = [];
      map[b.scheduled_date].push(b);
    });
    return map;
  }, [bookings]);

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const getInitials = (name: string | null) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const weekLabel = `${weekDays[0].toLocaleDateString("en-GB", { month: "short", day: "numeric" })} — ${weekDays[6].toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}`;
  const hasAnyBookings = bookings.length > 0;

  return (
    <div className="p-6 lg:p-10">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Schedule</h1>
      </motion.div>

      <motion.div {...fadeUp(1)} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((p) => p - 1)}
            className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={() => setWeekOffset((p) => p + 1)}
            className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
          <button onClick={() => setWeekOffset(0)}
            className="px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">
            Today
          </button>
        </div>
        <p className="text-sm font-medium text-foreground hidden sm:block">{weekLabel}</p>
      </motion.div>

      <motion.div {...fadeUp(2)} className="grid grid-cols-7 gap-0 rounded-2xl border border-border bg-card overflow-hidden">
        {weekDays.map((day, i) => {
          const key = formatDateKey(day);
          const isToday = key === todayKey;
          const dayBookings = bookingsByDate[key] || [];

          return (
            <div key={key} className={`min-h-[400px] border-r border-border last:border-r-0 ${isToday ? "border-l-2 border-l-accent" : ""}`}>
              <div className={`px-2 py-3 border-b border-border text-center ${isToday ? "bg-accent/5" : ""}`}>
                <p className="text-[10px] text-muted-foreground">{dayNames[i]}</p>
                <p className={`font-mono text-base font-semibold ${isToday ? "text-accent" : "text-foreground"}`}>
                  {day.getDate()}
                </p>
              </div>
              <div className="p-1.5 space-y-1.5">
                {dayBookings.map((booking) => (
                  <motion.div key={booking.id} whileHover={{ scale: 1.02 }} onClick={() => setSelected(booking)}
                    className={`p-2 rounded-lg border-l-2 cursor-pointer transition-all hover:shadow-sm ${statusColor[booking.status] || "bg-secondary"}`}>
                    <p className="font-mono text-[10px] text-muted-foreground mb-0.5">{formatTime(booking.scheduled_time)}</p>
                    <p className="text-[11px] font-medium text-foreground truncate mb-1">{booking.client_name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground truncate">{booking.service}</p>
                      {booking.assigned_cleaner && (
                        <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[7px] font-medium text-muted-foreground flex-shrink-0 ml-1">
                          {getInitials(booking.assigned_cleaner)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {!loading && dayBookings.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/40 text-center py-4">—</p>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>

      {!loading && !hasAnyBookings && (
        <motion.div {...fadeUp(3)} className="mt-6 rounded-2xl border border-border bg-card p-10 text-center">
          <CalendarDays className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1} />
          <p className="text-sm font-medium text-foreground mb-1">No bookings this week.</p>
          <p className="text-xs text-muted-foreground">Add a booking to see it on the schedule.</p>
        </motion.div>
      )}

      <BookingDetailPanel booking={selected} onClose={() => setSelected(null)} onUpdateStatus={handleUpdateStatus} />
    </div>
  );
};

export default Schedule;
