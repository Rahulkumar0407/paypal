import { paypalMode, type PayPalMode } from "@/lib/paypal";

/** The PayPal mode for the store pages, or "off" when it can't be used (fake mode is refused in production). */
export function storeMode(): PayPalMode {
  try {
    return paypalMode();
  } catch {
    return "off";
  }
}
