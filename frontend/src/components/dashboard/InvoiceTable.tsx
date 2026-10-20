import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Eye,
  Edit2,
  Printer,
  Mail,
  Trash2,
  X,
  Plus,
} from 'lucide-react';
import type { InvoiceListItem, InvoiceStatus } from '../../types/invoice';
import { STATUS_STYLES } from '../../lib/constants';
import { formatCurrency, formatDate } from '../../lib/calculations';

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
  selectedId: string | null;
  onSelectInvoice: (id: string) => void;
  onEditInvoice: (id: string) => void;
  onPrintInvoice: (id: string) => void;
  onSendEmail: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onNewInvoice: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  dateRange: string;
  isLoading?: boolean;

}

type SortOption = 'Latest first' | 'Oldest first' | 'Highest amount' | 'Lowest amount';

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  selectedId,
  onSelectInvoice,
  onEditInvoice,
  onPrintInvoice,
  onSendEmail,
  onDeleteInvoice,
  onNewInvoice,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  isLoading = false,
}) => {
  // Checkbox selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('Latest first');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Actions menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
    openUpwards: boolean;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or window scroll/resize
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
        setMenuPosition(null);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setActiveMenuId(null);
      setMenuPosition(null);
      setIsSortDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  // Compute status counts for filter pills
  const statusCounts = useMemo(() => {
    const counts = {
      All: invoices.length,
      Draft: 0,
      Sent: 0,
      Paid: 0,
      Overdue: 0,
    };
    invoices.forEach((inv) => {
      if (inv.status in counts) {
        counts[inv.status as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, [invoices]);

  // Filtered and sorted invoices
  const processedInvoices = useMemo(() => {
    let result = invoices.filter((inv) => {
      // Status filter
      if (statusFilter !== 'All' && inv.status !== statusFilter) {
        return false;
      }

      // Search query filter (invoice number, customer name, email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = inv.invoice_number?.toLowerCase().includes(q);
        const nameMatch = inv.customer_name?.toLowerCase().includes(q);
        const emailMatch = inv.customer_email?.toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !emailMatch) {
          return false;
        }
      }

      // Date range filter
      if (dateRange !== 'All time' && inv.issue_date) {
        const invDate = new Date(inv.issue_date);
        const now = new Date();
        if (dateRange === 'Oct 1, 2026 - Oct 31, 2026') {
          const isOct2026 = invDate.getFullYear() === 2026 && invDate.getMonth() === 9;
          const isCurrentMonth = invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
          if (!isOct2026 && !isCurrentMonth) {
            return false;
          }
        } else if (dateRange === 'This month') {
          if (invDate.getMonth() !== now.getMonth() || invDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (dateRange === 'Last 30 days') {
          const diffTime = Math.abs(now.getTime() - invDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 30) return false;
        } else if (dateRange === 'This year') {
          if (invDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'Latest first') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.issue_date).getTime();
        const dateB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.issue_date).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'Oldest first') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.issue_date).getTime();
        const dateB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.issue_date).getTime();
        return dateA - dateB;
      }
      if (sortBy === 'Highest amount') {
        return (b.grand_total || 0) - (a.grand_total || 0);
      }
      if (sortBy === 'Lowest amount') {
        return (a.grand_total || 0) - (b.grand_total || 0);
      }
      return 0;
    });

    return result;
  }, [invoices, statusFilter, searchQuery, dateRange, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, dateRange, sortBy]);

  // Pagination calculation
  const totalItems = processedInvoices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentInvoices = processedInvoices.slice(startIndex, startIndex + pageSize);

  // Checkbox toggle helpers
  const handleSelectAll = () => {
    if (selectedRowIds.size === currentInvoices.length && currentInvoices.length > 0) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(currentInvoices.map((i) => i.id)));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Controls Bar matching reference screenshot: Search on left, Status Pills in center, Sort on right */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Search Input Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by invoice number, customer name or email..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center: Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', 'Draft', 'Sent', 'Paid', 'Overdue'] as const).map((st) => {
            const count = statusCounts[st] || 0;
            const isSelected = statusFilter === st;

            return (
              <button
                key={st}
                type="button"
                onClick={() => onStatusFilterChange(st)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${isSelected
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/60'
                  }`}
              >
                <span>{st}</span>
                <span className={`ml-1 text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Sort Dropdown (⇅ Latest first) */}
        <div className="relative shrink-0" ref={sortDropdownRef}>
          <button
            type="button"
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>{sortBy}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {isSortDropdownOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
              {(['Latest first', 'Oldest first', 'Highest amount', 'Lowest amount'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setSortBy(opt);
                    setIsSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${sortBy === opt ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto min-h-[160px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 select-none">
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={currentInvoices.length > 0 && selectedRowIds.size === currentInvoices.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Invoice No.</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-3.5 text-center">
                      <div className="w-4 h-4 bg-slate-100 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 bg-slate-100 rounded w-20" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 bg-slate-100 rounded w-32 mb-1" />
                      <div className="h-3 bg-slate-50 rounded w-24" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 bg-slate-100 rounded w-20" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 bg-slate-100 rounded w-20" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 bg-slate-100 rounded w-16" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-5 bg-slate-100 rounded-full w-14" />
                    </td>
                    <td className="py-4 px-3 text-right pr-4">
                      <div className="h-4 bg-slate-100 rounded w-6 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : currentInvoices.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <h4 className="font-semibold text-sm text-slate-800 mb-1">
                        {searchQuery || statusFilter !== 'All'
                          ? 'No matching invoices'
                          : 'No invoices yet'}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4 text-center leading-relaxed">
                        {searchQuery || statusFilter !== 'All'
                          ? 'Try adjusting your search query or clear status filters.'
                          : 'Get started by creating your very first professional invoice.'}
                      </p>
                      <button
                        type="button"
                        onClick={onNewInvoice}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Invoice</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentInvoices.map((inv) => {
                  const isRowSelected = selectedId === inv.id;
                  const isChecked = selectedRowIds.has(inv.id);
                  const statusStyle = STATUS_STYLES[inv.status as InvoiceStatus] || STATUS_STYLES.Draft;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv.id)}
                      className={`group cursor-pointer transition-colors relative ${isRowSelected
                          ? 'bg-blue-50/50'
                          : isChecked
                            ? 'bg-slate-50/80 hover:bg-slate-50'
                            : 'hover:bg-slate-50/70'
                        }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-3.5 text-center align-middle"
                        onClick={(e) => handleToggleRow(inv.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked || isRowSelected}
                          onChange={() => { }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Invoice No. */}
                      <td className="py-3 px-3 font-semibold text-slate-900 tracking-tight whitespace-nowrap align-middle">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{inv.invoice_number}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3 align-middle max-w-[200px]">
                        <p className="font-semibold text-slate-900 truncate">
                          {inv.customer_name || '—'}
                        </p>
                        {inv.customer_email && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {inv.customer_email}
                          </p>
                        )}
                      </td>

                      {/* Issue Date */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap align-middle">
                        {formatDate(inv.issue_date)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap align-middle">
                        {formatDate(inv.due_date)}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap align-middle">
                        {formatCurrency(inv.grand_total)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span>{inv.status}</span>
                        </span>
                      </td>

                      {/* Actions Button */}
                      <td className="py-3 px-3 text-right pr-4 align-middle">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMenuId === inv.id) {
                              setActiveMenuId(null);
                              setMenuPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const openUpwards = window.innerHeight - rect.bottom < 220;
                              setMenuPosition({
                                top: openUpwards ? rect.top - 6 : rect.bottom + 6,
                                right: Math.max(16, window.innerWidth - rect.right),
                                openUpwards,
                              });
                              setActiveMenuId(inv.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu (Fixed in front of table and pagination) */}
                        {activeMenuId === inv.id && menuPosition && (
                          <div
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'fixed',
                              top: menuPosition.openUpwards ? undefined : `${menuPosition.top}px`,
                              bottom: menuPosition.openUpwards
                                ? `${window.innerHeight - menuPosition.top}px`
                                : undefined,
                              right: `${menuPosition.right}px`,
                              zIndex: 9999,
                            }}
                            className="w-44 bg-white border border-slate-200/90 rounded-xl shadow-xl py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSelectInvoice(inv.id);
                                setActiveMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>View Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onEditInvoice(inv.id);
                                setActiveMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit Invoice</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onPrintInvoice(inv.id);
                                setActiveMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-400" />
                              <span>Print / Save PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onSendEmail(inv.id);
                                setActiveMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>Send Email</span>
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              type="button"
                              onClick={() => {
                                onDeleteInvoice(inv.id);
                                setActiveMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, totalItems)} of {totalItems} invoices
          </div>

          <div className="flex items-center gap-3">
            {/* Page Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-6 h-6 rounded-md text-xs font-medium transition-colors ${currentPage === page
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
