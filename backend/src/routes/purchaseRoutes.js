import express from "express";
import { protect, requireFeature } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import { Purchase } from "../models/Purchase.js";
import { Supplier } from "../models/Supplier.js";
import { Item } from "../models/Item.js";
import { addStock } from "../services/stockService.js";

const router = express.Router();

router.post("/", protect, requireFeature("purchases"), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const {
      supplier,
      billNumber,
      billDate,
      items = [],
      amountPaid = 0,
    } = req.body;

    if (!supplier) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Supplier is required" });
    }
    if (!items.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "At least one item is required" });
    }

    const supplierDoc = await Supplier.findOne({
      _id: supplier,
      tenantId,
    }).session(session);
    if (!supplierDoc) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Validate items and ensure base units only
    const itemIds = items.map((l) => l.item);
    const itemDocs = await Item.find({
      _id: { $in: itemIds },
      tenantId,
    }).session(session);
    const itemMap = new Map(itemDocs.map((it) => [String(it._id), it]));

    for (let i = 0; i < items.length; i++) {
      const line = items[i];
      const doc = itemMap.get(String(line.item));
      if (!doc) {
        throw new Error(`Item not found in line ${i + 1}`);
      }
      const qty = Number(line.qty);
      if (!qty || qty <= 0 || !Number.isFinite(qty)) {
        throw new Error(`Invalid qty (line ${i + 1})`);
      }
      const cost = Number(line.costPrice);
      if (!Number.isFinite(cost) || cost < 0) {
        throw new Error(`Invalid costPrice (line ${i + 1})`);
      }
      if (doc.isBatchTracked && !String(line.batchNumber || "").trim()) {
        throw new Error(`Batch number required for "${doc.name}"`);
      }
      // force unit to base unit
      line.unit = doc.baseUnit;
    }

    const subTotal = items.reduce(
      (sum, l) => sum + Number(l.lineTotal || 0),
      0,
    );
    const grandTotal = subTotal; // extend with tax later
    const paid = Number(amountPaid) || 0;
    const balanceDue = grandTotal - paid;
    const status =
      paid >= grandTotal ? "paid" : paid > 0 ? "partial" : "unpaid";

    const purchase = await Purchase.create(
      [
        {
          ...req.body,
          tenantId,
          supplier,
          billNumber,
          billDate,
          subTotal,
          grandTotal,
          amountPaid: paid,
          balanceDue,
          status,
          items,
          createdBy: req.user?._id,
        },
      ],
      { session },
    );

    for (const line of items) {
      const itemDoc = itemMap.get(String(line.item));
      itemDoc.costPrice = Number(line.costPrice);
      itemDoc.lastPurchasePrice = Number(line.costPrice);
      await addStock(
        {
          itemId: itemDoc._id,
          tenantId,
          qty: line.qty,
          batchNumber: line.batchNumber,
          referenceId: purchase[0]._id,
          note: `Purchase ${billNumber}`,
          type: "purchase",
          createdBy: req.user?._id,
        },
        session,
      );
      await itemDoc.save({ session });
    }

    supplierDoc.currentBalance =
      Number(supplierDoc.currentBalance || 0) + balanceDue;
    await supplierDoc.save({ session });

    await session.commitTransaction();
    session.endSession();

    const created = await Purchase.findOne({
      _id: purchase[0]._id,
      tenantId,
    })
      .populate("supplier", "name")
      .session(null);
    res.status(201).json(created);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res
      .status(400)
      .json({ message: err.message || "Failed to create purchase" });
  }
});

router.get("/", protect, requireFeature("purchases"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { from, to } = req.query;
  const filter = { tenantId };
  if (from || to) {
    filter.billDate = {};
    if (from) filter.billDate.$gte = new Date(from);
    if (to) filter.billDate.$lte = new Date(to);
  }
  const purchases = await Purchase.find(filter)
    .populate("supplier", "name")
    .sort({ billDate: -1 })
    .limit(500);
  res.json(purchases);
});

export default router;
