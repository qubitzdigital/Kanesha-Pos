import { useNavigate } from "react-router-dom";

export default function BarcodeActions({ item, onPreview }) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2">
      <button
        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 cursor-pointer"
        onClick={() => onPreview(item)}
      >
        👁️ Preview
      </button>

      <button
        className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 cursor-pointer"
        onClick={() => navigate(`/barcode/${item._id}`)}
      >
        🖨️ Print
      </button>
    </div>
  );
}
