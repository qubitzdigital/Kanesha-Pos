import React from "react";

/**
 * AppLoader – Hardware POS (Redesigned)
 * - Uses Tailwind theme tokens ONLY (your design system classes)
 * - No logic changes
 * - POS-appropriate: compact, status-forward, kiosk-friendly, touch-friendly
 * - Fully responsive + polished motion
 */
const AppLoader = ({
  open = false,
  variant = "overlay", // "overlay" | "inline"
  title = "Loading…",
  subtitle = "Please wait a moment",
  tone = "primary", // "primary" | "accent"
  showCancel = false,
  onCancel,
  cancelText = "Cancel",
  className = "",
}) => {
  if (!open) return null;

  // Tone mapping to your Tailwind tokens
  const toneBg = tone === "accent" ? "bg-accent" : "bg-primary";
  const toneSubtle =
    tone === "accent" ? "bg-accent-subtle" : "bg-primary-subtle";
  const toneText = tone === "accent" ? "text-accent" : "text-primary";
  const toneRing = tone === "accent" ? "ring-accent/30" : "ring-primary/30";

  const ringFocus =
    tone === "accent"
      ? "focus-visible:ring-accent focus-visible:border-accent"
      : "focus-visible:ring-primary focus-visible:border-primary";

  const Panel = () => (
    <div
      className={[
        "relative w-full max-w-[560px]",
        "rounded-3xl",
        "bg-background-secondary",
        "border border-gray-200",
        "shadow-float",
        "overflow-hidden",
        // tighter, POS-friendly spacing
        "px-4 py-4 sm:px-6 sm:py-6",
        "motion-safe:animate-[posIn_260ms_cubic-bezier(.2,.9,.2,1)]",
        className,
      ].join(" ")}
      role="status"
      aria-busy="true"
    >
      {/* Subtle top header strip (POS terminal feel) */}
      <div className="absolute inset-x-0 top-0 h-12 pointer-events-none sm:h-14">
        <div className="absolute inset-0 bg-gradient-to-b from-background-subtle/60 via-background-subtle/25 to-transparent" />
        <div
          className={[
            "absolute left-0 top-0 h-full w-[140px] sm:w-[180px] opacity-70",
            toneSubtle,
          ].join(" ")}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-border-light/70" />
      </div>

      {/* Ambient glow (very controlled, not flashy) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={[
            "absolute -top-28 left-1/2 -translate-x-1/2",
            "h-[22rem] w-[22rem] sm:h-[26rem] sm:w-[26rem]",
            "rounded-full blur-3xl opacity-45",
            "motion-safe:animate-[posGlow_2.8s_ease-in-out_infinite]",
            toneSubtle,
          ].join(" ")}
        />
      </div>

      {/* Content grid */}
      <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 sm:gap-6 pt-8 sm:pt-9">
        {/* Left: status + skeleton lines (POS list feel) */}
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            {/* Small status pill */}
            <div
              className={[
                "mt-0.5 inline-flex items-center gap-2",
                "px-3 py-1.5",
                "rounded-2xl",
                "border border-gray-200",
                "bg-background-subtle",
                "shadow-soft",
              ].join(" ")}
            >
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  toneBg,
                  "motion-safe:animate-[posDot_1.1s_ease-in-out_infinite]",
                ].join(" ")}
              />
              <span
                className={[
                  "text-[11px] sm:text-xs font-extrabold tracking-wide uppercase",
                  "text-primary",
                ].join(" ")}
              >
                Working
              </span>
            </div>

            <div className="min-w-0">
              <h3
                className={[
                  "text-sm sm:text-base font-extrabold tracking-tight",
                  "text-primary",
                ].join(" ")}
              >
                {title}
              </h3>
              <p
                className={["mt-1 text-[11px] sm:text-sm", "text-accent"].join(
                  " ",
                )}
              >
                {subtitle}
              </p>
            </div>
          </div>

          {/* Progress line */}
          <div className="mt-4 sm:mt-5">
            <div className="flex items-center justify-between">
              <p
                className={[
                  "text-xs sm:text-sm font-bold",
                  "text-text-primary",
                ].join(" ")}
              >
                Processing transaction…
              </p>
              <p
                className={[
                  "text-[11px] sm:text-xs font-semibold",
                  toneText,
                ].join(" ")}
              >
                Syncing
              </p>
            </div>
            <div className="h-3 mt-2 overflow-hidden border border-gray-200 rounded-full bg-background-subtle shadow-soft">
              <div
                className={[
                  "h-full w-[45%] rounded-full",
                  toneBg,
                  "motion-safe:animate-[posBar_1.4s_ease-in-out_infinite]",
                  "origin-left",
                ].join(" ")}
              />
            </div>
          </div>
        </div>

        {/* Right: compact “terminal spinner” module */}
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:justify-start sm:gap-5">
          <div
            className={[
              "relative",
              "h-[118px] w-[118px] sm:h-[140px] sm:w-[140px]",
              "rounded-3xl",
              "bg-background-primary",
              "border border-gray-200",
              "shadow-card",
              "grid place-items-center",
            ].join(" ")}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-background-subtle/50 via-transparent to-transparent" />
              <div
                className={["absolute inset-0 rounded-3xl ", toneRing].join(
                  " ",
                )}
              />
            </div>

            {/* Spinner (POS dial) */}
            <div className="relative grid place-items-center">
              <div
                className={[
                  "relative",
                  "h-14 w-14 sm:h-16 sm:w-16",
                  "rounded-full",
                  "border border-gray-200",
                  "bg-background-secondary",
                  "shadow-soft",
                ].join(" ")}
              >
                <div
                  className={[
                    "absolute inset-0 rounded-full ",
                    "motion-safe:animate-[posSpin_820ms_linear_infinite]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "absolute left-1/2 top-[-6px] -translate-x-1/2 h-3 w-3 rounded-full shadow-soft",
                      toneBg,
                    ].join(" ")}
                  />
                </div>
                <div className="absolute border border-gray-200 rounded-full inset-2" />
              </div>

              <div className="mt-2 text-center">
                <p
                  className={[
                    "text-[11px] sm:text-xs font-extrabold tracking-tight",
                    "text-primary",
                  ].join(" ")}
                >
                  Please wait
                </p>
                <p
                  className={["text-[10px] sm:text-[11px]", "text-accent"].join(
                    " ",
                  )}
                >
                  Do not refresh
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Micro footer hint (kiosk safe) */}
      <div className="relative flex items-center justify-between gap-3 mt-4 sm:mt-6">
        <div className="flex items-center gap-2">
          <span
            className={["h-2 w-2 rounded-full", toneBg, "opacity-70"].join(" ")}
          />
          <p
            className={[
              "text-[11px] sm:text-xs font-semibold",
              "text-text-secondary",
            ].join(" ")}
          >
            Maintaining connection…
          </p>
        </div>
        <p
          className={[
            "text-[10px] sm:text-[11px] font-semibold",
            "text-text-secondary",
          ].join(" ")}
        >
          Secure POS
        </p>
      </div>

      <style>{`
        @keyframes posIn {
          from { transform: translateY(8px) scale(.985); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes posGlow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: .35; }
          50%      { transform: translateX(-50%) scale(1.06); opacity: .52; }
        }
        @keyframes posShimmer {
          to { transform: translateX(-50%); }
        }
        @keyframes posSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes posDot {
          0%, 100% { transform: scale(1); opacity: .7; }
          50%      { transform: scale(1.35); opacity: 1; }
        }
        @keyframes posBar {
          0%   { transform: scaleX(.35); opacity: .85; }
          50%  { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(.35); opacity: .85; }
        }
      `}</style>
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="flex justify-center w-full px-4 py-6 sm:px-6">
        <Panel />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-overlay-dark/70 backdrop-blur-sm" />
      <Panel />
    </div>
  );
};

export default AppLoader;
