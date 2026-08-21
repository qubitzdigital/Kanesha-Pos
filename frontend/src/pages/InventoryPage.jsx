import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppLoader from "../components/common/AppLoader";
import { loadCurrencySettings } from "../api/settings/settings";
import { usePrefixSearch } from "../hooks/usePrefixSearch";
import AddItemModal from "../components/inventory/product/addProduct/AddNewItem";
import InventoryHeader from "../components/inventory/InventoryHeader";
import InventoryFilters from "../components/inventory/InventoryFilters";
import InventoryTable from "../components/inventory/InventoryTable";
import InventoryMobileCard from "../components/inventory/InventoryMobileCard";
import ItemDetailModal from "../components/inventory/ItemDetailModal";
import EditStockModal from "../components/inventory/EditStockModal";
import GRNSupplierPickerModal from "../components/inventory/GRNSupplierPickerModal";
import GRNFormModal from "../components/supplier/grnForm/grnFormModal/GRNFormModal";
import { confirmWithToast } from "../components/inventory/confirmDialog.jsx";
import * as itemApi from "../api/inventory/items";
import { loadInventoryLookups } from "../api/inventory/lookups";
import {
  showSuccess,
  showError,
  errorMessages,
  successMessages,
} from "../utils/toastHelper";

const InventoryPage = ({ api }) => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");

  // Loading states
  const [itemsLoading, setItemsLoading] = useState(false);
  const [lookupsLoading, setLookupsLoading] = useState(false);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Edit Stock modal
  const [showEditStock, setShowEditStock] = useState(false);
  const [stockItem, setStockItem] = useState(null);

  // GRN ("Receive Goods") flow — opened from an item's row action
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [grnTargetItem, setGrnTargetItem] = useState(null);
  const [grnSupplier, setGrnSupplier] = useState(null);
  const [showGRNForm, setShowGRNForm] = useState(false);

  // Lookups
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [baseUnits, setBaseUnits] = useState([
    "pcs",
    "kg",
    "ltr",
    "box",
    "pkt",
  ]); // ✅ Common units

  const {
    query: q,
    setQuery: setQ,
    filteredItems: searchFiltered,
    isSearching,
  } = usePrefixSearch(
    items,
    (item) => {
      const inv = item.inventory || {};
      return [
        item.name,
        item.sku,
        item.barcode,
        item.category,
        String(inv.onHand ?? ""),
      ];
    },
    300,
  );

  const fetchItems = async () => {
    try {
      setItemsLoading(true);
      const items = await itemApi.loadItems(api, q, lowStockOnly);
      setItems(items);
    } catch (err) {
      showError(errorMessages.load("items"));
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      setLookupsLoading(true);
      const result = await loadInventoryLookups(api, baseUnits);
      setSuppliers(result.suppliers);
      setCategories(result.categories);
      setBaseUnits(result.baseUnits);
    } catch (error) {
      showError(errorMessages.load("inventory lookups"));
    } finally {
      setLookupsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmWithToast("Delete this item? (Hard delete)");
    if (!confirmed) return;

    try {
      await itemApi.deleteItem(api, id);
      toast.success("Item deleted", { duration: 4000 });
      await fetchItems();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete item", {
        duration: 4000,
      });
    }
  };

  const openNew = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const openEditStock = (item) => {
    setStockItem(item);
    setShowEditStock(true);
  };

  // Step 1: user clicks "GRN" on an item row -> pick which supplier to receive from
  const openGRN = (item) => {
    setGrnTargetItem(item);
    setShowSupplierPicker(true);
  };

  // Step 2: supplier picked -> open the same "Receive Goods" popup used on the Suppliers page
  const handleSupplierPicked = (supplier) => {
    setGrnSupplier(supplier);
    setShowSupplierPicker(false);
    setShowGRNForm(true);
  };

  const closeGRNFlow = () => {
    setShowSupplierPicker(false);
    setShowGRNForm(false);
    setGrnSupplier(null);
    setGrnTargetItem(null);
  };

  const handleGRNSuccess = async () => {
    closeGRNFlow();
    await fetchItems();
  };

  useEffect(() => {
    fetchItems();
    fetchLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly]);

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

  const tableCategories = useMemo(() => {
    const fromItems = Array.from(
      new Set(items.map((i) => i.category).filter(Boolean)),
    );
    const fromLookups = (categories || []).filter(Boolean);
    return Array.from(new Set([...fromLookups, ...fromItems]));
  }, [items, categories]);

  const filteredItems = useMemo(() => {
    return searchFiltered.filter(
      (i) => !filterCategory || i.category === filterCategory,
    );
  }, [searchFiltered, filterCategory]);

  const handleActivate = async (id) => {
    try {
      await itemApi.activateItem(api, id);
      toast.success("Item activated", { duration: 4000 });
      await fetchItems();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to activate item", {
        duration: 4000,
      });
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await itemApi.deactivateItem(api, id);
      toast.success("Item deactivated", { duration: 4000 });
      await fetchItems();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deactivate item", {
        duration: 4000,
      });
    }
  };

  const handlePrintBarcode = (id) => {
    navigate(`/barcode/${id}`);
  };

  const handleSearch = () => {
    fetchItems();
  };

  const handleClear = () => {
    setQ("");
    setFilterCategory("");
    fetchItems();
  };

  return (
    <div className="min-h-screen">
      {/* Loading Overlay */}
      <AppLoader
        open={itemsLoading || lookupsLoading}
        variant="overlay"
        title="Loading Inventory"
        subtitle="Fetching items and inventory data"
      />

      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-8">
        {/* Header */}
        <InventoryHeader
          onAddNew={openNew}
          lowStockOnly={lowStockOnly}
          setLowStockOnly={setLowStockOnly}
        />

        {/* Card */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl">
          {/* Search/Filter */}
          <InventoryFilters
            q={q}
            setQ={setQ}
            isSearching={isSearching}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            tableCategories={tableCategories}
            onSearch={handleSearch}
            onClear={handleClear}
          />

          {/* Desktop table */}
          <InventoryTable
            items={filteredItems}
            currencySymbol={currencySymbol}
            currencyPosition={currencyPosition}
            onEdit={openEdit}
            onEditStock={openEditStock}
            onDetails={openDetails}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onDelete={handleDelete}
            onPrintBarcode={handlePrintBarcode}
            onOpenGRN={openGRN}
            onAddNew={openNew}
            lowStockOnly={lowStockOnly}
          />

          {/* Mobile cards */}
          <InventoryMobileCard
            items={filteredItems}
            onDetails={openDetails}
            onEditStock={openEditStock}
            onAddNew={openNew}
            onOpenGRN={openGRN}
            lowStockOnly={lowStockOnly}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AddItemModal
        api={api}
        open={showForm}
        onClose={() => setShowForm(false)}
        item={editingItem}
        suppliers={suppliers}
        categories={tableCategories}
        baseUnits={baseUnits}
        onSuccess={async () => {
          setShowForm(false);
          setEditingItem(null);
          await fetchItems();
        }}
      />

      {/* Detail Modal (with batches) */}
      <ItemDetailModal
        api={api}
        item={selectedItem}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onEdit={(item) => {
          openEdit(item);
          setShowDetailModal(false);
        }}
        onEditStock={(item) => {
          openEditStock(item);
          setShowDetailModal(false);
        }}
      />

      {/* Edit Stock Modal (select batch -> edit size-wise or general stock) */}
      <EditStockModal
        api={api}
        item={stockItem}
        open={showEditStock}
        onClose={() => {
          setShowEditStock(false);
          setStockItem(null);
        }}
        onSuccess={fetchItems}
      />

      {/* Step 1: pick which supplier to receive goods from */}
      <GRNSupplierPickerModal
        open={showSupplierPicker}
        item={grnTargetItem}
        suppliers={suppliers}
        onSelect={handleSupplierPicked}
        onClose={closeGRNFlow}
      />

      {/* Step 2: same "Receive Goods" popup used from the Suppliers page,
          pre-filled with the item that was clicked */}
      <GRNFormModal
        open={showGRNForm}
        supplier={grnSupplier}
        items={items}
        existingGRN={null}
        onSuccess={handleGRNSuccess}
        onClose={closeGRNFlow}
        onItemsRefresh={fetchItems}
        suppliers={suppliers}
        categories={tableCategories}
        baseUnits={baseUnits}
        api={api}
        currencySymbol={currencySymbol}
        currencyPosition={currencyPosition}
        initialItemId={grnTargetItem?._id || null}
      />
    </div>
  );
};

export default InventoryPage;
