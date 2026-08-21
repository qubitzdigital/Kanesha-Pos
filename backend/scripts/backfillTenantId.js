import crypto from "crypto";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Item } from "../src/models/Item.js";
import { Sale } from "../src/models/Sale.js";
import { GRN } from "../src/models/GRN.js";
import { Purchase } from "../src/models/Purchase.js";
import { Customer } from "../src/models/Customer.js";
import { Supplier } from "../src/models/Supplier.js";
import { CreditPayment } from "../src/models/CreditPayment.js";
import { Expense } from "../src/models/Expense.js";
import { Settings } from "../src/models/Settings.js";
import { StockMovement } from "../src/models/StockMovement.js";

dotenv.config();

const MODELS = [
  { name: "User", model: User },
  { name: "Item", model: Item },
  { name: "Sale", model: Sale },
  { name: "GRN", model: GRN },
  { name: "Purchase", model: Purchase },
  { name: "Customer", model: Customer },
  { name: "Supplier", model: Supplier },
  { name: "CreditPayment", model: CreditPayment },
  { name: "Expense", model: Expense },
  { name: "Settings", model: Settings },
  { name: "StockMovement", model: StockMovement },
];

const missingTenantFilter = {
  $or: [
    { tenantId: { $exists: false } },
    { tenantId: null },
    { tenantId: "" },
  ],
};

const getTenantId = async () => {
  const envTenant = String(process.env.TENANT_ID || "").trim();
  if (envTenant) return envTenant;

  const existingUser = await User.findOne({
    tenantId: { $exists: true, $ne: "" },
  }).select("tenantId");
  if (existingUser?.tenantId) return existingUser.tenantId;

  return crypto.randomUUID();
};

const checkDuplicates = async (model, label, field) => {
  const pipeline = [
    {
      $match: {
        tenantId: { $exists: true, $ne: "" },
        [field]: { $type: "string", $ne: "" },
      },
    },
    {
      $group: {
        _id: { tenantId: "$tenantId", value: `$${field}` },
        count: { $sum: 1 },
        ids: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 20 },
  ];

  const results = await model.aggregate(pipeline);
  if (results.length === 0) return null;

  console.error(`Duplicate ${label} ${field} values (showing up to 20):`);
  results.forEach((row) => {
    console.error(
      `- tenantId=${row._id.tenantId} ${field}=${row._id.value} count=${row.count}`
    );
  });

  return results.length;
};

const checkTenantSingleton = async (model, label) => {
  const pipeline = [
    { $match: { tenantId: { $exists: true, $ne: "" } } },
    {
      $group: {
        _id: { tenantId: "$tenantId" },
        count: { $sum: 1 },
        ids: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 20 },
  ];

  const results = await model.aggregate(pipeline);
  if (results.length === 0) return null;

  console.error(`Duplicate ${label} entries per tenant (up to 20 shown):`);
  results.forEach((row) => {
    console.error(`- tenantId=${row._id.tenantId} count=${row.count}`);
  });

  return results.length;
};

const run = async () => {
  await connectDB();

  const tenantId = await getTenantId();
  console.log(`Using tenantId: ${tenantId}`);

  for (const { name, model } of MODELS) {
    const result = await model.updateMany(missingTenantFilter, {
      $set: { tenantId },
    });
    console.log(
      `${name}: matched=${result.matchedCount} modified=${result.modifiedCount}`
    );
  }

  let hasDupes = false;
  const dupChecks = [
    { model: Item, label: "Item", field: "sku" },
    { model: Sale, label: "Sale", field: "billNumber" },
    { model: GRN, label: "GRN", field: "grnNo" },
    { model: Supplier, label: "Supplier", field: "supplierCode" },
    { model: Customer, label: "Customer", field: "phone" },
    { model: User, label: "User", field: "username" },
  ];

  for (const check of dupChecks) {
    const count = await checkDuplicates(
      check.model,
      check.label,
      check.field
    );
    if (count) hasDupes = true;
  }

  const settingsDupes = await checkTenantSingleton(Settings, "Settings");
  if (settingsDupes) hasDupes = true;

  if (hasDupes) {
    console.error(
      "Index sync skipped due to duplicates. Fix duplicates and rerun."
    );
    process.exitCode = 1;
  } else {
    await Item.syncIndexes();
    await Sale.syncIndexes();
    await GRN.syncIndexes();
    console.log("Indexes synced for Item, Sale, and GRN.");
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  mongoose.disconnect().finally(() => process.exit(1));
});
