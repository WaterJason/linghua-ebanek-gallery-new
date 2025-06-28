const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function identifyTableMismatch() {
  console.log('🔍 识别表名不匹配问题...\n')

  try {
    await prisma.$connect()

    // Get actual table names from database
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `
    const existingTables = tables.map(t => t.tablename)

    // Required tables from the diagnostic function (updated)
    const requiredTables = [
      'User', 'Employee', 'Product', 'InventoryItem', 'FinancialAccount',
      'FinancialTransaction', 'SalaryRecord', 'Order', 'PurchaseOrder', 'Channel'
    ]

    console.log('📋 诊断系统查找的表:')
    requiredTables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`)
    })

    console.log('\n🔍 检查每个表是否存在:')
    const missingTables = []
    const foundTables = []

    requiredTables.forEach(table => {
      const exactMatch = existingTables.find(existing => existing === table)
      const caseInsensitiveMatch = existingTables.find(existing =>
        existing.toLowerCase() === table.toLowerCase()
      )

      if (exactMatch) {
        console.log(`  ✅ ${table} - 精确匹配`)
        foundTables.push(table)
      } else if (caseInsensitiveMatch) {
        console.log(`  ⚠️ ${table} - 大小写不匹配，实际表名: ${caseInsensitiveMatch}`)
        foundTables.push(table)
      } else {
        // Look for similar table names
        const similarTables = existingTables.filter(existing =>
          existing.toLowerCase().includes(table.toLowerCase()) ||
          table.toLowerCase().includes(existing.toLowerCase())
        )

        if (similarTables.length > 0) {
          console.log(`  🔍 ${table} - 未找到，但发现相似表: ${similarTables.join(', ')}`)
        } else {
          console.log(`  ❌ ${table} - 完全未找到`)
        }
        missingTables.push(table)
      }
    })

    console.log('\n📊 结果摘要:')
    console.log(`  找到的表: ${foundTables.length}/${requiredTables.length}`)
    console.log(`  缺失的表: ${missingTables.length}`)

    if (missingTables.length > 0) {
      console.log('\n❌ 缺失的表:')
      missingTables.forEach(table => {
        console.log(`  - ${table}`)
      })

      console.log('\n🔍 建议的修复方案:')
      missingTables.forEach(table => {
        // Look for potential matches
        const potentialMatches = existingTables.filter(existing => {
          const tableWords = table.toLowerCase().split(/(?=[A-Z])/)
          const existingWords = existing.toLowerCase().split(/(?=[A-Z])/)
          return tableWords.some(word => existingWords.includes(word))
        })

        if (potentialMatches.length > 0) {
          console.log(`  ${table} -> 可能应该是: ${potentialMatches.join(' 或 ')}`)
        }
      })
    }

    // Show some actual table names for reference
    console.log('\n📋 数据库中的实际表名 (前20个):')
    existingTables.slice(0, 20).forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`)
    })

    return {
      requiredTables,
      existingTables,
      missingTables,
      foundTables
    }

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

identifyTableMismatch().then(result => {
  if (result && result.missingTables.length === 0) {
    console.log('\n✅ 所有表都存在，问题可能在其他地方')
    process.exit(0)
  } else if (result) {
    console.log(`\n⚠️ 发现 ${result.missingTables.length} 个表名不匹配问题`)
    process.exit(1)
  } else {
    process.exit(1)
  }
}).catch(error => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})
