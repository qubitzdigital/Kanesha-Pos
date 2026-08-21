// All functions now accept api as the first argument
export const getSettings = async (api) => {
  const { data } = await api.get("/settings");
  return data;
};

export const updateSettings = async (api, settings) => {
  const { data } = await api.put("/settings", settings);
  return data;
};

export const loadVatRate = async (api) => {
  try {
    const data = await getSettings(api);
    if (typeof data.vatRate === "number" && data.vatRate >= 0) {
      return data.vatRate;
    }
    return 0.15;
  } catch (error) {
    console.error("Failed to load VAT rate:", error);
    return 0.15;
  }
};

export const loadCurrencySettings = async (api) => {
  try {
    const data = await getSettings(api);
    return {
      currency: data.currency || "LKR",
      currencySymbol: data.currencySymbol || "Rs.",
      currencyPosition: data.currencyPosition || "before",
    };
  } catch (error) {
    console.error("Failed to load currency settings:", error);
    return {
      currency: "LKR",
      currencySymbol: "Rs.",
      currencyPosition: "before",
    };
  }
};
