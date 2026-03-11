/*
  Warnings:

  - You are about to drop the column `createAt` on the `Customer` table. All the data in the column will be lost.
  - Added the required column `businessId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "createAt",
ADD COLUMN     "businessId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Expenses" ADD COLUMN     "businessId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "businessId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "businessId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Sales" ADD COLUMN     "businessId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Business" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mpesaShortcode" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_mpesaShortcode_key" ON "Business"("mpesaShortcode");

-- CreateIndex
CREATE UNIQUE INDEX "Business_ownerEmail_key" ON "Business"("ownerEmail");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
