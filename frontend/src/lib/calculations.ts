import type { InvoiceItem, CalculationResult } from '../types/invoice';

/**
 * Rounds a number accurately to two decimal places.
 */
export function roundToTwo(num: number): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a numeric amount to USD currency display.
 * E.g., 99 -> "$99.00"
 */
export function formatCurrency(amount: number): string {
  const safeAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

/**
 * Calculates authoritative invoice totals mirroring backend logic:
 * 1. Line total = (quantity * unit price) - item_discount
 * 2. Subtotal = sum of all rounded line totals
 * 3. Fixed discount is a non-negative amount and must not exceed subtotal
 * 4. Taxable amount = subtotal - fixed discount
 * 5. Tax = taxable amount * tax rate / 100
 * 6. Grand total = taxable amount + tax
 */
export function calculateTotals(
  items: InvoiceItem[],
  rawDiscount: number,
  rawTaxRate: number
): CalculationResult {
  const fixedDiscount = Math.max(0, Number(rawDiscount) || 0);
  const taxRate = Math.max(0, Number(rawTaxRate) || 0);

  let subtotal = 0;

  const calculatedItems = items.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unit_price) || 0);
    const itemDiscount = Math.max(0, Number(item.discount) || 0);

    const gross = qty * price;
    const lineTotal = roundToTwo(Math.max(0, gross - itemDiscount));
    subtotal += lineTotal;

    return {
      ...item,
      quantity: qty,
      unit_price: price,
      discount: itemDiscount,
      line_total: lineTotal,
    };
  });

  subtotal = roundToTwo(subtotal);

  // Fixed discount capped at subtotal
  const actualDiscount = roundToTwo(Math.min(fixedDiscount, subtotal));
  const taxableAmount = roundToTwo(Math.max(0, subtotal - actualDiscount));
  const taxAmount = roundToTwo(taxableAmount * (taxRate / 100));
  const grandTotal = roundToTwo(taxableAmount + taxAmount);

  return {
    items: calculatedItems,
    subtotal,
    discount: actualDiscount,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    grand_total: grandTotal,
  };
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into "Oct 20, 2026"
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.includes('-') ? dateStr.split('-') : [];
    let d: Date;
    if (parts.length === 3 && parts[0].length === 2) {
      // DD-MM-YYYY format
      d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else {
      d = new Date(dateStr);
    }
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return dateStr;
}
