// Validate a single field
export const validateField = (field, value) => {
  let error = "";

  switch (field) {
    case "category": {
      const v = (value || "").trim();
      if (!v) {
        error = "Category is required.";
      } else if (v.length > 50) {
        error = "Category must not exceed 50 characters.";
      }
      break;
    }

    case "description": {
      const v = (value || "").trim();
      if (!v) {
        error = "";
      } else if (v.length < 3) {
        error = "Description must be at least 3 characters.";
      } else if (v.length > 200) {
        error = "Description must not exceed 200 characters.";
      }
      break;
    }

    case "amount": {
      if (value === "" || value === null || value === undefined) {
        error = "Amount is required.";
      } else {
        const num = Number(value);
        if (Number.isNaN(num)) {
          error = "Amount must be a number.";
        } else if (num <= 0) {
          error = "Amount must be greater than 0.";
        } else if (num > 1_000_000_000) {
          error = "Amount is too large.";
        }
      }
      break;
    }

    case "date": {
      if (!value) {
        error = "Date is required.";
      } else {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) {
          error = "Invalid date.";
        } else {
          const today = new Date();
          const todayMidnight = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          const selectedMidnight = new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate()
          );
          if (selectedMidnight > todayMidnight) {
            error = "Date cannot be in the future.";
          }
        }
      }
      break;
    }

    default:
      break;
  }

  return error;
};

// Validate entire form
export const validateForm = (form) => {
  const newErrors = {};

  // Category
  const category = (form.category || "").trim();
  if (!category) {
    newErrors.category = "Category is required.";
  } else if (category.length > 50) {
    newErrors.category = "Category must not exceed 50 characters.";
  }

  // Description
  const desc = (form.description || "").trim();
  if (desc) {
    if (desc.length < 3) {
      newErrors.description = "Description must be at least 3 characters.";
    } else if (desc.length > 200) {
      newErrors.description = "Description must not exceed 200 characters.";
    }
  }

  // Amount
  if (form.amount === "" || form.amount === null || form.amount === undefined) {
    newErrors.amount = "Amount is required.";
  } else {
    const num = Number(form.amount);
    if (Number.isNaN(num)) {
      newErrors.amount = "Amount must be a number.";
    } else if (num <= 0) {
      newErrors.amount = "Amount must be greater than 0.";
    } else if (num > 1_000_000_000) {
      newErrors.amount = "Amount is too large.";
    }
  }

  // Date
  if (!form.date) {
    newErrors.date = "Date is required.";
  } else {
    const d = new Date(form.date);
    if (Number.isNaN(d.getTime())) {
      newErrors.date = "Invalid date.";
    } else {
      const today = new Date();
      const todayMidnight = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const selectedMidnight = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      );
      if (selectedMidnight > todayMidnight) {
        newErrors.date = "Date cannot be in the future.";
      }
    }
  }

  return newErrors;
};

// Validate new category
export const validateNewCategory = (value, categories) => {
  let error = "";
  const v = (value || "").trim();

  if (!v) {
    error = "Category name is required.";
  } else if (v.length > 50) {
    error = "Category name must not exceed 50 characters.";
  } else if (
    categories.some((c) => (c || "").toLowerCase() === v.toLowerCase())
  ) {
    error = "This category already exists.";
  }

  return error;
};

// Empty form template
export const emptyForm = () => ({
  category: "",
  description: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
});

// Empty errors template
export const emptyErrors = () => ({
  category: "",
  description: "",
  amount: "",
  date: "",
});
