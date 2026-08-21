import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import AppLoader from "../components/common/AppLoader";
import { useParams, useNavigate } from "react-router-dom";
import { getSale } from "../api/sales/sales";
import { getSettings } from "../api/settings/settings";
import { formatCurrency } from "../utils/currency";

const PAGE_WIDTH_MM = 80;

const InvoicePrintThermal = ({ api }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shop, setShop] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");

  // Whether the floating "Print Receipt" / "Done" buttons should be in the
  // DOM. `.no-print` (CSS `@media print { display: none }`) is NOT enough
  // on its own: several Android Bluetooth/Wi-Fi thermal-printer bridge
  // apps capture the page more literally and don't reliably honor
  // `@media print` for `position: fixed` elements (see the BareProtectedRoute
  // comment in App.jsx for the same issue with the app shell). Those two
  // buttons sit `fixed top-3`, directly over the top of the receipt, so on
  // a bridge that ignores the print stylesheet they get captured too —
  // eating the top of the roll before the actual bill content, which reads
  // as "the bill isn't printing from the top of the paper". Actually
  // removing them from the DOM (not just hiding via CSS) while a print is
  // in flight guarantees no capture method can include them.
  const [isPrinting, setIsPrinting] = useState(false);

  // Waits for the current isPrinting state to actually be reflected on
  // screen (two animation frames, same reasoning as the load effect below)
  // before invoking window.print(), so whatever captures the page — a real
  // print engine or a literal screenshot-style bridge — never sees the
  // buttons in the frame it captures.
  const printAfterHidingButtons = () => {
    // Some Android Bluetooth/Wi-Fi thermal-printer bridge apps capture the
    // page starting from the current scroll position rather than from the
    // very top of the document. If the page had scrolled at all before
    // print is triggered, that leftover scroll offset shows up as blank
    // feed at the start of the printed roll — exactly the "space at the
    // start of the bill" symptom. Resetting scroll to the top before
    // printing removes that as a possible cause.
    window.scrollTo(0, 0);
    setIsPrinting(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  // Measured height of the actual receipt content, converted to mm, so the
  // printed page is exactly as long as this bill — not a fixed length.
  const receiptRef = useRef(null);
  const [pageHeightMm, setPageHeightMm] = useState(null);
  // Direct handle to the <style> tag so the "beforeprint" safety net (below)
  // can patch the @page height synchronously, without waiting on a React
  // re-render.
  const styleRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let printTimer = null;

    // NOTE: we deliberately do NOT navigate away on the "afterprint" event.
    // On Android, window.print() just hands the job to the OS print system
    // and returns immediately — Chrome does not wait for the system print
    // dialog to actually finish. That means "afterprint" fires almost
    // instantly, often *before* the OS has finished generating the print
    // preview/output in the background. If we navigate (and reset the cart)
    // right then, the DOM changes out from under the still-in-progress
    // print job, and the printer ends up printing whatever page we
    // navigated to instead of the receipt. So the receipt page stays put
    // until the cashier explicitly taps "Done" below.

    const load = async () => {
      setLoading(true);
      try {
        const [saleData, settingsData] = await Promise.all([
          getSale(api, id),
          getSettings(api),
        ]);
        if (cancelled) return;
        setSale(saleData);
        setShop(settingsData);
        setCurrencySymbol(settingsData.currencySymbol || "Rs.");
        setCurrencyPosition(settingsData.currencyPosition || "before");

        // Wait for the receipt to actually paint before invoking the print
        // dialog. requestAnimationFrame (x2) guarantees a layout/paint pass
        // has happened, so the printer always receives the finished receipt
        // instead of whatever was on screen a moment earlier.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            printTimer = setTimeout(() => {
              if (!cancelled) printAfterHidingButtons();
            }, 350);
          });
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load invoice",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
      if (printTimer) clearTimeout(printTimer);
    };
  }, [id]);

  // Belt-and-braces margin reset that does NOT depend on `@media print`
  // being honored at all. Every fix elsewhere on this page (the `@page`
  // rule, the `html/body/#root` reset) only takes effect once the print
  // media query is actually applied. Some Android thermal-printer bridge
  // apps capture the page in its normal "screen" state (never switching to
  // print media), in which case those rules never run and any leftover
  // default margin shows up as blank feed at the top of the roll. Setting
  // the same zero-margin values directly as inline styles here applies
  // unconditionally, on screen and in print alike, so it's covered either
  // way. Restored on unmount so it doesn't leak into the rest of the app.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.getAttribute("style");
    const prevBody = body.getAttribute("style");
    html.style.margin = "0";
    html.style.padding = "0";
    body.style.margin = "0";
    body.style.padding = "0";
    return () => {
      if (prevHtml === null) html.removeAttribute("style");
      else html.setAttribute("style", prevHtml);
      if (prevBody === null) body.removeAttribute("style");
      else body.setAttribute("style", prevBody);
    };
  }, []);

  // Converts the receipt's current rendered height into the mm value we
  // feed to @page, with a small rounding buffer so the last line/border is
  // never clipped due to sub-pixel differences between the layout engine
  // and the print engine.
  const computeHeightMm = () => {
    const node = receiptRef.current;
    if (!node) return null;
    const heightPx = node.scrollHeight;
    if (!heightPx) return null;
    // 96 CSS px == 1in == 25.4mm (standard CSS px-to-physical conversion)
    const heightMm = (heightPx / 96) * 25.4;
    return Math.ceil(heightMm) + 6;
  };

  // Writes the @page rule + a matching, hard-capped container height
  // directly into the DOM. Two things happen together here, on purpose:
  //
  // 1. @page is set to the bill's own measured length (not a fixed
  //    number), so the printer feeds exactly as much paper as this bill
  //    needs — a short bill doesn't leave a long blank tail.
  // 2. html/body/#root are locked to that SAME size, and the receipt
  //    container is capped at that height with `overflow: hidden`. This
  //    is the actual fix for the "centered" look: if the printer/print
  //    bridge doesn't honor our custom @page size and substitutes its own
  //    (larger, fixed) page, the receipt would otherwise get centered in
  //    the middle of that bigger page. Locking the container itself to
  //    the same size and top-aligning it (no flex centering) means the
  //    bill still starts flush at the top-left and is clipped — not
  //    centered — at exactly the point printing "completes", regardless
  //    of what page size the underlying pipeline actually uses.
  const applyHeightMm = (mm) => {
    if (mm == null || !styleRef.current) return;
    styleRef.current.textContent = `
        @page {
          size: ${PAGE_WIDTH_MM}mm ${mm}mm;
          margin: 0;
        }
        @media print {
          html, body, #root {
            width: ${PAGE_WIDTH_MM}mm !important;
            height: ${mm}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
        }
      `;
  };

  useLayoutEffect(() => {
    if (!sale || !receiptRef.current) return;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const mm = computeHeightMm();
      if (mm == null) return;
      setPageHeightMm(mm);
      applyHeightMm(mm);
    };

    // Measure once immediately...
    measure();

    // ...and again once web fonts finish loading, since font metrics can
    // shift the rendered height slightly after the very first paint.
    if (document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }

    return () => {
      cancelled = true;
    };
  }, [sale, shop, currencySymbol, currencyPosition]);

  // Safety net: re-measure and patch the @page height synchronously right
  // as printing starts, regardless of what triggered it (the auto-print
  // timer, the manual "Print Receipt" button, or the browser's own print
  // shortcut). This catches any last-moment layout shift (e.g. a slow web
  // font swap) that the effect above might have missed.
  useEffect(() => {
    const onBeforePrint = () => {
      window.scrollTo(0, 0);
      setIsPrinting(true);
      const mm = computeHeightMm();
      setPageHeightMm(mm);
      applyHeightMm(mm);
    };
    // Restores the buttons once printing is done. On Android this event
    // isn't a fully reliable finish signal (see the "Done" button comment
    // below), but it's still the best available hook to bring the buttons
    // back for the cashier — worst case they reappear a little late, which
    // is harmless since nothing else observes isPrinting.
    const onAfterPrint = () => setIsPrinting(false);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  if (error) {
    return (
      <div className="flex justify-center items-center py-6">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (loading || !sale) {
    return (
      <div className="flex justify-center items-center py-6">
        <AppLoader
          open
          variant="inline"
          title="Loading receipt"
          subtitle="Preparing thermal receipt"
        />
      </div>
    );
  }

  const isTaxInvoice = sale.isTaxInvoice;

  return (
    <div className="w-full flex justify-center print:block bg-soft print:bg-white">
      {/* Manual fallback: the auto-print above fires from a setTimeout after
          an async load, which on many mobile browsers no longer counts as
          a "real" user gesture — so window.print() can be silently ignored.
          Tapping this button calls window.print() directly inside a click
          handler, which browsers always treat as a genuine user gesture. */}
      {/* Not rendered at all while isPrinting is true — see the comment on
          that state above. `.no-print` is kept as a second line of defense
          for print engines that do honor it, but the buttons must not
          exist in the DOM during the actual print capture, so this
          conditional render is the real fix. */}
      {/* Both buttons live at the BOTTOM of the viewport, not the top.
          They used to float over the top of the receipt (`fixed top-3`),
          directly above the shop header/logo. That is the most likely
          cause of the blank gap seen at the very start of physical
          printouts: on capture methods that don't cleanly honor the
          `isPrinting`/`.no-print` removal timing, whatever occupies that
          top strip prints as blank space before the header. Anchoring the
          controls to the bottom instead means even a mistimed capture can
          only ever affect the end of the receipt, never the start. */}
      {!isPrinting && (
        <button
          type="button"
          onClick={printAfterHidingButtons}
          className="no-print fixed bottom-3 right-3 z-50 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg"
        >
          🖨️ Print Receipt
        </button>
      )}
      {/* Explicit, cashier-controlled exit. We intentionally don't auto-leave
          this page on "afterprint" (see comment in the effect above) — on
          Android that event is not a reliable signal that printing has
          actually finished, so leaving too early can make the printer print
          the wrong page. Give the cashier a couple of seconds to see the
          print dialog complete, then tap this to head back to a fresh sale. */}
      {!isPrinting && (
        <button
          type="button"
          onClick={() => navigate("/pos")}
          className="no-print fixed bottom-3 left-3 z-50 px-4 py-2 rounded-xl bg-gray-200 text-gray-800 text-sm font-semibold shadow-lg"
        >
          ✓ Done
        </button>
      )}
      {/* Scoped to this route only. The height is set dynamically from the
          measured receipt content (see the useLayoutEffect above) so the
          page is exactly as long as this bill — falling back to "auto"
          only for the very first render, before anything has been
          measured yet. */}
      <style ref={styleRef}>{`
        @page {
          size: ${PAGE_WIDTH_MM}mm ${pageHeightMm ? `${pageHeightMm}mm` : "auto"};
          margin: 0;
        }
        @media print {
          html, body, #root {
            width: ${PAGE_WIDTH_MM}mm !important;
            ${pageHeightMm ? `height: ${pageHeightMm}mm !important;` : ""}
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
        }
      `}</style>
      {/* IMPORTANT: this element is rendered at the exact same 80mm width on
          screen as it is when printed (via inline style, not a Tailwind
          `print:` variant that only kicks in inside @media print), so the
          on-screen preview is a true WYSIWYG match for what gets printed —
          which is what makes the scrollHeight measurement above accurate.
          `overflow: hidden` + the measured `maxHeight` below is the actual
          clipping guarantee: whatever page size the printer ends up using,
          this container never draws past its own measured content height,
          so the bill starts at the top and is cut off right where it
          finishes — never centered, never trailing blank paper. */}
      <div
        ref={receiptRef}
        style={{
          width: `${PAGE_WIDTH_MM}mm`,
          maxHeight: pageHeightMm ? `${pageHeightMm}mm` : undefined,
          overflow: "hidden",
          margin: 0,
        }}
        className="bg-white text-[10px] text-gray-900 p-3 print:shadow-none print:m-0 shadow"
      >
        <div className="text-center mb-1">
          {shop?.shopLogo && (
            <img
              src={shop.shopLogo}
              alt="Shop logo"
              // object-contain + a capped height keeps the logo from ever
              // pushing the receipt content down significantly or
              // distorting on the narrow 80mm roll, regardless of the
              // uploaded image's original aspect ratio.
              className="mx-auto mb-1 max-h-12 w-auto object-contain"
              // The receipt's printed page length is derived from
              // scrollHeight (see computeHeightMm above). If the logo
              // hasn't finished decoding yet when that first measurement
              // runs, its layout box can still be 0-height at that
              // instant, so re-measure once it's actually loaded —
              // same reasoning as the document.fonts.ready re-measure.
              onLoad={() => {
                const mm = computeHeightMm();
                if (mm != null) {
                  setPageHeightMm(mm);
                  applyHeightMm(mm);
                }
              }}
            />
          )}
          <p className="font-semibold text-[12px]">
            {shop?.shopName || "Kanesha Fancy"}
          </p>
          <p>{shop?.shopAddress || "Main Street, Pandatharippu"}</p>
          <p>Tel: {shop?.shopPhone || "0779295806"}</p>
          {isTaxInvoice && <p>VAT: {shop?.vatRegNo || "123456789-7000"}</p>}
        </div>

        <div className="border-b border-dashed mb-1 pb-1 text-left">
          <p className="font-semibold">
            {isTaxInvoice ? "TAX INVOICE" : "CASH BILL"}
          </p>
          <p>Bill: {sale.billNumber}</p>
          <p>Date: {new Date(sale.createdAt).toLocaleString("en-LK")}</p>
          {sale.customer && (
            <>
              <p className="mt-1">Cus: {sale.customer.name}</p>
              {sale.customer.phone && <p>Tel: {sale.customer.phone}</p>}
            </>
          )}
        </div>

        {/* Items */}
        <div className="border-b border-dashed pb-1 mb-1">
          {sale.items.map((line, idx) => {
            const qty = Number(line.qty) || 0;
            const rate = Number(line.unitPrice) || 0;
            const baseBeforeDisc = qty * rate;
            const discPercent = Number(line.discount) || 0;
            const discAmount = baseBeforeDisc * (discPercent / 100);

            return (
              <div key={idx} className="mb-0.5">
                <div className="flex justify-between">
                  <span>
                    {idx + 1}. {line.description}
                    {line.batchNumber ? ` (${line.batchNumber})` : ""}
                  </span>
                </div>
                <div className="flex justify-between text-[9px] text-gray-500">
                  <span>
                    {line.qty} {line.unit} × {rate.toFixed(2)}
                    {discPercent
                      ? ` (-${discAmount.toFixed(2)} / ${discPercent.toFixed(
                          2,
                        )}%)`
                      : ""}
                    {isTaxInvoice && line.taxAmount
                      ? ` + VAT ${line.taxAmount.toFixed(2)}`
                      : ""}
                  </span>
                  <span className="min-w-[60px] text-right">
                    {formatCurrency(
                      line.lineTotal,
                      currencySymbol,
                      currencyPosition,
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mb-1">
          <div className="flex justify-between">
            <span>Sub total</span>
            <span>
              {formatCurrency(sale.subTotal, currencySymbol, currencyPosition)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>
              {formatCurrency(
                sale.discountTotal,
                currencySymbol,
                currencyPosition,
              )}
            </span>
          </div>
          {isTaxInvoice && (
            <div className="flex justify-between">
              <span>VAT</span>
              <span>
                {formatCurrency(
                  sale.taxTotal,
                  currencySymbol,
                  currencyPosition,
                )}
              </span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-dashed mt-1 pt-1">
            <span>Net</span>
            <span>
              {formatCurrency(
                sale.grandTotal,
                currencySymbol,
                currencyPosition,
              )}
            </span>
          </div>
        </div>

        <div className="border-t border-dashed pt-1 mt-1 text-center">
          <p className="text-[8px] text-gray-500">Return only accepted within 7 days</p>
          <p className="text-[8px] text-gray-500">Developed by Qubitz</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintThermal;
