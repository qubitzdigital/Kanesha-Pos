// src/components/supplier/sections/SupplierContactSection.jsx
import React from "react";
import toast from "react-hot-toast";

const SupplierContactSection = ({ form, errors, onFormChange, addPhone }) => {
  return (
    <div className="space-y-5">
      <div>
        <label className="block mb-2 text-xs font-semibold tracking-wider text-text-secondary">
          SUPPLIER CODE
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 text-sm transition border border-gray-200 shadow-sm outline-none rounded-2xl bg-background-secondary text-text-primary placeholder:text-text-tertiary hover:border-border-default focus:border-border-focus focus:ring-4 focus:ring-focus/20"
          value={form.supplierCode}
          onChange={(e) => onFormChange({ supplierCode: e.target.value })}
        />
      </div>

      <div>
        <label className="block mb-2 text-xs font-semibold tracking-wider text-text-secondary">
          SUPPLIER NAME <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          className={[
            "w-full rounded-2xl px-4 py-3 text-sm shadow-sm outline-none transition",
            "bg-background-secondary placeholder:text-text-tertiary",
            errors.name
              ? "border border-error bg-error-bg focus:ring-4 focus:ring-error/20"
              : "border border-gray-200 hover:border-border-default focus:border-border-focus focus:ring-4 focus:ring-focus/20",
            "text-text-primary",
          ].join(" ")}
          value={form.name}
          onChange={(e) => onFormChange({ name: e.target.value })}
        />
        {errors.name && (
          <p className="mt-2 text-xs font-semibold text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 text-xs font-semibold tracking-wider text-text-secondary">
          CONTACT PERSON
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 text-sm transition border border-gray-200 shadow-sm outline-none rounded-2xl bg-background-secondary text-text-primary placeholder:text-text-tertiary hover:border-border-default focus:border-border-focus focus:ring-4 focus:ring-focus/20"
          value={form.contactPerson}
          onChange={(e) => onFormChange({ contactPerson: e.target.value })}
        />
      </div>

      <div>
        <label className="block mb-2 text-xs font-semibold tracking-wider text-text-secondary">
          EMAIL
        </label>
        <input
          type="email"
          className={[
            "w-full rounded-2xl px-4 py-3 text-sm shadow-sm outline-none transition",
            "bg-background-secondary placeholder:text-text-tertiary",
            errors.email
              ? "border border-error bg-error-bg focus:ring-4 focus:ring-error/20"
              : "border border-gray-200 hover:border-border-default focus:border-border-focus focus:ring-4 focus:ring-focus/20",
            "text-text-primary",
          ].join(" ")}
          value={form.email}
          onChange={(e) => onFormChange({ email: e.target.value })}
        />
        {errors.email && (
          <p className="mt-2 text-xs font-semibold text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 text-xs font-semibold tracking-wider text-text-secondary">
          PHONE NUMBERS <span className="text-red-600">*</span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            type="text"
            className={[
              "w-full flex-1 rounded-2xl px-4 py-3 text-sm shadow-sm outline-none transition",
              "bg-background-secondary placeholder:text-text-tertiary",
              errors.phones
                ? "border border-error bg-error-bg focus:ring-4 focus:ring-error/20"
                : "border border-gray-200 hover:border-border-default focus:border-border-focus focus:ring-4 focus:ring-focus/20",
              "text-text-primary",
            ].join(" ")}
            placeholder="Add phone number"
            value={form.phoneInput}
            onChange={(e) => onFormChange({ phoneInput: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPhone();
              }
            }}
          />

          <button
            type="button"
            className="
              inline-flex items-center justify-center rounded-2xl bg-accent px-4 py-3
              text-sm font-semibold text-white shadow-md transition duration-200 ease-out
              hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-lg
              active:translate-y-0 active:bg-accent-active
              focus:outline-none focus:ring-4 focus:ring-focus/25
              cursor-pointer
            "
            onClick={() => {
              if (!form.phoneInput.trim()) return;
              // keep same logic path (addPhone does validation + toasts)
              addPhone();
            }}
          >
            +Add
          </button>
        </div>

        {form.phones.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {form.phones.map((phone, idx) => (
              <span
                key={idx}
                className="
                  inline-flex items-center gap-2 rounded-2xl
                  border border-gray-200 bg-background-subtle
                  px-3 py-1.5 text-xs font-semibold text-text-secondary shadow-sm
                "
              >
                {phone}
                <button
                  type="button"
                  onClick={() => {
                    const newPhones = form.phones.filter((_, i) => i !== idx);
                    onFormChange({ phones: newPhones });
                    toast.dismiss();
                  }}
                  className="inline-flex items-center justify-center w-6 h-6 text-red-600 transition duration-150 ease-out border border-gray-200 cursor-pointer rounded-xl bg-background-secondary hover:bg-error-bg hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-error/20"
                  aria-label="Remove phone"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {errors.phones && (
          <p className="mt-2 text-xs font-semibold text-red-600">
            {errors.phones}
          </p>
        )}
      </div>
    </div>
  );
};

export default SupplierContactSection;
