import React from "react";
import { formatCurrency } from "../../../utils/currency";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const GRNDetailsSummary = ({
  supplier,
  grnDate,
  totalQty,
  grandTotal,
  poNumber,
  supplierInvoiceNo,
  remarks,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <div
      style={{
        background: "#f0f9ff",
        border: "1px solid #bfdbfe",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          fontSize: "0.9rem",
        }}
      >
        <div>
          <div
            style={{
              color: "#0369a1",
              fontSize: "0.75rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            Supplier
          </div>
          <div style={{ color: "#111", fontWeight: "600" }}>
            {supplier?.name || "-"}
          </div>
        </div>

        <div>
          <div
            style={{
              color: "#0369a1",
              fontSize: "0.75rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            GRN Date
          </div>
          <div style={{ color: "#111", fontWeight: "600" }}>
            {formatDate(grnDate)}
          </div>
        </div>

        <div>
          <div
            style={{
              color: "#0369a1",
              fontSize: "0.75rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            Total Qty
          </div>
          <div style={{ color: "#111", fontWeight: "600" }}>
            {totalQty ?? "-"}
          </div>
        </div>

        <div>
          <div
            style={{
              color: "#0369a1",
              fontSize: "0.75rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            Grand Total
          </div>
          <div style={{ color: "#111", fontWeight: "600" }}>
            {formatCurrency(Number(grandTotal || 0), currencySymbol, currencyPosition)}
          </div>
        </div>

        {poNumber && (
          <div>
            <div
              style={{
                color: "#0369a1",
                fontSize: "0.75rem",
                fontWeight: "500",
                marginBottom: "0.25rem",
              }}
            >
              PO Number
            </div>
            <div style={{ color: "#111", fontWeight: "600" }}>{poNumber}</div>
          </div>
        )}

        {supplierInvoiceNo && (
          <div>
            <div
              style={{
                color: "#0369a1",
                fontSize: "0.75rem",
                fontWeight: "500",
                marginBottom: "0.25rem",
              }}
            >
              Supplier Invoice
            </div>
            <div style={{ color: "#111", fontWeight: "600" }}>
              {supplierInvoiceNo}
            </div>
          </div>
        )}
      </div>

      {remarks && (
        <div
          style={{
            marginTop: "0.75rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid #bfdbfe",
          }}
        >
          <div
            style={{
              color: "#0369a1",
              fontSize: "0.75rem",
              fontWeight: "500",
              marginBottom: "0.25rem",
            }}
          >
            Remarks
          </div>
          <div
            style={{
              color: "#111",
              whiteSpace: "pre-wrap",
              fontSize: "0.9rem",
            }}
          >
            {remarks}
          </div>
        </div>
      )}
    </div>
  );
};

export default GRNDetailsSummary;
