import React from "react";
import { PageHeader, ActionButton } from "../common";

const CustomerPageHeader = ({ onAddNew }) => {
  return (
    <PageHeader
      icon="👥"
      title="Customer Management"
      description="Manage customer profiles, track credit limits, and process payments in one centralized view."
      action={
        <ActionButton
          label="Add New Customer"
          icon="+"
          onClick={onAddNew}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
        />
      }
    />
  );
};

export default CustomerPageHeader;
