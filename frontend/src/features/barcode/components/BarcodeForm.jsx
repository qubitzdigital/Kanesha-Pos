import { useState, useEffect } from "react";
import { BARCODE_TYPES } from "../constants/barcodeConstants";
import { generateBarcodeImage, checkBarcodeUnique } from "../api/barcodeApi";
import BarcodeScannerModal from "./BarcodeScannerModal";

// Generates a unique barcode string value (UI only – image is produced by backend)
const generateBarcodeValue = (input) => {
  const base = input.trim().toUpperCase().replace(/\s+/g, "-");
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `${base}-${suffix}`;
};

export default function BarcodeForm({ api, formData, setFormData, excludeId }) {
  const [barcodeInput, setBarcodeInput] = useState(formData.barcode || "");
  const [previewImg, setPreviewImg] = useState("");
  const [imgLoading, setImgLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const isCompany = formData.barcodeType === "COMPANY";
  const isGenerate = formData.barcodeType === "GENERATE";

  // Re-sync when the parent passes an existing barcode (edit mode)
  useEffect(() => {
    setBarcodeInput(formData.barcode || "");
    setDuplicateError("");
    if (formData.barcode) fetchImage(formData.barcode);
    else setPreviewImg("");
  }, [formData.barcode]);

  const fetchImage = async (value) => {
    if (!value || !api) return;
    setImgLoading(true);
    try {
      const img = await generateBarcodeImage(api, value);
      setPreviewImg(img);
    } catch {
      setPreviewImg("");
    } finally {
      setImgLoading(false);
    }
  };

  const handleTypeChange = (val) => {
    setBarcodeInput("");
    setPreviewImg("");
    setDuplicateError("");
    setFormData({ ...formData, barcodeType: val, barcode: "" });
  };

  // Checks uniqueness then commits; returns false if duplicate
  const commitValue = async (trimmed) => {
    if (!trimmed) {
      setBarcodeInput("");
      setPreviewImg("");
      setDuplicateError("");
      setFormData({ ...formData, barcode: "" });
      return;
    }
    try {
      const result = await checkBarcodeUnique(api, trimmed, excludeId);
      if (!result.available) {
        setDuplicateError(result.message || "Barcode is already in use");
        setBarcodeInput(trimmed);
        setPreviewImg("");
        // Do NOT propagate the duplicate value to the parent form
        setFormData({ ...formData, barcode: "" });
        return;
      }
    } catch {
      // If the check fails (network error), allow proceeding — backend will catch it on save
    }
    setDuplicateError("");
    setBarcodeInput(trimmed);
    setFormData({ ...formData, barcode: trimmed });
    fetchImage(trimmed);
  };

  // Company path: commit on blur or Enter
  const commitScan = (val) => commitValue(val.trim());

  // Called by BarcodeScannerModal once the camera successfully decodes a barcode
  const handleScanned = (value) => {
    setShowScanner(false);
    const trimmed = (value || "").trim();
    if (!trimmed) return;
    setBarcodeInput(trimmed);
    commitValue(trimmed);
  };

  // Generate path: always produce a fresh code from a fixed base.
  // NOTE: do NOT seed from `barcodeInput` here — in GENERATE mode that field
  // holds the *previously generated* value, so re-using it as the seed made
  // each click append another suffix onto the last one (ITEM-123-456-789...).
  const handleGenerate = () => {
    const generated = generateBarcodeValue("ITEM");
    setBarcodeInput(generated);
    commitValue(generated);
  };

  const barcodeTypeLabel =
    BARCODE_TYPES.find((t) => t.value === formData.barcodeType)?.label ?? "";

  return (
    <div className="border-t border-gray-200 pt-6 space-y-5">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
        Barcode Setup
      </h3>

      {/* Step 1 – Type selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Barcode Type
        </label>
        <div className="flex flex-wrap gap-3">
          {BARCODE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => handleTypeChange(t.value)}
              className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                formData.barcodeType === t.value
                  ? "border-primary bg-primary text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 – Barcode input (editable in COMPANY mode, disabled + auto-filled in GENERATE mode) */}
      {(isCompany || isGenerate) && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {isGenerate ? "Generated Barcode" : "Enter Barcode"}
          </label>
          <div className="flex gap-2">
            <input
              className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
                duplicateError
                  ? "border-red-400 bg-red-50"
                  : isGenerate
                    ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "border-gray-300"
              }`}
              placeholder={
                isGenerate
                  ? 'Click "Generate Barcode" to auto-fill'
                  : "Type or scan barcode value"
              }
              value={barcodeInput}
              disabled={isGenerate}
              onChange={(e) => {
                setBarcodeInput(e.target.value);
                setDuplicateError("");
              }}
              onBlur={(e) => isCompany && commitScan(e.target.value)}
              onKeyDown={(e) =>
                isCompany && e.key === "Enter" && commitScan(barcodeInput)
              }
            />
            {isCompany && (
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                title="Scan using device camera"
                className="px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer whitespace-nowrap"
              >
                📷 Scan Barcode
              </button>
            )}
            {isGenerate && (
              <button
                type="button"
                onClick={handleGenerate}
                className="px-4 py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: "#1B5E20" }}
              >
                Generate Barcode
              </button>
            )}
          </div>
          {duplicateError && (
            <p className="text-xs text-red-600 mt-1">{duplicateError}</p>
          )}
        </div>
      )}

      {/* Step 3 – Preview card (shown after a value is committed) */}
      {barcodeInput && (
        <>
          <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Barcode Type
                </p>
                <p className="mt-0.5 font-medium text-gray-900">
                  {barcodeTypeLabel}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Barcode Number
                </p>
                <p className="mt-0.5 font-medium text-gray-900 break-all">
                  {barcodeInput}
                </p>
              </div>
            </div>

            {/* Barcode image – generated by backend via bwip-js (Code128 PNG) */}
            <div className="flex flex-col items-center py-3 bg-white rounded-lg border border-gray-200">
              {imgLoading ? (
                <p className="text-xs text-gray-400 py-4">Generating…</p>
              ) : previewImg ? (
                <img
                  src={previewImg}
                  alt="barcode preview"
                  className="h-16 object-contain"
                />
              ) : (
                <p className="text-xs text-gray-400 py-4">
                  Preview unavailable
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500 tracking-widest font-mono">
                {barcodeInput}
              </p>
            </div>
          </div>
        </>
      )}

      {showScanner && (
        <BarcodeScannerModal
          onScan={handleScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
