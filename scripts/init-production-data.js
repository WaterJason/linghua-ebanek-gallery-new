const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initProductionData() {
  try {
    console.log('🚀 初始化生产管理基础数据...');

    // 1. 创建生产基地
    console.log('\n1. 创建生产基地...');
    
    const productionBases = [
      {
        name: '广西生产基地',
        code: 'GX001',
        location: '广西南宁',
        contactName: '李师傅',
        contactPhone: '13800138001',
        capacity: 100,
        notes: '掐丝珐琅工艺制作基地',
        isActive: true,
      },
      {
        name: '广州设计中心',
        code: 'GZ001',
        location: '广州天河',
        contactName: '张设计师',
        contactPhone: '13800138002',
        capacity: 50,
        notes: '产品设计和包装中心',
        isActive: true,
      },
    ];

    for (const base of productionBases) {
      const existing = await prisma.productionBase.findFirst({
        where: { name: base.name },
      });

      if (!existing) {
        await prisma.productionBase.create({ data: base });
        console.log(`✅ 创建生产基地: ${base.name}`);
      } else {
        console.log(`⚠️  生产基地已存在: ${base.name}`);
      }
    }

    // 2. 创建测试产品
    console.log('\n2. 创建测试产品...');
    
    const testProducts = [
      {
        name: '掐丝珐琅花瓶',
        description: '精美的掐丝珐琅工艺花瓶',
        material: '珐琅',
        unit: '套',
        price: 299.99,
        imageUrl: '/images/products/vase.jpg',
        type: 'product',
      },
      {
        name: '掐丝珐琅茶具套装',
        description: '传统工艺茶具套装',
        material: '珐琅',
        unit: '套',
        price: 599.99,
        imageUrl: '/images/products/tea-set.jpg',
        type: 'product',
      },
    ];

    for (const product of testProducts) {
      const existing = await prisma.product.findFirst({
        where: { name: product.name },
      });

      if (!existing) {
        await prisma.product.create({ data: product });
        console.log(`✅ 创建产品: ${product.name}`);
      } else {
        console.log(`⚠️  产品已存在: ${product.name}`);
      }
    }

    // 3. 创建测试员工
    console.log('\n3. 创建测试员工...');
    
    const testEmployees = [
      {
        name: '李师傅',
        position: '生产主管',
        phone: '13800138001',
        email: 'li.shifu@linghua.com',
        dailySalary: 300.0,
        status: 'active',
      },
      {
        name: '张设计师',
        position: '产品设计师',
        phone: '13800138002',
        email: 'zhang.designer@linghua.com',
        dailySalary: 350.0,
        status: 'active',
      },
      {
        name: '王质检员',
        position: '质量检验员',
        phone: '13800138003',
        email: 'wang.qc@linghua.com',
        dailySalary: 250.0,
        status: 'active',
      },
    ];

    for (const employee of testEmployees) {
      const existing = await prisma.employee.findFirst({
        where: { name: employee.name },
      });

      if (!existing) {
        await prisma.employee.create({ data: employee });
        console.log(`✅ 创建员工: ${employee.name}`);
      } else {
        console.log(`⚠️  员工已存在: ${employee.name}`);
      }
    }

    // 4. 创建测试客户
    console.log('\n4. 创建测试客户...');
    
    const testCustomers = [
      {
        name: '聆花文化艺术馆',
        phone: '020-12345678',
        email: 'info@linghuaart.com',
        address: '广州市天河区',
        type: 'corporate',
        isActive: true,
      },
    ];

    for (const customer of testCustomers) {
      const existing = await prisma.customer.findFirst({
        where: { name: customer.name },
      });

      if (!existing) {
        await prisma.customer.create({ data: customer });
        console.log(`✅ 创建客户: ${customer.name}`);
      } else {
        console.log(`⚠️  客户已存在: ${customer.name}`);
      }
    }

    console.log('\n🎉 生产管理基础数据初始化完成！');

    // 显示统计信息
    const stats = {
      productionBases: await prisma.productionBase.count(),
      products: await prisma.product.count(),
      employees: await prisma.employee.count(),
      customers: await prisma.customer.count(),
    };

    console.log('\n📊 数据统计:');
    console.log(`   - 生产基地: ${stats.productionBases} 个`);
    console.log(`   - 产品: ${stats.products} 个`);
    console.log(`   - 员工: ${stats.employees} 个`);
    console.log(`   - 客户: ${stats.customers} 个`);

  } catch (error) {
    console.error('❌ 初始化失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initProductionData();
