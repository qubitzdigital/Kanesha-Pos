import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import PendingTable from "../components/PendingTable";
import ConfirmDeleteModal from "../../../components/common/ConfirmDeleteModal";
import { getPendingSales, deletePendingSale } from "../api/pendingApi";
import { loadCurrencySettings } from "../../../api/settings/settings";
import { showSuccess, showError } from "../../../utils/toastHelper";

const PendingPage = ({ api }) => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");
  const [deleteId, setDeleteId] = useState(null);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPendingSales(api);
      setSales(data);
    } catch {
      showError("Failed to load pending sales");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchSales();
    loadCurrencySettings(api)
      .then((s) => {
        setCurrencySymbol(s.currencySymbol);
        setCurrencyPosition(s.currencyPosition);
      })
      .catch(() => {});
  }, [api, fetchSales]);

  const handleLoad = (sale) => {
    // Pass the pending sale to POS via navigation state so POS can restore it
    navigate("/pos", { state: { pendingSale: sale } });
  };

  const handleDelete = (id) => setDeleteId(id);

  const confirmDelete = async () => {
    try {
      await deletePendingSale(api, deleteId);
      showSuccess("Pending sale deleted");
      setSales((prev) => prev.filter((s) => s._id !== deleteId));
    } catch {
      showError("Failed to delete pending sale");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📋"
        title="Pending Sales"
        description="Bills saved as pending. Load one into the POS to complete or modify it."
        action={
          <button
            type="button"
            onClick={fetchSales}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-text-secondary shadow-soft transition hover:bg-background-subtle focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25"
          >
            🔄 Refresh
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-tertiary text-sm">
          Loading pending sales…
        </div>
      ) : (
        <PendingTable
          sales={sales}
          onLoad={handleLoad}
          onDelete={handleDelete}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />
      )}
      <ConfirmDeleteModal
        open={!!deleteId}
        title="Delete Pending Bill"
        message="Delete this pending bill? This cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default PendingPage;
