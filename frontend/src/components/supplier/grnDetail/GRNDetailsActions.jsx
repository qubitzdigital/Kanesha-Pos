import React from "react";

const GRNDetailsActions = ({ isDraft, onPost, onEdit, onDelete, onClose }) => {
  const handleDelete = () => {
    if (!onDelete || !isDraft) return;
    if (
      window.confirm(
        "Are you sure you want to delete this GRN? This should reverse stock on server.",
      )
    ) {
      onDelete();
      onClose();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        justifyContent: "flex-end",
        flexWrap: "wrap",
      }}
    >
      {isDraft && onPost && (
        <button
          onClick={() => {
            onPost();
            onClose();
          }}
          style={{
            padding: "0.625rem 1rem",
            background: "#dcfce7",
            color: "#15803d",
            border: "1px solid #bbf7d0",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          ✅ Post GRN
        </button>
      )}

      {isDraft && onEdit && (
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          style={{
            padding: "0.625rem 1rem",
            background: "#dbeafe",
            color: "#0369a1",
            border: "1px solid #bfdbfe",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          ✏️ Edit GRN
        </button>
      )}

      {isDraft && onDelete && (
        <button
          onClick={handleDelete}
          style={{
            padding: "0.625rem 1rem",
            background: "#fee2e2",
            color: "#dc2626",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          🗑️ Delete GRN
        </button>
      )}

      {!isDraft && (
        <div
          style={{
            alignSelf: "center",
            fontSize: "0.85rem",
            color: "#6b7280",
            fontWeight: 500,
            marginRight: "auto",
          }}
        >
          Posted GRNs cannot be edited or deleted.
        </div>
      )}

      <button
        onClick={onClose}
        style={{
          padding: "0.625rem 1rem",
          background: "#e5e7eb",
          color: "#374151",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          fontSize: "0.875rem",
          fontWeight: "500",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        ✕ Close
      </button>
    </div>
  );
};

export default GRNDetailsActions;
