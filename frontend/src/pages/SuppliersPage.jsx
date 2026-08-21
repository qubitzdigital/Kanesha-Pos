// src/pages/SuppliersPage.jsx
import React, { useEffect, useState } from "react";
import AppLoader from "../components/common/AppLoader";
import { loadCurrencySettings } from "../api/settings/settings";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
import { usePrefixSearch } from "../hooks/usePrefixSearch";
import EntityCardList from "../components/common/EntityCardList";
import {
  showSuccess,
  showError,
  errorMessages,
  successMessages,
} from "../utils/toastHelper";

import GrnDetailsModal from "../components/supplier/grnDetail/GrnDetailsModal";
import { getSupplierGRNs, deleteGRN, postGRN } from "../api/supplier/grn";

import SupplierFormModal from "../components/supplier/supplierForm/supplierFormModal/SupplierFormModal";
import SupplierPayModal from "../components/supplier/supplierForm/SupplierPayModal";
import SupplierPageHeader from "../components/supplier/supplierForm/SupplierPageHeader";
import SupplierSearchBar from "../components/supplier/supplierForm/SupplierSearchBar";
import SupplierMobileCard from "../components/supplier/supplierForm/SupplierMobileCard";
import SupplierTableRow from "../components/supplier/supplierForm/SupplierTableRow";
import SupplierDetailsContent from "../components/supplier/supplierForm/SupplierDetailsContent";
import GRNFormModal from "../components/supplier/grnForm/grnFormModal/GRNFormModal";
import GRNListModal from "../components/supplier/grnDetail/GRNListModal";

import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  recordSupplierPayment,
  getCategoriesAndUnits,
} from "../api/supplier/suppliers";
import { fetchItemsForGrn } from "../api/inventory/items";

const SuppliersPage = ({ api }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");

  // Modals
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const [showPayModal, setShowPayModal] = useState(false);
  const [paySupplier, setPaySupplier] = useState(null);
  const [paySaving, setPaySaving] = useState(false);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsSupplier, setDetailsSupplier] = useState(null);

  // GRN State
  const [showGRNForm, setShowGRNForm] = useState(false);
  const [grnSupplier, setGrnSupplier] = useState(null);
  const [items, setItems] = useState([]);
  const [editingGRN, setEditingGRN] = useState(null);

  const [categories, setCategories] = useState([]);
  const [baseUnits, setBaseUnits] = useState([
    "pcs",
    "kg",
    "ltr",
    "box",
    "pkt",
  ]);

  const [showGRNsList, setShowGRNsList] = useState(false);
  const [grnsList, setGrnsList] = useState([]);
  const [loadingGRNs, setLoadingGRNs] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [showGRNDetails, setShowGRNDetails] = useState(false);

  const {
    query: q,
    setQuery: setQ,
    filteredItems: filtered,
    isSearching,
  } = usePrefixSearch(
    suppliers,
    (s) => [
      s.name,
      s.supplierCode,
      s.contactPerson,
      ...(s.phones || []),
      s.address,
    ],
    300,
  );

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers(api);
      setSuppliers(data || []);
    } catch (err) {
      showError(
        err?.response?.data?.message || errorMessages.load("suppliers"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await loadCurrencySettings(api);
        setCurrencySymbol(settings.currencySymbol || "Rs.");
        setCurrencyPosition(settings.currencyPosition || "before");
      } catch (error) {
        // Use defaults if error
      }
    };
    loadSettings();
  }, [api]);

  // ---------- Supplier Actions ----------
  const openCreate = () => {
    setEditingSupplier(null);
    setShowSupplierForm(true);
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetSupplier, setDeleteTargetSupplier] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteSupplier = (supplier) => {
    setDeleteTargetSupplier(supplier);
    setDeleteModalOpen(true);
  };

  const confirmDeleteSupplier = async () => {
    if (!deleteTargetSupplier) return;
    setDeleteLoading(true);
    try {
      await deleteSupplier(api, deleteTargetSupplier._id);
      setSuppliers((prev) =>
        prev.filter((s) => s._id !== deleteTargetSupplier._id),
      );
      showSuccess(successMessages.delete("Supplier"));
      setDeleteModalOpen(false);
      setDeleteTargetSupplier(null);
    } catch (err) {
      showError(
        err?.response?.data?.message || errorMessages.delete("supplier"),
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveSupplier = async (payload) => {
    setSavingSupplier(true);
    try {
      if (editingSupplier) {
        const updated = await updateSupplier(api, editingSupplier._id, payload);
        setSuppliers((prev) =>
          prev.map((s) => (s._id === updated._id ? updated : s)),
        );
        showSuccess(successMessages.update("Supplier"));
      } else {
        const created = await createSupplier(api, payload);
        setSuppliers((prev) => [...prev, created]);
        showSuccess(successMessages.create("Supplier"));
      }
      setShowSupplierForm(false);
      setEditingSupplier(null);
    } finally {
      setSavingSupplier(false);
    }
  };

  // ---------- Payment ----------
  const openPay = (supplier) => {
    if (Number(supplier.currentBalance || 0) <= 0) return;
    setPaySupplier(supplier);
    setShowPayModal(true);
  };

  const handleConfirmPay = async (amount) => {
    if (!paySupplier) return;

    try {
      setPaySaving(true);
      const updated = await recordSupplierPayment(api, paySupplier._id, amount);

      setSuppliers((prev) =>
        prev.map((s) => (s._id === updated._id ? updated : s)),
      );
      setShowPayModal(false);
      setPaySupplier(null);
      showSuccess("Payment recorded");
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setPaySaving(false);
    }
  };

  // ---------- GRN ----------

  const fetchItems = async () => {
    try {
      const fetched = await fetchItemsForGrn(api);
      setItems(fetched);
    } catch {
      showError(errorMessages.load("items"));
    }
  };

  const fetchCategories = async () => {
    try {
      const { categories: cats, baseUnits: units } =
        await getCategoriesAndUnits(api, baseUnits);
      setCategories(cats);
      setBaseUnits(units);
    } catch (err) {
      console.error(err);
    }
  };

  const openReceiveGoods = async (supplier) => {
    setGrnSupplier(supplier);
    setEditingGRN(null);
    if (items.length === 0) await fetchItems();
    if (categories.length === 0) await fetchCategories();
    setShowGRNForm(true);
  };

  const handleGRNSuccess = (savedGrn) => {
    const wasEditing = Boolean(editingGRN);
    const activeSupplierId = grnSupplier?._id || grnSupplier?.id || grnSupplier;

    setShowGRNForm(false);
    setEditingGRN(null);
    setGrnSupplier(null);

    if (savedGrn?._id) {
      setGrnsList((prev) => {
        const exists = prev.some((g) => g._id === savedGrn._id);
        if (exists) {
          return prev.map((g) => (g._id === savedGrn._id ? savedGrn : g));
        }

        const savedSupplierId = savedGrn.supplier?._id || savedGrn.supplier;
        if (
          activeSupplierId &&
          savedSupplierId &&
          String(savedSupplierId) === String(activeSupplierId)
        ) {
          return [savedGrn, ...prev];
        }
        return prev;
      });
    }

    showSuccess(
      savedGrn && savedGrn._id && wasEditing
        ? successMessages.update("GRN")
        : successMessages.create("GRN"),
    );
  };

  const openViewGRNs = async (supplier) => {
    try {
      setLoadingGRNs(true);
      const grns = await getSupplierGRNs(api, supplier._id);
      setGrnsList(grns || []);
      setGrnSupplier(supplier);
      setShowGRNsList(true);
    } catch {
      showError(errorMessages.load("GRNs"));
    } finally {
      setLoadingGRNs(false);
    }
  };

  const openEditGRN = async (grn) => {
    if (!grn || grn.status !== "draft") {
      showError("Only draft GRNs can be edited");
      return;
    }

    const supplierRef =
      grn.supplier && typeof grn.supplier === "object"
        ? grn.supplier
        : suppliers.find((s) => String(s._id) === String(grn.supplier));

    setEditingGRN(grn);
    setGrnSupplier(supplierRef || grnSupplier);
    if (items.length === 0) await fetchItems();
    if (categories.length === 0) await fetchCategories();
    setShowGRNForm(true);
  };

  const handleDeleteGRN = async () => {
    if (!selectedGRN) return;
    if (selectedGRN.status !== "draft") {
      showError("Only draft GRNs can be deleted");
      return;
    }
    try {
      await deleteGRN(api, selectedGRN._id);
      setGrnsList((prev) => prev.filter((g) => g._id !== selectedGRN._id));
      setShowGRNDetails(false);
      setSelectedGRN(null);
      showSuccess(successMessages.delete("GRN"));
    } catch {
      showError(errorMessages.delete("GRN"));
    }
  };

  const handlePostGRN = async () => {
    if (!selectedGRN) return;
    if (selectedGRN.status !== "draft") {
      showError("Only draft GRNs can be posted");
      return;
    }

    try {
      const posted = await postGRN(api, selectedGRN._id);
      setGrnsList((prev) =>
        prev.map((g) => (g._id === posted._id ? posted : g)),
      );
      setSelectedGRN(posted);
      setShowGRNDetails(false);
      showSuccess(successMessages.save("GRN"));
    } catch (err) {
      showError(
        err?.response?.data?.message || errorMessages.postFailed("GRN"),
      );
    }
  };

  // ---------- Show Supplier Details ----------
  const showSupplierDetails = (supplier) => {
    setDetailsSupplier(supplier);
    setShowDetailsModal(true);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* No Toaster component needed - centralized in App.jsx */}

      {/* Header */}
      <SupplierPageHeader onAddSupplier={openCreate} />

      {/* Search */}
      <div className="overflow-hidden bg-white border border-gray-100 shadow-md rounded-2xl">
        <SupplierSearchBar
          query={q}
          onQueryChange={setQ}
          isSearching={isSearching}
          onRefresh={() => { setQ(""); fetchSuppliers(); }}
          loading={loading}
          filteredCount={filtered.length}
          totalCount={suppliers.length}
        />

        {/* Mobile cards */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="px-4 py-6">
              <AppLoader
                open
                variant="inline"
                title="Loading suppliers"
                subtitle="Syncing supplier list"
              />
            </div>
          ) : (
            <EntityCardList
              items={filtered}
              renderCard={(s) => (
                <SupplierMobileCard
                  supplier={s}
                  onViewDetails={showSupplierDetails}
                  onReceiveGoods={openReceiveGoods}
                  onViewGRNs={openViewGRNs}
                  onPay={openPay}
                  onEdit={openEdit}
                  onDelete={handleDeleteSupplier}
                  currencySymbol={currencySymbol}
                  currencyPosition={currencyPosition}
                />
              )}
            />
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-left text-gray-600 uppercase">
                  Supplier
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-left text-gray-600 uppercase">
                  Terms
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-left text-gray-600 uppercase">
                  Outstanding
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-left text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6">
                    <AppLoader
                      open
                      variant="inline"
                      title="Loading suppliers"
                      subtitle="Syncing supplier list"
                    />
                  </td>
                </tr>
              ) : (
                <>
                  {filtered.map((s) => (
                    <SupplierTableRow
                      key={s._id}
                      supplier={s}
                      onViewDetails={showSupplierDetails}
                      onReceiveGoods={openReceiveGoods}
                      onViewGRNs={openViewGRNs}
                      onPay={openPay}
                      onEdit={openEdit}
                      onDelete={handleDeleteSupplier}
                      currencySymbol={currencySymbol}
                      currencyPosition={currencyPosition}
                    />
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-10 text-center text-gray-500"
                      >
                        No suppliers found
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Supplier Modal with Overlay */}
      {/* Delete Supplier Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        title="Delete Supplier?"
        message={
          deleteTargetSupplier
            ? `This action cannot be undone.\nAre you sure you want to delete ${deleteTargetSupplier.name}?`
            : ""
        }
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeleteTargetSupplier(null);
        }}
        onConfirm={confirmDeleteSupplier}
        loading={deleteLoading}
        confirmText="Delete"
        cancelText="Cancel"
      />
      {showSupplierForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0" />
          {/* Centered Modal */}
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            <SupplierFormModal
              open={true}
              editingSupplier={editingSupplier}
              saving={savingSupplier}
              onClose={() => {
                setShowSupplierForm(false);
                setEditingSupplier(null);
              }}
              onSubmit={handleSaveSupplier}
            />
          </div>
        </div>
      )}

      {/* Pay Modal */}
      <SupplierPayModal
        open={showPayModal}
        supplier={paySupplier}
        saving={paySaving}
        onClose={() => {
          setShowPayModal(false);
          setPaySupplier(null);
        }}
        onConfirm={handleConfirmPay}
        currencySymbol={currencySymbol}
        currencyPosition={currencyPosition}
      />

      {/* GRN Form Modal */}
      <GRNFormModal
        api={api}
        open={showGRNForm}
        supplier={grnSupplier}
        items={items}
        existingGRN={editingGRN}
        currencySymbol={currencySymbol}
        currencyPosition={currencyPosition}
        onSuccess={handleGRNSuccess}
        onClose={() => {
          setShowGRNForm(false);
          setGrnSupplier(null);
          setEditingGRN(null);
        }}
        onItemsRefresh={fetchItems}
        suppliers={suppliers}
        categories={categories}
        baseUnits={baseUnits}
      />

      {/* GRNs List Modal */}
      <GRNListModal
        open={showGRNsList}
        supplier={grnSupplier}
        grnsList={grnsList}
        loading={loadingGRNs}
        currencySymbol={currencySymbol}
        currencyPosition={currencyPosition}
        onClose={() => {
          setShowGRNsList(false);
          setGrnSupplier(null);
          setGrnsList([]);
        }}
        onSelectGRN={(grn) => {
          setSelectedGRN(grn);
          setShowGRNDetails(true);
        }}
      />

      {/* GRN Details Modal */}
      <GrnDetailsModal
        open={showGRNDetails}
        grn={selectedGRN}
        currencySymbol={currencySymbol}
        currencyPosition={currencyPosition}
        onClose={() => {
          setShowGRNDetails(false);
          setSelectedGRN(null);
        }}
        onEdit={
          selectedGRN?.status === "draft"
            ? () => openEditGRN(selectedGRN)
            : null
        }
        onDelete={selectedGRN?.status === "draft" ? handleDeleteGRN : null}
        onPost={selectedGRN?.status === "draft" ? handlePostGRN : null}
      />

      {/* Supplier Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {detailsSupplier?.name}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsSupplier(null);
                }}
                className="text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <SupplierDetailsContent
                supplier={detailsSupplier}
                currencySymbol={currencySymbol}
                currencyPosition={currencyPosition}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
