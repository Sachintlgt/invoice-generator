import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FilePlus2,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Upload,
  Calendar,
  Loader2,
  FileText,
  Save,
  Printer,
  AlertCircle,
} from 'lucide-react';
import type { Invoice, InvoiceItem, CustomField } from '../../types/invoice';
import { calculateTotals, formatCurrency } from '../../lib/calculations';
import { getBlankInvoice } from '../../lib/constants';
import { LiveInvoicePreview } from '../preview/LiveInvoicePreview';

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

function parseDateValue(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.includes('-') ? dateStr.split('-') : [];
  if (parts.length === 3 && parts[0].length === 4) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function validateInvoiceForm(inv: Invoice, isDraft: boolean): Record<string, string> {
  const errors: Record<string, string> = {};

  // Invoice Number
  if (!inv.invoice_number || !inv.invoice_number.trim()) {
    errors.invoice_number = 'Invoice number is required.';
  }

  // Issue Date
  if (!inv.issue_date || !inv.issue_date.trim()) {
    errors.issue_date = 'Issue date is required.';
  }

  // Due Date (required if not draft)
  if (!isDraft) {
    if (!inv.due_date || !inv.due_date.trim()) {
      errors.due_date = 'Due date is required.';
    }
  }

  // Due date must be >= Issue date
  if (inv.issue_date && inv.due_date) {
    const issue = parseDateValue(inv.issue_date);
    const due = parseDateValue(inv.due_date);
    if (issue && due && due < issue) {
      errors.due_date = 'Due date cannot be earlier than issue date.';
    }
  }

  // Business Name
  if (!isDraft) {
    if (!inv.business_name || !inv.business_name.trim()) {
      errors.business_name = 'Business name is required.';
    }
  }

  // Business Email
  if (inv.business_email && inv.business_email.trim()) {
    if (!EMAIL_REGEX.test(inv.business_email.trim())) {
      errors.business_email = 'Please enter a valid business email address.';
    }
  }

  // Customer Name
  if (!isDraft) {
    if (!inv.customer_name || !inv.customer_name.trim()) {
      errors.customer_name = 'Customer name is required.';
    }
  }

  // Customer Email
  if (inv.customer_email && inv.customer_email.trim()) {
    if (!EMAIL_REGEX.test(inv.customer_email.trim())) {
      errors.customer_email = 'Please enter a valid customer email address.';
    }
  }

  // Line items
  if (!isDraft) {
    if (!inv.items || inv.items.length === 0) {
      errors.items = 'At least one line item is required.';
    } else {
      inv.items.forEach((item, idx) => {
        if (!item.description || !item.description.trim()) {
          errors[`item_${idx}_desc`] = 'Description is required.';
        }
        if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
          errors[`item_${idx}_qty`] = 'Quantity must be > 0.';
        }
        if (typeof item.unit_price !== 'number' || isNaN(item.unit_price) || item.unit_price < 0) {
          errors[`item_${idx}_price`] = 'Unit price must be ≥ 0.';
        }
        if (typeof item.discount === 'number' && item.discount < 0) {
          errors[`item_${idx}_discount`] = 'Discount cannot be negative.';
        } else if (
          typeof item.discount === 'number' &&
          typeof item.quantity === 'number' &&
          typeof item.unit_price === 'number' &&
          item.discount > item.quantity * item.unit_price
        ) {
          errors[`item_${idx}_discount`] = 'Discount exceeds line total.';
        }
      });
    }
  } else {
    if (inv.items && inv.items.length > 0) {
      inv.items.forEach((item, idx) => {
        if (typeof item.quantity === 'number' && item.quantity < 0) {
          errors[`item_${idx}_qty`] = 'Quantity cannot be negative.';
        }
        if (typeof item.unit_price === 'number' && item.unit_price < 0) {
          errors[`item_${idx}_price`] = 'Unit price cannot be negative.';
        }
        if (typeof item.discount === 'number' && item.discount < 0) {
          errors[`item_${idx}_discount`] = 'Discount cannot be negative.';
        }
      });
    }
  }

  // Invoice-level discount
  if (typeof inv.discount === 'number' && inv.discount < 0) {
    errors.discount = 'Discount cannot be negative.';
  }

  // Invoice-level tax rate
  if (typeof inv.tax_rate === 'number' && (inv.tax_rate < 0 || inv.tax_rate > 100)) {
    errors.tax_rate = 'Tax rate must be between 0% and 100%.';
  }

  return errors;
}

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Invoice) => Promise<void>;
  defaultInvoiceNumber?: string;
  initialInvoice?: Invoice | null;
  mode?: 'create' | 'edit';
  isSaving: boolean;
}

export const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultInvoiceNumber,
  initialInvoice,
  mode = initialInvoice ? 'edit' : 'create',
  isSaving,
}) => {
  const [invoice, setInvoice] = useState<Invoice>(() => {
    if (initialInvoice) return JSON.parse(JSON.stringify(initialInvoice));
    const blank = getBlankInvoice();
    if (defaultInvoiceNumber) blank.invoice_number = defaultInvoiceNumber;
    return blank;
  });
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearError = (key: string) => {
    setValidationErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Initialize invoice when modal opens or initialInvoice changes
  useEffect(() => {
    if (isOpen) {
      setValidationErrors({});
      if (initialInvoice) {
        const cloned = JSON.parse(JSON.stringify(initialInvoice));
        if (cloned.issue_date && typeof cloned.issue_date === 'string' && cloned.issue_date.includes('T')) {
          cloned.issue_date = cloned.issue_date.split('T')[0];
        }
        if (cloned.due_date && typeof cloned.due_date === 'string' && cloned.due_date.includes('T')) {
          cloned.due_date = cloned.due_date.split('T')[0];
        }
        setInvoice(cloned);
      } else {
        const blank = getBlankInvoice();
        if (defaultInvoiceNumber) {
          blank.invoice_number = defaultInvoiceNumber;
        }
        setInvoice(blank);
      }
      setActiveTab('details');
    }
  }, [isOpen, initialInvoice, defaultInvoiceNumber]);

  if (!isOpen) return null;

  // Real-time calculation sync
  const updateInvoiceState = (patch: Partial<Invoice>) => {
    setInvoice((prev) => {
      const next = { ...prev, ...patch };
      const totals = calculateTotals(
        next.items || [],
        next.discount ?? 0,
        next.tax_rate ?? 0
      );

      return {
        ...next,
        items: totals.items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax_rate: totals.tax_rate,
        tax_amount: totals.tax_amount,
        grand_total: totals.grand_total,
      };
    });
  };

  // Line Items handlers
  const handleItemChange = (index: number, patch: Partial<InvoiceItem>) => {
    const nextItems = [...(invoice.items || [])];
    nextItems[index] = { ...nextItems[index], ...patch };
    updateInvoiceState({ items: nextItems });

    // Clear item-specific error keys
    clearError('items');
    clearError(`item_${index}_desc`);
    clearError(`item_${index}_qty`);
    clearError(`item_${index}_price`);
    clearError(`item_${index}_discount`);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      line_total: 0,
    };
    clearError('items');
    updateInvoiceState({ items: [...(invoice.items || []), newItem] });
  };

  const handleRemoveItem = (index: number) => {
    const nextItems = (invoice.items || []).filter((_, i) => i !== index);
    setValidationErrors({});
    updateInvoiceState({ items: nextItems });
  };

  // Custom Fields handlers
  const handleCustomFieldChange = (index: number, patch: Partial<CustomField>) => {
    const nextFields = [...(invoice.custom_fields || [])];
    nextFields[index] = { ...nextFields[index], ...patch };
    updateInvoiceState({ custom_fields: nextFields });
  };

  const handleAddCustomField = () => {
    const newField: CustomField = {
      label: '',
      value: '',
      is_visible: true,
    };
    updateInvoiceState({ custom_fields: [...(invoice.custom_fields || []), newField] });
  };

  const handleRemoveCustomField = (index: number) => {
    const nextFields = (invoice.custom_fields || []).filter((_, i) => i !== index);
    updateInvoiceState({ custom_fields: nextFields });
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('File size exceeds 1MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        updateInvoiceState({ business_logo: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Invoice (handles both Draft and Final with client-side validation)
  const handleSaveInvoice = async (isDraft: boolean) => {
    const errors = validateInvoiceForm(invoice, isDraft);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setActiveTab('details');
      return;
    }

    setValidationErrors({});
    if (isDraft) {
      const draftInvoice = { ...invoice, status: 'Draft' as const };
      await onSave(draftInvoice);
    } else {
      await onSave(invoice);
    }
  };

  // Handle Print
  const handlePrint = () => {
    if (activeTab !== 'preview') {
      setActiveTab('preview');
      setTimeout(() => window.print(), 100);
    } else {
      window.print();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveInvoice(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:static print:overflow-visible">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 no-print"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="min-h-full flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 bg-white flex items-center justify-between sticky top-0 z-20 no-print">
            {/* Left: Icon + Title + Subtitle */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                {mode === 'edit' ? <Edit3 className="w-5 h-5" /> : <FilePlus2 className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                  {mode === 'edit'
                    ? `Edit Invoice #${invoice.invoice_number || ''}`
                    : 'New Invoice'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {mode === 'edit'
                    ? 'Update your business, customer, line items, and terms.'
                    : 'Create a new invoice with your business and customer details.'}
                </p>
              </div>
            </div>

            {/* Right: Details / Preview Switcher + Close Button */}
            <div className="flex items-center gap-3">
              {/* Tab Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'details'
                      ? 'bg-white text-blue-600 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-white text-blue-600 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8FAFC] print:p-0 print:bg-white print:overflow-visible">
            {activeTab === 'details' ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Global Validation Error Banner */}
                {Object.keys(validationErrors).length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start gap-3 text-xs shadow-2xs animate-in fade-in duration-150">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-rose-900 text-xs">
                        Please correct the following before saving:
                      </p>
                      <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-[11px] text-rose-700">
                        {Object.values(validationErrors).slice(0, 3).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {Object.keys(validationErrors).length > 3 && (
                          <li className="font-medium text-rose-800">
                            + {Object.keys(validationErrors).length - 3} other issue(s) highlighted below
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 1. Invoice Details Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          Invoice Details
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Basic information about this invoice.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveInvoice(true)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Save className="w-3 h-3 text-slate-500" />
                      <span>Save as Draft</span>
                    </button>
                  </div>

                  {/* Row 1: Invoice Number, Issue Date, Due Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Invoice Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={invoice.invoice_number}
                        onChange={(e) => {
                          clearError('invoice_number');
                          updateInvoiceState({ invoice_number: e.target.value });
                        }}
                        placeholder="INV-001"
                        className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                          validationErrors.invoice_number
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                            : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                      {validationErrors.invoice_number && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {validationErrors.invoice_number}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Issue Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={invoice.issue_date}
                          onChange={(e) => {
                            clearError('issue_date');
                            clearError('due_date');
                            updateInvoiceState({ issue_date: e.target.value });
                          }}
                          className={`w-full pl-3 pr-8 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                            validationErrors.issue_date
                              ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                              : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {validationErrors.issue_date && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {validationErrors.issue_date}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={invoice.due_date}
                          onChange={(e) => {
                            clearError('due_date');
                            updateInvoiceState({ due_date: e.target.value });
                          }}
                          className={`w-full pl-3 pr-8 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                            validationErrors.due_date
                              ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                              : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {validationErrors.due_date && (
                        <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {validationErrors.due_date}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Notes (optional) with character counter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Notes (optional)
                    </label>
                    <div className="relative">
                      <textarea
                        rows={2}
                        maxLength={500}
                        value={invoice.notes}
                        onChange={(e) => updateInvoiceState({ notes: e.target.value })}
                        placeholder="Payment is due within 7 days. Thank you for your business!"
                        className="w-full px-3 py-1.5 pb-5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                      />
                      <span className="absolute right-2.5 bottom-1 text-[10px] text-slate-400 pointer-events-none">
                        {(invoice.notes || '').length}/500
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Business Information Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
                  <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        Business Information
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Your business details will appear on the invoice.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* Left side: Business Fields (2 cols) */}
                    <div className="lg:col-span-2 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Business Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={invoice.business_name}
                            onChange={(e) => {
                              clearError('business_name');
                              updateInvoiceState({ business_name: e.target.value });
                            }}
                            placeholder="Tech Solutions"
                            className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                              validationErrors.business_name
                                ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                                : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          />
                          {validationErrors.business_name && (
                            <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              {validationErrors.business_name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={invoice.business_email}
                            onChange={(e) => {
                              clearError('business_email');
                              updateInvoiceState({ business_email: e.target.value });
                            }}
                            placeholder="hello@tech.com"
                            className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                              validationErrors.business_email
                                ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                                : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          />
                          {validationErrors.business_email && (
                            <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              {validationErrors.business_email}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={invoice.business_phone}
                            onChange={(e) => updateInvoiceState({ business_phone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Address
                        </label>
                        <textarea
                          rows={2}
                          value={invoice.business_address}
                          onChange={(e) => updateInvoiceState({ business_address: e.target.value })}
                          placeholder="123 Business Street,&#10;Chandigarh, India - 160001"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                        />
                      </div>
                    </div>

                    {/* Right side: Business Logo Upload Box */}
                    <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 mb-2 text-slate-700 font-semibold text-[11px]">
                        <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                          <FileText className="w-3 h-3" />
                        </div>
                        <span>Business Logo</span>
                      </div>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-blue-200 rounded-xl p-3 bg-white flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50/30 transition-colors"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />

                        {invoice.business_logo ? (
                          <div className="relative group">
                            <img
                              src={invoice.business_logo}
                              alt="Business logo"
                              className="h-10 w-auto object-contain mx-auto mb-1"
                            />
                            <p className="text-[10px] text-blue-600 font-medium">Click to replace</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-[11px] text-slate-800">
                              Upload Logo
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              PNG, JPG, SVG (Max 1MB)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Customer Information Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
                  <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        Customer Information
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Your customer's details will appear on the invoice.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Customer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={invoice.customer_name}
                          onChange={(e) => {
                            clearError('customer_name');
                            updateInvoiceState({ customer_name: e.target.value });
                          }}
                          placeholder="Acme Solutions"
                          className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                            validationErrors.customer_name
                              ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                              : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        {validationErrors.customer_name && (
                          <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {validationErrors.customer_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={invoice.customer_email}
                          onChange={(e) => {
                            clearError('customer_email');
                            updateInvoiceState({ customer_email: e.target.value });
                          }}
                          placeholder="client@acmesolutions.com"
                          className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                            validationErrors.customer_email
                              ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                              : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                        />
                        {validationErrors.customer_email && (
                          <p className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {validationErrors.customer_email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Phone (optional)
                        </label>
                        <input
                          type="tel"
                          value={invoice.customer_phone}
                          onChange={(e) => updateInvoiceState({ customer_phone: e.target.value })}
                          placeholder="+91 91234 56789"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Address
                      </label>
                      <textarea
                        rows={2}
                        value={invoice.customer_address}
                        onChange={(e) => updateInvoiceState({ customer_address: e.target.value })}
                        placeholder="456 Client Road,&#10;Mumbai, India - 400001"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Invoice Items Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 sm:p-5 pb-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        4
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          Invoice Items
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Add the products or services for this invoice.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items Validation Error Banner */}
                  {validationErrors.items && (
                    <div className="mx-4 sm:mx-5 mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-medium">{validationErrors.items}</span>
                    </div>
                  )}

                  {/* Items Table */}
                  <div className="overflow-x-auto px-4 sm:px-5">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-[11px] font-semibold text-slate-500 border-b border-slate-100 select-none pb-2">
                          <th className="py-2 px-1 w-7 text-center">#</th>
                          <th className="py-2 px-2">Description <span className="text-red-500">*</span></th>
                          <th className="py-2 px-2 w-20">Quantity <span className="text-red-500">*</span></th>
                          <th className="py-2 px-2 w-28">Unit Price (USD) <span className="text-red-500">*</span></th>
                          <th className="py-2 px-2 w-28">Discount (USD)</th>
                          <th className="py-2 px-2 w-28 text-right">Line Total</th>
                          <th className="py-2 px-1 w-9 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(invoice.items || []).map((item, idx) => {
                          const hasItemError =
                            validationErrors[`item_${idx}_desc`] ||
                            validationErrors[`item_${idx}_qty`] ||
                            validationErrors[`item_${idx}_price`] ||
                            validationErrors[`item_${idx}_discount`];

                          return (
                            <React.Fragment key={idx}>
                              <tr className="group">
                                <td className="py-2.5 px-1 text-center text-slate-400 font-medium align-middle">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-2 align-middle">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(idx, { description: e.target.value })}
                                    placeholder="Website Development"
                                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                                      validationErrors[`item_${idx}_desc`]
                                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                                        : 'border-slate-200 focus:ring-blue-500'
                                    }`}
                                  />
                                </td>
                                <td className="py-2.5 px-2 align-middle">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(idx, { quantity: parseFloat(e.target.value) || 0 })}
                                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                                      validationErrors[`item_${idx}_qty`]
                                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                                        : 'border-slate-200 focus:ring-blue-500'
                                    }`}
                                  />
                                </td>
                                <td className="py-2.5 px-2 align-middle">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={item.unit_price}
                                    onChange={(e) => handleItemChange(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                                      validationErrors[`item_${idx}_price`]
                                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                                        : 'border-slate-200 focus:ring-blue-500'
                                    }`}
                                  />
                                </td>
                                <td className="py-2.5 px-2 align-middle">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={item.discount || 0}
                                    onChange={(e) => handleItemChange(idx, { discount: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                                      validationErrors[`item_${idx}_discount`]
                                        ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                                        : 'border-slate-200 focus:ring-blue-500'
                                    }`}
                                  />
                                </td>
                                <td className="py-2.5 px-2 text-right font-bold text-slate-900 align-middle whitespace-nowrap">
                                  {formatCurrency(item.line_total)}
                                </td>
                                <td className="py-2.5 px-1 text-center align-middle">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    disabled={(invoice.items || []).length <= 1}
                                    className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                              {hasItemError && (
                                <tr className="bg-rose-50/40">
                                  <td colSpan={7} className="px-3 py-1 text-[11px] text-rose-600 font-medium">
                                    <div className="flex flex-wrap items-center gap-3">
                                      {validationErrors[`item_${idx}_desc`] && (
                                        <span>• Description: {validationErrors[`item_${idx}_desc`]}</span>
                                      )}
                                      {validationErrors[`item_${idx}_qty`] && (
                                        <span>• Quantity: {validationErrors[`item_${idx}_qty`]}</span>
                                      )}
                                      {validationErrors[`item_${idx}_price`] && (
                                        <span>• Price: {validationErrors[`item_${idx}_price`]}</span>
                                      )}
                                      {validationErrors[`item_${idx}_discount`] && (
                                        <span>• Discount: {validationErrors[`item_${idx}_discount`]}</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Item Button */}
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-2.5 mt-2 border-t border-slate-100 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>

                  {/* Invoice-Level Settings: Discount & Tax Rate */}
                  <div className="bg-slate-50/80 border-t border-slate-100 p-3.5 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Fixed Discount (USD)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={invoice.discount || 0}
                            onChange={(e) => {
                              clearError('discount');
                              updateInvoiceState({ discount: parseFloat(e.target.value) || 0 });
                            }}
                            className={`w-28 px-2.5 py-1 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                              validationErrors.discount
                                ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                                : 'border-slate-200 focus:ring-blue-500'
                            }`}
                          />
                          {validationErrors.discount && (
                            <p className="text-[10px] text-rose-600 font-medium mt-0.5">{validationErrors.discount}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Tax Rate (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={invoice.tax_rate || 0}
                            onChange={(e) => {
                              clearError('tax_rate');
                              updateInvoiceState({ tax_rate: parseFloat(e.target.value) || 0 });
                            }}
                            className={`w-24 px-2.5 py-1 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-slate-900 ${
                              validationErrors.tax_rate
                                ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                                : 'border-slate-200 focus:ring-blue-500'
                            }`}
                          />
                          {validationErrors.tax_rate && (
                            <p className="text-[10px] text-rose-600 font-medium mt-0.5">{validationErrors.tax_rate}</p>
                          )}
                        </div>
                      </div>

                      {/* Financial Totals Breakdown */}
                      <div className="text-right space-y-1 text-xs text-slate-600 self-end sm:self-auto min-w-[200px]">
                        <div className="flex justify-between gap-6">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.discount > 0 && (
                          <div className="flex justify-between gap-6 text-emerald-600">
                            <span>Discount:</span>
                            <span className="font-semibold">-{formatCurrency(invoice.discount)}</span>
                          </div>
                        )}
                        {invoice.tax_rate > 0 && (
                          <div className="flex justify-between gap-6">
                            <span>Tax ({invoice.tax_rate}%):</span>
                            <span className="font-semibold text-slate-800">+{formatCurrency(invoice.tax_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-6 text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                          <span>Grand Total:</span>
                          <span className="text-blue-600">{formatCurrency(invoice.grand_total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Custom Fields Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 sm:p-5 pb-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        5
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          Custom Fields <span className="font-normal text-slate-400 text-xs">(Optional)</span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Add additional information to display on your invoice.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Custom Fields Rows */}
                  <div className="px-4 sm:px-5 space-y-2.5">
                    {(invoice.custom_fields || []).map((cf, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="w-full sm:w-1/3">
                          <input
                            type="text"
                            value={cf.label}
                            onChange={(e) => handleCustomFieldChange(idx, { label: e.target.value })}
                            placeholder="Project Name"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                          />
                        </div>

                        <div className="w-full sm:flex-1">
                          <input
                            type="text"
                            value={cf.value}
                            onChange={(e) => handleCustomFieldChange(idx, { value: e.target.value })}
                            placeholder="Company Website Redesign"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                          />
                        </div>

                        {/* Toggle Show on Invoice */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCustomFieldChange(idx, { is_visible: !cf.is_visible })}
                            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                              cf.is_visible ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                            aria-label="Toggle show on invoice"
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                cf.is_visible ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-[11px] text-slate-600 font-medium whitespace-nowrap">
                            Show on Invoice
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer ml-1"
                            title="Remove custom field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Custom Field Button */}
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="w-full py-2.5 mt-2 border-t border-slate-100 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Field</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Live Preview Document Inside Modal */
              <div className="w-full max-w-3xl mx-auto py-1">
                <LiveInvoicePreview invoice={invoice} previewMode="desktop" />
              </div>
            )}
          </div>

          {/* Sticky Modal Footer */}
          <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-slate-200/80 flex items-center justify-between sticky bottom-0 z-20 no-print">
            {/* Grand Total */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Grand Total:</span>
              <span className="text-lg sm:text-xl font-bold text-blue-600">
                {formatCurrency(invoice.grand_total)}
              </span>
            </div>

            {/* Action Buttons: Cancel, Print, Save Invoice */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveInvoice(false)}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{mode === 'edit' ? 'Update Invoice' : 'Save Invoice'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
