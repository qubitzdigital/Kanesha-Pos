/**
 * Bootstrap Script: Create Super Admin
 *
 * Super Admin accounts are NOT created through the public signup form
 * (there is intentionally no public API route for this) to keep the
 * "ultimate administrator" role locked down to whoever controls the server.
 *
 * Usage:
 *   node backend/scripts/createSuperAdmin.js "Full Name" "username" "password" ["phone"]
 *
 * Example:
 *   node backend/scripts/createSuperAdmin.js "Platform Owner" "superadmin" "StrongPass1@"
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/User.js";

dotenv.config();

async function createSuperAdmin() {
  const [, , name, username, password, phone] = process.argv;

  if (!name || !username || !password) {
    console.error(
      'Usage: node backend/scripts/createSuperAdmin.js "Full Name" "username" "password" ["phone"]',
    );
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/pos";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const existing = await User.findOne({ username });
    if (existing) {
      console.error(`❌ Username "${username}" already exists.`);
      await mongoose.connection.close();
      process.exit(1);
    }

    // Super admin doesn't manage a shop tenant, so it gets its own
    // dedicated, fixed tenant namespace.
    const user = await User.create({
      name,
      username,
      password,
      phone: phone || undefined,
      role: "superadmin",
      tenantId: "SUPERADMIN",
    });

    console.log("✅ Super admin created successfully:");
    console.log(`   Name:     ${user.name}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role:     ${user.role}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create super admin:", err.message);
    process.exit(1);
  }
}

createSuperAdmin();
