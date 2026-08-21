// All functions now accept api as the first argument
export const createPurchase = async (api, payload) => {
  const { data } = await api.post("/purchases", payload);
  return data;
};
