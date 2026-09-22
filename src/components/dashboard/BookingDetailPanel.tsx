import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, MapPin, Clock, DollarSign, User, FileText } from "lucide-react";
import type { Booking } from "@/types/booking";

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

interface BookingDetailPanelProps {
  booking: Booking | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Booking["status"]) => void;
}

const BookingDetailPanel = ({ booking, onClose, onUpdateStatus }: BookingDetailPanelProps) => {
  if (!booking) return null;

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${ampm}`;
  };

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <AnimatePresence>
      {booking && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-foreground/10"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-card border-l border-border overflow-y-auto"
          >
            <div className="p-6 lg:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    {booking.client_name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{booking.service}</p>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Status + Payment */}
              <div className="flex gap-2 mb-8">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${statusStyles[booking.status]}`}>
                  {booking.status.replace("_", " ")}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${paymentStyles[booking.payment_status]}`}>
                  {booking.payment_status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-5 mb-8">
                <DetailRow icon={Clock} label="Date & Time" value={`${formatDate(booking.scheduled_date)} at ${formatTime(booking.scheduled_time)}`} />
                <DetailRow icon={Clock} label="Duration" value={`${booking.duration_minutes} minutes`} />
                <DetailRow icon={DollarSign} label="Amount" value={`£${Number(booking.amount).toFixed(2)}`} mono />
                <DetailRow icon={User} label="Assigned Cleaner" value={booking.assigned_cleaner || "Unassigned"} />
                <DetailRow icon={MapPin} label="Address" value={booking.address || "No address"} />
                {booking.client_email && <DetailRow icon={Mail} label="Email" value={booking.client_email} />}
                {booking.client_phone && <DetailRow icon={Phone} label="Phone" value={booking.client_phone} />}
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Special Notes</span>
                  </div>
                  <p className="text-sm text-foreground bg-background rounded-xl p-4 border border-border leading-relaxed">
                    {booking.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {booking.status === "pending" && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onUpdateStatus(booking.id, "confirmed")}
                    className="w-full h-[44px] rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Confirm Booking
                  </motion.button>
                )}
                {(booking.status === "confirmed" || booking.status === "in_progress") && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onUpdateStatus(booking.id, "completed")}
                    className="w-full h-[44px] rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Mark Completed
                  </motion.button>
                )}
                {booking.status !== "cancelled" && booking.status !== "completed" && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onUpdateStatus(booking.id, "cancelled")}
                    className="w-full h-[44px] rounded-[12px] border border-border bg-card text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    Cancel Booking
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const DetailRow = ({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={1.5} />
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm text-foreground ${mono ? "font-mono font-semibold" : ""}`}>{value}</p>
    </div>
  </div>
);

export default BookingDetailPanel;
