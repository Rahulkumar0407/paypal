-- The month page: auto-debits, optional payments, the focus line, invoice due dates, goals, team requests and the assistant's proposed changes. Additive only.
-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('PLANNED', 'DONE', 'DROPPED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'ADDED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PlanChangeKind" AS ENUM ('ADD_PAYMENT', 'ADD_GOAL', 'MOVE_GOAL');

-- CreateEnum
CREATE TYPE "PlanChangeStatus" AS ENUM ('PROPOSED', 'KEPT', 'DISCARDED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dueOn" TEXT;

-- AlterTable
ALTER TABLE "Payee" ADD COLUMN     "autoDebit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "optional" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "focusLine" TEXT;

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "savedCents" INTEGER NOT NULL DEFAULT 0,
    "wantedOn" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'PLANNED',
    "source" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRequest" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromRole" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "topic" TEXT,
    "receivedOn" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "goalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanChange" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "kind" "PlanChangeKind" NOT NULL,
    "title" TEXT NOT NULL,
    "amountCents" INTEGER,
    "date" TEXT,
    "fromDate" TEXT,
    "payeeId" TEXT,
    "goalId" TEXT,
    "note" TEXT,
    "status" "PlanChangeStatus" NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_storeId_idx" ON "Goal"("storeId");

-- CreateIndex
CREATE INDEX "TeamRequest_storeId_status_idx" ON "TeamRequest"("storeId", "status");

-- CreateIndex
CREATE INDEX "PlanChange_storeId_batchId_idx" ON "PlanChange"("storeId", "batchId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRequest" ADD CONSTRAINT "TeamRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanChange" ADD CONSTRAINT "PlanChange_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

