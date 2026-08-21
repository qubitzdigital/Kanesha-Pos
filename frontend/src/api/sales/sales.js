// All functions now accept api as the first argument
export const saveSale = async (api, salePayload) => {
  const { data } = await api.post("/sales", salePayload);
  return data;
};

export const getSale = async (api, id) => {
  const { data } = await api.get(`/sales/${id}`);
  return data;
};

// Get sales with optional date range and limit
export const getSales = async (api, params = {}) => {
  const { data } = await api.get("/sales", { params });
  return data;
};

// Get past invoices (finalized sales) for the Invoices table view.
// params: { startDate, endDate, search, status, page, limit }
export const getInvoices = async (api, params = {}) => {
  const { data } = await api.get("/sales/invoices", { params });
  return data;
};

export const saveSaleOffline = (salePayload) => {
  const queue = JSON.parse(localStorage.getItem("offlineSales") || "[]");
  queue.push(salePayload);
  localStorage.setItem("offlineSales", JSON.stringify(queue));
};
