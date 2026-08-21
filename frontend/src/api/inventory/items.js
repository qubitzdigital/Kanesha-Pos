// All functions now accept api as the first argument
const fetchItems = async (api, params = {}) => {
  const { data } = await api.get("/items", { params });
  return data || [];
};

export const loadItems = async (api, query, lowStock) =>
  fetchItems(api, {
    q: query || undefined,
    lowStock: lowStock || undefined,
  });

export const loadActiveItems = async (api) =>
  fetchItems(api, { isActive: true });

export const fetchItemsForGrn = async (api, limit = 999) =>
  fetchItems(api, { limit });

export const deleteItem = async (api, id) => {
  const { data } = await api.delete(`/items/${id}`);
  return data;
};

export const createItem = async (api, payload) => {
  const { data } = await api.post("/items", payload);
  return data;
};

export const updateItem = async (api, id, payload) => {
  const { data } = await api.put(`/items/${id}`, payload);
  return data;
};

export const activateItem = async (api, id) => {
  const { data } = await api.patch(`/items/${id}/activate`);
  return data;
};

export const deactivateItem = async (api, id) => {
  const { data } = await api.patch(`/items/${id}/deactivate`);
  return data;
};

export const loadItemCategories = async (api) => {
  const { data } = await api.get("/items/categories/list");
  return data || [];
};

export const searchItemByBarcode = async (api, barcode) => {
  const { data } = await api.get(
    `/items/barcode/${encodeURIComponent(barcode)}`,
  );
  return data;
};

export const getItemBatches = async (api, itemId) => {
  const { data } = await api.get(`/items/${itemId}/batches`);
  return data;
};

// Manual "Edit Stock" — sets an ABSOLUTE new quantity (not a delta).
// payload: { qty, batchId?, size?, note? }
export const setItemStock = async (api, itemId, payload) => {
  const { data } = await api.patch(`/items/${itemId}/stock`, payload);
  return data;
};

export const getItem = async (api, id) => {
  const { data } = await api.get(`/items/${id}`);
  return data;
};
