# Invoice Studio — Customizable Invoice Generator

A production-ready, full-stack customizable invoice generator built for small businesses and independent contractors. Features a modern three-column SaaS dashboard, instant live preview, custom metadata fields, decimal-safe financial calculations, PDF export via browser print styles, and automated email delivery.

---

## 📸 Overview & Key Features

- **No Authentication Required**: Immediate access to the invoice management interface without registration barriers.
- **Three-Column Dashboard Layout**:
  - **Left Sidebar**: Saved invoices list, search by invoice number or client name, status filtering (`Draft`, `Sent`, `Paid`, `Overdue`), invoice selection, and quick deletion with confirmation.
  - **Center Editor**: Modular card-based editor covering Invoice Details, Business Information (with drag-and-drop logo upload), Customer Details, Line Items table, Custom Fields, and Discount/Tax settings.
  - **Right Column (Live Preview)**: Pixel-perfect, paper-like invoice document that updates in real time with desktop and mobile preview simulation modes and zoom controls.
- **Authoritative Decimal-Safe Financial Calculations**:
  - Validates and calculates authoritative totals on both frontend and backend.
  - Line total = quantity × unit price.
  - Subtotal = sum of all rounded line totals.
  - Fixed discount in USD (capped at subtotal to prevent negative billing).
  - Taxable amount = subtotal − discount.
  - Tax = taxable amount × tax rate / 100.
  - Grand total = taxable amount + tax.
  - **Interview Example Verified**: 2 × $50.00 = $100.00 subtotal, $10.00 discount, 10% tax → **$99.00 Grand Total**.
- **Custom Metadata Fields**:
  - Add arbitrary key-value pairs (e.g., `Project Name`, `Purchase Order Number`, `Tax ID / GSTIN`, `Payment Terms`).
  - Toggle visibility per field so only approved metadata appears on the rendered invoice.
- **Dedicated Print Styles (PDF Export)**:
  - Clean `@media print` CSS rules automatically hide the top bar, sidebar, editor, buttons, and preview toolbar, printing **only** the pristine invoice document.
- **SMTP Email Delivery**:
  - Sends beautifully formatted HTML invoice emails with client billing summaries.
  - Supports developer test override (`DEVELOPER_TEST_EMAIL`) to prevent sending emails to real client addresses during testing.
  - Accurate error reporting when email credentials are not configured or SMTP fails.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Bundler / Dev Server**: Vite
- **Styling**: Tailwind CSS v4 with custom responsive design system
- **Icons**: Lucide React
- **HTTP Client**: Axios with configured API base URL and proxy
- **Validation & Calculations**: TypeScript decimal-safe arithmetic engine and Node test runner

### Backend
- **Framework**: Python 3.12 with FastAPI
- **ORM**: SQLAlchemy 2.0
- **Database Migrations**: Alembic
- **Schemas & Validation**: Pydantic v2
- **Database**: PostgreSQL (with optional SQLite portability)
- **Testing**: Pytest with HTTPX TestClient

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+) and npm
- Python (v3.10+) or `uv`
- PostgreSQL (or Docker for running PostgreSQL container)

---

### Step 1: Start PostgreSQL Database

Using the provided `docker-compose.yml`:
```bash
docker compose up -d db
```
*Note: This starts PostgreSQL 16 on port `5434` with username `postgres`, password `postgres`, and database `invoice_studio`.*

---

### Step 2: Backend Setup & Migrations

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
   *(Or using `uv`: `uv venv .venv && source .venv/bin/activate`)*

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if you wish to configure SMTP email credentials:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5434/invoice_studio
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=billing@invoicestudio.app
   DEVELOPER_TEST_EMAIL=developer-test@example.com
   ```

5. Run Alembic database migrations:
   ```bash
   alembic upgrade head
   ```

6. Seed demo invoices:
   ```bash
   python seed.py
   ```

7. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```
   Backend API docs will be available at: [http://localhost:8001/docs](http://localhost:8001/docs)

---

### Step 3: Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing

### Backend Unit & Integration Tests (17 tests)
Runs calculations checks (including the $99.00 test, negative inputs rejection, discount caps), CRUD API endpoints, search filters, and email flows:
```bash
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests
```

### Frontend Calculations Tests (5 tests)
Runs financial formulas, multi-item rounding, currency formatters, and edge cases:
```bash
cd frontend && npm test
```

### Production Build Test
Verify that TypeScript compiles with zero errors and Vite produces optimized assets:
```bash
cd frontend && npm run build
```

---

## 🧮 Financial Calculations Reference

All calculations adhere strictly to the formula specifications:

| Metric | Formula | Example |
| :--- | :--- | :--- |
| **Line Total** | `Quantity × Unit Price` | 2 × $50.00 = **$100.00** |
| **Subtotal** | `∑ Line Totals` | **$100.00** |
| **Discount** | `min(Fixed Discount, Subtotal)` | **$10.00** |
| **Taxable Amount** | `Subtotal − Discount` | $100.00 − $10.00 = **$90.00** |
| **Tax Amount** | `Taxable Amount × (Tax Rate / 100)` | $90.00 × 10% = **$9.00** |
| **Grand Total** | `Taxable Amount + Tax Amount` | $90.00 + $9.00 = **$99.00** |

Negative values for quantities, prices, discounts, and tax rates are rejected on the backend (HTTP 422) and prevented in the frontend inputs.

---

## 📧 Email Delivery Workflow

When a user clicks **Send Email**:
1. If the invoice has not been saved yet, the application prompts to save the invoice first.
2. The modal pre-fills the client's email address from the invoice customer details.
3. The backend validates credentials:
   - If SMTP credentials are missing, it returns HTTP 503 with:  
     `"Email credentials are not configured. Please define SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in backend/.env"`.
   - If `DEVELOPER_TEST_EMAIL` is set in `.env`, the email is safely sent to the developer's address instead of real client inboxes.
4. On confirmed transmission, the invoice status is updated to **Sent** in PostgreSQL.

---

## 🖨 Browser Print & Save as PDF

Clicking **Print / PDF** in either the bottom action bar or the preview toolbar calls `window.print()`.

The `@media print` stylesheet guarantees:
- Top navigation bar, left sidebar, editor cards, preview controls, and bottom buttons are **hidden** (`display: none !important`).
- Only the `#invoice-printable-document` is printed.
- Page margins and color fidelity are preserved for high-resolution output.

---

## 🤖 AI Tools Disclosure

In accordance with interview requirements:
- **Tools Used**: Antigravity AI Coding Assistant (Gemini 3.8 Flash model).
- **Assistance Provided**:
  - Scaffolding the React 19 + TypeScript + Vite project and Tailwind v4 setup.
  - Designing the modular card-based UI and live invoice preview layout.
  - Writing decimal-safe calculation modules for Python and TypeScript.
  - Creating Alembic migrations, database models, and Pytest / Node test suites.
  - Formulating responsive `@media print` CSS rules.

---

## ⏱ Time Spent & Known Limitations

- **Time Spent**: ~2 hours and 15 minutes.
- **Architectural Trade-offs & Limitations**:
  - **Authentication**: Intentionally omitted per interview specification ("The application must work without login or signup"). For a multi-tenant public deployment, JWT or session-based authentication with tenant isolation should be added.
  - **Multi-Currency Support**: Hardcoded to USD ($) per interview specification. Multi-currency support (EUR, GBP, JPY) could be added via an exchange rate service.
  - **Payment Gateways**: Stripe / PayPal integration was explicitly excluded by the project constraints.
  - **Auto-Save**: Form state updates recalculate totals in real time; saving is triggered explicitly via the Save button or modal confirmation before switching drafts to prevent accidental overwrites.
