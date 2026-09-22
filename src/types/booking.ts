export interface Booking {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  service: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  assigned_cleaner: string | null;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  amount: number;
  payment_status: "unpaid" | "paid" | "partial";
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
