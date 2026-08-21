// src/components/supplier/details/SupplierDetailsContent.jsx
import React from "react";
import { formatPaymentTerms } from "../../../utils/paymentTerms";
import { formatCurrency } from "../../../utils/currency";

const SupplierDetailsContent = ({
  supplier,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  if (!supplier) {
    return (
      <div className="py-8 text-center text-text-tertiary">
        <div className="mb-2 text-lg font-semibold">No supplier selected</div>
        <div className="text-sm">
          Select a supplier to view details and actions.
        </div>
      </div>
    );
  }

  const outstanding = Number(supplier.currentBalance || 0);

  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-1">
        <span className="text-xs font-semibold tracking-wider text-text-secondary">
          SUPPLIER CODE
        </span>
        <p className="text-text-primary">{supplier.supplierCode || "—"}</p>
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-semibold tracking-wider text-text-secondary">
          NAME
        </span>
        <p className="text-text-primary">{supplier.name}</p>
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-semibold tracking-wider text-text-secondary">
          CONTACT PERSON
        </span>
        <p className="text-text-primary">{supplier.contactPerson || "—"}</p>
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-semibold tracking-wider text-text-secondary">
          PHONE(S)
        </span>
        <p className="text-text-primary">
          {supplier.phones && supplier.phones.length > 0
            ? supplier.phones.join(", ")
            : "—"}
        </p>
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-semibold tracking-wider text-text-secondary">
          EMAIL
        </span>
        <p className="text-text-primary">{supplier.email || "—"}</p>
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-semibold tracking-wider text-text-secondary">
          ADDRESS
        </span>
        <p className="text-text-primary">{supplier.address || "—"}</p>
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-semibold tracking-wider text-text-secondary">
          PAYMENT TERMS
        </span>
        <p className="text-text-primary">
          {formatPaymentTerms(supplier.paymentTerms)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
        <div className="p-4 border border-gray-200 shadow-sm rounded-2xl bg-background-subtle">
          <span className="text-xs font-semibold tracking-wider text-text-secondary">
            OPENING BALANCE
          </span>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            {formatCurrency(
              supplier.openingBalance || 0,
              currencySymbol,
              currencyPosition,
            )}
          </p>
        </div>

        <div className="p-4 border border-gray-200 shadow-sm rounded-2xl bg-background-subtle">
          <span className="text-xs font-semibold tracking-wider text-text-secondary">
            CURRENT BALANCE
          </span>
          <p
            className={[
              "mt-1 text-sm font-semibold",
              outstanding > 0 ? "text-red-600" : "text-success",
            ].join(" ")}
          >
            {formatCurrency(outstanding, currencySymbol, currencyPosition)}
          </p>
        </div>
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-semibold tracking-wider text-text-secondary">
          CREDIT LIMIT
        </span>
        <p className="text-text-primary">
          {formatCurrency(
            supplier.creditLimit || 0,
            currencySymbol,
            currencyPosition,
          )}
        </p>
      </div>

      <div className="grid gap-1">
        <span className="text-xs font-semibold tracking-wider text-text-secondary">
          STATUS
        </span>
        <p
          className={[
            "font-semibold",
            supplier.status === "active"
              ? "text-success"
              : "text-text-tertiary",
          ].join(" ")}
        >
          {supplier.status === "active" ? "Active" : "Inactive"}
        </p>
      </div>

      {supplier.notes && (
        <div className="grid gap-1 ">
          <span className="text-xs font-semibold tracking-wider text-text-secondary">
            NOTES
          </span>
          <p className="text-text-primary">{supplier.notes}</p>
        </div>
      )}
    </div>
  );
};

export default SupplierDetailsContent;
