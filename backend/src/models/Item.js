// models/Item.v1.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * Money helpers (Decimal128 in DB, numbers in API)
 */
const toDecimal = (v) => {
  if (v === null || v === undefined || v === "") return undefined;
  return mongoose.Types.Decimal128.fromString(String(v));
};
const decimalGetter = (v) => (v ? parseFloat(v.toString()) : 0);
const sumBatchQty = (batches = []) =>
  batches.reduce((sum, b) => sum + (Number(b.qtyOnHand) || 0), 0);
const sumVariantStock = (variants = []) =>
  variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
const sumBatchSizes = (sizes = []) =>
  sizes.reduce((sum, s) => sum + (Number(s.qtyOnHand) || 0), 0);

/**
 * Per-size stock split within a single batch.
 * Only used when an item is BOTH batch-tracked AND has sizes — e.g. a batch
 * of imported jackets that contains S/M/L within the same batch/lot.
 */
const batchSizeSchema = new Schema(
  {
    size: { type: String, required: true, trim: true },
    qtyOnHand: { type: Number, default: 0, min: 0 },

    // Per-size cost price within this batch (e.g. size M cost 500, size L cost 550)
    costPrice: {
      type: Schema.Types.Decimal128,
      set: toDecimal,
      get: decimalGetter,
    },
  },
  { _id: false, toJSON: { getters: true }, toObject: { getters: true } },
);

/**
 * Batch schema with optional pricing per batch
 * Falls back to item-level pricing if not specified
 */
const batchSchema = new Schema(
  {
    batchNumber: { type: String, required: true, trim: true, index: true },
    qtyOnHand: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date },

    // Optional: batch-specific pricing (overrides item-level pricing)
    costPrice: {
      type: Schema.Types.Decimal128,
      set: toDecimal,
      get: decimalGetter,
    },
    sellingPrice: {
      type: Schema.Types.Decimal128,
      set: toDecimal,
      get: decimalGetter,
    },

    // Only used when the item has hasVariants=true AND isBatchTracked=true —
    // this batch's stock split out by size. When present, qtyOnHand above
    // is always kept as the sum of these (see Item pre-save hook).
    sizes: { type: [batchSizeSchema], default: undefined },
  },
  { _id: true, toJSON: { getters: true }, toObject: { getters: true } },
);

/**
 * Variant schema — for items that come in different sizes.
 * The item keeps ONE name, ONE barcode, ONE SKU; each variant only
 * carries what differs: size label, its own price, and its own stock.
 */
const variantSchema = new Schema(
  {
    size: { type: String, required: true, trim: true }, // e.g. "S", "M", "1L", "500g"
    sku: { type: String, trim: true, uppercase: true }, // optional per-size code (e.g. TSHIRT-M)

    sellingPrice: {
      type: Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    costPrice: {
      type: Schema.Types.Decimal128,
      set: toDecimal,
      get: decimalGetter,
    },

    stock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true, toJSON: { getters: true }, toObject: { getters: true } },
);

/**
 * Minimal inventory for v1
 */
const inventorySchema = new Schema(
  {
    onHand: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 }, // keep for future, unused in v1
  },
  { _id: false },
);

const itemSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    sku: {
      type: String,
      required: true,
      index: true,
      trim: true,
      uppercase: true,
    },

    name: { type: String, required: true, index: true, trim: true },
    barcode: { type: String, trim: true, index: true, sparse: true },
    category: { type: String, index: true, trim: true },
    brand: { type: String, trim: true },

    // Keep a single base unit for v1 (e.g. "pcs")
    baseUnit: { type: String, required: true, trim: true },

    // Minimal pricing
    sellingPrice: {
      type: Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    costPrice: {
      type: Schema.Types.Decimal128,
      required: true,
      set: toDecimal,
      get: decimalGetter,
    },
    lastPurchasePrice: {
      type: Schema.Types.Decimal128,
      set: toDecimal,
      get: decimalGetter,
    },

    // Stock mode
    isBatchTracked: { type: Boolean, default: false, index: true },

    // Size/variant mode — same name & barcode, different size/price/stock.
    // Can be combined with isBatchTracked=true: in that case `variants`
    // below is just the catalog of valid sizes (name/price), and the real
    // per-size stock lives inside each batch's `sizes[]` (a batch can
    // contain multiple sizes, e.g. a shipment of S/M/L jackets in one lot).
    hasVariants: { type: Boolean, default: false, index: true },

    // Stock
    inventory: { type: inventorySchema, default: () => ({}) },

    // Only used when isBatchTracked=true
    batches: { type: [batchSchema], default: undefined },

    // Only used when hasVariants=true
    variants: { type: [variantSchema], default: undefined },

    // Stock alerts
    lowStockLevel: { type: Number, default: 10, min: 0 },

    // Tax configuration
    taxApplicable: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0, min: 0, max: 1 }, // 0 to 1 (e.g., 0.15 for 15%)

    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  },
);

// Optimized indexes for efficient querying
// Text index for full-text search
itemSchema.index(
  {
    name: "text",
    sku: "text",
    barcode: "text",
    category: "text",
    brand: "text",
  },
  { name: "item_text_search" },
);

// Compound indexes: always include tenantId for multi-tenancy queries
itemSchema.index(
  { tenantId: 1, sku: 1 },
  { unique: true, name: "item_tenant_sku" },
);
itemSchema.index(
  { tenantId: 1, barcode: 1 },
  { unique: true, sparse: true, name: "item_tenant_barcode" },
);
itemSchema.index(
  { tenantId: 1, category: 1, isActive: 1 },
  { name: "item_tenant_category_status" },
);
itemSchema.index(
  { tenantId: 1, isActive: 1, isBatchTracked: 1 },
  { name: "item_tenant_status_batch" },
);
itemSchema.index(
  { tenantId: 1, isActive: 1, createdAt: -1 },
  { name: "item_tenant_status_recent" },
);

itemSchema.virtual("availableStock").get(function () {
  const onHand = this.inventory?.onHand || 0;
  const reserved = this.inventory?.reserved || 0;
  return Math.max(0, onHand - reserved);
});

// Virtual field for backward compatibility
itemSchema.virtual("currentStock").get(function () {
  return this.inventory?.onHand || 0;
});

// Expose opening stock as the total quantity across batches/variants (or inventory)
itemSchema.virtual("openingStock").get(function () {
  if (this.hasVariants && this.isBatchTracked) {
    // Combined mode: stock lives per-size inside each batch
    return sumBatchQty(this.batches || []);
  }
  if (this.hasVariants) {
    return sumVariantStock(this.variants || []);
  }
  if (this.isBatchTracked) {
    return sumBatchQty(this.batches || []);
  }
  return Number(this.inventory?.onHand || 0);
});

// Keep totals consistent for batch-tracked / variant items
itemSchema.pre("save", function () {
  if (this.hasVariants && this.isBatchTracked) {
    // Combined mode: each batch can be split across multiple sizes
    // (e.g. one shipment/lot containing S/M/L). `variants` stays as the
    // size catalog (name/price); real stock lives in batches[].sizes[].
    const batches = Array.isArray(this.batches) ? this.batches : [];
    for (const b of batches) {
      if (Array.isArray(b.sizes) && b.sizes.length) {
        b.qtyOnHand = sumBatchSizes(b.sizes);
      }
    }
    this.batches = batches;
    this.inventory = this.inventory || {};
    this.inventory.onHand = sumBatchQty(batches);
    // Opening/seed stock on the variant catalog isn't real stock in this
    // mode — actual quantities only ever enter via GRN batches.
    if (Array.isArray(this.variants)) {
      for (const v of this.variants) v.stock = 0;
    }
  } else if (this.hasVariants) {
    // For variant-only items, total stock is the sum of each size's stock
    const variants = Array.isArray(this.variants) ? this.variants : [];
    this.inventory = this.inventory || {};
    this.inventory.onHand = sumVariantStock(variants);
    this.batches = undefined;
  } else if (this.isBatchTracked) {
    // For batch-tracked items, calculate total from batches
    const batches = Array.isArray(this.batches) ? this.batches : [];
    const totalOnHand = sumBatchQty(batches);

    this.inventory = this.inventory || {};
    this.inventory.onHand = totalOnHand;
    // reserved stays as-is (future feature)
    this.variants = undefined;
  } else {
    // Not batch tracked or variant tracked -> clear any stale sub-docs
    this.batches = undefined;
    this.variants = undefined;
  }
});

export const Item = mongoose.model("Item", itemSchema);
