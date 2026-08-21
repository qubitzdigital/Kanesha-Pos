// Send OTP to phone using Notify API
export const sendOtp = async (api, phone, purpose = "FORGOT_PASSWORD") => {
  // purpose can be "FORGOT_PASSWORD", "LOGIN", etc.
  const { data } = await api.post("/otp/send", { phone, purpose });
  return data;
};

// Verify OTP
export const verifyOtp = async (api, phone, otp, purpose = "FORGOT_PASSWORD") => {
  const { data } = await api.post("/otp/verify", { phone, otp, purpose });
  return data;
};

// Reset password after OTP verification
export const resetPassword = async (api, password) => {
  const { data } = await api.post("/otp/reset-password", { password });
  return data;
};
