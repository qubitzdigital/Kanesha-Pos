import React from "react";
import { formatCurrency } from "../../../utils/currency";

const PendingTable = ({ sales, onLoad, onDelete, currencySymbol, currencyPosition }) => {
  if (!sales.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-background-subtle py-16 text-center">
        <span className="text-4xl">📋</span>
        <p className="text-sm font-semibold text-text-secondary">No pending sales</p>
        <p className="text-xs text-text-tertiary">Saved pending bills will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-background-subtle text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            <th className="px-4 py-3">Bill #</th>
            <th className="hidden px-4 py-3 md:table-cell">Customer</th>
            <th className="hidden px-4 py-3 md:table-cell">Items</th>
            <th className="px-4 py-3 text-right">Grand Total</th>
            <th className="hidden px-4 py-3 md:table-cell">Saved At</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {sales.map((sale) => (
            <tr key={sale._id} className="bg-white transition hover:bg-background-subtle">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                {sale.billNumber}
              </td>
              <td className="hidden px-4 py-3 text-text-secondary md:table-cell">
                {sale.customer?.name || "Walk-in"}
              </td>
              <td className="hidden px-4 py-3 text-text-tertiary md:table-cell">
                {sale.items?.length ?? 0} line(s)
              </td>
              <td className="px-4 py-3 text-right font-semibold text-text-primary">
                {formatCurrency(sale.grandTotal, currencySymbol, currencyPosition)}
              </td>
              <td className="hidden px-4 py-3 text-xs text-text-tertiary md:table-cell">
                {new Date(sale.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLoad(sale)}
                    className="cursor-pointer rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(sale._id)}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-error transition hover:bg-error-subtle focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PendingTable;
