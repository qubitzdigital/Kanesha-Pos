import express from "express";
import { protect, requireFeature } from "../middleware/authMiddleware.js";
import { Customer } from "../models/Customer.js";
import { Sale } from "../models/Sale.js";
import { CreditPayment } from "../models/CreditPayment.js";

const PHONE_REGEX = /^(0\d{9}|\+?\d{10,15})$/;
const validatePhone = (phone) => phone && PHONE_REGEX.test(phone.trim());

const router = express.Router();

// Create customer - requires "customers" feature
router.post("/", protect, requireFeature("customers"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { tenantId: ignoredTenant, ...safe } = req.body;
  if (safe.phone && !validatePhone(safe.phone)) {
    return res.status(400).json({ message: "Invalid phone number format." });
  }
  if (safe.phone) {
    const phoneExists = await Customer.exists({ tenantId, phone: safe.phone.trim() });
    if (phoneExists) return res.status(409).json({ message: "A customer with this phone number already exists." });
  }
  if (safe.nic) {
    const nicExists = await Customer.exists({ tenantId, nic: safe.nic.toUpperCase() });
    if (nicExists) return res.status(409).json({ message: "A customer with this NIC already exists." });
    safe.nic = safe.nic.toUpperCase();
  }
  const customer = await Customer.create({ ...safe, tenantId });
  res.status(201).json(customer);
});

// List/search customers - requires "customers" feature
router.get("/", protect, requireFeature("customers"), async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { q } = req.query;
  const filter = { tenantId };
  if (q) {
    filter.$text = { $search: q };
  }
  const customers = await Customer.find(filter).limit(200).sort({ name: 1 });
  res.json(customers);
});

// Get customer + credit summary
router.get("/:id", protect, async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const customer = await Customer.findOne({
    _id: req.params.id,
    tenantId,
  });
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  const creditSales = await Sale.find({
    tenantId,
    customer: customer._id,
  }).sort({ createdAt: -1 });
  res.json({ customer, creditSales });
});

// Monthly statement (simple)
router.get("/:id/statement", protect, async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { from, to } = req.query;
  const customer = await Customer.findOne({
    _id: req.params.id,
    tenantId,
  });
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  const dateFilter = {};
  if (from || to) {
    dateFilter.createdAt = {};
    if (from) dateFilter.createdAt.$gte = new Date(from);
    if (to) dateFilter.createdAt.$lte = new Date(to);
  }
  const sales = await Sale.find({
    tenantId,
    customer: customer._id,
    ...dateFilter,
  }).sort({ createdAt: 1 });

  res.json({
    customer,
    from,
    to,
    openingBalance: customer.currentBalance, // simplified
    transactions: sales,
  });
});

// Receive payment from customer (reduce credit balance)
router.post("/:id/receive-payment", protect, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const customer = await Customer.findOne({
      _id: req.params.id,
      tenantId,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const { amount, method, reference, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    if (!method || !["cash", "card", "bank"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Create credit payment record
    const payment = await CreditPayment.create({
      tenantId,
      customer: customer._id,
      amount: Number(amount),
      method,
      reference: reference || "",
      note: note || "",
    });

    // Update customer balance
    customer.currentBalance = (customer.currentBalance || 0) - Number(amount);
    await customer.save();

    res.status(201).json({
      payment,
      customer,
      message: "Payment received successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get payment history for a customer
router.get("/:id/payments", protect, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const payments = await CreditPayment.find({
      tenantId,
      customer: req.params.id,
    })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update customer
router.put("/:id", protect, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const { name, phone, address, nic, type, creditLimit, notes } = req.body;

    const customer = await Customer.findOne({
      _id: req.params.id,
      tenantId,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update fields if provided
    if (name) customer.name = name;
    if (phone) {
      if (!validatePhone(phone)) {
        return res.status(400).json({ message: "Invalid phone number format." });
      }
      const phoneExists = await Customer.exists({ tenantId, phone: phone.trim(), _id: { $ne: customer._id } });
      if (phoneExists) return res.status(409).json({ message: "A customer with this phone number already exists." });
      customer.phone = phone;
    }
    if (address) customer.address = address;
    if (nic) {
      const nicExists = await Customer.exists({ tenantId, nic: nic.toUpperCase(), _id: { $ne: customer._id } });
      if (nicExists) return res.status(409).json({ message: "A customer with this NIC already exists." });
      customer.nic = nic.toUpperCase();
    }
    if (type) customer.type = type;
    if (creditLimit !== undefined) customer.creditLimit = creditLimit;
    if (notes) customer.notes = notes;

    await customer.save();
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete customer
router.delete("/:id", protect, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const customer = await Customer.findOne({
      _id: req.params.id,
      tenantId,
    });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Check if customer has outstanding balance
    if (customer.currentBalance > 0) {
      return res.status(400).json({
        message: "Cannot delete customer with outstanding balance",
      });
    }

    // Check if customer has any sales
    const salesCount = await Sale.countDocuments({
      tenantId,
      customer: customer._id,
    });
    if (salesCount > 0) {
      return res.status(400).json({
        message: "Cannot delete customer with existing sales records",
      });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
