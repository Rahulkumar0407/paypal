-- P1-9: one row per PayPal checkout for an order (the store checkout, or a fresh link in a reminder).
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED', 'APPROVED', 'CAPTURED', 'DENIED', 'CANCELLED', 'REFUNDED');

CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paypalOrderId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
    "paypalCaptureId" TEXT,
    "grossCents" INTEGER,
    "feeCents" INTEGER,
    "netCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentAttempt_paypalOrderId_key" ON "PaymentAttempt"("paypalOrderId");
CREATE INDEX "PaymentAttempt_storeId_orderId_idx" ON "PaymentAttempt"("storeId", "orderId");
CREATE INDEX "PaymentAttempt_paypalCaptureId_idx" ON "PaymentAttempt"("paypalCaptureId");

ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
