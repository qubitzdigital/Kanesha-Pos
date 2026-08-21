import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import regexValidations from "../utils/regexValidations";
import { showSuccess, showError } from "../utils/toastHelper";
import TypewriterText from "../components/TypewriterText";

export default function ResetPassword({ api }) {
  const location = useLocation();
  const phone = location.state?.phone;

  const [form, setForm] = useState({ password: "", confirmPassword: "" });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [headerComplete, setHeaderComplete] = useState(false);

  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!regexValidations.password.test(form.password)) {
      newErrors.password =
        "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.";
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  }, [form]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      try {
        setSaving(true);
        await api.post("/auth/reset-password", {
          phone,
          password: form.password,
        });
        showSuccess("Password reset successful. Please log in.");
        setTimeout(() => navigate("/login"), 1000);
      } catch (err) {
        showError(err?.response?.data?.message || "Failed to reset password");
      } finally {
        setSaving(false);
      }
    },
    [api, phone, form.password, navigate, validate],
  );

  const inputBase =
    "w-full rounded-2xl border bg-background-secondary px-4 py-3 text-sm sm:text-[15px] text-text-primary placeholder:text-text-tertiary shadow-soft outline-none transition";
  const inputFocus =
    "hover:border-border focus:border-border-focus focus:ring-4 focus:ring-ring-focus/25";
  const inputError = "border-red-500 focus:border-red-500";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background-primary">
      {/* Ambient background (tokens only) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary-subtle blur-3xl opacity-70 motion-safe:animate-pulse" />
        <div className="absolute -bottom-36 -left-24 h-[30rem] w-[30rem] rounded-full bg-accent-subtle blur-3xl opacity-70 motion-safe:animate-pulse" />
        <div className="absolute -bottom-32 -right-24 h-[26rem] w-[26rem] rounded-full bg-primary-subtle blur-3xl opacity-55 motion-safe:animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-background-primary via-background-primary to-background-subtle opacity-85" />
      </div>

      <div className="relative flex items-center justify-center w-full min-h-screen px-4 py-10 mx-auto max-w-7xl sm:px-6 sm:py-14 lg:px-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
        >
          <div
            className="
              group relative overflow-hidden
              rounded-3xl border border-border-light
              bg-background-secondary
              shadow-card
              transition-all duration-300 ease-out
              hover:-translate-y-0.5 hover:shadow-float
              motion-safe:will-change-transform
            "
          >
            {/* Top accent */}
            <div className="h-1.5 w-full bg-accent" />

            {/* Hover glow */}
            <div className="absolute inset-0 transition duration-500 opacity-0 pointer-events-none group-hover:opacity-100">
              <div className="absolute w-64 h-64 -translate-x-1/2 rounded-full left-1/2 -top-24 bg-accent-subtle blur-3xl" />
              <div className="absolute w-56 h-56 rounded-full -bottom-24 left-10 bg-primary-subtle blur-3xl" />
            </div>

            <div className="relative p-5 sm:p-6">
              {/* Header */}
              <div className="text-center">
                <div className="mx-auto inline-flex items-center gap-2 rounded-2xl border border-border-light bg-background-subtle px-3 py-1.5 shadow-soft">
                  <span className="relative inline-flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full opacity-25 bg-accent motion-safe:animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-accent" />
                  </span>
                  <span className="text-[11px] font-semibold tracking-wider text-text-secondary">
                    RESET PASSWORD
                  </span>
                </div>

                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                  <TypewriterText
                    text="Set a new password"
                    speed={50}
                    onComplete={() => setHeaderComplete(true)}
                  />
                </h1>

                {headerComplete && (
                  <p className="max-w-sm mx-auto mt-2 text-xs leading-relaxed text-accent sm:text-sm">
                    <TypewriterText
                      text="Choose a strong password to secure your account."
                      speed={40}
                    />
                  </p>
                )}
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4 mt-7"
                noValidate
              >
                {/* NEW PASSWORD */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wider text-text-secondary">
                    NEW PASSWORD
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className={[
                        inputBase,
                        inputFocus,
                        errors.password ? inputError : "border-border-light",
                        "pr-12",
                      ].join(" ")}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password ? "password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute -translate-y-1/2 cursor-pointer right-3 top-1/2"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        key="password-error"
                        id="password-error"
                        className="mt-1 text-xs leading-relaxed text-red-500"
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.18 }}
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-wider text-text-secondary">
                    CONFIRM PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className={[
                        inputBase,
                        inputFocus,
                        errors.confirmPassword
                          ? inputError
                          : "border-border-light",
                        "pr-12",
                      ].join(" ")}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={
                        errors.confirmPassword
                          ? "confirmPassword-error"
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute -translate-y-1/2 cursor-pointer right-3 top-1/2"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>

                  <AnimatePresence>
                    {errors.confirmPassword && (
                      <motion.p
                        key="confirmPassword-error"
                        id="confirmPassword-error"
                        className="mt-1 text-xs leading-relaxed text-red-500"
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.18 }}
                      >
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={saving || !form.password || !form.confirmPassword}
                  whileHover={
                    !saving && form.password && form.confirmPassword
                      ? { y: -2 }
                      : {}
                  }
                  whileTap={
                    !saving && form.password && form.confirmPassword
                      ? { scale: 0.99 }
                      : {}
                  }
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  className={`
                    relative mt-2 w-full overflow-hidden rounded-2xl px-4 py-3
                    text-sm font-semibold tracking-wide shadow-md transition
                    focus:outline-none focus:ring-4 focus:ring-ring-focus/25
                    disabled:cursor-not-allowed disabled:opacity-60
                    ${
                      !saving && form.password && form.confirmPassword
                        ? "cursor-pointer text-white bg-accent hover:bg-accent/90 text-text-inverse hover:shadow-lg active:bg-accent-active"
                        : "cursor-not-allowed bg-accent/90 text-white"
                    }
                  `}
                >
                  {/* Framer shimmer (no hard-coded values, no <style>) */}
                  <span className="absolute inset-0 pointer-events-none">
                    <motion.span
                      aria-hidden="true"
                      className="absolute top-0 w-1/2 h-full -skew-x-12 -left-1/2 bg-gradient-to-r from-transparent via-background-secondary/40 to-transparent"
                      initial={{ x: "-120%", opacity: 0 }}
                      animate={
                        !saving
                          ? { x: "240%", opacity: [0, 1, 1, 0] }
                          : { x: "-120%", opacity: 0.35 }
                      }
                      transition={
                        !saving
                          ? {
                              duration: 2.2,
                              ease: "easeInOut",
                              repeat: Infinity,
                            }
                          : { duration: 0.2 }
                      }
                    />
                  </span>

                  <span className="relative inline-flex items-center justify-center gap-2">
                    <span>{saving ? "Resetting..." : "Reset Password"}</span>
                  </span>
                </motion.button>

                {/* Small helper */}
                <p className="pt-2 text-center text-[11px] leading-relaxed text-text-tertiary">
                  After resetting, you’ll be redirected to the login page.
                </p>
              </form>
            </div>
            <div className="absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none group-hover:opacity-100">
              <div className="absolute inset-0 rounded-3xl ring-1 ring-ring-subtle" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
