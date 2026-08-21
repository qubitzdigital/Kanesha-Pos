import express from "express";
import { protect, requireFeature } from "../middleware/authMiddleware.js";
import { Expense } from "../models/Expense.js";

const router = express.Router();

// Create expense
router.post("/", protect, requireFeature("expenses"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { createdBy, updatedBy, tenantId: ignoredTenant, ...safe } = req.body;
  const expense = await Expense.create({
    ...safe,
    tenantId,
    createdBy: req.user?._id,
  });
  res.status(201).json(expense);
});

// List expenses with optional date range
router.get("/", protect, requireFeature("expenses"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { from, to, startDate, endDate } = req.query;
  const filter = { tenantId };

  // Support both 'from/to' and 'startDate/endDate' params
  const start = startDate || from;
  const end = endDate || to;

  if (start || end) {
    filter.date = {};
    if (start) {
      const startDateObj = new Date(start);
      startDateObj.setHours(0, 0, 0, 0);
      filter.date.$gte = startDateObj;
    }
    if (end) {
      const endDateObj = new Date(end);
      endDateObj.setHours(23, 59, 59, 999);
      filter.date.$lte = endDateObj;
    }
  }

  const expenses = await Expense.find(filter)
    .populate("createdBy", "username")
    .sort({ date: -1, createdAt: -1 });

  // Format response for reports
  const formattedExpenses = expenses.map((exp) => ({
    expenseId: exp._id,
    category: exp.category,
    description: exp.description,
    amount: exp.amount,
    expenseDate: exp.date,
    addedBy: exp.createdBy?.username || "Unknown",
  }));

  res.json({ expenses: formattedExpenses });
});

// Update expense
router.put("/:id", protect, requireFeature("expenses"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { createdBy, updatedBy, tenantId: ignoredTenant, ...safe } = req.body;
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    { ...safe, updatedBy: req.user?._id },
    { new: true },
  );
  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }
  res.json(expense);
});

// Delete expense
router.delete("/:id", protect, requireFeature("expenses"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const expense = await Expense.findOne({ _id: req.params.id, tenantId });
  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }
  await expense.deleteOne();
  res.json({ message: "Expense removed" });
});

export default router;
