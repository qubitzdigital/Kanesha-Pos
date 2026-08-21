import mongoose from "mongoose";
import { GRN } from "../models/GRN.js";
import { Supplier } from "../models/Supplier.js";
import { Item } from "../models/Item.js";
import { StockMovement } from "../models/StockMovement.js";

const asNumber = (v) =>
  v === null || v === undefined || v === "" ? NaN : Number(v);

const validateGrnLines = async (lines, tenantId) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("GRN must have at least one item line");
  }

  const itemIds = lines.map((l) => l.item);
  const items = await Item.find({ _id: { $in: itemIds }, tenantId });
  const itemMap = new Map(items.map((it) => [String(it._id), it]));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const it = itemMap.get(String(line.item));

    if (!it) {
      throw new Error(`Item not found in line ${i + 1}`);
    }

    if (!it.isActive) {
      throw new Error(`Item "${it.name}" is inactive (line ${i + 1})`);
    }

    const qty = asNumber(line.qty);
    const unitCost = asNumber(line.unitCost);

    if (!qty || qty <= 0 || !Number.isFinite(qty)) {
      throw new Error(`Qty must be > 0 (line ${i + 1})`);
    }

    if (Number.isNaN(unitCost) || unitCost < 0 || !Number.isFinite(unitCost)) {
      throw new Error(`Unit cost must be >= 0 (line ${i + 1})`);
    }

    if (it.isBatchTracked) {
      const bn = String(line.batchNumber || "").trim();
      if (!bn) {
        throw new Error(
          `Batch number required for "${it.name}" (line ${i + 1})`,
        );
      }
    }

    if (it.hasVariants) {
      const sizeInput = String(line.variantSize || "").trim();
      if (!sizeInput) {
        throw new Error(`Size is required for "${it.name}" (line ${i + 1})`);
      }
      const match = (it.variants || []).find(
        (v) => (v.size || "").trim().toLowerCase() === sizeInput.toLowerCase(),
      );
      if (!match) {
        throw new Error(
          `"${sizeInput}" is not a known size for "${it.name}" (line ${i + 1}). Add it via Edit Item first.`,
        );
      }
    }
  }

  return itemMap;
};

/**
 * Generate GRN number for a supplier: SUPPLIERCODE-GRN####
 */
const generateGRNNumber = async (supplierId, tenantId) => {
  const supplier = await Supplier.findOne({ _id: supplierId, tenantId });
  if (!supplier) throw new Error("Supplier not found");

  const supplierCode =
    supplier.supplierCode || `SUP${String(supplier._id).slice(-6)}`;

  // Find the last GRN for this supplier to get the next sequence number
  const lastGRN = await GRN.findOne({
    tenantId,
    supplier: supplierId,
    grnNo: new RegExp(`^${supplierCode}-GRN\\d+$`),
  })
    .sort({ grnNo: -1 })
    .limit(1);

  let nextNum = 1;
  if (lastGRN) {
    const match = lastGRN.grnNo.match(/GRN(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `${supplierCode}-GRN${String(nextNum).padStart(4, "0")}`;
};

/**
 * CREATE GRN (DRAFT only) - no stock changes here
 */
export const createGRN = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const { supplier, lines } = req.body;
    let { grnNo } = req.body;

    // Validate supplier and lines
    if (!supplier) {
      return res.status(400).json({ message: "Supplier is required" });
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }

    const supplierExists = await Supplier.findOne({
      _id: supplier,
      tenantId,
    });
    if (!supplierExists) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Auto-generate GRN number if not provided
    if (!grnNo || !grnNo.trim()) {
      grnNo = await generateGRNNumber(supplier, tenantId);
    } else {
      grnNo = String(grnNo).trim();
      const exists = await GRN.findOne({ tenantId, grnNo });
      if (exists)
        return res.status(400).json({ message: "GRN No already exists" });
    }

    // Validate items exist + batch requirements (but do not change stock)
    try {
      await validateGrnLines(lines, tenantId);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const grn = await GRN.create({
      ...req.body,
      tenantId,
      grnNo,
      status: "draft",
      createdBy: req.user?._id,
    });

    const populated = await GRN.findOne({ _id: grn._id, tenantId })
      .populate("supplier")
      .populate("lines.item");
    res.status(201).json(populated);
  } catch (err) {
    if (err?.code === 11000)
      return res.status(400).json({ message: "GRN No already exists" });
    console.error("Error in createGRN:", err);
    res.status(500).json({ message: err.message || "Failed to create GRN" });
  }
};

/**
 * POST GRN - applies stock + stock movements, locks GRN
 */
export const postGRN = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const grn = await GRN.findOne({
      _id: req.params.id,
      tenantId,
    }).session(session);
    if (!grn) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "GRN not found" });
    }

    if (grn.status !== "draft") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Only DRAFT GRNs can be posted" });
    }

    if (!Array.isArray(grn.lines) || grn.lines.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "GRN must have at least one line" });
    }

    // Fetch all items involved in the GRN
    const itemIds = grn.lines.map((l) => l.item);
    const items = await Item.find({
      _id: { $in: itemIds },
      tenantId,
    }).session(session);
    const itemMap = new Map(items.map((it) => [String(it._id), it]));

    // Process each line
    for (let i = 0; i < grn.lines.length; i++) {
      const line = grn.lines[i];
      const item = itemMap.get(String(line.item));

      if (!item) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          message: `Item not found in line ${i + 1}`,
        });
      }

      if (!item.isActive) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Item "${item.name}" is inactive (line ${i + 1})`,
        });
      }

      const qty = Number(line.qty);
      const unitCost = line.unitCost ? Number(line.unitCost.toString()) : 0;

      // Validate quantities
      if (!qty || qty <= 0 || !Number.isFinite(qty)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Invalid qty (line ${i + 1})`,
        });
      }

      if (
        Number.isNaN(unitCost) ||
        unitCost < 0 ||
        !Number.isFinite(unitCost)
      ) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Invalid unitCost (line ${i + 1})`,
        });
      }

      // Update last purchase price
      item.lastPurchasePrice = unitCost;

      // Handle batch-tracked items — check the combined "batch + sizes"
      // case FIRST. An item can be isBatchTracked AND hasVariants at the
      // same time (a batch/lot split across multiple sizes, e.g. one
      // shipment with S/M/L). If this check is skipped, quantity gets
      // added to the batch's flat qtyOnHand only, and the per-size
      // breakdown (batch.sizes[]) never gets updated — which is exactly
      // why "size-wise stock" can stay at 0 even though total stock rises.
      if (item.isBatchTracked && item.hasVariants) {
        const batchNumber = String(line.batchNumber || "").trim();
        if (!batchNumber) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `Batch number required for "${item.name}" (line ${i + 1})`,
          });
        }

        const sizeInput = String(line.variantSize || "").trim();
        if (!sizeInput) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `Size is required for "${item.name}" (line ${i + 1})`,
          });
        }

        const knownSize = (item.variants || []).find(
          (v) =>
            (v.size || "").trim().toLowerCase() === sizeInput.toLowerCase(),
        );
        if (!knownSize) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `"${sizeInput}" is not a known size for "${item.name}" (line ${i + 1})`,
          });
        }

        if (!Array.isArray(item.batches)) item.batches = [];
        let batch = item.batches.find((b) => b.batchNumber === batchNumber);
        if (!batch) {
          item.batches.push({
            batchNumber,
            qtyOnHand: 0,
            reserved: 0,
            sizes: [],
          });
          batch = item.batches[item.batches.length - 1];
        }

        batch.sizes = Array.isArray(batch.sizes) ? batch.sizes : [];
        const sizeEntry = batch.sizes.find(
          (s) =>
            (s.size || "").trim().toLowerCase() === sizeInput.toLowerCase(),
        );
        if (sizeEntry) {
          sizeEntry.qtyOnHand = Number(sizeEntry.qtyOnHand || 0) + qty;
          if (unitCost > 0) sizeEntry.costPrice = unitCost;
        } else {
          batch.sizes.push({
            size: sizeInput,
            qtyOnHand: qty,
            costPrice: unitCost > 0 ? unitCost : undefined,
          });
        }
        // Batch-level sellingPrice keeps a display fallback; the real
        // per-size cost lives on batch.sizes[].costPrice above.
        if (unitCost > 0) batch.sellingPrice = unitCost;
        // batch.qtyOnHand and item.inventory.onHand are re-derived from
        // batches[].sizes[] in the Item pre("save") hook.
      } else if (item.isBatchTracked) {
        const batchNumber = String(line.batchNumber || "").trim();

        if (!batchNumber) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `Batch number required for "${item.name}" (line ${i + 1})`,
          });
        }

        // Ensure batches array is initialized
        if (!Array.isArray(item.batches)) {
          item.batches = [];
        }

        // Find existing batch or create new one
        const existingBatch = item.batches.find(
          (b) => b.batchNumber === batchNumber,
        );

        if (existingBatch) {
          // Update existing batch quantity and selling price
          existingBatch.qtyOnHand = Number(existingBatch.qtyOnHand || 0) + qty;
          if (unitCost > 0) existingBatch.sellingPrice = unitCost;
        } else {
          // Create new batch
          item.batches.push({
            batchNumber: batchNumber,
            qtyOnHand: qty,
            reserved: 0,
            sellingPrice: unitCost > 0 ? unitCost : undefined,
          });
        }

        // Note: inventory.onHand will be calculated by pre-save hook
      } else if (item.hasVariants) {
        // Handle size/variant-tracked items
        const sizeInput = String(line.variantSize || "").trim();

        if (!sizeInput) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `Size required for "${item.name}" (line ${i + 1})`,
          });
        }

        const variant = (item.variants || []).find(
          (v) =>
            (v.size || "").trim().toLowerCase() === sizeInput.toLowerCase(),
        );

        if (!variant) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `"${sizeInput}" is not a known size for "${item.name}" (line ${i + 1})`,
          });
        }

        variant.stock = Number(variant.stock || 0) + qty;
        if (unitCost > 0) variant.costPrice = unitCost;

        // Note: inventory.onHand will be recalculated by pre-save hook
      } else {
        // Handle non-batch-tracked items
        item.inventory = item.inventory || {};
        item.inventory.onHand = Number(item.inventory.onHand || 0) + qty;
      }

      // Save the item
      await item.save({ session });

      // Create stock movement record
      await StockMovement.create(
        [
          {
            tenantId,
            item: item._id,
            type: "grn",
            direction: "in",
            qty,
            referenceId: grn._id,
            note: `GRN Posted: ${grn.grnNo}`,
            createdBy: req.user?._id,
          },
        ],
        { session },
      );
    }

    // Mark GRN as posted
    grn.status = "posted";
    grn.postedAt = new Date();
    grn.updatedBy = req.user?._id;
    await grn.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await GRN.findOne({ _id: grn._id, tenantId })
      .populate("supplier")
      .populate("lines.item");
    res.json(populated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in postGRN:", err);
    res.status(500).json({ message: err.message || "Failed to post GRN" });
  }
};

/**
 * CANCEL GRN - reverses stock, locks cancelled
 */
export const cancelGRN = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const grn = await GRN.findOne({
      _id: req.params.id,
      tenantId,
    }).session(session);
    if (!grn) return res.status(404).json({ message: "GRN not found" });

    if (grn.status !== "posted") {
      return res
        .status(400)
        .json({ message: "Only POSTED GRNs can be cancelled" });
    }

    const itemIds = grn.lines.map((l) => l.item);
    const items = await Item.find({
      _id: { $in: itemIds },
      tenantId,
    }).session(session);
    const itemMap = new Map(items.map((it) => [String(it._id), it]));

    for (let i = 0; i < grn.lines.length; i++) {
      const line = grn.lines[i];
      const it = itemMap.get(String(line.item));
      if (!it)
        return res
          .status(404)
          .json({ message: `Item not found in line ${i + 1}` });

      const qty = Number(line.qty);

      // Combined "batch + sizes" case must be checked first — same reason
      // as in postGRN: an item can be isBatchTracked AND hasVariants, with
      // real per-size stock living in batch.sizes[] rather than the flat
      // batch.qtyOnHand.
      if (it.isBatchTracked && it.hasVariants) {
        const bn = String(line.batchNumber || "").trim();
        if (!bn) {
          return res.status(400).json({
            message: `Batch number missing for "${it.name}" (line ${i + 1})`,
          });
        }

        const sizeInput = String(line.variantSize || "").trim();
        if (!sizeInput) {
          return res.status(400).json({
            message: `Size missing for "${it.name}" (line ${i + 1})`,
          });
        }

        const batch = (it.batches || []).find((b) => b.batchNumber === bn);
        if (!batch) {
          return res.status(400).json({
            message: `Batch "${bn}" not found for "${it.name}" (line ${i + 1})`,
          });
        }

        const sizeEntry = (batch.sizes || []).find(
          (s) =>
            (s.size || "").trim().toLowerCase() === sizeInput.toLowerCase(),
        );
        if (!sizeEntry) {
          return res.status(400).json({
            message: `Size "${sizeInput}" not found in batch "${bn}" for "${it.name}" (line ${i + 1})`,
          });
        }

        if (Number(sizeEntry.qtyOnHand || 0) < qty) {
          return res.status(400).json({
            message: `Cannot cancel: insufficient stock for "${
              it.name
            }" batch "${bn}" size "${sizeInput}" (line ${i + 1})`,
          });
        }

        sizeEntry.qtyOnHand = Number(sizeEntry.qtyOnHand) - qty;

        // Drop the size row once it's back to zero, then drop the batch
        // itself if it has no sizes (and no reserved stock) left.
        batch.sizes = (batch.sizes || []).filter((s) => s.qtyOnHand > 0);
        if (batch.sizes.length === 0 && (batch.reserved || 0) === 0) {
          it.batches = (it.batches || []).filter(
            (b) => String(b._id) !== String(batch._id),
          );
        }
        // batch.qtyOnHand / item.inventory.onHand re-derived in pre("save")
      } else if (it.isBatchTracked) {
        const bn = String(line.batchNumber || "").trim();
        if (!bn) {
          return res.status(400).json({
            message: `Batch number missing for "${it.name}" (line ${i + 1})`,
          });
        }

        const batch = (it.batches || []).find((b) => b.batchNumber === bn);

        if (!batch) {
          return res.status(400).json({
            message: `Batch "${bn}" not found for "${it.name}" (line ${i + 1})`,
          });
        }

        if (Number(batch.qtyOnHand || 0) < qty) {
          return res.status(400).json({
            message: `Cannot cancel: insufficient batch stock for "${
              it.name
            }" batch "${bn}" (line ${i + 1})`,
          });
        }

        batch.qtyOnHand = Number(batch.qtyOnHand) - qty;

        // optional: remove empty batches
        if (batch.qtyOnHand === 0 && (batch.reserved || 0) === 0) {
          it.batches = it.batches.filter(
            (b) => String(b._id) !== String(batch._id),
          );
        }
      } else if (it.hasVariants) {
        const sizeInput = String(line.variantSize || "").trim();
        if (!sizeInput) {
          return res.status(400).json({
            message: `Size missing for "${it.name}" (line ${i + 1})`,
          });
        }

        const variant = (it.variants || []).find(
          (v) =>
            (v.size || "").trim().toLowerCase() === sizeInput.toLowerCase(),
        );

        if (!variant) {
          return res.status(400).json({
            message: `Size "${sizeInput}" not found for "${it.name}" (line ${i + 1})`,
          });
        }

        if (Number(variant.stock || 0) < qty) {
          return res.status(400).json({
            message: `Cannot cancel: insufficient stock for "${
              it.name
            }" size "${sizeInput}" (line ${i + 1})`,
          });
        }

        variant.stock = Number(variant.stock) - qty;
      } else {
        const onHand = Number(it.inventory?.onHand || 0);
        if (onHand < qty) {
          return res.status(400).json({
            message: `Cannot cancel: insufficient stock for "${
              it.name
            }" (line ${i + 1})`,
          });
        }
        it.inventory.onHand = onHand - qty;
      }

      await it.save({ session });

      await StockMovement.create(
        [
          {
            tenantId,
            item: it._id,
            type: "grn_cancel",
            direction: "out",
            qty,
            referenceId: grn._id,
            note: `GRN Cancelled: ${grn.grnNo}`,
            createdBy: req.user?._id,
          },
        ],
        { session },
      );
    }

    grn.status = "cancelled";
    grn.cancelledAt = new Date();
    grn.updatedBy = req.user?._id;
    await grn.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await GRN.findOne({ _id: grn._id, tenantId })
      .populate("supplier")
      .populate("lines.item");
    res.json(populated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in cancelGRN:", err);
    res.status(500).json({ message: err.message || "Failed to cancel GRN" });
  }
};

/**
 * Get all GRNs
 */
export const getAllGRNs = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const grns = await GRN.find({ tenantId })
      .populate("supplier")
      .populate("lines.item")
      .sort({ grnDate: -1 });
    res.json(grns);
  } catch (err) {
    console.error("Error in getAllGRNs:", err);
    res.status(500).json({ message: err.message || "Failed to fetch GRNs" });
  }
};

/**
 * Get single GRN
 */
export const getGRN = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const grn = await GRN.findOne({
      _id: req.params.id,
      tenantId,
    })
      .populate("supplier")
      .populate("lines.item");
    if (!grn) return res.status(404).json({ message: "GRN not found" });
    res.json(grn);
  } catch (err) {
    console.error("Error in getGRN:", err);
    res.status(500).json({ message: err.message || "Failed to fetch GRN" });
  }
};

/**
 * Get supplier GRNs
 */
export const getSupplierGRNs = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const { supplierId } = req.params;

    const supplier = await Supplier.findOne({
      _id: supplierId,
      tenantId,
    });
    if (!supplier)
      return res.status(404).json({ message: "Supplier not found" });

    const grns = await GRN.find({ tenantId, supplier: supplierId })
      .populate("supplier")
      .populate("lines.item")
      .sort({ grnDate: -1 });

    res.json(grns);
  } catch (err) {
    console.error("Error in getSupplierGRNs:", err);
    res.status(500).json({ message: err.message || "Failed to fetch GRNs" });
  }
};

/**
 * Update GRN - DRAFT only
 */
export const updateGRN = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const grn = await GRN.findOne({
      _id: req.params.id,
      tenantId,
    });
    if (!grn) return res.status(404).json({ message: "GRN not found" });

    if (grn.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Only DRAFT GRNs can be updated" });
    }

    // Prevent changing status via update
    const {
      status,
      postedAt,
      cancelledAt,
      tenantId: ignoredTenant,
      createdBy,
      updatedBy,
      ...safe
    } = req.body;

    if (safe.supplier) {
      const supplierExists = await Supplier.findOne({
        _id: safe.supplier,
        tenantId,
      });
      if (!supplierExists) {
        return res.status(400).json({ message: "Supplier not found" });
      }
    }

    try {
      await validateGrnLines(safe.lines || grn.lines || [], tenantId);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    Object.assign(grn, safe);
    grn.status = "draft";
    grn.updatedBy = req.user?._id;

    await grn.save();

    const populated = await GRN.findOne({ _id: grn._id, tenantId })
      .populate("supplier")
      .populate("lines.item");
    res.json(populated);
  } catch (err) {
    console.error("Error in updateGRN:", err);
    res.status(500).json({ message: err.message || "Failed to update GRN" });
  }
};

/**
 * Delete GRN - DRAFT only
 */
export const deleteGRN = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const grn = await GRN.findOne({
      _id: req.params.id,
      tenantId,
    });
    if (!grn) return res.status(404).json({ message: "GRN not found" });

    if (grn.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Only DRAFT GRNs can be deleted" });
    }

    await GRN.findOneAndDelete({ _id: req.params.id, tenantId });
    res.json({ message: "Draft GRN deleted successfully" });
  } catch (err) {
    console.error("Error in deleteGRN:", err);
    res.status(500).json({ message: err.message || "Failed to delete GRN" });
  }
};
