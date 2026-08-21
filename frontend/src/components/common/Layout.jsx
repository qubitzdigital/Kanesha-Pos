import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import HorizontalNav from "./HorizontalNav";
import { userHasFeatureAccess } from "../../utils/permissionHelper.js";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    icon: "🏠",
    featureId: "dashboard",
  },
  {
    to: "/pos",
    label: "POS Billing",
    shortLabel: "POS",
    icon: "🛒",
    featureId: "pos",
  },
  {
    to: "/pending",
    label: "Pending Sales",
    shortLabel: "Pending",
    icon: "⏳",
    featureId: "pos",
  },
  {
    to: "/return-exchange",
    label: "Return & Exchange",
    shortLabel: "Returns",
    icon: "🔄",
    featureId: "return-exchange",
  },
  {
    to: "/invoices",
    label: "Invoices",
    shortLabel: "Invoices",
    icon: "🧾",
    featureId: "invoices",
  },
  {
    to: "/inventory",
    label: "Inventory",
    shortLabel: "Stock",
    icon: "📦",
    featureId: "inventory",
  },
  // {
  //   to: "/customers",
  //   label: "Customers",
  //   shortLabel: "Clients",
  //   icon: "👥",
  //   featureId: "customers",
  // },
  // {
  //   to: "/suppliers",
  //   label: "Suppliers",
  //   shortLabel: "Suppliers",
  //   icon: "🏭",
  //   featureId: "suppliers",
  // },
  {
    to: "/reports",
    label: "Reports",
    shortLabel: "Reports",
    icon: "📊",
    featureId: "reports",
  },
  // {
  //   to: "/expenses",
  //   label: "Expenses",
  //   shortLabel: "Expenses",
  //   icon: "💸",
  //   featureId: "expenses",
  // },
  {
    to: "/users",
    label: "Users",
    shortLabel: "Users",
    icon: "👤",
    featureId: "users",
  },
  {
    to: "/settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: "⚙️",
    featureId: "settings",
  },
  {
    to: "/clients",
    label: "Add New Client",
    shortLabel: "Clients",
    icon: "🏢",
    featureId: "clients",
  },
];

export const AppShell = ({ children, user, onLogout, api }) => {
  const location = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <>
      {/* Ensure html, body, #root are full height for flex scroll context */}
      <style>{`html, body, #root { height: 100%; min-height: 0; }`}</style>
      <div className="relative flex flex-col h-full min-h-0 overflow-hidden font-sans bg-background-primary md:flex-row print:block print:h-auto print:overflow-visible print:bg-white">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none print:hidden">
          <div className="absolute -top-36 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary-subtle blur-3xl opacity-65 motion-safe:animate-pulse" />
          <div className="absolute -bottom-44 -left-32 h-[32rem] w-[32rem] rounded-full bg-accent-subtle blur-3xl opacity-70 motion-safe:animate-pulse" />
          <div className="absolute -bottom-40 -right-28 h-[26rem] w-[26rem] rounded-full bg-primary-subtle blur-3xl opacity-55 motion-safe:animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-b from-background-primary via-background-primary to-background-subtle opacity-90" />
        </div>

        {/* ================= MOBILE HEADER ================= */}
        <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-background-secondary/90 backdrop-blur-md md:hidden print:hidden">
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">
              <span className="text-primary">Q</span>
              <span className="text-accent">pos</span>
            </h1>

            <p className="text-xs font-medium truncate text-text-tertiary">
              {user?.name} • {user?.role}
            </p>
          </div>

          <motion.button
            type="button"
            onClick={onLogout}
            whileTap={{ scale: 0.98 }}
            className="
            cursor-pointer rounded-xl border border-gray-200 bg-red-500 px-3 py-1.5
            text-xs font-semibold text-white
            shadow-soft transition
            hover:-translate-y-0.5 hover:bg-red-600 hover:text-status-error-text hover:shadow-card
            focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25
            active:translate-y-0
          "
          >
            Logout
          </motion.button>
        </header>

        {/* ================= DESKTOP SIDEBAR ================= */}
        <aside className="fixed top-0 bottom-0 left-0 flex-col hidden w-64 overflow-y-auto border-r border-gray-200 bg-background-secondary/90 shadow-card backdrop-blur-md md:flex print:hidden">
          <div className="flex flex-col items-center justify-center px-4 py-6 border-b border-gray-200 text-center">
            <img
              src="/logo.png"
              alt="Kanesha Fancy"
              className="w-full max-w-[170px] h-auto object-contain"
            />
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              const hasAccess = userHasFeatureAccess(user, item.featureId);

              // Hide items user doesn't have access to
              if (!hasAccess) return null;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={[
                    "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold",
                    "transition-all duration-200 cursor-pointer",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25",
                    isActive
                      ? "bg-primary text-white shadow-float"
                      : "text-text-secondary hover:bg-background-subtle hover:text-accent hover:shadow-soft",
                  ].join(" ")}
                >
                  <span className="truncate">{item.label}</span>

                  {/* Subtle active indicator */}
                  <span
                    className={[
                      "ml-3 h-2 w-2 flex-none rounded-full transition",
                      isActive
                        ? "bg-accent"
                        : "bg-border-light group-hover:bg-accent-light",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </nav>

          <div className="px-5 py-4 border-t border-gray-200 bg-background-subtle">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-primary">
                  {user?.name}
                </p>
                <p className="text-xs font-medium capitalize text-text-tertiary">
                  {user?.role}
                </p>
              </div>

              <motion.button
                type="button"
                onClick={onLogout}
                whileTap={{ scale: 0.98 }}
                className="
              cursor-pointer rounded-xl
              bg-red-500 px-3 py-1.5
              text-xs font-semibold text-white
              shadow-soft transition
              hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-card
              focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25
              active:bg-error-active active:translate-y-0
            "
              >
                Logout
              </motion.button>
            </div>
          </div>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="relative flex-1 md:ml-64 mt-[60px] md:mt-0 mb-[64px] md:mb-0 flex flex-col min-h-0 h-full w-full print:ml-0 print:mt-0 print:mb-0 print:h-auto print:block">
          {/* Horizontal Navigation Bar */}
          <div className="print:hidden">
            <HorizontalNav api={api} />
          </div>

          <div className="flex items-start justify-center flex-1 w-full h-full min-h-0 px-1 py-1 xs:px-2 xs:py-2 sm:px-4 sm:py-4 md:px-6 md:py-6 print:block print:p-0 print:h-auto print:min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              className="
                group w-full max-w-7xl overflow-hidden
                rounded-2xl md:rounded-3xl border border-gray-200
                bg-background-secondary/90
                shadow-card backdrop-blur-md
                transition-all duration-300
                hover:-translate-y-0.5 hover:shadow-float
                flex flex-col min-h-0 flex-1 h-full
                relative
                print:block print:h-auto print:w-full print:max-w-none
                print:overflow-visible print:rounded-none print:border-0
                print:bg-white print:shadow-none
              "
            >
              <div className="h-1 w-full bg-accent md:h-1.5 print:hidden" />

              {/* Inner padding, scroll only if overflow */}
              <div className="flex-1 h-full min-h-0 p-2 -mt-4 overflow-y-auto orange-scrollbar xs:p-3 sm:p-4 md:p-6 lg:p-8 md:-mt-6 lg:-mt-4 print:block print:h-auto print:min-h-0 print:overflow-visible print:m-0 print:p-0">
                {/* MAIN CONTENT: Only scrollable vertically */}
                {children}
              </div>

              {/* Subtle hover ring */}
              <div className="absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none group-hover:opacity-100 print:hidden">
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl " />
              </div>
            </motion.div>
          </div>
        </main>

        {/* ================= MOBILE BOTTOM NAV ================= */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden print:hidden">
          {/* iOS safe-area + glass bar */}
          <div className="absolute inset-0 border-t border-gray-200 pointer-events-none bg-white/95 shadow-float backdrop-blur-md" />
          <div className="absolute inset-x-0 top-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          <div className="relative px-1 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-1.5">
            <div className="flex items-stretch justify-around">
              {navItems.slice(0, 4).map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                const hasAccess = userHasFeatureAccess(user, item.featureId);

                // Hide items user doesn't have access to
                if (!hasAccess) return null;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={[
                      "group relative flex min-w-0 flex-1 flex-col items-center justify-center cursor-pointer",
                      "rounded-xl px-1 py-2",
                      "select-none transition-all duration-200",
                      "active:scale-[0.97]",
                      "focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25",
                      isActive
                        ? "bg-accent-subtle text-primary shadow-soft"
                        : "text-text-tertiary hover:bg-background-subtle hover:text-text-primary",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="text-lg leading-none" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="mt-0.5 text-[10px] font-semibold leading-tight text-center">
                      {item.shortLabel}
                    </span>
                    <span
                      className={[
                        "mt-1 h-0.5 w-5 rounded-full transition-all duration-200",
                        isActive ? "bg-accent" : "bg-transparent",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}

              <div className="relative flex min-w-0 flex-1 items-stretch justify-center">
                <motion.button
                  type="button"
                  onClick={() => setShowMoreMenu((v) => !v)}
                  whileTap={{ scale: 0.98 }}
                  className={[
                    "group cursor-pointer hover:text-accent relative flex w-full min-w-0 flex-col items-center justify-center",
                    "rounded-xl px-1 py-2",
                    "select-none transition-all duration-200",
                    "active:scale-[0.97]",
                    "focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25",
                    showMoreMenu
                      ? "bg-background-subtle text-text-primary shadow-soft"
                      : "text-text-tertiary hover:bg-background-subtle hover:text-text-primary",
                  ].join(" ")}
                  aria-haspopup="menu"
                  aria-expanded={showMoreMenu}
                >
                  <span className="text-lg leading-none" aria-hidden="true">
                    ☰
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold leading-tight">
                    More
                  </span>
                  <span
                    className={[
                      "mt-1 h-0.5 w-5 rounded-full transition-all duration-200",
                      showMoreMenu ? "bg-accent" : "bg-transparent",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </motion.button>

                <AnimatePresence>
                  {showMoreMenu && (
                    <>
                      {/* click-away backdrop */}
                      <motion.button
                        key="more-backdrop"
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setShowMoreMenu(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 cursor-default bg-black/10"
                      />

                      <motion.div
                        key="more-menu"
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 30,
                        }}
                        className={[
                          "absolute bottom-[3.75rem] right-0 z-50",
                          "min-w-[200px] overflow-hidden",
                          "rounded-2xl border border-gray-200",
                          "bg-white shadow-float",
                        ].join(" ")}
                        role="menu"
                      >
                        <div className="px-4 py-3 border-b border-gray-200 bg-background-subtle">
                          <p className="text-[11px] font-semibold tracking-wider text-text-secondary">
                            MORE
                          </p>
                        </div>

                        <div className="py-2">
                          {navItems.slice(4).map((item) => {
                            const isActive = location.pathname.startsWith(
                              item.to,
                            );
                            const hasAccess = userHasFeatureAccess(
                              user,
                              item.featureId,
                            );

                            // Hide items user doesn't have access to
                            if (!hasAccess) return null;

                            return (
                              <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setShowMoreMenu(false)}
                                className={[
                                  "block cursor-pointer",
                                  "px-4 py-3",
                                  "text-sm font-semibold hover:text-accent",
                                  "transition",
                                  "active:scale-[0.99]",
                                  isActive
                                    ? "bg-accent-subtle text-primary"
                                    : "text-text-secondary hover:bg-background-subtle hover:text-text-primary",
                                ].join(" ")}
                                role="menuitem"
                              >
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>

                        <div className="px-3 py-3 border-t border-gray-200 bg-background-subtle">
                          <motion.button
                            type="button"
                            onClick={() => {
                              setShowMoreMenu(false);
                              onLogout();
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full cursor-pointer rounded-xl border border-gray-200 bg-red-500 px-3 py-2.5 text-xs font-semibold text-white shadow-soft transition hover:bg-red-400 hover:text-white hover:shadow-card focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25"
                          >
                            Logout
                          </motion.button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </nav>

        {/* Click-away area for mobile "More" (keeps logic, just closes on background click) */}
        <AnimatePresence>
          {showMoreMenu && (
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setShowMoreMenu(false)}
              className="fixed inset-0 z-40 cursor-pointer md:hidden"
              style={{ background: "transparent" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default function Layout({ children }) {
  return <>{children}</>;
}
