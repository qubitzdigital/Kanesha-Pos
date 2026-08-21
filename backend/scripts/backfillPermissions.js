/**
 * Migration Script: Backfill User Permissions
 *
 * This script adds the new `permissions` field to existing user documents
 * that were created before the feature permission system was implemented.
 *
 * Run this script once after deploying the feature permission system:
 * node backend/scripts/backfillPermissions.js
 */

import mongoose from "mongoose";
import { User } from "../src/models/User.js";
import { DEFAULT_FEATURES_BY_ROLE } from "../src/utils/featurePermissions.js";
import dotenv from "dotenv";

dotenv.config();

async function backfillPermissions() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/pos";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Find all users without permissions field or with empty permissions
    const users = await User.find({
      $or: [{ permissions: { $exists: false } }, { permissions: { $eq: [] } }],
    });

    console.log(`Found ${users.length} user(s) to update`);

    if (users.length === 0) {
      console.log("✅ No users to update - all users have permissions!");
      await mongoose.connection.close();
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Get default permissions for user's role
        const defaultPermissions =
          DEFAULT_FEATURES_BY_ROLE[user.role] ||
          DEFAULT_FEATURES_BY_ROLE.cashier;

        // Update user
        user.permissions = defaultPermissions;
        await user.save();

        console.log(
          `✅ Updated ${user.username} (${user.role}): ${defaultPermissions.join(", ")}`,
        );
        updated++;
      } catch (err) {
        console.error(`❌ Failed to update ${user.username}:`, err.message);
        errors++;
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   Total users: ${users.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors: ${errors}`);

    if (errors === 0) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.log(`\n⚠️  Migration completed with ${errors} error(s)`);
    }

    await mongoose.connection.close();
    process.exit(errors > 0 ? 1 : 0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

// Run the migration
backfillPermissions();
