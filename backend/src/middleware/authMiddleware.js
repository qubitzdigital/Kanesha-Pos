import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const protect = async (req, res, next) => {
  let token = null;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret)
      return res.status(500).json({ message: "Server misconfiguration" });
    const decoded = jwt.verify(token, secret);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (decoded.tenantId && req.user.tenantId !== decoded.tenantId) {
      return res.status(401).json({ message: "Tenant mismatch" });
    }
    if (!req.user.tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid access token" });
    }
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const adminOnly = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" ||
      req.user.role === "owner" ||
      req.user.role === "superadmin")
  ) {
    next();
  } else {
    return res.status(403).json({ message: "Admin or owner access only" });
  }
};

/**
 * Restricts access to platform superadmin accounts only.
 * Used for system-wide operations like onboarding new clients/tenants.
 */
export const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    next();
  } else {
    return res.status(403).json({ message: "Super admin access only" });
  }
};

/**
 * Middleware to check if user has access to a specific feature
 * Usage: router.get("/dashboard", protect, requireFeature("dashboard"), controller)
 */
export const requireFeature = (...featureIds) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authenticated");
    }

    // Owners, admins, and superadmins always have full access
    if (
      req.user.role === "owner" ||
      req.user.role === "admin" ||
      req.user.role === "superadmin"
    ) {
      return next();
    }

    // Check if user has at least one of the required feature permissions
    const hasPermission =
      Array.isArray(req.user.permissions) &&
      featureIds.some((id) => req.user.permissions.includes(id));

    if (!hasPermission) {
      res.status(403);
      return res.json({
        message: `You do not have access to the "${featureIds[0]}" feature`,
      });
    }

    next();
  };
};
