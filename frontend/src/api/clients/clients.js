// Super Admin — client (tenant) management API calls
// All functions accept `api` (the axios client) as the first argument

export const createClient = async (api, payload) => {
  const { data } = await api.post("/clients", payload);
  return data?.client || data;
};

export const getClients = async (api) => {
  const { data } = await api.get("/clients");
  return data || [];
};

export const setClientStatus = async (api, tenantId, isActive) => {
  const { data } = await api.put(`/clients/${tenantId}/status`, {
    isActive,
  });
  return data?.owner || data;
};
