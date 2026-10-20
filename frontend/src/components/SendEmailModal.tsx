import React, { useState } from 'react';
import { X, Send, Mail, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { Invoice } from '../types/invoice';
import { sendInvoiceEmail, getErrorMessage } from '../lib/api';
import { formatCurrency } from '../lib/calculations';

interface SendEmailModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (recipient: string) => void;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [recipient, setRecipient] = useState(invoice.customer_email || '');
  const [subject, setSubject] = useState(
    `Invoice ${invoice.invoice_number} from ${invoice.business_name || 'Invoice Studio'}`
  );
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSentSuccess(null);

    if (!invoice.id) {
      setError('Please save the invoice before sending an email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipient || !emailRegex.test(recipient.trim())) {
      setError('Please provide a valid recipient email address (e.g. client@company.com).');
      return;
    }

    if (!subject || !subject.trim()) {
      setError('Email subject line cannot be empty.');
      return;
    }

    setIsSending(true);
    try {
      const res = await sendInvoiceEmail(invoice.id, {
        recipient_email: recipient,
        subject,
        message,
      });

      setSentSuccess(res.message);
      onSuccess(res.recipient_email);
      setTimeout(() => {
        onClose();
        setSentSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Send Invoice via Email</h3>
              <p className="text-xs text-slate-500">Delivered directly with HTML invoice summary</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {/* Invoice Mini Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-900">{invoice.invoice_number}</span>
              <p className="text-slate-500 mt-0.5">{invoice.customer_name || 'No client specified'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
              <span className="font-bold text-blue-600 text-sm">{formatCurrency(invoice.grand_total)}</span>
            </div>
          </div>

          {/* Feedback states */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Email Delivery Notice</p>
                <p className="mt-0.5 text-rose-600">{error}</p>
              </div>
            </div>
          )}

          {sentSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold">Success!</p>
                <p className="mt-0.5">{sentSuccess}</p>
              </div>
            </div>
          )}

          {/* Recipient Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipient Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="client@company.com"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
              required
            />
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
              required
            />
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Optional Note for Recipient
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi there, please find attached the latest invoice for our recent sprint. Let me know if you have any questions!"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow transition-all disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invoice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
