import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    shopName: { type: String, default: "Kanesha Fancy" },
    // Base64 data URL (e.g. "data:image/png;base64,...") of the shop logo,
    // uploaded from Settings and printed at the top of both invoice
    // templates. Stored inline (not as a separate file) since the project
    // has no file/object storage set up — a small logo easily fits in the
    // document. Empty string means "no logo set", in which case the
    // invoices just fall back to shop-name-only header (unchanged
    // behavior).
    shopLogo: { type: String, default: "" },
    shopAddress: {
      type: String,
      default: "Main Street, Pandatharippu",
    },
    shopPhone: { type: String, default: "0779295806" },
    shopWhatsapp: { type: String, default: "0779295806" },
    vatRegNo: { type: String, default: "123456789-7000" },
    vatRate: { type: Number, default: 0.15 }, // 15%
    currency: { type: String, default: "LKR" }, // Currency code
    currencySymbol: { type: String, default: "Rs." }, // Currency symbol
    currencyPosition: {
      type: String,
      enum: ["before", "after"],
      default: "before",
    }, // Symbol position
    expenseCategories: {
      type: [String],
      default: [
        "Rent",
        "Salaries",
        "Transport",
        "Electricity",
        "Water",
        "Telephone",
        "Maintenance",
        "Office Supplies",
        "Other",
      ],
    },
  },
  { timestamps: true },
);

// Single document collection - minimal indexing needed
// but included for consistency and potential future queries
settingsSchema.index({ createdAt: -1 }, { name: "settings_recent" });
settingsSchema.index(
  { tenantId: 1 },
  { unique: true, name: "settings_tenant_unique" },
);

// There will normally be only one settings document
export const Settings = mongoose.model("Settings", settingsSchema);
