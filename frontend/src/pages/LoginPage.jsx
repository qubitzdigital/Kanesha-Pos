import React, { useMemo, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import regexValidations from "../utils/regexValidations";
import TypewriterText from "../components/TypewriterText";

const LoginPage = ({ onLogin, api }) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [headerComplete, setHeaderComplete] = useState(false);

  // Inline field errors (client-side validation)
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    password: "",
  });

  // Use centralized regexValidations
  const regex = useMemo(
    () => ({
      username: regexValidations.username,
      password: regexValidations.passwordLogin,
    }),
    [],
  );

  const validateField = useCallback(
    (name, value) => {
      if (name === "username") {
        if (!regex.username.test(value)) {
          return "Username must start with a letter, 4-20 chars, letters/numbers/_ only";
        }
      }
      if (name === "password") {
        if (!regex.password.test(value)) {
          return "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character";
        }
      }
      return "";
    },
    [regex],
  );

  const validateAll = useCallback(() => {
    const next = {
      username: validateField("username", username),
      password: validateField("password", password),
    };
    setFieldErrors(next);
    return !next.username && !next.password;
  }, [username, password, validateField]);

  const onUsernameChange = (e) => {
    const v = e.target.value;
    setUsername(v);
    // Remove inline error immediately once valid (or update message if still invalid)
    if (fieldErrors.username) {
      const msg = validateField("username", v);
      setFieldErrors((prev) => ({ ...prev, username: msg }));
    }
    if (serverError) setServerError("");
  };

  const onPasswordChange = (e) => {
    const v = e.target.value;
    setPassword(v);
    if (fieldErrors.password) {
      const msg = validateField("password", v);
      setFieldErrors((prev) => ({ ...prev, password: msg }));
    }
    if (serverError) setServerError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError("");

    const ok = validateAll();
    if (!ok) return;

    setLoading(true);
    try {
      const response = await api.post(
        "/auth/login",
        { username, password },
        { withCredentials: true },
      );

      const data = response?.data;
      if (!data?.accessToken) {
        throw new Error("No access token received from server");
      }

      // Only store user in memory, not tokens
      onLogin(data, data.accessToken);
      navigate("/pos");
    } catch (err) {
      setServerError(
        err?.response?.data?.message || err?.message || "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = useMemo(() => {
    // Allow click only when fields non-empty and not loading.
    // (Strict regex validation is enforced on submit and can also be enforced here if you want.)
    return Boolean(username && password) && !loading;
  }, [username, password, loading]);

  const inputBase =
    "w-full rounded-2xl border bg-background-secondary px-9 py-3 text-sm text-text-primary shadow-soft outline-none transition placeholder:text-text-tertiary";
  const inputRing =
    "hover:border-border focus:border-border-focus focus:ring-4 focus:ring-ring-focus/25";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background-primary">
      {/* Ambient background (tokens only) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-36 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-primary-subtle blur-3xl opacity-70 motion-safe:animate-pulse" />
        <div className="absolute -bottom-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-accent-subtle blur-3xl opacity-70 motion-safe:animate-pulse" />
        <div className="absolute -bottom-36 -right-28 h-[28rem] w-[28rem] rounded-full bg-primary-subtle blur-3xl opacity-55 motion-safe:animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-background-primary via-background-primary to-background-subtle opacity-90" />
      </div>

      <div className="relative flex items-center justify-center min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl">
          <div className="grid items-stretch gap-6 md:grid-cols-[1.15fr_0.85fr] md:gap-8">
            {/* Brand / Info Panel */}
            <section className="hidden md:flex">
              <motion.div
                className="
                  group relative w-full overflow-hidden
                  rounded-3xl border border-gray-200
                  bg-background-secondary
                  shadow-card
                  transition-all duration-300 ease-out
                  hover:-translate-y-0.5 hover:shadow-float
                  motion-safe:will-change-transform
                "
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
              >
                <div className="h-1.5 w-full bg-primary" />

                {/* Soft glow on hover */}
                <div className="absolute inset-0 transition duration-500 opacity-0 pointer-events-none group-hover:opacity-100">
                  <div className="absolute w-56 h-56 rounded-full -top-24 left-10 bg-primary-subtle blur-2xl" />
                  <div className="absolute w-64 h-64 rounded-full -bottom-28 right-10 bg-accent-subtle blur-2xl" />
                </div>

                <div className="relative flex flex-col justify-between h-full px-10 py-10">
                  <div className="space-y-7">
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-background-subtle px-3 py-1.5 text-xs font-semibold tracking-wide text-text-secondary shadow-soft">
                      <span className="relative inline-flex h-2.5 w-2.5">
                        <span className="absolute inline-flex w-full h-full rounded-full opacity-25 bg-accent motion-safe:animate-ping" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                      </span>
                      <span>Secure Admin Access</span>
                    </div>

                    <div className="space-y-3">
                      <h1 className="text-xl font-bold sm:text-2xl">
                        <span className="text-primary">Q</span>
                        <span className="text-accent">pos</span>
                      </h1>
                      <p className="max-w-md text-sm leading-relaxed text-text-tertiary">
                        Manage inventory, billing, and daily operations from one
                        centralized dashboard. Log in with your admin account to
                        continue.
                      </p>
                    </div>

                    <div className="grid gap-3 pt-2">
                      <div className="p-4 border border-gray-200 rounded-2xl bg-background-subtle shadow-soft">
                        <p className="text-xs font-semibold tracking-wider text-text-secondary">
                          POS-READY UI
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
                          Clean layout optimized for quick decision-making at
                          the counter.
                        </p>
                      </div>

                      <div className="p-4 border border-gray-200 rounded-2xl bg-background-subtle shadow-soft">
                        <p className="text-xs font-semibold tracking-wider text-text-secondary">
                          SESSION SAFETY
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
                          Your credentials are handled securely via the backend
                          authentication service.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-8 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-xs text-text-tertiary">
                      <div className="space-y-1">
                        <p className="font-semibold tracking-wide text-text-secondary">
                          Fast Access
                        </p>
                        <p className="leading-relaxed">
                          Focused login flow for busy retail environments.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold tracking-wide text-text-secondary">
                          Reliable Control
                        </p>
                        <p className="leading-relaxed">
                          Admin dashboard access with token-based sessions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle border ring on hover */}
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none group-hover:opacity-100">
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-ring-subtle" />
                </div>
              </motion.div>
            </section>

            {/* Login Panel */}
            <section className="flex items-center">
              <motion.div
                className="
                  group relative w-full overflow-hidden
                  rounded-3xl border border-gray-200
                  bg-background-secondary
                  shadow-card
                  transition-all duration-300 ease-out
                  hover:-translate-y-0.5 hover:shadow-float
                  motion-safe:will-change-transform
                "
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 26,
                  delay: 0.05,
                }}
              >
                <div className="h-1.5 w-full bg-accent" />

                {/* Accent glow */}
                <div className="absolute inset-0 transition duration-500 opacity-0 pointer-events-none group-hover:opacity-100">
                  <div className="absolute -translate-x-1/2 rounded-full left-1/2 -top-24 h-60 w-60 bg-accent-subtle blur-2xl" />
                </div>

                <div className="relative px-5 py-7 sm:px-6 sm:py-8 md:px-8 md:py-10">
                  {/* Mobile header */}
                  <div className="space-y-2 text-center md:hidden">
                    <div className="mx-auto inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-background-subtle px-3 py-1.5 shadow-soft">
                      <span className="text-[11px] font-semibold tracking-wider text-text-secondary">
                        ADMIN LOGIN
                      </span>
                    </div>
                    <h1 className="text-xl font-bold sm:text-2xl">
                      <span className="text-primary">Welcome to Q</span>
                      <span className="text-accent">pos</span>
                    </h1>
                    <p className="text-xs leading-relaxed text-text-tertiary">
                      Enter your admin credentials to access the POS system
                    </p>
                  </div>

                  {/* Desktop header */}
                  <div className="hidden space-y-1 text-center md:block">
                    <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                      <TypewriterText
                        text="Welcome back, Admin"
                        speed={50}
                        onComplete={() => setHeaderComplete(true)}
                      />
                    </h2>
                    {headerComplete && (
                      <p className="text-sm text-text-tertiary">
                        <TypewriterText
                          text="Enter your admin credentials to access the POS system"
                          speed={40}
                        />
                      </p>
                    )}
                  </div>

                  {/* Server error */}
                  <AnimatePresence>
                    {serverError && (
                      <motion.div
                        key="server-error"
                        className="px-4 py-3 mt-6 text-red-500 border border-gray-200 bi rounded-2xl shadow-soft"
                        role="alert"
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 28,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-status-error" />
                          <p className="leading-relaxed text-red-500">
                            {serverError}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={submit} className="space-y-5 mt-7" noValidate>
                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold tracking-wider text-text-secondary">
                        USERNAME
                      </label>

                      <div className="relative">
                        <div className="absolute inset-y-0 flex items-center pointer-events-none left-3">
                          <svg
                            className="w-4 h-4 text-text-tertiary"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5 20.4C6.52 18.4 8.86 17 12 17s5.48 1.4 7 3.4"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        <input
                          className={[
                            inputBase,
                            inputRing,
                            fieldErrors.username
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200",
                          ].join(" ")}
                          value={username}
                          onChange={onUsernameChange}
                          onBlur={() =>
                            setFieldErrors((prev) => ({
                              ...prev,
                              username: validateField("username", username),
                            }))
                          }
                          placeholder="admin"
                          autoComplete="username"
                          aria-invalid={Boolean(fieldErrors.username)}
                          aria-describedby={
                            fieldErrors.username ? "username-error" : undefined
                          }
                        />
                      </div>

                      <AnimatePresence>
                        {fieldErrors.username && (
                          <motion.p
                            key="username-error"
                            id="username-error"
                            className="text-[11px] leading-relaxed text-red-500"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                          >
                            {fieldErrors.username}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold tracking-wider text-text-secondary">
                        PASSWORD
                      </label>

                      <div className="relative">
                        <div className="absolute inset-y-0 flex items-center pointer-events-none left-3">
                          <svg
                            className="w-4 h-4 text-text-tertiary"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="5"
                              y="11"
                              width="14"
                              height="9"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M9 11V9a3 3 0 0 1 6 0v2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        <input
                          type={showPassword ? "text" : "password"}
                          className={[
                            inputBase,
                            inputRing,
                            "pr-12",
                            fieldErrors.password
                              ? "border-red-500 focus:border-red-500"
                              : "border-gray-200",
                          ].join(" ")}
                          value={password}
                          onChange={onPasswordChange}
                          onBlur={() =>
                            setFieldErrors((prev) => ({
                              ...prev,
                              password: validateField("password", password),
                            }))
                          }
                          placeholder="admin123"
                          autoComplete="current-password"
                          aria-invalid={Boolean(fieldErrors.password)}
                          aria-describedby={
                            fieldErrors.password ? "password-error" : undefined
                          }
                        />

                        <button
                          type="button"
                          className={[
                            "absolute right-3 top-1/2 -translate-y-1/2",
                            "cursor-pointer rounded-xl p-2 transition",
                            "hover:bg-background-subtle active:scale-[0.98]",

                            showPassword
                              ? "text-accent"
                              : "text-text-tertiary hover:text-text-primary",
                          ].join(" ")}
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          <motion.span
                            key={showPassword ? "eye-off" : "eye"}
                            initial={{ opacity: 0, rotate: -8, scale: 0.95 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: 8, scale: 0.95 }}
                            transition={{ duration: 0.18 }}
                            className="inline-flex text-lg"
                          >
                            {showPassword ? "👁️" : "👁️‍🗨️"}
                          </motion.span>
                        </button>
                      </div>

                      <AnimatePresence>
                        {fieldErrors.password && (
                          <motion.p
                            key="password-error"
                            id="password-error"
                            className="text-[11px] leading-relaxed text-red-500"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                          >
                            {fieldErrors.password}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link
                        to="/forgot-password"
                        className="text-xs font-semibold transition cursor-pointer text-accent hover:text-accent-active hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="pt-1 space-y-3">
                      <motion.button
                        type="submit"
                        disabled={!canSubmit}
                        whileHover={canSubmit ? { y: -2 } : {}}
                        whileTap={canSubmit ? { scale: 0.99 } : {}}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 28,
                        }}
                        className={[
                          "relative w-full overflow-hidden rounded-2xl px-4 py-3",
                          "text-sm font-semibold tracking-wide shadow-md transition",
                          "focus:outline-none focus:ring-4 focus:ring-ring-focus/25",
                          "disabled:cursor-not-allowed disabled:opacity-60",
                          canSubmit
                            ? "cursor-pointer text-white bg-accent hover:bg-accent/90 text-text-inverse hover:shadow-lg active:bg-accent-active"
                            : "cursor-not-allowed bg-accent/90 text-white",
                        ].join(" ")}
                      >
                        {/* Framer shimmer (no <style>) */}
                        <span className="absolute inset-0 pointer-events-none">
                          <motion.span
                            aria-hidden="true"
                            className="absolute top-0 w-1/2 h-full -skew-x-12 -left-1/2 bg-gradient-to-r from-transparent via-background-secondary/40 to-transparent"
                            initial={{ x: "-120%", opacity: 0 }}
                            animate={
                              canSubmit
                                ? { x: "240%", opacity: [0, 1, 1, 0] }
                                : { x: "-120%", opacity: 0.35 }
                            }
                            transition={
                              canSubmit
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
                          <span>{loading ? "Logging in ..." : "Login"}</span>
                        </span>
                      </motion.button>

                      <p className="text-center text-[11px] leading-relaxed text-text-tertiary">
                        First time using the system? Make sure an admin user is
                        seeded via the backend before attempting to log in.
                      </p>

                      <p className="text-center text-[11px] leading-relaxed text-text-tertiary">
                        New shop?{" "}
                        <Link
                          to="/signup"
                          className="font-semibold underline transition cursor-pointer decoration-border-dark underline-offset-4 hover:text-primary-hover text-text-primary"
                        >
                          Create owner account
                        </Link>
                      </p>
                    </div>
                  </form>
                </div>

                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none group-hover:opacity-100">
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-ring-subtle" />
                </div>
              </motion.div>
            </section>
          </div>

          <p className="mt-6 text-center text-[11px] text-text-tertiary md:hidden">
            Use your admin credentials to access the dashboard securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
