from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any

TWO_PLACES = Decimal("0.01")


def to_decimal(value: Any) -> Decimal:
    if value is None or value == "":
        return Decimal("0.00")
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal("0.00")


def round_currency(val: Decimal) -> Decimal:
    return val.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def calculate_line_total(
    quantity: Any, unit_price: Any, item_discount: Any = 0
) -> Decimal:
    qty = to_decimal(quantity)
    price = to_decimal(unit_price)
    discount = to_decimal(item_discount)

    if qty < 0:
        raise ValueError("Quantity cannot be negative")
    if price < 0:
        raise ValueError("Unit price cannot be negative")
    if discount < 0:
        raise ValueError("Item discount cannot be negative")

    gross = qty * price
    net = max(Decimal("0.00"), gross - discount)
    return round_currency(net)


def calculate_invoice_totals(
    items: List[Dict[str, Any]], discount_amount: Any, tax_rate: Any
) -> Dict[str, Any]:
    """
    Formulas:
    1. Line total = (quantity * unit price) - item_discount
    2. Subtotal = sum of all line totals
    3. Fixed discount must be a nonnegative amount and must not exceed the subtotal
    4. Taxable amount = subtotal - fixed discount
    5. Tax = taxable amount * tax rate / 100
    6. Grand total = taxable amount + tax
    """
    fixed_discount = to_decimal(discount_amount)
    rate = to_decimal(tax_rate)

    if fixed_discount < 0:
        raise ValueError("Discount cannot be negative")
    if rate < 0:
        raise ValueError("Tax rate cannot be negative")

    calculated_items = []
    subtotal = Decimal("0.00")

    for item in items:
        qty = to_decimal(item.get("quantity", 0))
        price = to_decimal(item.get("unit_price", 0))
        item_disc = to_decimal(item.get("discount", 0))

        line_total = calculate_line_total(qty, price, item_disc)
        subtotal += line_total
        calculated_items.append(
            {
                **item,
                "quantity": float(round_currency(qty)),
                "unit_price": float(round_currency(price)),
                "discount": float(round_currency(item_disc)),
                "line_total": float(line_total),
            }
        )

    subtotal = round_currency(subtotal)

    # Fixed discount cap rule: cannot exceed subtotal
    actual_discount = min(fixed_discount, subtotal)
    actual_discount = round_currency(actual_discount)

    taxable_amount = max(Decimal("0.00"), subtotal - actual_discount)
    taxable_amount = round_currency(taxable_amount)

    tax_amount = round_currency(taxable_amount * (rate / Decimal("100.00")))
    grand_total = round_currency(taxable_amount + tax_amount)

    return {
        "items": calculated_items,
        "subtotal": float(subtotal),
        "discount": float(actual_discount),
        "tax_rate": float(round_currency(rate)),
        "tax_amount": float(tax_amount),
        "grand_total": float(grand_total),
    }
