import React from "react";
import CustomerSelector from "../customer/CustomerSelector";

const POSCustomerSection = ({
  customer,
  setCustomer,
  filteredCustomers,
  customers,
  setShowCustomerModal,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-base font-bold text-text-primary sm:text-lg sm:mb-4">
          Customer Information
        </h3>
        <p className="mb-4 text-xs text-text-secondary sm:text-sm">
          Required for{" "}
          <span className="font-semibold text-primary">credit sales</span>,
          optional for cash sales.
        </p>

        <CustomerSelector
          customers={filteredCustomers.length ? filteredCustomers : customers}
          value={customer}
          onChange={setCustomer}
          onAddNew={() => setShowCustomerModal(true)}
          showBalances={true}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />
      </div>
    </div>
  );
};

export default POSCustomerSection;
