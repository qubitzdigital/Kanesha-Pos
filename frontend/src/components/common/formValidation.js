// formValidation.js
// Shared validation + normalization logic for Customer & Supplier forms

/**
 * -----------------------------------------------------
 * SHARED REGEX PATTERNS & VALIDATION UTILITIES
 * -----------------------------------------------------
 */

// SL phone: strictly 10 digits starting with 0 or international +XXXXXXXXXXX (min 10 total digits)
const PHONE_REGEX = /^(0\d{9}|\+?\d{10,15})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// SL NIC: 9 digits + V/X OR new 12-digit format
const NIC_REGEX = /^(\d{9}[vVxX]|\d{12})$/;

export const isValidPhoneNumber = (phone) =>
  typeof phone === "string" && PHONE_REGEX.test(phone.trim());

export const isValidEmail = (email) =>
  typeof email === "string" && EMAIL_REGEX.test(email.trim());

export const isValidNic = (nic) =>
  typeof nic === "string" && NIC_REGEX.test(nic.trim());

/**
 * -----------------------------------------------------
 * CUSTOMER VALIDATION
 * -----------------------------------------------------
 */
export const validateCustomerForm = (rawForm) => {
  const errors = [];

  const name = rawForm.name?.trim() || "";
  const phone = rawForm.phone?.trim() || "";
  const address = rawForm.address?.trim() || "";
  const nic = rawForm.nic?.trim().toUpperCase() || "";
  const type = rawForm.type || "both";
  const creditLimit = Number(rawForm.creditLimit ?? 0);
  const notes = rawForm.notes?.trim() || "";

  // Name
  if (!name) errors.push("Name is required.");
  else if (name.length < 2) errors.push("Name must be at least 2 characters.");

  // Phone
  if (!phone) errors.push("Phone is required.");
  else if (!isValidPhoneNumber(phone)) errors.push("Phone number is invalid.");

  // Address
  if (!address) errors.push("Address is required.");
  else if (address.length < 5)
    errors.push("Address must be at least 5 characters.");

  // NIC
  if (!nic) errors.push("NIC is required.");
  else if (!isValidNic(nic))
    errors.push("NIC is invalid. Use 9 digits + V/X or 12 digits.");

  // Type
  if (!["cash", "credit", "both"].includes(type))
    errors.push("Customer type is invalid.");

  // Credit limit
  if (Number.isNaN(creditLimit) || creditLimit < 0)
    errors.push("Credit limit must be 0 or greater.");

  if (errors.length) return { isValid: false, errors, data: null };

  const normalized = {
    name,
    phone,
    address,
    nic,
    type,
    creditLimit,
    notes,
  };

  return { isValid: true, errors: [], data: normalized };
};

/**
 * -----------------------------------------------------
 * SUPPLIER VALIDATION (Now Uses Shared Validators!)
 * -----------------------------------------------------
 */
export const validateSupplierForm = (rawForm) => {
  const errors = [];

  const supplierCode = rawForm.supplierCode?.trim() || "";
  const name = rawForm.name?.trim() || "";
  const contactPerson = rawForm.contactPerson?.trim() || "";
  const phones = Array.isArray(rawForm.phones)
    ? rawForm.phones.map((p) => p.trim()).filter(Boolean)
    : [];

  const address = rawForm.address?.trim() || "";
  const email = rawForm.email?.trim() || "";
  const nic = rawForm.nic?.trim().toUpperCase() || ""; // OPTIONAL but validated
  const vatNo = rawForm.vatNo?.trim().toUpperCase() || "";
  const brn = rawForm.brn?.trim().toUpperCase() || "";
  const paymentTerms = rawForm.paymentTerms?.trim() || "";
  const notes = rawForm.notes?.trim() || "";
  const status = rawForm.status || "active";

  const openingBalance = Number(
    rawForm.openingBalance === "" || rawForm.openingBalance == null
      ? 0
      : rawForm.openingBalance,
  );

  const creditLimit = Number(
    rawForm.creditLimit === "" || rawForm.creditLimit == null
      ? 0
      : rawForm.creditLimit,
  );

  // Required: Name
  if (!name) errors.push("Supplier name is required.");
  else if (name.length < 2)
    errors.push("Supplier name must be at least 2 characters.");

  // Required: At least one phone
  if (phones.length === 0)
    errors.push("At least one phone number is required. Please add");

  // Validate phone numbers with shared logic
  phones.forEach((phone) => {
    if (!isValidPhoneNumber(phone)) {
      errors.push(`Phone number "${phone}" is invalid.`);
    }
  });

  // Required: Address
  if (!address) errors.push("Address is required.");
  else if (address.length < 5)
    errors.push("Address must be at least 5 characters.");

  // Required: credit limit
  if (Number.isNaN(creditLimit) || creditLimit <= 0)
    errors.push("Credit limit must be greater than 0.");

  // Opening balance: cannot be negative
  if (Number.isNaN(openingBalance) || openingBalance < 0)
    errors.push("Opening balance must be 0 or greater.");

  // Optional: Supplier code
  if (supplierCode && supplierCode.length < 2)
    errors.push("Supplier code must be at least 2 characters.");

  // Optional email, validated using shared logic
  if (email && !isValidEmail(email))
    errors.push("Supplier email address is invalid.");

  // Optional NIC
  if (nic && !isValidNic(nic))
    errors.push("Supplier NIC is invalid. Use 9 digits + V/X or 12 digits.");

  // Status
  if (!["active", "inactive"].includes(status))
    errors.push("Supplier status is invalid.");

  // VAT format
  if (vatNo && !/^[0-9A-Z\-\/]{3,20}$/.test(vatNo))
    errors.push("VAT number format is invalid.");

  // BRN format
  if (brn && !/^[0-9A-Z\-\/]{3,25}$/.test(brn))
    errors.push("BRN format is invalid.");

  if (errors.length) return { isValid: false, errors, data: null };

  const normalized = {
    supplierCode: supplierCode || undefined,
    name,
    contactPerson: contactPerson || undefined,
    phones,
    address,
    email: email || undefined,
    nic: nic || undefined,
    paymentTerms: paymentTerms || undefined,
    vatNo: vatNo || undefined,
    brn: brn || undefined,
    notes: notes || undefined,
    status,
    openingBalance,
    creditLimit,
  };

  return { isValid: true, errors: [], data: normalized };
};
