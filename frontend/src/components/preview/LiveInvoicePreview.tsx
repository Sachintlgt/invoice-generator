import React from 'react';
import {
  MapPin,
  Mail,
  Phone,
  User,
  Calendar,
  FileText,
  Info,
} from 'lucide-react';
import type { Invoice } from '../../types/invoice';
import { formatCurrency } from '../../lib/calculations';
import { DEFAULT_LOGO_DATA_URL } from '../../lib/constants';

interface LiveInvoicePreviewProps {
  invoice: Invoice;
  previewMode?: 'desktop' | 'mobile';
  zoom?: number;
}

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.includes('-') ? dateStr.split('-') : [];
    let d: Date;
    if (parts.length === 3 && parts[0].length === 4) {
      // YYYY-MM-DD
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else if (parts.length === 3 && parts[0].length === 2) {
      // DD-MM-YYYY format
      d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else {
      d = new Date(dateStr);
    }
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export const LiveInvoicePreview: React.FC<LiveInvoicePreviewProps> = ({
  invoice,
  previewMode = 'desktop',
}) => {
  const visibleCustomFields = (invoice.custom_fields || []).filter(
    (cf) => cf.is_visible && cf.label
  );

  return (
    <div className="w-full flex justify-center py-1 sm:py-2">
      <div
        className={`w-full transition-all duration-200 ${
          previewMode === 'mobile' ? 'max-w-[440px]' : 'max-w-3xl'
        }`}
      >
        {/* Printable Paper Document Container */}
        <div
          id="invoice-printable-document"
          className="invoice-print-container bg-white text-slate-800 rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/80 p-6 sm:p-8 md:p-10"
        >
          {/* Header Row: Business Info (Left) & INVOICE + Metadata Card (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Top Left: Logo + Business Name + Tagline + Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3.5">
                {/* Logo */}
                <div className="w-14 h-14 rounded-2xl bg-blue-50/50 border border-blue-100/60 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
                  {invoice.business_logo ? (
                    <img
                      src={invoice.business_logo}
                      alt={invoice.business_name || 'Business Logo'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={DEFAULT_LOGO_DATA_URL}
                      alt="Business Logo"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Name & Tagline */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                    {invoice.business_name || 'Vishal Tech Solutions'}
                  </h2>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">
                    {invoice.business_subtitle || 'Innovative Solutions for a Better Tomorrow'}
                  </p>
                </div>
              </div>

              {/* Business Contact: Address, Email, Phone */}
              <div className="space-y-1 text-xs text-slate-600 pl-0.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {invoice.business_address ||
                      '123 Business Street, Chandigarh, India - 160001'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{invoice.business_email || 'hello@vishaltech.com'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{invoice.business_phone || '+91 98765 43210'}</span>
                </div>
              </div>
            </div>

            {/* Top Right: INVOICE title & Meta Card */}
            <div className="flex flex-col sm:items-end">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-slate-900 uppercase">
                INVOICE
              </h1>

              {/* Soft Light Blue Meta Card */}
              <div className="mt-3 bg-blue-50/50 border border-blue-100/60 rounded-xl p-3.5 w-full sm:w-56 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-normal">Invoice No:</span>
                  <span className="font-bold text-blue-600">
                    {invoice.invoice_number || 'INV-006'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-normal">Issue Date:</span>
                  <span className="font-medium text-slate-800">
                    {formatDateDisplay(invoice.issue_date) || '20 Oct 2026'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-normal">Due Date:</span>
                  <span className="font-medium text-slate-800">
                    {formatDateDisplay(invoice.due_date) || '27 Oct 2026'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Bill To (Left) & Payment Terms & Notes (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 sm:mt-8 items-start">
            {/* Bill To Customer Information */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100/60 flex items-center justify-center text-blue-600 shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block leading-tight">
                    Bill To
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">
                    {invoice.customer_name || 'Acme Solutions'}
                  </h3>
                </div>
              </div>

              <div className="pl-12 space-y-1 text-xs text-slate-600">
                <p className="whitespace-pre-line leading-relaxed">
                  {invoice.customer_address || '456 Client Road,\nMumbai, India - 400001'}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{invoice.customer_email || 'client@acmesolutions.com'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{invoice.customer_phone || '+91 91234 56789'}</span>
                </div>
              </div>
            </div>

            {/* Right: Payment Terms & Notes Card */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 sm:p-5 space-y-3.5">
              {/* Payment Terms */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100/60 flex items-center justify-center text-blue-600 shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 block leading-tight">
                    Payment Terms
                  </span>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {invoice.payment_terms || 'Net 7 Days'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100/60 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 block leading-tight">
                    Notes
                  </span>
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mt-0.5">
                    {invoice.notes ||
                      'Payment is due within 7 days.\nThank you for your business!'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Line Items Table */}
          <div className="mt-6 sm:mt-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-blue-50/50 text-slate-600 font-semibold text-xs border-b border-blue-100/40">
                    <th className="py-2.5 pl-4 w-10 text-slate-600 font-semibold rounded-l-xl">#</th>
                    <th className="py-2.5 px-3 text-slate-600 font-semibold">Description</th>
                    <th className="py-2.5 px-3 text-center text-slate-600 font-semibold w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right text-slate-600 font-semibold w-28">Unit Price</th>
                    <th className="py-2.5 px-3 text-right text-slate-600 font-semibold w-24">Discount</th>
                    <th className="py-2.5 pr-4 text-right text-slate-600 font-semibold w-28 rounded-r-xl">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/90">
                  {(invoice.items && invoice.items.length > 0 ? invoice.items : [
                    { description: 'Website Development', quantity: 2, unit_price: 500, discount: 0, line_total: 1000 },
                    { description: 'Hosting Setup', quantity: 1, unit_price: 250, discount: 10, line_total: 240 },
                    { description: 'SEO Optimization', quantity: 1, unit_price: 300, discount: 0, line_total: 300 },
                  ]).map((item, idx) => (
                    <tr key={idx} className="print-break-inside-avoid">
                      <td className="py-3 pl-4 text-slate-500 font-normal">{idx + 1}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {item.description || 'Service item'}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 font-normal">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-700 font-normal">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-normal">
                        {item.discount && item.discount > 0 ? formatCurrency(item.discount) : '$0.00'}
                      </td>
                      <td className="py-3 pr-4 text-right font-bold text-slate-900">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 4: Additional Information (Left) and Financial Totals (Right) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 sm:mt-8 items-start">
            {/* Left: Additional Information Card */}
            <div className="bg-blue-50/30 border border-blue-100/60 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <h4 className="text-xs font-bold text-slate-900">Additional Information</h4>
              </div>

              <div className="space-y-1.5 text-xs">
                {visibleCustomFields.length > 0 ? (
                  visibleCustomFields.map((cf, idx) => (
                    <div key={idx} className="flex items-baseline gap-2">
                      <span className="text-slate-500 font-normal w-28 shrink-0">{cf.label}:</span>
                      <span className="font-semibold text-slate-900">{cf.value}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-500 font-normal w-28 shrink-0">Project Name:</span>
                      <span className="font-semibold text-slate-900">Company Website Redesign</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-500 font-normal w-28 shrink-0">Payment Terms:</span>
                      <span className="font-semibold text-slate-900">{invoice.payment_terms || 'Net 7 Days'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Financial Totals Breakdown & Grand Total Banner */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 px-1">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 px-1">
                <span>Discount</span>
                <span className="font-medium text-slate-900">
                  {invoice.discount > 0 ? `-${formatCurrency(invoice.discount)}` : '$0.00'}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 px-1">
                <span>Tax ({invoice.tax_rate}%)</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.tax_amount)}</span>
              </div>

              {/* Grand Total Pill Box */}
              <div className="bg-blue-50/80 border border-blue-100/60 rounded-xl p-3 sm:p-3.5 flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-slate-900">Grand Total</span>
                <span className="text-lg sm:text-xl font-bold text-blue-600">
                  {formatCurrency(invoice.grand_total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
