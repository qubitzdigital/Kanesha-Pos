import React, { useState, useEffect, useRef } from "react";
import AppLoader from "./AppLoader";
import TypewriterText from "../TypewriterText";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loadItems } from "../../api/inventory/items";

const HorizontalNav = ({ api }) => {
  const navigate = useNavigate();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const panelRef = useRef(null);

  useEffect(() => {
    fetchLowStockItems();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLowStockItems, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click / Escape (no logic removed; just UX-safe close)
  useEffect(() => {
    if (!showDropdown) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowDropdown(false);
    };

    const onPointerDown = (e) => {
      if (!panelRef.current) return;
      const clickedInside = panelRef.current.contains(e.target);
      if (!clickedInside) setShowDropdown(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [showDropdown]);

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);
      const items = await loadItems(api, "", true); // lowStock = true
      setLowStockItems(items);
    } catch (error) {
      console.error("Failed to load low stock items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInventory = () => {
    setShowDropdown(false);
    navigate("/inventory");
  };

  const count = lowStockItems.length;

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 shadow-soft backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-end px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 relative">
        {/* Center Heading - Qpos */}
        <div className="absolute -translate-x-1/2 left-1/2">
          <h1 className="text-xl font-bold sm:text-2xl">
            <span className="text-primary">
              <TypewriterText text="Welcome to Q" speed={50} />
            </span>
            <span className="text-accent">
              <TypewriterText text="pos" speed={50} />
            </span>
          </h1>
        </div>

        {/* Low Stock Notification */}
        <div className="relative" ref={panelRef}>
          <motion.button
            type="button"
            onClick={() => setShowDropdown((v) => !v)}
            whileTap={{ scale: 0.98 }}
            className="
              group relative inline-flex cursor-pointer items-center justify-center
              rounded-2xl border border-accent
              bg-white px-3 py-2
              shadow-soft transition-all duration-200
              hover:-translate-y-0.5 hover:bg-background-subtle hover:shadow-card
              focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25
            "
            title="Low Stock Alerts"
            aria-haspopup="menu"
            aria-expanded={showDropdown}
          >
            {/* Bell Icon */}
            <motion.svg
              animate={count > 0 ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={
                count > 0
                  ? { duration: 0.6, repeat: Infinity, repeatDelay: 0.4 }
                  : { duration: 0 }
              }
              className="w-5 h-5 transition-colors duration-200 text-accent group-hover:text-accent sm:h-6 sm:w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </motion.svg>

            {/* Badge */}
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key="badge"
                  initial={{ opacity: 0, scale: 0.7, y: -2 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -2 }}
                  transition={{ type: "spring", stiffness: 520, damping: 28 }}
                  className="
                    absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center
                    rounded-full bg-red-500 px-1.5 text-[11px] font-extrabold text-text-inverse
                    shadow-soft
                  "
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Subtle ping when there are alerts */}
            {count > 0 && (
              <span className="absolute inline-flex w-5 h-5 pointer-events-none -right-1 -top-1">
                <span className="absolute inline-flex w-full h-full bg-red-500 rounded-full opacity-25 motion-safe:animate-ping" />
              </span>
            )}
          </motion.button>

          {/* Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                key="dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.99 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="
                  absolute right-0 top-12 z-50 w-[92vw] max-w-sm overflow-hidden
                  rounded-3xl border border-gray-200
                  bg-white shadow-float
                "
                role="menu"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-background-subtle">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-tight text-text-primary">
                        Low Stock Alerts
                      </p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {count} item(s) need restocking
                      </p>
                    </div>

                    <span
                      className={[
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-soft",
                        "border-gray-200 bg-white text-text-secondary",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "h-2.5 w-2.5 rounded-full",
                          loading
                            ? "bg-yellow-300"
                            : count > 0
                              ? "bg-orange-400"
                              : "bg-green-400",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                      {loading
                        ? "Updating"
                        : count > 0
                          ? "Attention"
                          : "All good"}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto max-h-72">
                  {loading ? (
                    <div className="px-4 py-8">
                      <AppLoader
                        open
                        variant="inline"
                        title="Loading alerts"
                        subtitle="Checking inventory levels"
                      />
                    </div>
                  ) : count === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 22,
                        }}
                        className="flex flex-col items-center max-w-xs mx-auto"
                      >
                        <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-2xl bg-status-success-bg shadow-soft">
                          <span className="text-2xl" aria-hidden="true">
                            ✅
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-primary">
                          All items stocked!
                        </p>
                        <p className="mt-1 text-xs text-accent">
                          No low stock alerts at this time.
                        </p>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="divide-y divide-border-light">
                      {lowStockItems.map((item) => {
                        const onHand = item.inventory?.onHand || 0;
                        const lowLevel = item.lowStockLevel || 0;

                        return (
                          <button
                            key={item._id}
                            type="button"
                            onClick={() => {
                              setShowDropdown(false);
                              navigate("/inventory");
                            }}
                            className="w-full px-4 py-4 text-left transition cursor-pointer hover:bg-background-subtle focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate text-text-primary">
                                  {item.name}
                                </p>
                                <p className="mt-1 text-xs truncate text-text-tertiary">
                                  SKU: {item.sku}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className="inline-flex items-center gap-2 rounded-full bg-red-500-bg px-2.5 py-1 text-[11px] font-extrabold text-red-500-text">
                                  {onHand} {item.baseUnit}
                                </span>
                                <span className="text-[11px] font-semibold text-accent">
                                  Min: {lowLevel}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {count > 0 && (
                  <div className="px-3 py-3 border-t border-gray-200 bg-background-subtle">
                    <motion.button
                      type="button"
                      onClick={handleViewInventory}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 28,
                      }}
                      className="
                        relative w-full cursor-pointer overflow-hidden rounded-2xl
                        bg-accent px-4 py-2.5 text-sm font-semibold text-text-inverse
                        shadow-card transition
                        hover:shadow-float active:bg-accent-active
                        focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25
                      "
                    >
                      {/* Shimmer */}
                      <span className="absolute inset-0 pointer-events-none">
                        <motion.span
                          aria-hidden="true"
                          className="absolute top-0 w-1/2 h-full -skew-x-12 -left-1/2 bg-gradient-to-r from-transparent via-background-secondary/40 to-transparent"
                          initial={{ x: "-120%", opacity: 0 }}
                          animate={{ x: "240%", opacity: [0, 1, 1, 0] }}
                          transition={{
                            duration: 2.2,
                            ease: "easeInOut",
                            repeat: Infinity,
                          }}
                        />
                      </span>

                      <span className="relative">View All Inventory</span>
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default HorizontalNav;
