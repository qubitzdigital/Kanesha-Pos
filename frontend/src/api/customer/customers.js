// All functions now accept api as the first argument
export const fetchCustomers = async (api, query = "") => {
  const { data } = await api.get("/customers", { params: { q: query } });
  return data || [];
};

export const loadCustomers = async (api) => {
  const { data } = await api.get("/customers");
  return data || [];
};

export const createCustomer = async (api, payload) => {
  const { data } = await api.post("/customers", payload);
  return data;
};

export const updateCustomer = async (api, id, payload) => {
  const { data } = await api.put(`/customers/${id}`, payload);
  return data;
};

export const deleteCustomer = async (api, id) => api.delete(`/customers/${id}`);

export const receivePayment = async (api, id, payload) =>
  api.post(`/customers/${id}/receive-payment`, payload);

export const fetchPayments = async (api, id) => {
  const { data } = await api.get(`/customers/${id}/payments`);
  return data || [];
};
