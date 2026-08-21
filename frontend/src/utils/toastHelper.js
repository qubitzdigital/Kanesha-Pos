import toast from "react-hot-toast";

/**
 * Standardized Toast Helper Utility
 * Works in .js files (NO JSX)
 */

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                      */
/* -------------------------------------------------------------------------- */

const TOAST_CONFIG = {
  default: {
    duration: 4000,
    position: "top-right",
  },
  short: {
    duration: 3000,
  },
  long: {
    duration: 5000,
  },
};

const TOAST_STYLES = {
  success: "bg-green-50 border border-green-200 text-green-900",
  error: "bg-red-50 border border-red-200 text-red-900",
  info: "bg-blue-50 border border-blue-200 text-blue-900",
  warning: "bg-yellow-50 border border-yellow-200 text-yellow-900",
};

const BASE_CLASS = "shadow-lg rounded-lg px-4 py-3 text-sm font-medium";

/* -------------------------------------------------------------------------- */
/* BASIC TOASTS                                                                */
/* -------------------------------------------------------------------------- */

export const showSuccess = (message, options = {}) =>
  toast.success(`${message}`, {
    ...TOAST_CONFIG.default,
    ...options,
    className: `${TOAST_STYLES.success} ${BASE_CLASS}`,
  });

export const showError = (message, options = {}) =>
  toast.error(`${message}`, {
    ...TOAST_CONFIG.default,
    ...options,
    className: `${TOAST_STYLES.error} ${BASE_CLASS}`,
  });

export const showInfo = (message, options = {}) =>
  toast(`ℹ ${message}`, {
    ...TOAST_CONFIG.default,
    ...options,
    icon: null,
    className: `${TOAST_STYLES.info} ${BASE_CLASS}`,
  });

export const showWarning = (message, options = {}) =>
  toast(`⚠ ${message}`, {
    ...TOAST_CONFIG.default,
    ...options,
    icon: null,
    className: `${TOAST_STYLES.warning} ${BASE_CLASS}`,
  });

/* -------------------------------------------------------------------------- */
/* CUSTOM / CONTROL                                                            */
/* -------------------------------------------------------------------------- */

export const showCustom = (content, options = {}) =>
  toast.custom(content, {
    ...TOAST_CONFIG.default,
    ...options,
  });

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const dismissAll = () => {
  toast.dismiss();
};

/* -------------------------------------------------------------------------- */
/* STANDARD MESSAGES                                                           */
/* -------------------------------------------------------------------------- */

export const successMessages = {
  create: (e = "Item") => `${e} created successfully`,
  update: (e = "Item") => `${e} updated successfully`,
  delete: (e = "Item") => `${e} deleted successfully`,
  save: (e = "Item") => `${e} saved successfully`,
  added: (e = "Item") => `${e} added successfully`,
  activated: (e = "Item") => `${e} activated`,
  deactivated: (e = "Item") => `${e} deactivated`,
  logout: "Logged out successfully",
  login: "Logged in successfully",
  paymentReceived: "Payment received successfully",
  paymentRecorded: "Payment recorded successfully",
  synced: "Saved offline. Will sync when online.",
};

export const errorMessages = {
  load: (e = "Data") => `Failed to load ${e}`,
  create: (e = "Item") => `Failed to create ${e}`,
  update: (e = "Item") => `Failed to update ${e}`,
  delete: (e = "Item") => `Failed to delete ${e}`,
  save: (e = "Item") => `Failed to save ${e}`,
  validation: "Please fix all errors before submitting",
  network: "Network error. Please try again.",
  unauthorized: "You are not authorized to perform this action",
  invalidInput: "Invalid input. Please check your entries.",
  permission: "You don't have permission to perform this action",
  postFailed: (e = "Item") => `Failed to post ${e}`,
  cannotEdit: "Only draft items can be edited",
  cannotDelete: "Only draft items can be deleted",
  cannotPost: "Only draft items can be posted",
  inactive: (e = "Item") => `This ${e} is inactive`,
  required: (f = "field") => `${f} is required`,
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
/* -------------------------------------------------------------------------- */

export const getErrorMessage = (err, fallbackMessage = "An error occurred") => {
  if (typeof err === "string") return err;
  return err?.response?.data?.message || fallbackMessage;
};

/* -------------------------------------------------------------------------- */
/* CONFIRM ACTION (NO JSX)                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Promise-based confirm dialog using toast.custom
 * Implemented with DOM nodes so it works in .js (no JSX)
 *
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title (optional)
 * @returns {Promise<boolean>} Resolves true if confirmed, false otherwise
 */
export const confirmAction = (message, title = "Confirm action") => {
  return new Promise((resolve) => {
    const toastId = toast.custom(
      () => {
        // Root
        const root = document.createElement("div");
        root.className =
          "flex flex-col w-full max-w-sm gap-2 px-4 py-3 text-sm bg-white border border-gray-200 shadow-xl rounded-2xl";

        // Title
        const titleEl = document.createElement("p");
        titleEl.className = "font-semibold text-gray-800";
        titleEl.textContent = title;

        // Message
        const msgEl = document.createElement("p");
        msgEl.className = "text-xs text-gray-600";
        msgEl.textContent = message;

        // Buttons container
        const btnRow = document.createElement("div");
        btnRow.className = "flex justify-end gap-2 pt-1";

        // Cancel button
        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className =
          "px-4 py-2 text-sm text-gray-700 transition-all bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 active:scale-95";
        cancelBtn.textContent = "Cancel";
        cancelBtn.onclick = () => {
          toast.dismiss(toastId);
          resolve(false);
        };

        // Confirm button
        const confirmBtn = document.createElement("button");
        confirmBtn.type = "button";
        confirmBtn.className =
          "px-4 py-2 font-medium text-white transition-all bg-red-600 rounded-lg cursor-pointer hover:bg-red-700 active:scale-95";
        confirmBtn.textContent = "Confirm";
        confirmBtn.onclick = () => {
          toast.dismiss(toastId);
          resolve(true);
        };

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);

        root.appendChild(titleEl);
        root.appendChild(msgEl);
        root.appendChild(btnRow);

        return root;
      },
      {
        duration: Infinity,
        position: TOAST_CONFIG.default.position,
      },
    );
  });
};

/* -------------------------------------------------------------------------- */
/* LOADING TOASTS                                                              */
/* -------------------------------------------------------------------------- */

export const showLoading = (message = "Loading...") =>
  toast.loading(message, {
    duration: Infinity,
    className:
      "bg-blue-50 border border-blue-200 text-blue-900 shadow-lg rounded-lg px-4 py-3 text-sm font-medium",
  });

export const updateLoadingToSuccess = (toastId, message = "Done!") =>
  toast.success(`✓ ${message}`, {
    id: toastId,
    duration: TOAST_CONFIG.default.duration,
    className: `${TOAST_STYLES.success} ${BASE_CLASS}`,
  });

export const updateLoadingToError = (toastId, message = "Failed!") =>
  toast.error(`✕ ${message}`, {
    id: toastId,
    duration: TOAST_CONFIG.default.duration,
    className: `${TOAST_STYLES.error} ${BASE_CLASS}`,
  });

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORT                                                              */
/* -------------------------------------------------------------------------- */

export default {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showCustom,
  dismissToast,
  dismissAll,
  successMessages,
  errorMessages,
  getErrorMessage,
  confirmAction,
  showLoading,
  updateLoadingToSuccess,
  updateLoadingToError,
};
