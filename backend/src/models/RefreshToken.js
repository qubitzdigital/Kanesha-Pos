import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    replacedByToken: { type: String },
    createdAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
