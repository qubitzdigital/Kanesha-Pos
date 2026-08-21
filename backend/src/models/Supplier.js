import mongoose from "mongoose";

/**
 * Money helpers (Decimal128 in DB, numbers in API)
 */
const toDecimal = (v) => {
  if (v === null || v === undefined || v === "") return undefined;
  return mongoose.Types.Decimal128.fromString(String(v));
};
const decimalGetter = (v) => (v ? parseFloat(v.toString()) : 0);

const supplierSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    supplierCode: { type: String },
    name: { type: String, required: true, index: true },

    contactPerson: String,
    phones: [String],
    email: String,
    address: String,

    openingBalance: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    currentBalance: {
      type: mongoose.Schema.Types.Decimal128,
      default: () => toDecimal(0),
      set: toDecimal,
      get: decimalGetter,
    },
    creditLimit: {
      type: mongoose.Schema.Types.Decimal128,
      set: toDecimal,
      get: decimalGetter,
    },
    paymentTerms: {
      type: {
        type: String,
        enum: ["CASH", "COD", "ADVANCE", "NET"],
        default: "CASH",
      },
      days: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    notes: String,

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
);

// Text index for full-text search
supplierSchema.index(
  {
    name: "text",
    email: "text",
    contactPerson: "text",
  },
  { name: "supplier_text_search" },
);

// Compound indexes: always include tenantId for queries
supplierSchema.index(
  { tenantId: 1, supplierCode: 1 },
  {
    unique: true,
    sparse: true,
    name: "supplier_tenant_code",
  },
);
supplierSchema.index(
  { tenantId: 1, status: 1, createdAt: -1 },
  { name: "supplier_tenant_status_recent" },
);
supplierSchema.index(
  { tenantId: 1, name: 1 },
  { unique: true, name: "supplier_tenant_name_unique" },
);
supplierSchema.index(
  { tenantId: 1, "paymentTerms.type": 1 },
  { name: "supplier_tenant_payment_terms" },
);

export const Supplier = mongoose.model("Supplier", supplierSchema);
