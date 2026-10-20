import React, { useState } from 'react';
import { ArrowLeft, Monitor, Smartphone, CheckCircle2 } from 'lucide-react';
import type { Invoice, InvoiceItem, CustomField } from '../../types/invoice';
import { InvoiceDetailsCard } from './InvoiceDetailsCard';
import { BusinessInfoCard } from './BusinessInfoCard';
import { CustomerInfoCard } from './CustomerInfoCard';
import { LineItemsCard } from './LineItemsCard';
import { CustomFieldsCard } from './CustomFieldsCard';
import { DiscountTaxCard } from './DiscountTaxCard';
import { LiveInvoicePreview } from '../preview/LiveInvoicePreview';
import { BottomActionBar } from '../BottomActionBar';

interface FullInvoiceEditorProps {
  invoice: Invoice;
  isNew: boolean;
  onUpdateInvoice: (patch: Partial<Invoice>) => void;
  onSave: () => Promise<void>;
  onSendEmail: () => void;
  onPrint: () => void;
  onReset: () => void;
  onBack: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export const FullInvoiceEditor: React.FC<FullInvoiceEditorProps> = ({
  invoice,
  isNew,
  onUpdateInvoice,
  onSave,
  onSendEmail,
  onPrint,
  onReset,
  onBack,
  isSaving,
  hasUnsavedChanges,
}) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
      {/* Top Editor Bar */}
      <header className="no-print bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          {/* Left: Back Button & Branding/Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Invoices</span>
            </button>

            <div className="hidden md:block h-5 w-px bg-slate-200" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
                  {isNew ? 'Create New Invoice' : `Edit Invoice: ${invoice.invoice_number}`}
                </h1>
                {hasUnsavedChanges ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Unsaved changes
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Update invoice details and preview changes in real time.
              </p>
            </div>
          </div>

          {/* Right: Preview Mode Toggle (Desktop / Mobile) */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  previewMode === 'desktop'
                    ? 'bg-white font-semibold text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  previewMode === 'mobile'
                    ? 'bg-white font-semibold text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split Studio: Left Editor + Right Live Document Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Editor Cards */}
        <main className="no-print flex-1 overflow-y-auto px-4 sm:px-6 py-5 border-r border-slate-200/80 bg-[#F8FAFC]">
          <div className="max-w-2xl mx-auto space-y-4 pb-12">
            {/* Card 1: Invoice Details */}
            <InvoiceDetailsCard
              invoiceNumber={invoice.invoice_number}
              issueDate={invoice.issue_date}
              dueDate={invoice.due_date}
              status={invoice.status}
              paymentTerms={invoice.payment_terms}
              notes={invoice.notes}
              onChange={onUpdateInvoice}
            />

            {/* Card 2: Business Information */}
            <BusinessInfoCard
              businessName={invoice.business_name}
              businessEmail={invoice.business_email}
              businessPhone={invoice.business_phone}
              businessAddress={invoice.business_address}
              businessLogo={invoice.business_logo}
              onChange={onUpdateInvoice}
            />

            {/* Card 3: Customer Information */}
            <CustomerInfoCard
              customerName={invoice.customer_name}
              customerEmail={invoice.customer_email}
              customerPhone={invoice.customer_phone}
              customerAddress={invoice.customer_address}
              onChange={onUpdateInvoice}
            />

            {/* Card 4: Invoice Line Items */}
            <LineItemsCard
              items={invoice.items || []}
              onChange={(items: InvoiceItem[]) => onUpdateInvoice({ items })}
            />

            {/* Cards 5 & 6: Side-by-side Custom Fields & Discount/Tax */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <CustomFieldsCard
                customFields={invoice.custom_fields || []}
                onChange={(custom_fields: CustomField[]) => onUpdateInvoice({ custom_fields })}
              />

              <DiscountTaxCard
                discount={invoice.discount}
                taxRate={invoice.tax_rate}
                subtotal={invoice.subtotal}
                calculatedDiscount={invoice.discount}
                calculatedTax={invoice.tax_amount}
                grandTotal={invoice.grand_total}
                onChange={onUpdateInvoice}
              />
            </div>

            {/* Bottom Action Bar */}
            <BottomActionBar
              onSave={onSave}
              onSendEmail={onSendEmail}
              onPrint={onPrint}
              onReset={onReset}
              isSaving={isSaving}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>
        </main>

        {/* Right Column: Live Document Preview */}
        <aside className="hidden xl:flex flex-1 flex-col overflow-y-auto bg-slate-50/60 p-6 pb-16">
          <div className="max-w-2xl w-full mx-auto flex flex-col">
            <LiveInvoicePreview
              invoice={invoice}
              previewMode={previewMode}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};
