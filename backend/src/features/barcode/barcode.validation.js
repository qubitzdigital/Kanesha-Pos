export const validateBarcodeBody = (body = {}) => {
  const { barcode } = body;
  if (typeof barcode !== "string" || !barcode.trim()) return "barcode is required";
  if (barcode.trim().length > 64) return "Barcode must be 64 characters or less";
  return null;
};
