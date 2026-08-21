import React from "react";
import toast from "react-hot-toast";

export const confirmWithToast = (message, title = "Confirm action") =>
  new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div className="flex flex-col w-full max-w-sm gap-2 px-4 py-3 text-sm bg-white border border-gray-200 shadow-xl rounded-2xl">
          <p className="font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-600">{message}</p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-4 py-2 text-sm text-gray-700 transition-all bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 active:scale-95"
              onClick={() => { toast.dismiss(t.id); resolve(false); }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 font-medium text-white transition-all bg-red-600 rounded-lg cursor-pointer hover:bg-red-700 active:scale-95"
              onClick={() => { toast.dismiss(t.id); resolve(true); }}
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-right" }
    );
  });
