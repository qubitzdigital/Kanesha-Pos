import express from "express";
import {
  protect,
  adminOnly,
  requireFeature,
} from "../middleware/authMiddleware.js";
import { Settings } from "../models/Settings.js";

const router = express.Router();

const getOrCreateSettings = async (tenantId) => {
  let s = await Settings.findOne({ tenantId });
  if (!s) {
    s = await Settings.create({ tenantId });
  }
  return s;
};

// Get current settings
router.get(
  "/",
  protect,
  requireFeature("settings", "pos"),
  async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const s = await getOrCreateSettings(tenantId);
    res.json(s);
  },
);

// Update settings (admin only)
router.put(
  "/",
  protect,
  adminOnly,
  requireFeature("settings"),
  async (req, res) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const s = await getOrCreateSettings(tenantId);
    s.shopName = req.body.shopName ?? s.shopName;
    s.shopLogo = req.body.shopLogo ?? s.shopLogo;
    s.shopAddress = req.body.shopAddress ?? s.shopAddress;
    s.shopPhone = req.body.shopPhone ?? s.shopPhone;
    s.shopWhatsapp = req.body.shopWhatsapp ?? s.shopWhatsapp;
    s.vatRegNo = req.body.vatRegNo ?? s.vatRegNo;
    if (typeof req.body.vatRate !== "undefined") {
      s.vatRate = Number(req.body.vatRate) || 0;
    }
    s.currency = req.body.currency ?? s.currency;
    s.currencySymbol = req.body.currencySymbol ?? s.currencySymbol;
    s.currencyPosition = req.body.currencyPosition ?? s.currencyPosition;
    await s.save();
    res.json(s);
  },
);

// Add expense category
router.post(
  "/expense-categories",
  protect,
  requireFeature("settings"),
  async (req, res) => {
    const { category } = req.body;
    if (!category || !category.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const s = await getOrCreateSettings(tenantId);
    if (!s.expenseCategories.includes(category.trim())) {
      s.expenseCategories.push(category.trim());
      await s.save();
    }
    res.json(s);
  },
);

// Remove expense category
router.delete(
  "/expense-categories/:category",
  protect,
  requireFeature("settings"),
  async (req, res) => {
    const { category } = req.params;
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const s = await getOrCreateSettings(tenantId);
    s.expenseCategories = s.expenseCategories.filter((c) => c !== category);
    await s.save();
    res.json(s);
  },
);

export default router;
