import React, { useEffect, useMemo, useRef, useState } from "react";
import AppLoader from "../components/common/AppLoader";
import { useParams } from "react-router-dom";
import Barcode from "react-barcode";
import { getItem } from "../api/inventory/items";
import { loadCurrencySettings } from "../api/settings/settings";
import { formatCurrency } from "../utils/currency";

const ROW_WIDTH_MM = 105;
const ROW_HEIGHT_MM = 22;
const LABEL_WIDTH_MM = 35; // label length — widened from 30mm so barcode
// modules have enough physical room to stay above the ~0.33mm minimum bar
// width most scanners need. At 30mm, a typical CODE128 value (10-13+ chars)
// got compressed so tightly that adjacent bars merged together when
// printed, which is what was breaking scans even though the label looked
// fine on screen.
const LABEL_HEIGHT_MM = 22; // label width
const LABELS_PER_ROW = 3;

// PNG export resolution. 96dpi (screen) is far too coarse for a barcode this
// small — bars end up sub-pixel and merge together, which is exactly what
// breaks scanning after printing or zooming in. Export at a real print
// resolution instead so the bars stay crisp and distinct.
const EXPORT_DPI = 300;
const EXPORT_MM_TO_PX = EXPORT_DPI / 25.4; // px per mm at export resolution
const EXPORT_SCALE = EXPORT_DPI / 96; // scale factor vs. the old 96dpi math

const BarcodePrintPage = ({ api }) => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");
  const [quantity, setQuantity] = useState(3); // how many labels to print
  const barcodeRef = useRef(null); // ref to the first rendered barcode (used for PNG export)

  useEffect(() => {
    const load = async () => {
      const [data, cs] = await Promise.all([
        getItem(api, id),
        loadCurrencySettings(api),
      ]);
      setItem(data);
      setCurrencySymbol(cs.currencySymbol);
      setCurrencyPosition(cs.currencyPosition);
    };
    load();
  }, [api, id]);

  // Split `quantity` identical labels into rows of 3 for the 110mm strip.
  // IMPORTANT: this hook must run on every render, in the same order, so it
  // has to stay above the `if (!item) return ...` guard below. Calling a
  // hook only after data has loaded (i.e. conditionally) changes the number
  // of hooks React sees between renders and throws "Rendered fewer hooks
  // than expected" (React error #310).
  const rows = useMemo(() => {
    const safeQty = Math.max(1, Math.min(300, Number(quantity) || 1));
    const totalRows = Math.ceil(safeQty / LABELS_PER_ROW);
    return Array.from({ length: totalRows }, (_, rowIdx) => {
      const remaining = safeQty - rowIdx * LABELS_PER_ROW;
      return Math.min(LABELS_PER_ROW, remaining);
    });
  }, [quantity]);

  if (!item) {
    return (
      <div className="flex justify-center items-center py-6">
        <AppLoader
          open
          variant="inline"
          title="Loading barcode"
          subtitle="Preparing barcode preview"
        />
      </div>
    );
  }

  // ── Barcode field ONLY — no SKU / _id fallback ──
  const barcodeValue = item.barcode?.trim() || "";
  const hasBarcode = barcodeValue.length > 0;

  const priceLabel = formatCurrency(
    item.sellingPrice,
    currencySymbol,
    currencyPosition,
  );

  const handlePrint = () => {
    if (!hasBarcode) return;
    window.print();
  };

  /**
   * Downloads a single label (30mm × 22mm) as a high-resolution PNG — handy
   * for label-printer software that accepts an image instead of driving the
   * browser print dialog directly.
   *
   * Exported at EXPORT_DPI (not the screen's 96dpi) and the barcode's own
   * SVG is re-rasterized at a much higher native pixel size before being
   * drawn onto the canvas, so bars stay crisp instead of a blurry upscale.
   */
  const handleDownload = () => {
    if (!hasBarcode) return;

    const svgEl = barcodeRef.current?.querySelector("svg");
    if (!svgEl) return;

    const pxW = Math.round(LABEL_WIDTH_MM * EXPORT_MM_TO_PX);
    const pxH = Math.round(LABEL_HEIGHT_MM * EXPORT_MM_TO_PX);

    const PADDING = Math.round(4 * EXPORT_SCALE);
    const TEXT_LINE = Math.round(11 * EXPORT_SCALE); // px per text row
    const BARCODE_H = Math.round(pxH * 0.42);

    // Clone the barcode SVG and bump its own width/height attributes way up
    // (keeping the viewBox unchanged). This makes the browser rasterize it
    // at a high native pixel size — a true higher-resolution render, not a
    // blurry stretch of a tiny bitmap — so the bars stay sharp when scaled
    // (and when the resulting PNG is zoomed in on later).
    const clone = svgEl.cloneNode(true);
    const origW =
      parseFloat(svgEl.getAttribute("width")) || svgEl.width.baseVal.value;
    const origH =
      parseFloat(svgEl.getAttribute("height")) || svgEl.height.baseVal.value;
    const hiResFactor = Math.max(4, Math.ceil((BARCODE_H * 2) / origH));
    clone.setAttribute("width", origW * hiResFactor);
    clone.setAttribute("height", origH * hiResFactor);

    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const svgImg = new Image();

    svgImg.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pxW;
      canvas.height = pxH;
      const ctx = canvas.getContext("2d");
      // Keep bar edges crisp — smoothing would blend adjacent bars together,
      // which is exactly what makes a scanner unable to tell them apart.
      ctx.imageSmoothingEnabled = false;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pxW, pxH);

      // ── 1. Item Name ──
      ctx.fillStyle = "#111111";
      ctx.font = `bold ${TEXT_LINE - Math.round(2 * EXPORT_SCALE)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const nameY = PADDING;
      ctx.fillText(item.sku, pxW / 2, nameY, pxW - PADDING * 2);

      // ── 2. Barcode SVG image ──
      const barcodeY = nameY + TEXT_LINE + Math.round(1 * EXPORT_SCALE);
      const barcodeDrawW = pxW - PADDING * 2;
      const scale = Math.min(
        barcodeDrawW / svgImg.width,
        BARCODE_H / svgImg.height,
      );
      const dw = Math.round(svgImg.width * scale);
      const dh = Math.round(svgImg.height * scale);
      const dx = Math.round((pxW - dw) / 2);
      ctx.drawImage(svgImg, dx, Math.round(barcodeY), dw, dh);
      URL.revokeObjectURL(svgUrl);

      // ── 3. Barcode Number ──
      const numY = barcodeY + dh + Math.round(1 * EXPORT_SCALE);
      ctx.font = `${TEXT_LINE - Math.round(3 * EXPORT_SCALE)}px monospace`;
      ctx.fillStyle = "#333333";
      ctx.fillText(barcodeValue, pxW / 2, numY, pxW - PADDING * 2);

      // ── 4. Selling Price ──
      const priceY = numY + TEXT_LINE - Math.round(1 * EXPORT_SCALE);
      ctx.font = `bold ${TEXT_LINE - Math.round(1 * EXPORT_SCALE)}px sans-serif`;
      ctx.fillStyle = "#1B5E20";
      ctx.fillText(priceLabel, pxW / 2, priceY, pxW - PADDING * 2);

      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `barcode-${barcodeValue}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };

    svgImg.src = svgUrl;
  };

  return (
    <div className="flex flex-col items-center py-10 px-4 min-h-screen bg-gray-50 print:min-h-0 print:bg-white print:py-0 print:px-0">
      {/* Page size is scoped to this route only — removed automatically
          when the user navigates away, so it never affects other prints
          (e.g. the A4 / thermal invoice pages). */}
      <style>{`
        @page {
          size: ${ROW_WIDTH_MM}mm ${ROW_HEIGHT_MM}mm;
          margin: 0;
        }
        @media print {
          .barcode-print-row {
            break-after: page;
            page-break-after: always;
          }
          .barcode-print-row:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md space-y-6 print:shadow-none print:rounded-none print:p-0 print:max-w-none print:w-auto">
        <h1 className="text-lg font-semibold text-gray-800 text-center print:hidden">
          Barcode Print — {LABEL_WIDTH_MM}mm × {LABEL_HEIGHT_MM}mm (
          {LABELS_PER_ROW}-up on {ROW_WIDTH_MM}mm)
        </h1>

        {hasBarcode ? (
          <>
            {/* ── Quantity control (screen only) ── */}
            <div className="flex items-center justify-center gap-3 print:hidden">
              <label className="text-sm font-medium text-gray-700">
                Number of labels
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-xs text-gray-500">
                {rows.length} row{rows.length !== 1 ? "s" : ""} of{" "}
                {LABELS_PER_ROW}
              </span>
            </div>

            {/* ── Print sheet: exact physical size, rows of 3 labels ── */}
            <div
              id="barcode-print-sheet"
              className="mx-auto flex flex-col items-center gap-2 print:gap-0 print:items-start"
            >
              {rows.map((labelsInRow, rowIdx) => (
                <div
                  key={rowIdx}
                  className="barcode-print-row flex border border-dashed border-gray-300 print:border-0"
                  style={{
                    width: `${ROW_WIDTH_MM}mm`,
                    height: `${ROW_HEIGHT_MM}mm`,
                  }}
                >
                  {Array.from({ length: LABELS_PER_ROW }).map((_, colIdx) => {
                    const isFilled = colIdx < labelsInRow;
                    return (
                      <div
                        key={colIdx}
                        className="flex-1 flex items-center justify-center"
                      >
                        {isFilled ? (
                          <div
                            ref={
                              rowIdx === 0 && colIdx === 0 ? barcodeRef : null
                            }
                            className="flex flex-col items-stretch justify-center box-border border border-dashed border-gray-200 print:border-0"
                            style={{
                              width: `${LABEL_WIDTH_MM}mm`,
                              height: `${LABEL_HEIGHT_MM}mm`,
                              padding: "1mm",
                            }}
                          >
                            <p
                              className="w-full truncate text-center font-semibold leading-tight text-gray-900"
                              style={{ fontSize: "2.3mm" }}
                            >
                              {item.sku}
                            </p>
                            {/*
                              The barcode SVG has its own intrinsic pixel
                              size (based on how many bars the value needs),
                              which is usually much WIDER than this 30mm
                              label. Forcing it to w-full/h-auto lets the
                              browser scale it down using the SVG's viewBox
                              (lossless, vector scaling) so every bar stays
                              visible and proportionally correct — instead
                              of the old fixed-size render getting silently
                              cropped by overflow-hidden, which is what was
                              breaking scans after printing.
                            */}
                            <div className="w-full flex justify-center">
                              {/*
                                margin adds the blank "quiet zone" required on
                                both sides of a barcode — every scanner relies
                                on that blank space to detect where the
                                barcode starts/ends. It was previously 0,
                                which reliably breaks scanning even on a
                                perfectly printed barcode. height is bumped
                                up slightly too, for more tolerance when
                                scanning at a slight angle.
                              */}
                              <Barcode
                                value={barcodeValue}
                                height={38}
                                width={2}
                                margin={8}
                                fontSize={8}
                                displayValue={false}
                                className="block w-full h-auto"
                              />
                            </div>
                            <p
                              className="font-mono text-center leading-tight text-gray-700"
                              style={{ fontSize: "2mm" }}
                            >
                              {barcodeValue}
                            </p>
                            <p
                              className="font-semibold text-center leading-tight"
                              style={{ fontSize: "2.3mm", color: "#1B5E20" }}
                            >
                              {priceLabel}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* ── Actions (screen only) ── */}
            <div className="flex gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                🖨️ Print
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                ⬇️ Download PNG
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-red-200 rounded-xl p-6 bg-red-50 text-center gap-2 print:hidden">
            <span className="text-3xl">🚫</span>
            <p className="text-sm font-semibold text-red-600">
              Barcode not available
            </p>
            <p className="text-xs text-red-400">
              This item does not have a barcode assigned. Please add a barcode
              in Inventory before printing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodePrintPage;
