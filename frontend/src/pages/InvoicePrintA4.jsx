import React, { useEffect, useState } from "react";
import AppLoader from "../components/common/AppLoader";
import { useParams, useNavigate } from "react-router-dom";
import { getSale } from "../api/sales/sales";
import { getSettings } from "../api/settings/settings";
import { formatCurrency } from "../utils/currency";

const InvoicePrintA4 = ({ api }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shop, setShop] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");

  // Whether the floating "Print Invoice" button should be in the DOM.
  // `.no-print` (@media print { display: none }) isn't enough on its own:
  // several Android Bluetooth/Wi-Fi thermal/receipt-printer bridge apps
  // capture the page more literally and don't reliably honor `@media
  // print` for `position: fixed` elements (see the BareProtectedRoute
  // comment in App.jsx for the same issue with the app shell). This button
  // sits `fixed top-3`, directly over the top of the invoice, so on a
  // bridge that ignores the print stylesheet it gets captured too —
  // eating the top of the page before the actual invoice content. Actually
  // removing it from the DOM (not just hiding via CSS) while a print is in
  // flight guarantees no capture method can include it.
  const [isPrinting, setIsPrinting] = useState(false);

  const printAfterHidingButton = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  useEffect(() => {
    let cancelled = false;
    let printTimer = null;

    const handleAfterPrint = () => {
      setIsPrinting(false);
      navigate("/pos");
    };

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

        window.addEventListener("afterprint", handleAfterPrint, { once: true });

        // Wait for the invoice to actually paint before invoking print, so
        // the printer/print-preview always gets the finished invoice
        // instead of a half-rendered frame.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            printTimer = setTimeout(() => {
              if (!cancelled) printAfterHidingButton();
            }, 150);
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
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [id]);

  // Safety net for a manual browser print (e.g. Ctrl+P) that doesn't go
  // through the button's printAfterHidingButton path — makes sure the
  // button is still pulled out of the DOM before that capture too.
  useEffect(() => {
    const onBeforePrint = () => setIsPrinting(true);
    window.addEventListener("beforeprint", onBeforePrint);
    return () => window.removeEventListener("beforeprint", onBeforePrint);
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
          title="Loading invoice"
          subtitle="Preparing A4 invoice"
        />
      </div>
    );
  }

  const isTaxInvoice = sale.isTaxInvoice;
  const paidAmount =
    sale.payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0;

  return (
    <div className="w-full flex justify-center bg-soft print:bg-white">
      {/* Manual fallback: the auto-print above fires from a setTimeout after
          an async load, which on many mobile browsers no longer counts as
          a "real" user gesture — so window.print() can be silently ignored.
          Tapping this button calls window.print() directly inside a click
          handler, which always keeps a valid user gesture on mobile. */}
      {/* Not rendered at all while isPrinting is true — see the comment on
          that state above. `.no-print` is kept as a second line of defense
          for print engines that do honor it, but the button must not
          exist in the DOM during the actual print capture, so this
          conditional render is the real fix. */}
      {!isPrinting && (
        <button
          type="button"
          onClick={printAfterHidingButton}
          className="no-print fixed top-3 right-3 z-50 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg"
        >
          🖨️ Print Invoice
        </button>
      )}
      {/* Scoped to this route only — without an explicit @page size the
          browser prints whatever the OS default paper size is, which can
          crop or rescale the invoice on printers configured differently. */}
      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }
      `}</style>
      <div className="bg-white text-xs text-gray-900 p-4 md:p-6 w-full max-w-3xl print:max-w-none print:w-full print:shadow-none shadow">
        {/* Header */}
        <div className="border-b pb-2 mb-2 text-center">
          {shop?.shopLogo && (
            <img
              src={shop.shopLogo}
              alt="Shop logo"
              className="mx-auto mb-2 max-h-20 w-auto object-contain"
            />
          )}
          <h1 className="text-2xl font-semibold text-primary">
            {shop?.shopName || "Kanesha Fancy"}
          </h1>
          <p className="text-[11px]">
            {shop?.shopAddress || "Main Street, Pandatharippu"}
          </p>
          <p className="text-[11px]">
            Tel: {shop?.shopPhone || "0779295806"}
            {shop?.shopWhatsapp ? ` | WhatsApp: ${shop.shopWhatsapp}` : ""}
          </p>
          <p className="text-[11px]">
            VAT Reg No: {shop?.vatRegNo || "123456789-7000"}
          </p>
        </div>

        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-[11px] font-semibold">
              {isTaxInvoice ? "TAX INVOICE" : "CASH BILL"}
            </p>
            <p className="text-[11px]">Bill No: {sale.billNumber}</p>
            <p className="text-[11px]">
              Date: {new Date(sale.createdAt).toLocaleString("en-LK")}
            </p>
          </div>
          <div className="text-right text-[11px]">
            {sale.customer && (
              <>
                <p className="font-semibold">Customer</p>
                <p>{sale.customer.name}</p>
                {sale.customer.address && <p>{sale.customer.address}</p>}
                {sale.customer.phone && <p>Tel: {sale.customer.phone}</p>}
              </>
            )}
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-[11px] border-t border-b border-dashed mb-2">
          <thead>
            <tr className="border-b border-dashed">
              <th className="py-1 text-left">#</th>
              <th className="py-1 text-left">Description</th>
              <th className="py-1 text-right">Qty</th>
              <th className="py-1 text-right">Rate</th>
              <th className="py-1 text-right">Discount</th>
              {isTaxInvoice && <th className="py-1 text-right">VAT</th>}
              <th className="py-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((line, index) => (
              <tr key={index} className="align-top">
                <td className="py-0.5 pr-1">{index + 1}</td>
                <td className="py-0.5 pr-1">
                  {line.description}
                  {line.batchNumber ? ` (${line.batchNumber})` : ""}
                  <span className="block text-[10px] text-gray-500">
                    {line.unit} @{" "}
                    {formatCurrency(
                      line.unitPrice,
                      currencySymbol,
                      currencyPosition,
                    )}
                  </span>
                </td>
                <td className="py-0.5 text-right">
                  {line.qty} {line.unit}
                </td>
                <td className="py-0.5 text-right">
                  {line.unitPrice.toFixed(2)}
                </td>
                <td className="py-0.5 text-right">
                  {line.discount ? line.discount.toFixed(2) : "-"}
                </td>
                {isTaxInvoice && (
                  <td className="py-0.5 text-right">
                    {line.taxAmount?.toFixed(2)}
                  </td>
                )}
                <td className="py-0.5 text-right">
                  {line.lineTotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mb-1">
          <table className="text-[11px]">
            <tbody>
              <tr>
                <td className="pr-4 py-0.5">Sub total</td>
                <td className="text-right py-0.5">
                  {formatCurrency(
                    sale.subTotal,
                    currencySymbol,
                    currencyPosition,
                  )}
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-0.5">Discount</td>
                <td className="text-right py-0.5">
                  {formatCurrency(
                    sale.discountTotal,
                    currencySymbol,
                    currencyPosition,
                  )}
                </td>
              </tr>
              {isTaxInvoice && (
                <tr>
                  <td className="pr-4 py-0.5">VAT</td>
                  <td className="text-right py-0.5">
                    {formatCurrency(
                      sale.taxTotal,
                      currencySymbol,
                      currencyPosition,
                    )}
                  </td>
                </tr>
              )}
              <tr>
                <td className="pr-4 py-0.5 font-semibold border-t">
                  Net amount
                </td>
                <td className="text-right py-0.5 font-semibold border-t">
                  {formatCurrency(
                    sale.grandTotal,
                    currencySymbol,
                    currencyPosition,
                  )}
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-0.5">Paid</td>
                <td className="text-right py-0.5">
                  {formatCurrency(paidAmount, currencySymbol, currencyPosition)}
                </td>
              </tr>
              <tr>
                <td className="pr-4 py-0.5">Balance</td>
                <td className="text-right py-0.5">
                  {formatCurrency(
                    sale.balanceDue,
                    currencySymbol,
                    currencyPosition,
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment methods summary */}
        <div className="mb-2 text-[11px]">
          <p className="font-semibold">Payment method(s):</p>
          {sale.payments?.map((p, idx) => (
            <p key={idx}>
              • {p.method.toUpperCase()} -{" "}
              {formatCurrency(p.amount, currencySymbol, currencyPosition)}
              {p.reference ? ` (Ref: ${p.reference})` : ""}
            </p>
          ))}
        </div>

        <div className="border-t border-dashed pt-2 mt-2 text-center text-[10px]">
          <p>Return accepted within 7 days only</p>
          <p>Thank you! Come again. ❤️</p>
          <p className="mt-1 text-gray-400">
            This is a computer generated invoice. Signature not required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintA4;
