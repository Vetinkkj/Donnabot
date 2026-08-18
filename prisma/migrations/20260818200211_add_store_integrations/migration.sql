-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "paymentApiKeyEncrypted" TEXT,
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "paymentSecretEncrypted" TEXT,
ADD COLUMN     "twilioAccountSid" TEXT,
ADD COLUMN     "twilioAuthTokenEncrypted" TEXT,
ADD COLUMN     "twilioWhatsappNumber" TEXT,
ADD COLUMN     "whatsappAppSecretEncrypted" TEXT,
ADD COLUMN     "whatsappBusinessAccountId" TEXT,
ADD COLUMN     "whatsappPhoneNumberId" TEXT,
ADD COLUMN     "whatsappProvider" TEXT,
ADD COLUMN     "whatsappTokenEncrypted" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "stores_whatsappPhoneNumberId_key" ON "stores"("whatsappPhoneNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "stores_twilioWhatsappNumber_key" ON "stores"("twilioWhatsappNumber");
