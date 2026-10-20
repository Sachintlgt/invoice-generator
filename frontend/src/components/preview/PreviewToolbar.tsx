import React from 'react';
import { Eye, Monitor, Smartphone } from 'lucide-react';

interface PreviewToolbarProps {
  previewMode: 'desktop' | 'mobile';
  onModeChange: (mode: 'desktop' | 'mobile') => void;
}

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  previewMode,
  onModeChange,
}) => {
  return (
    <div className="no-print flex items-center justify-between pb-3 mb-1">
      {/* Left: Eye Icon + Live Preview */}
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-blue-600" />
        <h3 className="font-bold text-xs sm:text-sm text-slate-900">Live Preview</h3>
      </div>

      {/* Right: Segmented Toggle: Desktop / Mobile */}
      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => onModeChange('desktop')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            previewMode === 'desktop'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Desktop</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            previewMode === 'mobile'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile</span>
        </button>
      </div>
    </div>
  );
};
