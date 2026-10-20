export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number; // per-item discount in USD
  line_total: number;
  order_index?: number;
}

export interface CustomField {
  id?: string;
  invoice_id?: string;
  label: string;
  value: string;
  is_visible: boolean;
  order_index?: number;
}

export interface Invoice {
  id?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  notes: string;
  payment_terms: string;
  currency: string;

  // Business Information
  business_name: string;
  business_subtitle?: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  business_logo?: string;

  // Customer Information
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;

  // Financial Settings & Totals
  discount: number; // fixed discount in USD
  tax_rate: number;
  subtotal: number;
  tax_amount: number;
  grand_total: number;

  // Nested collections
  items: InvoiceItem[];
  custom_fields: CustomField[];

  created_at?: string;
  updated_at?: string;
}

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  customer_name?: string;
  customer_email?: string;
  issue_date: string;
  due_date?: string;
  status: InvoiceStatus;
  grand_total: number;
  created_at?: string;
}

export interface CalculationResult {
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
}
