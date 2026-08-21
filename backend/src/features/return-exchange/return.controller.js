import mongoose from "mongoose";
import { Item } from "../../models/Item.js";
import { Sale } from "../../models/Sale.js";
import { Return } from "./Return.js";
import { addStock, deductStock } from "../../services/stockService.js";

/**
 * Sums how many units of a given item (+ batch + size, when applicable)
 * were actually sold, and how many of those have already been returned,
 * so we never let a return/exchange refund more than was genuinely sold.
 *
 * Matching rule: when batchNumber/variantSize is not supplied (item isn't
 * batch-tracked / doesn't have variants), we only match sale/return lines
 * that likewise have no batchNumber/variantSize — this stops a return for
 * an untracked item from being satisfied by stock actually sold under a
 * specific batch, and vice versa.
 */
const getReturnableQty = async (
  { tenantId, itemId, batchNumber, variantSize },
  session,
) => {
  const itemObjectId = new mongoose.Types.ObjectId(itemId);
  const bn = batchNumber ? String(batchNumber).trim() : "";
  const vs = variantSize ? String(variantSize).trim() : "";

  const batchClause = (field) =>
    bn ? { [field]: bn } : { [field]: { $in: [null, "", undefined] } };
  const variantClause = (field) =>
    vs ? { [field]: vs } : { [field]: { $in: [null, "", undefined] } };

  const soldAgg = await Sale.aggregate([
    { $match: { tenantId, status: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    {
      $match: {
        "items.item": itemObjectId,
        ...batchClause("items.batchNumber"),
        ...variantClause("items.variantSize"),
      },
    },
    { $group: { _id: null, qty: { $sum: "$items.qty" } } },
  ]).session(session);

  const returnedAgg = await Return.aggregate([
    { $match: { tenantId } },
    { $unwind: "$returnLines" },
    {
      $match: {
        "returnLines.item": itemObjectId,
        ...batchClause("returnLines.batchNumber"),
        ...variantClause("returnLines.variantSize"),
      },
    },
    { $group: { _id: null, qty: { $sum: "$returnLines.returnQty" } } },
  ]).session(session);

  const totalSold = soldAgg[0]?.qty || 0;
  const totalReturned = returnedAgg[0]?.qty || 0;
  return Math.max(0, totalSold - totalReturned);
};

/**
 * Validates a batch of return lines (already grouped/processed) against
 * how many units remain returnable, accounting for multiple lines in the
 * same request that target the same item/batch/size. Throws with a clear
 * message the moment any line asks for more than is available.
 */
const assertReturnableQuantities = async (
  processedReturnLines,
  tenantId,
  session,
) => {
  const usedByKey = new Map();

  for (const line of processedReturnLines) {
    const key = [
      String(line.item),
      line.batchNumber || "",
      line.variantSize || "",
    ].join("::");

    const alreadyRequested = usedByKey.get(key) || 0;
    const available = await getReturnableQty(
      {
        tenantId,
        itemId: line.item,
        batchNumber: line.batchNumber,
        variantSize: line.variantSize,
      },
      session,
    );

    const remaining = available - alreadyRequested;
    if (line.returnQty > remaining) {
      const batchLabel = line.batchNumber ? ` (batch ${line.batchNumber})` : "";
      const sizeLabel = line.variantSize ? `, size ${line.variantSize}` : "";
      throw new Error(
        remaining > 0
          ? `Cannot return ${line.returnQty} of "${line.name}"${batchLabel}${sizeLabel} — only ${remaining} sold unit(s) remain eligible for return.`
          : `Cannot return "${line.name}"${batchLabel}${sizeLabel} — no sold units from this batch remain eligible for return.`,
      );
    }

    usedByKey.set(key, alreadyRequested + line.returnQty);
  }
};

/**
 * GET /api/returns/search?q=<barcode|sku>&type=barcode|sku
 * Finds a product from inventory by barcode or SKU.
 */
export const searchProduct = async (req, res) => {
  const tenantId = req.user?.tenantId;
  const { q, type = "barcode" } = req.query;

  if (!q?.trim()) {
    return res.status(400).json({ message: "Query is required" });
  }

  const field = type === "sku" ? "sku" : "barcode";
  const item = await Item.findOne({
    tenantId,
    [field]: { $regex: new RegExp(`^${q.trim()}$`, "i") },
    isActive: true,
  }).select(
    "name sku barcode baseUnit sellingPrice taxApplicable currentStock isBatchTracked hasVariants variants",
  );

  if (!item) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({
    item: {
      _id: item._id,
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      unit: item.baseUnit,
      unitPrice: item.sellingPrice,
      sellingPrice: item.sellingPrice,
      vatApplicable: item.taxApplicable,
      currentStock: item.currentStock ?? 0,
      isBatchTracked: item.isBatchTracked ?? false,
      hasVariants: item.hasVariants ?? false,
      variants: item.variants || [],
    },
  });
};

/**
 * POST /api/returns
 * Creates a return record and restores stock for each returned line.
 */
export const createReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Tenant context missing" });
    }

    const { reason, reasonNote, returnLines } = req.body;

    if (!reason || !Array.isArray(returnLines) || !returnLines.length) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "reason and returnLines are required" });
    }

    // Fetch cost prices + variant info for all returned items
    const itemIds = returnLines.map((l) => l.itemId);
    const itemDocs = await Item.find({ _id: { $in: itemIds }, tenantId })
      .select("_id name costPrice hasVariants variants")
      .session(session);
    const itemMap = new Map(itemDocs.map((i) => [i._id.toString(), i]));

    // Build return lines with refund amounts
    const processedLines = returnLines.map((line) => {
      const qty = Number(line.returnQty);
      const price = Number(line.unitPrice);
      if (!qty || qty <= 0)
        throw new Error(`Invalid returnQty for item ${line.itemId}`);
      if (!price || price < 0)
        throw new Error(`Invalid unitPrice for item ${line.itemId}`);

      const dbItem = itemMap.get(String(line.itemId));
      if (!dbItem) throw new Error(`Item not found: ${line.itemId}`);

      // Size is mandatory for items with size variants — without it we
      // wouldn't know which size's stock to restore.
      let variantSize;
      if (dbItem.hasVariants) {
        variantSize = String(line.variantSize || "").trim();
        if (!variantSize) {
          throw new Error(`Size is required for "${dbItem.name}"`);
        }
        const known = (dbItem.variants || []).find(
          (v) =>
            (v.size || "").trim().toLowerCase() === variantSize.toLowerCase(),
        );
        if (!known) {
          throw new Error(
            `"${variantSize}" is not a known size for "${dbItem.name}"`,
          );
        }
      }

      const costPrice = Number(dbItem.costPrice) || 0;
      return {
        item: line.itemId,
        name: line.name,
        sku: line.sku,
        batchNumber: line.batchNumber || undefined,
        batchId: line.batchId || undefined,
        variantSize: variantSize || undefined,
        returnQty: qty,
        unit: line.unit,
        unitPrice: price,
        costPrice,
        refundAmount: qty * price,
        profitDeducted: qty * (price - costPrice),
      };
    });

    // A return can never exceed what was actually sold (net of prior
    // returns) for that item/batch/size — reject the whole request if any
    // line asks for more than that.
    await assertReturnableQuantities(processedLines, tenantId, session);

    const totalRefund = processedLines.reduce(
      (sum, l) => sum + l.refundAmount,
      0,
    );
    const totalProfitDeducted = processedLines.reduce(
      (sum, l) => sum + l.profitDeducted,
      0,
    );

    // Restore stock for each returned item
    for (const line of processedLines) {
      await addStock(
        {
          itemId: line.item,
          tenantId,
          qty: line.returnQty,
          batchNumber: line.batchNumber,
          variantSize: line.variantSize,
          note: `Direct inventory return`,
          type: "return",
          createdBy: req.user?._id,
        },
        session,
      );
    }

    const [returnDoc] = await Return.create(
      [
        {
          tenantId,
          type: "return",
          reason,
          reasonNote: reasonNote?.trim() || undefined,
          returnLines: processedLines,
          totalRefund,
          profitDeducted: totalProfitDeducted,
          createdBy: req.user?._id,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();
    res.status(201).json(returnDoc);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("[createReturn] error:", err.message);
    res
      .status(400)
      .json({ message: err.message || "Failed to process return" });
  }
};

/**
 * POST /api/returns/exchange
 * Processes an exchange: restores stock for the returned line(s), deducts
 * stock for the newly issued item(s), and records the balance (extra
 * payment collected, or refund owed) — all in a single transaction so
 * stock never ends up partially adjusted.
 */
export const createExchange = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Tenant context missing" });
    }

    const { reason, reasonNote, returnLines, exchangeLines } = req.body;

    if (
      !reason ||
      !Array.isArray(returnLines) ||
      !returnLines.length ||
      !Array.isArray(exchangeLines) ||
      !exchangeLines.length
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "reason, returnLines and exchangeLines are required",
      });
    }

    const itemIds = [
      ...new Set(
        [...returnLines, ...exchangeLines].map((l) => String(l.itemId)),
      ),
    ];
    const itemDocs = await Item.find({ _id: { $in: itemIds }, tenantId })
      .select("_id name costPrice hasVariants variants taxApplicable")
      .session(session);
    const itemMap = new Map(itemDocs.map((i) => [i._id.toString(), i]));

    const resolveVariantSize = (dbItem, lineVariantSize) => {
      if (!dbItem.hasVariants) return undefined;
      const size = String(lineVariantSize || "").trim();
      if (!size) throw new Error(`Size is required for "${dbItem.name}"`);
      const known = (dbItem.variants || []).find(
        (v) => (v.size || "").trim().toLowerCase() === size.toLowerCase(),
      );
      if (!known) {
        throw new Error(`"${size}" is not a known size for "${dbItem.name}"`);
      }
      return size;
    };

    // ── Returned line(s): being given back by the customer ──
    const processedReturnLines = returnLines.map((line) => {
      const qty = Number(line.returnQty);
      const price = Number(line.unitPrice);
      if (!qty || qty <= 0)
        throw new Error(`Invalid returnQty for item ${line.itemId}`);
      if (!price || price < 0)
        throw new Error(`Invalid unitPrice for item ${line.itemId}`);

      const dbItem = itemMap.get(String(line.itemId));
      if (!dbItem) throw new Error(`Item not found: ${line.itemId}`);
      const variantSize = resolveVariantSize(dbItem, line.variantSize);
      const costPrice = Number(dbItem.costPrice) || 0;

      return {
        item: line.itemId,
        name: line.name,
        sku: line.sku,
        batchNumber: line.batchNumber || undefined,
        batchId: line.batchId || undefined,
        variantSize,
        returnQty: qty,
        unit: line.unit,
        unitPrice: price,
        costPrice,
        refundAmount: qty * price,
        profitDeducted: qty * (price - costPrice),
      };
    });

    // ── New/exchange line(s): being issued to the customer ──
    const processedExchangeLines = exchangeLines.map((line) => {
      const qty = Number(line.qty);
      const price = Number(line.unitPrice);
      if (!qty || qty <= 0)
        throw new Error(`Invalid qty for item ${line.itemId}`);
      if (!price || price < 0)
        throw new Error(`Invalid unitPrice for item ${line.itemId}`);

      const dbItem = itemMap.get(String(line.itemId));
      if (!dbItem) throw new Error(`Item not found: ${line.itemId}`);
      const variantSize = resolveVariantSize(dbItem, line.variantSize);
      const costPrice = Number(dbItem.costPrice) || 0;

      return {
        item: line.itemId,
        name: line.name,
        sku: line.sku,
        batchNumber: line.batchNumber || undefined,
        batchId: line.batchId || undefined,
        variantSize,
        qty,
        unit: line.unit,
        unitPrice: price,
        costPrice,
        lineTotal: qty * price,
      };
    });

    // Same rule as a plain return: the returned side of an exchange can
    // never exceed what was actually sold (net of prior returns) for that
    // item/batch/size.
    await assertReturnableQuantities(processedReturnLines, tenantId, session);

    const totalRefund = processedReturnLines.reduce(
      (sum, l) => sum + l.refundAmount,
      0,
    );
    const totalProfitDeducted = processedReturnLines.reduce(
      (sum, l) => sum + l.profitDeducted,
      0,
    );
    const newItemsTotal = processedExchangeLines.reduce(
      (sum, l) => sum + l.lineTotal,
      0,
    );
    // Positive = customer owes the difference. Negative = customer is refunded.
    const balanceDue = newItemsTotal - totalRefund;

    // Restore stock for returned item(s) first…
    for (const line of processedReturnLines) {
      await addStock(
        {
          itemId: line.item,
          tenantId,
          qty: line.returnQty,
          batchNumber: line.batchNumber,
          variantSize: line.variantSize,
          note: `Exchange: item returned`,
          type: "exchange_return",
          createdBy: req.user?._id,
        },
        session,
      );
    }

    // …then deduct stock for the newly issued item(s). deductStock throws
    // if there isn't enough stock, which rolls back the whole transaction —
    // including the restock above — so nothing is left half-applied.
    for (const line of processedExchangeLines) {
      await deductStock(
        {
          itemId: line.item,
          tenantId,
          qty: line.qty,
          batchNumber: line.batchNumber,
          variantSize: line.variantSize,
          note: `Exchange: new item issued`,
          type: "exchange_issue",
          createdBy: req.user?._id,
        },
        session,
      );
    }

    const [exchangeDoc] = await Return.create(
      [
        {
          tenantId,
          type: "exchange",
          reason,
          reasonNote: reasonNote?.trim() || undefined,
          returnLines: processedReturnLines,
          exchangeLines: processedExchangeLines,
          totalRefund,
          balanceDue,
          profitDeducted: totalProfitDeducted,
          createdBy: req.user?._id,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();
    res.status(201).json(exchangeDoc);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("[createExchange] error:", err.message);
    res
      .status(400)
      .json({ message: err.message || "Failed to process exchange" });
  }
};
