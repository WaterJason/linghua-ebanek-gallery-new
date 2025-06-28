-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "commissionRate" DROP NOT NULL,
ALTER COLUMN "commissionRate" SET DEFAULT 0;
