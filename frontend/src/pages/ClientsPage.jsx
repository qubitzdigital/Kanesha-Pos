import React, { useCallback, useEffect, useMemo, useState } from "react";
import AppLoader from "../components/common/AppLoader";
import PageHeader from "../components/common/PageHeader";
import {
  createClient,
  getClients,
  setClientStatus,
} from "../api/clients/clients";
import regexValidations from "../utils/regexValidations";
import { colors } from "../themes/colors";
import {
  showSuccess,
  showError,
  errorMessages,
  successMessages,
} from "../utils/toastHelper";

const emptyForm = {
  businessName: "",
  name: "",
  username: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const ClientsPage = ({ user, api }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const isSuperAdmin = user?.role === "superadmin";

  const loadClients = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      setLoading(true);
      const data = await getClients(api);
      setClients(data || []);
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.load("clients"));
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, api]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const validateField = useCallback((fieldName, value, ctx = {}) => {
    const passwordValue = ctx.password ?? "";

    switch (fieldName) {
      case "businessName":
        if (!String(value || "").trim()) {
          return "Business name is required.";
        }
        return "";

      case "name":
        if (!String(value || "").trim()) {
          return "Owner's full name is required.";
        }
        if (!regexValidations.name.test(String(value || ""))) {
          return "Full name must contain letters only (spaces allowed between words).";
        }
        return "";

      case "username":
        if (!String(value || "").trim()) {
          return "Username is required.";
        }
        if (!regexValidations.username.test(String(value || ""))) {
          return "Username must be 4-20 characters, start with a letter, and contain only letters, numbers, and underscores.";
        }
        return "";

      case "phone":
        if (value && !regexValidations.phone.test(String(value || ""))) {
          return "Enter a valid Sri Lankan mobile (e.g. 712345678), without +94.";
        }
        return "";

      case "password":
        if (!value) return "Password is required.";
        if (!regexValidations.password.test(String(value || ""))) {
          return "Password must be 8+ chars with uppercase, lowercase, number, and special character (@$!%*?&).";
        }
        return "";

      case "confirmPassword":
        if (!value) return "Please confirm the password.";
        if (String(value) !== String(passwordValue)) {
          return "Passwords do not match.";
        }
        return "";

      default:
        return "";
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        if (prevErrors?.[name]) {
          const msg = validateField(name, value, next);
          if (msg) nextErrors[name] = msg;
          else delete nextErrors[name];
        }
        if (name === "password" && prevErrors?.confirmPassword) {
          const confirmMsg = validateField(
            "confirmPassword",
            next.confirmPassword,
            next,
          );
          if (confirmMsg) nextErrors.confirmPassword = confirmMsg;
          else delete nextErrors.confirmPassword;
        }
        return nextErrors;
      });
      return next;
    });
  };

  const validateAll = useCallback(() => {
    const newErrors = {};
    ["businessName", "name", "username", "phone", "password"].forEach(
      (field) => {
        const msg = validateField(field, form[field]);
        if (msg) newErrors[field] = msg;
      },
    );
    const confirmMsg = validateField(
      "confirmPassword",
      form.confirmPassword,
      form,
    );
    if (confirmMsg) newErrors.confirmPassword = confirmMsg;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, validateField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    if (!validateAll()) {
      showError(errorMessages.validation);
      return;
    }

    try {
      setSaving(true);
      const created = await createClient(api, {
        businessName: form.businessName.trim(),
        name: form.name.trim(),
        username: form.username.trim(),
        phone: form.phone ? `+94${form.phone}` : undefined,
        password: form.password,
      });

      setClients((prev) => [
        {
          tenantId: created.tenantId,
          owner: created.owner,
          staffCount: 0,
          isActive: true,
          createdAt: created.owner?.createdAt || new Date().toISOString(),
        },
        ...prev,
      ]);

      setForm(emptyForm);
      setErrors({});
      showSuccess(successMessages.create("Client"));
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.create("client"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (client) => {
    try {
      setStatusSavingId(client.tenantId);
      const nextStatus = !client.isActive;
      await setClientStatus(api, client.tenantId, nextStatus);
      setClients((prev) =>
        prev.map((c) =>
          c.tenantId === client.tenantId ? { ...c, isActive: nextStatus } : c,
        ),
      );
      showSuccess(
        nextStatus
          ? successMessages.activated("Client")
          : successMessages.deactivated("Client"),
      );
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.update("client"));
    } finally {
      setStatusSavingId(null);
    }
  };

  const canSubmit = useMemo(() => {
    return (
      form.businessName &&
      form.name &&
      form.username &&
      form.password &&
      form.confirmPassword &&
      !saving
    );
  }, [form, saving]);

  const inputBase =
    "w-full rounded-2xl border bg-background-secondary px-4 py-2.5 text-sm text-text-primary shadow-soft outline-none transition placeholder:text-text-tertiary";
  const inputRing =
    "hover:border-border focus:border-border-focus focus:ring-4 focus:ring-ring-focus/25";
  const inputError = "border-red-500 focus:border-red-500";
  const inputOk = "border-gray-200";

  if (!isSuperAdmin) {
    return (
      <div
        className="min-h-[calc(100vh-2rem)] w-full flex items-center justify-center"
        style={{ background: colors.background.primary }}
      >
        <div
          className="px-6 py-5 text-sm font-semibold rounded-2xl"
          style={{
            background: colors.error.subtle,
            border: `1px solid ${colors.border.light}`,
            color: colors.error.active,
          }}
        >
          Only the super admin can manage clients.
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-2rem)] w-full"
      style={{ background: colors.background.primary }}
    >
      <div className="w-full max-w-6xl px-3 py-4 mx-auto sm:px-4 sm:py-6 lg:px-6">
        <PageHeader
          icon="🏢"
          title="Add New Client"
          description="Onboard a new customer as a brand-new, fully isolated shop tenant with its own owner login."
        />

        {/* Create client form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 p-4 mb-8 border sm:p-6 rounded-3xl md:grid-cols-2"
          style={{
            background: colors.background.secondary,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <div className="md:col-span-2">
            <label className="block mb-1.5 text-xs font-semibold tracking-wider text-text-secondary">
              BUSINESS / SHOP NAME
            </label>
            <input
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              placeholder="Ex: Kumara Hardware Stores"
              className={[
                inputBase,
                inputRing,
                errors.businessName ? inputError : inputOk,
              ].join(" ")}
            />
            {errors.businessName && (
              <p className="mt-1 text-xs text-red-500">{errors.businessName}</p>
            )}
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-semibold tracking-wider text-text-secondary">
              OWNER FULL NAME
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: Ajith Kumar"
              className={[
                inputBase,
                inputRing,
                errors.name ? inputError : inputOk,
              ].join(" ")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-semibold tracking-wider text-text-secondary">
              USERNAME
            </label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Ex: ajith_kumar"
              autoComplete="off"
              className={[
                inputBase,
                inputRing,
                errors.username ? inputError : inputOk,
              ].join(" ")}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-semibold tracking-wider text-text-secondary">
              PHONE (OPTIONAL)
            </label>
            <div className="relative">
              <span className="absolute -translate-y-1/2 left-3 top-1/2 text-xs text-text-tertiary">
                +94
              </span>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="712345678"
                className={[
                  inputBase,
                  "pl-11",
                  inputRing,
                  errors.phone ? inputError : inputOk,
                ].join(" ")}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-semibold tracking-wider text-text-secondary">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Ex: AKRacing26@"
                autoComplete="new-password"
                className={[
                  inputBase,
                  "pr-11",
                  inputRing,
                  errors.password ? inputError : inputOk,
                ].join(" ")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute -translate-y-1/2 right-3 top-1/2 text-text-tertiary hover:text-text-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-semibold tracking-wider text-text-secondary">
              CONFIRM PASSWORD
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              autoComplete="new-password"
              className={[
                inputBase,
                inputRing,
                errors.confirmPassword ? inputError : inputOk,
              ].join(" ")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 text-sm font-semibold transition-all rounded-2xl md:w-auto disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: colors.button.primary.bg,
                color: colors.button.primary.text,
              }}
            >
              <span className="text-base">＋</span>
              {saving ? "Creating client..." : "Create client"}
            </button>
          </div>
        </form>

        {/* Clients list */}
        <div
          className="p-4 border sm:p-6 rounded-3xl"
          style={{
            background: colors.background.secondary,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-text-primary">
              All clients ({clients.length})
            </h2>
            <button
              type="button"
              onClick={loadClients}
              className="px-3 py-1.5 rounded-full text-xs border hover:bg-background-subtle cursor-pointer"
              style={{
                borderColor: colors.border.light,
                color: colors.text.secondary,
              }}
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className="flex justify-start py-2">
              <AppLoader
                open
                variant="inline"
                title="Loading clients"
                subtitle="Fetching all onboarded businesses"
              />
            </div>
          )}

          <div className="-mx-2 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead style={{ background: colors.table.header }}>
                <tr>
                  <th className="px-3 py-2 text-left">Owner</th>
                  <th className="px-3 py-2 text-left">Username</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-right">Staff</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c.tenantId}
                    className="border-t"
                    style={{ borderColor: colors.border.light }}
                  >
                    <td className="px-3 py-2">
                      <div className="font-semibold text-text-primary">
                        {c.owner?.name}
                      </div>
                      <div className="text-[10px] text-text-tertiary">
                        {c.tenantId}
                      </div>
                    </td>
                    <td className="px-3 py-2">{c.owner?.username}</td>
                    <td className="px-3 py-2">{c.owner?.phone || "—"}</td>
                    <td className="px-3 py-2 text-right">{c.staffCount}</td>
                    <td className="px-3 py-2">
                      <span
                        className="px-2 py-1 rounded-full text-[10px] font-semibold"
                        style={{
                          background: c.isActive
                            ? colors.status.success.bg
                            : colors.error.subtle,
                          color: c.isActive
                            ? colors.status.success.text
                            : colors.error.active,
                        }}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c)}
                        disabled={statusSavingId === c.tenantId}
                        className="px-3 py-1 text-[11px] font-semibold rounded-full border cursor-pointer disabled:opacity-60"
                        style={{ borderColor: colors.border.light }}
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-3 py-4 text-center text-text-tertiary"
                    >
                      No clients yet. Create the first one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
