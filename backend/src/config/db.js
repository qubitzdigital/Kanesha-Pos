import mongoose from "mongoose";

export const connectDB = async () => {
  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/sl_hardware_pos";

  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // fail faster if DB is down
    });

    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err?.message || err);
    process.exit(1);
  }
};
