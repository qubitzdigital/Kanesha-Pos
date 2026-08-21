import express from "express";
import { protect, requireFeature } from "../middleware/authMiddleware.js";
import {
  getDailySalesOverview,
  getLowStockItems,
  getOutstandingCredits,
  getSupplierPayables,
  getMonthlySalesTrend,
  getTopCategories,
  getProfitMetrics,
  getExpensesSummary,
  getDashboardSummary,
} from "../controllers/dashboardController.js";

const router = express.Router();

// Protected routes - all dashboard endpoints require "dashboard" feature permission
router.get(
  "/summary",
  protect,
  requireFeature("dashboard"),
  getDashboardSummary,
);
router.get(
  "/daily-sales",
  protect,
  requireFeature("dashboard"),
  getDailySalesOverview,
);
router.get(
  "/low-stock",
  protect,
  requireFeature("dashboard"),
  getLowStockItems,
);
router.get(
  "/outstanding-credits",
  protect,
  requireFeature("dashboard"),
  getOutstandingCredits,
);
router.get(
  "/supplier-payables",
  protect,
  requireFeature("dashboard"),
  getSupplierPayables,
);
router.get(
  "/monthly-trend",
  protect,
  requireFeature("dashboard"),
  getMonthlySalesTrend,
);
router.get(
  "/top-categories",
  protect,
  requireFeature("dashboard"),
  getTopCategories,
);
router.get(
  "/profit-metrics",
  protect,
  requireFeature("dashboard"),
  getProfitMetrics,
);
router.get(
  "/expenses-summary",
  protect,
  requireFeature("dashboard"),
  getExpensesSummary,
);

export default router;
