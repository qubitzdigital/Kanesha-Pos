import mongoose from "mongoose";

/**
 * Money helpers (Decimal128 in DB, numbers in API)
 */
const toDecimal = (v) => {
  if (v === null || v === undefined || v === "") return undefined;
  return mongoose.Types.Decimal128.fromString(String(v));
};
const decimalGetter = (v) => (v ? parseFloat(v.toString()) : 0);

const customerSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    phone: { type: String, index: true },
    address: String,
    nic: String,
    type: { type: String, enum: ["cash", "credit", "both"], default: "both" },
    creditLimit: {
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
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
);

// Text index for full-text search
customerSchema.index(
  { name: "text", phone: "text", address: "text" },
  { name: "customer_text_search" },
);

// Compound indexes: tenantId is always included for multi-tenancy
customerSchema.index(
  { tenantId: 1, name: 1 },
  { name: "customer_tenant_name" },
);
customerSchema.index(
  { tenantId: 1, phone: 1 },
  { sparse: true, name: "customer_tenant_phone" },
);
customerSchema.index(
  { tenantId: 1, nic: 1 },
  { unique: true, sparse: true, name: "customer_tenant_nic_unique" },
);
customerSchema.index(
  { tenantId: 1, type: 1, createdAt: -1 },
  { name: "customer_tenant_type_recent" },
);

export const Customer = mongoose.model("Customer", customerSchema);
