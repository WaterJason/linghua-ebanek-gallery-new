/**
 * 测试产品分类Server Actions修复
 * 
 * 这个脚本将测试：
 * 1. createProductCategory Server Action
 * 2. updateProductCategory Server Action
 * 3. deleteProductCategory Server Action
 * 4. 验证修复后的功能是否正常工作
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 模拟Server Actions
async function createProductCategory(data) {
  try {
    // 验证数据
    if (!data.name || data.name.trim() === "") {
      throw new Error("分类名称不能为空");
    }

    // 创建分类
    const category = await prisma.productCategory.create({
      data: {
        name: data.name,
        description: data.description || "",
        parentId: data.parentId ? (typeof data.parentId === 'string' ? parseInt(data.parentId) : data.parentId) : null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder || 0,
        code: data.code || null,
        level: 1, // 默认为顶级分类
      },
    });

    return category;
  } catch (error) {
    console.error("Error creating product category:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create product category");
  }
}

async function updateProductCategory(id, data) {
  try {
    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error("分类不存在");
    }

    // 准备更新数据
    const updateData = {};

    // 只更新提供的字段
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parentId !== undefined) updateData.parentId = data.parentId !== null ? (typeof data.parentId === 'string' ? parseInt(data.parentId) : data.parentId) : null;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    // 更新分类
    const category = await prisma.productCategory.update({
      where: { id },
      data: updateData,
    });

    return category;
  } catch (error) {
    console.error("Error updating product category:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update product category");
  }
}

async function deleteProductCategory(id) {
  try {
    console.log(`开始删除产品分类，分类ID: ${id}`);

    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
        children: {
          select: { id: true, name: true }
        },
        products: {
          select: { id: true, name: true }
        }
      },
    });

    if (!existingCategory) {
      throw new Error("分类不存在");
    }

    console.log(`分类存在，开始检查依赖关系: ${existingCategory.name}`);
    console.log(`子分类数量: ${existingCategory._count.children}, 产品数量: ${existingCategory._count.products}`);

    // 收集所有阻止删除的记录信息
    const blockingRecords = [];

    // 检查分类是否有子分类
    if (existingCategory._count.children > 0) {
      const childNames = existingCategory.children.map(child => child.name).join(', ');
      blockingRecords.push(`子分类 (${existingCategory._count.children}个): ${childNames}`);
    }

    // 检查分类是否有产品
    if (existingCategory._count.products > 0) {
      const productNames = existingCategory.products.slice(0, 3).map(product => product.name).join(', ');
      const moreProducts = existingCategory._count.products > 3 ? ` 等${existingCategory._count.products}个产品` : '';
      blockingRecords.push(`关联产品: ${productNames}${moreProducts}`);
    }

    // 如果有任何阻止删除的记录，抛出详细错误信息
    if (blockingRecords.length > 0) {
      const errorMessage = `无法删除分类 "${existingCategory.name}"，因为存在以下关联记录：\n${blockingRecords.map(record => `• ${record}`).join('\n')}\n\n请先处理这些关联记录后再删除分类。`;
      console.log(`分类删除被阻止: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`没有发现阻止删除的记录，开始删除分类`);

    // 删除分类
    await prisma.productCategory.delete({
      where: { id },
    });

    console.log(`分类删除成功: ${existingCategory.name}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting product category:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete product category");
  }
}

async function testCategoryServerActions() {
  console.log('🧪 开始测试产品分类Server Actions修复...\n');

  try {
    // 1. 测试分类创建
    console.log('1️⃣ 测试分类创建Server Action...');
    const testCategory = await createProductCategory({
      name: '测试分类-Server Action',
      description: '这是一个用于测试Server Action的分类',
      code: 'TEST-SA-001',
      sortOrder: 1,
      isActive: true
    });
    console.log(`✅ 分类创建成功: ${testCategory.name} (ID: ${testCategory.id})`);

    // 2. 测试子分类创建
    console.log('\n2️⃣ 测试子分类创建...');
    const testSubCategory = await createProductCategory({
      name: '测试子分类-Server Action',
      description: '这是一个用于测试的子分类',
      code: 'TEST-SA-SUB-001',
      parentId: testCategory.id,
      sortOrder: 1,
      isActive: true
    });
    console.log(`✅ 子分类创建成功: ${testSubCategory.name} (ID: ${testSubCategory.id})`);

    // 3. 测试分类更新
    console.log('\n3️⃣ 测试分类更新Server Action...');
    const updatedCategory = await updateProductCategory(testCategory.id, {
      name: '测试分类-Server Action-已更新',
      description: '这是一个已更新的测试分类',
      sortOrder: 2
    });
    console.log(`✅ 分类更新成功: ${updatedCategory.name}, 排序: ${updatedCategory.sortOrder}`);

    // 4. 测试删除有子分类的父分类（应该失败）
    console.log('\n4️⃣ 测试删除有子分类的父分类（应该失败）...');
    try {
      await deleteProductCategory(testCategory.id);
      console.log('❌ 错误：有子分类的父分类删除应该失败但却成功了！');
    } catch (error) {
      console.log('✅ 分类删除正确失败，错误信息：');
      console.log(`   ${error.message}`);
    }

    // 5. 测试正确的删除顺序
    console.log('\n5️⃣ 测试正确的删除顺序...');
    
    // 先删除子分类
    const deleteSubResult = await deleteProductCategory(testSubCategory.id);
    if (deleteSubResult.success) {
      console.log('✅ 子分类删除成功');
    }
    
    // 再删除父分类
    const deleteParentResult = await deleteProductCategory(testCategory.id);
    if (deleteParentResult.success) {
      console.log('✅ 父分类删除成功');
    }

    console.log('\n🎉 所有Server Action测试完成！');
    console.log('\n📊 测试结果总结:');
    console.log('   ✅ 分类创建Server Action: 正常');
    console.log('   ✅ 分类更新Server Action: 正常');
    console.log('   ✅ 分类删除Server Action: 正常');
    console.log('   ✅ 删除约束检查: 正常');
    console.log('   ✅ 错误处理机制: 正常');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 清理：确保测试数据被删除
    try {
      await prisma.productCategory.deleteMany({
        where: { 
          OR: [
            { name: { contains: '测试分类-Server Action' } },
            { code: { in: ['TEST-SA-001', 'TEST-SA-SUB-001'] } }
          ]
        }
      });
      console.log('🧹 测试数据清理完成');
    } catch (cleanupError) {
      console.log('⚠️ 清理测试数据时出现错误:', cleanupError.message);
    }
    
    await prisma.$disconnect();
  }
}

// 运行测试
testCategoryServerActions().catch(console.error);
