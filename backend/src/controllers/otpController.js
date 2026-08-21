import Otp from "../models/Otp.js";
import { sendSmsViaNotify } from "../services/notifySmsService.js";
import { toE164FromAny } from "../utils/phone.js";
import logger from "../utils/logger.js";

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

// POST /api/otp/send
export const sendOtp = async (req, res) => {
  try {
    const { phone, purpose = "FORGOT_PASSWORD" } = req.body || {};

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const phoneE164 = toE164FromAny(phone);

    if (!phoneE164) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    try {
      await Otp.create({
        phone: phoneE164,
        otp: otp,
        purpose,
        expiresAt,
        used: false,
      });
    } catch (err) {
      if (err.errors) {
        const validationErrors = Object.entries(err.errors)
          .map(([field, error]) => `${field}: ${error.message}`)
          .join("; ");
        logger.warn("[OTP] Validation error saving OTP:", { validationErrors });
      } else {
        logger.warn("[OTP] Error saving OTP:", { error: err.message });
      }
      return res.status(500).json({
        success: false,
        message: "Failed to save OTP to DB",
      });
    }

    const smsText = `Use ${otp} to verify your POS account. Valid for ${OTP_EXPIRY_SECONDS} seconds.`;

    await sendSmsViaNotify(phoneE164, smsText);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      expiresInSeconds: OTP_EXPIRY_SECONDS,
    });
  } catch (err) {
    logger.error("[OTP] Error in /api/otp/send:", { error: err.message });
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

// POST /api/otp/verify
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, purpose = "FORGOT_PASSWORD" } = req.body || {};

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and otp are required",
      });
    }

    const phoneE164 = toE164FromAny(phone);
    if (!phoneE164) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    const now = new Date();
    const otpDoc = await Otp.findOne({
      phone: phoneE164,
      otp: String(otp),
      purpose,
      used: false,
      expiresAt: { $gt: now },
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark as used
    otpDoc.used = true;
    await otpDoc.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified",
      phoneE164: phoneE164 || (otpDoc && otpDoc.phone) || null,
    });
  } catch (err) {
    logger.error("[OTP] Error verifying OTP:", { error: err.message });
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
};
