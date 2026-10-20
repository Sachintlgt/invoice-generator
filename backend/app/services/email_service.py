import os
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from app.models.invoice import Invoice

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class EmailError(Exception):
    pass


class EmailConfigurationError(EmailError):
    pass


class EmailDeliveryError(EmailError):
    pass


def get_email_config():
    host = os.getenv("SMTP_SERVER") or os.getenv("SMTP_HOST") or "smtp.gmail.com"
    user = os.getenv("SMTP_USER") or os.getenv("SMTP_API_KEY") or ""
    password = os.getenv("SMTP_PASSWORD", "")
    from_email = os.getenv("SMTP_FROM_EMAIL") or user or "expensetracker15@gmail.com"
    from_name = os.getenv("SMTP_FROM_NAME") or "Invoice Studio"
    enquiry_email = os.getenv("ENQUERY_EMAIL") or os.getenv("ENQUIRY_EMAIL") or ""

    return {
        "host": host.strip(),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": user.strip(),
        "password": password.strip(),
        "from_email": from_email.strip(),
        "from_name": from_name.strip(),
        "reply_to": enquiry_email.strip(),
        "enquiry_email": enquiry_email.strip(),
        "use_tls": os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes"),
        "dev_override_recipient": os.getenv("DEVELOPER_TEST_EMAIL", "").strip(),
    }


def is_email_configured() -> bool:
    config = get_email_config()
    return bool(config["host"] and config["user"] and config["password"])


def generate_invoice_html(
    invoice: Invoice,
    custom_message: Optional[str] = None,
    enquiry_email: Optional[str] = None,
) -> str:
    business_name = invoice.business_name or "Invoice Studio"
    customer_name = invoice.customer_name or "Valued Customer"

    # Line items table rows
    items_rows = ""
    for item in invoice.items:
        qty = float(item.quantity or 0)
        price = float(item.unit_price or 0)
        total = float(item.line_total or 0)
        items_rows += f"""
        <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #1E293B;">{item.description or 'Item'}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #475569;">{qty:g}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #475569;">${price:,.2f}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 600; color: #0F172A;">${total:,.2f}</td>
        </tr>
        """

    custom_note_block = (
        f"""
    <div style="background-color: #EFF6FF; border-left: 4px solid #2563EB; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #1E3A8A;">
        {custom_message}
    </div>
    """
        if custom_message
        else ""
    )

    terms_block = (
        f"""
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 13px; color: #64748B;">
        <strong>Notes / Terms:</strong> {invoice.notes or 'Payment due upon receipt.'}
    </div>
    """
        if (invoice.notes or invoice.payment_terms)
        else ""
    )

    enquiry_contact_html = (
        f'<p style="margin: 8px 0 0; font-size: 12px; color: #64748B;">For questions or enquiries regarding this invoice, reply to this email or reach us at <a href="mailto:{enquiry_email}" style="color: #2563EB; font-weight: 500; text-decoration: underline;">{enquiry_email}</a>.</p>'
        if enquiry_email
        else ""
    )

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {invoice.invoice_number}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #0F172A;">
    <div style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background-color: #0F172A; padding: 28px 32px; color: #FFFFFF;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="vertical-align: top;">
                        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">{business_name}</h1>
                        <p style="margin: 4px 0 0; font-size: 13px; color: #94A3B8;">Invoice #{invoice.invoice_number}</p>
                    </td>
                    <td style="text-align: right; vertical-align: top;">
                        <span style="display: inline-block; padding: 4px 10px; background-color: #2563EB; color: #FFFFFF; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                            {invoice.status or 'Sent'}
                        </span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px;">
            {custom_note_block}

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                    <td style="vertical-align: top; width: 50%;">
                        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; font-weight: 600; margin-bottom: 6px;">Billed To:</div>
                        <div style="font-size: 15px; font-weight: 600; color: #0F172A;">{customer_name}</div>
                        <div style="font-size: 13px; color: #475569; margin-top: 2px;">{invoice.customer_email or ''}</div>
                        <div style="font-size: 13px; color: #475569; margin-top: 2px;">{invoice.customer_address or ''}</div>
                    </td>
                    <td style="vertical-align: top; width: 50%; text-align: right;">
                        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; font-weight: 600; margin-bottom: 6px;">Dates:</div>
                        <div style="font-size: 13px; color: #475569;">Issue Date: <strong>{invoice.issue_date}</strong></div>
                        <div style="font-size: 13px; color: #475569; margin-top: 2px;">Due Date: <strong>{invoice.due_date or 'On Receipt'}</strong></div>
                    </td>
                </tr>
            </table>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <thead>
                    <tr style="background-color: #F8FAFC; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B;">
                        <th style="padding: 10px 12px; border-bottom: 2px solid #E2E8F0;">Description</th>
                        <th style="padding: 10px 12px; border-bottom: 2px solid #E2E8F0; text-align: center;">Qty</th>
                        <th style="padding: 10px 12px; border-bottom: 2px solid #E2E8F0; text-align: right;">Price</th>
                        <th style="padding: 10px 12px; border-bottom: 2px solid #E2E8F0; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_rows}
                </tbody>
            </table>

            <!-- Totals Section -->
            <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                <table style="width: 260px; margin-left: auto; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748B;">Subtotal:</td>
                        <td style="padding: 6px 0; text-align: right; color: #0F172A; font-weight: 500;">${float(invoice.subtotal or 0):,.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748B;">Discount:</td>
                        <td style="padding: 6px 0; text-align: right; color: #16A34A; font-weight: 500;">-${float(invoice.discount or 0):,.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748B;">Tax ({float(invoice.tax_rate or 0):g}%):</td>
                        <td style="padding: 6px 0; text-align: right; color: #0F172A; font-weight: 500;">${float(invoice.tax_amount or 0):,.2f}</td>
                    </tr>
                    <tr style="border-top: 2px solid #0F172A;">
                        <td style="padding: 10px 0 4px; font-weight: 700; font-size: 16px; color: #0F172A;">Grand Total:</td>
                        <td style="padding: 10px 0 4px; text-align: right; font-weight: 700; font-size: 18px; color: #2563EB;">${float(invoice.grand_total or 0):,.2f}</td>
                    </tr>
                </table>
            </div>

            {terms_block}
        </div>

        <!-- Footer -->
        <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94A3B8;">
            <p style="margin: 0; color: #64748B;">Generated and sent via Invoice Studio • Professional Invoicing for Small Business</p>
            {enquiry_contact_html}
        </div>
    </div>
</body>
</html>"""
    return html


def send_invoice_email(
    invoice: Invoice,
    recipient_email: str,
    custom_subject: Optional[str] = None,
    custom_message: Optional[str] = None,
) -> str:
    config = get_email_config()

    if not is_email_configured():
        raise EmailConfigurationError(
            "Email credentials are not configured. Please define SMTP_HOST, SMTP_PORT, "
            "SMTP_USER, and SMTP_PASSWORD in backend/.env"
        )

    target_email = (
        config["dev_override_recipient"]
        if config["dev_override_recipient"]
        else recipient_email or ""
    ).strip()
    if not target_email or not EMAIL_REGEX.match(target_email):
        raise ValueError(f"'{target_email}' is not a valid recipient email address")

    subject = (
        custom_subject
        or f"Invoice {invoice.invoice_number} from {invoice.business_name or 'Invoice Studio'}"
    )

    # Build MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{config['from_name']} <{config['from_email']}>"
    msg["To"] = target_email
    if config.get("reply_to"):
        msg["Reply-To"] = config["reply_to"]

    # Plain text fallback
    plain_text = f"""Invoice #{invoice.invoice_number}
From: {invoice.business_name or 'Invoice Studio'}
Billed To: {invoice.customer_name or 'Customer'}
Issue Date: {invoice.issue_date}
Due Date: {invoice.due_date or 'On Receipt'}

Grand Total: ${float(invoice.grand_total or 0):,.2f} USD
Status: {invoice.status or 'Sent'}

Notes: {invoice.notes or 'None'}
"""
    if config.get("enquiry_email"):
        plain_text += (
            f"\nFor inquiries, please reach out to {config['enquiry_email']}\n"
        )

    html_content = generate_invoice_html(
        invoice=invoice,
        custom_message=custom_message,
        enquiry_email=config.get("enquiry_email"),
    )

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        if config["port"] == 465:
            server = smtplib.SMTP_SSL(config["host"], config["port"], timeout=15)
        else:
            server = smtplib.SMTP(config["host"], config["port"], timeout=15)
            if config["use_tls"]:
                server.starttls()

        try:
            server.login(config["user"], config["password"])
        except smtplib.SMTPAuthenticationError:
            # Fallback with whitespace stripped if app password formatted with spaces
            clean_pwd = config["password"].replace(" ", "")
            if clean_pwd != config["password"]:
                server.login(config["user"], clean_pwd)
            else:
                raise

        server.sendmail(config["from_email"], [target_email], msg.as_string())
        server.quit()
        return target_email
    except Exception as exc:
        raise EmailDeliveryError(f"Failed to deliver email: {str(exc)}") from exc
