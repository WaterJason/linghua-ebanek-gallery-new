const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductionAPI() {
  try {
    console.log('🧪 测试生产订单管理API...');

    // 1. 测试数据库连接
    console.log('\n1. 测试数据库连接...');
    const productCount = await prisma.product.count();
    const employeeCount = await prisma.employee.count();
    const productionBaseCount = await prisma.productionBase.count();
    
    console.log(`✅ 数据库连接成功:`);
    console.log(`   - 产品数量: ${productCount}`);
    console.log(`   - 员工数量: ${employeeCount}`);
    console.log(`   - 生产基地数量: ${productionBaseCount}`);

    // 2. 测试创建生产订单
    console.log('\n2. 测试创建生产订单...');
    
    // 获取第一个产品和员工
    const firstProduct = await prisma.product.findFirst();
    const firstEmployee = await prisma.employee.findFirst();
    const firstProductionBase = await prisma.productionBase.findFirst();

    if (!firstProduct || !firstEmployee || !firstProductionBase) {
      console.log('❌ 缺少基础数据，请先创建产品、员工和生产基地');
      return;
    }

    const testOrder = await prisma.productionOrder.create({
      data: {
        orderNumber: `TEST-${Date.now()}`,
        productionBaseId: firstProductionBase.id,
        employeeId: firstEmployee.id,
        productId: firstProduct.id,
        quantity: 10,
        currentStage: 'DESIGN',
        status: 'PENDING',
        priority: 'NORMAL',
        orderDate: new Date(),
        estimatedStartDate: new Date(),
        estimatedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
        location: '广州设计中心',
        totalAmount: 1000,
        notes: '测试生产订单',
      },
    });

    console.log(`✅ 生产订单创建成功: ${testOrder.orderNumber}`);

    // 3. 测试创建阶段历史记录
    console.log('\n3. 测试创建阶段历史记录...');
    
    const stageHistory = await prisma.productionStageHistory.create({
      data: {
        productionOrderId: testOrder.id,
        stage: 'DESIGN',
        status: 'IN_PROGRESS',
        startTime: new Date(),
        location: '广州设计中心',
        operatorId: firstEmployee.id,
        notes: '开始设计阶段',
      },
    });

    console.log(`✅ 阶段历史记录创建成功: ${stageHistory.stage}`);

    // 4. 测试创建质量记录
    console.log('\n4. 测试创建质量记录...');
    
    const qualityRecord = await prisma.qualityRecord.create({
      data: {
        productionOrderId: testOrder.id,
        productionBaseId: firstProductionBase.id,
        productId: firstProduct.id,
        inspectorId: firstEmployee.id,
        inspectionDate: new Date(),
        qualityGrade: 'A',
        qualityScore: 95.5,
        result: 'PASSED',
        defectDescription: null,
        status: 'completed',
        notes: '质量检验通过',
      },
    });

    console.log(`✅ 质量记录创建成功: ${qualityRecord.result}`);

    // 5. 测试创建物流记录
    console.log('\n5. 测试创建物流记录...');
    
    const shippingRecord = await prisma.shippingRecord.create({
      data: {
        productionOrderId: testOrder.id,
        shippingType: 'TO_PRODUCTION',
        carrier: '顺丰快递',
        trackingNumber: `SF${Date.now()}`,
        shippedDate: new Date(),
        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后
        shippingCost: 50.0,
        status: 'SHIPPED',
        notes: '发往广西生产基地',
      },
    });

    console.log(`✅ 物流记录创建成功: ${shippingRecord.trackingNumber}`);

    // 6. 测试创建成本记录
    console.log('\n6. 测试创建成本记录...');
    
    const costRecord = await prisma.productionCost.create({
      data: {
        productionOrderId: testOrder.id,
        stage: 'DESIGN',
        costType: 'LABOR',
        amount: 200.0,
        description: '设计阶段人工成本',
        recordedBy: firstEmployee.id,
      },
    });

    console.log(`✅ 成本记录创建成功: ${costRecord.amount}元`);

    // 7. 测试查询生产订单详情
    console.log('\n7. 测试查询生产订单详情...');
    
    const orderDetail = await prisma.productionOrder.findUnique({
      where: { id: testOrder.id },
      include: {
        productionBase: true,
        employee: true,
        product: true,
        stageHistories: true,
        qualityRecords: true,
        shippingRecords: true,
        costRecords: true,
      },
    });

    console.log(`✅ 订单详情查询成功:`);
    console.log(`   - 订单号: ${orderDetail.orderNumber}`);
    console.log(`   - 产品: ${orderDetail.product.name}`);
    console.log(`   - 当前阶段: ${orderDetail.currentStage}`);
    console.log(`   - 状态: ${orderDetail.status}`);
    console.log(`   - 阶段历史: ${orderDetail.stageHistories.length} 条`);
    console.log(`   - 质量记录: ${orderDetail.qualityRecords.length} 条`);
    console.log(`   - 物流记录: ${orderDetail.shippingRecords.length} 条`);
    console.log(`   - 成本记录: ${orderDetail.costRecords.length} 条`);

    // 8. 清理测试数据
    console.log('\n8. 清理测试数据...');
    
    await prisma.productionCost.delete({ where: { id: costRecord.id } });
    await prisma.shippingRecord.delete({ where: { id: shippingRecord.id } });
    await prisma.qualityRecord.delete({ where: { id: qualityRecord.id } });
    await prisma.productionStageHistory.delete({ where: { id: stageHistory.id } });
    await prisma.productionOrder.delete({ where: { id: testOrder.id } });

    console.log('✅ 测试数据清理完成');

    console.log('\n🎉 所有测试通过！生产订单管理API正常工作。');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProductionAPI();
