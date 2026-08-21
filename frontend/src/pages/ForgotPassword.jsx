import React, { useCallback, useState } from "react";
import PhoneAuth from "../components/auth/PhoneAuth";
import { useNavigate } from "react-router-dom";
import TypewriterText from "../components/TypewriterText";

export default function ForgotPassword({ api }) {
  const navigate = useNavigate();
  const [headerComplete, setHeaderComplete] = useState(false);

  const handleVerified = useCallback(
    (data) => {
      const phone = data?.phoneE164;
      if (!phone) {
        return;
      }

      navigate("/reset-password", { state: { phone } });
    },
    [navigate],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background-primary">
      {/* Ambient gradient blobs (theme tokens only) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -translate-x-1/2 rounded-full -top-28 left-1/2 h-80 w-80 bg-primary-subtle opacity-70 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute rounded-full -bottom-32 -left-16 h-80 w-80 bg-accent-subtle opacity-60 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute rounded-full opacity-50 -bottom-40 -right-20 h-96 w-96 bg-primary-subtle blur-3xl motion-safe:animate-pulse" />
      </div>

      {/* Centered layout */}
      <div className="relative flex items-center justify-center w-full min-h-screen px-4 py-10 mx-auto max-w-7xl sm:px-6 sm:py-14 lg:px-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div
            className="
              group relative overflow-hidden
              rounded-3xl border border-gray-200
              bg-background-secondary
              shadow-card
              transition-all duration-300 ease-out
              motion-safe:will-change-transform
              hover:-translate-y-0.5 hover:shadow-float
            "
          >
            {/* Accent top bar */}
            <div className="absolute inset-x-0 top-0 h-1 pointer-events-none bg-accent" />

            {/* Subtle shine */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-64 w-[36rem] -translate-x-1/2 rotate-12 bg-background-subtle opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-60" />

            <div className="p-5 sm:p-6">
              {/* Header badge */}
              <div className="flex justify-center mb-6 sm:mb-7">
                <div
                  className="
                    inline-flex items-center gap-3
                    rounded-2xl border border-gray-200
                    bg-background-subtle
                    px-4 py-2.5
                    shadow-soft
                    transition-transform duration-300 ease-out
                    group-hover:scale-[1.02]
                  "
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent shadow-sm" />
                  </span>

                  <span className="text-xs font-semibold tracking-wide text-text-primary sm:text-sm">
                    Password Recovery
                  </span>
                </div>
              </div>

              {/* Title + subtitle */}
              <h1 className="text-center text-2xl font-semibold tracking-tight text-primary sm:text-[1.75rem]">
                <TypewriterText
                  text="Forgot Password"
                  speed={50}
                  onComplete={() => setHeaderComplete(true)}
                />
              </h1>

              {headerComplete && (
                <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-accent sm:text-[0.95rem]">
                  <TypewriterText
                    text="Enter your phone number to receive an OTP for password reset."
                    speed={40}
                  />
                </p>
              )}

              {/* Form container */}
              <div className="rounded-2xl bg-background-secondary shadow-soft">
                <PhoneAuth
                  variant="FORGOT_PASSWORD"
                  onVerified={handleVerified}
                  api={api}
                />
              </div>

              {/* Helper row */}
              <div className="flex items-center justify-center gap-2 mt-0 text-xs text-text-tertiary sm:text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent opacity-70" />
                <span className="text-center">
                  Use the phone number linked to your account.
                </span>
              </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none bg-background-subtle opacity-40" />
          </div>

          {/* Mobile breathing room */}
          <div className="h-2 sm:h-0" />
        </div>
      </div>
    </div>
  );
}
