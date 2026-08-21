import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppShell } from "./components/common/Layout";
import FeatureRoute from "./components/common/FeatureRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import POSPage from "./pages/POSPage";
import InventoryPage from "./pages/InventoryPage";
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import ReportsPage from "./pages/ReportsPage";
import ExpensesPage from "./pages/ExpensesPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import ClientsPage from "./pages/ClientsPage";
import OwnerSignupPage from "./pages/OwnerSignupPage";
import InvoicePrintA4 from "./pages/InvoicePrintA4";
import InvoicePrintThermal from "./pages/InvoicePrintThermal";
import BarcodePrintPage from "./pages/BarcodePrintPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ReturnPage from "./features/return-exchange/pages/ReturnPage";
import { PendingPage } from "./features/pending";
import InvoicesPage from "./pages/InvoicesPage";

import { createApiClient } from "./api/client";
import AppLoader from "./components/common/AppLoader";
import setupCacheDebugTools from "./utils/cacheDebugUtils";
import { showSuccess, showError } from "./utils/toastHelper";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Protected layout wrapper using React Router v6 nested routing.
 * Renders AppShell and the nested route content via <Outlet />.
 */
const ProtectedLayout = ({ user, onLogout, api }) => {
  return (
    <AppShell user={user} onLogout={onLogout} api={api}>
      <Outlet />
    </AppShell>
  );
};

/**
 * Bare protected route — requires login but renders WITHOUT the AppShell
 * (no sidebar/header/bottom-nav in the DOM at all).
 *
 * Print/receipt pages must use this instead of ProtectedLayout. Relying on
 * `@media print` / `print:hidden` CSS to hide the app shell only works
 * reliably on desktop browsers going through a real print engine. Many
 * Android wireless/Bluetooth thermal-printer bridge apps capture the page
 * more literally and don't consistently strip fixed-position shell chrome,
 * so the sidebar/header/nav ends up "printing" instead of the receipt, or
 * the layout gets pushed off the roll width. Keeping the shell out of the
 * DOM entirely removes that failure mode regardless of how the print is
 * actually carried out on the device.
 */
const BareProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const accessTokenRef = React.useRef(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Initialize cache debug tools on mount
  useEffect(() => {
    setupCacheDebugTools();
  }, []);

  /**
   * ✅ Logout: clear refresh cookie on backend + clear local auth state
   * - Never assume logout API succeeds; always clear local state.
   */
  const handleLogout = useCallback(async () => {
    try {
      // Clear refresh cookie (server should set cookie expiry / empty cookie)
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        showSuccess("Logged out successfully");
      } else {
        showError("Logout failed, but clearing session");
      }
    } catch (e) {
      // Network error or other issues
      showError("Logout error, but clearing session");
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  /**
   * ✅ Create ONE api client instance.
   * Important: we pass functions so interceptors always pull latest token.
   * We DO NOT recreate api on re-renders (prevents duplicate interceptors).
   */
  const api = useMemo(() => {
    return createApiClient(
      () => accessTokenRef.current, // getter always reads latest value
      (token) => {
        accessTokenRef.current = token;
        setAccessToken(token);
      },
      () => handleLogout(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // create once

  /**
   * ✅ On app load: silently refresh access token using cookie-based refresh token.
   * - If success: set accessToken and optionally user.
   * - If fail: clear local auth state.
   */
  useEffect(() => {
    const tryRefresh = async () => {
      setLoadingAuth(true);
      try {
        const res = await fetch(`${API_URL}/auth/refresh-token`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();

        if (data?.accessToken) {
          accessTokenRef.current = data.accessToken;
          setAccessToken(data.accessToken);
        }

        // If your refresh endpoint returns user, this will populate immediately
        if (data?.user) setUser(data.user);
      } catch (err) {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoadingAuth(false);
      }
    };

    tryRefresh();
  }, []);

  const handleLogin = useCallback((userData, token) => {
    accessTokenRef.current = token;
    setUser(userData);
    setAccessToken(token);
  }, []);

  if (loadingAuth) {
    return (
      <AppShell user={user} onLogout={handleLogout} api={api}>
        <div className="flex items-center justify-center w-full h-full min-h-full">
          <AppLoader
            open
            variant="inline"
            title="Loading session"
            subtitle="Checking your session"
          />
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerClassName="pointer-events-none print:hidden"
      />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={<LoginPage onLogin={handleLogin} api={api} />}
        />
        <Route path="/signup" element={<OwnerSignupPage api={api} />} />
        <Route path="/forgot-password" element={<ForgotPassword api={api} />} />
        <Route path="/reset-password" element={<ResetPassword api={api} />} />

        {/* Protected routes (nested via Outlet) */}
        <Route
          element={
            user ? (
              <ProtectedLayout user={user} onLogout={handleLogout} api={api} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <FeatureRoute featureId="dashboard" user={user}>
                <DashboardPage api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <FeatureRoute featureId="pos" user={user}>
                <POSPage api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <FeatureRoute featureId="inventory" user={user}>
                <InventoryPage api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <FeatureRoute featureId="customers" user={user}>
                <CustomersPage api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <FeatureRoute featureId="suppliers" user={user}>
                <SuppliersPage api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <FeatureRoute featureId="reports" user={user}>
                <ReportsPage api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <FeatureRoute featureId="expenses" user={user}>
                <ExpensesPage api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/users"
            element={
              <FeatureRoute featureId="users" user={user}>
                <UsersPage user={user} api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <FeatureRoute featureId="settings" user={user}>
                <SettingsPage user={user} api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <FeatureRoute featureId="clients" user={user}>
                <ClientsPage user={user} api={api} />
              </FeatureRoute>
            }
          />

          <Route
            path="/return-exchange"
            element={
              <FeatureRoute featureId="return-exchange" user={user}>
                <ReturnPage api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/pending"
            element={
              <FeatureRoute featureId="pos" user={user}>
                <PendingPage api={api} />
              </FeatureRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <FeatureRoute featureId="invoices" user={user}>
                <InvoicesPage api={api} />
              </FeatureRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Print/receipt routes — deliberately OUTSIDE ProtectedLayout so
            the app shell (sidebar/header/bottom nav) is never in the DOM
            for these pages. See BareProtectedRoute for why. */}
        <Route
          path="/invoice/a4/:id"
          element={
            <BareProtectedRoute user={user}>
              <InvoicePrintA4 api={api} />
            </BareProtectedRoute>
          }
        />
        <Route
          path="/invoice/thermal/:id"
          element={
            <BareProtectedRoute user={user}>
              <InvoicePrintThermal api={api} />
            </BareProtectedRoute>
          }
        />
        <Route
          path="/invoice/:id"
          element={
            <BareProtectedRoute user={user}>
              <InvoicePrintA4 api={api} />
            </BareProtectedRoute>
          }
        />
        <Route
          path="/barcode/:id"
          element={
            <BareProtectedRoute user={user}>
              <BarcodePrintPage api={api} />
            </BareProtectedRoute>
          }
        />
        <Route
          path="/grnDetailsModal"
          element={
            <BareProtectedRoute user={user}>
              <BarcodePrintPage api={api} />
            </BareProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
