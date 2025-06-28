import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化生产数据...');

  try {
    // 创建生产基地
    const productionBases = [
      {
        name: '广西生产基地',
        code: 'GX001',
        location: '广西南宁',
        contactName: '王师傅',
        contactPhone: '13800138001',
        contactEmail: 'wang@gxbase.com',
        address: '广西南宁市青秀区工业园区A区',
        specialties: ['掐丝珐琅', '景泰蓝', '传统工艺', '手工制作'],
        capacity: 1000,
        leadTime: 15,
        qualityRating: 4.8,
        isActive: true,
        notes: '主要合作生产基地，工艺精湛，交期稳定',
      },
      {
        name: '北京工艺坊',
        code: 'BJ001',
        location: '北京朝阳',
        contactName: '李大师',
        contactPhone: '13900139001',
        contactEmail: 'li@bjcraft.com',
        address: '北京市朝阳区工艺美术园区',
        specialties: ['景泰蓝', '宫廷工艺', '高端定制'],
        capacity: 500,
        leadTime: 20,
        qualityRating: 4.9,
        isActive: true,
        notes: '专门负责高端定制产品，工艺要求极高',
      },
      {
        name: '苏州传统工艺厂',
        code: 'SZ001',
        location: '江苏苏州',
        contactName: '陈师傅',
        contactPhone: '13700137001',
        contactEmail: 'chen@szcraft.com',
        address: '江苏省苏州市工业园区传统工艺区',
        specialties: ['掐丝珐琅', '传统工艺', '批量生产'],
        capacity: 800,
        leadTime: 12,
        qualityRating: 4.5,
        isActive: false,
        notes: '暂停合作，质量控制需要改进',
      },
    ];

    for (const baseData of productionBases) {
      const existingBase = await prisma.productionBase.findUnique({
        where: { code: baseData.code },
      });

      if (!existingBase) {
        await prisma.productionBase.create({
          data: baseData,
        });
        console.log(`创建生产基地: ${baseData.name}`);
      } else {
        console.log(`生产基地已存在: ${baseData.name}`);
      }
    }

    // 创建一些示例生产订单
    const employees = await prisma.employee.findMany({
      take: 3,
    });

    const products = await prisma.product.findMany({
      take: 5,
    });

    const bases = await prisma.productionBase.findMany();

    if (employees.length > 0 && products.length > 0 && bases.length > 0) {
      const sampleOrders = [
        {
          productionBaseId: bases[0].id,
          employeeId: employees[0].id,
          orderDate: new Date('2024-01-15'),
          expectedStartDate: new Date('2024-01-18'),
          expectedEndDate: new Date('2024-01-25'),
          actualStartDate: new Date('2024-01-18'),
          status: 'in_production',
          priority: 'high',
          totalAmount: 15000,
          paidAmount: 5000,
          paymentStatus: 'partial',
          shippingMethod: '顺丰快递',
          notes: '紧急订单，请优先处理',
          items: [
            {
              productId: products[0].id,
              quantity: 50,
              specifications: '18K金底胎，蓝色珐琅',
            },
            {
              productId: products[1].id,
              quantity: 30,
              specifications: '925银底胎，红色珐琅',
            },
          ],
        },
        {
          productionBaseId: bases[0].id,
          employeeId: employees[1] ? employees[1].id : employees[0].id,
          orderDate: new Date('2024-01-10'),
          expectedStartDate: new Date('2024-01-12'),
          expectedEndDate: new Date('2024-01-20'),
          actualStartDate: new Date('2024-01-12'),
          actualEndDate: new Date('2024-01-19'),
          status: 'quality_check',
          priority: 'normal',
          totalAmount: 8000,
          paidAmount: 8000,
          paymentStatus: 'paid',
          shippingMethod: '中通快递',
          notes: '常规订单',
          items: [
            {
              productId: products[2] ? products[2].id : products[0].id,
              quantity: 100,
              specifications: '纯银底胎，绿色珐琅',
            },
          ],
        },
      ];

      for (let i = 0; i < sampleOrders.length; i++) {
        const orderData = sampleOrders[i];
        const orderNumber = `PO-2024-${String(i + 1).padStart(3, '0')}`;

        const existingOrder = await prisma.productionOrder.findUnique({
          where: { orderNumber },
        });

        if (!existingOrder) {
          await prisma.productionOrder.create({
            data: {
              orderNumber,
              productionBaseId: orderData.productionBaseId,
              employeeId: orderData.employeeId,
              orderDate: orderData.orderDate,
              expectedStartDate: orderData.expectedStartDate,
              expectedEndDate: orderData.expectedEndDate,
              actualStartDate: orderData.actualStartDate,
              actualEndDate: orderData.actualEndDate,
              status: orderData.status,
              priority: orderData.priority,
              totalAmount: orderData.totalAmount,
              paidAmount: orderData.paidAmount,
              paymentStatus: orderData.paymentStatus,
              shippingMethod: orderData.shippingMethod,
              notes: orderData.notes,
              items: {
                create: orderData.items,
              },
            },
          });
          console.log(`创建生产订单: ${orderNumber}`);
        } else {
          console.log(`生产订单已存在: ${orderNumber}`);
        }
      }
    }

    console.log('生产数据初始化完成！');
  } catch (error) {
    console.error('初始化生产数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
