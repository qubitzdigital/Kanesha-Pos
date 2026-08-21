import mongoose from "mongoose";

/**
 * Money helpers (Decimal128 in DB, numbers in API)
 */
const toDecimal = (v) => {
  if (v === null || v === undefined || v === "") return undefined;
  return mongoose.Types.Decimal128.fromString(String(v));
};
const decimalGetter = (v) => (v ? parseFloat(v.toString()) : 0);

const purchaseItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    qty: { type: Number, required: true },
    unit: { type: String, required: true },
    costPrice: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    lineTotal: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    batchNumber: String,
    expiryDate: Date,
  },
  { _id: false, toJSON: { getters: true }, toObject: { getters: true } },
);

const purchaseSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    billNumber: { type: String, required: true },
    billDate: { type: Date, required: true },
    items: [purchaseItemSchema],
    note: { type: String },
    subTotal: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
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
    amountPaid: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    balanceDue: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    status: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      default: "unpaid",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
);

// Optimized indexes for purchase transaction queries
purchaseSchema.index(
  { tenantId: 1, billNumber: 1 },
  { unique: true, name: "purchase_tenant_bill" },
);
purchaseSchema.index(
  { tenantId: 1, supplier: 1, createdAt: -1 },
  { name: "purchase_tenant_supplier_recent" },
);
purchaseSchema.index(
  { tenantId: 1, status: 1, createdAt: -1 },
  { name: "purchase_tenant_status_recent" },
);
purchaseSchema.index(
  { tenantId: 1, billDate: -1 },
  { name: "purchase_tenant_date" },
);
purchaseSchema.index(
  { tenantId: 1, status: 1 },
  { name: "purchase_tenant_status" },
);

export const Purchase = mongoose.model("Purchase", purchaseSchema);
