// backend/services/notifySmsService.js
import axios from "axios";
import { toNotifyMsisdn } from "../utils/phone.js";
import logger from "../utils/logger.js";

const {
  NOTIFYLK_USER_ID,
  NOTIFYLK_API_KEY,
  NOTIFYLK_SENDER_ID,
  NOTIFYLK_BASE_URL,
} = process.env;

export async function sendSmsViaNotify(
  phone,
  message,
  { unicode = false } = {},
) {
  if (!NOTIFYLK_USER_ID || !NOTIFYLK_API_KEY || !NOTIFYLK_SENDER_ID) {
    logger.error("[Notify] Missing env vars", {
      NOTIFYLK_USER_ID,
      hasApiKey: !!NOTIFYLK_API_KEY,
      NOTIFYLK_SENDER_ID,
    });
    throw new Error("Notify.lk environment variables not configured");
  }

  const to = toNotifyMsisdn(phone);

  const params = {
    user_id: NOTIFYLK_USER_ID,
    api_key: NOTIFYLK_API_KEY,
    sender_id: NOTIFYLK_SENDER_ID,
    to,
    message,
  };
  if (unicode) params.type = "unicode";

  try {
    const res = await axios.get(NOTIFYLK_BASE_URL, {
      params,
      timeout: 10000, // 10 seconds
    });

    if (res.data?.status !== "success") {
      throw new Error("NOTIFYLK_SEND_FAILED: " + JSON.stringify(res.data));
    }
    return res.data;
  } catch (err) {
    console.error(
      "[Notify] SMS error:",
      err.response?.data || err.message || err,
    );
    throw err;
  }
}
