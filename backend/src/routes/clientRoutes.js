import express from "express";
import crypto from "crypto";
import { User } from "../models/User.js";
import { protect, superAdminOnly } from "../middleware/authMiddleware.js";
import {
  validateOwnerSignup,
  handleValidationErrors,
} from "../middleware/validationMiddleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * Client (tenant) management — Super Admin only.
 * A "client" is a new customer/business onboarded onto the platform.
 * Creating a client provisions a brand new tenant plus its owner/admin login.
 */

// Create a new client (new tenant + owner account)
router.post(
  "/",
  protect,
  superAdminOnly,
  validateOwnerSignup,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, username, password, phone, businessName } = req.body || {};

      if (!name || !username || !password) {
        return res
          .status(400)
          .json({ message: "name, username, and password are required" });
      }

      const existing = await User.findOne({
        username: String(username).trim().toLowerCase(),
      });
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const tenantId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : crypto.randomBytes(16).toString("hex"); // fallback

      const owner = await User.create({
        name: String(name).trim(),
        username: String(username).trim(),
        password: String(password),
        phone: phone ? String(phone).trim() : undefined,
        role: "owner",
        tenantId,
      });

      const safeOwner = await User.findById(owner._id).select("-password");

      logger.info("[clients] new client created", {
        tenantId,
        username: safeOwner.username,
        createdBy: req.user?.username,
      });

      return res.status(201).json({
        message: "Client created successfully",
        client: {
          tenantId,
          businessName: businessName ? String(businessName).trim() : "",
          owner: safeOwner,
        },
      });
    } catch (err) {
      logger.error("[clients-create] error:", { error: err.message });
      if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        const msg =
          field === "username"
            ? "Username already exists"
            : `${field} already exists`;
        return res.status(400).json({ message: msg });
      }
      return res.status(500).json({ message: "Failed to create client" });
    }
  },
);

// List all clients (tenants) — grouped by their owner account
router.get("/", protect, superAdminOnly, async (req, res) => {
  try {
    const owners = await User.find({ role: "owner" })
      .select("-password")
      .sort({ createdAt: -1 });

    // For each tenant, include a headcount of staff users
    const tenantIds = owners.map((o) => o.tenantId);
    const staffCounts = await User.aggregate([
      { $match: { tenantId: { $in: tenantIds }, role: { $ne: "owner" } } },
      { $group: { _id: "$tenantId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(staffCounts.map((s) => [s._id, s.count]));

    const clients = owners.map((o) => ({
      tenantId: o.tenantId,
      owner: o,
      staffCount: countMap.get(o.tenantId) || 0,
      isActive: o.isActive,
      createdAt: o.createdAt,
    }));

    return res.json(clients);
  } catch (err) {
    logger.error("[clients-list] error:", { error: err.message });
    return res.status(500).json({ message: "Failed to fetch clients" });
  }
});

// Activate / deactivate a client (disables the owner login for that tenant)
router.put("/:tenantId/status", protect, superAdminOnly, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { isActive } = req.body || {};

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ message: "isActive (boolean) is required" });
    }

    const owner = await User.findOneAndUpdate(
      { tenantId, role: "owner" },
      { isActive },
      { new: true },
    ).select("-password");

    if (!owner) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.json({ message: "Client status updated", owner });
  } catch (err) {
    logger.error("[clients-status] error:", { error: err.message });
    return res.status(500).json({ message: "Failed to update client status" });
  }
});

export default router;
