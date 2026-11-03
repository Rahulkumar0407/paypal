import { describe, expect, it } from "vitest";
import { checkPayPal } from "./context";
import { withCheckoutLink } from "./executor";

describe("the PayPal check behind rule 1", () => {
  it("needs no call for an order PayPal has never seen", async () => {
    let called = false;
    expect(await checkPayPal(null, async () => ((called = true), { id: "x", status: "CREATED", approveUrl: null }))).toEqual({ kind: "NO_PAYPAL_ORDER" });
    expect(called).toBe(false);
  });

  it("reports what PayPal says", async () => {
    expect(await checkPayPal("PP1", async (id) => ({ id, status: "COMPLETED", approveUrl: null }))).toEqual({ kind: "CHECKED", paypalOrderId: "PP1", status: "COMPLETED" });
  });

  it("reports PayPal as unreachable instead of guessing", async () => {
    expect(
      await checkPayPal("PP1", async () => {
        throw new Error("timeout");
      }),
    ).toEqual({ kind: "UNREACHABLE", paypalOrderId: "PP1" });
  });
});

describe("the reminder's checkout link", () => {
  it("is put in by code, where the draft asks for it, or at the end", () => {
    expect(withCheckoutLink("Here's your link: {checkout_link}. Thanks", "https://pay/1")).toBe("Here's your link: https://pay/1. Thanks");
    expect(withCheckoutLink("Your order is waiting.", "https://pay/1")).toBe("Your order is waiting.\n\nhttps://pay/1");
  });
});
