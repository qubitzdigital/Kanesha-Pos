import express from "express";
import { sendOtp, verifyOtp } from "../controllers/otpController.js";
import {
  otpSendLimiter,
  otpVerifyLimiter,
} from "../middleware/rateLimitMiddleware.js";
import {
  validateOtpSend,
  validateOtpVerify,
  handleValidationErrors,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router.post(
  "/send",
  otpSendLimiter,
  validateOtpSend,
  handleValidationErrors,
  sendOtp,
);
router.post(
  "/verify",
  otpVerifyLimiter,
  validateOtpVerify,
  handleValidationErrors,
  verifyOtp,
);

export default router;
