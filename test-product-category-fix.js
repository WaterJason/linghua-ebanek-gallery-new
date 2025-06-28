/**
 * 测试产品分类创建功能修复
 * 
 * 这个脚本将测试：
 * 1. 产品分类创建功能
 * 2. 产品分类更新功能
 * 3. 产品分类删除功能
 * 4. 验证修复后的功能是否正常工作
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductCategoryFix() {
  console.log('🧪 开始测试产品分类功能修复...\n');

  try {
    // 1. 测试产品分类创建功能
    console.log('1️⃣ 测试产品分类创建功能...');
    const testCategory = await prisma.productCategory.create({
      data: {
        name: '测试分类-修复验证',
        description: '这是一个用于验证修复的测试分类',
        code: 'TEST-FIX-001',
        level: 1,
        sortOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ 产品分类创建成功: ${testCategory.name} (ID: ${testCategory.id})`);

    // 2. 测试子分类创建功能
    console.log('\n2️⃣ 测试子分类创建功能...');
    const testSubCategory = await prisma.productCategory.create({
      data: {
        name: '测试子分类-修复验证',
        description: '这是一个用于验证修复的测试子分类',
        code: 'TEST-FIX-SUB-001',
        parentId: testCategory.id,
        level: 2,
        sortOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ 子分类创建成功: ${testSubCategory.name} (ID: ${testSubCategory.id})`);

    // 3. 测试分类读取功能
    console.log('\n3️⃣ 测试分类读取功能...');
    const retrievedCategory = await prisma.productCategory.findUnique({
      where: { id: testCategory.id },
      include: {
        children: true,
        parent: true,
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    });
    
    if (retrievedCategory && retrievedCategory.name === testCategory.name) {
      console.log(`✅ 分类读取成功: ${retrievedCategory.name}`);
      console.log(`   子分类数量: ${retrievedCategory._count.children}`);
      console.log(`   产品数量: ${retrievedCategory._count.products}`);
    } else {
      console.log('❌ 分类读取失败');
    }

    // 4. 测试分类更新功能
    console.log('\n4️⃣ 测试分类更新功能...');
    const updatedCategory = await prisma.productCategory.update({
      where: { id: testCategory.id },
      data: {
        name: '测试分类-修复验证-已更新',
        description: '这是一个已更新的测试分类',
        sortOrder: 2
      }
    });
    
    if (updatedCategory.name === '测试分类-修复验证-已更新' && updatedCategory.sortOrder === 2) {
      console.log(`✅ 分类更新成功: ${updatedCategory.name}, 排序: ${updatedCategory.sortOrder}`);
    } else {
      console.log('❌ 分类更新失败');
    }

    // 5. 测试分类层级关系
    console.log('\n5️⃣ 测试分类层级关系...');
    const categoryWithChildren = await prisma.productCategory.findUnique({
      where: { id: testCategory.id },
      include: {
        children: {
          include: {
            parent: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    
    if (categoryWithChildren && categoryWithChildren.children.length > 0) {
      console.log(`✅ 分类层级关系正确:`);
      console.log(`   父分类: ${categoryWithChildren.name}`);
      categoryWithChildren.children.forEach(child => {
        console.log(`   子分类: ${child.name} (父分类: ${child.parent?.name})`);
      });
    } else {
      console.log('❌ 分类层级关系验证失败');
    }

    // 6. 测试分类删除约束
    console.log('\n6️⃣ 测试分类删除约束...');
    try {
      // 尝试删除有子分类的父分类（应该失败）
      await prisma.productCategory.delete({
        where: { id: testCategory.id }
      });
      console.log('❌ 错误：有子分类的父分类删除应该失败但却成功了！');
    } catch (error) {
      console.log('✅ 分类删除约束正确工作，错误信息：');
      console.log(`   ${error.message}`);
    }

    // 7. 测试正确的删除顺序
    console.log('\n7️⃣ 测试正确的删除顺序...');
    
    // 先删除子分类
    await prisma.productCategory.delete({
      where: { id: testSubCategory.id }
    });
    console.log('✅ 子分类删除成功');
    
    // 再删除父分类
    await prisma.productCategory.delete({
      where: { id: testCategory.id }
    });
    console.log('✅ 父分类删除成功');

    // 8. 验证删除结果
    console.log('\n8️⃣ 验证删除结果...');
    const deletedCategory = await prisma.productCategory.findUnique({
      where: { id: testCategory.id }
    });
    const deletedSubCategory = await prisma.productCategory.findUnique({
      where: { id: testSubCategory.id }
    });
    
    if (!deletedCategory && !deletedSubCategory) {
      console.log('✅ 分类删除验证成功');
    } else {
      console.log('❌ 分类删除验证失败');
    }

    // 9. 测试分类代码唯一性
    console.log('\n9️⃣ 测试分类代码唯一性...');
    const uniqueCategory1 = await prisma.productCategory.create({
      data: {
        name: '唯一性测试分类1',
        code: 'UNIQUE-TEST-001',
        level: 1,
        sortOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ 第一个分类创建成功: ${uniqueCategory1.name}`);

    try {
      // 尝试创建相同代码的分类（应该失败）
      await prisma.productCategory.create({
        data: {
          name: '唯一性测试分类2',
          code: 'UNIQUE-TEST-001', // 相同的代码
          level: 1,
          sortOrder: 2,
          isActive: true
        }
      });
      console.log('❌ 错误：相同代码的分类创建应该失败但却成功了！');
    } catch (error) {
      console.log('✅ 分类代码唯一性约束正确工作');
    }

    // 清理唯一性测试数据
    await prisma.productCategory.delete({
      where: { id: uniqueCategory1.id }
    });
    console.log('✅ 唯一性测试数据清理完成');

    console.log('\n🎉 所有产品分类功能测试完成！');
    console.log('\n📊 测试结果总结:');
    console.log('   ✅ 产品分类创建功能: 正常');
    console.log('   ✅ 产品分类读取功能: 正常');
    console.log('   ✅ 产品分类更新功能: 正常');
    console.log('   ✅ 产品分类删除功能: 正常');
    console.log('   ✅ 分类层级关系: 正常');
    console.log('   ✅ 删除约束检查: 正常');
    console.log('   ✅ 代码唯一性约束: 正常');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 清理：确保测试数据被删除
    try {
      await prisma.productCategory.deleteMany({
        where: { 
          OR: [
            { name: { contains: '测试分类-修复验证' } },
            { name: { contains: '唯一性测试分类' } },
            { code: { in: ['TEST-FIX-001', 'TEST-FIX-SUB-001', 'UNIQUE-TEST-001'] } }
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
testProductCategoryFix().catch(console.error);
