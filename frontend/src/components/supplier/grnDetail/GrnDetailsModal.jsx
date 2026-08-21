// GrnDetailsModal.jsx
import React from "react";
import GRNDetailsHeader from "./GRNDetailsHeader";
import GRNDetailsSummary from "./GRNDetailsSummary";
import GRNDetailsLineItemsTable from "./GRNDetailsLineItemsTable";
import GRNDetailsFooter from "./GRNDetailsFooter";
import GRNDetailsActions from "./GRNDetailsActions";
import colors from "../../../themes/colors";

function GrnDetailsModal({
  open,
  grn,
  onClose,
  onEdit,
  onDelete,
  onPost,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) {
  if (!open || !grn) return null;

  const {
    grnNo,
    status,
    supplier,
    grnDate,
    poNumber,
    supplierInvoiceNo,
    supplierInvoiceDate,
    totalQty,
    grandTotal,
    remarks,
    lines = [],
    createdAt,
  } = grn;

  const isDraft = status === "draft";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        style={{
          background: colors.background.secondary,
          border: `1px solid ${colors.border.light}`,
          borderRadius: "12px",
          maxWidth: "900px",
          width: "95%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          padding: "1.5rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <GRNDetailsHeader grnNo={grnNo} status={status} onClose={onClose} />

        <GRNDetailsSummary
          supplier={supplier}
          grnDate={grnDate}
          totalQty={totalQty}
          grandTotal={grandTotal}
          poNumber={poNumber}
          supplierInvoiceNo={supplierInvoiceNo}
          remarks={remarks}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />

        <GRNDetailsLineItemsTable
          lines={lines}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />

        <GRNDetailsFooter
          createdAt={createdAt}
          supplierInvoiceDate={supplierInvoiceDate}
        />

        <GRNDetailsActions
          isDraft={isDraft}
          onPost={onPost}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export default GrnDetailsModal;
