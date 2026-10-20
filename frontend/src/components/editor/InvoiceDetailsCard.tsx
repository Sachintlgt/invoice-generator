import React from 'react';
import { Calendar, FileText } from 'lucide-react';
import type { InvoiceStatus } from '../../types/invoice';

interface InvoiceDetailsCardProps {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentTerms: string;
  notes: string;
  onChange: (fields: Partial<{
    invoice_number: string;
    issue_date: string;
    due_date: string;
    status: InvoiceStatus;
    payment_terms: string;
    notes: string;
  }>) => void;
}

export const InvoiceDetailsCard: React.FC<InvoiceDetailsCardProps> = ({
  invoiceNumber,
  issueDate,
  dueDate,
  notes,
  onChange,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
          <FileText className="w-3.5 h-3.5" />
        </div>
        <h3 className="font-bold text-xs sm:text-sm text-slate-900">Invoice Details</h3>
      </div>

      <div className="space-y-3">
        {/* Row 1: Invoice Number | Issue Date | Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="inv-num" className="block text-[11px] font-medium text-slate-600 mb-1">
              Invoice Number
            </label>
            <input
              id="inv-num"
              type="text"
              value={invoiceNumber}
              onChange={(e) => onChange({ invoice_number: e.target.value })}
              placeholder="INV-001"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="inv-issue-date" className="block text-[11px] font-medium text-slate-600 mb-1">
              Issue Date
            </label>
            <div className="relative">
              <input
                id="inv-issue-date"
                type="text"
                value={issueDate}
                onChange={(e) => onChange({ issue_date: e.target.value })}
                placeholder="YYYY-MM-DD"
                className="w-full px-3 py-1.5 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="inv-due-date" className="block text-[11px] font-medium text-slate-600 mb-1">
              Due Date
            </label>
            <div className="relative">
              <input
                id="inv-due-date"
                type="text"
                value={dueDate}
                onChange={(e) => onChange({ due_date: e.target.value })}
                placeholder="YYYY-MM-DD"
                className="w-full px-3 py-1.5 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: Notes (optional) */}
        <div>
          <label htmlFor="inv-notes" className="block text-[11px] font-medium text-slate-600 mb-1">
            Notes (optional)
          </label>
          <input
            id="inv-notes"
            type="text"
            value={notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="e.g. Payment due within 7 days. Thank you for your business!"
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
          />
        </div>
      </div>
    </div>
  );
};
