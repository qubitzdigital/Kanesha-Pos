/**
 * Return feature API calls.
 * `api` is the axios instance from createApiClient (passed via ReturnPage props).
 */

export const searchProduct = (api, query, type = "barcode") =>
  api
    .get("/returns/search", { params: { q: query, type } })
    .then((r) => r.data);

export const createReturn = (api, payload) =>
  api.post("/returns", payload).then((r) => r.data);

export const createExchange = (api, payload) =>
  api.post("/returns/exchange", payload).then((r) => r.data);
