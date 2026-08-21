import React from "react";
import EntityCardList from "../common/EntityCardList";
import { getLineSizeOptions } from "../../utils/pos";

const POSItemsSection = ({
  lines,
  lineErrors,
  updateLine,
  updateLineSize,
  deleteLine,
  addEmptyLineIfNeeded,
}) => {
  return (
    <div className="p-4 border-b border-border-light sm:p-6">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-bold text-text-primary sm:text-lg">
          Items List
        </h3>
        <button
          type="button"
          onClick={addEmptyLineIfNeeded}
          className="self-start px-4 py-2 text-sm font-medium text-text-secondary transition-all duration-200 bg-background-subtle rounded-lg cursor-pointer hover:bg-background-disabled active:scale-95 sm:self-auto"
        >
          + Add Row
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto border border-border-light rounded-xl">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-background-subtle">
              <tr>
                <th className="py-3 px-3 sm:px-4 text-left text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Item
                </th>
                <th className="py-3 px-3 sm:px-4 text-left text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Size
                </th>
                <th className="py-3 px-3 sm:px-4 text-right text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Qty
                </th>
                <th className="py-3 px-3 sm:px-4 text-center text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Unit
                </th>
                <th className="py-3 px-3 sm:px-4 text-right text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Price
                </th>
                <th className="py-3 px-3 sm:px-4 text-right text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Disc %
                </th>
                <th className="py-3 px-3 sm:px-4 text-right text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  VAT
                </th>
                <th className="py-3 px-3 sm:px-4 text-right text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Total
                </th>
                <th className="py-3 px-3 sm:px-4 text-center text-[10px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {lines.map((line, idx) => {
                const err = lineErrors[idx] || {};
                const sizeOptions = getLineSizeOptions(line);
                return (
                  <tr
                    key={idx}
                    className="transition-colors hover:bg-background-subtle/50"
                  >
                    <td className="py-3 px-3 sm:px-4 align-top min-w-[180px]">
                      <div
                        className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border transition-all break-words ${
                          err.name
                            ? "border-error/40 bg-error-subtle text-error-active"
                            : "border-border-light bg-background-subtle text-text-primary"
                        }`}
                      >
                        <span
                          className={
                            line.name ? "" : "text-text-tertiary text-xs"
                          }
                        >
                          {line.sku || "Select item from search or barcode"}
                        </span>
                      </div>
                      {err.name && (
                        <p className="mt-1 text-[10px] sm:text-xs text-error">
                          {err.name}
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-3 align-top sm:px-4">
                      {sizeOptions ? (
                        <>
                          <select
                            className={`w-24 sm:w-full px-2 py-2 text-xs sm:text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                              err.variantSize
                                ? "border-error/40 bg-error-subtle text-error-active"
                                : "border-border bg-white text-text-primary"
                            }`}
                            value={line.variantSize || ""}
                            onChange={(e) =>
                              updateLineSize(idx, e.target.value)
                            }
                          >
                            <option value="" disabled>
                              Select size
                            </option>
                            {sizeOptions.map((opt) => (
                              <option
                                key={opt.size}
                                value={opt.size}
                                disabled={opt.stock <= 0}
                              >
                                {opt.size} ({opt.stock} in stock)
                              </option>
                            ))}
                          </select>
                          {err.variantSize && (
                            <p className="mt-1 text-[10px] sm:text-xs text-error">
                              {err.variantSize}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-text-tertiary">—</span>
                      )}
                    </td>

                    <td className="px-3 py-3 align-top sm:px-4">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={`w-20 sm:w-full px-3 py-2 text-xs sm:text-sm text-right rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                          err.qty
                            ? "border-error/40 bg-error-subtle text-error-active"
                            : "border-border bg-white text-text-primary"
                        }`}
                        value={line.qty}
                        onChange={(e) =>
                          updateLine(idx, { qty: e.target.value })
                        }
                      />
                      {err.qty && (
                        <p className="mt-1 text-[10px] sm:text-xs text-error text-right">
                          {err.qty}
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-3 align-top sm:px-4">
                      <input
                        className={`w-20 sm:w-full px-3 py-2 text-xs sm:text-sm text-center rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                          err.unit
                            ? "border-error/40 bg-error-subtle text-error-active"
                            : "border-border bg-white text-text-primary"
                        }`}
                        value={line.unit}
                        onChange={(e) =>
                          updateLine(idx, { unit: e.target.value })
                        }
                        placeholder="unit"
                      />
                      {err.unit && (
                        <p className="mt-1 text-[10px] sm:text-xs text-error text-center">
                          {err.unit}
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-3 align-top sm:px-4">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={`w-24 sm:w-full px-3 py-2 text-xs sm:text-sm text-right rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                          err.unitPrice
                            ? "border-error/40 bg-error-subtle text-error-active"
                            : "border-border bg-white text-text-primary"
                        }`}
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(idx, { unitPrice: e.target.value })
                        }
                      />
                      {err.unitPrice && (
                        <p className="mt-1 text-[10px] sm:text-xs text-error text-right">
                          {err.unitPrice}
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-3 align-top sm:px-4">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        className={`w-20 sm:w-full px-3 py-2 text-xs sm:text-sm text-right rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                          err.discount
                            ? "border-error/40 bg-error-subtle text-error-active"
                            : "border-border bg-white text-text-primary"
                        }`}
                        value={line.discount}
                        onChange={(e) =>
                          updateLine(idx, { discount: e.target.value })
                        }
                      />
                      {err.discount && (
                        <p className="mt-1 text-[10px] sm:text-xs text-error text-right">
                          {err.discount}
                        </p>
                      )}
                    </td>

                    <td className="px-3 py-3 text-xs font-medium text-right text-text-secondary align-top sm:px-4 sm:text-sm whitespace-nowrap">
                      {Number(line.taxAmount || 0).toFixed(2)}
                    </td>

                    <td className="px-3 py-3 text-xs font-bold text-right text-text-primary align-top sm:px-4 sm:text-sm whitespace-nowrap">
                      {Number(line.lineTotal || 0).toFixed(2)}
                    </td>

                    <td className="px-3 py-3 text-center align-top sm:px-4">
                      {line.item && (
                        <button
                          type="button"
                          onClick={() => deleteLine(idx)}
                          className="inline-flex items-center justify-center text-error transition-colors rounded-lg cursor-pointer w-7 h-7 sm:w-8 sm:h-8 hover:bg-error-subtle"
                          title="Delete line"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="block lg:hidden">
        <EntityCardList
          items={lines}
          renderCard={(line, idx) => {
            const err = lineErrors[idx] || {};
            const sizeOptions = getLineSizeOptions(line);
            return (
              <div className="p-3 space-y-3 border border-border-light rounded-xl bg-background-subtle sm:p-4">
                <div>
                  <div
                    className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border transition-all break-words ${
                      err.name
                        ? "border-error/40 bg-error-subtle text-error-active"
                        : "border-border-light bg-white text-text-primary"
                    }`}
                  >
                    <span
                      className={line.name ? "" : "text-text-tertiary text-xs"}
                    >
                      {line.sku || "Select item from search or barcode"}
                    </span>
                  </div>
                  {err.name && (
                    <p className="mt-1 text-[10px] sm:text-xs text-error">
                      {err.name}
                    </p>
                  )}
                </div>

                {sizeOptions && (
                  <div>
                    <label className="block text-[11px] text-text-secondary mb-1">
                      Size
                    </label>
                    <select
                      className={`w-full px-2 py-2 text-xs sm:text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        err.variantSize
                          ? "border-error/40 bg-error-subtle text-error-active"
                          : "border-border bg-white text-text-primary"
                      }`}
                      value={line.variantSize || ""}
                      onChange={(e) => updateLineSize(idx, e.target.value)}
                    >
                      <option value="" disabled>
                        Select size
                      </option>
                      {sizeOptions.map((opt) => (
                        <option
                          key={opt.size}
                          value={opt.size}
                          disabled={opt.stock <= 0}
                        >
                          {opt.size} ({opt.stock} in stock)
                        </option>
                      ))}
                    </select>
                    {err.variantSize && (
                      <p className="mt-1 text-[10px] sm:text-xs text-error">
                        {err.variantSize}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-text-secondary mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={`w-full px-2 py-2 text-xs sm:text-sm text-right rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        err.qty
                          ? "border-error/40 bg-error-subtle text-error-active"
                          : "border-border bg-white text-text-primary"
                      }`}
                      value={line.qty}
                      onChange={(e) => updateLine(idx, { qty: e.target.value })}
                    />
                    {err.qty && (
                      <p className="mt-1 text-[10px] sm:text-xs text-error text-right">
                        {err.qty}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-text-secondary mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={`w-full px-2 py-2 text-xs sm:text-sm text-right rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        err.unitPrice
                          ? "border-error/40 bg-error-subtle text-error-active"
                          : "border-border bg-white text-text-primary"
                      }`}
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(idx, { unitPrice: e.target.value })
                      }
                    />
                    {err.unitPrice && (
                      <p className="mt-1 text-[10px] sm:text-xs text-error text-right">
                        {err.unitPrice}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-text-secondary mb-1">
                      Disc %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className={`w-full px-2 py-2 text-xs sm:text-sm text-right rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        err.discount
                          ? "border-error/40 bg-error-subtle text-error-active"
                          : "border-border bg-white text-text-primary"
                      }`}
                      value={line.discount}
                      onChange={(e) =>
                        updateLine(idx, { discount: e.target.value })
                      }
                    />
                    {err.discount && (
                      <p className="mt-1 text-[10px] sm:text-xs text-error text-right">
                        {err.discount}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-text-secondary sm:text-sm">
                    <div>
                      VAT:{" "}
                      <span className="font-medium text-text-primary">
                        {Number(line.taxAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      Total:{" "}
                      <span className="font-bold text-text-primary">
                        {Number(line.lineTotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {line.item && (
                    <button
                      type="button"
                      onClick={() => deleteLine(idx)}
                      className="inline-flex items-center justify-center w-8 h-8 text-error transition-colors rounded-lg cursor-pointer hover:bg-error-subtle"
                      title="Delete line"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          }}
          emptyState={
            <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center text-text-tertiary">
              <p className="text-sm">
                No items added yet. Start by adding items above.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default POSItemsSection;
