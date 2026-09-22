import { supabase } from "@/integrations/supabase/client";
import type { Client } from "@/types/client";

const DEMO_CLIENTS: Omit<Client, "id" | "user_id" | "created_at" | "updated_at">[] = [
  { name: "Sarah Johnson", email: "sarah@email.com", phone: "(555) 123-4567", address: "142 Oak Street, Suite 3", service_preferences: "Deep Clean, eco-friendly products", notes: "Has two dogs. Prefers morning appointments." },
  { name: "TechHub Office", email: "admin@techhub.com", phone: "(555) 234-5678", address: "88 Innovation Blvd, Floor 4", service_preferences: "Office Clean", notes: "After-hours access code: 4521. Conference rooms first." },
  { name: "Emily Chen", email: "emily.chen@gmail.com", phone: "(555) 345-6789", address: "305 Maple Avenue, Apt 12B", service_preferences: "Regular Clean", notes: null },
  { name: "Mark Davis", email: "mark.d@outlook.com", phone: "(555) 456-7890", address: "17 Birch Lane", service_preferences: "Move-out Clean, Deep Clean", notes: "3-bedroom apartment. Carpets need steam cleaning." },
  { name: "GreenLeaf Co.", email: "ops@greenleaf.co", phone: "(555) 567-8901", address: "900 Park Row, Suite 200", service_preferences: "Weekly Office Clean", notes: "Recurring weekly. Restrooms + kitchen priority." },
  { name: "Lisa Park", email: "lisa.park@yahoo.com", phone: "(555) 678-9012", address: "72 Elm Drive", service_preferences: "Deep Clean", notes: "First-time client referral from Sarah Johnson." },
  { name: "David Wright", email: "d.wright@email.com", phone: "(555) 789-0123", address: "45 Cedar Court", service_preferences: "Post-Construction Clean", notes: "Renovation just completed. Heavy dust removal." },
  { name: "Bright Smiles Dental", email: "office@brightsmiles.com", phone: "(555) 890-1234", address: "221 Health Center Dr", service_preferences: "Medical Office Clean", notes: "HIPAA compliant. Sterilization protocol required." },
  { name: "Amanda Foster", email: "amanda.f@gmail.com", phone: "(555) 901-2345", address: "88 Sunset Blvd, Unit 5", service_preferences: "Regular Clean", notes: null },
];

export async function seedClientsIfEmpty(userId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (error || (data && data.length > 0)) return;

  const rows = DEMO_CLIENTS.map((c) => ({ ...c, user_id: userId }));
  await supabase.from("clients").insert(rows);
}
