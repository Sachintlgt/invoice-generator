import React from 'react';
import { Plus, Menu } from 'lucide-react';

interface NavbarProps {
  onNewInvoice: () => void;
  onToggleSidebar?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewInvoice,
  onToggleSidebar,
}) => {
  return (
    <header className="no-print bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 sticky top-0 z-30 w-full">
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Left: Mobile Toggle & Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            {/* Blue Rounded Square Logo with 3 Horizontal Bars */}
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex flex-col items-center justify-center gap-0.5 shadow-xs shrink-0">
              <span className="w-4 h-0.5 bg-white rounded-full" />
              <span className="w-4 h-0.5 bg-white rounded-full" />
              <span className="w-4 h-0.5 bg-white rounded-full" />
            </div>

            <div>
              <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-tight">
                Invoice Studio
              </h1>
              <p className="text-[10px] text-slate-400 font-normal leading-none mt-0.5 hidden sm:block">
                Create. Customize. Send.
              </p>
            </div>
          </div>
        </div>

        {/* Right: New Invoice Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onNewInvoice}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
