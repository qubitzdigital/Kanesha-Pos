import React from "react";

export default function ConfirmDeleteModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
  loading,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/75 backdrop-blur-sm">
      <div className="relative flex flex-col items-center w-full max-w-md p-6 bg-white border border-gray-200 shadow-lg rounded-2xl">
        <h3 className="mb-2 text-lg font-bold text-red-600">{title}</h3>
        <p className="mb-4 text-sm text-center text-gray-700">{message}</p>

        <div className="flex gap-3 mt-2">
          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-focus/20"
            onClick={onCancel}
            disabled={loading}
          >
            ✕ {cancelText}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-red-600 border border-red-600 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-error/20"
            onClick={onConfirm}
            disabled={loading}
          >
            🗑️ {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
