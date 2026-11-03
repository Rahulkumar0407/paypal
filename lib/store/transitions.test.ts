import { describe, expect, it } from "vitest";
import type { PayPalCapture } from "@/types";
import { afterApproved, afterCancelled, afterCaptured, afterDenied, afterRefunded, type PaymentState } from "./transitions";

const START: PaymentState = {
  attempt: { status: "CREATED", paypalCaptureId: null, grossCents: null, feeCents: null, netCents: null },
  order: { status: "ABANDONED", failedAttempts: 0, feeCents: null, netCents: null, paypalOrderId: "PP_ORDER", paypalCaptureId: null },
  ledger: { sales: [], refunds: [] },
};
const CAPTURE: PayPalCapture = { orderId: "PP_ORDER", captureId: "CAP_1", grossCents: 7_200, feeCents: 300, netCents: 6_900 };
const capture = (s: PaymentState) => afterCaptured(s, "PP_ORDER", CAPTURE);

describe("payment state", () => {
  it("ends the same whether the buyer's return or the webhook arrives first", () => {
    // Return first: approved, captured on return, then the webhook's capture and a late approval.
    const returnFirst = afterApproved(capture(capture(afterApproved(START))));
    // Webhook first: the capture arrives before anything else, then the return captures again.
    const webhookFirst = capture(afterApproved(capture(START)));
    expect(returnFirst).toEqual(webhookFirst);
    expect(returnFirst.order).toMatchObject({ status: "CAPTURED", feeCents: 300, netCents: 6_900, paypalCaptureId: "CAP_1" });
    expect(returnFirst.ledger.sales).toEqual([{ captureId: "CAP_1", netCents: 6_900 }]);
  });

  it("changes nothing when a step has already happened", () => {
    const paid = capture(START);
    expect(capture(paid)).toBe(paid);
    expect(afterApproved(paid)).toBe(paid);
    expect(afterDenied(paid)).toBe(paid);
    expect(afterCancelled(paid)).toBe(paid);
  });

  it("marks the order pending once approved, and failed once denied (counting the attempt once)", () => {
    expect(afterApproved(START).order.status).toBe("PENDING");
    const denied = afterDenied(START);
    expect(denied.order).toMatchObject({ status: "FAILED", failedAttempts: 1 });
    expect(afterDenied(denied)).toBe(denied);
  });

  it("leaves the order unfinished when the buyer cancels", () => {
    const cancelled = afterCancelled(START);
    expect(cancelled.attempt.status).toBe("CANCELLED");
    expect(cancelled.order.status).toBe("ABANDONED");
  });

  it("records a refund once", () => {
    const refunded = afterRefunded(capture(START), "REF_1", 7_200);
    expect(refunded.order.status).toBe("REFUNDED");
    expect(refunded.ledger.refunds).toEqual([{ refundId: "REF_1", amountCents: 7_200 }]);
    expect(afterRefunded(refunded, "REF_1", 7_200)).toBe(refunded);
  });
});
