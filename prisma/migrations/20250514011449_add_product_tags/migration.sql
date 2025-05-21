/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `SystemLog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SystemLog` table. All the data in the column will be lost.
  - You are about to drop the `MaterialTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductMaterialTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductUnit` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `commissionRate` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_unitId_fkey";

-- DropForeignKey
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMaterialTag" DROP CONSTRAINT "ProductMaterialTag_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMaterialTag" DROP CONSTRAINT "ProductMaterialTag_tagId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "categoryId",
DROP COLUMN "status",
DROP COLUMN "tags",
DROP COLUMN "unitId",
DROP COLUMN "weight",
ADD COLUMN     "inventory" INTEGER,
ALTER COLUMN "commissionRate" SET NOT NULL,
ALTER COLUMN "commissionRate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SystemLog" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT;

-- DropTable
DROP TABLE "MaterialTag";

-- DropTable
DROP TABLE "ProductCategory";

-- DropTable
DROP TABLE "ProductImage";

-- DropTable
DROP TABLE "ProductMaterialTag";

-- DropTable
DROP TABLE "ProductUnit";

-- CreateTable
CREATE TABLE "ProductTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTagsOnProducts" (
    "productId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductTagsOnProducts_pkey" PRIMARY KEY ("productId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductTag_name_key" ON "ProductTag"("name");

-- CreateIndex
CREATE INDEX "ProductTagsOnProducts_productId_idx" ON "ProductTagsOnProducts"("productId");

-- CreateIndex
CREATE INDEX "ProductTagsOnProducts_tagId_idx" ON "ProductTagsOnProducts"("tagId");

-- AddForeignKey
ALTER TABLE "ProductTagsOnProducts" ADD CONSTRAINT "ProductTagsOnProducts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTagsOnProducts" ADD CONSTRAINT "ProductTagsOnProducts_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ProductTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
