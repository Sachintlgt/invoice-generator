import React from 'react';
import { Percent } from 'lucide-react';
import { formatCurrency } from '../../lib/calculations';

interface DiscountTaxCardProps {
  discount: number;
  taxRate: number;
  subtotal: number;
  calculatedDiscount: number;
  calculatedTax: number;
  grandTotal: number;
  onChange: (fields: Partial<{ discount: number; tax_rate: number }>) => void;
}

export const DiscountTaxCard: React.FC<DiscountTaxCardProps> = ({
  discount,
  taxRate,
  subtotal,
  calculatedDiscount,
  calculatedTax,
  grandTotal,
  onChange,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs h-full flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
            <Percent className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">Discount & Tax</h3>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="inv-disc" className="block text-[11px] font-medium text-slate-600 mb-1">
              Fixed Discount (USD)
            </label>
            <input
              id="inv-disc"
              type="number"
              min="0"
              step="0.01"
              value={discount === 0 ? '0.00' : discount}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChange({ discount: isNaN(val) ? 0 : Math.max(0, val) });
              }}
              placeholder="10.00"
              className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="inv-tax" className="block text-[11px] font-medium text-slate-600 mb-1">
              Tax Rate (%)
            </label>
            <div className="relative">
              <input
                id="inv-tax"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate === 0 ? '0' : taxRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onChange({ tax_rate: isNaN(val) ? 0 : Math.max(0, val) });
                }}
                placeholder="10"
                className="w-full px-2.5 py-1 pr-6 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>

        {/* Calculation Breakdown Rows */}
        <div className="space-y-1 text-xs pt-1">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-800 text-[11px]">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] text-slate-500">Discount</span>
            <span className="font-medium text-slate-800 text-[11px]">
              {calculatedDiscount > 0 ? `-${formatCurrency(calculatedDiscount)}` : '$0.00'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] text-slate-500">Tax ({taxRate}%)</span>
            <span className="font-medium text-slate-800 text-[11px]">{formatCurrency(calculatedTax)}</span>
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="font-bold text-xs text-slate-900">Grand Total</span>
        <span className="font-bold text-blue-600 text-base">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
};
