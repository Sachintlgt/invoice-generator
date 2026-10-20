import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Numeric,
    Boolean,
    Integer,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_number = Column(String(64), nullable=False, index=True)
    issue_date = Column(String(32), nullable=False)
    due_date = Column(String(32), nullable=True)
    status = Column(String(32), default="Draft", index=True)
    notes = Column(Text, nullable=True, default="")
    payment_terms = Column(String(128), nullable=True, default="")
    currency = Column(String(10), default="USD")

    # Business Information
    business_name = Column(String(255), default="")
    business_subtitle = Column(
        String(255), default="Innovative Solutions for a Better Tomorrow"
    )
    business_email = Column(String(255), default="")
    business_phone = Column(String(64), default="")
    business_address = Column(Text, default="")
    business_logo = Column(Text, nullable=True, default="")

    # Customer Information
    customer_name = Column(String(255), default="")
    customer_email = Column(String(255), default="")
    customer_phone = Column(String(64), default="")
    customer_address = Column(Text, default="")

    # Financial Totals (Numeric with 2 decimal places for financial accuracy)
    subtotal = Column(Numeric(12, 2), default=0.00)
    discount = Column(Numeric(12, 2), default=0.00)
    tax_rate = Column(Numeric(5, 2), default=0.00)
    tax_amount = Column(Numeric(12, 2), default=0.00)
    grand_total = Column(Numeric(12, 2), default=0.00)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    items = relationship(
        "InvoiceItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="InvoiceItem.order_index",
    )
    custom_fields = relationship(
        "CustomField",
        back_populates="invoice",
        cascade="all, delete-orphan",
        order_by="CustomField.order_index",
    )


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_id = Column(
        String(36),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    description = Column(String(500), default="")
    quantity = Column(Numeric(10, 2), default=1.00)
    unit_price = Column(Numeric(12, 2), default=0.00)
    discount = Column(Numeric(12, 2), default=0.00)
    line_total = Column(Numeric(12, 2), default=0.00)
    order_index = Column(Integer, default=0)

    invoice = relationship("Invoice", back_populates="items")


class CustomField(Base):
    __tablename__ = "custom_fields"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_id = Column(
        String(36),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label = Column(String(128), default="")
    value = Column(String(255), default="")
    is_visible = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)

    invoice = relationship("Invoice", back_populates="custom_fields")
