import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Printer,
  Mail,
  Trash2,
  FileText,
  Building2,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import type { Invoice, InvoiceStatus } from '../../types/invoice';
import { STATUS_STYLES } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/calculations';
import { fetchInvoice, getErrorMessage } from '../../lib/api';
import { LiveInvoicePreview } from '../preview/LiveInvoicePreview';

interface InvoiceDetailsDrawerProps {
  isOpen: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onSendEmail: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export const InvoiceDetailsDrawer: React.FC<InvoiceDetailsDrawerProps> = ({
  isOpen,
  invoiceId,
  onClose,
  onEditInvoice,
  onPrintInvoice,
  onSendEmail,
  onDeleteInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'activity'>('overview');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch full invoice when invoiceId changes
  useEffect(() => {
    if (!isOpen || !invoiceId) {
      setInvoice(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchInvoice(invoiceId)
      .then((data) => {
        if (isMounted) setInvoice(data);
      })
      .catch((err) => {
        if (isMounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, invoiceId]);

  if (!isOpen) return null;

  const statusStyle = invoice?.status
    ? STATUS_STYLES[invoice.status as InvoiceStatus] || STATUS_STYLES.Draft
    : STATUS_STYLES.Draft;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <aside className="w-screen max-w-xl sm:max-w-2xl bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200/90 animate-in slide-in-from-right duration-200">
          {/* Top Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
            {/* Row 1: Status on left, Close button on right */}
            <div className="flex items-center justify-between mb-2.5">
              {invoice ? (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                  <span>{invoice.status}</span>
                </span>
              ) : (
                <span className="text-xs text-slate-400">Loading invoice...</span>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Row 2: Invoice Number, Grand Total, and Customer Name */}
            {isLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-6 bg-slate-100 rounded w-36" />
                <div className="h-4 bg-slate-100 rounded w-48" />
              </div>
            ) : invoice ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {invoice.invoice_number}
                  </h2>
                  <p className="font-semibold text-sm text-slate-800 mt-0.5">
                    {invoice.customer_name || 'Customer'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {invoice.customer_email || 'No email provided'}
                    {invoice.customer_phone ? ` • ${invoice.customer_phone}` : ''}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {formatCurrency(invoice.grand_total)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Due {formatDate(invoice.due_date)}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Row 3: Tabs Bar */}
            <div className="flex items-center gap-6 mt-5 -mb-5 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Invoice Preview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'activity'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Activity
              </button>
            </div>
          </div>

          {/* Middle: Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50 space-y-4">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-white rounded-xl border border-slate-200" />
                <div className="h-32 bg-white rounded-xl border border-slate-200" />
                <div className="h-44 bg-white rounded-xl border border-slate-200" />
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                Failed to load invoice: {error}
              </div>
            ) : invoice ? (
              <>
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Card 1: Invoice Details */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-xs text-slate-900">Invoice Details</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => onEditInvoice(invoice)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 text-xs">
                        <span className="text-slate-500">Invoice Number</span>
                        <span className="font-semibold text-slate-900">{invoice.invoice_number}</span>

                        <span className="text-slate-500">Issue Date</span>
                        <span className="text-slate-800">{formatDate(invoice.issue_date)}</span>

                        <span className="text-slate-500">Due Date</span>
                        <span className="text-slate-800">{formatDate(invoice.due_date)}</span>

                        <span className="text-slate-500">Status</span>
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            <span className={`w-1 h-1 rounded-full ${statusStyle.dot}`} />
                            <span>{invoice.status}</span>
                          </span>
                        </div>

                        {invoice.payment_terms && (
                          <>
                            <span className="text-slate-500">Payment Terms</span>
                            <span className="text-slate-800">{invoice.payment_terms}</span>
                          </>
                        )}

                        {invoice.notes && (
                          <>
                            <span className="text-slate-500">Notes</span>
                            <span className="text-slate-700 whitespace-pre-line leading-relaxed">
                              {invoice.notes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Card 2: Business Information */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-xs text-slate-900">Business Information</h4>
                        </div>
                        {invoice.business_logo && (
                          <div className="w-8 h-8 rounded border border-slate-100 flex items-center justify-center p-0.5">
                            <img
                              src={invoice.business_logo}
                              alt="Logo"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        )}
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-slate-900">
                          {invoice.business_name || 'Your Business Name'}
                        </p>
                        {invoice.business_subtitle && (
                          <p className="text-[11px] text-slate-400">{invoice.business_subtitle}</p>
                        )}
                        {invoice.business_address && (
                          <p className="text-slate-500 whitespace-pre-line mt-1">
                            {invoice.business_address}
                          </p>
                        )}
                        <div className="text-slate-500 pt-1 space-y-0.5">
                          {invoice.business_email && <p>{invoice.business_email}</p>}
                          {invoice.business_phone && <p>{invoice.business_phone}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Customer Information */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-xs text-slate-900">Customer Information</h4>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-slate-900">
                          {invoice.customer_name || 'Customer Name'}
                        </p>
                        {invoice.customer_address && (
                          <p className="text-slate-500 whitespace-pre-line mt-1">
                            {invoice.customer_address}
                          </p>
                        )}
                        <div className="text-slate-500 pt-1 space-y-0.5">
                          {invoice.customer_email && <p>{invoice.customer_email}</p>}
                          {invoice.customer_phone && <p>{invoice.customer_phone}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Line Items */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-xs text-slate-900">Line Items</h4>
                        </div>
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                          {invoice.items?.length || 0}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 text-xs">
                        {(invoice.items || []).map((item, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.description || 'Item description'}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {item.quantity} × {formatCurrency(item.unit_price)}
                                {item.discount && item.discount > 0
                                  ? ` (-${formatCurrency(item.discount)} disc)`
                                  : ''}
                              </p>
                            </div>
                            <span className="font-bold text-slate-900">
                              {formatCurrency(item.line_total)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Financial Totals Breakdown */}
                      <div className="pt-3 mt-3 border-t border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Discount</span>
                          <span className="font-medium text-slate-900">
                            {invoice.discount > 0 ? `-${formatCurrency(invoice.discount)}` : '$0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Tax ({invoice.tax_rate}%)</span>
                          <span className="font-medium text-slate-900">{formatCurrency(invoice.tax_amount)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                          <span className="text-slate-900">Grand Total</span>
                          <span className="text-blue-600 text-base">{formatCurrency(invoice.grand_total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 5: Custom Fields (if present) */}
                    {invoice.custom_fields && invoice.custom_fields.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
                        <div className="flex items-center gap-2 mb-3">
                          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-xs text-slate-900">Custom Fields</h4>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {invoice.custom_fields.map((cf, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-slate-500">{cf.label}</span>
                              <span className="font-medium text-slate-900">{cf.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: INVOICE PREVIEW */}
                {activeTab === 'preview' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                      <span>Live Rendered Document</span>
                      <button
                        type="button"
                        onClick={() => onPrintInvoice(invoice)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Open Clean Print View</span>
                      </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 p-2 overflow-hidden shadow-xs">
                      <LiveInvoicePreview invoice={invoice} previewMode="desktop" />
                    </div>
                  </div>
                )}

                {/* TAB 3: ACTIVITY */}
                {activeTab === 'activity' && (
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                    <h4 className="font-bold text-xs text-slate-900">Activity Timeline</h4>
                    <div className="relative pl-6 space-y-5 border-l-2 border-slate-100 text-xs">
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                        <p className="font-semibold text-slate-900">Invoice Created</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {invoice.created_at ? new Date(invoice.created_at).toLocaleString() : formatDate(invoice.issue_date)}
                        </p>
                      </div>

                      {invoice.status === 'Sent' && (
                        <div className="relative">
                          <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                          <p className="font-semibold text-slate-900">Delivered via Email</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            Status updated to Sent
                          </p>
                        </div>
                      )}

                      {invoice.status === 'Paid' && (
                        <div className="relative">
                          <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-50" />
                          <p className="font-semibold text-slate-900">Payment Completed</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">
                            Full invoice amount paid
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Fixed Drawer Bottom Actions Bar */}
          <div className="p-4 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 sticky bottom-0 z-10">
            {invoice && (
              <>
                <button
                  type="button"
                  onClick={() => onEditInvoice(invoice)}
                  className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPrintInvoice(invoice)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Print / Save PDF</span>
                  <span className="sm:hidden">Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSendEmail(invoice)}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Send Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteInvoice(invoice.id || '')}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                  title="Delete invoice"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
