-- CreateTable
CREATE TABLE "contract_acceptances" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_acceptances_storeId_idx" ON "contract_acceptances"("storeId");

-- AddForeignKey
ALTER TABLE "contract_acceptances" ADD CONSTRAINT "contract_acceptances_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
