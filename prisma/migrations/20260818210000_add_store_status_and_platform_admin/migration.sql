-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "status" "StoreStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Lojas que já existiam antes desse controle de assinatura continuam
-- liberadas (só lojas cadastradas a partir de agora nascem PENDING).
UPDATE "stores" SET "status" = 'ACTIVE';
