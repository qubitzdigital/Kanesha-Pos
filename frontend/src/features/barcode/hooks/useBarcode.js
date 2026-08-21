import { useState } from "react";

export default function useBarcode() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const openPreview = (item) => {
    if (!item) return;
    // Use barcode or fall back to SKU so the preview always has a scannable value
    setSelectedItem({
      ...item,
      barcodeImage: `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
        item.barcode || item.sku || item._id
      )}&code=Code128`,
    });
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setSelectedItem(null);
  };

  return { selectedItem, previewOpen, openPreview, closePreview };
}
