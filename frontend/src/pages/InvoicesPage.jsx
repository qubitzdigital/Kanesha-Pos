import React, { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import InvoicesTable from "../components/invoices/InvoicesTable";
import { getInvoices } from "../api/sales/sales";
import { loadCurrencySettings } from "../api/settings/settings";
import { showError } from "../utils/toastHelper";

const PAGE_LIMIT = 20;

const InvoicesPage = ({ api }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: PAGE_LIMIT };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await getInvoices(api, params);
      setInvoices(data.invoices || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch {
      showError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [api, page, search, status, startDate, endDate]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    loadCurrencySettings(api)
      .then((s) => {
        setCurrencySymbol(s.currencySymbol);
        setCurrencyPosition(s.currencyPosition);
      })
      .catch(() => {});
  }, [api]);

  // Reset to page 1 whenever a filter changes
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasActiveFilters = search || status || startDate || endDate;

  return (
    <div className="space-y-6">
      <PageHeader
        icon="🧾"
        title="Invoices"
        description="Browse and search past sale invoices."
        action={
          <button
            type="button"
            onClick={fetchInvoices}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-text-secondary shadow-soft transition hover:bg-background-subtle focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25"
          >
            🔄 Refresh
          </button>
        }
      />

      {/* Filters */}
      <div className="p-4 space-y-3 border border-gray-200 bg-white rounded-2xl sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="block mb-1 text-xs font-medium text-text-secondary">
              Search by Invoice #
            </label>
            <input
              type="text"
              value={search}
              onChange={handleFilterChange(setSearch)}
              placeholder="e.g. INV-0001"
              className="w-full px-3 py-2 text-sm border rounded-lg border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-text-secondary">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={handleFilterChange(setStartDate)}
              className="w-full px-3 py-2 text-sm border rounded-lg border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-text-secondary">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={handleFilterChange(setEndDate)}
              className="w-full px-3 py-2 text-sm border rounded-lg border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-text-secondary">
              Status
            </label>
            <select
              value={status}
              onChange={handleFilterChange(setStatus)}
              className="w-full px-3 py-2 text-sm bg-white border rounded-lg border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="credit">Credit</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer text-xs font-semibold text-accent hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-text-tertiary">
          Loading invoices…
        </div>
      ) : (
        <>
          <InvoicesTable
            invoices={invoices}
            currencySymbol={currencySymbol}
            currencyPosition={currencyPosition}
          />

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 px-1 sm:flex-row">
              <p className="text-xs text-text-tertiary">
                Showing page {page} of {totalPages} • {total} invoice
                {total === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-text-secondary transition hover:bg-background-subtle disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-text-secondary transition hover:bg-background-subtle disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvoicesPage;
