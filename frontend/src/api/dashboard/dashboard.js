// All functions now accept api as the first argument
export const getDashboardSummary = async (
  api,
  startDate = null,
  endDate = null,
) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/dashboard/summary", { params });
  return response.data;
};

export const getDailySalesOverview = async (
  api,
  startDate = null,
  endDate = null,
) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/dashboard/daily-sales", { params });
  return response.data;
};

export const getLowStockItems = async (api) => {
  const response = await api.get("/dashboard/low-stock");
  return response.data;
};

export const getOutstandingCredits = async (api) => {
  const response = await api.get("/dashboard/outstanding-credits");
  return response.data;
};

export const getSupplierPayables = async (api) => {
  const response = await api.get("/dashboard/supplier-payables");
  return response.data;
};

export const getMonthlySalesTrend = async (api, options = {}) => {
  const { months = 12, range = "months", days = 30 } = options;
  const params = { months, range };
  if (range === "days") params.days = days;

  const response = await api.get("/dashboard/monthly-trend", {
    params,
  });
  return response.data;
};

export const getTopCategories = async (
  api,
  period = "today",
  startDate = null,
  endDate = null,
) => {
  const params = { period };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/dashboard/top-categories", {
    params,
  });
  return response.data;
};

export const getProfitMetrics = async (
  api,
  startDate = null,
  endDate = null,
) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/dashboard/profit-metrics", {
    params,
  });
  return response.data;
};

export const getExpensesSummary = async (
  api,
  startDate = null,
  endDate = null,
) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get("/dashboard/expenses-summary", {
    params,
  });
  return response.data;
};
