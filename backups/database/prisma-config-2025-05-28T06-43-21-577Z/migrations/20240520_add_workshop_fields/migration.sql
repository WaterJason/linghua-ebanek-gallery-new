-- AlterTable
ALTER TABLE "Workshop" ADD COLUMN "activityType" TEXT;
ALTER TABLE "Workshop" ADD COLUMN "baseType" TEXT;
ALTER TABLE "Workshop" ADD COLUMN "depositAmount" FLOAT DEFAULT 0;
ALTER TABLE "Workshop" ADD COLUMN "managerId" INTEGER;
ALTER TABLE "Workshop" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "Workshop" ADD COLUMN "paymentStatus" TEXT DEFAULT 'unpaid';
ALTER TABLE "Workshop" ADD COLUMN "totalAmount" FLOAT DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Workshop" ADD CONSTRAINT "Workshop_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create WorkshopServiceItem table
CREATE TABLE "WorkshopServiceItem" (
    "id" SERIAL NOT NULL,
    "workshopId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" FLOAT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkshopServiceItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkshopServiceItem" ADD CONSTRAINT "WorkshopServiceItem_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopServiceItem" ADD CONSTRAINT "WorkshopServiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
