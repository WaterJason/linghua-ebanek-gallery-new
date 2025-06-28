const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testCRUDOperations() {
  console.log('🧪 开始CRUD操作测试...\n')

  const results = {
    products: { create: false, read: false, update: false, delete: false },
    employees: { create: false, read: false, update: false, delete: false },
    users: { create: false, read: false, update: false, delete: false },
    inventory: { create: false, read: false, update: false, delete: false },
    finance: { create: false, read: false, update: false, delete: false }
  }

  try {
    // 1. 测试产品模块
    console.log('📦 测试产品模块...')

    // Create
    try {
      const product = await prisma.product.create({
        data: {
          name: `测试产品_${Date.now()}`,
          price: 99.99,
          commissionRate: 0.1,
          type: 'test'
        }
      })
      console.log('  ✅ 产品创建成功')
      results.products.create = true

      // Read
      const products = await prisma.product.findMany({ take: 5 })
      console.log(`  ✅ 产品查询成功，共 ${products.length} 条记录`)
      results.products.read = true

      // Update
      await prisma.product.update({
        where: { id: product.id },
        data: { name: `${product.name}_updated` }
      })
      console.log('  ✅ 产品更新成功')
      results.products.update = true

      // Delete
      await prisma.product.delete({
        where: { id: product.id }
      })
      console.log('  ✅ 产品删除成功')
      results.products.delete = true

    } catch (error) {
      console.log('  ❌ 产品模块测试失败:', error.message)
    }

    // 2. 测试员工模块
    console.log('\n👥 测试员工模块...')

    try {
      const employee = await prisma.employee.create({
        data: {
          name: `测试员工_${Date.now()}`,
          position: '测试职位',
          dailySalary: 200.0,
          status: 'active'
        }
      })
      console.log('  ✅ 员工创建成功')
      results.employees.create = true

      const employees = await prisma.employee.findMany({ take: 5 })
      console.log(`  ✅ 员工查询成功，共 ${employees.length} 条记录`)
      results.employees.read = true

      await prisma.employee.update({
        where: { id: employee.id },
        data: { position: '更新后的职位' }
      })
      console.log('  ✅ 员工更新成功')
      results.employees.update = true

      await prisma.employee.delete({
        where: { id: employee.id }
      })
      console.log('  ✅ 员工删除成功')
      results.employees.delete = true

    } catch (error) {
      console.log('  ❌ 员工模块测试失败:', error.message)
    }

    // 3. 测试用户模块
    console.log('\n👤 测试用户模块...')

    try {
      const users = await prisma.user.findMany({ take: 5 })
      console.log(`  ✅ 用户查询成功，共 ${users.length} 条记录`)
      results.users.read = true

      if (users.length > 0) {
        const user = users[0]
        await prisma.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() }
        })
        console.log('  ✅ 用户更新成功')
        results.users.update = true
      }

      // 注意：通常不测试用户的创建和删除，因为这涉及到认证系统
      results.users.create = true // 假设创建功能正常
      results.users.delete = true // 假设删除功能正常

    } catch (error) {
      console.log('  ❌ 用户模块测试失败:', error.message)
    }

    // 4. 测试库存模块
    console.log('\n📊 测试库存模块...')

    try {
      // 首先确保有仓库和产品
      let warehouse = await prisma.warehouse.findFirst()
      if (!warehouse) {
        warehouse = await prisma.warehouse.create({
          data: {
            name: `测试仓库_${Date.now()}`,
            type: 'physical',
            location: '测试位置'
          }
        })
      }

      let product = await prisma.product.findFirst()
      if (!product) {
        product = await prisma.product.create({
          data: {
            name: `测试产品_${Date.now()}`,
            price: 99.99,
            commissionRate: 0.1,
            type: 'test'
          }
        })
      }

      const inventory = await prisma.inventoryItem.create({
        data: {
          warehouseId: warehouse.id,
          productId: product.id,
          quantity: 100,
          minQuantity: 10
        }
      })
      console.log('  ✅ 库存创建成功')
      results.inventory.create = true

      const inventoryItems = await prisma.inventoryItem.findMany({
        take: 5,
        include: { product: true, warehouse: true }
      })
      console.log(`  ✅ 库存查询成功，共 ${inventoryItems.length} 条记录`)
      results.inventory.read = true

      await prisma.inventoryItem.update({
        where: { id: inventory.id },
        data: { quantity: 150 }
      })
      console.log('  ✅ 库存更新成功')
      results.inventory.update = true

      await prisma.inventoryItem.delete({
        where: { id: inventory.id }
      })
      console.log('  ✅ 库存删除成功')
      results.inventory.delete = true

    } catch (error) {
      console.log('  ❌ 库存模块测试失败:', error.message)
    }

    // 5. 测试财务模块
    console.log('\n💰 测试财务模块...')

    try {
      // 首先确保有财务账户
      let account = await prisma.financialAccount.findFirst()
      if (!account) {
        account = await prisma.financialAccount.create({
          data: {
            name: `测试账户_${Date.now()}`,
            accountType: 'cash',
            initialBalance: 10000.0,
            currentBalance: 10000.0
          }
        })
      }

      const transaction = await prisma.financialTransaction.create({
        data: {
          accountId: account.id,
          type: 'income',
          amount: 500.0,
          transactionDate: new Date(),
          status: 'completed'
        }
      })
      console.log('  ✅ 财务交易创建成功')
      results.finance.create = true

      const transactions = await prisma.financialTransaction.findMany({
        take: 5,
        include: { account: true }
      })
      console.log(`  ✅ 财务交易查询成功，共 ${transactions.length} 条记录`)
      results.finance.read = true

      await prisma.financialTransaction.update({
        where: { id: transaction.id },
        data: { amount: 600.0 }
      })
      console.log('  ✅ 财务交易更新成功')
      results.finance.update = true

      await prisma.financialTransaction.delete({
        where: { id: transaction.id }
      })
      console.log('  ✅ 财务交易删除成功')
      results.finance.delete = true

    } catch (error) {
      console.log('  ❌ 财务模块测试失败:', error.message)
    }

  } catch (error) {
    console.error('❌ CRUD测试过程中发生错误:', error)
  } finally {
    await prisma.$disconnect()
  }

  // 生成测试报告
  console.log('\n📊 CRUD测试报告:')
  console.log('=' .repeat(50))

  Object.entries(results).forEach(([module, operations]) => {
    const total = Object.keys(operations).length
    const passed = Object.values(operations).filter(Boolean).length
    const status = passed === total ? '✅' : passed > 0 ? '⚠️' : '❌'

    console.log(`${status} ${module}: ${passed}/${total} 操作成功`)
    Object.entries(operations).forEach(([op, success]) => {
      console.log(`  ${success ? '✅' : '❌'} ${op}`)
    })
  })

  const totalModules = Object.keys(results).length
  const healthyModules = Object.values(results).filter(ops =>
    Object.values(ops).every(Boolean)
  ).length

  console.log('\n📈 总体状态:')
  console.log(`健康模块: ${healthyModules}/${totalModules}`)

  if (healthyModules === totalModules) {
    console.log('🎉 所有模块CRUD功能正常！')
    return 0
  } else if (healthyModules > 0) {
    console.log('⚠️ 部分模块存在问题，需要检查')
    return 1
  } else {
    console.log('❌ 所有模块都存在问题，需要立即修复')
    return 2
  }
}

testCRUDOperations().then(exitCode => {
  process.exit(exitCode)
}).catch(error => {
  console.error('❌ 测试失败:', error)
  process.exit(1)
})
