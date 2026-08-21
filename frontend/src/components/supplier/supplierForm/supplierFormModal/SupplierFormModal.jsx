// src/components/supplier/SupplierFormModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  PAYMENT_TERM_TYPES,
  NET_DAY_OPTIONS,
  normalizePaymentTerms,
} from "../../../../utils/paymentTerms";
import { showError } from "../../../../utils/toastHelper";
import {
  isValidEmail,
  isValidPhoneNumber,
} from "../../../common/formValidation";
import SupplierFormHeader from "./SupplierFormHeader";
import SupplierFormBody from "./SupplierFormBody";
import SupplierFormFooter from "./SupplierFormFooter";

const empty = {
  supplierCode: "",
  name: "",
  contactPerson: "",
  phones: [],
  phoneInput: "",
  address: "",
  email: "",
  openingBalance: 0,
  creditLimit: 0,
  paymentTerms: { type: "CASH", days: 0 },
  notes: "",
  status: "active",
};
import colors from "../../../../themes/colors";
export default function SupplierFormModal({
  open,
  editingSupplier, // null or supplier object
  saving,
  onClose,
  onSubmit, // async (payload) => void
}) {
  const isEdit = !!editingSupplier;

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;

    if (!editingSupplier) {
      setForm(empty);
      setErrors({});
      return;
    }

    setForm({
      supplierCode: editingSupplier.supplierCode || "",
      name: editingSupplier.name || "",
      contactPerson: editingSupplier.contactPerson || "",
      phones: editingSupplier.phones || [],
      phoneInput: "",
      address: editingSupplier.address || "",
      email: editingSupplier.email || "",
      openingBalance:
        editingSupplier.openingBalance !== undefined &&
        editingSupplier.openingBalance !== null
          ? editingSupplier.openingBalance
          : 0,
      creditLimit:
        editingSupplier.creditLimit !== undefined &&
        editingSupplier.creditLimit !== null
          ? editingSupplier.creditLimit
          : 0,
      paymentTerms: normalizePaymentTerms(editingSupplier.paymentTerms),
      notes: editingSupplier.notes || "",
      status: editingSupplier.status || "active",
    });
    setErrors({});
  }, [open, editingSupplier]);

  const validate = () => {
    const e = {};

    if (!form.name || form.name.trim().length < 2)
      e.name = "Supplier name is required (min 2 chars).";
    if (!form.address || form.address.trim().length < 5)
      e.address = "Address is required (min 5 chars).";

    if (!form.phones || form.phones.length === 0) {
      e.phones = "At least one phone number is required.";
    } else {
      const invalidPhones = form.phones.filter((p) => !isValidPhoneNumber(p));
      if (invalidPhones.length > 0)
        e.phones = `Phone number "${invalidPhones[0]}" is invalid.`;
      else if (form.phoneInput.trim())
        e.phones = "Click Add to include the phone number.";
    }

    const cl = Number(form.creditLimit);
    if (Number.isNaN(cl) || cl <= 0)
      e.creditLimit = "Credit limit must be greater than 0.";

    const ob = Number(form.openingBalance);
    if (Number.isNaN(ob) || ob < 0)
      e.openingBalance = "Opening balance must be 0 or greater.";
    else if (!Number.isNaN(cl) && ob > cl)
      e.openingBalance = "Opening balance cannot exceed credit limit.";

    if (form.email && !isValidEmail(form.email))
      e.email = "Email address is invalid.";

    const pt = normalizePaymentTerms(form.paymentTerms);
    if (pt.type === "NET" && (Number.isNaN(pt.days) || pt.days < 0))
      e.paymentTerms = "Net days must be 0 or more.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addPhone = () => {
    const phone = form.phoneInput.trim();
    if (!phone) return;

    if (!isValidPhoneNumber(phone)) return showError("Phone number is invalid");
    if (form.phones.includes(phone))
      return showError("This phone number is already added");

    const newPhones = [...form.phones, phone];
    setForm((p) => ({ ...p, phones: newPhones, phoneInput: "" }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.phones;
      return next;
    });
  };

  const updateFormField = (updates) => {
    setForm((p) => {
      const next = { ...p, ...updates };
      // Immediate validation for openingBalance vs creditLimit
      const cl = Number(
        updates.creditLimit !== undefined
          ? updates.creditLimit
          : next.creditLimit,
      );
      const ob = Number(
        updates.openingBalance !== undefined
          ? updates.openingBalance
          : next.openingBalance,
      );
      setErrors((prev) => {
        const e = { ...prev };
        if (!Number.isNaN(cl) && !Number.isNaN(ob) && ob > cl) {
          e.openingBalance = "Opening balance cannot exceed credit limit.";
        } else if (
          e.openingBalance === "Opening balance cannot exceed credit limit."
        ) {
          delete e.openingBalance;
        }
        return e;
      });
      return next;
    });
  };

  const submit = async () => {
    if (!validate()) return;

    const payload = {
      supplierCode: form.supplierCode?.trim() || undefined,
      name: form.name.trim(),
      contactPerson: form.contactPerson?.trim() || undefined,
      phones: form.phones,
      address: form.address.trim(),
      email: form.email?.trim() || undefined,
      openingBalance: Number(form.openingBalance || 0),
      creditLimit: Number(form.creditLimit || 0),
      paymentTerms: normalizePaymentTerms(form.paymentTerms),
      notes: form.notes?.trim() || undefined,
      status: form.status,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save supplier.";
      if (err?.response?.status === 409) {
        setErrors((prev) => ({ ...prev, name: msg }));
      } else {
        showError(msg);
      }
    }
  };

  const pt = useMemo(
    () => normalizePaymentTerms(form.paymentTerms),
    [form.paymentTerms],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/75 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border shadow-lg max-h-[90vh] flex flex-col animate-[popIn_220ms_ease-out]"
        style={{
          background: colors.background.secondary,
          border: `1px solid ${colors.border.light}`,
        }}
      >
        {/* Top accent bar for consistency with GRNFormModal */}
        <div className="h-1.5 w-full bg-accent" />

        {/* Soft ambient glows for consistency */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-64 h-64 rounded-full -top-24 -right-24 bg-accent-subtle blur-3xl opacity-70" />
          <div className="absolute rounded-full -bottom-28 -left-28 h-72 w-72 bg-primary-subtle blur-3xl opacity-60" />
        </div>

        {/* Header (non-scrollable, sticky) */}
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-background-secondary/90 backdrop-blur-md">
          <SupplierFormHeader isEdit={isEdit} onClose={onClose} />
        </div>

        {/* Scrollable body */}
        <div className="relative flex-1 px-4 py-4 overflow-y-auto max-h-[calc(85vh-16rem)]">
          <div className="rounded-2xl bg-background-secondary shadow-soft">
            <div className="p-2 sm:p-3 md:p-4">
              <SupplierFormBody
                form={form}
                errors={errors}
                isEdit={isEdit}
                onFormChange={updateFormField}
                addPhone={addPhone}
                pt={pt}
                PAYMENT_TERM_TYPES={PAYMENT_TERM_TYPES}
                NET_DAY_OPTIONS={NET_DAY_OPTIONS}
              />
            </div>
          </div>
        </div>

        {/* Footer (non-scrollable, sticky) */}
        <div className="sticky bottom-0 z-20 border-t border-gray-200 bg-background-secondary/95 backdrop-blur-md">
          <SupplierFormFooter
            saving={saving}
            isEdit={isEdit}
            onCancel={onClose}
            onSubmit={submit}
          />
        </div>
      </div>
    </div>
  );
}
