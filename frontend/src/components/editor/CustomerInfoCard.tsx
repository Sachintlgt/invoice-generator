import React from 'react';
import { User } from 'lucide-react';

interface CustomerInfoCardProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  onChange: (fields: Partial<{
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_address: string;
  }>) => void;
}

export const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  onChange,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
          <User className="w-3.5 h-3.5" />
        </div>
        <h3 className="font-bold text-xs sm:text-sm text-slate-900">Customer Information</h3>
      </div>

      <div className="space-y-3">
        {/* Row 1: Customer Name | Email | Phone (optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="cust-name" className="block text-[11px] font-medium text-slate-600 mb-1">
              Customer Name
            </label>
            <input
              id="cust-name"
              type="text"
              value={customerName}
              onChange={(e) => onChange({ customer_name: e.target.value })}
              placeholder="e.g. Acme Corporation"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="cust-email" className="block text-[11px] font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              id="cust-email"
              type="email"
              value={customerEmail}
              onChange={(e) => onChange({ customer_email: e.target.value })}
              placeholder="e.g. client@example.com"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="cust-phone" className="block text-[11px] font-medium text-slate-600 mb-1">
              Phone (optional)
            </label>
            <input
              id="cust-phone"
              type="text"
              value={customerPhone}
              onChange={(e) => onChange({ customer_phone: e.target.value })}
              placeholder="e.g. +1 (555) 123-4567"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
            />
          </div>
        </div>

        {/* Row 2: Address */}
        <div>
          <label htmlFor="cust-address" className="block text-[11px] font-medium text-slate-600 mb-1">
            Address
          </label>
          <textarea
            id="cust-address"
            rows={2}
            value={customerAddress}
            onChange={(e) => onChange({ customer_address: e.target.value })}
            placeholder="e.g. 456 Client Avenue, Suite 200"
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};
