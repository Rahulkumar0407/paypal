import type { OutboxMessage, RecoveryCandidate, ReminderDraft } from "@/types";
import { MOCK_STORE_ID } from "./forecast";

/** FAKE recovery data: abandoned and failed checkouts, and the simulated outbox. */

export const mockRecoveryCandidates: RecoveryCandidate[] = [
  {
    orderId: "ord_1243",
    orderNumber: 1243,
    customerId: "cust_0001",
    customerName: "Maya Okafor",
    status: "ABANDONED",
    amountCents: 7_200,
    lastActivityOn: "2026-11-03",
    contactConsent: true,
    remindersSentLast48h: 0,
  },
  {
    orderId: "ord_1244",
    orderNumber: 1244,
    customerId: "cust_0023",
    customerName: "Hana Sato",
    status: "ABANDONED",
    amountCents: 4_500,
    lastActivityOn: "2026-11-04",
    contactConsent: false,
    remindersSentLast48h: 0,
  },
  {
    orderId: "ord_1246",
    orderNumber: 1246,
    customerId: "cust_0042",
    customerName: "Sam Whitfield",
    status: "FAILED",
    amountCents: 11_900,
    lastActivityOn: "2026-11-04",
    contactConsent: true,
    remindersSentLast48h: 0,
  },
];

export const mockReminderDraft: ReminderDraft = {
  subject: "Your Loop Kids headphones are still in your cart",
  body:
    "Hi Maya, your Loop Kids headphones and ear cushions are still waiting for you. " +
    "Here's a fresh checkout link if you'd like to finish your order: {checkout_link}\n\nLoop Audio",
  source: "template",
};

export const mockOutbox: OutboxMessage[] = [
  {
    id: "out_1",
    storeId: MOCK_STORE_ID,
    proposalId: "prop_reminder_1",
    orderId: "ord_1243",
    to: "maya.okafor@example.com",
    subject: mockReminderDraft.subject,
    body: "Hi Maya, your Loop Kids headphones and ear cushions are still waiting for you. Use the link below to finish your order.\n\nLoop Audio",
    checkoutUrl: "https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T",
    paypalOrderId: "5O190127TN364715T",
    sentAt: "2026-11-05T09:12:06-05:00",
    simulated: true,
  },
];
