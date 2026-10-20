import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardKPIs } from './components/dashboard/DashboardKPIs';
import { InvoiceTable } from './components/dashboard/InvoiceTable';
import { InvoiceDetailsDrawer } from './components/drawer/InvoiceDetailsDrawer';
import { FullInvoiceEditor } from './components/editor/FullInvoiceEditor';
import { NewInvoiceModal } from './components/editor/NewInvoiceModal';
import { CleanPrintView } from './components/preview/CleanPrintView';
import { SendEmailModal } from './components/SendEmailModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer, type ToastMessage } from './components/Toast';

import type { Invoice, InvoiceListItem } from './types/invoice';
import { calculateTotals } from './lib/calculations';
import { getBlankInvoice } from './lib/constants';
import {
  fetchInvoices,
  fetchInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getErrorMessage,
} from './lib/api';

type AppView = 'dashboard' | 'editor' | 'print';

export const App: React.FC = () => {
  // Current high-level view
  const [currentView, setCurrentView] = useState<AppView>('dashboard');

  // Invoices List & Selected ID
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState<boolean>(true);

  // Active Invoice for Editor / Print View
  const [activeInvoice, setActiveInvoice] = useState<Invoice>(getBlankInvoice);
  const [isNewInvoice, setIsNewInvoice] = useState<boolean>(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Dashboard Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateRange, setDateRange] = useState<string>('Oct 1, 2026 - Oct 31, 2026');
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // New & Edit Invoice Modals
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditInvoiceModalOpen, setIsEditInvoiceModalOpen] = useState<boolean>(false);

  // Modals & Notifications
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [emailTargetInvoice, setEmailTargetInvoice] = useState<Invoice | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // --- Load Invoices List from Backend ---
  const loadInvoices = useCallback(async () => {
    setIsLoadingInvoices(true);
    try {
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err) {
      addToast('error', getErrorMessage(err));
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // --- Generate Next Invoice Number ---
  const getNextInvoiceNumber = useCallback(() => {
    if (!invoices || invoices.length === 0) return 'INV-001';
    const nums = invoices
      .map((i) => {
        const match = i.invoice_number?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => n > 0);
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `INV-${String(max + 1).padStart(3, '0')}`;
  }, [invoices]);

  // --- Row Click / Select Invoice (Opens Drawer) ---
  const handleSelectInvoice = (id: string) => {
    setSelectedId(id);
    setIsDrawerOpen(true);
  };

  // --- Close Drawer ---
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  // --- Start New Invoice Workflow (Opens New Invoice Modal) ---
  const handleStartNewInvoice = () => {
    setIsDrawerOpen(false);
    setIsNewInvoiceModalOpen(true);
  };

  // --- Save New Invoice From Modal ---
  const handleSaveNewInvoiceFromModal = async (invoiceToSave: Invoice) => {
    if (!invoiceToSave.invoice_number?.trim()) {
      addToast('error', 'Invoice number is required.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await createInvoice(invoiceToSave);
      addToast('success', `Invoice #${saved.invoice_number} created successfully!`);
      setIsNewInvoiceModalOpen(false);
      setSelectedId(saved.id || null);
      await loadInvoices();
      setIsDrawerOpen(true);
    } catch (err) {
      addToast('error', getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // --- Start Edit Invoice Workflow (Opens Edit Modal) ---
  const handleStartEditInvoice = async (invoiceOrId: Invoice | string) => {
    try {
      let fullInvoice: Invoice;
      if (typeof invoiceOrId === 'string') {
        fullInvoice = await fetchInvoice(invoiceOrId);
      } else {
        fullInvoice = invoiceOrId;
      }
      setEditingInvoice(fullInvoice);
      setIsEditInvoiceModalOpen(true);
    } catch (err) {
      addToast('error', getErrorMessage(err));
    }
  };

  // --- Save Edited Invoice From Modal ---
  const handleSaveEditedInvoiceFromModal = async (invoiceToSave: Invoice) => {
    if (!invoiceToSave.invoice_number?.trim()) {
      addToast('error', 'Invoice number is required.');
      return;
    }
    if (!invoiceToSave.id) {
      addToast('error', 'Invoice ID is required for editing.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await updateInvoice(invoiceToSave.id, invoiceToSave);
      addToast('success', `Invoice #${saved.invoice_number} updated successfully!`);
      setIsEditInvoiceModalOpen(false);
      setEditingInvoice(null);
      setSelectedId(saved.id || null);
      await loadInvoices();
    } catch (err) {
      addToast('error', getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // --- Open Clean Print / Save PDF View ---
  const handleOpenPrintView = async (invoiceOrId: Invoice | string) => {
    try {
      let fullInvoice: Invoice;
      if (typeof invoiceOrId === 'string') {
        fullInvoice = await fetchInvoice(invoiceOrId);
      } else {
        fullInvoice = invoiceOrId;
      }
      setActiveInvoice(fullInvoice);
      setCurrentView('print');
    } catch (err) {
      addToast('error', getErrorMessage(err));
    }
  };

  // --- Open Send Email Modal ---
  const handleOpenSendEmail = async (invoiceOrId: Invoice | string) => {
    try {
      let fullInvoice: Invoice;
      if (typeof invoiceOrId === 'string') {
        fullInvoice = await fetchInvoice(invoiceOrId);
      } else {
        fullInvoice = invoiceOrId;
      }
      setEmailTargetInvoice(fullInvoice);
      setIsEmailModalOpen(true);
    } catch (err) {
      addToast('error', getErrorMessage(err));
    }
  };

  // --- Delete Invoice Confirmation & Execution ---
  const handleDeleteInvoice = (id: string) => {
    const target = invoices.find((i) => i.id === id);
    const label = target ? `#${target.invoice_number}` : 'this invoice';

    setConfirmModal({
      isOpen: true,
      title: 'Delete Invoice?',
      message: `Are you sure you want to permanently delete ${label}? This action cannot be undone.`,
      confirmLabel: 'Delete Invoice',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteInvoice(id);
          addToast('success', `Invoice ${label} deleted successfully`);
          if (selectedId === id) {
            setSelectedId(null);
            setIsDrawerOpen(false);
          }
          await loadInvoices();
        } catch (err) {
          addToast('error', getErrorMessage(err));
        }
      },
    });
  };

  // --- Real-time Calculation Sync for Editor ---
  const handleUpdateActiveInvoice = useCallback((patch: Partial<Invoice>) => {
    setActiveInvoice((prev) => {
      const next = { ...prev, ...patch };
      const totals = calculateTotals(
        next.items || [],
        next.discount ?? 0,
        next.tax_rate ?? 0
      );

      return {
        ...next,
        items: totals.items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax_rate: totals.tax_rate,
        tax_amount: totals.tax_amount,
        grand_total: totals.grand_total,
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // --- Save Invoice in Editor ---
  const handleSaveActiveInvoice = async () => {
    if (!activeInvoice.invoice_number.trim()) {
      addToast('error', 'Invoice number is required.');
      return;
    }

    setIsSaving(true);
    try {
      let saved: Invoice;
      if (!isNewInvoice && activeInvoice.id) {
        saved = await updateInvoice(activeInvoice.id, activeInvoice);
        addToast('success', `Invoice #${saved.invoice_number} updated successfully!`);
      } else {
        saved = await createInvoice(activeInvoice);
        addToast('success', `Invoice #${saved.invoice_number} created and saved!`);
      }

      setActiveInvoice(saved);
      setIsNewInvoice(false);
      setHasUnsavedChanges(false);
      setSelectedId(saved.id || null);

      await loadInvoices();
      setCurrentView('dashboard');
      setIsDrawerOpen(true);
    } catch (err) {
      addToast('error', getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // --- Reset Active Draft ---
  const handleResetDraft = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Current Draft?',
      message: 'This will reset all fields in the editor back to clean default values.',
      confirmLabel: 'Reset',
      isDestructive: false,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        const blank = getBlankInvoice();
        blank.invoice_number = getNextInvoiceNumber();
        setActiveInvoice(blank);
        setHasUnsavedChanges(false);
        addToast('info', 'Editor reset to blank draft');
      },
    });
  };


  // ================= VIEW: DEDICATED CLEAN PRINT / PDF VIEW =================
  if (currentView === 'print') {
    return (
      <CleanPrintView
        invoice={activeInvoice}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  // ================= VIEW: FULL SCREEN INVOICE EDITOR =================
  if (currentView === 'editor') {
    return (
      <>
        <FullInvoiceEditor
          invoice={activeInvoice}
          isNew={isNewInvoice}
          onUpdateInvoice={handleUpdateActiveInvoice}
          onSave={handleSaveActiveInvoice}
          onSendEmail={() => handleOpenSendEmail(activeInvoice)}
          onPrint={() => handleOpenPrintView(activeInvoice)}
          onReset={handleResetDraft}
          onBack={() => {
            if (hasUnsavedChanges) {
              setConfirmModal({
                isOpen: true,
                title: 'Discard Unsaved Changes?',
                message: 'You have unsaved changes in this invoice. Are you sure you want to return to the dashboard?',
                confirmLabel: 'Discard & Exit',
                isDestructive: true,
                onConfirm: () => {
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  setCurrentView('dashboard');
                },
              });
            } else {
              setCurrentView('dashboard');
            }
          }}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Email Modal */}
        {emailTargetInvoice && (
          <SendEmailModal
            invoice={emailTargetInvoice}
            isOpen={isEmailModalOpen}
            onClose={() => setIsEmailModalOpen(false)}
            onSuccess={(recipient) => {
              addToast('success', `Invoice delivered to ${recipient}`);
              handleUpdateActiveInvoice({ status: 'Sent' });
              loadInvoices();
            }}
          />
        )}

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          isDestructive={confirmModal.isDestructive}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Floating Toasts */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // ================= VIEW: INVOICE MANAGEMENT DASHBOARD =================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        onNewInvoice={handleStartNewInvoice}
        onToggleSidebar={() => setIsMobileSidebarOpen(true)}
      />

      {/* Main Workspace: Left Sidebar + Central Dashboard Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          onNewInvoice={handleStartNewInvoice}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Central Dashboard Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="w-full space-y-6 pb-16">
            {/* Header: Title and Description + Date Range Selector matching screenshot */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Invoices
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Manage your invoices, track payments, and stay organized.
                </p>
              </div>

              {/* Date Range Selector Dropdown matching screenshot */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDateRangeDropdownOpen(!isDateRangeDropdownOpen)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{dateRange}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {isDateRangeDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                    {[
                      'Oct 1, 2026 - Oct 31, 2026',
                      'This month',
                      'Last 30 days',
                      'This year',
                      'All time',
                    ].map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => {
                          setDateRange(range);
                          setIsDateRangeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors ${
                          dateRange === range
                            ? 'font-bold text-blue-600 bg-blue-50/50'
                            : 'text-slate-700'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 5 KPI Metric Summary Cards */}
            <DashboardKPIs invoices={invoices} />

            {/* Invoices Table with Search, Status Filter Pills, Date Range, and Pagination */}
            <InvoiceTable
              invoices={invoices}
              selectedId={selectedId}
              onSelectInvoice={handleSelectInvoice}
              onEditInvoice={handleStartEditInvoice}
              onPrintInvoice={handleOpenPrintView}
              onSendEmail={handleOpenSendEmail}
              onDeleteInvoice={handleDeleteInvoice}
              onNewInvoice={handleStartNewInvoice}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              dateRange={dateRange}
              isLoading={isLoadingInvoices}
            />
          </div>
        </main>
      </div>

      {/* Right-Side Slide-Over Invoice Details Drawer */}
      <InvoiceDetailsDrawer
        isOpen={isDrawerOpen}
        invoiceId={selectedId}
        onClose={handleCloseDrawer}
        onEditInvoice={handleStartEditInvoice}
        onPrintInvoice={handleOpenPrintView}
        onSendEmail={handleOpenSendEmail}
        onDeleteInvoice={handleDeleteInvoice}
      />

      {/* Send Email Modal */}
      {emailTargetInvoice && (
        <SendEmailModal
          invoice={emailTargetInvoice}
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          onSuccess={(recipient) => {
            addToast('success', `Invoice delivered to ${recipient}`);
            loadInvoices();
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* New Invoice Modal with Full Details & Live Preview */}
      <NewInvoiceModal
        isOpen={isNewInvoiceModalOpen}
        mode="create"
        onClose={() => setIsNewInvoiceModalOpen(false)}
        onSave={handleSaveNewInvoiceFromModal}
        defaultInvoiceNumber={getNextInvoiceNumber()}
        isSaving={isSaving}
      />

      {/* Edit Invoice Modal with Full Details & Live Preview */}
      {isEditInvoiceModalOpen && editingInvoice && (
        <NewInvoiceModal
          isOpen={isEditInvoiceModalOpen}
          mode="edit"
          initialInvoice={editingInvoice}
          onClose={() => {
            setIsEditInvoiceModalOpen(false);
            setEditingInvoice(null);
          }}
          onSave={handleSaveEditedInvoiceFromModal}
          isSaving={isSaving}
        />
      )}

      {/* Floating Notifications (highest layer) */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
