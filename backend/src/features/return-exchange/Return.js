import mongoose from "mongoose";

const toDecimal = (v) => {
  if (v === null || v === undefined || v === "") return undefined;
  return mongoose.Types.Decimal128.fromString(String(v));
};
const decimalGetter = (v) => (v ? parseFloat(v.toString()) : 0);

const returnLineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    name: String,
    sku: String,
    batchNumber: { type: String },
    batchId: { type: mongoose.Schema.Types.ObjectId },
    // Size sold/returned (e.g. "S", "M") — required whenever the item has
    // size variants, so stock is restored to the right size bucket.
    variantSize: { type: String, trim: true },
    returnQty: { type: Number, required: true, min: 1 },
    unit: String,
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
    refundAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
  },
  { _id: false, toJSON: { getters: true }, toObject: { getters: true } },
);

// The item newly issued to the customer as part of an exchange (only
// present on exchange records). Stock for this line is deducted, mirroring
// how a normal sale line works.
const exchangeLineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    name: String,
    sku: String,
    batchNumber: { type: String },
    batchId: { type: mongoose.Schema.Types.ObjectId },
    variantSize: { type: String, trim: true },
    qty: { type: Number, required: true, min: 1 },
    unit: String,
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
    lineTotal: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
  },
  { _id: false, toJSON: { getters: true }, toObject: { getters: true } },
);

const returnSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    // "return": refund only. "exchange": returned item(s) restocked AND a
    // new item issued, with a balance (extra payment or refund) settled.
    type: {
      type: String,
      enum: ["return", "exchange"],
      default: "return",
      index: true,
    },
    originalSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
    },
    billNumber: { type: String },
    reason: { type: String, required: true },
    reasonNote: { type: String },
    returnLines: { type: [returnLineSchema], required: true },
    // Only present when type === "exchange"
    exchangeLines: { type: [exchangeLineSchema], default: undefined },
    totalRefund: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    // Only meaningful for exchanges: new item total minus return credit.
    // Positive = customer pays extra, negative = customer is refunded.
    balanceDue: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    profitDeducted: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    status: {
      type: String,
      enum: ["processed"],
      default: "processed",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
);

returnSchema.index(
  { tenantId: 1, originalSaleId: 1 },
  { name: "return_tenant_sale" },
);
returnSchema.index(
  { tenantId: 1, createdAt: -1 },
  { name: "return_tenant_recent" },
);

export const Return = mongoose.model("Return", returnSchema);
