export const formatBarcodeLabel = (item) => {
  return {
    title: item.sku,
    sku: item.sku,
    price: item.sellingPrice,
    barcode: item.barcode,
  };
};
