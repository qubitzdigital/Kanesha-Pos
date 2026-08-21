import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import setCacheControl from "./middleware/cacheMiddleware.js";
import logger from "./utils/logger.js";

import authRoutes from "./routes/authRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import grnRoutes from "./routes/grnRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import barcodeRoutes from "./features/barcode/barcode.routes.js";
import returnRoutes from "./features/return-exchange/return.routes.js";

dotenv.config();

// Hard fail early if required secrets are missing
if (!process.env.JWT_SECRET) {
  logger.error("JWT_SECRET is required. Set it in your environment.");
  process.exit(1);
}

const app = express();

// If you deploy behind a reverse proxy later (nginx / render / etc.)
app.set("trust proxy", 1);

// Security + logging
app.use(helmet());
app.use(morgan("dev"));

// Cache control middleware - set appropriate caching headers
app.use(setCacheControl);

// Body parsing (add a sensible limit for POS payloads)
app.use(express.json({ limit: "2mb" })); // raised from 1mb to comfortably fit a base64-encoded shop logo (see Settings.shopLogo)
app.use(cookieParser());

// CORS (keep open for dev; lock down in prod with env var)
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (process.env.CORS_ORIGIN || "").split(",").map((origin) => origin.trim())
    : [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
      ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "SL Hardware POS API running" });
});

// Database health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Ensure connection exists and ping admin DB
    if (!mongoose.connection?.db) throw new Error("No DB connection");
    await mongoose.connection.db.admin().ping();

    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Health check failed:", error.message);
    res.status(503).json({
      status: "error",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/grns", grnRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/barcode", barcodeRoutes);
app.use("/api/returns", returnRoutes);

// 404 + error (keep these LAST)
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", { error: err?.message || err });
    process.exit(1);
  }
};

start();
