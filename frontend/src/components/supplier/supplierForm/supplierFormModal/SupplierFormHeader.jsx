// src/components/supplier/SupplierFormHeader.jsx
import React from "react";
import CloseButton from "../../../common/CloseButton";

const SupplierFormHeader = ({ isEdit, onClose }) => {
  return (
    <div className="sticky top-0 z-10 border-b border-gray-200 bg-background-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-background-secondary/80">
      <div className="flex items-start justify-between gap-4 p-4 sm:items-center sm:p-4">
        <div className="min-w-0">
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-primary sm:text-2xl">
            {isEdit ? "Edit Supplier" : "Add New Supplier"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-primary">
            {isEdit
              ? "Update supplier information"
              : "Fill in the details to add a new supplier"}
          </p>
        </div>

        <CloseButton
          onClick={onClose}
          size="lg"
          ariaLabel="Close supplier form"
        />
      </div>
    </div>
  );
};

export default SupplierFormHeader;
