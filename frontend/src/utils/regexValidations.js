// regexValidations.js
// Centralized regex patterns for validation across the app

const regexValidations = {
  // Full name: one or more words, letters only (spaces between)
  name: /^[A-Za-z]+(?:\s[A-Za-z]+)*$/,
  // Username: starts with letter, 4-20 chars, letters/numbers/_ only
  username: /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/,
  // Sri Lankan mobile without +94: 9 digits starting with 7
  phone: /^7[0-9]{8}$/,
  // Password: 8+ chars, upper, lower, number, special (@$!%*?&)
  // Used in OwnerSignupPage and ResetPassword
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  // Password (LoginPage): 8+ chars, upper, lower, number, special (any non-alphanumeric)
  passwordLogin: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
};

export default regexValidations;
