import React, { useEffect, useMemo, useState, useCallback } from "react";
import AppLoader from "../components/common/AppLoader";
import {
  createStaff,
  getUsers,
  updateStaff,
  deleteStaff,
} from "../api/users/users";
import PageHeader from "../components/common/PageHeader";
import EditStaffModal from "../components/users/EditStaffModal";
import regexValidations from "../utils/regexValidations";
import { colors } from "../themes/colors";
import {
  showSuccess,
  showError,
  errorMessages,
  successMessages,
} from "../utils/toastHelper";

const roleOptions = [
  { value: "cashier", label: "Cashier" },
  { value: "manager", label: "Manager" },
];

const UsersPage = ({ user, api }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Keep existing saving semantics (used by create/deactivate/reactivate + buttons)
  const [saving, setSaving] = useState(false);

  // Keep edit modal + saving flags (modal used for BOTH create + edit)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Track whether modal is create or edit (replaces separate create form UI only)
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingUser, setEditingUser] = useState(null);

  // Keep validations logic (same rules as before)
  const [errors, setErrors] = useState({});

  const isAdmin = user?.role === "owner" || user?.role === "admin";

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const data = await getUsers(api);
      setUsers(data || []);
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.load("users"));
    } finally {
      setLoading(false);
    }
  }, [api, isAdmin]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ---------- Validation (same logic, moved to be used by modal submit) ----------
  const validateField = useCallback(
    (fieldName, value, ctx = {}) => {
      const fieldErrors = {};
      const passwordValue = ctx.password ?? "";

      switch (fieldName) {
        case "name":
          if (!String(value || "").trim()) {
            fieldErrors.name = "Full name is required.";
          } else if (String(value || "").trim().length < 2) {
            fieldErrors.name = "Full name must be at least 2 characters.";
          } else if (!regexValidations.name.test(String(value || ""))) {
            fieldErrors.name =
              "Full name must contain letters only (spaces allowed between words).";
          }
          break;

        case "username":
          if (!String(value || "").trim()) {
            fieldErrors.username = "Username is required.";
          } else if (!regexValidations.username.test(String(value || ""))) {
            fieldErrors.username =
              "Username must be 4-20 characters, start with a letter, and contain only letters, numbers, and underscores.";
          }
          break;

        case "phone":
          if (value && !regexValidations.phone.test(String(value || ""))) {
            fieldErrors.phone =
              "Phone number must be a valid 9-digit number starting with 7 (without +94).";
          }
          break;

        case "password":
          if (!value) {
            fieldErrors.password = "Password is required.";
          } else if (!regexValidations.password.test(String(value || ""))) {
            fieldErrors.password =
              "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&).";
          }
          break;

        case "confirmPassword":
          if (!value) {
            fieldErrors.confirmPassword = "Please confirm your password.";
          } else if (String(value) !== String(passwordValue)) {
            fieldErrors.confirmPassword = "Passwords do not match.";
          }
          break;

        case "role":
          if (!value || value === "") {
            fieldErrors.role = "Please select a valid role.";
          }
          break;

        default:
          break;
      }

      return fieldErrors;
    },
    [regexValidations],
  );

  const validateCreatePayload = useCallback(
    (payload) => {
      const newErrors = {};

      const nameErrors = validateField("name", payload?.name);
      const usernameErrors = validateField("username", payload?.username);
      const phoneErrors = validateField("phone", payload?.phone);
      const passwordErrors = validateField("password", payload?.password);

      const confirmPasswordErrors = validateField(
        "confirmPassword",
        payload?.confirmPassword,
        { password: payload?.password },
      );

      const roleErrors = validateField("role", payload?.role);

      Object.assign(
        newErrors,
        nameErrors,
        usernameErrors,
        phoneErrors,
        passwordErrors,
        confirmPasswordErrors,
        roleErrors,
      );

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [validateField],
  );

  // ---------- Modal open/close ----------
  const openCreateModal = () => {
    setErrors({});
    setModalMode("create");
    setEditingUser(null);
    setShowEditModal(true);
  };

  const openEditModal = (userToEdit) => {
    setErrors({});
    setModalMode("edit");
    setEditingUser(userToEdit);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setModalMode("create");
    setErrors({});
  };

  // ---------- Create / Edit (same API logic preserved) ----------
  const handleModalSubmit = async (payload) => {
    if (!isAdmin) {
      showError("Only admin or owner can create staff users");
      return;
    }

    // CREATE
    if (modalMode === "create") {
      // Keep same validation behavior + toasts
      const ok = validateCreatePayload(payload);
      if (!ok) {
        showError(errorMessages.validation);
        return;
      }

      try {
        setEditSaving(true);

        const created = await createStaff(api, {
          name: payload.name,
          username: payload.username,
          password: payload.password,
          phone: payload.phone || undefined,
          role: payload.role,
        });

        setUsers((prev) => [created, ...prev]);
        setErrors({});
        setShowEditModal(false);
        showSuccess(successMessages.create("Staff user"));
      } catch (err) {
        showError(err?.response?.data?.message || errorMessages.create("user"));
      } finally {
        setEditSaving(false);
      }
      return;
    }

    // EDIT
    if (!editingUser) return;
    try {
      setEditSaving(true);
      const updated = await updateStaff(api, editingUser._id, payload);
      setUsers((prev) =>
        prev.map((u) => (u._id === editingUser._id ? updated : u)),
      );
      setShowEditModal(false);
      setEditingUser(null);
      setErrors({});
      showSuccess(successMessages.update("Staff user"));
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.update("user"));
    } finally {
      setEditSaving(false);
    }
  };

  // ---------- Deactivate / Reactivate (same logic preserved) ----------
  const handleDeleteClick = async (userToDelete) => {
    if (!userToDelete) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to deactivate ${userToDelete.name}? They will not be able to log in.`,
    );
    if (!confirmDelete) return;

    try {
      setSaving(true);
      await deleteStaff(api, userToDelete._id);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userToDelete._id ? { ...u, isActive: false } : u,
        ),
      );
      showSuccess(`${userToDelete.name} has been deactivated`);
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.update("user"));
    } finally {
      setSaving(false);
    }
  };

  const handleReactivateClick = async (userToReactivate) => {
    if (!userToReactivate) return;

    try {
      setSaving(true);
      const updated = await updateStaff(api, userToReactivate._id, {
        isActive: true,
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === userToReactivate._id ? updated : u)),
      );
      showSuccess(`${userToReactivate.name} has been reactivated`);
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.update("user"));
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => !!u.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [users]);

  return (
    <div
      className="min-h-[calc(100vh-2rem)] w-full"
      style={{ background: colors.background.primary }}
    >
      <div className="w-full max-w-6xl px-3 py-4 mx-auto sm:px-4 sm:py-6 lg:px-6">
        {/* Header Row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 min-w-0">
            <PageHeader
              icon="👥"
              title="User Management"
              description="Create cashier or manager accounts within your shop tenant."
            />

            {/* Mini stats */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full"
                style={{
                  background: colors.background.subtle,
                  border: `1px solid ${colors.border.light}`,
                  color: colors.text.secondary,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: colors.primary.DEFAULT }}
                />
                Total: {stats.total}
              </span>
              <span
                className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full"
                style={{
                  background: colors.status.success.bg,
                  border: `1px solid ${colors.border.light}`,
                  color: colors.status.success.text,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: colors.status.success.DEFAULT }}
                />
                Active: {stats.active}
              </span>
              <span
                className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full"
                style={{
                  background: colors.error.subtle,
                  border: `1px solid ${colors.border.light}`,
                  color: colors.error.active,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: colors.error.DEFAULT }}
                />
                Inactive: {stats.inactive}
              </span>
            </div>
          </div>

          {/* User / Access Card */}
          <div
            className="w-full rounded-3xl p-3 sm:p-4 md:w-[340px]"
            style={{
              background: colors.background.secondary,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs" style={{ color: colors.text.secondary }}>
                  Logged in as{" "}
                  <span
                    className="font-extrabold"
                    style={{ color: colors.text.primary }}
                  >
                    {user?.name}
                  </span>
                </p>
                <p
                  className="mt-1 text-xs capitalize"
                  style={{ color: colors.text.secondary }}
                >
                  Role:{" "}
                  <span
                    className="font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {user?.role}
                  </span>
                </p>

                {!isAdmin && (
                  <div
                    className="px-3 py-2 mt-3 text-xs font-semibold rounded-2xl"
                    style={{
                      background: colors.error.subtle,
                      border: `1px solid ${colors.border.light}`,
                      color: colors.error.active,
                    }}
                  >
                    Only admin or owner can manage users.
                  </div>
                )}
              </div>

              <div
                className="grid w-10 h-10 place-items-center rounded-2xl"
                style={{
                  background: colors.background.subtle,
                  border: `1px solid ${colors.border.light}`,
                  color: colors.text.secondary,
                }}
                aria-hidden="true"
              >
                <span className="text-sm">🔐</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-3 sm:flex-row">
              <button
                type="button"
                onClick={openCreateModal}
                disabled={!isAdmin || saving || loading}
                className="group inline-flex w-full cursor-pointer bg-primary items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  color: colors.button.primary.text,
                  border: `1px solid ${colors.button.primary.bg}`,
                }}
              >
                <span className="text-base transition-transform duration-200 group-hover:scale-110">
                  ＋
                </span>
                Create staff
              </button>

              <button
                type="button"
                onClick={loadUsers}
                disabled={!isAdmin || loading || saving}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: colors.background.secondary,
                  color: colors.primary.DEFAULT,
                  border: `1px solid ${colors.primary.subtle}`,
                }}
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-4 mt-5">
          <div
            className="overflow-hidden rounded-3xl"
            style={{
              background: colors.background.secondary,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            {/* Table Header */}
            <div className="flex flex-col gap-2 px-4 py-4 border-b sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h3 className="text-base font-bold tracking-tight text-accent">
                  Staff List
                </h3>
                <p
                  className="mt-1 text-xs"
                  style={{ color: colors.text.tertiary }}
                >
                  View, edit, deactivate, and reactivate staff accounts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="hidden px-3 py-2 text-xs font-semibold rounded-2xl sm:inline-flex"
                  style={{
                    background: colors.background.subtle,
                    border: `1px solid ${colors.border.light}`,
                    color: colors.text.secondary,
                  }}
                >
                  {isAdmin ? "Admin access enabled" : "Limited access"}
                </span>
              </div>
            </div>

            {/* Responsive Table Wrapper */}
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full text-left text-sm">
                <thead>
                  <tr
                    style={{
                      background: colors.table.header,
                      borderBottom: `1px solid ${colors.border.light}`,
                    }}
                  >
                    {[
                      "Name",
                      "Username",
                      "Role",
                      "Status",
                      "Created",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider"
                        style={{ color: colors.text.tertiary }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {users.map((u, idx) => {
                    const isAlt = idx % 2 === 1;
                    const isActive = !!u.isActive;

                    return (
                      <tr
                        key={u._id}
                        className="transition-colors duration-200 group"
                        style={{
                          background: isAlt
                            ? colors.table.rowAlt
                            : colors.table.row,
                          borderBottom: `1px solid ${colors.border.light}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            colors.table.rowHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isAlt
                            ? colors.table.rowAlt
                            : colors.table.row;
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl"
                              style={{
                                background: colors.background.subtle,
                                border: `1px solid ${colors.border.light}`,
                                color: colors.text.secondary,
                              }}
                              aria-hidden="true"
                            >
                              <span className="text-sm">👤</span>
                            </div>

                            <div className="min-w-0">
                              <p
                                className="text-sm font-semibold truncate"
                                style={{ color: colors.text.primary }}
                              >
                                {u.name}
                              </p>
                              <p
                                className="text-xs capitalize truncate"
                                style={{ color: colors.text.tertiary }}
                              >
                                {u.role}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td
                          className="px-4 py-3 font-medium"
                          style={{ color: colors.text.secondary }}
                        >
                          {u.username}
                        </td>

                        <td
                          className="px-4 py-3 capitalize"
                          style={{ color: colors.text.secondary }}
                        >
                          {u.role}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              background: isActive
                                ? colors.status.success.bg
                                : colors.error.subtle,
                              color: isActive
                                ? colors.status.success.text
                                : colors.error.active,
                              border: `1px solid ${colors.border.light}`,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                background: isActive
                                  ? colors.status.success.DEFAULT
                                  : colors.error.DEFAULT,
                              }}
                            />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td
                          className="px-4 py-3 text-xs"
                          style={{ color: colors.text.tertiary }}
                        >
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "-"}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              disabled={!isAdmin || saving}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer rounded-xl bg-amber-400 hover:bg-amber-500 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                              title="Edit user"
                            >
                              ✏️ Edit
                            </button>

                            {isActive ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(u)}
                                disabled={!isAdmin || saving}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer bg-red-400 hover:bg-red-500 rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Deactivate user"
                              >
                                ⏸️ Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReactivateClick(u)}
                                disabled={!isAdmin || saving}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                                style={{
                                  background: colors.status.success.bg,
                                  color: colors.status.success.text,
                                  border: `1px solid ${colors.status.success.bg}`,
                                }}
                                title="Reactivate user"
                              >
                                ✅ Reactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="max-w-sm mx-auto">
                          <div
                            className="grid w-12 h-12 mx-auto mb-3 place-items-center rounded-2xl"
                            style={{
                              background: colors.background.subtle,
                              border: `1px solid ${colors.border.light}`,
                            }}
                            aria-hidden="true"
                          >
                            <span className="text-lg">🗂️</span>
                          </div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: colors.text.primary }}
                          >
                            No users found
                          </p>
                          <p
                            className="mt-1 text-xs"
                            style={{ color: colors.text.tertiary }}
                          >
                            Create a staff account to see it listed here.
                          </p>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={openCreateModal}
                              className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0"
                              style={{
                                background: colors.button.primary.bg,
                                color: colors.button.primary.text,
                                border: `1px solid ${colors.button.primary.bg}`,
                              }}
                            >
                              Create your first staff user
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <AppLoader
                            open
                            variant="inline"
                            title="Loading users"
                            subtitle="Fetching latest staff list"
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Hint */}
            <div
              className="px-4 py-4 border-t sm:px-5"
              style={{ borderColor: colors.border.light }}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs" style={{ color: colors.text.tertiary }}>
                  Tip: Use <span className="font-semibold">Refresh</span> to
                  sync staff list after creating or updating users.
                </p>

                <span
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold w-fit rounded-2xl"
                  style={{
                    background: colors.background.subtle,
                    border: `1px solid ${colors.border.light}`,
                    color: isAdmin
                      ? colors.primary.DEFAULT
                      : colors.text.secondary,
                  }}
                >
                  <span
                    className={
                      "h-2 w-2 rounded-full " + (isAdmin ? "animate-pulse" : "")
                    }
                    style={{
                      background: isAdmin
                        ? colors.primary.DEFAULT
                        : colors.text.tertiary,
                    }}
                  />
                  {isAdmin ? "You can manage users" : "You can view only"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile spacing */}
        <div className="h-3 sm:h-6" />
      </div>

      {/* Unified Modal: Create + Edit */}
      <EditStaffModal
        open={showEditModal}
        user={editingUser}
        onClose={handleCloseEditModal}
        onSubmit={handleModalSubmit}
        saving={editSaving}
        api={api}
        // Optional props for your modal (safe even if unused)
        mode={modalMode}
        roleOptions={roleOptions}
        errors={errors}
        setErrors={setErrors}
      />
    </div>
  );
};

export default UsersPage;
