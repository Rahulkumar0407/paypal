/**
 * lib/paypal: the PayPal sandbox client. Owner: Person 2.
 * Only lib/guard, app/api/paypal and app/store may import this (ESLint enforces it).
 */
export {
  PAYPAL_SANDBOX_BASE,
  createOrder,
  getOrder,
  captureOrder,
  refundCapture,
  createPayout,
  verifyWebhookSignature,
  type CreateOrderInput,
} from "./client";
