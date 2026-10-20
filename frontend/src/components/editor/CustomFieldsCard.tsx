import React from 'react';
import { SlidersHorizontal, Plus, Trash2, Eye, EyeOff, ChevronRight } from 'lucide-react';
import type { CustomField } from '../../types/invoice';

interface CustomFieldsCardProps {
  customFields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

export const CustomFieldsCard: React.FC<CustomFieldsCardProps> = ({
  customFields,
  onChange,
}) => {
  const handleAddField = (label: string = '', value: string = '') => {
    const newField: CustomField = {
      label,
      value,
      is_visible: true,
      order_index: customFields.length,
    };
    onChange([...customFields, newField]);
  };

  const handleUpdateField = (index: number, key: keyof CustomField, val: any) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [key]: val };
    onChange(updated);
  };

  const handleRemoveField = (index: number) => {
    const updated = customFields.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs h-full flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">Custom Fields</h3>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {customFields.map((field, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

              <input
                type="text"
                value={field.label}
                onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                placeholder="e.g. PO Number"
                className="w-28 sm:w-32 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />

              <input
                type="text"
                value={field.value}
                onChange={(e) => handleUpdateField(index, 'value', e.target.value)}
                placeholder="e.g. PO-98421"
                className="flex-1 min-w-0 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />

              <button
                type="button"
                onClick={() => handleUpdateField(index, 'is_visible', !field.is_visible)}
                className={`p-1 rounded ${
                  field.is_visible ? 'text-blue-500 hover:text-blue-700' : 'text-slate-300 hover:text-slate-500'
                }`}
                title={field.is_visible ? 'Visible on invoice' : 'Hidden from invoice'}
              >
                {field.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleRemoveField(index)}
                className="p-1 text-rose-500 hover:text-rose-700 rounded"
                title="Remove field"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* + Add Custom Field button */}
      <div className="pt-3 mt-2 border-t border-slate-100 flex justify-center">
        <button
          type="button"
          onClick={() => handleAddField()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Field</span>
        </button>
      </div>
    </div>
  );
};
