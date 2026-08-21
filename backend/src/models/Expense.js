import mongoose from "mongoose";

/**
 * Money helpers (Decimal128 in DB, numbers in API)
 */
const toDecimal = (v) => {
  if (v === null || v === undefined || v === "") return undefined;
  return mongoose.Types.Decimal128.fromString(String(v));
};
const decimalGetter = (v) => (v ? parseFloat(v.toString()) : 0);

const expenseSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    description: String,
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    date: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
);

// Optimized indexes for expense queries
expenseSchema.index(
  { tenantId: 1, category: 1, date: -1 },
  { name: "expense_tenant_category_date" },
);
expenseSchema.index({ tenantId: 1, date: -1 }, { name: "expense_tenant_date" });
expenseSchema.index(
  { tenantId: 1, createdBy: 1, date: -1 },
  { name: "expense_tenant_creator_date" },
);

export const Expense = mongoose.model("Expense", expenseSchema);
