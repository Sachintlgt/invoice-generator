import React from 'react';
import {
  FileText,
  X,
} from 'lucide-react';

interface SidebarProps {
  onNewInvoice: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'invoices',
      label: 'Invoices',
      icon: FileText,
      active: true,
      onClick: () => { },
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-40 w-52 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Top: Nav Links */}
        <div className="p-3.5 space-y-4">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-800">Menu</span>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.onClick();
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${item.active
                    ? 'bg-blue-50/70 text-blue-600 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Banner Card: "Simple invoicing for growing businesses." */}
        <div className="p-3.5 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/70 flex flex-col items-center text-center">
            {/* Soft Illustration Graphic matching screenshot */}
            <div className="w-16 h-16 relative flex items-center justify-center mb-2">
              <div className="absolute inset-1 rounded-full bg-blue-100/60" />
              <div className="relative z-10 w-9 h-12 bg-blue-600 rounded-md shadow-xs flex flex-col justify-around p-1.5">
                <span className="w-5 h-0.5 bg-white/90 rounded" />
                <span className="w-6 h-0.5 bg-white/90 rounded" />
                <span className="w-4 h-0.5 bg-white/90 rounded" />
              </div>
              <svg
                className="absolute -bottom-1 -left-1 w-6 h-6 text-blue-400 opacity-80"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21 C8 15 2 12 1 6 C7 7 11 13 12 21 Z" />
              </svg>
              <svg
                className="absolute -bottom-1 -right-1 w-6 h-6 text-blue-300 opacity-80"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21 C16 15 22 12 23 6 C17 7 13 13 12 21 Z" />
              </svg>
            </div>

            <p className="font-bold text-xs text-slate-800 leading-tight">
              Simple invoicing for growing businesses.
            </p>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Create professional invoices and get paid faster.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
