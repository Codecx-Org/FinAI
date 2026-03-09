/*
  Warnings:

  - Added the required column `amount` to the `Expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'failed';

-- AlterTable
ALTER TABLE "Expenses" ADD COLUMN     "amount" INTEGER NOT NULL;
