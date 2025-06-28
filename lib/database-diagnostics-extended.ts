import prisma from '@/lib/db'
import { DiagnosticResult, CRUDTestResult } from './database-diagnostics'

/**
 * 财务管理模块 CRUD 测试
 */
export async function testFinanceCRUD(): Promise<CRUDTestResult> {
  // 首先确保有财务账户
  let testAccount: any

  try {
    testAccount = await prisma.financialAccount.findFirst() ||
      await prisma.financialAccount.create({
        data: {
          name: `测试账户_${Date.now()}`,
          accountType: 'cash',
          initialBalance: 10000.0,
          currentBalance: 10000.0
        }
      })
  } catch (error) {
    const errorResult = {
      module: 'finance',
      status: 'error' as const,
      message: '无法创建测试账户',
      error: error instanceof Error ? error : new Error('Unknown error')
    }
    return {
      create: errorResult,
      read: errorResult,
      update: errorResult,
      delete: errorResult
    }
  }

  let createdTransactionId: number | null = null

  // Create 测试
  const createResult: DiagnosticResult = await (async () => {
    try {
      const transaction = await prisma.financialTransaction.create({
        data: {
          accountId: testAccount.id,
          type: 'income',
          amount: 500.0,
          transactionDate: new Date(),
          status: 'completed'
        }
      })
      createdTransactionId = transaction.id
      return {
        module: 'finance',
        status: 'success',
        message: '财务交易创建成功',
        details: { id: transaction.id }
      }
    } catch (error) {
      return {
        module: 'finance',
        status: 'error',
        message: '财务交易创建失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Read 测试
  const readResult: DiagnosticResult = await (async () => {
    try {
      const transactions = await prisma.financialTransaction.findMany({
        take: 5,
        include: {
          account: true,
          category: true
        }
      })
      return {
        module: 'finance',
        status: 'success',
        message: '财务交易查询成功',
        details: { count: transactions.length }
      }
    } catch (error) {
      return {
        module: 'finance',
        status: 'error',
        message: '财务交易查询失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Update 测试
  const updateResult: DiagnosticResult = await (async () => {
    if (!createdTransactionId) {
      return {
        module: 'finance',
        status: 'error',
        message: '无法更新财务交易：创建失败'
      }
    }

    try {
      const updatedTransaction = await prisma.financialTransaction.update({
        where: { id: createdTransactionId },
        data: { amount: 600.0 }
      })
      return {
        module: 'finance',
        status: 'success',
        message: '财务交易更新成功',
        details: { id: updatedTransaction.id }
      }
    } catch (error) {
      return {
        module: 'finance',
        status: 'error',
        message: '财务交易更新失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Delete 测试
  const deleteResult: DiagnosticResult = await (async () => {
    if (!createdTransactionId) {
      return {
        module: 'finance',
        status: 'error',
        message: '无法删除财务交易：创建失败'
      }
    }

    try {
      await prisma.financialTransaction.delete({
        where: { id: createdTransactionId }
      })
      return {
        module: 'finance',
        status: 'success',
        message: '财务交易删除成功'
      }
    } catch (error) {
      return {
        module: 'finance',
        status: 'error',
        message: '财务交易删除失败',
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
 * 薪酬管理模块 CRUD 测试
 */
export async function testPayrollCRUD(): Promise<CRUDTestResult> {
  // 首先确保有员工
  let testEmployee: any

  try {
    testEmployee = await prisma.employee.findFirst() ||
      await prisma.employee.create({
        data: {
          name: `测试员工_${Date.now()}`,
          position: '测试职位',
          dailySalary: 200.0,
          status: 'active'
        }
      })
  } catch (error) {
    const errorResult = {
      module: 'payroll',
      status: 'error' as const,
      message: '无法创建测试员工',
      error: error instanceof Error ? error : new Error('Unknown error')
    }
    return {
      create: errorResult,
      read: errorResult,
      update: errorResult,
      delete: errorResult
    }
  }

  let createdSalaryRecordId: number | null = null

  // Create 测试
  const createResult: DiagnosticResult = await (async () => {
    try {
      const currentDate = new Date()
      const salaryRecord = await prisma.salaryRecord.create({
        data: {
          employeeId: testEmployee.id,
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
          baseSalary: 5000.0,
          scheduleSalary: 0.0,
          salesCommission: 0.0,
          pieceWorkIncome: 0.0,
          workshopIncome: 0.0,
          coffeeShiftCommission: 0.0,
          overtimePay: 0.0,
          bonus: 0.0,
          deductions: 0.0,
          socialInsurance: 0.0,
          tax: 0.0,
          totalIncome: 5000.0,
          netIncome: 5000.0,
          status: 'draft'
        }
      })
      createdSalaryRecordId = salaryRecord.id
      return {
        module: 'payroll',
        status: 'success',
        message: '薪酬记录创建成功',
        details: { id: salaryRecord.id }
      }
    } catch (error) {
      return {
        module: 'payroll',
        status: 'error',
        message: '薪酬记录创建失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Read 测试
  const readResult: DiagnosticResult = await (async () => {
    try {
      const salaryRecords = await prisma.salaryRecord.findMany({
        take: 5,
        include: {
          employee: true
        }
      })
      return {
        module: 'payroll',
        status: 'success',
        message: '薪酬记录查询成功',
        details: { count: salaryRecords.length }
      }
    } catch (error) {
      return {
        module: 'payroll',
        status: 'error',
        message: '薪酬记录查询失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Update 测试
  const updateResult: DiagnosticResult = await (async () => {
    if (!createdSalaryRecordId) {
      return {
        module: 'payroll',
        status: 'error',
        message: '无法更新薪酬记录：创建失败'
      }
    }

    try {
      const updatedSalaryRecord = await prisma.salaryRecord.update({
        where: { id: createdSalaryRecordId },
        data: {
          totalIncome: 5500.0,
          netIncome: 5500.0
        }
      })
      return {
        module: 'payroll',
        status: 'success',
        message: '薪酬记录更新成功',
        details: { id: updatedSalaryRecord.id }
      }
    } catch (error) {
      return {
        module: 'payroll',
        status: 'error',
        message: '薪酬记录更新失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Delete 测试
  const deleteResult: DiagnosticResult = await (async () => {
    if (!createdSalaryRecordId) {
      return {
        module: 'payroll',
        status: 'error',
        message: '无法删除薪酬记录：创建失败'
      }
    }

    try {
      await prisma.salaryRecord.delete({
        where: { id: createdSalaryRecordId }
      })
      return {
        module: 'payroll',
        status: 'success',
        message: '薪酬记录删除成功'
      }
    } catch (error) {
      return {
        module: 'payroll',
        status: 'error',
        message: '薪酬记录删除失败',
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
 * 渠道管理模块 CRUD 测试
 */
export async function testChannelsCRUD(): Promise<CRUDTestResult> {
  let createdChannelId: number | null = null

  // Create 测试
  const createResult: DiagnosticResult = await (async () => {
    try {
      const channel = await prisma.channel.create({
        data: {
          name: `测试渠道_${Date.now()}`,
          code: `TEST_${Date.now()}`,
          description: '测试渠道描述',
          contactName: '李四',
          contactPhone: '13800138001',
          status: 'active'
        }
      })
      createdChannelId = channel.id
      return {
        module: 'channels',
        status: 'success',
        message: '渠道创建成功',
        details: { id: channel.id }
      }
    } catch (error) {
      return {
        module: 'channels',
        status: 'error',
        message: '渠道创建失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Read 测试
  const readResult: DiagnosticResult = await (async () => {
    try {
      const channels = await prisma.channel.findMany({
        take: 5,
        include: {
          sales: true,
          inventory: true
        }
      })
      return {
        module: 'channels',
        status: 'success',
        message: '渠道查询成功',
        details: { count: channels.length }
      }
    } catch (error) {
      return {
        module: 'channels',
        status: 'error',
        message: '渠道查询失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Update 测试
  const updateResult: DiagnosticResult = await (async () => {
    if (!createdChannelId) {
      return {
        module: 'channels',
        status: 'error',
        message: '无法更新渠道：创建失败'
      }
    }

    try {
      const updatedChannel = await prisma.channel.update({
        where: { id: createdChannelId },
        data: { status: 'inactive' }
      })
      return {
        module: 'channels',
        status: 'success',
        message: '渠道更新成功',
        details: { id: updatedChannel.id }
      }
    } catch (error) {
      return {
        module: 'channels',
        status: 'error',
        message: '渠道更新失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Delete 测试
  const deleteResult: DiagnosticResult = await (async () => {
    if (!createdChannelId) {
      return {
        module: 'channels',
        status: 'error',
        message: '无法删除渠道：创建失败'
      }
    }

    try {
      await prisma.channel.delete({
        where: { id: createdChannelId }
      })
      return {
        module: 'channels',
        status: 'success',
        message: '渠道删除成功'
      }
    } catch (error) {
      return {
        module: 'channels',
        status: 'error',
        message: '渠道删除失败',
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
 * 销售管理模块 CRUD 测试
 */
export async function testSalesCRUD(): Promise<CRUDTestResult> {
  // 首先确保有客户和员工
  let testCustomer: any
  let testEmployee: any

  try {
    testCustomer = await prisma.customer.findFirst() ||
      await prisma.customer.create({
        data: {
          name: `测试客户_${Date.now()}`,
          phone: '13800138000',
          type: 'individual'
        }
      })

    testEmployee = await prisma.employee.findFirst() ||
      await prisma.employee.create({
        data: {
          name: `测试员工_${Date.now()}`,
          position: '销售员',
          dailySalary: 200.0,
          status: 'active'
        }
      })
  } catch (error) {
    const errorResult = {
      module: 'sales',
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

  let createdOrderId: number | null = null

  // Create 测试
  const createResult: DiagnosticResult = await (async () => {
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: `TEST_${Date.now()}`,
          customerId: testCustomer.id,
          employeeId: testEmployee.id,
          orderDate: new Date(),
          totalAmount: 1000.0,
          status: 'pending'
        }
      })
      createdOrderId = order.id
      return {
        module: 'sales',
        status: 'success',
        message: '销售订单创建成功',
        details: { id: order.id }
      }
    } catch (error) {
      return {
        module: 'sales',
        status: 'error',
        message: '销售订单创建失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Read 测试
  const readResult: DiagnosticResult = await (async () => {
    try {
      const orders = await prisma.order.findMany({
        take: 5,
        include: {
          customer: true,
          employee: true,
          items: true
        }
      })
      return {
        module: 'sales',
        status: 'success',
        message: '销售订单查询成功',
        details: { count: orders.length }
      }
    } catch (error) {
      return {
        module: 'sales',
        status: 'error',
        message: '销售订单查询失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Update 测试
  const updateResult: DiagnosticResult = await (async () => {
    if (!createdOrderId) {
      return {
        module: 'sales',
        status: 'error',
        message: '无法更新销售订单：创建失败'
      }
    }

    try {
      const updatedOrder = await prisma.order.update({
        where: { id: createdOrderId },
        data: { status: 'confirmed' }
      })
      return {
        module: 'sales',
        status: 'success',
        message: '销售订单更新成功',
        details: { id: updatedOrder.id }
      }
    } catch (error) {
      return {
        module: 'sales',
        status: 'error',
        message: '销售订单更新失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Delete 测试
  const deleteResult: DiagnosticResult = await (async () => {
    if (!createdOrderId) {
      return {
        module: 'sales',
        status: 'error',
        message: '无法删除销售订单：创建失败'
      }
    }

    try {
      await prisma.order.delete({
        where: { id: createdOrderId }
      })
      return {
        module: 'sales',
        status: 'success',
        message: '销售订单删除成功'
      }
    } catch (error) {
      return {
        module: 'sales',
        status: 'error',
        message: '销售订单删除失败',
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
 * 采购管理模块 CRUD 测试
 */
export async function testPurchaseCRUD(): Promise<CRUDTestResult> {
  // 首先确保有员工和供应商
  let testEmployee: any
  let testSupplier: any

  try {
    testEmployee = await prisma.employee.findFirst() ||
      await prisma.employee.create({
        data: {
          name: `测试员工_${Date.now()}`,
          position: '采购员',
          dailySalary: 200.0,
          status: 'active'
        }
      })

    testSupplier = await prisma.supplier.findFirst() ||
      await prisma.supplier.create({
        data: {
          name: `测试供应商_${Date.now()}`,
          contactPerson: '张三',
          phone: '13800138000'
        }
      })
  } catch (error) {
    const errorResult = {
      module: 'purchase',
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

  let createdPurchaseOrderId: number | null = null

  // Create 测试
  const createResult: DiagnosticResult = await (async () => {
    try {
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderNumber: `PO_${Date.now()}`,
          supplierId: testSupplier.id,
          employeeId: testEmployee.id,
          orderDate: new Date(),
          totalAmount: 2000.0,
          status: 'pending'
        }
      })
      createdPurchaseOrderId = purchaseOrder.id
      return {
        module: 'purchase',
        status: 'success',
        message: '采购订单创建成功',
        details: { id: purchaseOrder.id }
      }
    } catch (error) {
      return {
        module: 'purchase',
        status: 'error',
        message: '采购订单创建失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Read 测试
  const readResult: DiagnosticResult = await (async () => {
    try {
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        take: 5,
        include: {
          supplier: true,
          employee: true,
          items: true
        }
      })
      return {
        module: 'purchase',
        status: 'success',
        message: '采购订单查询成功',
        details: { count: purchaseOrders.length }
      }
    } catch (error) {
      return {
        module: 'purchase',
        status: 'error',
        message: '采购订单查询失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Update 测试
  const updateResult: DiagnosticResult = await (async () => {
    if (!createdPurchaseOrderId) {
      return {
        module: 'purchase',
        status: 'error',
        message: '无法更新采购订单：创建失败'
      }
    }

    try {
      const updatedPurchaseOrder = await prisma.purchaseOrder.update({
        where: { id: createdPurchaseOrderId },
        data: { status: 'confirmed' }
      })
      return {
        module: 'purchase',
        status: 'success',
        message: '采购订单更新成功',
        details: { id: updatedPurchaseOrder.id }
      }
    } catch (error) {
      return {
        module: 'purchase',
        status: 'error',
        message: '采购订单更新失败',
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  })()

  // Delete 测试
  const deleteResult: DiagnosticResult = await (async () => {
    if (!createdPurchaseOrderId) {
      return {
        module: 'purchase',
        status: 'error',
        message: '无法删除采购订单：创建失败'
      }
    }

    try {
      await prisma.purchaseOrder.delete({
        where: { id: createdPurchaseOrderId }
      })
      return {
        module: 'purchase',
        status: 'success',
        message: '采购订单删除成功'
      }
    } catch (error) {
      return {
        module: 'purchase',
        status: 'error',
        message: '采购订单删除失败',
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