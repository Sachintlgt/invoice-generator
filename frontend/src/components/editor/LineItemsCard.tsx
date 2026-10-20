import React from 'react';
import { Plus, Trash2, ListFilter } from 'lucide-react';
import type { InvoiceItem } from '../../types/invoice';
import { formatCurrency, roundToTwo } from '../../lib/calculations';

interface LineItemsCardProps {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
}

export const LineItemsCard: React.FC<LineItemsCardProps> = ({ items, onChange }) => {
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      description: '',
      quantity: 1,
      unit_price: 0,
      discount: 0,
      line_total: 0,
      order_index: items.length,
    };
    onChange([...items, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === 'quantity') {
      const parsed = parseFloat(value);
      current.quantity = isNaN(parsed) ? 0 : Math.max(0, parsed);
    } else if (field === 'unit_price') {
      const parsed = parseFloat(value);
      current.unit_price = isNaN(parsed) ? 0 : Math.max(0, parsed);
    } else if (field === 'discount') {
      const parsed = parseFloat(value);
      current.discount = isNaN(parsed) ? 0 : Math.max(0, parsed);
    } else if (field === 'description') {
      current.description = value;
    }

    const gross = (current.quantity || 0) * (current.unit_price || 0);
    const itemDisc = current.discount || 0;
    current.line_total = roundToTwo(Math.max(0, gross - itemDisc));

    updated[index] = current;
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      {/* Card Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
          <ListFilter className="w-3.5 h-3.5" />
        </div>
        <h3 className="font-bold text-xs sm:text-sm text-slate-900">Invoice Items</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-medium text-slate-500">
              <th className="pb-2 font-normal text-slate-500 pl-1 w-5/12">Description</th>
              <th className="pb-2 font-normal text-slate-500 px-2 text-center w-2/12">Quantity</th>
              <th className="pb-2 font-normal text-slate-500 px-2 text-right w-2/12">Unit Price (USD)</th>
              <th className="pb-2 font-normal text-slate-500 px-2 text-right w-2/12">Discount (USD)</th>
              <th className="pb-2 font-normal text-slate-500 px-2 text-right w-2/12">Line Total</th>
              <th className="pb-2 pr-1 w-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="py-2 pl-1 pr-2 align-middle">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                    placeholder="e.g. Consulting Services"
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                  />
                </td>
                <td className="py-2 px-2 align-middle">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                    placeholder="1"
                    className="w-full px-2 py-1 text-xs text-center bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                  />
                </td>
                <td className="py-2 px-2 align-middle">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price === 0 ? '' : item.unit_price}
                    onChange={(e) => handleUpdateItem(index, 'unit_price', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2 py-1 text-xs text-right bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                  />
                </td>
                <td className="py-2 px-2 align-middle">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.discount === 0 ? '0.00' : item.discount}
                    onChange={(e) => handleUpdateItem(index, 'discount', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2 py-1 text-xs text-right bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
                  />
                </td>
                <td className="py-2 px-2 align-middle text-right font-medium text-xs text-slate-900 whitespace-nowrap">
                  {formatCurrency(item.line_total)}
                </td>
                <td className="py-2 pr-1 align-middle text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* + Add Item Button */}
      <div className="mt-3">
        <button
          type="button"
          onClick={handleAddItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Item</span>
        </button>
      </div>
    </div>
  );
};
