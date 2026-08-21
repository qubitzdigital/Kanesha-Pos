import rateLimit from "express-rate-limit";

/**
 * Rate limiters for different endpoints
 * Prevents brute force attacks and abuse
 */

// Auth endpoints: 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many login attempts. Please try again after 15 minutes.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => process.env.NODE_ENV !== "production", // Skip rate limiting in development
});

// OTP Send: 3 attempts per minute
export const otpSendLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: "Too many OTP requests. Please try again in a minute.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== "production",
});

// OTP Verify: 5 attempts per minute
export const otpVerifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "Too many OTP verification attempts. Please try again in a minute.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== "production",
});

// Owner signup: 1 attempt per 10 minutes
export const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1,
  message: "Signup limit exceeded. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== "production",
});
