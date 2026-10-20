from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database import get_db
from app.models.invoice import Invoice, InvoiceItem, CustomField
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    InvoiceListItem,
    SendEmailRequest,
    SendEmailResponse,
)
from app.services.calculations import calculate_invoice_totals
from app.services.email_service import (
    send_invoice_email,
    EmailConfigurationError,
    EmailDeliveryError,
    is_email_configured,
)

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


@router.get("", response_model=List[InvoiceListItem])
def list_invoices(
    search: Optional[str] = Query(
        None, description="Search by invoice number or customer name"
    ),
    status: Optional[str] = Query(
        None, description="Filter by status (Draft, Sent, Paid, Overdue)"
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Invoice)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Invoice.invoice_number.ilike(term),
                Invoice.customer_name.ilike(term),
                Invoice.customer_email.ilike(term),
            )
        )

    if status and status.strip():
        query = query.filter(Invoice.status.ilike(status.strip()))

    invoices = query.order_by(desc(Invoice.created_at)).all()
    return invoices


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db)):
    # Check for duplicate invoice number
    existing = (
        db.query(Invoice)
        .filter(Invoice.invoice_number == payload.invoice_number)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An invoice with number '{payload.invoice_number}' already exists.",
        )

    # Authoritative financial calculations
    items_raw = [item.model_dump() for item in payload.items]
    try:
        calc_result = calculate_invoice_totals(
            items=items_raw, discount_amount=payload.discount, tax_rate=payload.tax_rate
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )

    invoice = Invoice(
        invoice_number=payload.invoice_number,
        issue_date=payload.issue_date,
        due_date=payload.due_date,
        status=payload.status or "Draft",
        notes=payload.notes or "",
        payment_terms=payload.payment_terms or "",
        currency=payload.currency or "USD",
        business_name=payload.business_name or "",
        business_subtitle=payload.business_subtitle
        or "Innovative Solutions for a Better Tomorrow",
        business_email=payload.business_email or "",
        business_phone=payload.business_phone or "",
        business_address=payload.business_address or "",
        business_logo=payload.business_logo or "",
        customer_name=payload.customer_name or "",
        customer_email=payload.customer_email or "",
        customer_phone=payload.customer_phone or "",
        customer_address=payload.customer_address or "",
        subtotal=calc_result["subtotal"],
        discount=calc_result["discount"],
        tax_rate=calc_result["tax_rate"],
        tax_amount=calc_result["tax_amount"],
        grand_total=calc_result["grand_total"],
    )

    db.add(invoice)
    db.flush()  # populates invoice.id

    for idx, itm in enumerate(calc_result["items"]):
        db_item = InvoiceItem(
            invoice_id=invoice.id,
            description=itm.get("description", ""),
            quantity=itm.get("quantity", 1.0),
            unit_price=itm.get("unit_price", 0.0),
            discount=itm.get("discount", 0.0),
            line_total=itm.get("line_total", 0.0),
            order_index=idx,
        )
        db.add(db_item)

    for idx, cf in enumerate(payload.custom_fields):
        db_cf = CustomField(
            invoice_id=invoice.id,
            label=cf.label,
            value=cf.value,
            is_visible=cf.is_visible,
            order_index=idx,
        )
        db.add(db_cf)

    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID '{invoice_id}' not found",
        )
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: str, payload: InvoiceUpdate, db: Session = Depends(get_db)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID '{invoice_id}' not found",
        )

    # Check for duplicate invoice number collision
    if payload.invoice_number and payload.invoice_number != invoice.invoice_number:
        collision = (
            db.query(Invoice)
            .filter(
                Invoice.invoice_number == payload.invoice_number,
                Invoice.id != invoice_id,
            )
            .first()
        )
        if collision:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An invoice with number '{payload.invoice_number}' already exists.",
            )

    # Basic scalar updates
    update_data = payload.model_dump(
        exclude_unset=True, exclude={"items", "custom_fields"}
    )
    for key, val in update_data.items():
        setattr(invoice, key, val)

    # Items handling and authoritative calculations
    items_to_process = (
        payload.items
        if payload.items is not None
        else [
            {
                "description": itm.description,
                "quantity": float(itm.quantity),
                "unit_price": float(itm.unit_price),
            }
            for itm in invoice.items
        ]
    )
    items_raw = [
        itm.model_dump() if hasattr(itm, "model_dump") else itm
        for itm in items_to_process
    ]

    try:
        calc_result = calculate_invoice_totals(
            items=items_raw,
            discount_amount=(
                payload.discount if payload.discount is not None else invoice.discount
            ),
            tax_rate=(
                payload.tax_rate if payload.tax_rate is not None else invoice.tax_rate
            ),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )

    invoice.subtotal = calc_result["subtotal"]
    invoice.discount = calc_result["discount"]
    invoice.tax_rate = calc_result["tax_rate"]
    invoice.tax_amount = calc_result["tax_amount"]
    invoice.grand_total = calc_result["grand_total"]

    if payload.items is not None:
        # Recreate items
        db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice.id).delete()
        for idx, itm in enumerate(calc_result["items"]):
            db_item = InvoiceItem(
                invoice_id=invoice.id,
                description=itm.get("description", ""),
                quantity=itm.get("quantity", 1.0),
                unit_price=itm.get("unit_price", 0.0),
                discount=itm.get("discount", 0.0),
                line_total=itm.get("line_total", 0.0),
                order_index=idx,
            )
            db.add(db_item)

    if payload.custom_fields is not None:
        # Recreate custom fields
        db.query(CustomField).filter(CustomField.invoice_id == invoice.id).delete()
        for idx, cf in enumerate(payload.custom_fields):
            db_cf = CustomField(
                invoice_id=invoice.id,
                label=cf.label,
                value=cf.value,
                is_visible=cf.is_visible,
                order_index=idx,
            )
            db.add(db_cf)

    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: str, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID '{invoice_id}' not found",
        )
    db.delete(invoice)
    db.commit()
    return {
        "success": True,
        "message": f"Invoice '{invoice.invoice_number}' deleted successfully",
    }


@router.post("/{invoice_id}/send", response_model=SendEmailResponse)
def send_invoice(
    invoice_id: str,
    payload: Optional[SendEmailRequest] = None,
    db: Session = Depends(get_db),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID '{invoice_id}' not found",
        )

    recipient = None
    if payload and payload.recipient_email:
        recipient = payload.recipient_email.strip()
    elif invoice.customer_email:
        recipient = invoice.customer_email.strip()

    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient email address is required. Please set Customer Email in the invoice or provide one.",
        )

    custom_subject = payload.subject if payload else None
    custom_message = payload.message if payload else None

    try:
        delivered_to = send_invoice_email(
            invoice=invoice,
            recipient_email=recipient,
            custom_subject=custom_subject,
            custom_message=custom_message,
        )
        invoice.status = "Sent"
        db.commit()
        return SendEmailResponse(
            success=True,
            message=f"Invoice successfully delivered to {delivered_to}",
            invoice_id=invoice.id,
            recipient_email=delivered_to,
        )
    except EmailConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    except EmailDeliveryError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
