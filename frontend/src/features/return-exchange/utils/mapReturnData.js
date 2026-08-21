const mapLine = (item) => ({
  itemId: item._id,
  name: item.name,
  sku: item.sku,
  unit: item.unit,
  vatApplicable: item.vatApplicable,
  ...(item.batchId && { batchId: item.batchId }),
  ...(item.batchNumber && { batchNumber: item.batchNumber }),
  ...(item.variantSize && { variantSize: item.variantSize }),
});

// Builds the /returns payload for a plain return (refund only).
export const mapReturnData = ({ returnItems, reason, reasonNote }) => ({
  reason,
  reasonNote: reasonNote?.trim() || undefined,
  returnLines: returnItems.map((item) => ({
    ...mapLine(item),
    returnQty: item.returnQty,
    unitPrice: item.unitPrice,
  })),
});

// Builds the /returns/exchange payload: the returned item(s) plus the
// newly issued item(s).
export const mapExchangeData = ({
  returnItems,
  exchangeItems,
  reason,
  reasonNote,
}) => ({
  reason,
  reasonNote: reasonNote?.trim() || undefined,
  returnLines: returnItems.map((item) => ({
    ...mapLine(item),
    returnQty: item.returnQty,
    unitPrice: item.unitPrice,
  })),
  exchangeLines: exchangeItems.map((item) => ({
    ...mapLine(item),
    qty: item.qty,
    unitPrice: item.unitPrice,
  })),
});
