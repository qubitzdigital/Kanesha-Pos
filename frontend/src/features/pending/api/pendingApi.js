/**
 * Pending sales feature API calls.
 * `api` is the axios instance passed via props.
 */

export const getPendingSales = (api) =>
  api.get("/sales/pending").then((r) => r.data);

export const deletePendingSale = (api, id) =>
  api.delete(`/sales/pending/${id}`).then((r) => r.data);
