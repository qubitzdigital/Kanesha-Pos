// SupplierPageHeader.jsx
import React from "react";
import { PageHeader, ActionButton } from "../../common";

const SupplierPageHeader = ({ onAddSupplier }) => {
  return (
    <PageHeader
      icon="🏢"
      title="Supplier Management"
      description="Manage suppliers, track outstanding payments, and receive goods."
      action={
        <ActionButton
          label="Add Supplier"
          icon="+"
          onClick={onAddSupplier}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
        />
      }
    />
  );
};

export default SupplierPageHeader;
