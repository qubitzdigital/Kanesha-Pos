import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendOtp, verifyOtp } from "../../api/otp";
import AppLoader from "../common/AppLoader";
import { showSuccess, showError } from "../../utils/toastHelper";

const LK_COUNTRY = { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" };

const LK_COUNTRY_CODE = "94";
const LK_DIAL = "+94";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export const toE164FromAny = (input) => {
  if (!input) return null;

  let digits = String(input || "").replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith(LK_COUNTRY_CODE))
    digits = digits.slice(LK_COUNTRY_CODE.length);
  if (digits.startsWith("0")) digits = digits.slice(1);

  if (digits.length !== 9) return null;
  return `${LK_DIAL}${digits}`;
};

export const validatePhoneNumber = (phone, countryDial = LK_DIAL) => {
  const digits = (phone || "").replace(/[^\d]/g, "");

  if (digits.length < 7) return "Phone number is too short";
  if (digits.length > 12) return "Phone number is too long";

  if (countryDial === LK_DIAL) {
    if (digits.length !== 9)
      return "Sri Lankan mobile must be 9 digits (e.g. 77XXXXXXX).";
    if (!/^7\d{8}$/.test(digits))
      return "Sri Lankan mobile must start with 7 (e.g. 77XXXXXXX).";
  }

  return "";
};

export const stripCountryDialFromInput = (input, countryDial = LK_DIAL) => {
  let digits = (input || "").replace(/[^\d]/g, "");
  const countryDigits = (countryDial || "").replace("+", "");

  if (digits.startsWith(countryDigits))
    digits = digits.slice(countryDigits.length);
  if (digits.startsWith("0")) digits = digits.slice(1);

  return digits;
};

export const normalizeLocalPhone = (localRaw) => {
  let v = (localRaw || "").trim().replace(/[^\d]/g, "");
  if (v.startsWith("0")) v = v.slice(1);
  return v;
};

export const buildE164Phone = (dial, localDigits) => {
  const local = (localDigits || "").replace(/[^\d]/g, "");
  return `${dial}${local}`;
};

export default function PhoneAuth({
  initialCountryDial = "+94",
  className = "",
  variant = "FORGOT_PASSWORD", // "FORGOT_PASSWORD" | "LOGIN" (or your own values)
  api,
  onVerified, // ✅ accept callback prop
}) {
  const [countryDial] = useState(initialCountryDial === "+94" ? "+94" : "+94");

  const [rawPhone, setRawPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState({ phone: "", otp: "" });
  const [touched, setTouched] = useState({ phone: false, otp: false });

  const mountedRef = useRef(true);

  const canShowOtpInput = otpSent;

  const setFieldError = useCallback((field, msg) => {
    setErrors((e) => ({ ...e, [field]: msg || "" }));
  }, []);

  const clearFieldError = useCallback(
    (field) => setFieldError(field, ""),
    [setFieldError],
  );

  const validateOtpCode = useCallback((code) => {
    const v = (code || "").replace(/\D/g, "");
    if (!v) return "OTP is required.";
    if (v.length !== OTP_LENGTH) return "OTP must be exactly 6 digits.";
    return "";
  }, []);

  const resendProgress = useMemo(() => {
    if (!otpSent) return 0;
    const elapsed = RESEND_COOLDOWN_SECONDS - resendCooldown;
    const pct = (elapsed / RESEND_COOLDOWN_SECONDS) * 100;
    return Math.min(100, Math.max(0, pct));
  }, [otpSent, resendCooldown]);

  useEffect(() => {
    if (!resendCooldown) return;
    const id = setInterval(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [resendCooldown]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // If user edits phone after OTP was sent, reset OTP state
  useEffect(() => {
    if (!otpSent) return;
    setOtp("");
    setOtpSent(false);
    setResendCooldown(0);
    clearFieldError("otp");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPhone]);

  const handlePhoneChange = (e) => {
    const nextLocal = stripCountryDialFromInput(e.target.value, countryDial);
    setRawPhone(nextLocal);
    if (errors.phone) clearFieldError("phone");
  };

  const handlePhoneBlur = () => setTouched((t) => ({ ...t, phone: true }));

  const handleOtpChange = (e) => {
    const v = (e.target.value || "").replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(v);
    setFieldError("otp", validateOtpCode(v));
  };

  const handleOtpBlur = () => {
    setTouched((t) => ({ ...t, otp: true }));
    setFieldError("otp", validateOtpCode(otp));
  };

  const sendOtpHandler = async () => {
    setTouched((t) => ({ ...t, phone: true }));

    const phoneMsg = validatePhoneNumber(rawPhone, countryDial);
    setFieldError("phone", phoneMsg);
    if (phoneMsg) return;

    const e164 = buildE164Phone(countryDial, normalizeLocalPhone(rawPhone));

    setSending(true);
    try {
      const data = await sendOtp(api, e164, variant);
      if (!mountedRef.current) return;

      if (data?.success) {
        setOtp("");
        setOtpSent(true);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        clearFieldError("otp");
        showSuccess("OTP sent!");
      } else {
        const errorMsg = data?.message || "Failed to send OTP";
        setFieldError("phone", errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const errorMsg = err?.message || "Failed to send OTP. Please try again";
      setFieldError("phone", errorMsg);
      showError(errorMsg);
    } finally {
      if (mountedRef.current) setSending(false);
    }
  };

  const verifyOtpHandler = async () => {
    if (verifying) return;

    setTouched((t) => ({ ...t, otp: true, phone: true }));

    const otpMsg = validateOtpCode(otp);
    setFieldError("otp", otpMsg);
    if (otpMsg) return;

    const phoneMsg = validatePhoneNumber(rawPhone, countryDial);
    setFieldError("phone", phoneMsg);
    if (phoneMsg) return;

    const e164 = buildE164Phone(countryDial, normalizeLocalPhone(rawPhone));

    setVerifying(true);
    try {
      const data = await verifyOtp(api, e164, otp, variant);
      if (!mountedRef.current) return;

      if (!data?.success) {
        const errorMsg = data?.message || "Invalid OTP";
        setFieldError("otp", errorMsg);
        setOtp("");
        showError(errorMsg);
        return;
      }

      showSuccess("Phone verified!");

      // reset local state
      setOtp("");
      setOtpSent(false);
      setResendCooldown(0);

      if (typeof onVerified === "function") {
        onVerified(data);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const errorMsg = err?.message || "Verification failed. Please try again.";
      setFieldError("otp", errorMsg);
      setOtp("");
      toast.error(errorMsg, { duration: 3000 });
    } finally {
      if (mountedRef.current) setVerifying(false);
    }
  };

  const resendDisabled = sending || resendCooldown > 0;

  // Auto verify once OTP is complete
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !verifying && !sending) {
      verifyOtpHandler();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const PhoneError = () =>
    errors.phone ? (
      <motion.p
        className="mt-1 text-xs text-red-500"
        role="alert"
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ duration: 0.18 }}
      >
        {errors.phone}
      </motion.p>
    ) : null;

  const OtpError = () =>
    errors.otp ? (
      <motion.p
        className="mt-1 text-xs text-red-500"
        role="alert"
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ duration: 0.18 }}
      >
        {errors.otp}
      </motion.p>
    ) : null;

  const ResendTimer = () =>
    otpSent ? (
      <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
        <span className="whitespace-nowrap">
          {resendCooldown > 0
            ? `You can resend in ${resendCooldown}s`
            : "Didn't get the SMS? You can resend now."}
        </span>

        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-light">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${resendProgress}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </div>
      </div>
    ) : null;

  const inputBase = [
    "w-full rounded-2xl border bg-background-secondary",
    "px-4 py-3 text-sm sm:text-[15px]",
    "text-text-primary placeholder:text-text-tertiary",
    "shadow-soft outline-none transition",
    "hover:border-border",
    "focus:border-border-focus focus:ring-4 focus:ring-ring-focus/25",
  ].join(" ");

  const phoneInputClass = [
    inputBase,
    "pl-12",
    errors.phone && touched.phone ? "border-red-500 " : "border-gray-200",
    sending || verifying ? "cursor-not-allowed opacity-80" : "cursor-pointer",
  ].join(" ");

  const otpInputClass = [
    inputBase,
    "text-center font-semibold tracking-[0.28em]",
    errors.otp && touched.otp ? "border-red-500 " : "border-gray-200",
    verifying || sending ? "cursor-not-allowed opacity-80" : "cursor-pointer",
  ].join(" ");

  return (
    <div className={["w-full", className].join(" ")}>
      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-background-subtle px-3 py-1.5 shadow-soft">
              <span className="relative inline-flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full opacity-25 bg-accent motion-safe:animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-accent" />
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-text-secondary">
                PHONE VERIFICATION
              </span>
            </div>
            <p className="pt-2 mt-2 text-sm font-semibold text-text-primary">
              Verify your phone number
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
              Enter your Sri Lankan mobile number. We’ll send a {OTP_LENGTH}
              -digit OTP.
            </p>
          </div>
        </div>

        {/* Phone input row */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="w-16 sm:w-24">
              <div className="flex items-center justify-center w-full px-3 py-3 text-sm font-semibold border border-gray-200 rounded-2xl bg-background-subtle text-text-secondary shadow-soft">
                {LK_COUNTRY.flag} {LK_COUNTRY.dial}
              </div>
            </div>

            <div className="flex-1">
              <div className="relative">
                <input
                  type="tel"
                  className={phoneInputClass}
                  placeholder="77XXXXXXX (no leading 0)"
                  value={rawPhone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  disabled={sending || verifying}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  aria-invalid={Boolean(errors.phone && touched.phone)}
                  aria-describedby="phone-error"
                />
                <Phone
                  className="absolute -translate-y-1/2 left-4 top-1/2 text-text-tertiary"
                  size={18}
                />
              </div>

              <div id="phone-error">
                <AnimatePresence>
                  {errors.phone ? <PhoneError /> : null}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Send / Resend */}
          <motion.button
            type="button"
            onClick={sendOtpHandler}
            disabled={resendDisabled}
            whileHover={!resendDisabled ? { y: -2 } : {}}
            whileTap={!resendDisabled ? { scale: 0.99 } : {}}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className={[
              "group relative mt-2 h-12 w-full overflow-hidden rounded-2xl",
              "flex items-center justify-center gap-2",
              "text-sm sm:text-[15px] font-semibold tracking-wide",
              "shadow-md transition",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25",
              resendDisabled
                ? "cursor-not-allowed bg-accent/90 text-white"
                : "cursor-pointer text-white bg-accent hover:bg-accent/90 text-text-inverse hover:shadow-lg active:bg-accent-active",
            ].join(" ")}
          >
            {/* Subtle shimmer */}
            <span className="absolute inset-0 pointer-events-none">
              <motion.span
                aria-hidden="true"
                className="absolute top-0 w-1/2 h-full -skew-x-12 -left-1/2 bg-gradient-to-r from-transparent via-background-secondary/35 to-transparent"
                initial={{ x: "-120%", opacity: 0 }}
                animate={
                  resendDisabled
                    ? { x: "-120%", opacity: 0.25 }
                    : { x: "240%", opacity: [0, 1, 1, 0] }
                }
                transition={
                  resendDisabled
                    ? { duration: 0.2 }
                    : { duration: 2.2, ease: "easeInOut", repeat: Infinity }
                }
              />
            </span>

            <span className="relative inline-flex items-center gap-2 text-white">
              {otpSent && resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : otpSent
                  ? "Resend OTP"
                  : "Send OTP"}
            </span>
          </motion.button>

          {sending && (
            <div className="mt-4">
              <AppLoader
                open
                variant="inline"
                title="Sending OTP"
                subtitle="Requesting a verification code"
              />
            </div>
          )}

          <ResendTimer />
        </div>

        {/* OTP block */}
        <AnimatePresence initial={false}>
          {canShowOtpInput && (
            <motion.div
              key="otp-panel"
              className="mt-5"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className="p-4 border border-gray-200 rounded-2xl bg-background-subtle shadow-soft sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold tracking-tight text-text-primary">
                      Enter OTP
                    </div>
                    <div className="mt-1 text-xs text-text-tertiary">
                      We sent a {OTP_LENGTH}-digit code to your phone.
                    </div>
                  </div>

                  <AnimatePresence>
                    {verifying && (
                      <motion.div
                        key="verifying-pill"
                        className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold border border-gray-200 rounded-full bg-background-secondary text-text-secondary shadow-soft"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                      >
                        <span className="relative inline-flex h-2.5 w-2.5">
                          <span className="absolute inline-flex w-full h-full rounded-full opacity-25 bg-status-pending motion-safe:animate-ping" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-pending" />
                        </span>
                        Verifying
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-4">
                  <input
                    type="text"
                    className={otpInputClass}
                    placeholder={`Enter ${OTP_LENGTH}-digit OTP`}
                    value={otp}
                    onChange={handleOtpChange}
                    onBlur={handleOtpBlur}
                    maxLength={OTP_LENGTH}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-invalid={Boolean(errors.otp && touched.otp)}
                    aria-describedby="otp-error"
                    disabled={verifying || sending}
                  />

                  <div id="otp-error">
                    <AnimatePresence>
                      {errors.otp ? <OtpError /> : null}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-text-tertiary">
                    <span>Code progress</span>

                    <div className="flex items-center gap-2" aria-hidden="true">
                      {Array.from({ length: OTP_LENGTH }).map((_, idx) => {
                        const filled = idx < otp.length;
                        return (
                          <motion.span
                            key={idx}
                            className={[
                              "inline-block h-3.5 w-3.5 rounded-full border",
                              filled
                                ? "border-primary bg-primary shadow-soft"
                                : "border-gray-200 bg-background-secondary opacity-70",
                            ].join(" ")}
                            animate={filled ? { scale: 1.12 } : { scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 520,
                              damping: 28,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual verify button (keeps functionality; auto-verify remains) */}
                  <motion.button
                    type="button"
                    onClick={verifyOtpHandler}
                    disabled={verifying || sending || otp.length !== OTP_LENGTH}
                    whileHover={
                      !(verifying || sending || otp.length !== OTP_LENGTH)
                        ? { y: -2 }
                        : {}
                    }
                    whileTap={
                      !(verifying || sending || otp.length !== OTP_LENGTH)
                        ? { scale: 0.99 }
                        : {}
                    }
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 28,
                    }}
                    className={[
                      "mt-4 w-full rounded-2xl px-4 py-3",
                      "text-sm font-semibold tracking-wide",
                      "shadow-md transition",
                      "focus:outline-none focus:ring-4 focus:ring-ring-focus/25",
                      verifying || sending || otp.length !== OTP_LENGTH
                        ? "cursor-not-allowed bg-accent/90 text-white"
                        : "cursor-pointer text-white bg-accent hover:bg-accent/90 text-text-inverse hover:shadow-lg active:bg-accent-active",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      Verify OTP
                    </span>
                  </motion.button>
                </div>
              </div>

              {verifying && (
                <div className="mt-4">
                  <AppLoader
                    open
                    variant="inline"
                    title="Verifying OTP"
                    subtitle="Checking the code you entered"
                  />
                </div>
              )}

              <p className="mt-2 text-[11px] leading-relaxed text-text-tertiary">
                Tip: OTP auto-verifies once you enter all {OTP_LENGTH} digits.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
