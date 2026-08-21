import { Sale } from "../models/Sale.js";
import { Item } from "../models/Item.js";
import { Customer } from "../models/Customer.js";
import { Purchase } from "../models/Purchase.js";
import { Supplier } from "../models/Supplier.js";
import { Expense } from "../models/Expense.js";
import { Return } from "../features/return-exchange/Return.js";

// ==========================================
// 1. REAL-TIME DAILY SALES OVERVIEW
// ==========================================
export const getDailySalesOverview = async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { date, startDate, endDate } = req.query;

  let start, end;

  if (startDate && endDate) {
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    start = new Date(
      startD.getFullYear(),
      startD.getMonth(),
      startD.getDate(),
      0,
      0,
      0,
      0,
    );
    end = new Date(
      endD.getFullYear(),
      endD.getMonth(),
      endD.getDate(),
      23,
      59,
      59,
      999,
    );
  } else {
    const d = date ? new Date(date) : new Date();
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }

  const [sales, [refundAgg]] = await Promise.all([
    Sale.find({ tenantId, createdAt: { $gte: start, $lte: end } }),
    Return.aggregate([
      { $match: { tenantId, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$totalRefund" } },
          profitDeducted: { $sum: { $toDouble: "$profitDeducted" } },
        },
      },
    ]),
  ]);

  const invoiceCount = sales.length;
  const totalRefunds = refundAgg?.total ?? 0;
  const returnProfitDeducted = refundAgg?.profitDeducted ?? 0;
  const totalSales =
    sales.reduce((sum, s) => sum + s.grandTotal, 0) - totalRefunds;
  const totalCost = sales.reduce((sum, s) => {
    const itemCosts = s.items.reduce(
      (itemSum, item) => itemSum + item.qty * (item.costPrice || 0),
      0,
    );
    return sum + itemCosts;
  }, 0);
  const grossProfit =
    totalSales + totalRefunds - totalCost - returnProfitDeducted;
  const totalVAT = sales.reduce((sum, s) => sum + (s.taxTotal || 0), 0);

  const paymentBreakdown = { cash: 0, card: 0, credit: 0, bank: 0 };
  sales.forEach((sale) => {
    sale.payments.forEach((payment) => {
      if (paymentBreakdown.hasOwnProperty(payment.method)) {
        paymentBreakdown[payment.method] += payment.amount;
      }
    });
  });

  res.json({
    startDate: start,
    endDate: end,
    invoiceCount,
    totalSalesAmount: totalSales,
    grossProfit,
    totalVAT,
    paymentBreakdown,
  });
};

// ==========================================
// 2. LOW STOCK CRITICAL ITEMS
// ==========================================
export const getLowStockItems = async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }

  // Use $expr to filter in MongoDB — avoids loading all items into Node
  const items = await Item.find(
    {
      tenantId,
      isActive: true,
      $expr: { $lte: ["$inventory.onHand", "$lowStockLevel"] },
    },
    { name: 1, sku: 1, "inventory.onHand": 1, lowStockLevel: 1, category: 1 },
  ).lean();

  const lowStockItems = items
    .map((item) => {
      const currentStock = item.inventory?.onHand || 0;
      const stockPercentage =
        item.lowStockLevel > 0 ? (currentStock / item.lowStockLevel) * 100 : 0;
      const status =
        currentStock <= 0 || currentStock <= item.lowStockLevel * 0.5
          ? "red"
          : "orange";
      const statusMessage =
        currentStock <= 0 ? "Empty" : status === "red" ? "Critical" : "Low";
      return {
        _id: item._id,
        name: item.name,
        sku: item.sku,
        currentStock,
        lowStockLevel: item.lowStockLevel,
        status,
        statusMessage,
        category: item.category,
        stockPercentage: Math.round(stockPercentage),
      };
    })
    .sort((a, b) => {
      const order = { red: 0, orange: 1 };
      if (order[a.status] !== order[b.status])
        return order[a.status] - order[b.status];
      return a.stockPercentage - b.stockPercentage;
    });

  res.json({ lowStockItems });
};

// ==========================================
// 3. OUTSTANDING CUSTOMER CREDIT SUMMARY
// ==========================================
export const getOutstandingCredits = async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }

  // Filter in MongoDB — only fetch customers with a positive balance
  const customers = await Customer.find(
    { tenantId, $expr: { $gt: ["$currentBalance", { $toDecimal: "0" }] } },
    { name: 1, phone: 1, currentBalance: 1, creditLimit: 1 },
  )
    .sort({ currentBalance: -1 })
    .lean();

  const creditData = customers.map((c) => {
    const balance = parseFloat(c.currentBalance?.toString() ?? "0");
    const limit = parseFloat(c.creditLimit?.toString() ?? "0");
    return {
      _id: c._id,
      name: c.name,
      phone: c.phone,
      currentBalance: balance,
      creditLimit: limit,
      creditPercentage: limit ? Math.round((balance / limit) * 100) : 0,
      status: balance > limit * 0.8 ? "warning" : "normal",
    };
  });

  const totalCreditGiven = creditData.reduce(
    (sum, c) => sum + c.currentBalance,
    0,
  );

  res.json({
    totalCreditGiven,
    topCustomers: creditData.slice(0, 10),
    warningCount: creditData.filter((c) => c.status === "warning").length,
  });
};

// ==========================================
// 4. SUPPLIER PAYABLES
// ==========================================
export const getSupplierPayables = async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }

  const [suppliers, unpaidPurchasesRaw] = await Promise.all([
    Supplier.find(
      { tenantId, currentBalance: { $gt: 0 }, status: "active" },
      { name: 1, currentBalance: 1, lastPurchaseDate: 1 },
    )
      .sort({ currentBalance: -1 })
      .limit(10)
      .lean(),
    Purchase.find(
      { tenantId, status: { $ne: "paid" } },
      { supplier: 1, billNumber: 1, balanceDue: 1, billDate: 1, status: 1 },
    )
      .sort({ billDate: -1 })
      .lean(),
  ]);

  // Group purchases by supplier in memory (single DB round-trip)
  const purchasesBySupplier = {};
  for (const p of unpaidPurchasesRaw) {
    const sid = p.supplier.toString();
    if (!purchasesBySupplier[sid]) purchasesBySupplier[sid] = [];
    if (purchasesBySupplier[sid].length < 10) {
      purchasesBySupplier[sid].push({
        billNumber: p.billNumber,
        amount: parseFloat(p.balanceDue?.toString() ?? "0"),
        dueDate: p.billDate,
        status: p.status,
      });
    }
  }

  const supplierPayables = suppliers.map((s) => ({
    _id: s._id,
    supplierName: s.name,
    totalPayable: parseFloat(s.currentBalance?.toString() ?? "0"),
    lastPurchaseDate: s.lastPurchaseDate,
    unpaidPurchases: purchasesBySupplier[s._id.toString()] || [],
  }));

  const totalOutstanding = supplierPayables.reduce(
    (sum, s) => sum + s.totalPayable,
    0,
  );

  res.json({ totalOutstanding, supplierPayables });
};

// ==========================================
// 5. MONTHLY / DAILY SALES TREND
// ==========================================
export const getMonthlySalesTrend = async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { months = 12, range = "months", days = 30 } = req.query;

  if (range === "days") {
    const daysNum = Math.min(parseInt(days, 10) || 30, 60);
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - (daysNum - 1));
    const start = new Date(
      rangeStart.getFullYear(),
      rangeStart.getMonth(),
      rangeStart.getDate(),
      0,
      0,
      0,
      0,
    );
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const [salesAgg, returnsAgg] = await Promise.all([
      Sale.aggregate([
        { $match: { tenantId, createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            totalSales: { $sum: { $toDouble: "$grandTotal" } },
            invoiceCount: { $sum: 1 },
          },
        },
      ]),
      Return.aggregate([
        { $match: { tenantId, createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            total: { $sum: { $toDouble: "$totalRefund" } },
          },
        },
      ]),
    ]);

    const salesMap = {};
    for (const s of salesAgg) salesMap[`${s._id.y}-${s._id.m}-${s._id.d}`] = s;
    const returnsMap = {};
    for (const r of returnsAgg)
      returnsMap[`${r._id.y}-${r._id.m}-${r._id.d}`] = r.total;

    const trendData = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const s = salesMap[key];
      const refund = returnsMap[key] ?? 0;
      trendData.push({
        month: d.toLocaleString("default", { month: "short", day: "numeric" }),
        totalSales: Math.round(((s?.totalSales ?? 0) - refund) * 100) / 100,
        invoiceCount: s?.invoiceCount ?? 0,
      });
    }
    return res.json({ trendData });
  }

  const monthsNum = Math.min(parseInt(months, 10) || 12, 12);
  const now = new Date();
  const rangeStart = new Date(
    now.getFullYear(),
    now.getMonth() - (monthsNum - 1),
    1,
  );
  const rangeEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const [salesAgg, returnsAgg] = await Promise.all([
    Sale.aggregate([
      { $match: { tenantId, createdAt: { $gte: rangeStart, $lte: rangeEnd } } },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          totalSales: { $sum: { $toDouble: "$grandTotal" } },
          invoiceCount: { $sum: 1 },
        },
      },
    ]),
    Return.aggregate([
      { $match: { tenantId, createdAt: { $gte: rangeStart, $lte: rangeEnd } } },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          total: { $sum: { $toDouble: "$totalRefund" } },
        },
      },
    ]),
  ]);

  const salesMap = {};
  for (const s of salesAgg) salesMap[`${s._id.y}-${s._id.m}`] = s;
  const returnsMap = {};
  for (const r of returnsAgg) returnsMap[`${r._id.y}-${r._id.m}`] = r.total;

  const trendData = [];
  for (let i = monthsNum - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const s = salesMap[key];
    const refund = returnsMap[key] ?? 0;
    trendData.push({
      month: d.toLocaleString("default", { month: "short", year: "numeric" }),
      totalSales: Math.round(((s?.totalSales ?? 0) - refund) * 100) / 100,
      invoiceCount: s?.invoiceCount ?? 0,
    });
  }
  res.json({ trendData });
};

// ==========================================
// 6. TOP SELLING CATEGORIES
// ==========================================
export const getTopCategories = async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { period = "today", startDate, endDate } = req.query;
  let dateFilter = {};

  if (startDate && endDate) {
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    dateFilter = {
      createdAt: {
        $gte: new Date(
          startD.getFullYear(),
          startD.getMonth(),
          startD.getDate(),
          0,
          0,
          0,
          0,
        ),
        $lte: new Date(
          endD.getFullYear(),
          endD.getMonth(),
          endD.getDate(),
          23,
          59,
          59,
          999,
        ),
      },
    };
  } else if (period === "today") {
    const d = new Date();
    dateFilter = {
      createdAt: {
        $gte: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
        $lte: new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          23,
          59,
          59,
          999,
        ),
      },
    };
  } else if (period === "month") {
    const d = new Date();
    dateFilter = {
      createdAt: {
        $gte: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0),
        $lte: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      },
    };
  }

  // Aggregation pipeline: $lookup only the category field from Item — no full populate
  const topCategories = await Sale.aggregate([
    { $match: { tenantId, ...dateFilter } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "items",
        localField: "items.item",
        foreignField: "_id",
        pipeline: [{ $project: { category: 1 } }],
        as: "itemDoc",
      },
    },
    {
      $set: {
        category: {
          $ifNull: [
            { $arrayElemAt: ["$itemDoc.category", 0] },
            "Uncategorized",
          ],
        },
      },
    },
    {
      $group: {
        _id: "$category",
        totalQty: { $sum: "$items.qty" },
        totalAmount: { $sum: { $toDouble: "$items.lineTotal" } },
        invoiceCount: { $addToSet: "$_id" },
      },
    },
    {
      $project: {
        category: "$_id",
        totalQty: 1,
        totalAmount: { $round: ["$totalAmount", 2] },
        invoiceCount: { $size: "$invoiceCount" },
      },
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 },
  ]);

  res.json({ topCategories, period });
};

// ==========================================
// 7. PROFIT CARDS
// ==========================================
export const getProfitMetrics = async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { startDate, endDate } = req.query;

  let todayStart, todayEnd, monthStart, monthEnd;

  if (startDate && endDate) {
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    todayStart = new Date(
      startD.getFullYear(),
      startD.getMonth(),
      startD.getDate(),
      0,
      0,
      0,
      0,
    );
    todayEnd = new Date(
      endD.getFullYear(),
      endD.getMonth(),
      endD.getDate(),
      23,
      59,
      59,
      999,
    );
    const today = new Date();
    monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  } else {
    const today = new Date();
    todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0,
    );
    todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );
    monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  }

  const [
    todaySales,
    monthSales,
    todayExpenses,
    monthExpenses,
    [todayReturnAgg],
    [monthReturnAgg],
  ] = await Promise.all([
    Sale.find({ tenantId, createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Sale.find({ tenantId, createdAt: { $gte: monthStart, $lte: monthEnd } }),
    Expense.find({ tenantId, date: { $gte: todayStart, $lte: todayEnd } }),
    Expense.find({ tenantId, date: { $gte: monthStart, $lte: monthEnd } }),
    Return.aggregate([
      { $match: { tenantId, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      {
        $group: {
          _id: null,
          profitDeducted: { $sum: { $toDouble: "$profitDeducted" } },
        },
      },
    ]),
    Return.aggregate([
      { $match: { tenantId, createdAt: { $gte: monthStart, $lte: monthEnd } } },
      {
        $group: {
          _id: null,
          profitDeducted: { $sum: { $toDouble: "$profitDeducted" } },
        },
      },
    ]),
  ]);

  const calculateProfit = (sales, expenses, returnProfitDeducted = 0) => {
    let totalRevenue = 0;
    let totalCost = 0;

    sales.forEach((sale) => {
      totalRevenue += sale.grandTotal;
      sale.items.forEach((item) => {
        totalCost += item.qty * (item.costPrice || 0);
      });
    });

    const grossProfit = totalRevenue - totalCost - returnProfitDeducted;
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitPerInvoice:
        sales.length > 0
          ? Math.round(
              ((totalRevenue - totalCost - returnProfitDeducted) /
                sales.length) *
                100,
            ) / 100
          : 0,
      invoiceCount: sales.length,
    };
  };

  res.json({
    today: calculateProfit(
      todaySales,
      todayExpenses,
      todayReturnAgg?.profitDeducted ?? 0,
    ),
    month: calculateProfit(
      monthSales,
      monthExpenses,
      monthReturnAgg?.profitDeducted ?? 0,
    ),
  });
};

// ==========================================
// EXPENSES SUMMARY
// ==========================================
export const getExpensesSummary = async (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return res.status(403).json({ message: "Tenant context missing" });
  }
  const { startDate, endDate } = req.query;

  let expenseStart, expenseEnd;

  if (startDate && endDate) {
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    expenseStart = new Date(
      startD.getFullYear(),
      startD.getMonth(),
      startD.getDate(),
      0,
      0,
      0,
      0,
    );
    expenseEnd = new Date(
      endD.getFullYear(),
      endD.getMonth(),
      endD.getDate(),
      23,
      59,
      59,
      999,
    );
  } else {
    const today = new Date();
    expenseStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0,
    );
    expenseEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );
  }

  const expenses = await Expense.find({
    tenantId,
    date: { $gte: expenseStart, $lte: expenseEnd },
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const expensesByCategory = {};
  expenses.forEach((exp) => {
    if (!expensesByCategory[exp.category]) {
      expensesByCategory[exp.category] = 0;
    }
    expensesByCategory[exp.category] += exp.amount;
  });

  const categoryBreakdown = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  res.json({
    startDate: expenseStart,
    endDate: expenseEnd,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    expenseCount: expenses.length,
    categoryBreakdown,
    expenses,
  });
};

// ==========================================
// COMBINED DASHBOARD SUMMARY
// ==========================================
export const getDashboardSummary = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ message: "Tenant context missing" });
    }
    const { date, startDate, endDate } = req.query;

    let start, end;

    if (startDate && endDate) {
      const startD = new Date(startDate);
      const endD = new Date(endDate);
      start = new Date(
        startD.getFullYear(),
        startD.getMonth(),
        startD.getDate(),
        0,
        0,
        0,
        0,
      );
      end = new Date(
        endD.getFullYear(),
        endD.getMonth(),
        endD.getDate(),
        23,
        59,
        59,
        999,
      );
    } else {
      const d = date ? new Date(date) : new Date();
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      end = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
        999,
      );
    }

    // 1. Daily Sales
    const [todaySales, [refundAgg]] = await Promise.all([
      Sale.find({ tenantId, createdAt: { $gte: start, $lte: end } }),
      Return.aggregate([
        { $match: { tenantId, createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: "$totalRefund" } },
            profitDeducted: { $sum: { $toDouble: "$profitDeducted" } },
          },
        },
      ]),
    ]);

    const invoiceCount = todaySales.length;
    const totalRefunds = refundAgg?.total ?? 0;
    const returnProfitDeducted = refundAgg?.profitDeducted ?? 0;
    const totalSalesAmount =
      todaySales.reduce((sum, s) => sum + s.grandTotal, 0) - totalRefunds;
    const totalVAT = todaySales.reduce((sum, s) => sum + (s.taxTotal || 0), 0);
    const totalCost = todaySales.reduce((sum, s) => {
      return (
        sum +
        s.items.reduce(
          (itemSum, item) => itemSum + item.qty * (item.costPrice || 0),
          0,
        )
      );
    }, 0);
    const grossProfit =
      totalSalesAmount + totalRefunds - totalCost - returnProfitDeducted;

    const paymentBreakdown = { cash: 0, card: 0, credit: 0, bank: 0 };
    todaySales.forEach((sale) => {
      sale.payments.forEach((payment) => {
        if (paymentBreakdown.hasOwnProperty(payment.method)) {
          paymentBreakdown[payment.method] += payment.amount;
        }
      });
    });

    // 2. Low Stock Items
    const items = await Item.find({ tenantId, isActive: true });
    const lowStockItems = items
      .filter((item) => item.currentStock <= item.lowStockLevel)
      .map((item) => ({
        _id: item._id,
        name: item.name,
        sku: item.sku,
        currentStock: item.currentStock,
        lowStockLevel: item.lowStockLevel,
        status:
          item.currentStock <= 0
            ? "red"
            : item.currentStock <= item.lowStockLevel * 0.5
              ? "red"
              : "orange",
      }))
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 5);

    // 3. Outstanding Credits
    const customers = await Customer.find({ tenantId });
    const totalCredit = customers.reduce((sum, c) => sum + c.currentBalance, 0);
    const topCreditCustomers = customers
      .filter((c) => c.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, 3)
      .map((c) => ({
        _id: c._id,
        name: c.name,
        balance: c.currentBalance,
        limit: c.creditLimit,
      }));

    // 4. Supplier Payables
    const unpaidPurchases = await Purchase.find({
      tenantId,
      status: { $ne: "paid" },
    }).populate("supplier");

    const totalPayables = unpaidPurchases.reduce(
      (sum, p) => sum + p.balanceDue,
      0,
    );

    res.json({
      dailySalesOverview: {
        date: start,
        invoiceCount,
        totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        totalVAT: Math.round(totalVAT * 100) / 100,
        paymentBreakdown,
      },
      lowStockItems,
      outstandingCredits: {
        totalCredit: Math.round(totalCredit * 100) / 100,
        topCustomers: topCreditCustomers,
      },
      supplierPayables: {
        totalPayables: Math.round(totalPayables * 100) / 100,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
