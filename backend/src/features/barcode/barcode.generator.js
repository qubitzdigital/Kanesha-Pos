/**
 * Generates a unique barcode string from a seed string.
 * Format: SEED-XXXXXX  (uppercase slug + 6-digit random suffix)
 */
export const generateBarcodeValue = (seed = "") => {
  const base = seed.trim().toUpperCase().replace(/\s+/g, "-");
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `${base}-${suffix}`;
};
