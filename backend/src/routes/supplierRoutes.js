import express from "express";
import { protect, requireFeature } from "../middleware/authMiddleware.js";
import { Supplier } from "../models/Supplier.js";
import { Purchase } from "../models/Purchase.js";
import logger from "../utils/logger.js";

const PHONE_REGEX = /^(0\d{9}|\+?\d{10,15})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateSupplierBody = (body) => {
  const { name, phones, address, email, creditLimit, openingBalance } = body;
  if (!name || name.trim().length < 2)
    return "Supplier name is required (min 2 chars).";
  if (!address || address.trim().length < 5)
    return "Address is required (min 5 chars).";
  if (!phones || !Array.isArray(phones) || phones.length === 0)
    return "At least one phone number is required.";
  const badPhone = phones.find((p) => !PHONE_REGEX.test(p.trim()));
  if (badPhone) return `Phone number "${badPhone}" is invalid.`;
  if (email && !EMAIL_REGEX.test(email.trim()))
    return "Email address is invalid.";
  const cl = Number(creditLimit);
  if (Number.isNaN(cl) || cl <= 0)
    return "Credit limit must be greater than 0.";
  const ob = Number(openingBalance ?? 0);
  if (Number.isNaN(ob) || ob < 0)
    return "Opening balance must be 0 or greater.";
  if (ob > cl) return "Opening balance cannot exceed credit limit.";
  return null;
};

const router = express.Router();

router.post("/", protect, requireFeature("suppliers"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { tenantId: ignoredTenant, ...safe } = req.body;

  const validationError = validateSupplierBody(safe);
  if (validationError) return res.status(400).json({ message: validationError });

  const duplicate = await Supplier.exists({ tenantId, name: safe.name.trim() });
  if (duplicate)
    return res.status(409).json({ message: "A supplier with this name already exists." });

  const supplier = await Supplier.create({ ...safe, name: safe.name.trim(), tenantId });
  res.status(201).json(supplier);
});

// Update supplier
router.put("/:id", protect, requireFeature("suppliers"), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      tenantId,
    });
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const fields = [
      "supplierCode",
      "name",
      "contactPerson",
      "phones",
      "address",
      "email",
      "creditLimit",
      "paymentTerms",
      "vatNo",
      "brn",
      "notes",
      "status",
    ];

    if (req.body.name) {
      const nameConflict = await Supplier.exists({
        tenantId,
        name: req.body.name.trim(),
        _id: { $ne: supplier._id },
      });
      if (nameConflict)
        return res.status(409).json({ message: "A supplier with this name already exists." });
    }

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        supplier[f] = req.body[f];
      }
    });

    await supplier.save();
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", protect, requireFeature("suppliers"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { q } = req.query;
  const filter = { tenantId };
  if (q) {
    filter.$text = { $search: q };
  }
  const suppliers = await Supplier.find(filter).limit(200).sort({ name: 1 });
  res.json(suppliers);
});

router.get("/:id", protect, async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const supplier = await Supplier.findOne({
    _id: req.params.id,
    tenantId,
  });
  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }
  const purchases = await Purchase.find({
    tenantId,
    supplier: supplier._id,
  }).sort({ createdAt: -1 });
  res.json({ supplier, purchases });
});

// Pay down supplier outstanding (reduces currentBalance)
router.post("/:id/pay", protect, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      tenantId,
    });
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const amount = Number(req.body.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Payment amount must be greater than 0" });
    }

    const outstanding = Number(supplier.currentBalance || 0);
    if (amount > outstanding) {
      return res.status(400).json({ message: "Amount exceeds outstanding" });
    }

    supplier.currentBalance = Math.max(0, outstanding - amount);
    await supplier.save();

    res.json({ supplier, message: "Payment recorded" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete supplier (only if no outstanding balance and no purchases)
router.delete("/:id", protect, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      tenantId,
    });
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    if (supplier.currentBalance > 0) {
      return res
        .status(400)
        .json({ message: "Cannot delete supplier with outstanding balance" });
    }

    const purchaseCount = await Purchase.countDocuments({
      tenantId,
      supplier: supplier._id,
    });
    if (purchaseCount > 0) {
      return res.status(400).json({
        message: "Cannot delete supplier with existing purchase records",
      });
    }

    await Supplier.findOneAndDelete({ _id: req.params.id, tenantId });
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
