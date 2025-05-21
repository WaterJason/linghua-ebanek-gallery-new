-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "parentId" INTEGER,
    "level" INTEGER NOT NULL DEFAULT 1,
    "path" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "categoryId" INTEGER;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 迁移数据：将现有的分类数据迁移到新表中
DO $$
DECLARE
    category_name TEXT;
    category_id INTEGER;
    product_id INTEGER;
BEGIN
    -- 获取所有不同的分类名称
    FOR category_name IN 
        SELECT DISTINCT category FROM "Product" 
        WHERE category IS NOT NULL AND category != ''
    LOOP
        -- 为每个分类创建一条记录
        INSERT INTO "ProductCategory" (name, description, "isActive", "createdAt", "updatedAt")
        VALUES (category_name, '', true, NOW(), NOW())
        RETURNING id INTO category_id;
        
        -- 更新所有使用此分类的产品
        UPDATE "Product" 
        SET "categoryId" = category_id 
        WHERE category = category_name;
    END LOOP;
END $$;

-- 创建索引
CREATE INDEX "ProductCategory_parentId_idx" ON "ProductCategory"("parentId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
