import { body, validationResult } from "express-validator";

/**
 * Input validation middleware and validators
 * Ensures data consistency and prevents common issues
 */

// Validation result handler - attach this after validators to catch errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Login validation
export const validateLogin = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be 3-50 characters"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// Owner signup validation
export const validateOwnerSignup = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2-100 characters"),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be 3-50 characters"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("phone")
    .optional()
    .trim()
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone must be 9-15 characters"),
];

// Staff user validation
export const validateStaffUser = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2-100 characters"),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be 3-50 characters"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .isIn(["cashier", "manager"])
    .withMessage("Invalid role"),
  body("phone")
    .optional()
    .trim()
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone must be 9-15 characters"),
  body("permissions")
    .optional()
    .isArray()
    .withMessage("Permissions must be an array"),
];

// OTP Send validation
export const validateOtpSend = [
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone must be 9-15 characters"),
  body("purpose")
    .optional()
    .isIn(["FORGOT_PASSWORD", "SIGNUP_VERIFICATION"])
    .withMessage("Invalid purpose"),
];

// OTP Verify validation
export const validateOtpVerify = [
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone is required")
    .isLength({ min: 9, max: 15 })
    .withMessage("Phone must be 9-15 characters"),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),
  body("purpose")
    .optional()
    .isIn(["FORGOT_PASSWORD", "SIGNUP_VERIFICATION"])
    .withMessage("Invalid purpose"),
];
