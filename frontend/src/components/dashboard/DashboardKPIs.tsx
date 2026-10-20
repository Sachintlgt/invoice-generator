import React from 'react';
import { FileText, DollarSign, Send, CheckCircle2, Clock } from 'lucide-react';
import type { InvoiceListItem } from '../../types/invoice';
import { formatCurrency } from '../../lib/calculations';

interface DashboardKPIsProps {
  invoices: InvoiceListItem[];
}

export const DashboardKPIs: React.FC<DashboardKPIsProps> = ({ invoices }) => {
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

  const sentInvoices = invoices.filter((i) => i.status === 'Sent');
  const paidInvoices = invoices.filter((i) => i.status === 'Paid');
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue');

  const kpis = [
    {
      label: 'Total Invoices',
      value: totalInvoices.toString(),
      icon: FileText,
      iconBoxBg: 'bg-blue-50 text-blue-500',
    },
    {
      label: 'Total Amount',
      value: formatCurrency(totalAmount),
      icon: DollarSign,
      iconBoxBg: 'bg-emerald-50 text-emerald-500',
    },
    {
      label: 'Sent',
      value: sentInvoices.length.toString(),
      icon: Send,
      iconBoxBg: 'bg-purple-50 text-purple-500',
    },
    {
      label: 'Paid',
      value: paidInvoices.length.toString(),
      icon: CheckCircle2,
      iconBoxBg: 'bg-emerald-50 text-emerald-500',
    },
    {
      label: 'Overdue',
      value: overdueInvoices.length.toString(),
      icon: Clock,
      iconBoxBg: 'bg-amber-50 text-amber-500',
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-5">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            {/* Top row: Icon + Label */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${kpi.iconBoxBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 truncate leading-tight">
                {kpi.label}
              </span>
            </div>

            {/* Large Value */}
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
                {kpi.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
