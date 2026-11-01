-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SupplierPaymentMethod" AS ENUM ('PAYPAL_PAYOUTS', 'BANK_TRANSFER', 'CARD');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ABANDONED', 'FAILED', 'PENDING', 'CAPTURED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "LedgerCategory" AS ENUM ('SALE', 'SUPPLIER', 'BILL', 'OWNER_TRANSFER', 'LOAN_REPAYMENT', 'REFUND', 'GAP_LOAN');

-- CreateEnum
CREATE TYPE "PayeeKind" AS ENUM ('SUPPLIER', 'BILL', 'OWNER_TRANSFER', 'LOAN');

-- CreateEnum
CREATE TYPE "PayeeStatus" AS ENUM ('DETECTED', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "Cadence" AS ENUM ('EVERY_N_DAYS', 'MONTHLY', 'EVERY_N_WEEKS');

-- CreateEnum
CREATE TYPE "DueStatus" AS ENUM ('SCHEDULED', 'PAID', 'MOVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SEND_REMINDER', 'SET_ASIDE', 'MOVE_PAYMENT', 'GAP_LOAN', 'PAY_SUPPLIER', 'REFUND', 'HOLD_ORDER');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PROPOSED', 'APPROVED', 'ESCALATED', 'BLOCKED', 'OWNER_APPROVED', 'OWNER_REJECTED', 'EXECUTED', 'FAILED');

-- CreateEnum
CREATE TYPE "Decision" AS ENUM ('APPROVE', 'ESCALATE', 'BLOCK');

-- CreateEnum
CREATE TYPE "RiskFlagKind" AS ENUM ('UNUSUAL_AMOUNT', 'NEW_BUYER_BIG_ORDER', 'REPEATED_FAILED_ATTEMPTS');

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "minimumBalanceCents" INTEGER NOT NULL,
    "tightMarginCents" INTEGER NOT NULL,
    "openingBalanceCents" INTEGER NOT NULL,
    "openingBalanceOn" TEXT NOT NULL,
    "whatYouSell" TEXT NOT NULL,
    "supplierPaymentMethod" "SupplierPaymentMethod" NOT NULL DEFAULT 'PAYPAL_PAYOUTS',
    "busySeasons" TEXT[],
    "demoRunId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "costCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactConsent" BOOLEAN NOT NULL,
    "firstSeenOn" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "placedOn" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "feeCents" INTEGER,
    "netCents" INTEGER,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "riskHold" BOOLEAN NOT NULL DEFAULT false,
    "paypalOrderId" TEXT,
    "paypalCaptureId" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "occurredOn" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "category" "LedgerCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "payeeId" TEXT,
    "orderId" TEXT,
    "paypalRef" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payee" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "PayeeKind" NOT NULL,
    "status" "PayeeStatus" NOT NULL,
    "typicalAmountCents" INTEGER NOT NULL,
    "cadence" "Cadence" NOT NULL,
    "intervalDays" INTEGER,
    "intervalWeeks" INTEGER,
    "weekday" INTEGER,
    "dayOfMonth" INTEGER,
    "paypalEmail" TEXT,

    CONSTRAINT "Payee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Due" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "payeeId" TEXT NOT NULL,
    "dueOn" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "DueStatus" NOT NULL DEFAULT 'SCHEDULED',
    "movedFromOn" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Due_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "targetKind" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "params" JSONB NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "draftText" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PROPOSED',
    "demoDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "proposalId" TEXT NOT NULL,
    "decision" "Decision" NOT NULL,
    "headlineRule" TEXT,
    "headlineReason" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "paypalIdsChecked" TEXT[],
    "demoDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptEvent" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "paypalIds" TEXT[],
    "demoDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxMessage" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "checkoutUrl" TEXT NOT NULL,
    "paypalOrderId" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetAside" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "dailyAmountCents" INTEGER NOT NULL,
    "startOn" TEXT NOT NULL,
    "endOn" TEXT NOT NULL,
    "forDate" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetAside_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GapLoan" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "receivedOn" TEXT NOT NULL,
    "repayOn" TEXT NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GapLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskFlag" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "kind" "RiskFlagKind" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Store_lastSeenAt_idx" ON "Store"("lastSeenAt");

-- CreateIndex
CREATE INDEX "Product_storeId_idx" ON "Product"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_sku_key" ON "Product"("storeId", "sku");

-- CreateIndex
CREATE INDEX "Customer_storeId_idx" ON "Customer"("storeId");

-- CreateIndex
CREATE INDEX "Order_storeId_status_idx" ON "Order"("storeId", "status");

-- CreateIndex
CREATE INDEX "Order_storeId_placedOn_idx" ON "Order"("storeId", "placedOn");

-- CreateIndex
CREATE UNIQUE INDEX "Order_storeId_number_key" ON "Order"("storeId", "number");

-- CreateIndex
CREATE INDEX "OrderItem_storeId_idx" ON "OrderItem"("storeId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "LedgerEntry_storeId_occurredOn_idx" ON "LedgerEntry"("storeId", "occurredOn");

-- CreateIndex
CREATE INDEX "Payee_storeId_idx" ON "Payee"("storeId");

-- CreateIndex
CREATE INDEX "Due_storeId_dueOn_idx" ON "Due"("storeId", "dueOn");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_idempotencyKey_key" ON "Proposal"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Proposal_storeId_status_idx" ON "Proposal"("storeId", "status");

-- CreateIndex
CREATE INDEX "Receipt_storeId_createdAt_idx" ON "Receipt"("storeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_storeId_number_key" ON "Receipt"("storeId", "number");

-- CreateIndex
CREATE INDEX "ReceiptEvent_storeId_receiptId_idx" ON "ReceiptEvent"("storeId", "receiptId");

-- CreateIndex
CREATE INDEX "OutboxMessage_storeId_idx" ON "OutboxMessage"("storeId");

-- CreateIndex
CREATE INDEX "SetAside_storeId_idx" ON "SetAside"("storeId");

-- CreateIndex
CREATE INDEX "GapLoan_storeId_idx" ON "GapLoan"("storeId");

-- CreateIndex
CREATE INDEX "RiskFlag_storeId_idx" ON "RiskFlag"("storeId");

-- CreateIndex
CREATE INDEX "WebhookEvent_storeId_idx" ON "WebhookEvent"("storeId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "Payee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payee" ADD CONSTRAINT "Payee_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Due" ADD CONSTRAINT "Due_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Due" ADD CONSTRAINT "Due_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "Payee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptEvent" ADD CONSTRAINT "ReceiptEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptEvent" ADD CONSTRAINT "ReceiptEvent_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxMessage" ADD CONSTRAINT "OutboxMessage_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxMessage" ADD CONSTRAINT "OutboxMessage_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxMessage" ADD CONSTRAINT "OutboxMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetAside" ADD CONSTRAINT "SetAside_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetAside" ADD CONSTRAINT "SetAside_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GapLoan" ADD CONSTRAINT "GapLoan_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GapLoan" ADD CONSTRAINT "GapLoan_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskFlag" ADD CONSTRAINT "RiskFlag_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskFlag" ADD CONSTRAINT "RiskFlag_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
