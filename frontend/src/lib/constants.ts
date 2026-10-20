import type { Invoice, InvoiceStatus } from '../types/invoice';

export const DEFAULT_LOGO_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%233B82F6"/><stop offset="100%" stop-color="%231D4ED8"/></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2360A5FA"/><stop offset="100%" stop-color="%232563EB"/></linearGradient><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231E40AF"/><stop offset="100%" stop-color="%231D4ED8"/></linearGradient></defs><path d="M40 160 L95 45 C98 39 106 39 109 45 L135 95 L80 160 Z" fill="url(%23g2)"/><path d="M100 35 C104 35 108 38 111 43 L175 150 C178 156 174 163 167 163 L115 163 L75 95 Z" fill="url(%23g1)"/><path d="M30 160 C25 160 22 154 25 149 L55 95 L115 160 Z" fill="url(%23g3)"/></svg>`;

export const STATUS_STYLES: Record<InvoiceStatus, { bg: string; text: string; dot: string; border: string }> = {
  Draft: {
    bg: 'bg-blue-50/70',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    border: 'border-blue-100',
  },
  Sent: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    border: 'border-emerald-100',
  },
  Paid: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  Overdue: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
};

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDueDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateInvoiceNumber(): string {
  return 'INV-001';
}

export function getBlankInvoice(): Invoice {
  return {
    invoice_number: 'INV-001',
    issue_date: getTodayDateString(),
    due_date: getDueDateString(),
    status: 'Draft',
    notes: '',
    payment_terms: 'Net 7 Days',
    currency: 'USD',

    business_name: '',
    business_subtitle: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    business_logo: '',

    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',

    discount: 0.0,
    tax_rate: 0.0,
    subtotal: 0.0,
    tax_amount: 0.0,
    grand_total: 0.0,

    items: [
      {
        description: '',
        quantity: 1,
        unit_price: 0.0,
        discount: 0.0,
        line_total: 0.0,
      },
    ],
    custom_fields: [],
  };
}
