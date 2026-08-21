// services/grnPost.service.js
import mongoose from "mongoose";
import { GRN } from "../models/GRN.js";
import { Item } from "../models/Item.js";

/**
 * Post a GRN (v1)
 * - Only allows draft -> posted
 * - Increments stock:
 *   - batch-tracked items: upsert batch by batchNumber, increment qtyOnHand
 *   - non-batch items: increment inventory.onHand
 * - Uses a MongoDB transaction for safety
 *
 * NOTE:
 * - Enforces: if item.isBatchTracked => line.batchNumber is required
 * - Also prevents negative qty and handles empty lines via GRN schema validator
 */
export async function postGRN({ grnId, postedBy, tenantId }) {
  if (!mongoose.isValidObjectId(grnId)) {
    throw new Error("Invalid grnId");
  }

  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      // 1) Load GRN (lock it by using the session)
      const grn = await GRN.findOne({ _id: grnId, tenantId }).session(session);
      if (!grn) throw new Error("GRN not found");

      if (grn.status !== "draft") {
        throw new Error(`GRN cannot be posted (current status: ${grn.status})`);
      }

      if (!Array.isArray(grn.lines) || grn.lines.length === 0) {
        throw new Error("GRN must have at least one line");
      }

      // 2) Gather item IDs and load items in one query
      const itemIds = [...new Set(grn.lines.map((l) => String(l.item)))];

      const items = await Item.find({
        _id: { $in: itemIds },
        tenantId,
        isActive: true,
      })
        .session(session)
        .select("_id isBatchTracked hasVariants inventory batches variants");

      const itemMap = new Map(items.map((it) => [String(it._id), it]));

      // 3) Validate all lines with item rules + prepare updates
      for (const [idx, line] of grn.lines.entries()) {
        const itemId = String(line.item);
        const item = itemMap.get(itemId);

        if (!item) {
          throw new Error(`Line ${idx + 1}: Item not found or inactive`);
        }

        const qty = Number(line.qty);
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error(`Line ${idx + 1}: qty must be > 0`);
        }

        if (item.isBatchTracked && item.hasVariants) {
          // Combined mode: this batch/lot can contain multiple sizes
          // (e.g. one shipment of S/M/L in the same batch number).
          const batchNo = (line.batchNumber || "").trim();
          if (!batchNo) {
            throw new Error(
              `Line ${idx + 1}: batchNumber is required for batch-tracked items`
            );
          }

          const sizeInput = (line.variantSize || "").trim();
          if (!sizeInput) {
            throw new Error(
              `Line ${idx + 1}: size is required for items with sizes`
            );
          }

          const knownSize = (item.variants || []).find(
            (v) => (v.size || "").trim().toLowerCase() === sizeInput.toLowerCase()
          );
          if (!knownSize) {
            throw new Error(
              `Line ${idx + 1}: "${sizeInput}" is not a known size for this item`
            );
          }

          const unitCostNum = line.unitCost
            ? Number(line.unitCost.toString())
            : 0;

          item.batches = Array.isArray(item.batches) ? item.batches : [];
          let batch = item.batches.find(
            (b) => (b.batchNumber || "").trim() === batchNo
          );
          if (!batch) {
            batch = { batchNumber: batchNo, qtyOnHand: 0, sizes: [] };
            item.batches.push(batch);
          }

          batch.sizes = Array.isArray(batch.sizes) ? batch.sizes : [];
          const sizeEntry = batch.sizes.find(
            (s) => (s.size || "").trim().toLowerCase() === sizeInput.toLowerCase()
          );
          if (sizeEntry) {
            sizeEntry.qtyOnHand = Number(sizeEntry.qtyOnHand || 0) + qty;
            if (unitCostNum > 0) sizeEntry.costPrice = unitCostNum;
          } else {
            batch.sizes.push({
              size: sizeInput,
              qtyOnHand: qty,
              costPrice: unitCostNum > 0 ? unitCostNum : undefined,
            });
          }

          // Batch-level costPrice keeps the most recent size's cost as a
          // fallback/display value; the real per-size cost lives on
          // batch.sizes[].costPrice above.
          if (unitCostNum > 0) batch.costPrice = unitCostNum;
          // batch.qtyOnHand and item.inventory.onHand are re-derived
          // from batches[].sizes[] in Item pre("save")
        } else if (item.isBatchTracked) {
          const batchNo = (line.batchNumber || "").trim();
          if (!batchNo) {
            throw new Error(
              `Line ${idx + 1}: batchNumber is required for batch-tracked items`
            );
          }

          // Upsert/increment the batch inside the loaded item doc
          item.batches = Array.isArray(item.batches) ? item.batches : [];
          const existing = item.batches.find(
            (b) => (b.batchNumber || "").trim() === batchNo
          );

          const unitCostNum = line.unitCost
            ? Number(line.unitCost.toString())
            : 0;

          if (existing) {
            existing.qtyOnHand = Number(existing.qtyOnHand || 0) + qty;
            // Update batch cost price if provided (weighted average could be added later)
            if (unitCostNum > 0) {
              existing.costPrice = unitCostNum;
            }
          } else {
            item.batches.push({
              batchNumber: batchNo,
              qtyOnHand: qty,
              costPrice: unitCostNum > 0 ? unitCostNum : undefined,
            });
          }
          // inventory.onHand will be re-derived in Item pre("save")
        } else if (item.hasVariants) {
          const sizeInput = (line.variantSize || "").trim();
          if (!sizeInput) {
            throw new Error(
              `Line ${idx + 1}: size is required for items with sizes`
            );
          }

          item.variants = Array.isArray(item.variants) ? item.variants : [];
          const variant = item.variants.find(
            (v) => (v.size || "").trim().toLowerCase() === sizeInput.toLowerCase()
          );

          if (!variant) {
            throw new Error(
              `Line ${idx + 1}: "${sizeInput}" is not a known size for this item`
            );
          }

          const unitCostNum = line.unitCost
            ? Number(line.unitCost.toString())
            : 0;

          variant.stock = Number(variant.stock || 0) + qty;
          if (unitCostNum > 0) variant.costPrice = unitCostNum;
          // inventory.onHand will be re-derived in Item pre("save")
        } else {
          // Non-batch tracked: increment inventory.onHand directly
          item.inventory = item.inventory || {};
          item.inventory.onHand = Number(item.inventory.onHand || 0) + qty;
        }
      }

      // 4) Save all modified items
      // (Saving item docs triggers Item pre("save") derivation for batch totals)
      for (const it of itemMap.values()) {
        // Only save if touched; simplest v1: always save loaded ones
        await it.save({ session });
      }

      // 5) Mark GRN as posted
      grn.status = "posted";
      grn.postedAt = new Date();
      if (postedBy) grn.createdBy = postedBy; // optional: you can use postedBy field instead

      await grn.save({ session });

      return grn;
    });

    return result;
  } finally {
    session.endSession();
  }
}
