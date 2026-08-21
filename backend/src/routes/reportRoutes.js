import express from "express";
import { protect, requireFeature } from "../middleware/authMiddleware.js";
import { Sale } from "../models/Sale.js";
import { Purchase } from "../models/Purchase.js";
import { Item } from "../models/Item.js";
import { Expense } from "../models/Expense.js";
import { Customer } from "../models/Customer.js";
import { Supplier } from "../models/Supplier.js";

const router = express.Router();

// Daily sales report
router.get(
  "/sales-daily",
  protect,
  requireFeature("reports"),
  async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const { date } = req.query;
    const d = date ? new Date(date) : new Date();
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));

    const sales = await Sale.find({
      tenantId,
      createdAt: { $gte: start, $lte: end },
    });

    const total = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    res.json({ date: start, total, count: sales.length, sales });
  },
);

// Inventory value report (simple average)
router.get(
  "/inventory-value",
  protect,
  requireFeature("reports"),
  async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const items = await Item.find({ tenantId, isActive: true });
    const rows = items.map((i) => ({
      itemId: i._id,
      name: i.name,
      qty: i.currentStock,
      costPrice: i.costPrice,
      value: (i.currentStock || 0) * (i.costPrice || 0),
    }));
    const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
    res.json({ totalValue, rows });
  },
);

// Fast-moving / slow-moving items (by sales count)
router.get(
  "/item-movement",
  protect,
  requireFeature("reports"),
  async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const { from, to } = req.query;
    const dateFilter = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(to);
    }

    const pipeline = [
      { $match: { tenantId, ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.item",
          totalQty: { $sum: "$items.qty" },
          totalSales: { $sum: "$items.lineTotal" },
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },
      { $project: { name: "$item.name", totalQty: 1, totalSales: 1 } },
      { $sort: { totalQty: -1 } },
      { $limit: 100 },
    ];

    const result = await Sale.aggregate(pipeline);
    res.json(result);
  },
);

// Profit report (very simplified: sales - purchases - expenses)
router.get("/profit", protect, requireFeature("reports"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { from, to } = req.query;
  const dateFilter = {};
  if (from || to) {
    dateFilter.createdAt = {};
    if (from) dateFilter.createdAt.$gte = new Date(from);
    if (to) dateFilter.createdAt.$lte = new Date(to);
  }

  const sales = await Sale.find({ tenantId, ...dateFilter });
  const purchases = await Purchase.find({ tenantId, ...dateFilter });
  const expenseFilter = {};
  if (from || to) {
    expenseFilter.date = {};
    if (from) expenseFilter.date.$gte = new Date(from);
    if (to) expenseFilter.date.$lte = new Date(to);
  }
  const expenses = await Expense.find({ tenantId, ...expenseFilter });

  const salesTotal = sales.reduce((s, x) => s + x.grandTotal, 0);
  const purchaseTotal = purchases.reduce((s, x) => s + x.grandTotal, 0);
  const expenseTotal = expenses.reduce((s, x) => s + x.amount, 0);

  const profit = salesTotal - purchaseTotal - expenseTotal;

  res.json({
    salesTotal,
    purchaseTotal,
    expenseTotal,
    profit,
  });
});

// Customer credit report
router.get(
  "/customer-credit",
  protect,
  requireFeature("reports"),
  async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const customers = await Customer.find({
      tenantId,
      currentBalance: { $ne: 0 },
    }).sort({ currentBalance: -1 });
    res.json(customers);
  },
);

// Supplier credit report
router.get(
  "/supplier-credit",
  protect,
  requireFeature("reports"),
  async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const suppliers = await Supplier.find({
      tenantId,
      currentBalance: { $ne: 0 },
    }).sort({ currentBalance: -1 });
    res.json(suppliers);
  },
);

export default router;
