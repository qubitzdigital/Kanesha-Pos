// All functions now accept api as the first argument
export const loadExpenseCategories = async (api) => {
  try {
    const { data } = await api.get("/settings");
    return data.expenseCategories || [];
  } catch (error) {
    console.error("Failed to load expense categories:", error);
    return [];
  }
};

export const addExpenseCategory = async (api, category) => {
  const { data } = await api.post("/settings/expense-categories", {
    category,
  });
  return data;
};
