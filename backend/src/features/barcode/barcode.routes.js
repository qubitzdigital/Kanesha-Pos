import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import {
  getBarcodePreview,
  saveBarcode,
  generateBarcodeImage,
  checkBarcodeUnique,
} from "./barcode.controller.js";

const router = express.Router();

// GET /api/barcode/check?value=&excludeId=  – duplicate check (no storage)
router.get("/check", protect, checkBarcodeUnique);

// POST /api/barcode/generate-image – generate Code128 PNG (no storage)
router.post("/generate-image", protect, generateBarcodeImage);

// GET /api/barcode/preview/:id  – fetch barcode label data for an item
router.get("/preview/:id", protect, getBarcodePreview);

// PATCH /api/barcode/:id        – save / update barcode on an item
router.patch("/:id", protect, saveBarcode);

export default router;
