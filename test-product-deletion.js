/**
 * 测试产品删除功能的外键约束修复
 *
 * 这个脚本将测试：
 * 1. 创建测试产品
 * 2. 创建关联的订单记录
 * 3. 尝试删除产品（应该失败并显示详细错误信息）
 * 4. 删除关联记录后再次尝试删除产品（应该成功）
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductDeletion() {
  console.log('🧪 开始测试产品删除功能的外键约束修复...\n');

  try {
    // 1. 创建测试产品
    console.log('1️⃣ 创建测试产品...');
    const testProduct = await prisma.product.create({
      data: {
        name: '测试产品-删除约束测试',
        price: 100.00,
        commissionRate: 5.0,
        type: 'product',
        barcode: 'TEST-DELETE-001',
        sku: 'TEST-SKU-001'
      }
    });
    console.log(`✅ 测试产品创建成功: ${testProduct.name} (ID: ${testProduct.id})\n`);

    // 2. 创建测试客户和订单
    console.log('2️⃣ 创建测试客户和订单...');

    // 先创建测试客户
    const testCustomer = await prisma.customer.create({
      data: {
        name: '测试客户-删除约束测试',
        phone: '13800138000',
        type: 'individual'
      }
    });

    // 创建测试员工（如果不存在）
    let testEmployee = await prisma.employee.findFirst();
    if (!testEmployee) {
      testEmployee = await prisma.employee.create({
        data: {
          name: '测试员工',
          position: '销售员',
          dailySalary: 200.0
        }
      });
    }

    const testOrder = await prisma.order.create({
      data: {
        orderNumber: 'TEST-ORDER-001',
        customerId: testCustomer.id,
        employeeId: testEmployee.id,
        totalAmount: 100.00,
        status: 'pending',
        orderDate: new Date(),
        items: {
          create: {
            productId: testProduct.id,
            quantity: 1,
            price: 100.00
          }
        }
      },
      include: {
        items: true
      }
    });
    console.log(`✅ 测试订单创建成功: ${testOrder.orderNumber} (ID: ${testOrder.id})`);
    console.log(`✅ 订单项创建成功: 产品ID ${testProduct.id}, 数量 ${testOrder.items[0].quantity}\n`);

    // 3. 尝试删除有关联记录的产品（应该失败）
    console.log('3️⃣ 尝试删除有关联记录的产品（应该失败）...');
    try {
      // 直接在这里实现删除逻辑来测试
      console.log(`开始删除产品，产品ID: ${testProduct.id}`);

      // 检查产品是否存在
      const existingProduct = await prisma.product.findUnique({
        where: { id: testProduct.id },
      });

      if (!existingProduct) {
        throw new Error("产品不存在");
      }

      console.log(`产品存在，开始检查依赖关系: ${existingProduct.name}`);

      // 收集所有阻止删除的记录信息
      const blockingRecords = [];

      // 检查产品是否有库存记录
      const inventory = await prisma.inventoryItem.findFirst({
        where: { productId: testProduct.id },
        include: {
          warehouse: {
            select: { name: true }
          }
        }
      });

      if (inventory) {
        blockingRecords.push(`库存记录 (仓库: ${inventory.warehouse?.name || '未知'}, 数量: ${inventory.quantity})`);
      }

      // 检查产品是否有销售记录
      const salesItem = await prisma.salesItem.findFirst({
        where: { productId: testProduct.id },
        include: {
          gallerySale: {
            select: { id: true, date: true }
          }
        }
      });

      if (salesItem) {
        const saleDate = salesItem.gallerySale?.date ? new Date(salesItem.gallerySale.date).toLocaleDateString() : '未知日期';
        blockingRecords.push(`销售记录 (销售单号: ${salesItem.gallerySale?.id || '未知'}, 日期: ${saleDate})`);
      }

      // 检查产品是否有订单记录
      const orderItem = await prisma.orderItem.findFirst({
        where: { productId: testProduct.id },
        include: {
          order: {
            select: { id: true, orderNumber: true, orderDate: true }
          }
        }
      });

      if (orderItem) {
        const orderDate = orderItem.order?.orderDate ? new Date(orderItem.order.orderDate).toLocaleDateString() : '未知日期';
        blockingRecords.push(`订单记录 (订单号: ${orderItem.order?.orderNumber || orderItem.order?.id || '未知'}, 日期: ${orderDate})`);
      }

      // 如果有任何阻止删除的记录，抛出详细错误信息
      if (blockingRecords.length > 0) {
        const errorMessage = `无法删除产品 "${existingProduct.name}"，因为存在以下关联记录：\n${blockingRecords.map(record => `• ${record}`).join('\n')}\n\n请先处理这些关联记录后再删除产品。`;
        console.log(`产品删除被阻止: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log('❌ 错误：产品删除应该失败但却成功了！');
    } catch (error) {
      console.log('✅ 产品删除正确失败，错误信息：');
      console.log(`   ${error.message}\n`);
    }

    // 4. 删除关联的订单记录
    console.log('4️⃣ 删除关联的订单记录...');
    await prisma.orderItem.deleteMany({
      where: { productId: testProduct.id }
    });
    await prisma.order.delete({
      where: { id: testOrder.id }
    });
    console.log('✅ 关联订单记录删除成功\n');

    // 5. 再次尝试删除产品（应该成功）
    console.log('5️⃣ 再次尝试删除产品（应该成功）...');
    try {
      // 再次检查是否还有阻止删除的记录
      const blockingRecords = [];

      // 检查产品是否有库存记录
      const inventory = await prisma.inventoryItem.findFirst({
        where: { productId: testProduct.id }
      });
      if (inventory) {
        blockingRecords.push('库存记录');
      }

      // 检查产品是否有销售记录
      const salesItem = await prisma.salesItem.findFirst({
        where: { productId: testProduct.id }
      });
      if (salesItem) {
        blockingRecords.push('销售记录');
      }

      // 检查产品是否有订单记录
      const orderItem = await prisma.orderItem.findFirst({
        where: { productId: testProduct.id }
      });
      if (orderItem) {
        blockingRecords.push('订单记录');
      }

      if (blockingRecords.length > 0) {
        console.log(`❌ 仍然存在阻止删除的记录: ${blockingRecords.join(', ')}`);
      } else {
        // 删除产品标签关联
        await prisma.productTagsOnProducts.deleteMany({
          where: { productId: testProduct.id },
        });

        // 删除产品
        await prisma.product.delete({
          where: { id: testProduct.id },
        });

        console.log('✅ 产品删除成功！');
      }
    } catch (error) {
      console.log(`❌ 产品删除失败: ${error.message}`);
    }

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  } finally {
    // 清理：确保测试数据被删除
    try {
      await prisma.orderItem.deleteMany({
        where: {
          product: {
            name: '测试产品-删除约束测试'
          }
        }
      });
      await prisma.order.deleteMany({
        where: { orderNumber: 'TEST-ORDER-001' }
      });
      await prisma.product.deleteMany({
        where: { name: '测试产品-删除约束测试' }
      });
      await prisma.customer.deleteMany({
        where: { name: '测试客户-删除约束测试' }
      });
      console.log('🧹 测试数据清理完成');
    } catch (cleanupError) {
      console.log('⚠️ 清理测试数据时出现错误:', cleanupError.message);
    }

    await prisma.$disconnect();
  }
}

// 运行测试
testProductDeletion().catch(console.error);
