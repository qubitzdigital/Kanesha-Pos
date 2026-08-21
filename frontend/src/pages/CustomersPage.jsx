import React, { useEffect, useState } from "react";
import AppLoader from "../components/common/AppLoader";
import CustomerDetailsModal from "../components/customer/CustomerDetailsModal";
import CustomerFormModal from "../components/customer/CustomerFormModal";
import ReceivePaymentModal from "../components/customer/ReceivePaymentModal";
import CustomerPageHeader from "../components/customer/CustomerPageHeader";
import CustomerStatsBar from "../components/customer/CustomerStatsBar";
import CustomerTable from "../components/customer/CustomerTable";
import CustomerMobileCard from "../components/customer/CustomerMobileCard";
import CustomerFooterStats from "../components/customer/CustomerFooterStats";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  receivePayment,
} from "../api/customer/customers";
import { usePrefixSearch } from "../hooks/usePrefixSearch";
import { SearchBar } from "../components/common";
import {
  showSuccess,
  showError,
  errorMessages,
  successMessages,
} from "../utils/toastHelper";
import { loadCurrencySettings } from "../api/settings/settings";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";

const CustomersPage = ({ api }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formNicError, setFormNicError] = useState(null);
  const [formPhoneError, setFormPhoneError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsCustomer, setDetailsCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Prefix search hook with debouncing
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    filteredItems: filteredCustomers,
    isSearching,
  } = usePrefixSearch(
    customers,
    (customer) => [
      customer.name,
      customer.phone,
      customer.nic,
      customer.address,
    ],
    300, // 300ms debounce
  );

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomers(api);
      setCustomers(data);
    } catch (err) {
      showError(
        err?.response?.data?.message || errorMessages.load("customers"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      const settings = await loadCurrencySettings(api);
      setCurrencySymbol(settings.currencySymbol || "Rs.");
      setCurrencyPosition(settings.currencyPosition || "before");
    } catch (err) {
      console.error("Failed to load currency settings:", err);
    }
  };

  const handleCreateOrUpdate = async (formData) => {
    setFormSaving(true);
    try {
      if (editingCustomer) {
        const updated = await updateCustomer(api, editingCustomer._id, formData);
        setCustomers((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c)),
        );
        showSuccess(successMessages.update("Customer"));
        closeFormModal();
      } else {
        const created = await createCustomer(api, formData);
        setCustomers((prev) => [...prev, created]);
        showSuccess(successMessages.create("Customer"));
        closeFormModal();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || errorMessages.save("customer");
      if (err?.response?.status === 409) {
        const msg409 = err?.response?.data?.message || "";
        if (msg409.toLowerCase().includes("phone")) {
          setFormPhoneError(msg409);
        } else {
          setFormNicError(msg409);
        }
      } else {
        showError(msg);
      }
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteCustomer = (customer) => setDeleteTarget(customer);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomer(api, deleteTarget._id);
      setCustomers((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      showSuccess(successMessages.delete("Customer"));
      setDeleteTarget(null);
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.delete("customer"));
    } finally {
      setDeleting(false);
    }
  };

  const handleReceivePayment = async (payload) => {
    if (!paymentCustomer) return;
    setPaymentSaving(true);
    try {
      await receivePayment(api, paymentCustomer._id, payload);
      showSuccess("Payment received successfully");
      closePaymentModal();
      loadCustomers(); // Refresh to update balance
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to receive payment");
    } finally {
      setPaymentSaving(false);
    }
  };

  const openFormModal = (customer = null) => {
    setEditingCustomer(customer);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingCustomer(null);
    setFormNicError(null);
    setFormPhoneError(null);
  };

  const openDetailsModal = (customer) => {
    setDetailsCustomer(customer);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setDetailsCustomer(null);
  };

  const openPaymentModal = (customer) => {
    setPaymentCustomer(customer);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentCustomer(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* No Toaster component needed - centralized in App.jsx */}

      {/* Header Section */}
      <CustomerPageHeader onAddNew={() => openFormModal()} />

      {/* Main Content Card */}
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl">
          {/* Search Bar */}
          <div className="px-6 py-4 bg-white border-b border-gray-200">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers by name, phone, NIC, or address..."
              isSearching={isSearching}
            />
          </div>

          {/* Table Header */}
          <CustomerStatsBar
            customers={filteredCustomers}
            searchQuery={searchQuery}
          />

          {loading ? (
            <div className="px-6 py-6">
              <AppLoader
                open
                variant="inline"
                title="Loading customers"
                subtitle="Syncing customer list"
              />
            </div>
          ) : (
            <>
              {/* Desktop Table (lg and up) */}
              <CustomerTable
                customers={filteredCustomers}
                searchQuery={searchQuery}
                onDetails={openDetailsModal}
                onEdit={openFormModal}
                onDelete={handleDeleteCustomer}
                onPayment={openPaymentModal}
                onAddNew={() => openFormModal()}
                currencySymbol={currencySymbol}
                currencyPosition={currencyPosition}
              />

              {/* Mobile / Tablet Card List */}
              <CustomerMobileCard
                customers={filteredCustomers}
                searchQuery={searchQuery}
                onDetails={openDetailsModal}
                onEdit={openFormModal}
                onDelete={handleDeleteCustomer}
                onPayment={openPaymentModal}
                onAddNew={() => openFormModal()}
                currencySymbol={currencySymbol}
                currencyPosition={currencyPosition}
              />

              {/* Table Footer */}
              <CustomerFooterStats
                customers={filteredCustomers}
                currencySymbol={currencySymbol}
                currencyPosition={currencyPosition}
              />
            </>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        open={showDetailsModal}
        customer={detailsCustomer}
        onClose={closeDetailsModal}
        currencySymbol={currencySymbol}
        currencyPosition={currencyPosition}
      />

      {/* Customer Form Modal */}
      <CustomerFormModal
        open={showFormModal}
        initialData={editingCustomer}
        onClose={closeFormModal}
        onSubmit={handleCreateOrUpdate}
        saving={formSaving}
        nicError={formNicError}
        onNicErrorClear={() => setFormNicError(null)}
        phoneError={formPhoneError}
        onPhoneErrorClear={() => setFormPhoneError(null)}
        currencySymbol={currencySymbol}
        currencyPosition={currencyPosition}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {/* Receive Payment Modal */}
      <ReceivePaymentModal
        open={showPaymentModal}
        customer={paymentCustomer}
        onClose={closePaymentModal}
        onSubmit={handleReceivePayment}
        saving={paymentSaving}
        currencySymbol={currencySymbol}
        currencyPosition={currencyPosition}
      />
    </div>
  );
};

export default CustomersPage;
