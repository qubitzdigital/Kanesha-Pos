import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { loadCurrencySettings } from "../api/settings/settings";
import {
  ExpensesHeader,
  ExpensesForm,
  ExpensesTable,
  ExpensesFooter,
} from "../components/expenses";
import {
  validateField,
  validateForm,
  validateNewCategory,
  emptyForm,
  emptyErrors,
} from "../utils/expenses";
import {
  loadExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  loadExpenseCategories,
  addExpenseCategory,
} from "../api/expenses";
import {
  showSuccess,
  showError,
  errorMessages,
  successMessages,
} from "../utils/toastHelper";

const ExpensesPage = ({ api }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryError, setNewCategoryError] = useState("");

  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState(emptyErrors());

  // ---------- Helpers ----------

  const handleValidateField = (field, value) => {
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleValidateForm = () => {
    const newErrors = validateForm(form);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const confirmWithToast = (message) =>
    new Promise((resolve) => {
      toast.custom(
        (t) => (
          <div
            className={`max-w-sm w-full bg-white border border-gray-200 shadow-xl rounded-2xl px-4 py-3 text-sm flex flex-col gap-2 transition-all ${
              t.visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="font-semibold text-gray-800">Confirm action</p>
            <p className="text-xs text-gray-600">{message}</p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm text-gray-700 transition-all bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 active:scale-95"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
              >
                ✕ Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 font-medium text-white transition-all bg-red-600 rounded-lg cursor-pointer hover:bg-red-700 active:scale-95"
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ),
        { duration: Infinity },
      );
    });

  // ---------- Data loading ----------

  const loadExpensesData = async () => {
    setLoading(true);
    try {
      const expenses = await loadExpenses(api);
      setExpenses(Array.isArray(expenses) ? expenses : []);
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.load("expenses"));
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesData = async () => {
    try {
      const cats = await loadExpenseCategories(api);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  useEffect(() => {
    loadExpensesData();
    loadCategoriesData();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await loadCurrencySettings(api);
        setCurrencySymbol(settings.currencySymbol || "Rs.");
        setCurrencyPosition(settings.currencyPosition || "before");
      } catch (error) {
        // Use defaults if error
      }
    };
    loadSettings();
  }, [api]);

  // ---------- Form handlers ----------

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setErrors(emptyErrors());
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    handleValidateField(field, value);
  };

  const saveExpense = async (e) => {
    e.preventDefault();

    if (!handleValidateForm()) {
      showError(errorMessages.validation);
      return;
    }

    const payload = {
      category: form.category.trim(),
      description: form.description.trim() || "",
      amount: Number(form.amount),
      date: form.date,
    };

    try {
      if (editingId) {
        await updateExpense(api, editingId, payload);
        showSuccess(successMessages.update("Expense"));
      } else {
        await createExpense(api, payload);
        showSuccess(successMessages.create("Expense"));
      }
      resetForm();
      await loadExpensesData();
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.save("expense"));
    }
  };

  const handleEdit = (exp) => {
    setEditingId(exp._id);
    setForm({
      category: exp.category || "",
      description: exp.description || "",
      amount:
        typeof exp.amount === "number"
          ? exp.amount.toString()
          : exp.amount || "",
      date: exp.date
        ? exp.date.substring(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
    setErrors(emptyErrors());
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction(
      "Are you sure you want to delete this expense?",
      "Delete Expense",
    );
    if (!confirmed) return;

    try {
      await deleteExpense(api, id);
      showSuccess(successMessages.delete("Expense"));
      await loadExpensesData();
    } catch (err) {
      showError(
        err?.response?.data?.message || errorMessages.delete("expense"),
      );
    }
  };

  const handleValidateNewCategory = (value) => {
    const error = validateNewCategory(value, categories);
    setNewCategoryError(error);
    return !error;
  };

  const handleAddCategory = async () => {
    const value = newCategory.trim();
    if (!handleValidateNewCategory(value)) {
      if (newCategoryError) {
        showError(newCategoryError);
      }
      return;
    }

    try {
      const result = await addExpenseCategory(api, value);
      setCategories(result.expenseCategories || []);
      setForm((f) => ({ ...f, category: value }));
      setNewCategory("");
      setNewCategoryError("");
      setShowAddCategory(false);
      showSuccess("Category added successfully");
    } catch (error) {
      showError("Failed to add category. Try again");
    }
  };

  // Totals (used in multiple places)
  const totalExpenses = (Array.isArray(expenses) ? expenses : []).reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0,
  );

  const currentMonthTotal = (Array.isArray(expenses) ? expenses : [])
    .filter((e) => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="min-h-screen px-3 py-4 sm:px-4 md:px-6 lg:px-8">
      {/* No Toaster component needed - centralized in App.jsx */}

      <div className="pb-10 mx-auto space-y-6 max-w-7xl">
        <ExpensesHeader
          totalExpenses={totalExpenses}
          categories={categories}
          expenses={expenses}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />

        {/* Main Content */}
        <main className="grid gap-6 md:grid-cols-2 md:items-start">
          <ExpensesForm
            editingId={editingId}
            form={form}
            errors={errors}
            categories={categories}
            showAddCategory={showAddCategory}
            setShowAddCategory={setShowAddCategory}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            newCategoryError={newCategoryError}
            validateNewCategory={handleValidateNewCategory}
            handleAddCategory={handleAddCategory}
            handleFieldChange={handleFieldChange}
            saveExpense={saveExpense}
            resetForm={resetForm}
          />

          <ExpensesTable
            expenses={expenses}
            loading={loading}
            totalExpenses={totalExpenses}
            currencySymbol={currencySymbol}
            currencyPosition={currencyPosition}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            loadExpenses={loadExpensesData}
          />
        </main>

        <ExpensesFooter />
      </div>
    </div>
  );
};

export default ExpensesPage;
