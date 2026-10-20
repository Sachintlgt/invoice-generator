import React from 'react';
import { Bookmark, Mail, Printer, RotateCcw } from 'lucide-react';

interface BottomActionBarProps {
  onSave: () => void;
  onSendEmail: () => void;
  onPrint: () => void;
  onReset: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  onSave,
  onSendEmail,
  onPrint,
  onReset,
  isSaving,
}) => {
  return (
    <div className="no-print bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs mt-4 flex flex-wrap items-center justify-between gap-3">
      {/* Left: Save Invoice (Solid Blue) */}
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors"
      >
        <Bookmark className="w-3.5 h-3.5 fill-current" />
        <span>Save Invoice</span>
      </button>

      {/* Right: Actions (Send Email, Print / Save as PDF, Reset) */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onSendEmail}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
        >
          <Mail className="w-3.5 h-3.5 text-slate-600" />
          <span>Send Email</span>
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>Print / Save as PDF</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
