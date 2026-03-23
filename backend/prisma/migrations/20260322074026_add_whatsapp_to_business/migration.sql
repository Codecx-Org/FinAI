/*
  Warnings:

  - A unique constraint covering the columns `[whatsappNumber]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "ownerPhone" TEXT,
ADD COLUMN     "whatsappNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Business_whatsappNumber_key" ON "Business"("whatsappNumber");
