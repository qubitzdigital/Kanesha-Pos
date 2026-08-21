import React, { useEffect, useState } from "react";
import AppLoader from "../common/AppLoader";
import CloseButton from "../common/CloseButton";
import { validateCustomerForm } from "../common/formValidation";
import colors from "../../themes/colors";
const defaultForm = {
  name: "",
  phone: "",
  address: "",
  nic: "",
  type: "both",
  creditLimit: 0,
  notes: "",
};

const CustomerFormModal = ({
  open,
  initialData = null,
  onClose,
  onSubmit,
  saving = false,
  nicError = null,
  onNicErrorClear,
  phoneError = null,
  onPhoneErrorClear,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const [form, setForm] = useState(defaultForm);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (nicError) setFieldErrors((prev) => ({ ...prev, nic: nicError }));
  }, [nicError]);

  useEffect(() => {
    if (phoneError) setFieldErrors((prev) => ({ ...prev, phone: phoneError }));
  }, [phoneError]);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        nic: initialData.nic || "",
        type: initialData.type || "both",
        creditLimit:
          initialData.creditLimit !== undefined &&
          initialData.creditLimit !== null
            ? initialData.creditLimit
            : 0,
        notes: initialData.notes || "",
      });
    } else {
      setForm(defaultForm);
    }
    setFieldErrors({});
  }, [initialData, open]);

  if (!open) return null;

  const mapErrorsToFields = (errors) => {
    const fieldErrorMap = {};
    errors.forEach((error) => {
      const lowerError = error.toLowerCase();
      if (lowerError.includes("name")) fieldErrorMap.name = error;
      else if (lowerError.includes("phone")) fieldErrorMap.phone = error;
      else if (lowerError.includes("address")) fieldErrorMap.address = error;
      else if (lowerError.includes("nic")) fieldErrorMap.nic = error;
      else if (lowerError.includes("type")) fieldErrorMap.type = error;
      else if (lowerError.includes("credit limit"))
        fieldErrorMap.creditLimit = error;
    });
    return fieldErrorMap;
  };

  const clearFieldError = (fieldName) => {
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { isValid, errors, data } = validateCustomerForm(form);
    if (!isValid) {
      setFieldErrors(mapErrorsToFields(errors));
      return;
    }

    onSubmit(data);
  };

  return (
    <>
      <AppLoader
        open={saving}
        title={initialData ? "Updating customer" : "Saving customer"}
        subtitle="Please wait a moment"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-3 bg-white/75 backdrop-blur-sm">
        <div
          className="w-full max-w-md max-h-[80vh] flex flex-col shadow-lg rounded-2xl"
          style={{
            background: colors.background.secondary,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-lg font-semibold text-primary">
              {initialData ? "Update Customer" : "Add New Customer"}
            </h3>
            <CloseButton
              onClick={onClose}
              size="md"
              variant="subtle"
              ariaLabel="Close customer form"
            />
          </div>

          <form
            className="flex flex-col flex-1 min-h-0"
            onSubmit={handleSubmit}
          >
            <div className="flex-1 px-5 space-y-3 overflow-y-auto">
              <TextInput
                label="Name"
                required
                value={form.name}
                onChange={(v) => {
                  setForm((p) => ({ ...p, name: v }));
                  clearFieldError("name");
                }}
                error={fieldErrors.name}
              />
              <TextInput
                label="Phone"
                required
                value={form.phone}
                onChange={(v) => {
                  const digits = v.replace(/\D/g, "").slice(0, 10);
                  setForm((p) => ({ ...p, phone: digits }));
                  clearFieldError("phone");
                  onPhoneErrorClear?.();
                }}
                inputMode="numeric"
                maxLength={10}
                placeholder="0XXXXXXXXX"
                error={fieldErrors.phone}
              />
              <TextInput
                label="Address"
                required
                value={form.address}
                onChange={(v) => {
                  setForm((p) => ({ ...p, address: v }));
                  clearFieldError("address");
                }}
                error={fieldErrors.address}
              />
              <TextInput
                label="NIC"
                required
                value={form.nic}
                onChange={(v) => {
                  setForm((p) => ({ ...p, nic: v }));
                  clearFieldError("nic");
                  onNicErrorClear?.();
                }}
                error={fieldErrors.nic}
              />
              <SelectInput
                label="Customer type"
                required
                value={form.type}
                onChange={(v) => {
                  setForm((p) => ({ ...p, type: v }));
                  clearFieldError("type");
                }}
                options={[
                  { value: "cash", label: "Cash only" },
                  { value: "credit", label: "Credit only" },
                  { value: "both", label: "Cash & Credit" },
                ]}
                error={fieldErrors.type}
              />
              <TextInput
                label={`Credit limit (${currencySymbol})`}
                required
                type="number"
                value={form.creditLimit}
                onChange={(v) => {
                  setForm((p) => ({ ...p, creditLimit: v }));
                  clearFieldError("creditLimit");
                }}
                error={fieldErrors.creditLimit}
              />
              <TextArea
                label="Notes (optional)"
                value={form.notes}
                onChange={(v) => setForm((p) => ({ ...p, notes: v }))}
              />
            </div>

            <div className="flex justify-end gap-2 p-5 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 cursor-pointer rounded-xl hover:bg-gray-50 disabled:opacity-60"
                disabled={saving}
              >
                ✕ Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white cursor-pointer bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-60"
                disabled={saving}
              >
                {initialData ? "✏️ Update" : "💾 Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const TextInput = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  ...rest
}) => (
  <div>
    <label className="block mb-1 text-xs font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onWheel={type === "number" ? (e) => e.target.blur() : undefined}
      className={`w-full px-3 py-2 text-sm text-gray-800 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${
        error ? "border-red-500" : ""
      }`}
      {...rest}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const SelectInput = ({
  label,
  value,
  onChange,
  options,
  required = false,
  error,
}) => (
  <div>
    <label className="block mb-1 text-xs font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <select
      className={`w-full px-3 py-2 text-sm text-gray-800 bg-white border cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${
        error ? "border-red-500" : ""
      }`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const TextArea = ({ label, value, onChange }) => (
  <div>
    <label className="block mb-1 text-xs font-medium text-gray-700">
      {label}
    </label>
    <textarea
      rows={2}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm text-gray-800 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
);

export default CustomerFormModal;
