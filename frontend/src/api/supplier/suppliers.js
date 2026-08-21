// All functions now accept api as the first argument
export const getSuppliers = async (api, query) => {
  const params = query ? { q: query } : {};
  const { data } = await api.get("/suppliers", { params });
  return data || [];
};

export const createSupplier = async (api, payload) => {
  const { data } = await api.post("/suppliers", {
    ...payload,
    currentBalance: payload.openingBalance,
  });
  return data;
};

export const updateSupplier = async (api, id, payload) => {
  const { data } = await api.put(`/suppliers/${id}`, payload);
  return data;
};

export const deleteSupplier = async (api, id) => {
  await api.delete(`/suppliers/${id}`);
};

export const recordSupplierPayment = async (api, id, amount) => {
  const { data } = await api.post(`/suppliers/${id}/pay`, { amount });
  return data?.supplier || data;
};

export const getCategoriesAndUnits = async (api, defaultUnits = []) => {
  const [catRes, unitRes] = await Promise.allSettled([
    api.get("/items/categories/list"),
    api.get("/items/units/list"),
  ]);

  const categories =
    catRes.status === "fulfilled" ? catRes.value.data || [] : [];
  const fetchedUnits =
    unitRes.status === "fulfilled" ? unitRes.value.data || [] : [];

  const baseUnits = Array.from(
    new Set([...(defaultUnits || []), ...fetchedUnits]),
  );
  return { categories, baseUnits };
};
