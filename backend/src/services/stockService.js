import { StockMovement } from "../models/StockMovement.js";
import { Item } from "../models/Item.js";

const ensureNumber = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error("Quantity must be a valid number");
  return n;
};

const loadItemOrThrow = async (itemId, tenantId, session) => {
  const item = await Item.findOne({ _id: itemId, tenantId }).session(
    session || null,
  );
  if (!item) throw new Error("Item not found");
  if (item.isActive === false) throw new Error("Item is inactive");
  return item;
};

const findVariant = (item, variantSize) => {
  const size = String(variantSize || "").trim();
  if (!size) return { size, variant: null };
  const variants = Array.isArray(item.variants) ? item.variants : [];
  const variant = variants.find(
    (v) =>
      String(v.size || "")
        .trim()
        .toLowerCase() === size.toLowerCase(),
  );
  return { size, variant };
};

const findBatchSizeEntry = (batch, variantSize) => {
  const size = String(variantSize || "").trim();
  const sizes = Array.isArray(batch.sizes) ? batch.sizes : [];
  const entry = sizes.find(
    (s) =>
      String(s.size || "")
        .trim()
        .toLowerCase() === size.toLowerCase(),
  );
  return { size, entry };
};

export const addStock = async (
  {
    itemId,
    tenantId,
    qty,
    batchNumber,
    variantSize,
    note,
    referenceId,
    type = "adjustment",
    createdBy,
  },
  session,
) => {
  const item = await loadItemOrThrow(itemId, tenantId, session);
  const amount = ensureNumber(qty);
  if (amount <= 0) throw new Error("Quantity must be greater than zero");

  if (item.hasVariants && item.isBatchTracked) {
    // Combined mode: a batch/lot split across multiple sizes.
    const bn = String(batchNumber || "").trim();
    if (!bn) throw new Error(`Batch number required for "${item.name}"`);
    const { size, variant } = findVariant(item, variantSize);
    if (!size) throw new Error(`Size is required for "${item.name}"`);
    if (!variant)
      throw new Error(`"${size}" is not a known size for "${item.name}"`);

    if (!Array.isArray(item.batches)) item.batches = [];
    let batch = item.batches.find((b) => b.batchNumber === bn);
    if (!batch) {
      item.batches.push({
        batchNumber: bn,
        qtyOnHand: 0,
        reserved: 0,
        sizes: [],
      });
      batch = item.batches[item.batches.length - 1];
    }
    batch.sizes = Array.isArray(batch.sizes) ? batch.sizes : [];
    const { entry } = findBatchSizeEntry(batch, size);
    if (entry) {
      entry.qtyOnHand = Number(entry.qtyOnHand || 0) + amount;
    } else {
      batch.sizes.push({ size, qtyOnHand: amount });
    }
    // batch.qtyOnHand / item.inventory.onHand recalculated in pre-save hook
  } else if (item.hasVariants) {
    const { size, variant } = findVariant(item, variantSize);
    if (!size) throw new Error(`Size is required for "${item.name}"`);
    if (!variant)
      throw new Error(`"${size}" is not a known size for "${item.name}"`);
    variant.stock = Number(variant.stock || 0) + amount;
    // item.inventory.onHand recalculated in pre-save hook
  } else if (item.isBatchTracked) {
    const bn = String(batchNumber || "").trim();
    if (!bn) throw new Error(`Batch number required for "${item.name}"`);

    if (!Array.isArray(item.batches)) item.batches = [];
    const existingBatch = item.batches.find((b) => b.batchNumber === bn);
    if (existingBatch) {
      existingBatch.qtyOnHand = Number(existingBatch.qtyOnHand || 0) + amount;
    } else {
      item.batches.push({ batchNumber: bn, qtyOnHand: amount, reserved: 0 });
    }
  } else {
    item.inventory = item.inventory || {};
    item.inventory.onHand = Number(item.inventory.onHand || 0) + amount;
  }

  await item.save({ session });

  await StockMovement.create(
    [
      {
        tenantId,
        item: item._id,
        type,
        direction: "in",
        qty: amount,
        referenceId,
        batchNumber: batchNumber || undefined,
        variantSize: variantSize || undefined,
        note,
        createdBy,
      },
    ],
    { session },
  );

  return item;
};

/**
 * Set stock to an exact quantity (used by manual "Edit Stock" UI in Inventory).
 * Works out the current quantity for the given batch/size (or the item as a
 * whole), computes the difference, and records it as a normal "adjustment"
 * stock movement via addStock/deductStock — so history stays consistent
 * with every other stock-changing flow (GRN, sales, returns, etc).
 *
 * - batch-tracked + sized item -> batchId AND variantSize required
 * - batch-tracked item (no sizes) -> batchId required
 * - sized item (no batches) -> variantSize required
 * - plain item -> neither required
 */
export const setStock = async (
  { itemId, tenantId, newQty, batchId, variantSize, note, createdBy },
  session,
) => {
  const item = await loadItemOrThrow(itemId, tenantId, session);
  const target = ensureNumber(newQty);
  if (target < 0) throw new Error("Quantity cannot be negative");

  let currentQty = 0;
  let batchNumber;

  if (item.hasVariants && item.isBatchTracked) {
    const id = String(batchId || "").trim();
    if (!id) throw new Error(`Batch is required for "${item.name}"`);
    const batch = (item.batches || []).find((b) => String(b._id) === id);
    if (!batch) throw new Error(`Batch not found for "${item.name}"`);
    batchNumber = batch.batchNumber;

    const { size, entry } = findBatchSizeEntry(batch, variantSize);
    if (!size) throw new Error(`Size is required for "${item.name}"`);
    currentQty = entry ? Number(entry.qtyOnHand || 0) : 0;
  } else if (item.hasVariants) {
    const { size, variant } = findVariant(item, variantSize);
    if (!size) throw new Error(`Size is required for "${item.name}"`);
    if (!variant)
      throw new Error(`"${size}" is not a known size for "${item.name}"`);
    currentQty = Number(variant.stock || 0);
  } else if (item.isBatchTracked) {
    const id = String(batchId || "").trim();
    if (!id) throw new Error(`Batch is required for "${item.name}"`);
    const batch = (item.batches || []).find((b) => String(b._id) === id);
    if (!batch) throw new Error(`Batch not found for "${item.name}"`);
    batchNumber = batch.batchNumber;
    currentQty = Number(batch.qtyOnHand || 0);
  } else {
    currentQty = Number(item.inventory?.onHand || 0);
  }

  const delta = target - currentQty;
  if (delta === 0) return item;

  const opts = {
    itemId,
    tenantId,
    qty: Math.abs(delta),
    batchNumber,
    variantSize,
    note: note || "Manual stock edit",
    type: "adjustment",
    createdBy,
  };

  return delta > 0 ? addStock(opts, session) : deductStock(opts, session);
};

export const deductStock = async (
  {
    itemId,
    tenantId,
    qty,
    batchNumber,
    variantSize,
    note,
    referenceId,
    type = "adjustment",
    createdBy,
  },
  session,
) => {
  const item = await loadItemOrThrow(itemId, tenantId, session);
  const amount = ensureNumber(qty);
  if (amount <= 0) throw new Error("Quantity must be greater than zero");

  if (item.hasVariants && item.isBatchTracked) {
    // Combined mode: stock lives per-size inside the chosen batch.
    const bn = String(batchNumber || "").trim();
    if (!bn) throw new Error(`Batch number required for "${item.name}"`);

    const batch = (item.batches || []).find((b) => b.batchNumber === bn);
    if (!batch) throw new Error(`Batch "${bn}" not found for "${item.name}"`);

    const { size, entry } = findBatchSizeEntry(batch, variantSize);
    if (!size) throw new Error(`Size is required for "${item.name}"`);
    if (!entry)
      throw new Error(
        `Size "${size}" not found in batch "${bn}" for "${item.name}"`,
      );

    const onHand = Number(entry.qtyOnHand || 0);
    if (onHand < amount)
      throw new Error(
        `Insufficient stock for "${item.name}" (batch ${bn}, size ${size})`,
      );
    entry.qtyOnHand = onHand - amount;
    // batch.qtyOnHand / item.inventory.onHand recalculated in pre-save hook
  } else if (item.hasVariants) {
    const { size, variant } = findVariant(item, variantSize);
    if (!size) throw new Error(`Size is required for "${item.name}"`);
    if (!variant)
      throw new Error(`Size "${size}" not found for "${item.name}"`);

    const onHand = Number(variant.stock || 0);
    if (onHand < amount)
      throw new Error(`Insufficient stock for "${item.name}" (size ${size})`);
    variant.stock = onHand - amount;
    // item.inventory.onHand recalculated in pre-save hook
  } else if (item.isBatchTracked) {
    const bn = String(batchNumber || "").trim();
    if (!bn) throw new Error(`Batch number required for "${item.name}"`);

    const batch = (item.batches || []).find((b) => b.batchNumber === bn);
    if (!batch) throw new Error(`Batch "${bn}" not found for "${item.name}"`);

    const onHand = Number(batch.qtyOnHand || 0);
    if (onHand < amount)
      throw new Error(`Insufficient batch stock for "${item.name}" (${bn})`);

    batch.qtyOnHand = onHand - amount;
    // optional cleanup
    if (batch.qtyOnHand === 0 && (batch.reserved || 0) === 0) {
      item.batches = item.batches.filter(
        (b) => String(b._id) !== String(batch._id),
      );
    }
  } else {
    const onHand = Number(item.inventory?.onHand || 0);
    if (onHand < amount)
      throw new Error(`Insufficient stock for "${item.name}"`);
    item.inventory.onHand = onHand - amount;
  }

  await item.save({ session });

  await StockMovement.create(
    [
      {
        tenantId,
        item: item._id,
        type,
        direction: "out",
        qty: amount,
        referenceId,
        batchNumber: batchNumber || undefined,
        variantSize: variantSize || undefined,
        note,
        createdBy,
      },
    ],
    { session },
  );

  return item;
};
