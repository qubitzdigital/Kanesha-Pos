import React, { useEffect, useState } from "react";

import CloseButton from "../common/CloseButton";
import { colors } from "../../themes/colors";
import regexValidations from "../../utils/regexValidations";
import {
  AVAILABLE_FEATURES,
  DEFAULT_FEATURES_BY_ROLE,
} from "../../utils/featurePermissions";

const roleOptions = [
  { value: "cashier", label: "Cashier" },
  { value: "manager", label: "Manager" },
];

const EditStaffModal = ({
  open,
  user,
  onClose,
  onSubmit,
  saving,
  api,
  mode = "edit",
}) => {
  const isCreateMode = mode === "create";

  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    role: "cashier",
    newPassword: "",
    confirmPassword: "",
    isActive: true,
    permissions: DEFAULT_FEATURES_BY_ROLE.cashier,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (open) {
      if (isCreateMode) {
        // Reset form for create mode
        const defaultPermissions = DEFAULT_FEATURES_BY_ROLE.cashier;
        setForm({
          name: "",
          username: "",
          phone: "",
          role: "cashier",
          newPassword: "",
          confirmPassword: "",
          isActive: true,
          permissions: defaultPermissions,
        });
      } else if (user) {
        // Load user data for edit mode
        setForm({
          name: user.name || "",
          username: user.username || "",
          phone: user.phone || "",
          role: user.role || "cashier",
          newPassword: "",
          confirmPassword: "",
          isActive: user.isActive !== false,
          permissions: Array.isArray(user.permissions)
            ? user.permissions
            : DEFAULT_FEATURES_BY_ROLE[user.role] ||
              DEFAULT_FEATURES_BY_ROLE.cashier,
        });
      }
      setErrors({});
    }
  }, [open, user, isCreateMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePermissionChange = (featureId) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(featureId)
        ? prev.permissions.filter((p) => p !== featureId)
        : [...prev.permissions, featureId],
    }));
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setForm((prev) => ({
      ...prev,
      role: newRole,
      // Auto-set default permissions for the selected role
      permissions:
        DEFAULT_FEATURES_BY_ROLE[newRole] || DEFAULT_FEATURES_BY_ROLE.cashier,
    }));
  };

  const validateField = (fieldName, value) => {
    const fieldErrors = {};

    switch (fieldName) {
      case "name":
        if (!value.trim()) {
          fieldErrors.name = "Full name is required.";
        } else if (value.trim().length < 2) {
          fieldErrors.name = "Full name must be at least 2 characters.";
        } else if (!regexValidations.name.test(value)) {
          fieldErrors.name =
            "Full name must contain letters only (spaces allowed between words).";
        }
        break;

      case "username":
        if (!value.trim()) {
          fieldErrors.username = "Username is required.";
        } else if (!regexValidations.username.test(value)) {
          fieldErrors.username =
            "Username must be 4-20 characters, start with a letter, and contain only letters, numbers, and underscores.";
        }
        break;

      case "phone":
        if (value && !regexValidations.phone.test(value)) {
          fieldErrors.phone =
            "Phone number must be a valid 9-digit number starting with 7 (without +94).";
        }
        break;

      case "newPassword":
        if (isCreateMode && !value) {
          fieldErrors.newPassword = "Password is required.";
        } else if (value && !regexValidations.password.test(value)) {
          fieldErrors.newPassword =
            "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&).";
        }
        break;

      case "confirmPassword":
        if (isCreateMode && !value) {
          fieldErrors.confirmPassword = "Please confirm your password.";
        } else if (value !== form.newPassword) {
          fieldErrors.confirmPassword = "Passwords do not match.";
        }
        break;

      default:
        break;
    }

    return fieldErrors;
  };

  const validateForm = () => {
    const newErrors = {};

    const nameErrors = validateField("name", form.name);
    const phoneErrors = validateField("phone", form.phone);
    const newPasswordErrors = validateField("newPassword", form.newPassword);
    const confirmPasswordErrors = validateField(
      "confirmPassword",
      form.confirmPassword,
    );

    // Validate username in create mode
    if (isCreateMode) {
      const usernameErrors = validateField("username", form.username);
      Object.assign(newErrors, usernameErrors);
    }

    Object.assign(
      newErrors,
      nameErrors,
      phoneErrors,
      newPasswordErrors,
      confirmPasswordErrors,
    );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      name: form.name,
      phone: form.phone || undefined,
      role: form.role,
      permissions: form.permissions,
    };

    // Add username for create mode
    if (isCreateMode) {
      payload.username = form.username;
      payload.password = form.newPassword;
      payload.confirmPassword = form.confirmPassword;
    } else {
      // Only include password if provided in edit mode
      payload.isActive = form.isActive;
      if (form.newPassword) {
        payload.password = form.newPassword;
      }
    }

    await onSubmit(payload);
  };

  if (!open) return null;

  const inputBase =
    "w-full rounded-2xl px-3.5 py-2.5 text-sm outline-none transition-all duration-200 " +
    "shadow-sm focus:shadow-md " +
    "disabled:opacity-70 disabled:cursor-not-allowed " +
    "placeholder:opacity-60";

  const labelBase =
    "block mb-1.5 text-xs font-semibold tracking-wide select-none";

  const buttonBase =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold " +
    "transition-all duration-200 ease-out " +
    "shadow-sm hover:shadow-md active:scale-[0.99] " +
    "disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/75 backdrop-blur-sm">
      <div
        className="w-full max-w-lg h-auto max-h-[calc(85vh-2rem)] duration-200 shadow-2xl rounded-3xl animate-in fade-in flex flex-col"
        style={{
          background: colors.background.secondary,
          border: `1px solid ${colors.border.light}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between flex-shrink-0 px-5 py-4 border-b sm:px-6 sm:py-5"
          style={{ borderBottomColor: colors.border.light }}
        >
          <div>
            <h2 className="text-lg font-bold tracking-tight text-accent sm:text-xl">
              {isCreateMode ? "Create Staff User" : "Edit Staff User"}
            </h2>
            <p
              className="mt-1 text-[11px] sm:text-xs"
              style={{ color: colors.text.tertiary }}
            >
              {isCreateMode
                ? "Add a new cashier or manager account"
                : `Update ${user?.name || "user"}'s details`}
            </p>
          </div>
          <CloseButton
            onClick={onClose}
            size="sm"
            variant="subtle"
            disabled={saving}
            ariaLabel="Close modal"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content Area */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto sm:p-6">
            <div>
              <label
                className={labelBase}
                style={{ color: colors.text.secondary }}
              >
                Full name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Nimal Perera"
                className={inputBase}
                style={{
                  background: colors.background.primary,
                  border: `1px solid ${colors.border.light}`,
                  color: colors.text.primary,
                }}
                disabled={saving}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {isCreateMode && (
              <div>
                <label
                  className={labelBase}
                  style={{ color: colors.text.secondary }}
                >
                  Username
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g., nimal.staff"
                  className={inputBase}
                  style={{
                    background: colors.background.primary,
                    border: `1px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  disabled={saving}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-600">{errors.username}</p>
                )}
              </div>
            )}

            <div>
              <label
                className={labelBase}
                style={{ color: colors.text.secondary }}
              >
                Phone (optional)
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="7XXXXXXXX"
                className={inputBase}
                style={{
                  background: colors.background.primary,
                  border: `1px solid ${colors.border.light}`,
                  color: colors.text.primary,
                }}
                disabled={saving}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label
                className={labelBase}
                style={{ color: colors.text.secondary }}
              >
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleRoleChange}
                className={inputBase}
                style={{
                  background: colors.background.primary,
                  border: `1px solid ${colors.border.light}`,
                  color: colors.text.primary,
                }}
                disabled={saving}
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Feature Permissions Section */}
            <div
              className="pt-2 border-t"
              style={{ borderColor: colors.border.light }}
            >
              <div className="mb-3">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  Feature Permissions
                </h3>
                <p
                  className="mt-1 text-xs"
                  style={{ color: colors.text.tertiary }}
                >
                  Select which features this user can access
                </p>
              </div>

              {/* Group features by category */}
              {["Core", "Stock", "People", "Analytics", "Finance", "Admin"].map(
                (category) => {
                  const categoryFeatures = AVAILABLE_FEATURES.filter(
                    (f) => f.category === category,
                  );
                  if (categoryFeatures.length === 0) return null;

                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      <h4
                        className="mb-2 text-xs font-semibold tracking-wide uppercase"
                        style={{ color: colors.text.secondary }}
                      >
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {categoryFeatures.map((feature) => (
                          <label
                            key={feature.id}
                            className="flex items-start gap-3 p-2 transition-colors duration-150 rounded-lg cursor-pointer hover:bg-opacity-75"
                            style={{
                              background: colors.background.primary,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(feature.id)}
                              onChange={() =>
                                handlePermissionChange(feature.id)
                              }
                              disabled={saving}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium"
                                style={{ color: colors.text.primary }}
                              >
                                {feature.icon} {feature.label}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: colors.text.tertiary }}
                              >
                                {feature.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>

            {!isCreateMode && (
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  disabled={saving}
                />
                <span style={{ color: colors.text.secondary }}>
                  Active account
                </span>
              </label>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  className={labelBase}
                  style={{ color: colors.text.secondary }}
                >
                  {isCreateMode ? "Password" : "New password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder={
                      isCreateMode ? "Set a password" : "Leave blank to keep"
                    }
                    className={inputBase}
                    style={{
                      background: colors.background.primary,
                      border: `1px solid ${colors.border.light}`,
                      color: colors.text.primary,
                      paddingRight: "2.75rem",
                    }}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={saving}
                    className="absolute text-lg transition-opacity -translate-y-1/2 right-3 top-1/2 hover:opacity-70 disabled:opacity-50"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={labelBase}
                  style={{ color: colors.text.secondary }}
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={inputBase}
                    style={{
                      background: colors.background.primary,
                      border: `1px solid ${colors.border.light}`,
                      color: colors.text.primary,
                      paddingRight: "2.75rem",
                    }}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={saving}
                    className="absolute text-lg transition-opacity -translate-y-1/2 right-3 top-1/2 hover:opacity-70 disabled:opacity-50"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer - sticky at bottom */}
          <div
            className="flex-shrink-0 p-5 space-y-3 border-t sm:p-6"
            style={{ borderColor: colors.border.light }}
          >
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className={buttonBase + " gap-2"}
                style={{
                  background: colors.background.subtle,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border.light}`,
                }}
              >
                ✕ Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={
                  buttonBase +
                  " gap-2 cursor-pointer hover:-translate-y-[1px] active:translate-y-0 bg-primary text-white hover:bg-primary/90"
                }
              >
                {isCreateMode ? "👤 Create staff" : "✏️ Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStaffModal;
