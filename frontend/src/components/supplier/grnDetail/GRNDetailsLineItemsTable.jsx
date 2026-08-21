import React from "react";
import { formatCurrency } from "../../../utils/currency";

const GRNDetailsLineItemsTable = ({
  lines,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const calcLineTotal = (line) => {
    const qty = Number(line.qty) || 0;
    const cost = Number(line.unitCost) || 0;
    return qty * cost;
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3
        style={{
          margin: "0 0 0.75rem 0",
          fontSize: "1rem",
          fontWeight: "600",
          color: "#111",
        }}
      >
        Items ({lines.length})
      </h3>

      {lines.length === 0 ? (
        <p style={{ color: "#999", fontSize: "0.9rem" }}>
          No items in this GRN.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#666",
                  }}
                >
                  Item
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#666",
                  }}
                >
                  SKU
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#666",
                  }}
                >
                  Batch / Size
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#666",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#666",
                  }}
                >
                  Unit Cost
                </th>
                <th
                  style={{
                    padding: "0.75rem",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#666",
                  }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const item = line.item || {};
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.75rem", color: "#111" }}>
                      {item.sku || "-"}
                    </td>
                    <td style={{ padding: "0.75rem", color: "#666" }}>
                      {item.sku || "-"}
                    </td>
                    <td style={{ padding: "0.75rem", color: "#666" }}>
                      {line.batchNumber && line.variantSize
                        ? `Batch: ${line.batchNumber} • Size: ${line.variantSize}`
                        : line.batchNumber || line.variantSize || "-"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        textAlign: "right",
                        color: "#111",
                        fontWeight: "500",
                      }}
                    >
                      {line.qty}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        textAlign: "right",
                        color: "#666",
                      }}
                    >
                      {formatCurrency(
                        line.unitCost,
                        currencySymbol,
                        currencyPosition,
                      )}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem",
                        textAlign: "right",
                        color: "#111",
                        fontWeight: "600",
                      }}
                    >
                      {formatCurrency(
                        calcLineTotal(line),
                        currencySymbol,
                        currencyPosition,
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GRNDetailsLineItemsTable;
