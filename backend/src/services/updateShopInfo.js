// One-time script to update the existing Settings document(s) with the
// correct shop details. Running this is necessary because the receipt
// pulls shop info from the Settings document already saved in MongoDB —
// changing the schema's default value only affects brand-new documents,
// not ones that already exist.
//
// Usage (from the backend/ folder):
//   node src/scripts/updateShopInfo.js
//
// Make sure MONGODB_URI is set in your environment (or .env file) so this
// connects to the same database your app uses.

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Settings } from "../models/Settings.js";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sl_hardware_pos";

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI);

  const result = await Settings.updateMany(
    {}, // update every tenant's settings doc; narrow with { tenantId: "..." } if needed
    {
      $set: {
        shopName: "Kanesha Fancy",
        shopAddress: "Main Street, Pandatharippu",
        shopPhone: "0779295806",
        shopWhatsapp: "0779295806",
      },
    },
  );

  console.log(
    `Updated ${result.modifiedCount} settings document(s) out of ${result.matchedCount} matched.`,
  );

  await mongoose.disconnect();
  console.log("Done.");
};

run().catch((err) => {
  console.error("Failed to update shop settings:", err);
  process.exit(1);
});
