import Barcode from "react-barcode";

export default function BarcodePreviewModal({ item, onClose }) {
  if (!item) return null;

  const value = item.barcode || item.sku || item._id;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-xl w-[340px] shadow-xl space-y-3">
        <h2 className="font-bold text-gray-900">Barcode Preview</h2>

        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-medium">{item.sku}</p>
          {item.sellingPrice != null && (
            <p className="text-gray-500">Rs. {item.sellingPrice}</p>
          )}
        </div>

        <div className="flex justify-center py-2 border rounded-lg bg-gray-50">
          <Barcode value={String(value)} height={50} width={1.5} displayValue />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer"
            onClick={() => window.print()}
          >
            🖨️ Print
          </button>
          <button
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
