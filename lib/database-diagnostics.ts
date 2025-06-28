import prisma from '@/lib/db'

export interface DiagnosticResult {
  module: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
  error?: Error
}

export interface CRUDTestResult {
  create: DiagnosticResult
  read: DiagnosticResult
  update: DiagnosticResult
  delete: DiagnosticResult
}

export interface ModuleDiagnostic {
  module: string
  connection: DiagnosticResult
  crud: CRUDTestResult
  overall: 'healthy' | 'warning' | 'critical'
}

/**
 * 数据库连接健康检查
 */
export async function checkDatabaseConnection(): Promise<DiagnosticResult> {
  try {
    await prisma.$connect()
    const result = await prisma.$queryRaw`SELECT 1 as test`

    return {
      module: 'database',
      status: 'success',
      message: '数据库连接正常',
      details: { result }
    }
  } catch (error) {
    return {
      module: 'database',
      status: 'error',
      message: '数据库连接失败',
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * 检查数据库表是否存在
 */
export async function checkTablesExist(): Promise<DiagnosticResult> {
  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `

    const requiredTables = [
      'User', 'Employee', 'Product', 'InventoryItem', 'FinancialAccount',
      'FinancialTransaction', 'SalaryRecord', 'Order', 'PurchaseOrder', 'Channel'
    ]

    const existingTables = tables.map(t => t.tablename)
    const missingTables = requiredTables.filter(table =>
      !existingTables.some(existing => existing.toLowerCase() === table.toLowerCase())
    )

    if (missingTables.length === 0) {
      return {
        module: 'database',
        status: 'success',
        message: '所有必需的数据表都存在',
        details: { existingTables: existingTables.length, requiredTables: requiredTables.length }
      }
    } else {
      return {
        module: 'database',
        status: 'warning',
        message: `缺少 ${missingTables.length} 个数据表`,
        details: { missingTables, existingTables }
      }
    }
  } catch (error) {
    return {
      module: 'database',
      status: 'error',
      message: '检查数据表失败',
      error: error instanceof Error ? error : new Error('Unknown error')
    }
  }
}

/**
 * 产品管理模块 CRUD 测试
 */
export async function testProductsCRUD(): Promise<CRUDTestResult> {
  const testProduct = {
    name: `测试产品_${Date.now()}`,
    price: 99.99,
    commissionRate: 0.1,
    type: 'test'
  }

  let createdProductId: number | null = null

  // Create 测试
  const createResult: DiagnosticResult = await (async () => {
    try {
      const product = await prisma.product.create({
        data: testProduct
      })
      createdProductId = product.id
      return {
        module: 'products',
        status: 'success',
        message: '产品创建成功',
        details: { id: product.id }
      }
    } catch (error) {
      return {
        module: 'products',
        status: 'error',
        message: '产品创建失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Read 测试
  const readResult: DiagnosticResult = await (async () => {
    try {
      const products = await prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      return {
        module: 'products',
        status: 'success',
        message: '产品查询成功',
        details: { count: products.length }
      }
    } catch (error) {
      return {
        module: 'products',
        status: 'error',
        message: '产品查询失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Update 测试
  const updateResult: DiagnosticResult = await (async () => {
    if (!createdProductId) {
      return {
        module: 'products',
        status: 'error',
        message: '无法更新产品：创建失败'
      }
    }

    try {
      const updatedProduct = await prisma.product.update({
        where: { id: createdProductId },
        data: { name: `${testProduct.name}_updated` }
      })
      return {
        module: 'products',
        status: 'success',
        message: '产品更新成功',
        details: { id: updatedProduct.id }
      }
    } catch (error) {
      return {
        module: 'products',
        status: 'error',
        message: '产品更新失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Delete 测试
  const deleteResult: DiagnosticResult = await (async () => {
    if (!createdProductId) {
      return {
        module: 'products',
        status: 'error',
        message: '无法删除产品：创建失败'
      }
    }

    try {
      await prisma.product.delete({
        where: { id: createdProductId }
      })
      return {
        module: 'products',
        status: 'success',
        message: '产品删除成功'
      }
    } catch (error) {
      return {
        module: 'products',
        status: 'error',
        message: '产品删除失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  return {
    create: createResult,
    read: readResult,
    update: updateResult,
    delete: deleteResult
  }
}

/**
 * 员工管理模块 CRUD 测试
 */
export async function testEmployeesCRUD(): Promise<CRUDTestResult> {
  const testEmployee = {
    name: `测试员工_${Date.now()}`,
    position: '测试职位',
    dailySalary: 200.0,
    status: 'active'
  }

  let createdEmployeeId: number | null = null

  // Create 测试
  const createResult: DiagnosticResult = await (async () => {
    try {
      const employee = await prisma.employee.create({
        data: testEmployee
      })
      createdEmployeeId = employee.id
      return {
        module: 'employees',
        status: 'success',
        message: '员工创建成功',
        details: { id: employee.id }
      }
    } catch (error) {
      return {
        module: 'employees',
        status: 'error',
        message: '员工创建失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Read 测试
  const readResult: DiagnosticResult = await (async () => {
    try {
      const employees = await prisma.employee.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      return {
        module: 'employees',
        status: 'success',
        message: '员工查询成功',
        details: { count: employees.length }
      }
    } catch (error) {
      return {
        module: 'employees',
        status: 'error',
        message: '员工查询失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Update 测试
  const updateResult: DiagnosticResult = await (async () => {
    if (!createdEmployeeId) {
      return {
        module: 'employees',
        status: 'error',
        message: '无法更新员工：创建失败'
      }
    }

    try {
      const updatedEmployee = await prisma.employee.update({
        where: { id: createdEmployeeId },
        data: { position: '更新后的职位' }
      })
      return {
        module: 'employees',
        status: 'success',
        message: '员工更新成功',
        details: { id: updatedEmployee.id }
      }
    } catch (error) {
      return {
        module: 'employees',
        status: 'error',
        message: '员工更新失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Delete 测试
  const deleteResult: DiagnosticResult = await (async () => {
    if (!createdEmployeeId) {
      return {
        module: 'employees',
        status: 'error',
        message: '无法删除员工：创建失败'
      }
    }

    try {
      await prisma.employee.delete({
        where: { id: createdEmployeeId }
      })
      return {
        module: 'employees',
        status: 'success',
        message: '员工删除成功'
      }
    } catch (error) {
      return {
        module: 'employees',
        status: 'error',
        message: '员工删除失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  return {
    create: createResult,
    read: readResult,
    update: updateResult,
    delete: deleteResult
  }
}

/**
 * 库存管理模块 CRUD 测试
 */
export async function testInventoryCRUD(): Promise<CRUDTestResult> {
  // 首先确保有仓库和产品
  let testWarehouse: any
  let testProduct: any

  try {
    testWarehouse = await prisma.warehouse.findFirst() ||
      await prisma.warehouse.create({
        data: {
          name: `测试仓库_${Date.now()}`,
          type: 'physical',
          location: '测试位置'
        }
      })

    testProduct = await prisma.product.findFirst() ||
      await prisma.product.create({
        data: {
          name: `测试产品_${Date.now()}`,
          price: 99.99,
          commissionRate: 0.1,
          type: 'test'
        }
      })
  } catch (error) {
    const errorResult = {
      module: 'inventory',
      status: 'error' as const,
      message: '无法创建测试数据',
      error: error instanceof Error ? error : new Error('Unknown error')
    }
    return {
      create: errorResult,
      read: errorResult,
      update: errorResult,
      delete: errorResult
    }
  }

  let createdInventoryId: number | null = null

  // Create 测试
  const createResult: DiagnosticResult = await (async () => {
    try {
      const inventory = await prisma.inventoryItem.create({
        data: {
          warehouseId: testWarehouse.id,
          productId: testProduct.id,
          quantity: 100,
          minQuantity: 10
        }
      })
      createdInventoryId = inventory.id
      return {
        module: 'inventory',
        status: 'success',
        message: '库存创建成功',
        details: { id: inventory.id }
      }
    } catch (error) {
      return {
        module: 'inventory',
        status: 'error',
        message: '库存创建失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Read 测试
  const readResult: DiagnosticResult = await (async () => {
    try {
      const inventoryItems = await prisma.inventoryItem.findMany({
        take: 5,
        include: {
          product: true,
          warehouse: true
        }
      })
      return {
        module: 'inventory',
        status: 'success',
        message: '库存查询成功',
        details: { count: inventoryItems.length }
      }
    } catch (error) {
      return {
        module: 'inventory',
        status: 'error',
        message: '库存查询失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Update 测试
  const updateResult: DiagnosticResult = await (async () => {
    if (!createdInventoryId) {
      return {
        module: 'inventory',
        status: 'error',
        message: '无法更新库存：创建失败'
      }
    }

    try {
      const updatedInventory = await prisma.inventoryItem.update({
        where: { id: createdInventoryId },
        data: { quantity: 150 }
      })
      return {
        module: 'inventory',
        status: 'success',
        message: '库存更新成功',
        details: { id: updatedInventory.id }
      }
    } catch (error) {
      return {
        module: 'inventory',
        status: 'error',
        message: '库存更新失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Delete 测试
  const deleteResult: DiagnosticResult = await (async () => {
    if (!createdInventoryId) {
      return {
        module: 'inventory',
        status: 'error',
        message: '无法删除库存：创建失败'
      }
    }

    try {
      await prisma.inventoryItem.delete({
        where: { id: createdInventoryId }
      })
      return {
        module: 'inventory',
        status: 'success',
        message: '库存删除成功'
      }
    } catch (error) {
      return {
        module: 'inventory',
        status: 'error',
        message: '库存删除失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  return {
    create: createResult,
    read: readResult,
    update: updateResult,
    delete: deleteResult
  }
}