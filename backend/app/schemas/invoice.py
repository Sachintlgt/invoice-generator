import re
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator, model_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
VALID_STATUSES = {"Draft", "Sent", "Paid", "Overdue"}


def validate_optional_email(v: Optional[str]) -> Optional[str]:
    if v is None:
        return ""
    stripped = v.strip()
    if not stripped:
        return ""
    if not EMAIL_REGEX.match(stripped):
        raise ValueError(f"'{v}' is not a valid email address")
    return stripped


def parse_date_str(date_str: str) -> date:
    clean = date_str.strip().split("T")[0]
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(clean, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Invalid date format '{date_str}'. Expected YYYY-MM-DD.")


class InvoiceItemBase(BaseModel):
    description: str = Field(default="", max_length=500, description="Item description")
    quantity: float = Field(
        default=1.0, gt=0, description="Quantity must be greater than 0"
    )
    unit_price: float = Field(
        default=0.0, ge=0, description="Unit price must be non-negative"
    )
    discount: float = Field(
        default=0.0, ge=0, description="Per-item discount must be non-negative"
    )
    order_index: int = 0

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> str:
        return (v or "").strip()

    @model_validator(mode="after")
    def validate_discount(self):
        gross = round(self.quantity * self.unit_price, 2)
        if round(self.discount, 2) > gross:
            raise ValueError(
                f"Item discount (${self.discount:.2f}) cannot exceed line total (${gross:.2f})"
            )
        return self


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemResponse(InvoiceItemBase):
    id: str
    invoice_id: str
    line_total: float

    model_config = {"from_attributes": True}


class CustomFieldBase(BaseModel):
    label: str = Field(default="", max_length=128)
    value: str = Field(default="", max_length=255)
    is_visible: bool = True
    order_index: int = 0


class CustomFieldCreate(CustomFieldBase):
    pass


class CustomFieldResponse(CustomFieldBase):
    id: str
    invoice_id: str

    model_config = {"from_attributes": True}


class InvoiceBase(BaseModel):
    invoice_number: str = Field(
        ..., min_length=1, max_length=64, description="Invoice number is required"
    )
    issue_date: str = Field(..., min_length=1, description="Issue date is required")
    due_date: Optional[str] = None
    status: str = Field(default="Draft", description="Draft, Sent, Paid, Overdue")
    notes: Optional[str] = Field(default="", max_length=2000)
    payment_terms: Optional[str] = Field(default="", max_length=128)
    currency: str = Field(default="USD", max_length=10)

    # Business Information
    business_name: Optional[str] = Field(default="", max_length=255)
    business_subtitle: Optional[str] = Field(
        default="Innovative Solutions for a Better Tomorrow", max_length=255
    )
    business_email: Optional[str] = Field(default="", max_length=255)
    business_phone: Optional[str] = Field(default="", max_length=64)
    business_address: Optional[str] = Field(default="", max_length=2000)
    business_logo: Optional[str] = None

    # Customer Information
    customer_name: Optional[str] = Field(default="", max_length=255)
    customer_email: Optional[str] = Field(default="", max_length=255)
    customer_phone: Optional[str] = Field(default="", max_length=64)
    customer_address: Optional[str] = Field(default="", max_length=2000)

    # Financial Settings
    discount: float = Field(
        default=0.0, ge=0, description="Discount must be non-negative"
    )
    tax_rate: float = Field(
        default=0.0, ge=0, le=100, description="Tax rate must be between 0% and 100%"
    )

    @field_validator("invoice_number")
    @classmethod
    def validate_invoice_number(cls, v: str) -> str:
        stripped = (v or "").strip()
        if not stripped:
            raise ValueError("Invoice number cannot be empty")
        return stripped

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(
                f"Invalid status '{v}'. Allowed statuses: {', '.join(sorted(VALID_STATUSES))}"
            )
        return v

    @field_validator("business_email", "customer_email")
    @classmethod
    def validate_emails(cls, v: Optional[str]) -> Optional[str]:
        return validate_optional_email(v)

    @field_validator("issue_date")
    @classmethod
    def validate_issue_date(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Issue date is required")
        parse_date_str(v)
        return v.strip().split("T")[0]

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        parse_date_str(v)
        return v.strip().split("T")[0]

    @model_validator(mode="after")
    def validate_dates_and_business(self):
        if self.issue_date and self.due_date:
            issue_d = parse_date_str(self.issue_date)
            due_d = parse_date_str(self.due_date)
            if due_d < issue_d:
                raise ValueError("Due date cannot be earlier than issue date")
        if self.status != "Draft":
            if not (self.business_name or "").strip():
                raise ValueError("Business name is required")
        return self


class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate] = Field(
        ..., min_length=1, description="At least one line item is required"
    )
    custom_fields: List[CustomFieldCreate] = Field(default_factory=list)


class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = Field(default=None, max_length=64)
    issue_date: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    payment_terms: Optional[str] = Field(default=None, max_length=128)
    currency: Optional[str] = Field(default=None, max_length=10)

    # Business Information
    business_name: Optional[str] = Field(default=None, max_length=255)
    business_subtitle: Optional[str] = Field(default=None, max_length=255)
    business_email: Optional[str] = Field(default=None, max_length=255)
    business_phone: Optional[str] = Field(default=None, max_length=64)
    business_address: Optional[str] = Field(default=None, max_length=2000)
    business_logo: Optional[str] = None

    # Customer Information
    customer_name: Optional[str] = Field(default=None, max_length=255)
    customer_email: Optional[str] = Field(default=None, max_length=255)
    customer_phone: Optional[str] = Field(default=None, max_length=64)
    customer_address: Optional[str] = Field(default=None, max_length=2000)

    # Financial Settings
    discount: Optional[float] = Field(default=None, ge=0)
    tax_rate: Optional[float] = Field(default=None, ge=0, le=100)

    items: Optional[List[InvoiceItemCreate]] = None
    custom_fields: Optional[List[CustomFieldCreate]] = None

    @field_validator("invoice_number")
    @classmethod
    def validate_invoice_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        stripped = v.strip()
        if not stripped:
            raise ValueError("Invoice number cannot be empty")
        return stripped

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if v not in VALID_STATUSES:
            raise ValueError(
                f"Invalid status '{v}'. Allowed statuses: {', '.join(sorted(VALID_STATUSES))}"
            )
        return v

    @field_validator("business_email", "customer_email")
    @classmethod
    def validate_emails(cls, v: Optional[str]) -> Optional[str]:
        return validate_optional_email(v)

    @field_validator("issue_date")
    @classmethod
    def validate_issue_date(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        parse_date_str(v)
        return v.strip().split("T")[0]

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        parse_date_str(v)
        return v.strip().split("T")[0]

    @field_validator("items")
    @classmethod
    def validate_items_if_provided(
        cls, v: Optional[List[InvoiceItemCreate]]
    ) -> Optional[List[InvoiceItemCreate]]:
        if v is not None and len(v) == 0:
            raise ValueError("At least one line item is required")
        return v


class InvoiceListItem(BaseModel):
    id: str
    invoice_number: str
    customer_name: Optional[str] = ""
    customer_email: Optional[str] = ""
    issue_date: str
    due_date: Optional[str] = None
    status: str
    grand_total: float
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class InvoiceResponse(InvoiceBase):
    id: str
    subtotal: float
    discount: float
    tax_rate: float
    tax_amount: float
    grand_total: float
    items: List[InvoiceItemResponse] = Field(default_factory=list)
    custom_fields: List[CustomFieldResponse] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SendEmailRequest(BaseModel):
    recipient_email: Optional[str] = Field(default=None, max_length=255)
    subject: Optional[str] = Field(default=None, max_length=500)
    message: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("recipient_email")
    @classmethod
    def validate_recipient(cls, v: Optional[str]) -> Optional[str]:
        return validate_optional_email(v)


class SendEmailResponse(BaseModel):
    success: bool
    message: str
    invoice_id: str
    recipient_email: str
