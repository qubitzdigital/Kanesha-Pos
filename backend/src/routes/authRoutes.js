import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { toE164FromAny } from "../utils/phone.js";
import {
  authLimiter,
  signupLimiter,
} from "../middleware/rateLimitMiddleware.js";
import logger from "../utils/logger.js";
import {
  validateLogin,
  validateOwnerSignup,
  handleValidationErrors,
} from "../middleware/validationMiddleware.js";

dotenv.config();

const router = express.Router();

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

const ms = (val) => {
  if (typeof val === "number") return val;
  const match = /^([0-9]+)([smhd])$/.exec(String(val || ""));
  if (!match) return 0;

  const num = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return num * 1000;
    case "m":
      return num * 60 * 1000;
    case "h":
      return num * 60 * 60 * 1000;
    case "d":
      return num * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
};

const generateAccessToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");

  return jwt.sign(
    { id: user._id, tenantId: user.tenantId, role: user.role },
    secret,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
  );
};

const generateRefreshToken = async (user) => {
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + ms(REFRESH_TOKEN_EXPIRES_IN));

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    revoked: false,
  });

  return refreshToken;
};

// ✅ login: access token in JSON + refresh token in HttpOnly cookie
router.post(
  "/login",
  authLimiter,
  validateLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "username and password required" });
      }

      const isProd = process.env.NODE_ENV === "production";

      // Usernames are stored lowercase (see User schema), so normalize the
      // login input the same way — otherwise "John" typed at login
      // wouldn't match an account stored as "john".
      const normalizedUsername = String(username).trim().toLowerCase();
      const user = await User.findOne({ username: normalizedUsername }).select(
        "+password",
      );
      if (!user) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      const ok = await user.matchPassword(password);
      if (!ok) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: ms(REFRESH_TOKEN_EXPIRES_IN) || 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
        permissions: user.permissions,
        accessToken,
      });
    } catch (err) {
      logger.error("[login] error:", { error: err.message });
      return res.status(500).json({ message: "Login failed" });
    }
  },
);

// ✅ refresh token endpoint (cookie-based, rotates refresh tokens)
router.post("/refresh-token", async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ message: "Refresh token (cookie) required" });
    }

    const tokenDocs = await RefreshToken.find({ revoked: false }).sort({
      createdAt: -1,
    });

    let matchedDoc = null;
    for (const doc of tokenDocs) {
      // eslint-disable-next-line no-await-in-loop
      const match = await bcrypt.compare(refreshToken, doc.tokenHash);
      if (match) {
        matchedDoc = doc;
        break;
      }
    }

    if (!matchedDoc) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (matchedDoc.expiresAt < new Date()) {
      matchedDoc.revoked = true;
      matchedDoc.revokedAt = new Date();
      await matchedDoc.save();
      return res.status(401).json({ message: "Refresh token expired" });
    }

    const user = await User.findById(matchedDoc.user);
    if (!user) {
      matchedDoc.revoked = true;
      matchedDoc.revokedAt = new Date();
      await matchedDoc.save();
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Rotate
    matchedDoc.revoked = true;
    matchedDoc.revokedAt = new Date();

    const newRefreshToken = await generateRefreshToken(user);

    // NOTE: storing raw token string is not ideal but kept to match your existing schema usage
    matchedDoc.replacedByToken = newRefreshToken;
    await matchedDoc.save();

    const accessToken = generateAccessToken(user);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: ms(REFRESH_TOKEN_EXPIRES_IN) || 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
        permissions: user.permissions,
      },
    });
  } catch (err) {
    console.error("[refresh-token] error:", err);
    return res.status(500).json({ message: "Failed to refresh token" });
  }
});

// ✅ logout: revoke the refresh token in DB (if present) + clear cookie
router.post("/logout", async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const refreshToken = req.cookies?.refreshToken;

    // If cookie exists, revoke the matching token doc
    if (refreshToken) {
      const tokenDocs = await RefreshToken.find({ revoked: false }).sort({
        createdAt: -1,
      });

      let matchedDoc = null;
      for (const doc of tokenDocs) {
        // eslint-disable-next-line no-await-in-loop
        const match = await bcrypt.compare(refreshToken, doc.tokenHash);
        if (match) {
          matchedDoc = doc;
          break;
        }
      }

      if (matchedDoc) {
        matchedDoc.revoked = true;
        matchedDoc.revokedAt = new Date();
        await matchedDoc.save();
      }
    }

    // Clear cookie regardless (idempotent logout)
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({ message: "Logged out" });
  } catch (err) {
    console.error("[logout] error:", err);
    return res.status(500).json({ message: "Logout failed" });
  }
});

// ✅ reset password (exported controller; wire it in your routes as needed)
export const resetPassword = async (req, res) => {
  try {
    const { phone, password } = req.body || {};
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required",
      });
    }

    const phoneE164 = toE164FromAny(phone);
    if (!phoneE164) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    const user = await User.findOne({ phone: phoneE164 }).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isSame = await bcrypt.compare(password, user.password);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from previous password",
      });
    }

    user.password = password;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("[resetPassword] error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

export default router;
