-- 渠道管理模块数据库迁移脚本
-- 执行方法: 在数据库服务器上运行此脚本

-- 更新Channel模型
ALTER TABLE "Channel" 
ADD COLUMN IF NOT EXISTS "bankName" TEXT,
ADD COLUMN IF NOT EXISTS "bankAccount" TEXT,
ADD COLUMN IF NOT EXISTS "settlementCycle" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "cooperationStart" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

-- 创建ChannelDeposit模型
CREATE TABLE IF NOT EXISTS "ChannelDeposit" (
  "id" SERIAL PRIMARY KEY,
  "channelId" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "type" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "paymentMethod" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 创建ChannelSale模型
CREATE TABLE IF NOT EXISTS "ChannelSale" (
  "id" SERIAL PRIMARY KEY,
  "channelId" INTEGER NOT NULL,
  "saleDate" TIMESTAMP(3) NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "importSource" TEXT,
  "settlementId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 创建ChannelSettlement模型
CREATE TABLE IF NOT EXISTS "ChannelSettlement" (
  "id" SERIAL PRIMARY KEY,
  "channelId" INTEGER NOT NULL,
  "settlementNo" TEXT NOT NULL UNIQUE,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "paymentDate" TIMESTAMP(3),
  "paymentMethod" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 添加ChannelSale的外键关联
ALTER TABLE "ChannelSale" 
ADD CONSTRAINT IF NOT EXISTS "ChannelSale_settlementId_fkey" 
FOREIGN KEY ("settlementId") REFERENCES "ChannelSettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 创建ChannelSaleItem模型
CREATE TABLE IF NOT EXISTS "ChannelSaleItem" (
  "id" SERIAL PRIMARY KEY,
  "channelSaleId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "channelInventoryId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("channelSaleId") REFERENCES "ChannelSale"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("channelInventoryId") REFERENCES "ChannelInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 创建ChannelInvoice模型
CREATE TABLE IF NOT EXISTS "ChannelInvoice" (
  "id" SERIAL PRIMARY KEY,
  "settlementId" INTEGER NOT NULL,
  "invoiceNo" TEXT,
  "invoiceDate" TIMESTAMP(3),
  "amount" DOUBLE PRECISION NOT NULL,
  "imageUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("settlementId") REFERENCES "ChannelSettlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 创建ChannelDistribution模型
CREATE TABLE IF NOT EXISTS "ChannelDistribution" (
  "id" SERIAL PRIMARY KEY,
  "channelId" INTEGER NOT NULL,
  "channelInventoryId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "distributionDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("channelInventoryId") REFERENCES "ChannelInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 更新ChannelInventory模型，添加关联
ALTER TABLE "ChannelInventory" 
ADD CONSTRAINT IF NOT EXISTS "ChannelInventory_channelId_productId_key" 
UNIQUE ("channelId", "productId");

-- 创建索引
CREATE INDEX IF NOT EXISTS "ChannelDeposit_channelId_idx" ON "ChannelDeposit"("channelId");
CREATE INDEX IF NOT EXISTS "ChannelSale_channelId_idx" ON "ChannelSale"("channelId");
CREATE INDEX IF NOT EXISTS "ChannelSale_settlementId_idx" ON "ChannelSale"("settlementId");
CREATE INDEX IF NOT EXISTS "ChannelSaleItem_channelSaleId_idx" ON "ChannelSaleItem"("channelSaleId");
CREATE INDEX IF NOT EXISTS "ChannelSaleItem_productId_idx" ON "ChannelSaleItem"("productId");
CREATE INDEX IF NOT EXISTS "ChannelSaleItem_channelInventoryId_idx" ON "ChannelSaleItem"("channelInventoryId");
CREATE INDEX IF NOT EXISTS "ChannelSettlement_channelId_idx" ON "ChannelSettlement"("channelId");
CREATE INDEX IF NOT EXISTS "ChannelInvoice_settlementId_idx" ON "ChannelInvoice"("settlementId");
CREATE INDEX IF NOT EXISTS "ChannelDistribution_channelId_idx" ON "ChannelDistribution"("channelId");
CREATE INDEX IF NOT EXISTS "ChannelDistribution_channelInventoryId_idx" ON "ChannelDistribution"("channelInventoryId");
