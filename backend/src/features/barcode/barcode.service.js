import { Item } from "../../models/Item.js";

export const findItemForBarcode = (id, tenantId) =>
  Item.findOne({ _id: id, tenantId }).select("sku name barcode sellingPrice baseUnit");

export const updateItemBarcode = async (id, tenantId, barcode) => {
  const item = await Item.findOne({ _id: id, tenantId });
  if (!item) return null;
  item.barcode = barcode;
  await item.save();
  return item;
};
