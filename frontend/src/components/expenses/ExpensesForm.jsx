import React from "react";
import CloseButton from "../common/CloseButton";
const ExpensesForm = ({
  editingId,
  form,
  errors,
  categories,
  showAddCategory,
  setShowAddCategory,
  newCategory,
  setNewCategory,
  newCategoryError,
  validateNewCategory,
  handleAddCategory,
  handleFieldChange,
  saveExpense,
  resetForm,
}) => {
  return (
    <section className="p-5 bg-white border border-gray-200 shadow-lg rounded-2xl sm:p-6">
      <div className="flex flex-col justify-between gap-3 mb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
            {editingId ? "Edit Expense" : "Add New Expense"}
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            {editingId
              ? "Update the expense details below."
              : "Fill in the details to record a new expense."}
          </p>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="self-start px-4 py-2 text-xs font-medium text-gray-700 transition-all border border-gray-300 cursor-pointer rounded-xl sm:text-sm hover:bg-gray-50 hover:shadow-sm active:scale-95 sm:self-auto"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={saveExpense} className="space-y-5" autoComplete="off">
        {/* Category Field */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setShowAddCategory((prev) => !prev);
              }}
              className="flex items-center gap-1 text-xs font-medium cursor-pointer text-accent sm:text-sm hover:text-blue-800 hover:underline"
            >
              <span className="text-base leading-none">＋</span>
              <span>Add Category</span>
            </button>
          </div>

          {showAddCategory && (
            <div className="p-4 mb-4 space-y-3 border border-gray-200 bg-gray-50 rounded-xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <input
                    type="text"
                    className={`w-full rounded-xl px-3 sm:px-4 py-2.5 text-sm border transition-colors ${
                      newCategoryError
                        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    }`}
                    value={newCategory}
                    onChange={(e) => {
                      setNewCategory(e.target.value);
                      if (newCategoryError) {
                        validateNewCategory(e.target.value);
                      }
                    }}
                    placeholder="Enter new category name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                  {newCategoryError && (
                    <p className="mt-2 ml-1 text-xs text-red-600">
                      {newCategoryError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:self-stretch">
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    Add
                  </button>
                  <CloseButton
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory("");
                    }}
                    size="sm"
                    variant="subtle"
                    ariaLabel="Cancel adding category"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Category will be available for all future expenses.
              </p>
            </div>
          )}

          <div className="relative">
            <select
              className={`w-full rounded-xl px-3 sm:px-4 py-2.5 text-sm border transition-colors appearance-none cursor-pointer ${
                errors.category
                  ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              }`}
              value={form.category}
              onChange={(e) => handleFieldChange("category", e.target.value)}
            >
              <option value="" className="text-gray-400">
                Select a category
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="text-gray-700">
                  {cat}
                </option>
              ))}
            </select>
            <span className="absolute text-xs text-gray-400 -translate-y-1/2 pointer-events-none right-3 top-1/2">
              ▼
            </span>
          </div>
          {errors.category && (
            <p className="mt-2 ml-1 text-xs text-red-600">{errors.category}</p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            className={`w-full rounded-xl px-3 sm:px-4 py-2.5 text-sm border transition-colors ${
              errors.description
                ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }`}
            value={form.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            placeholder="e.g., Lorry hire for cement delivery, office supplies"
          />
          {errors.description && (
            <p className="mt-2 ml-1 text-xs text-red-600">
              {errors.description}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Optional: Add details to help identify this expense.
          </p>
        </div>

        {/* Amount and Date Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Amount (Rs.) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute text-sm text-gray-500 -translate-y-1/2 left-3 sm:left-4 top-1/2">
                Rs.
              </span>
              <input
                type="number"
                className={`w-full rounded-xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 text-sm border transition-colors ${
                  errors.amount
                    ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                }`}
                value={form.amount}
                onChange={(e) => handleFieldChange("amount", e.target.value)}
                onWheel={(e) => e.target.blur()}
                min="0"
                step="1"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-2 ml-1 text-xs text-red-600">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={`w-full rounded-xl px-3 sm:px-4 py-2.5 text-sm border transition-colors ${
                errors.date
                  ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              }`}
              value={form.date}
              onChange={(e) => handleFieldChange("date", e.target.value)}
            />
            {errors.date && (
              <p className="mt-2 ml-1 text-xs text-red-600">{errors.date}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 text-sm font-semibold text-white transition-all shadow-md cursor-pointer bg-primary hover:bg-primary/90 sm:w-auto px-7 sm:px-8 rounded-xl sm:text-base hover:from-blue-700 hover:to-blue-800 active:scale-95 hover:shadow-lg inline-flex items-center justify-center gap-2"
          >
            {editingId ? "✏️ Update Expense" : "💾 Save Expense"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ExpensesForm;
