import React, { useEffect, useState } from "react";
import AppLoader from "../components/common/AppLoader";
import { getSettings, updateSettings } from "../api/settings/settings";
import { colors } from "../themes/colors";
import { PageHeader } from "../components/common";

const SettingsPage = ({ user, api }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const [logoError, setLogoError] = useState("");

  // Shared shape for the settings object, used both when loading from the
  // server and after a save response, so the two stay in sync.
  const normalizeSettings = (data) => ({
    shopName: data.shopName || "",
    shopLogo: data.shopLogo || "",
    shopAddress: data.shopAddress || "",
    shopPhone: data.shopPhone || "",
    shopWhatsapp: data.shopWhatsapp || "",
    vatRegNo: data.vatRegNo || "",
    vatRate: data.vatRate ?? 0.15,
    currency: data.currency || "LKR",
    currencySymbol: data.currencySymbol || "Rs.",
    currencyPosition: data.currencyPosition || "before",
  });

  // Common currency options
  const currencyOptions = [
    { code: "LKR", symbol: "Rs.", name: "Sri Lankan Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "SAR", symbol: "ر.س", name: "Saudi Riyal" },
  ];

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getSettings(api);
      setSettings(normalizeSettings(data));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: name === "vatRate" ? Number(value) : value,
    }));
  };

  const handleCurrencyChange = (e) => {
    const selectedCode = e.target.value;
    const selectedCurrency = currencyOptions.find(
      (c) => c.code === selectedCode,
    );
    if (selectedCurrency) {
      setSettings((prev) => ({
        ...prev,
        currency: selectedCurrency.code,
        currencySymbol: selectedCurrency.symbol,
      }));
    }
  };

  // Reads the chosen image, downsizes it to a max 400px edge and
  // re-encodes it as a JPEG (or keeps PNG for transparency), then stores
  // it as a base64 data URL directly on `settings.shopLogo`. Resizing
  // client-side keeps the payload well under the backend's JSON body
  // limit (see server.js) and keeps the invoice pages fast to render —
  // there's no file storage set up for this project, so the logo travels
  // inline with the rest of the settings document.
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setLogoError("");

    if (!file.type.startsWith("image/")) {
      setLogoError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Image is too large (max 5MB).");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setLogoError("Failed to read the image.");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => setLogoError("Failed to read the image.");
      img.onload = () => {
        const maxEdge = 400;
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const keepPng = file.type === "image/png";
        const dataUrl = canvas.toDataURL(
          keepPng ? "image/png" : "image/jpeg",
          0.9,
        );
        setSettings((prev) => ({ ...prev, shopLogo: dataUrl }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoError("");
    setSettings((prev) => ({ ...prev, shopLogo: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError("Only admin or owner users can change settings.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await updateSettings(api, settings);
      setSettings(normalizeSettings(data));
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const labelBase = "block mb-1.5 text-xs font-bold tracking-wide select-none";
  const helperBase = "mt-1 text-[10px] leading-4";
  const inputBase =
    "w-full rounded-2xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 " +
    "shadow-sm focus:shadow-md disabled:opacity-70 disabled:cursor-not-allowed placeholder:opacity-60";
  const textareaBase =
    "w-full rounded-2xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 " +
    "shadow-sm focus:shadow-md disabled:opacity-70 disabled:cursor-not-allowed resize-y min-h-[84px]";
  const buttonBase =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold " +
    "transition-all duration-200 ease-out shadow-sm hover:shadow-md active:scale-[0.99] " +
    "disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer";
  const cardShell = "rounded-3xl p-4 sm:p-5 transition-all duration-300";

  return (
    <div
      className="min-h-[calc(100vh-2rem)] w-full"
      style={{ background: colors.background.primary }}
    >
      <div className="w-full max-w-6xl px-3 py-4 mx-auto sm:px-4 sm:py-6 lg:px-6">
        <PageHeader
          icon="⚙️"
          title="Shop & VAT Settings"
          description="Manage shop details (used on invoices) and VAT rate. Changes affect new bills immediately."
          action={
            <div
              className="p-3 rounded-3xl sm:p-4"
              style={{
                background: colors.background.secondary,
                border: `1px solid ${colors.border.light}`,
                boxShadow: "0 12px 34px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p
                    className="text-[11px] sm:text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    Logged in as{" "}
                    <span
                      className="font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {user?.name}
                    </span>
                  </p>
                  <p
                    className="text-[11px] sm:text-xs capitalize"
                    style={{ color: colors.text.secondary }}
                  >
                    Role:{" "}
                    <span
                      className="font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {user?.role}
                    </span>
                  </p>

                  {!isAdmin && (
                    <p
                      className="mt-1 text-[11px] sm:text-xs font-bold"
                      style={{ color: colors.error.DEFAULT }}
                    >
                      Only admin or owner can update settings (view only).
                    </p>
                  )}
                </div>

                <div
                  className="h-9 w-9 shrink-0 rounded-2xl"
                  style={{
                    background: isAdmin
                      ? colors.status.success.bg
                      : colors.error.subtle,
                    border: `1px solid ${colors.border.light}`,
                  }}
                  title={isAdmin ? "Admin access" : "Limited access"}
                />
              </div>
            </div>
          }
        />

        {/* AppLoader - Shows beneath PageHeader during initial load */}
        {loading && !settings && (
          <AppLoader
            open
            variant="inline"
            title="Loading settings"
            subtitle="Preparing your configuration"
            tone="primary"
          />
        )}

        {/* Error state - shows when settings fail to load */}
        {!loading && !settings && (
          <div
            className="px-3 py-2 text-sm rounded-2xl"
            style={{
              background: colors.error.subtle,
              border: `1px solid ${colors.border.light}`,
              color: colors.error.active,
            }}
          >
            Failed to load settings. Please try again.
          </div>
        )}

        {/* Main settings form - only show when loaded */}
        {settings && (
          <div
            className={cardShell}
            style={{
              background: colors.background.secondary,
              border: `1px solid ${colors.border.light}`,
              boxShadow: "0 14px 44px rgba(15, 23, 42, 0.08)",
            }}
          >
            {/* Alerts */}
            <div className="space-y-2">
              {error && (
                <div
                  className="rounded-2xl px-3 py-2 text-sm animate-[fadeIn_240ms_ease-out]"
                  style={{
                    background: colors.error.subtle,
                    border: `1px solid ${colors.border.light}`,
                    color: colors.error.active,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 inline-block h-2 w-2 rounded-full animate-pulse"
                      style={{ background: colors.error.DEFAULT }}
                      aria-hidden="true"
                    />
                    <p className="leading-5">{error}</p>
                  </div>
                </div>
              )}

              {message && (
                <div
                  className="rounded-2xl px-3 py-2 text-sm animate-[fadeIn_240ms_ease-out]"
                  style={{
                    background: colors.status.success.bg,
                    border: `1px solid ${colors.border.light}`,
                    color: colors.status.success.text,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 inline-block h-2 w-2 rounded-full animate-pulse"
                      style={{ background: colors.status.success.DEFAULT }}
                      aria-hidden="true"
                    />
                    <p className="leading-5">{message}</p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-5">
              {/* Shop Info */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label
                    className={labelBase}
                    style={{ color: colors.text.secondary }}
                  >
                    Shop logo
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
                      style={{
                        background: colors.background.secondary,
                        border: `1px solid ${colors.border.light}`,
                      }}
                    >
                      {settings.shopLogo ? (
                        <img
                          src={settings.shopLogo}
                          alt="Shop logo preview"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span
                          className="text-[10px] text-center px-1"
                          style={{ color: colors.text.tertiary }}
                        >
                          No logo
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="btn-primary text-xs cursor-pointer w-fit"
                        style={{
                          opacity: isAdmin ? 1 : 0.6,
                          pointerEvents: isAdmin ? "auto" : "none",
                        }}
                      >
                        Upload logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          disabled={!isAdmin}
                          className="hidden"
                        />
                      </label>
                      {settings.shopLogo && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          disabled={!isAdmin}
                          className="text-xs font-semibold underline w-fit disabled:opacity-60"
                          style={{ color: colors.error.DEFAULT }}
                        >
                          Remove logo
                        </button>
                      )}
                    </div>
                  </div>
                  <p
                    className={helperBase}
                    style={{ color: colors.text.tertiary }}
                  >
                    Printed at the top of both the A4 and thermal receipt
                    invoices, above the shop name.
                  </p>
                  {logoError && (
                    <p
                      className="mt-1 text-[10px]"
                      style={{ color: colors.error.DEFAULT }}
                    >
                      {logoError}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={labelBase}
                    style={{ color: colors.text.secondary }}
                  >
                    Shop name
                  </label>
                  <input
                    name="shopName"
                    className={inputBase}
                    value={settings.shopName}
                    onChange={handleChange}
                    disabled={!isAdmin}
                    style={{
                      background: colors.background.secondary,
                      color: colors.text.primary,
                      border: `1px solid ${colors.border.light}`,
                      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className={labelBase}
                    style={{ color: colors.text.secondary }}
                  >
                    VAT Reg. No.
                  </label>
                  <input
                    name="vatRegNo"
                    className={inputBase}
                    value={settings.vatRegNo}
                    onChange={handleChange}
                    disabled={!isAdmin}
                    style={{
                      background: colors.background.secondary,
                      color: colors.text.primary,
                      border: `1px solid ${colors.border.light}`,
                      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                    }}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label
                    className={labelBase}
                    style={{ color: colors.text.secondary }}
                  >
                    Shop address
                  </label>
                  <textarea
                    name="shopAddress"
                    className={textareaBase}
                    value={settings.shopAddress}
                    onChange={handleChange}
                    disabled={!isAdmin}
                    style={{
                      background: colors.background.secondary,
                      color: colors.text.primary,
                      border: `1px solid ${colors.border.light}`,
                      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                    }}
                  />
                </div>
              </div>

              {/* Contact */}
              <div
                className="p-4 rounded-3xl sm:p-5"
                style={{
                  background: colors.background.subtle,
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3
                      className="text-sm font-bold tracking-tight"
                      style={{ color: colors.text.primary }}
                    >
                      Contact Details
                    </h3>
                    <p
                      className="text-[11px] sm:text-xs"
                      style={{ color: colors.text.tertiary }}
                    >
                      These are used on invoices and customer receipts.
                    </p>
                  </div>

                  <div
                    className="w-10 h-10 rounded-2xl"
                    style={{
                      background: colors.accent.subtle,
                      border: `1px solid ${colors.border.light}`,
                    }}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label
                      className={labelBase}
                      style={{ color: colors.text.secondary }}
                    >
                      Phone
                    </label>
                    <input
                      name="shopPhone"
                      className={inputBase}
                      value={settings.shopPhone}
                      onChange={handleChange}
                      disabled={!isAdmin}
                      style={{
                        background: colors.background.secondary,
                        color: colors.text.primary,
                        border: `1px solid ${colors.border.light}`,
                        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className={labelBase}
                      style={{ color: colors.text.secondary }}
                    >
                      WhatsApp
                    </label>
                    <input
                      name="shopWhatsapp"
                      className={inputBase}
                      value={settings.shopWhatsapp}
                      onChange={handleChange}
                      disabled={!isAdmin}
                      style={{
                        background: colors.background.secondary,
                        color: colors.text.primary,
                        border: `1px solid ${colors.border.light}`,
                        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                      }}
                    />
                  </div>

                  <div className="hidden md:block" />
                </div>
              </div>

              {/* VAT + Currency */}
              <div className="grid gap-4 lg:grid-cols-3">
                {/* VAT card */}
                <div
                  className="p-4 rounded-3xl sm:p-5 lg:col-span-1"
                  style={{
                    background: colors.background.secondary,
                    border: `1px solid ${colors.border.light}`,
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                  }}
                >
                  <h3
                    className="text-sm font-bold tracking-tight"
                    style={{ color: colors.text.primary }}
                  >
                    VAT
                  </h3>
                  <p
                    className="mt-1 text-[11px] sm:text-xs"
                    style={{ color: colors.text.tertiary }}
                  >
                    Update the VAT rate for tax invoices.
                  </p>

                  <div className="mt-4">
                    <label
                      className={labelBase}
                      style={{ color: colors.text.secondary }}
                    >
                      VAT rate (%)
                    </label>
                    <input
                      name="vatRate"
                      type="number"
                      step="1"
                      className={inputBase}
                      value={settings.vatRate}
                      onChange={handleChange}
                      onWheel={(e) => e.target.blur()}
                      disabled={!isAdmin}
                      style={{
                        background: colors.background.secondary,
                        color: colors.text.primary,
                        border: `1px solid ${colors.border.light}`,
                        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                      }}
                    />
                    <p
                      className={helperBase}
                      style={{ color: colors.text.tertiary }}
                    >
                      Example: enter <span className="font-bold">15</span> for
                      15% VAT.
                    </p>
                  </div>

                  <div
                    className="p-3 mt-4 rounded-2xl"
                    style={{
                      background: colors.background.subtle,
                      border: `1px solid ${colors.border.light}`,
                    }}
                  >
                    <p
                      className="text-[11px] leading-5"
                      style={{ color: colors.text.secondary }}
                    >
                      VAT is applied only when issuing a{" "}
                      <span
                        className="font-bold"
                        style={{ color: colors.text.primary }}
                      >
                        Tax Invoice
                      </span>{" "}
                      and only on items marked as{" "}
                      <span
                        className="font-bold"
                        style={{ color: colors.text.primary }}
                      >
                        Tax applicable
                      </span>{" "}
                      in the item master.
                    </p>
                  </div>
                </div>

                {/* Currency card */}
                <div
                  className="p-4 rounded-3xl sm:p-5 lg:col-span-2"
                  style={{
                    background: colors.background.secondary,
                    border: `1px solid ${colors.border.light}`,
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3
                        className="text-sm font-bold tracking-tight"
                        style={{ color: colors.text.primary }}
                      >
                        Currency Preferences
                      </h3>
                      <p
                        className="mt-1 text-[11px] sm:text-xs"
                        style={{ color: colors.text.tertiary }}
                      >
                        Choose currency, symbol and placement for receipts &
                        invoices.
                      </p>
                    </div>

                    <div
                      className="w-10 h-10 rounded-2xl"
                      style={{
                        background: colors.primary.subtle,
                        border: `1px solid ${colors.border.light}`,
                      }}
                    />
                  </div>

                  <div className="grid gap-3 mt-4 md:grid-cols-3">
                    <div>
                      <label
                        className={labelBase}
                        style={{ color: colors.text.secondary }}
                      >
                        Currency
                      </label>
                      <div className="relative">
                        <select
                          name="currency"
                          className={
                            inputBase + " cursor-pointer appearance-none pr-10"
                          }
                          value={settings.currency}
                          onChange={handleCurrencyChange}
                          disabled={!isAdmin}
                          style={{
                            background: colors.background.secondary,
                            color: colors.text.primary,
                            border: `1px solid ${colors.border.light}`,
                            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                          }}
                        >
                          {currencyOptions.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                              {curr.code} - {curr.name}
                            </option>
                          ))}
                        </select>

                        <div className="absolute inset-y-0 flex items-center pointer-events-none right-3">
                          <div
                            className="h-2.5 w-2.5 rotate-45 rounded-[3px]"
                            style={{
                              borderRight: `2px solid ${colors.text.tertiary}`,
                              borderBottom: `2px solid ${colors.text.tertiary}`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        className={labelBase}
                        style={{ color: colors.text.secondary }}
                      >
                        Currency Symbol
                      </label>
                      <input
                        name="currencySymbol"
                        className={inputBase}
                        value={settings.currencySymbol}
                        onChange={handleChange}
                        disabled={!isAdmin}
                        placeholder="Rs."
                        style={{
                          background: colors.background.secondary,
                          color: colors.text.primary,
                          border: `1px solid ${colors.border.light}`,
                          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        className={labelBase}
                        style={{ color: colors.text.secondary }}
                      >
                        Symbol Position
                      </label>
                      <div className="relative">
                        <select
                          name="currencyPosition"
                          className={
                            inputBase + " cursor-pointer appearance-none pr-10"
                          }
                          value={settings.currencyPosition}
                          onChange={handleChange}
                          disabled={!isAdmin}
                          style={{
                            background: colors.background.secondary,
                            color: colors.text.primary,
                            border: `1px solid ${colors.border.light}`,
                            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
                          }}
                        >
                          <option value="before">
                            Before amount (Rs. 100)
                          </option>
                          <option value="after">After amount (100 Rs.)</option>
                        </select>

                        <div className="absolute inset-y-0 flex items-center pointer-events-none right-3">
                          <div
                            className="h-2.5 w-2.5 rotate-45 rounded-[3px]"
                            style={{
                              borderRight: `2px solid ${colors.text.tertiary}`,
                              borderBottom: `2px solid ${colors.text.tertiary}`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-3 rounded-2xl p-3 sm:p-4 animate-[fadeIn_240ms_ease-out]"
                    style={{
                      background: colors.accent.subtle,
                      border: `1px solid ${colors.border.light}`,
                    }}
                  >
                    <p
                      className="text-[11px] sm:text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      <span
                        className="font-bold"
                        style={{ color: colors.text.primary }}
                      >
                        Preview:
                      </span>{" "}
                      <span
                        className="font-bold"
                        style={{ color: colors.primary.DEFAULT }}
                      >
                        {settings.currencyPosition === "before"
                          ? `${settings.currencySymbol} 1,234.50`
                          : `1,234.50 ${settings.currencySymbol}`}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div
                className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderTop: `1px solid ${colors.border.light}` }}
              >
                <div
                  className="rounded-2xl px-3 py-2 text-[11px] sm:text-xs"
                  style={{
                    background: colors.background.subtle,
                    border: `1px solid ${colors.border.light}`,
                    color: colors.text.tertiary,
                  }}
                >
                  {isAdmin ? (
                    <span>
                      You have permission to update settings. Changes apply
                      immediately.
                    </span>
                  ) : (
                    <span>
                      View-only mode. Ask an admin/owner to update these
                      settings.
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className={
                    buttonBase +
                    " hover:-translate-y-[1px] active:translate-y-0 bg-primary text-white hover:bg-primary/90"
                  }
                  disabled={!isAdmin || saving}
                >
                  💾 Save settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* mobile bottom spacing */}
        <div className="h-2 sm:h-4" />
      </div>
    </div>
  );
};

export default SettingsPage;
