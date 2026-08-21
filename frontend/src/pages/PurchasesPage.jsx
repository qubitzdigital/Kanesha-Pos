import React, { useEffect, useState } from "react";
import { loadItems } from "../api/inventory/items";
import { getSuppliers } from "../api/supplier/suppliers";
import { createPurchase } from "../api/purchases/purchases";
import { loadCurrencySettings } from "../api/settings/settings";
import { formatCurrency } from "../utils/currency";

const emptyLine = () => ({
  item: null,
  itemId: "",
  name: "",
  sku: "",
  qty: 1,
  unit: "",
  unitPrice: 0, // cost per selected unit
  lineTotal: 0,
});

const PurchasesPage = ({ api }) => {
  const [lines, setLines] = useState([emptyLine()]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");

  // Supplier selection + payments
  const [supplierQuery, setSupplierQuery] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");

  const [amountPaid, setAmountPaid] = useState(0);

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      const settings = await loadCurrencySettings(api);
      setCurrencySymbol(settings.currencySymbol || "Rs.");
      setCurrencyPosition(settings.currencyPosition || "before");
    } catch (err) {
      console.error("Failed to load currency settings:", err);
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      if (!query) {
        setSearchResults([]);
        return;
      }
      const data = await loadItems(api, query);
      setSearchResults(data);
    };
    const id = setTimeout(fetchItems, 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const data = await getSuppliers(api, supplierQuery);
      setSuppliers(data);
      // keep selected supplier if still in list
      if (supplierId && !data.find((s) => s._id === supplierId)) {
        setSupplierId("");
      }
    };

    const id = setTimeout(fetchSuppliers, 200);
    return () => clearTimeout(id);
  }, [supplierQuery, supplierId]);

  const getUnitOptions = (item) => {
    if (!item) return [];
    const baseUnit = item.baseUnit || "base";
    return [
      {
        label: baseUnit,
        value: baseUnit,
        factorToBase: 1,
      },
    ];
  };

  const computeLine = (line) => {
    const qty = Number(line.qty) || 0;
    const price = Number(line.unitPrice) || 0;
    return {
      ...line,
      lineTotal: qty * price,
    };
  };

  const updateLine = (idx, updates) => {
    setLines((prev) => {
      const next = [...prev];
      let line = { ...next[idx], ...updates };
      line = computeLine(line);
      next[idx] = line;
      return next;
    });
  };

  const findFirstEmptyLineIndex = () =>
    lines.findIndex((l) => !l.item && !l.name) === -1
      ? lines.length
      : lines.findIndex((l) => !l.item && !l.name);

  const addEmptyLineIfNeeded = () => {
    if (lines[lines.length - 1].item || lines[lines.length - 1].name) {
      setLines((prev) => [...prev, emptyLine()]);
    }
  };

  const handleSelectItem = (idx, item) => {
    const indexToUse = idx ?? findFirstEmptyLineIndex();
    setLines((prev) => {
      const next = [...prev];
      if (!next[indexToUse]) next.push(emptyLine());
      const existing = next[indexToUse];
      const qty = existing.qty || 1;
      let line = {
        ...existing,
        item,
        itemId: item._id,
        name: item.name,
        sku: item.sku,
        unit: item.baseUnit,
        qty,
        unitPrice: item.costPrice || 0,
      };
      line = computeLine(line);
      next[indexToUse] = line;
      return next;
    });
    addEmptyLineIfNeeded();
    setQuery("");
    setSearchResults([]);
  };

  const subTotal = lines.reduce(
    (sum, l) => sum + (Number(l.lineTotal) || 0),
    0,
  );
  const grandTotal = subTotal; // extend with tax/discount later if needed

  const paid = Number(amountPaid) || 0;
  const balanceDue = Math.max(grandTotal - paid, 0);
  const paymentStatus =
    paid >= grandTotal ? "paid" : paid > 0 ? "partial" : "unpaid";

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const validLines = lines.filter((l) => l.item);
      if (!validLines.length) {
        setError("Add at least one item.");
        setSaving(false);
        return;
      }
      if (!supplierId) {
        setError("Select a supplier.");
        setSaving(false);
        return;
      }
      const payload = {
        supplier: supplierId,
        billNumber: billNumber || `GRN-${Date.now()}`,
        billDate: billDate
          ? new Date(billDate).toISOString()
          : new Date().toISOString(),
        items: validLines.map((l) => ({
          item: l.itemId,
          description: l.sku,
          qty: l.qty, // in selected unit
          unit: l.unit, // selected unit
          costPrice: l.unitPrice, // cost per selected unit; backend converts to base
          lineTotal: l.lineTotal,
        })),
        subTotal,
        grandTotal,
        amountPaid: paid,
        balanceDue,
        status: paymentStatus,
        note,
      };
      const data = await createPurchase(api, payload);
      setMessage("Purchase saved and stock updated.");
      setLines([emptyLine()]);
      setBillNumber("");
      setSupplierId("");
      setSupplierQuery("");
      setAmountPaid(0);
      setNote("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save purchase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Purchases / GRN</h2>
          <p className="text-xs text-gray-500">
            Record supplier bills; quantities are captured in the item base
            unit.
          </p>
        </div>
        <div className="text-xs text-right">
          <p className="font-semibold">
            Total this GRN:{" "}
            {formatCurrency(grandTotal, currencySymbol, currencyPosition)}
          </p>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="grid md:grid-cols-4 gap-3 text-xs">
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Supplier</label>
            <input
              className="w-full border rounded-xl px-3 py-1.5 mb-1"
              value={supplierQuery}
              onChange={(e) => setSupplierQuery(e.target.value)}
              placeholder="Search supplier name / phone"
            />
            <select
              className="w-full border rounded-xl px-3 py-1.5"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.phone ? `(${s.phone})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Bill / GRN No.</label>
            <input
              className="w-full border rounded-xl px-3 py-1.5"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              placeholder="Supplier bill no."
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Bill date</label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-1.5"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Note (optional)</label>
            <input
              className="w-full border rounded-xl px-3 py-1.5"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Truck no, supplier, etc."
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Amount paid</label>
            <input
              type="number"
              min="0"
              className="w-full border rounded-xl px-3 py-1.5"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Balance after save:{" "}
              {formatCurrency(balanceDue, currencySymbol, currencyPosition)} (
              {paymentStatus})
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">
              Search item to add to GRN
            </label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. cement 50kg, 1" GI pipe...'
            />
            {searchResults.length > 0 && (
              <div className="mt-1 max-h-48 overflow-auto bg-white border rounded-xl shadow-lg text-sm">
                {searchResults.map((item) => (
                  <button
                    key={item._id}
                    className="w-full text-left px-3 py-2 hover:bg-soft cursor-pointer"
                    onClick={() => handleSelectItem(null, item)}
                  >
                    <div className="flex justify-between">
                      <span>{item.sku}</span>
                      <span className="text-xs text-gray-500">
                        Stock: {item.currentStock} {item.baseUnit}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Cost (base):{" "}
                      {formatCurrency(
                        item.costPrice || 0,
                        currencySymbol,
                        currencyPosition,
                      )}{" "}
                      / {item.baseUnit}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-auto border rounded-2xl">
          <table className="min-w-full text-xs">
            <thead className="bg-soft">
              <tr>
                <th className="px-2 py-2 text-left">Item</th>
                <th className="px-2 py-2 text-right">Qty</th>
                <th className="px-2 py-2">Unit</th>
                <th className="px-2 py-2 text-right">Cost / unit</th>
                <th className="px-2 py-2 text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const unitOptions = getUnitOptions(line.item);
                return (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1">
                      <input
                        className="w-full bg-transparent text-[11px] outline-none"
                        value={line.sku}
                        onChange={(e) =>
                          updateLine(idx, { sku: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        type="number"
                        min="0"
                        className="w-16 text-right bg-transparent outline-none"
                        value={line.qty}
                        onChange={(e) =>
                          updateLine(idx, { qty: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-[11px]">
                        {line.unit || unitOptions[0]?.value || ""}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        type="number"
                        min="0"
                        className="w-20 text-right bg-transparent outline-none"
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(idx, { unitPrice: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      {Number(line.lineTotal || 0).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-lg">
            {error}
          </p>
        )}
        {message && (
          <p className="text-xs text-green-600 bg-green-50 border border-green-100 px-2 py-1 rounded-lg">
            {message}
          </p>
        )}

        <div className="flex justify-end pt-2 border-t">
          <button
            className="btn-primary inline-flex items-center justify-center gap-2"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "💾 Save purchase"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchasesPage;
