const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function getExpectedTables() {
  // Read the Prisma schema file to extract all model names
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  
  // Extract model names using regex
  const modelMatches = schemaContent.match(/^model\s+(\w+)\s*{/gm)
  const expectedTables = modelMatches ? modelMatches.map(match => {
    const modelName = match.match(/^model\s+(\w+)/)[1]
    return modelName
  }) : []
  
  return expectedTables.sort()
}

async function getCurrentTables() {
  try {
    // Get all table names from the database
    const result = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations'
      ORDER BY tablename
    `
    
    return result.map(row => row.tablename)
  } catch (error) {
    console.error('Error fetching current tables:', error)
    return []
  }
}

async function analyzeMissingTables() {
  console.log('🔍 分析数据库表结构...\n')
  
  try {
    await prisma.$connect()
    
    const expectedTables = await getExpectedTables()
    const currentTables = await getCurrentTables()
    
    console.log(`📋 预期表数量: ${expectedTables.length}`)
    console.log(`📊 当前表数量: ${currentTables.length}`)
    console.log('')
    
    // Find missing tables
    const missingTables = expectedTables.filter(table => !currentTables.includes(table))
    
    // Find extra tables (tables in DB but not in schema)
    const extraTables = currentTables.filter(table => !expectedTables.includes(table))
    
    console.log('❌ 缺失的表:')
    if (missingTables.length === 0) {
      console.log('  无缺失表')
    } else {
      missingTables.forEach(table => {
        console.log(`  - ${table}`)
      })
    }
    
    console.log('\n➕ 额外的表 (数据库中存在但schema中没有):')
    if (extraTables.length === 0) {
      console.log('  无额外表')
    } else {
      extraTables.forEach(table => {
        console.log(`  - ${table}`)
      })
    }
    
    console.log('\n📊 详细对比:')
    console.log('预期表列表:')
    expectedTables.forEach((table, index) => {
      const exists = currentTables.includes(table)
      console.log(`  ${index + 1}. ${table} ${exists ? '✅' : '❌'}`)
    })
    
    // Analyze impact on ERP modules
    console.log('\n🎯 影响分析:')
    const moduleTableMapping = {
      'products': ['Product', 'ProductCategory', 'ProductTag', 'ProductTagsOnProducts'],
      'employees': ['Employee', 'Schedule', 'ScheduleTemplate'],
      'inventory': ['InventoryItem', 'InventoryTransaction', 'Warehouse'],
      'finance': ['FinancialAccount', 'FinancialCategory', 'FinancialTransaction'],
      'payroll': ['SalaryRecord', 'SalaryAdjustment'],
      'sales': ['Order', 'OrderItem', 'Customer', 'PosSale', 'PosSaleItem'],
      'purchase': ['PurchaseOrder', 'PurchaseOrderItem', 'Supplier'],
      'channels': ['Channel', 'ChannelPrice', 'ChannelSale', 'ChannelSaleItem', 'ChannelInventory', 'ChannelDeposit', 'ChannelSettlement', 'ChannelInvoice', 'ChannelDistribution']
    }
    
    Object.entries(moduleTableMapping).forEach(([module, tables]) => {
      const missingModuleTables = tables.filter(table => missingTables.includes(table))
      if (missingModuleTables.length > 0) {
        console.log(`  ❌ ${module}: 缺失 ${missingModuleTables.join(', ')}`)
      } else {
        console.log(`  ✅ ${module}: 所有表都存在`)
      }
    })
    
    return {
      expectedTables,
      currentTables,
      missingTables,
      extraTables,
      totalMissing: missingTables.length
    }
    
  } catch (error) {
    console.error('❌ 分析过程中发生错误:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

// Run the analysis
analyzeMissingTables().then(result => {
  if (result) {
    console.log(`\n📈 总结: 缺失 ${result.totalMissing} 个表`)
    if (result.totalMissing > 0) {
      console.log('需要执行数据库迁移来创建缺失的表')
      process.exit(1)
    } else {
      console.log('✅ 所有预期的表都存在')
      process.exit(0)
    }
  } else {
    process.exit(1)
  }
}).catch(error => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})
