/**
 * Calculate refund amount for selected return items.
 * @param {Array} returnItems - Items with returnQty and unitPrice
 * @returns {{ subtotal: number, vatAmount: number, total: number }}
 */
export const calculateRefund = (returnItems = []) => {
  const subtotal = returnItems.reduce(
    (sum, item) => sum + (item.returnQty || 0) * (item.unitPrice || 0),
    0,
  );
  // TODO: ADD BACKEND CODE HERE — fetch actual VAT rate from settings API
  const VAT_RATE = 0.18;
  const vatAmount = returnItems.reduce((sum, item) => {
    if (!item.vatApplicable) return sum;
    return sum + (item.returnQty || 0) * (item.unitPrice || 0) * VAT_RATE;
  }, 0);
  return { subtotal, vatAmount, total: subtotal };
};
