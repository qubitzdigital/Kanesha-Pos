import express from "express";
import crypto from "crypto";
import { User } from "../models/User.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  validateFeatures,
  getFeaturesByRole,
} from "../utils/featurePermissions.js";
import { signupLimiter } from "../middleware/rateLimitMiddleware.js";
import {
  validateOwnerSignup,
  validateStaffUser,
  handleValidationErrors,
} from "../middleware/validationMiddleware.js";
import logger from "../utils/logger.js";

const router = express.Router();

const sanitizeRole = (role) => {
  const value = String(role || "")
    .toLowerCase()
    .trim();
  if (value === "manager") return "manager";
  return "cashier";
};

// Owner signup (creates a new tenant)
router.post(
  "/owner-signup",
  signupLimiter,
  validateOwnerSignup,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, username, password, phone } = req.body || {};

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

      const user = await User.create({
        name: String(name).trim(),
        username: String(username).trim(),
        password: String(password),
        phone: phone ? String(phone).trim() : undefined,
        role: "owner",
        tenantId,
      });

      const safeUser = await User.findById(user._id).select("-password");
      return res.status(201).json({ message: "Owner created", user: safeUser });
    } catch (err) {
      logger.error("[owner-signup] error:", { error: err.message });
      if (err?.code === 11000) {
        return res.status(400).json({ message: "Username already exists" });
      }
      return res.status(500).json({ message: "Failed to create owner" });
    }
  },
);

// Create staff user (same tenant as owner/admin)
router.post(
  "/staff",
  protect,
  adminOnly,
  validateStaffUser,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, username, password, role, phone, permissions } =
        req.body || {};

      const existing = await User.findOne({
        username: String(username).trim().toLowerCase(),
      });
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const sanitizedRole = sanitizeRole(role);

      // Use provided permissions if valid, otherwise use default for role
      let userPermissions = permissions;
      if (Array.isArray(permissions) && validateFeatures(permissions)) {
        userPermissions = permissions;
      } else {
        userPermissions = getFeaturesByRole(sanitizedRole);
      }

      const user = await User.create({
        name: String(name).trim(),
        username: String(username).trim(),
        password: String(password),
        phone: phone ? String(phone).trim() : undefined,
        role: sanitizedRole,
        permissions: userPermissions,
        tenantId: req.user.tenantId,
      });

      const safeUser = await User.findById(user._id).select("-password");
      return res
        .status(201)
        .json({ message: "Staff user created", user: safeUser });
    } catch (err) {
      logger.error("[staff-create] error:", { error: err.message });
      if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        const msg =
          field === "username"
            ? "Username already exists"
            : `${field} already exists`;
        return res.status(400).json({ message: msg });
      }
      return res.status(500).json({ message: "Failed to create staff user" });
    }
  },
);

// List users for the tenant
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.user.tenantId })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json(users);
  } catch (err) {
    console.error("[list-users] error:", err);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Update staff user (name, phone, role, password, status, permissions)
router.put("/:userId", protect, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, role, password, isActive, permissions } =
      req.body || {};

    // Find user and verify ownership (same tenant)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.tenantId !== req.user.tenantId) {
      return res
        .status(403)
        .json({ message: "Cannot update user from another tenant" });
    }

    // Prevent updating owner/admin accounts by non-owners
    if (user.role === "owner" || user.role === "admin") {
      return res.status(403).json({ message: "Cannot modify admin accounts" });
    }

    // Update allowed fields
    if (name && String(name).trim()) {
      user.name = String(name).trim();
    }

    if (phone) {
      user.phone = String(phone).trim();
    }

    if (role) {
      user.role = sanitizeRole(role);
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    // Update permissions if provided and valid
    if (Array.isArray(permissions) && validateFeatures(permissions)) {
      user.permissions = permissions;
    } else if (role) {
      // If role changed but permissions not provided, use default for new role
      const sanitizedRole = sanitizeRole(role);
      user.permissions = getFeaturesByRole(sanitizedRole);
    }

    // Only update password if provided
    if (password && String(password).trim()) {
      user.password = String(password).trim();
    }

    await user.save();

    const safeUser = await User.findById(user._id).select("-password");
    return res.json({ message: "User updated successfully", user: safeUser });
  } catch (err) {
    console.error("[update-staff] error:", err);
    return res.status(500).json({ message: "Failed to update staff user" });
  }
});

// Delete staff user (soft delete by marking inactive or hard delete)
router.delete("/:userId", protect, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { softDelete = true } = req.body || {};

    // Find user and verify ownership
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.tenantId !== req.user.tenantId) {
      return res
        .status(403)
        .json({ message: "Cannot delete user from another tenant" });
    }

    // Prevent deleting owner/admin accounts
    if (user.role === "owner" || user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin accounts" });
    }

    if (softDelete) {
      // Soft delete: mark as inactive
      user.isActive = false;
      await user.save();
      return res.json({ message: "User deactivated successfully" });
    } else {
      // Hard delete
      await User.findByIdAndDelete(userId);
      return res.json({ message: "User deleted successfully" });
    }
  } catch (err) {
    console.error("[delete-staff] error:", err);
    return res.status(500).json({ message: "Failed to delete staff user" });
  }
});

export default router;
