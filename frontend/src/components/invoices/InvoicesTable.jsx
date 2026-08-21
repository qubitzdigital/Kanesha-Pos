import React from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/currency";

const STATUS_STYLES = {
  paid: "bg-status-success-bg text-status-success border-status-success/30",
  partial: "bg-status-pending-bg text-status-pending border-status-pending/30",
  credit: "bg-status-pending-bg text-status-pending border-status-pending/30",
  cancelled: "bg-error-subtle text-error border-error/30",
  pending: "bg-background-subtle text-text-tertiary border-border-light",
};

const StatusBadge = ({ status }) => (
  <span
    className={[
      "inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
      STATUS_STYLES[status] || STATUS_STYLES.pending,
    ].join(" ")}
  >
    {status || "paid"}
  </span>
);

const InvoicesTable = ({ invoices, currencySymbol, currencyPosition }) => {
  const navigate = useNavigate();

  if (!invoices.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-background-subtle py-16 text-center">
        <span className="text-4xl">🧾</span>
        <p className="text-sm font-semibold text-text-secondary">
          No invoices found
        </p>
        <p className="text-xs text-text-tertiary">
          Completed sales will appear here as invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-background-subtle text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            <th className="px-4 py-3">Invoice #</th>
            <th className="hidden px-4 py-3 md:table-cell">Customer</th>
            <th className="hidden px-4 py-3 sm:table-cell">Date</th>
            <th className="hidden px-4 py-3 lg:table-cell">Items</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="hidden px-4 py-3 text-right md:table-cell">
              Balance
            </th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {invoices.map((inv) => (
            <tr
              key={inv._id}
              className="bg-white transition hover:bg-background-subtle"
            >
              <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                {inv.billNumber}
              </td>
              <td className="hidden px-4 py-3 text-text-secondary md:table-cell">
                {inv.customerName}
              </td>
              <td className="hidden px-4 py-3 text-xs text-text-tertiary sm:table-cell">
                {new Date(inv.createdAt).toLocaleString()}
              </td>
              <td className="hidden px-4 py-3 text-text-tertiary lg:table-cell">
                {inv.itemCount} line(s)
              </td>
              <td className="px-4 py-3 text-right font-semibold text-text-primary">
                {formatCurrency(
                  inv.grandTotal,
                  currencySymbol,
                  currencyPosition,
                )}
              </td>
              <td className="hidden px-4 py-3 text-right md:table-cell">
                {Number(inv.balanceDue) > 0 ? (
                  <span className="font-semibold text-error">
                    {formatCurrency(
                      inv.balanceDue,
                      currencySymbol,
                      currencyPosition,
                    )}
                  </span>
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={inv.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/invoice/a4/${inv._id}`)}
                    className="cursor-pointer rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/invoice/thermal/${inv._id}`)}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:bg-background-subtle focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25"
                  >
                    Print
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

export default InvoicesTable;
