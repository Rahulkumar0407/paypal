-- Setup answers: busiest days, business type, daily brief, movable payments, team, clients and money outside PayPal. Additive only.
-- CreateEnum
CREATE TYPE "EntryKind" AS ENUM ('EXPENSE', 'REVENUE');

-- AlterTable
ALTER TABLE "Payee" ADD COLUMN     "canMove" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "briefChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "briefTime" TEXT,
ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "busyDays" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "reminders" BOOLEAN NOT NULL DEFAULT true,
    "tone" TEXT NOT NULL DEFAULT 'Gentle',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualEntry" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "kind" "EntryKind" NOT NULL,
    "amountCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamMember_storeId_idx" ON "TeamMember"("storeId");

-- CreateIndex
CREATE INDEX "Client_storeId_idx" ON "Client"("storeId");

-- CreateIndex
CREATE INDEX "ManualEntry_storeId_idx" ON "ManualEntry"("storeId");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualEntry" ADD CONSTRAINT "ManualEntry_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

