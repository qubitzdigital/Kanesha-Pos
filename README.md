# SL Hardware POS (React + Node + MongoDB)

Sri Lanka–focused POS for hardware shops.

- React + Vite + Tailwind CSS
- Node.js (Express) + MongoDB
- VAT-aware billing, zero-rated items
- A4 tax invoices + 80mm thermal receipts
- Barcode printing & scanning
- Inventory with product CRUD
- Expenses, reports, customers, suppliers
- Settings screen for shop info & VAT *

## Quick start

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Front-end:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Seed an admin:

```bash
curl -X POST http://localhost:5000/api/auth/seed-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","username":"admin","password":"admin123"}'
```

Then log in on the frontend with that user.

### Product CRUD

- Go to **Inventory**.
- Left side: form to **add / edit** products:
  - Name, SKU, barcode, category
  - Base unit (pcs, bag, ft, kg…)
  - Selling price, cost price
  - Opening & current stock
  - Low-stock level
  - VAT applicable checkbox
- Right side: table of products with:
  - **Edit**: loads into the form for update.
  - **Delete**: removes the product.
  - **Print barcode**: opens printable barcode label.

### VAT & invoices

- VAT rate is configured on **Settings** page (stored in MongoDB).
- Products with **VAT applicable = true** will be charged VAT for **Tax Invoices**.
- Two invoice layouts:
  - `/invoice/a4/:id` – A4 tax invoice.
  - `/invoice/thermal/:id` – 80mm receipt.
- POS redirects to the **thermal** layout after saving a sale.