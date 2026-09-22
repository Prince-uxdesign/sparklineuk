export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  service_preferences: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
