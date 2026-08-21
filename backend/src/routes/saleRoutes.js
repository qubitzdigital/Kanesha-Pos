import express from "express";
import { protect, requireFeature } from "../middleware/authMiddleware.js";
import mongoose from "mongoose";
import { Sale } from "../models/Sale.js";
import { Item } from "../models/Item.js";
import { Customer } from "../models/Customer.js";
import { Settings } from "../models/Settings.js";
import { deductStock } from "../services/stockService.js";

const router = express.Router();

const vatRateFromSettings = async (tenantId) => {
  const s = await Settings.findOne({ tenantId });
  if (s && typeof s.vatRate === "number") return s.vatRate;
  return Number(process.env.VAT_RATE || 0.15);
};

// Calculate VAT-aware totals on server-side to keep source of truth
const hydrateAndCalculateSale = async (payload, tenantId) => {
  const VAT_RATE = await vatRateFromSettings(tenantId);
  const itemIds = payload.items.map((l) => l.item);
  const items = await Item.find({
    _id: { $in: itemIds },
    tenantId,
  }).select("name taxApplicable costPrice hasVariants isBatchTracked variants");
  const itemMap = new Map(items.map((it) => [String(it._id), it]));

  let subTotal = 0;
  let taxTotal = 0;

  payload.items = payload.items.map((line, idx) => {
    const dbItem = itemMap.get(String(line.item));
    if (!dbItem) {
      throw new Error("One or more items not found");
    }

    // Size/variant items: size selection is mandatory so the correct
    // size's stock gets deducted — no ambiguity about which stock to reduce.
    let matchedVariant = null;
    if (dbItem.hasVariants) {
      const size = String(line.variantSize || "").trim();
      if (!size) {
        throw new Error(
          `Size is required for "${dbItem.name}" (line ${idx + 1})`,
        );
      }
      matchedVariant = (dbItem.variants || []).find(
        (v) =>
          String(v.size || "")
            .trim()
            .toLowerCase() === size.toLowerCase(),
      );
      if (!matchedVariant) {
        throw new Error(
          `"${size}" is not a valid size for "${dbItem.name}" (line ${idx + 1})`,
        );
      }
      line = { ...line, variantSize: matchedVariant.size };
    }

    const qty = Number(line.qty) || 0;
    const price = Number(line.unitPrice) || 0;
    const discountPercent = Number(line.discount) || 0;

    const baseBeforeDisc = qty * price;
    const discountAmount = (baseBeforeDisc * discountPercent) / 100;
    const lineBase = baseBeforeDisc - discountAmount;
    let tax = 0;

    if (payload.isTaxInvoice && dbItem?.taxApplicable) {
      tax = lineBase * VAT_RATE;
    }

    const lineTotal = lineBase + tax;

    subTotal += lineBase;
    taxTotal += tax;

    const costPrice = matchedVariant
      ? Number(matchedVariant.costPrice ?? dbItem.costPrice) || 0
      : Number(dbItem.costPrice) || 0;

    return {
      ...line,
      costPrice,
      discount: discountAmount,
      taxAmount: tax,
      lineTotal,
    };
  });

  const discountTotal = Number(payload.discountTotal || 0);
  const grandTotal = subTotal - discountTotal + taxTotal;

  const sumPayments = (payload.payments || []).reduce(
    (s, p) => s + (Number(p.amount) || 0),
    0,
  );
  const balanceDue = Math.max(0, grandTotal - sumPayments);

  return {
    ...payload,
    subTotal,
    taxTotal,
    discountTotal,
    grandTotal,
    balanceDue,
  };
};

// Helper to update stock + customer
const applySaleEffects = async (sale, tenantId, userId, session) => {
  for (const line of sale.items) {
    await deductStock(
      {
        itemId: line.item,
        tenantId,
        qty: line.qty,
        batchNumber: line.batchNumber,
        variantSize: line.variantSize,
        referenceId: sale._id,
        note: `Sale ${sale.billNumber}`,
        type: "sale",
        createdBy: userId,
      },
      session,
    );
  }

  if (sale.customer && sale.balanceDue > 0) {
    const customer = await Customer.findOne({
      _id: sale.customer,
      tenantId,
    }).session(session);
    if (customer) {
      customer.currentBalance =
        Number(customer.currentBalance || 0) + Number(sale.balanceDue);
      await customer.save({ session });
    }
  }
};

// Create sale - requires "pos" feature
router.post("/", protect, requireFeature("pos"), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const calculated = await hydrateAndCalculateSale(req.body, tenantId);

    // basic validation
    if (!Array.isArray(calculated.items) || !calculated.items.length) {
      throw new Error("At least one item is required");
    }

    for (let i = 0; i < calculated.items.length; i++) {
      const line = calculated.items[i];
      const qty = Number(line.qty);
      if (!qty || qty <= 0 || !Number.isFinite(qty)) {
        throw new Error(`Invalid qty (line ${i + 1})`);
      }
      if (!line.item) throw new Error(`Item id required (line ${i + 1})`);
    }
    if (calculated.customer) {
      const customer = await Customer.findOne({
        _id: calculated.customer,
        tenantId,
      }).session(session);
      if (!customer) {
        throw new Error("Customer not found");
      }
    }

    const saleDocs = await Sale.create(
      [
        {
          ...calculated,
          tenantId,
          createdBy: req.user?._id,
        },
      ],
      { session },
    );
    const sale = saleDocs[0];

    if (!sale.savedAsPending) {
      await applySaleEffects(sale, tenantId, req.user?._id, session);
    }

    await session.commitTransaction();
    session.endSession();
    res.status(201).json(sale);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message || "Failed to create sale" });
  }
});

// Update pending sale (convert to final)
router.put("/:id/finalize", protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const sale = await Sale.findOne({
      _id: req.params.id,
      tenantId,
    }).session(session);
    if (!sale) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Sale not found" });
    }
    if (!sale.savedAsPending) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Sale already finalized" });
    }
    const calculated = await hydrateAndCalculateSale(
      {
        ...sale.toObject(),
        ...req.body,
        savedAsPending: false,
      },
      tenantId,
    );
    sale.set(calculated);
    sale.updatedBy = req.user?._id;
    await sale.save({ session });
    await applySaleEffects(sale, tenantId, req.user?._id, session);
    await session.commitTransaction();
    session.endSession();
    res.json(sale);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message || "Failed to finalize sale" });
  }
});

// List sales (daily or range) - requires "pos" feature
router.get("/", protect, requireFeature("pos"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { date, startDate, endDate, limit } = req.query;
  const filter = { tenantId };

  if (startDate || endDate) {
    // Date range query
    filter.createdAt = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  } else if (date) {
    // Single date query
    const d = new Date(date);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    filter.createdAt = { $gte: start, $lte: end };
  }

  const queryLimit = limit ? parseInt(limit) : 500;
  const sales = await Sale.find(filter)
    .populate("customer", "name")
    .populate({
      path: "items.item",
      select: "name sku costPrice category",
    })
    .sort({ createdAt: -1 })
    .limit(queryLimit);

  // Format response for reports with item details
  const formattedSales = sales.map((sale) => ({
    invoiceNo: sale.invoiceNo,
    customerName: sale.customer?.name || "Walk-in Customer",
    finalAmount: sale.finalAmount,
    paymentMethod: sale.paymentMethod,
    saleDate: sale.createdAt,
    items: sale.items.map((item) => ({
      itemName: item.item?.sku || item.description || "Unknown",
      name: item.item?.sku || item.description || "Unknown",
      costPrice: item.item?.costPrice || 0,
      category: item.item?.category || "Uncategorized",
      unitPrice: item.unitPrice,
      qty: item.qty,
      discount: item.discount,
      lineTotal: item.lineTotal,
    })),
    isTaxInvoice: sale.isTaxInvoice,
    subTotal: sale.subTotal,
    taxTotal: sale.taxTotal,
  }));

  res.json({ sales: formattedSales });
});

// List invoices (finalized sales) for the Invoices table view.
// Supports date range, status, and bill-number search, plus pagination.
router.get(
  "/invoices",
  protect,
  requireFeature("invoices", "pos"),
  async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }

    const { startDate, endDate, search, status, page, limit } = req.query;
    const filter = { tenantId, savedAsPending: { $ne: true } };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (status) {
      filter.status = status;
    }

    if (search && search.trim()) {
      filter.billNumber = { $regex: search.trim(), $options: "i" };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageLimit = Math.min(200, Math.max(1, parseInt(limit) || 20));

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate("customer", "name phone")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageLimit)
        .limit(pageLimit),
      Sale.countDocuments(filter),
    ]);

    const invoices = sales.map((sale) => ({
      _id: sale._id,
      billNumber: sale.billNumber,
      customerName: sale.customer?.name || "Walk-in Customer",
      customerPhone: sale.customer?.phone || "",
      itemCount: sale.items?.length || 0,
      grandTotal: sale.grandTotal,
      balanceDue: sale.balanceDue,
      status: sale.status,
      paymentMethods: [...new Set((sale.payments || []).map((p) => p.method))],
      isTaxInvoice: sale.isTaxInvoice,
      createdAt: sale.createdAt,
    }));

    res.json({
      invoices,
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / pageLimit)),
    });
  },
);

// List pending sales
router.get("/pending", protect, requireFeature("pos"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId)
    return res.status(403).json({ message: "Tenant context missing" });
  const sales = await Sale.find({ tenantId, savedAsPending: true })
    .populate("customer", "name")
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(sales);
});

// Delete a pending sale
router.delete(
  "/pending/:id",
  protect,
  requireFeature("pos"),
  async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId)
      return res.status(403).json({ message: "Tenant context missing" });
    const sale = await Sale.findOne({
      _id: req.params.id,
      tenantId,
      savedAsPending: true,
    });
    if (!sale)
      return res.status(404).json({ message: "Pending sale not found" });
    await sale.deleteOne();
    res.json({ message: "Deleted" });
  },
);

// Get sale
router.get("/:id", protect, async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const sale = await Sale.findOne({
    _id: req.params.id,
    tenantId,
  }).populate("customer", "name phone address");
  if (!sale) {
    res.status(404);
    throw new Error("Sale not found");
  }
  res.json(sale);
});

export default router;
