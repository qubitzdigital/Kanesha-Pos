import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },

    type: {
      type: String,
      enum: [
        "sale",
        "purchase",
        "adjustment",
        "opening",
        "grn",
        "grn_cancel",
        "return",
        "exchange_return",
        "exchange_issue",
      ],
      required: true,
      index: true,
    },

    qty: { type: Number, required: true, min: 0.000001 },

    direction: { type: String, enum: ["in", "out"], required: true },

    // we will store GRN _id here
    referenceId: { type: mongoose.Schema.Types.ObjectId, index: true },

    // Which batch/lot this movement affected (for batch-tracked items)
    batchNumber: { type: String, trim: true },
    // Which size this movement affected (for items with size variants)
    variantSize: { type: String, trim: true },

    note: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Optimized indexes for stock movement tracking
stockMovementSchema.index(
  { tenantId: 1, item: 1, createdAt: -1 },
  { name: "stock_movement_tenant_item_recent" },
);
stockMovementSchema.index(
  { tenantId: 1, type: 1, createdAt: -1 },
  { name: "stock_movement_tenant_type_recent" },
);
stockMovementSchema.index(
  { tenantId: 1, referenceId: 1, type: 1 },
  { name: "stock_movement_tenant_reference_type", sparse: true },
);
stockMovementSchema.index(
  { tenantId: 1, createdAt: -1 },
  { name: "stock_movement_tenant_recent" },
);

export const StockMovement = mongoose.model(
  "StockMovement",
  stockMovementSchema,
);
