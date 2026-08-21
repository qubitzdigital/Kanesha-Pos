import express from "express";
import { protect, requireFeature } from "../middleware/authMiddleware.js";
import {
  createGRN,
  getSupplierGRNs,
  getAllGRNs,
  getGRN,
  updateGRN,
  deleteGRN,
  postGRN,
  cancelGRN,
} from "../controllers/grnController.js";

const router = express.Router();

// Create DRAFT GRN
router.post("/", protect, requireFeature("purchases"), createGRN);

// List all GRNs
router.get("/", protect, requireFeature("purchases"), getAllGRNs);

// Supplier GRNs (must be before "/:id")
router.get(
  "/supplier/:supplierId",
  protect,
  requireFeature("purchases"),
  getSupplierGRNs,
);

// Post / Cancel (locking actions)
router.post("/:id/post", protect, requireFeature("purchases"), postGRN);
router.post("/:id/cancel", protect, requireFeature("purchases"), cancelGRN);

// Single GRN
router.get("/:id", protect, requireFeature("purchases"), getGRN);

// Update/Delete only draft
router.put("/:id", protect, requireFeature("purchases"), updateGRN);
router.delete("/:id", protect, requireFeature("purchases"), deleteGRN);

export default router;
