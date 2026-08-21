/**
 * Format a number with currency symbol based on position
 * @param {number} amount - The amount to format
 * @param {string} symbol - Currency symbol (e.g., "Rs.", "$", "€")
 * @param {string} position - Position of symbol ("before" or "after")
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, symbol = "Rs.", position = "before") => {
  const formattedAmount = Number(amount || 0).toFixed(2);

  if (position === "after") {
    return `${formattedAmount} ${symbol}`;
  }

  // Default is "before"
  return `${symbol} ${formattedAmount}`;
};
