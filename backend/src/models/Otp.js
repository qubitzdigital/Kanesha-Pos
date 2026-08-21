// backend/models/Otp.js
import mongoose from "mongoose";

// Default TTL for OTPs when expiresAt isn't supplied by caller (seconds)
const DEFAULT_OTP_TTL_SECONDS = 300; // 5 minutes expiry

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String, // store as E.164, e.g. "+94771234567"
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: { type: String, default: "FORGOT_PASSWORD" },
    used: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + DEFAULT_OTP_TTL_SECONDS * 1000),
    },
  },
  { timestamps: true },
);

// TTL index: document auto-deletes after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Optional compound index to speed lookups
otpSchema.index({ phone: 1, otp: 1, purpose: 1, used: 1 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
