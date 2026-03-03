/*
  Warnings:

  - The primary key for the `IdempotencyKey` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `IdempotencyKey` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `LedgerEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,8)`.
  - You are about to alter the column `balanceBefore` on the `LedgerEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,8)`.
  - You are about to alter the column `balanceAfter` on the `LedgerEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,8)`.
  - Added the required column `walletId` to the `IdempotencyKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `walletId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'SWAP', 'WITHDRAWAL');

-- DropIndex
DROP INDEX "IdempotencyKey_key_key";

-- AlterTable
ALTER TABLE "IdempotencyKey" DROP CONSTRAINT "IdempotencyKey_pkey",
DROP COLUMN "id",
ADD COLUMN     "walletId" TEXT NOT NULL,
ADD CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("key");

-- AlterTable
ALTER TABLE "LedgerEntry" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(30,8),
ALTER COLUMN "balanceBefore" SET DATA TYPE DECIMAL(30,8),
ALTER COLUMN "balanceAfter" SET DATA TYPE DECIMAL(30,8);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "amount" DECIMAL(30,8),
ADD COLUMN     "fee" DECIMAL(30,8),
ADD COLUMN     "fromToken" "Token",
ADD COLUMN     "toToken" "Token",
ADD COLUMN     "walletId" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
