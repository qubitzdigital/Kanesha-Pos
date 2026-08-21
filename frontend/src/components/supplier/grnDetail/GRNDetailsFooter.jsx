import React from "react";

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

const GRNDetailsFooter = ({ createdAt, supplierInvoiceDate }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid #e5e7eb",
        marginBottom: "1rem",
        fontSize: "0.9rem",
      }}
    >
      <div>
        <div style={{ color: "#666", marginBottom: "0.25rem" }}>Created On</div>
        <div style={{ fontWeight: "600", color: "#111" }}>
          {formatDate(createdAt)}
        </div>
      </div>
      <div>
        <div style={{ color: "#666", marginBottom: "0.25rem" }}>
          Supplier Invoice Date
        </div>
        <div style={{ fontWeight: "600", color: "#111" }}>
          {formatDate(supplierInvoiceDate)}
        </div>
      </div>
    </div>
  );
};

export default GRNDetailsFooter;
