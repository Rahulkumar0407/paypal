/**
 * lib/paypal: the PayPal sandbox client. Owner: Person 1.
 * Only lib/guard, app/api/paypal and app/store may import this (ESLint enforces it). Never lib/ai.
 */
export {
  PAYPAL_SANDBOX_BASE,
  FAKE_WEBHOOK_SIGNATURE,
  PayPalError,
  PayPalNotConfiguredError,
  approveFakeOrder,
  captureOrder,
  createCheckoutForOrder,
  createOrder,
  createPayout,
  fromPayPalValue,
  getFakeOrder,
  getOrder,
  paypalMode,
  publishedFeeCents,
  refundCapture,
  restoreFakeOrder,
  toPayPalValue,
  verifyWebhookSignature,
  type CreateOrderInput,
  type PayPalMode,
} from "./client";
export { handleWebhook, normalizeEvent, type ApplyResult, type PayPalWebhookEvent, type WebhookDeps } from "./webhook";
