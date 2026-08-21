/**
 * One-time migration: normalize existing usernames to lowercase.
 *
 * Why this is needed:
 *   The User schema (backend/src/models/User.js) has `lowercase: true` on the
 *   `username` field, and login/signup routes already normalize input with
 *   .toLowerCase(). That makes username matching case-insensitive going
 *   forward, BUT it only applies when a document is saved. Any user created
 *   BEFORE this normalization was added may still be stored with mixed case
 *   (e.g. "Admin"), which is why login can still look "case sensitive" for
 *   those older accounts even though the code is already correct.
 *
 * What this script does:
 *   Finds every user whose stored username isn't already lowercase and
 *   re-saves it in lowercase, so it matches the same normalization used by
 *   the app at runtime.
 *
 * Usage:
 *   cd backend
 *   node ../migrate-lowercase-usernames.js
 *   (or copy this file into backend/ and run: node migrate-lowercase-usernames.js)
 *
 * Set MONGODB_URI in your environment/.env if it's not the default
 * mongodb://localhost:27017/sl_hardware_pos used by backend/src/config/db.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sl_hardware_pos";

// Minimal schema matching the real User model just for this migration.
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
  },
  { strict: false, collection: "users" },
);
const User = mongoose.model("MigrationUser", userSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to ${MONGODB_URI}`);

  const users = await User.find({});
  let updated = 0;
  let skipped = 0;
  const conflicts = [];

  for (const user of users) {
    const original = user.username;
    const normalized = String(original || "").trim().toLowerCase();

    if (original === normalized) {
      skipped += 1;
      continue;
    }

    // Guard against collisions: if another user already has this
    // lowercase username, this account can't be silently renamed.
    const clash = await User.findOne({
      _id: { $ne: user._id },
      username: normalized,
    });

    if (clash) {
      conflicts.push({ id: user._id.toString(), from: original, to: normalized });
      continue;
    }

    user.username = normalized;
    await user.save();
    updated += 1;
    console.log(`Updated: "${original}" -> "${normalized}"`);
  }

  console.log("\n--- Migration summary ---");
  console.log(`Updated:  ${updated}`);
  console.log(`Skipped (already lowercase): ${skipped}`);
  console.log(`Conflicts (needs manual review): ${conflicts.length}`);

  if (conflicts.length) {
    console.log("\nThe following accounts share a username once lowercased.");
    console.log("Resolve these manually (rename or merge) before relying on");
    console.log("case-insensitive login for them:");
    conflicts.forEach((c) =>
      console.log(`  - ${c.id}: "${c.from}" would collide with "${c.to}"`),
    );
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
