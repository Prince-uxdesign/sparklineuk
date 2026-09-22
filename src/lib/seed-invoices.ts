import { supabase } from "@/integrations/supabase/client";

const DEMO_INVOICES = [
  { invoice_number: "INV-1001", client_name: "Sarah Johnson", client_email: "sarah@email.com", client_address: "142 Oak Street, Suite 3", issue_date: "2025-02-01", due_date: "2025-02-15", subtotal: 320, tax_rate: 8, tax_amount: 25.6, total: 345.6, status: "paid", notes: "Deep clean — eco-friendly products used.", items: [{ description: "Deep Clean — 3 Bedroom House", quantity: 1, unit_price: 280, total: 280 }, { description: "Eco-friendly product surcharge", quantity: 1, unit_price: 40, total: 40 }] },
  { invoice_number: "INV-1002", client_name: "TechHub Office", client_email: "admin@techhub.com", client_address: "88 Innovation Blvd, Floor 4", issue_date: "2025-02-05", due_date: "2025-02-19", subtotal: 450, tax_rate: 8, tax_amount: 36, total: 486, status: "paid", notes: null, items: [{ description: "Office Clean — 4th Floor (4,000 sq ft)", quantity: 1, unit_price: 350, total: 350 }, { description: "Conference Room Detail Clean", quantity: 2, unit_price: 50, total: 100 }] },
  { invoice_number: "INV-1003", client_name: "Emily Chen", client_email: "emily.chen@gmail.com", client_address: "305 Maple Avenue, Apt 12B", issue_date: "2025-02-10", due_date: "2025-02-24", subtotal: 180, tax_rate: 8, tax_amount: 14.4, total: 194.4, status: "paid", notes: null, items: [{ description: "Regular Clean — 1 Bedroom Apartment", quantity: 1, unit_price: 180, total: 180 }] },
  { invoice_number: "INV-1004", client_name: "Mark Davis", client_email: "mark.d@outlook.com", client_address: "17 Birch Lane", issue_date: "2025-02-14", due_date: "2025-02-28", subtotal: 520, tax_rate: 8, tax_amount: 41.6, total: 561.6, status: "unpaid", notes: "Move-out clean including carpet steam.", items: [{ description: "Move-out Clean — 3 Bedroom", quantity: 1, unit_price: 420, total: 420 }, { description: "Carpet Steam Cleaning", quantity: 2, unit_price: 50, total: 100 }] },
  { invoice_number: "INV-1005", client_name: "GreenLeaf Co.", client_email: "ops@greenleaf.co", client_address: "900 Park Row, Suite 200", issue_date: "2025-02-12", due_date: "2025-02-26", subtotal: 380, tax_rate: 8, tax_amount: 30.4, total: 410.4, status: "paid", notes: "Weekly recurring.", items: [{ description: "Weekly Office Clean", quantity: 1, unit_price: 380, total: 380 }] },
  { invoice_number: "INV-1006", client_name: "Lisa Park", client_email: "lisa.park@yahoo.com", client_address: "72 Elm Drive", issue_date: "2025-02-18", due_date: "2025-03-04", subtotal: 340, tax_rate: 8, tax_amount: 27.2, total: 367.2, status: "unpaid", notes: "First-time client.", items: [{ description: "Deep Clean — 2 Bedroom House", quantity: 1, unit_price: 260, total: 260 }, { description: "Window Cleaning (interior)", quantity: 8, unit_price: 10, total: 80 }] },
  { invoice_number: "INV-1007", client_name: "David Wright", client_email: "d.wright@email.com", client_address: "45 Cedar Court", issue_date: "2025-01-20", due_date: "2025-02-03", subtotal: 750, tax_rate: 8, tax_amount: 60, total: 810, status: "overdue", notes: "Post-construction heavy dust removal.", items: [{ description: "Post-Construction Clean", quantity: 1, unit_price: 600, total: 600 }, { description: "Heavy Dust Removal Surcharge", quantity: 1, unit_price: 150, total: 150 }] },
  { invoice_number: "INV-1008", client_name: "Bright Smiles Dental", client_email: "office@brightsmiles.com", client_address: "221 Health Center Dr", issue_date: "2025-02-08", due_date: "2025-02-22", subtotal: 420, tax_rate: 8, tax_amount: 33.6, total: 453.6, status: "paid", notes: "HIPAA compliant sterilization.", items: [{ description: "Medical Office Clean", quantity: 1, unit_price: 350, total: 350 }, { description: "Sterilization Protocol", quantity: 1, unit_price: 70, total: 70 }] },
];

export async function seedInvoicesIfEmpty(userId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (error || (data && data.length > 0)) return;

  for (const inv of DEMO_INVOICES) {
    const { items, ...invoiceData } = inv;
    const { data: inserted, error: insertErr } = await supabase
      .from("invoices")
      .insert({ ...invoiceData, user_id: userId })
      .select("id")
      .single();

    if (!insertErr && inserted) {
      const lineItems = items.map((item) => ({ ...item, invoice_id: inserted.id }));
      await supabase.from("invoice_items").insert(lineItems);
    }
  }
}
