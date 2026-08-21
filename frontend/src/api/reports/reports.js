// All functions now accept api as the first argument
export const getDailySalesReport = async (api) => {
  const { data } = await api.get("/reports/sales-daily");
  return data;
};

export const getInventoryValue = async (api) => {
  const { data } = await api.get("/reports/inventory-value");
  return data;
};

export const getProfitReport = async (api) => {
  const { data } = await api.get("/reports/profit");
  return data;
};

export const getCustomerCreditReport = async (api) => {
  const { data } = await api.get("/reports/customer-credit");
  return data || [];
};

export const getLowStockItems = async (api) => {
  const { data } = await api.get("/items", { params: { lowStock: "true" } });
  return data || [];
};
