/** DTO: shape the barcode preview response */
export const toBarcodePreviewDto = (item) => ({
  _id: item._id,
  name: item.name,
  sku: item.sku,
  barcode: item.barcode || item.sku,
  sellingPrice: item.sellingPrice,
  baseUnit: item.baseUnit,
});
