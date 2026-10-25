-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "asaasCustomerId" TEXT,
ADD COLUMN     "asaasSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "stores_asaasCustomerId_key" ON "stores"("asaasCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "stores_asaasSubscriptionId_key" ON "stores"("asaasSubscriptionId");
