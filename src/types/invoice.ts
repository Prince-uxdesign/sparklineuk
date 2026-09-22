export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  client_address: string | null;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: "draft" | "unpaid" | "paid" | "overdue";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}
