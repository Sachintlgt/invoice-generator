import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotals, formatCurrency } from './calculations.ts';

test('Calculations: exact interview exercise example ($99.00 total)', () => {
  // - Quantity: 2
  // - Unit price: $50.00
  // - Subtotal: $100.00
  // - Fixed discount: $10.00
  // - Tax: 10%
  // - Expected grand total: $99.00
  const items = [
    { description: 'Product Design', quantity: 2, unit_price: 50.0, line_total: 0 }
  ];
  const res = calculateTotals(items, 10.0, 10.0);

  assert.equal(res.subtotal, 100.0);
  assert.equal(res.discount, 10.0);
  assert.equal(res.tax_rate, 10.0);
  assert.equal(res.tax_amount, 9.0);
  assert.equal(res.grand_total, 99.0);
  assert.equal(res.items[0].line_total, 100.0);
});

test('Calculations: discount capped at subtotal', () => {
  // If subtotal is $50, but discount is $100, actual discount applied is $50
  const items = [
    { description: 'Service', quantity: 1, unit_price: 50.0, line_total: 0 }
  ];
  const res = calculateTotals(items, 100.0, 10.0);

  assert.equal(res.subtotal, 50.0);
  assert.equal(res.discount, 50.0);
  assert.equal(res.tax_amount, 0.0);
  assert.equal(res.grand_total, 0.0);
});

test('Calculations: negative values are sanitized to zero', () => {
  const items = [
    { description: 'Invalid', quantity: -5, unit_price: -20.0, line_total: 0 }
  ];
  const res = calculateTotals(items, -10.0, -5.0);

  assert.equal(res.subtotal, 0.0);
  assert.equal(res.discount, 0.0);
  assert.equal(res.tax_rate, 0.0);
  assert.equal(res.tax_amount, 0.0);
  assert.equal(res.grand_total, 0.0);
});

test('Calculations: multi-item decimal rounding', () => {
  const items = [
    { description: 'Item 1', quantity: 3, unit_price: 33.33, line_total: 0 },
    { description: 'Item 2', quantity: 1.5, unit_price: 20.0, line_total: 0 },
  ];
  const res = calculateTotals(items, 5.0, 8.25);

  assert.equal(res.subtotal, 129.99);
  assert.equal(res.discount, 5.0);
  assert.equal(res.tax_amount, 10.31);
  assert.equal(res.grand_total, 135.30);
});

test('Format Currency: formats correctly with 2 decimal places and USD symbol', () => {
  assert.equal(formatCurrency(99), '$99.00');
  assert.equal(formatCurrency(1234.5), '$1,234.50');
  assert.equal(formatCurrency(0), '$0.00');
  assert.equal(formatCurrency(NaN), '$0.00');
});
