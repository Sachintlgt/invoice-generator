import React from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Invoice } from '../../types/invoice';
import { LiveInvoicePreview } from './LiveInvoicePreview';

interface CleanPrintViewProps {
  invoice: Invoice;
  onBack: () => void;
}

export const CleanPrintView: React.FC<CleanPrintViewProps> = ({ invoice, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Controls Bar (hidden during printing) */}
      <div className="no-print bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Invoices</span>
          </button>

          <div className="text-center">
            <h2 className="text-xs sm:text-sm font-semibold text-white">
              Invoice #{invoice.invoice_number}
            </h2>
            <p className="text-[10px] text-slate-400">
              Clean PDF / Print Preview
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div className="flex-1 flex justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-3xl w-full">
          <LiveInvoicePreview invoice={invoice} previewMode="desktop" />
        </div>
      </div>
    </div>
  );
};
