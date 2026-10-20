import axios, { AxiosError } from 'axios';
import type { Invoice, InvoiceListItem } from '../types/invoice';

const rawBaseURL = (import.meta.env.VITE_API_URL as string | undefined) || '';
const cleanBaseURL = rawBaseURL.trim().replace(/\/+$/, '');
const baseURL = cleanBaseURL.endsWith('/api')
  ? cleanBaseURL.slice(0, -4)
  : cleanBaseURL;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ detail?: string | Array<string | { msg?: string }> }>;
    if (axiosErr.response?.data?.detail) {
      const detail = axiosErr.response.data.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const msgs = detail
          .map((d: any) => (typeof d === 'string' ? d : d?.msg))
          .filter(Boolean);
        if (msgs.length > 0) return msgs.join(' • ');
      }
    }
    if (axiosErr.message) return axiosErr.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred. Please try again.';
}

export async function checkHealth(): Promise<{ status: string; service: string; version: string }> {
  const response = await apiClient.get<{ status: string; service: string; version: string }>('/api/health');
  return response.data;
}

export async function fetchInvoices(search?: string, status?: string): Promise<InvoiceListItem[]> {
  const params: Record<string, string> = {};
  if (search && search.trim()) params.search = search.trim();
  if (status && status.trim() && status !== 'All') params.status = status.trim();

  const response = await apiClient.get<InvoiceListItem[]>('/api/invoices', { params });
  return response.data;
}

export async function fetchInvoice(id: string): Promise<Invoice> {
  const response = await apiClient.get<Invoice>(`/api/invoices/${id}`);
  return response.data;
}

export async function createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
  const response = await apiClient.post<Invoice>('/api/invoices', invoice);
  return response.data;
}

export async function updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
  const response = await apiClient.put<Invoice>(`/api/invoices/${id}`, invoice);
  return response.data;
}

export async function deleteInvoice(id: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/invoices/${id}`);
  return response.data;
}

export async function sendInvoiceEmail(
  id: string,
  payload?: { recipient_email?: string; subject?: string; message?: string }
): Promise<{ success: boolean; message: string; recipient_email: string }> {
  const response = await apiClient.post<{ success: boolean; message: string; recipient_email: string }>(
    `/api/invoices/${id}/send`,
    payload || {}
  );
  return response.data;
}

