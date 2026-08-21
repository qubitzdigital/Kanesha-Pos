// All functions now accept api as the first argument
export const createGRN = async (api, payload) => {
  const { data } = await api.post("/grns", payload);
  return data;
};

export const getAllGRNs = async (api) => {
  const { data } = await api.get("/grns");
  return data;
};

export const getSupplierGRNs = async (api, supplierId) => {
  const { data } = await api.get(`/grns/supplier/${supplierId}`);
  return data;
};

export const getGRN = async (api, id) => {
  const { data } = await api.get(`/grns/${id}`);
  return data;
};

export const updateGRN = async (api, id, payload) => {
  const { data } = await api.put(`/grns/${id}`, payload);
  return data;
};

export const postGRN = async (api, id) => {
  const { data } = await api.post(`/grns/${id}/post`);
  return data;
};

export const deleteGRN = async (api, id) => {
  const { data } = await api.delete(`/grns/${id}`);
  return data;
};
