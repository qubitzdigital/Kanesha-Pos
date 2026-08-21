import React, { useEffect, useState } from "react";
import AppLoader from "../components/common/AppLoader";
import {
  getDailySalesReport,
  getInventoryValue,
  getProfitReport,
  getCustomerCreditReport,
  getLowStockItems,
} from "../api/reports/reports";
import { createApiClient } from "../api/client";
import { loadCurrencySettings } from "../api/settings/settings";
import { formatCurrency } from "../utils/currency";

const OwnerDashboardPage = () => {
  const [daily, setDaily] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [profit, setProfit] = useState(null);
  const [customerCredit, setCustomerCredit] = useState(0);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");

  const getAccessToken = () => localStorage.getItem("accessToken") || "";
  const setAccessToken = (token) => localStorage.setItem("accessToken", token);
  const logout = () => localStorage.removeItem("accessToken");
  const api = createApiClient(getAccessToken, setAccessToken, logout);

  const load = async () => {
    setLoading(true);
    try {
      const [
        dailyRes,
        invRes,
        profitRes,
        custRes,
        lowStockRes,
        currencySettings,
      ] = await Promise.all([
        getDailySalesReport(),
        getInventoryValue(),
        getProfitReport(),
        getCustomerCreditReport(),
        getLowStockItems(),
        loadCurrencySettings(api),
      ]);

      setDaily(dailyRes);
      setInventory(invRes);
      setProfit(profitRes);
      setCustomerCredit(
        (custRes || []).reduce((sum, c) => sum + (c.currentBalance || 0), 0),
      );
      setLowStockItems(lowStockRes || []);
      setCurrencySymbol(currencySettings.currencySymbol);
      setCurrencyPosition(currencySettings.currencyPosition);
    } catch (e) {
      // basic fail-safe
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const todaySales = daily ? daily.total : 0;
  const todayBills = daily ? daily.count : 0;
  const inventoryValue = inventory ? inventory.totalValue : 0;
  const lowCount = lowStockItems.length;
  const netProfit = profit ? profit.netProfit : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Owner Dashboard</h2>
          <p className="text-xs text-gray-500">
            Quick mobile-friendly view of today&apos;s sales and stock alerts.
          </p>
        </div>
        <button
          className="px-3 py-1.5 rounded-full text-xs border hover:bg-soft cursor-pointer"
          onClick={load}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex justify-start py-2">
          <AppLoader
            open
            variant="inline"
            title="Loading summary"
            subtitle="Refreshing owner dashboard"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="card flex flex-col justify-between">
          <div>
            <p className="text-[11px] text-gray-500">Today&apos;s sales</p>
            <p className="mt-1 text-2xl font-semibold text-primary">
              {formatCurrency(todaySales, currencySymbol, currencyPosition)}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Bills: {todayBills}
            </p>
          </div>
        </div>

        <div className="card flex flex-col justify-between">
          <div>
            <p className="text-[11px] text-gray-500">Inventory value</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(inventoryValue, currencySymbol, currencyPosition)}
            </p>
          </div>
        </div>

        <div className="card flex flex-col justify-between">
          <div>
            <p className="text-[11px] text-gray-500">Customer credit</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(customerCredit, currencySymbol, currencyPosition)}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Outstanding across all customers
            </p>
          </div>
        </div>

        <div className="card flex flex-col justify-between">
          <div>
            <p className="text-[11px] text-gray-500">Net profit (all time)</p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(netProfit, currencySymbol, currencyPosition)}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Sales - purchases - expenses
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold">Low stock alerts ({lowCount})</p>
          <p className="text-[11px] text-gray-500">Showing up to 20 items</p>
        </div>
        <div className="max-h-72 overflow-auto -mx-2">
          <table className="min-w-full text-[11px]">
            <thead className="bg-soft">
              <tr>
                <th className="px-2 py-2 text-left">Item</th>
                <th className="px-2 py-2 text-right">Stock</th>
                <th className="px-2 py-2 text-right">Low level</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((i) => (
                <tr key={i._id} className="border-t">
                  <td className="px-2 py-1">
                    <div className="font-medium">{i.sku}</div>
                    <div className="text-[10px] text-gray-500">
                      {i.category} · {i.baseUnit}
                    </div>
                  </td>
                  <td className="px-2 py-1 text-right">
                    {i.currentStock} {i.baseUnit}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {i.lowStockLevel} {i.baseUnit}
                  </td>
                </tr>
              ))}
              {lowStockItems.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan="3"
                    className="px-2 py-3 text-center text-[11px] text-gray-500"
                  >
                    No low-stock items right now. 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
