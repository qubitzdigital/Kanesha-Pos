// All functions accept `api` (the shared axios instance from client.js)

export const getBarcodePreview = (api, itemId) =>
  api.get(`/barcode/preview/${itemId}`).then((r) => r.data);

export const saveBarcode = (api, itemId, barcode) =>
  api.patch(`/barcode/${itemId}`, { barcode }).then((r) => r.data);

export const searchItemByBarcode = (api, barcode) =>
  api.get(`/items/barcode/${encodeURIComponent(barcode)}`).then((r) => r.data);

/** POST /api/barcode/generate-image → { image: "data:image/png;base64,..." } */
export const generateBarcodeImage = (api, value) =>
  api.post("/barcode/generate-image", { value }).then((r) => r.data.image);

/** GET /api/barcode/check?value=&excludeId= → { available: boolean, message?: string } */
export const checkBarcodeUnique = (api, value, excludeId) => {
  const params = { value };
  if (excludeId) params.excludeId = excludeId;
  return api.get("/barcode/check", { params }).then((r) => r.data);
};
