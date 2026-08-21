// All functions now accept api as the first argument
export const createOwner = async (api, payload) => {
  const { data } = await api.post("/users/owner-signup", payload);
  return data?.user || data;
};

export const createStaff = async (api, payload) => {
  const { data } = await api.post("/users/staff", payload);
  return data?.user || data;
};

export const getUsers = async (api) => {
  const { data } = await api.get("/users");
  return data || [];
};

export const updateStaff = async (api, userId, payload) => {
  const { data } = await api.put(`/users/${userId}`, payload);
  return data?.user || data;
};

export const deleteStaff = async (api, userId) => {
  const { data } = await api.delete(`/users/${userId}`);
  return data;
};
