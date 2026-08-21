import mongoose from "mongoose";

/**
 * Money helpers (Decimal128 in DB, numbers in API)
 */
const toDecimal = (v) => {
  if (v === null || v === undefined || v === "") return undefined;
  return mongoose.Types.Decimal128.fromString(String(v));
};
const decimalGetter = (v) => (v ? parseFloat(v.toString()) : 0);

const saleItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    description: String,
    qty: { type: Number, required: true },
    unit: { type: String, required: true },
    batchNumber: { type: String },
    // Size/variant sold (e.g. "S", "M", "L") — required at sale time when
    // the item has size variants, so the correct size's stock is deducted.
    variantSize: { type: String, trim: true },
    unitPrice: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    costPrice: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    discount: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    taxAmount: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    lineTotal: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
  },
  { _id: false, toJSON: { getters: true }, toObject: { getters: true } },
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cash", "card", "bank", "credit", "mixed"],
      required: true,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    reference: String,
  },
  { _id: false, toJSON: { getters: true }, toObject: { getters: true } },
);

const saleSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    billNumber: { type: String, required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    items: [saleItemSchema],
    subTotal: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    discountTotal: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    taxTotal: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    grandTotal: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    payments: [paymentSchema],
    balanceDue: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    status: {
      type: String,
      enum: ["paid", "partial", "credit", "cancelled", "pending"],
      default: "paid",
    },
    isTaxInvoice: { type: Boolean, default: false },
    savedAsPending: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
);

// Optimized indexes for sale transaction queries
saleSchema.index(
  { tenantId: 1, billNumber: 1 },
  { unique: true, name: "sale_tenant_bill_number" },
);
saleSchema.index(
  { tenantId: 1, customer: 1, createdAt: -1 },
  { name: "sale_tenant_customer_recent" },
);
saleSchema.index(
  { tenantId: 1, status: 1, createdAt: -1 },
  { name: "sale_tenant_status_recent" },
);
saleSchema.index(
  { tenantId: 1, createdAt: -1 },
  { name: "sale_tenant_recent" },
);
saleSchema.index(
  { tenantId: 1, status: 1, customer: 1 },
  { name: "sale_tenant_status_customer" },
);

export const Sale = mongoose.model("Sale", saleSchema);
