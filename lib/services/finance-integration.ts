import prisma from "@/lib/db"

// 财务记录类型
export type FinanceRecordType = 
  | "purchase_cost"       // 采购成本
  | "purchase_payment"    // 采购付款
  | "accounts_payable"    // 应付账款
  | "cost_adjustment"     // 成本调整
  | "inventory_valuation" // 库存估值

// 财务记录数据
export interface FinanceRecordData {
  type: FinanceRecordType
  amount: number
  description: string
  referenceId?: number
  referenceType?: string
  supplierId?: number
  productId?: number
  accountId?: number
  operatorId?: string
  transactionDate?: Date
  dueDate?: Date
  notes?: string
}

// 采购财务集成数据
export interface PurchaseFinanceData {
  purchaseOrderId: number
  supplierId: number
  totalAmount: number
  paidAmount?: number
  paymentMethod?: string
  items: Array<{
    productId: number
    quantity: number
    unitCost: number
    totalCost: number
  }>
  operatorId?: string
  notes?: string
}

// 财务集成结果
export interface FinanceIntegrationResult {
  success: boolean
  records: Array<{
    id: number
    type: FinanceRecordType
    amount: number
    description: string
  }>
  totalAmount: number
  errors: Array<{
    type: string
    error: string
  }>
}

// 创建财务记录
export async function createFinanceRecord(data: FinanceRecordData): Promise<any> {
  try {
    console.log(`💰 创建财务记录: ${data.type}, 金额: ${data.amount}`)

    return await prisma.$transaction(async (tx) => {
      // 创建财务记录
      const financeRecord = await tx.financeRecord.create({
        data: {
          type: data.type,
          amount: data.amount,
          description: data.description,
          referenceId: data.referenceId?.toString(),
          referenceType: data.referenceType || "manual",
          supplierId: data.supplierId,
          productId: data.productId,
          accountId: data.accountId,
          operatorId: data.operatorId,
          transactionDate: data.transactionDate || new Date(),
          dueDate: data.dueDate,
          notes: data.notes
        }
      })

      // 如果是应付账款，更新供应商账户余额
      if (data.type === "accounts_payable" && data.supplierId) {
        const supplier = await tx.supplier.findUnique({
          where: { id: data.supplierId }
        })

        if (supplier) {
          await tx.supplier.update({
            where: { id: data.supplierId },
            data: {
              balance: (supplier.balance || 0) + data.amount
            }
          })
        }
      }

      // 如果是付款记录，减少应付账款
      if (data.type === "purchase_payment" && data.supplierId) {
        const supplier = await tx.supplier.findUnique({
          where: { id: data.supplierId }
        })

        if (supplier) {
          await tx.supplier.update({
            where: { id: data.supplierId },
            data: {
              balance: Math.max(0, (supplier.balance || 0) - data.amount)
            }
          })
        }
      }

      return financeRecord
    })

  } catch (error) {
    console.error("❌ 创建财务记录失败:", error)
    throw error
  }
}

// 处理采购订单财务集成
export async function processPurchaseFinanceIntegration(data: PurchaseFinanceData): Promise<FinanceIntegrationResult> {
  try {
    console.log(`💰 处理采购订单财务集成: 订单ID ${data.purchaseOrderId}`)

    const result: FinanceIntegrationResult = {
      success: true,
      records: [],
      totalAmount: data.totalAmount,
      errors: []
    }

    await prisma.$transaction(async (tx) => {
      // 1. 创建采购成本记录
      try {
        const costRecord = await createFinanceRecord({
          type: "purchase_cost",
          amount: data.totalAmount,
          description: `采购成本 - 订单 ${data.purchaseOrderId}`,
          referenceId: data.purchaseOrderId,
          referenceType: "purchase_order",
          supplierId: data.supplierId,
          operatorId: data.operatorId,
          notes: data.notes
        })

        result.records.push({
          id: costRecord.id,
          type: "purchase_cost",
          amount: data.totalAmount,
          description: costRecord.description
        })
      } catch (error) {
        result.errors.push({
          type: "purchase_cost",
          error: error instanceof Error ? error.message : "创建采购成本记录失败"
        })
      }

      // 2. 创建应付账款记录（如果未全额付款）
      const unpaidAmount = data.totalAmount - (data.paidAmount || 0)
      if (unpaidAmount > 0) {
        try {
          const payableRecord = await createFinanceRecord({
            type: "accounts_payable",
            amount: unpaidAmount,
            description: `应付账款 - 订单 ${data.purchaseOrderId}`,
            referenceId: data.purchaseOrderId,
            referenceType: "purchase_order",
            supplierId: data.supplierId,
            operatorId: data.operatorId,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后到期
            notes: `未付金额: ${unpaidAmount}`
          })

          result.records.push({
            id: payableRecord.id,
            type: "accounts_payable",
            amount: unpaidAmount,
            description: payableRecord.description
          })
        } catch (error) {
          result.errors.push({
            type: "accounts_payable",
            error: error instanceof Error ? error.message : "创建应付账款记录失败"
          })
        }
      }

      // 3. 创建付款记录（如果有付款）
      if (data.paidAmount && data.paidAmount > 0) {
        try {
          const paymentRecord = await createFinanceRecord({
            type: "purchase_payment",
            amount: data.paidAmount,
            description: `采购付款 - 订单 ${data.purchaseOrderId}`,
            referenceId: data.purchaseOrderId,
            referenceType: "purchase_order",
            supplierId: data.supplierId,
            operatorId: data.operatorId,
            notes: `付款方式: ${data.paymentMethod || "未指定"}`
          })

          result.records.push({
            id: paymentRecord.id,
            type: "purchase_payment",
            amount: data.paidAmount,
            description: paymentRecord.description
          })
        } catch (error) {
          result.errors.push({
            type: "purchase_payment",
            error: error instanceof Error ? error.message : "创建付款记录失败"
          })
        }
      }

      // 4. 更新产品成本信息
      for (const item of data.items) {
        try {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              cost: item.unitCost,
              updatedAt: new Date()
            }
          })
        } catch (error) {
          result.errors.push({
            type: "cost_update",
            error: `更新产品 ${item.productId} 成本失败: ${error instanceof Error ? error.message : "未知错误"}`
          })
        }
      }
    })

    result.success = result.errors.length === 0

    console.log(`✅ 采购订单财务集成完成，创建 ${result.records.length} 条记录`)
    if (result.errors.length > 0) {
      console.warn(`⚠️ 财务集成有 ${result.errors.length} 个错误`)
    }

    return result

  } catch (error) {
    console.error("❌ 采购订单财务集成失败:", error)
    throw error
  }
}

// 获取采购订单财务状态
export async function getPurchaseOrderFinanceStatus(purchaseOrderId: number) {
  try {
    const financeRecords = await prisma.financeRecord.findMany({
      where: {
        referenceId: purchaseOrderId.toString(),
        referenceType: "purchase_order"
      },
      include: {
        supplier: {
          select: { id: true, name: true, balance: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    const totalCost = financeRecords
      .filter(record => record.type === "purchase_cost")
      .reduce((sum, record) => sum + record.amount, 0)

    const totalPayment = financeRecords
      .filter(record => record.type === "purchase_payment")
      .reduce((sum, record) => sum + record.amount, 0)

    const totalPayable = financeRecords
      .filter(record => record.type === "accounts_payable")
      .reduce((sum, record) => sum + record.amount, 0)

    return {
      purchaseOrderId,
      totalCost,
      totalPayment,
      totalPayable,
      unpaidAmount: totalCost - totalPayment,
      records: financeRecords,
      supplier: financeRecords[0]?.supplier
    }

  } catch (error) {
    console.error("❌ 获取采购订单财务状态失败:", error)
    throw error
  }
}

// 处理采购付款
export async function processPurchasePayment(
  purchaseOrderId: number,
  amount: number,
  paymentMethod: string,
  operatorId?: string,
  notes?: string
) {
  try {
    console.log(`💰 处理采购付款: 订单ID ${purchaseOrderId}, 金额: ${amount}`)

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: { id: true, supplierId: true, totalAmount: true, paidAmount: true }
    })

    if (!purchaseOrder) {
      throw new Error("采购订单不存在")
    }

    const newPaidAmount = (purchaseOrder.paidAmount || 0) + amount
    if (newPaidAmount > purchaseOrder.totalAmount) {
      throw new Error("付款金额超过订单总额")
    }

    return await prisma.$transaction(async (tx) => {
      // 创建付款记录
      const paymentRecord = await createFinanceRecord({
        type: "purchase_payment",
        amount,
        description: `采购付款 - 订单 ${purchaseOrderId}`,
        referenceId: purchaseOrderId,
        referenceType: "purchase_order",
        supplierId: purchaseOrder.supplierId,
        operatorId,
        notes: `付款方式: ${paymentMethod}${notes ? `, ${notes}` : ""}`
      })

      // 更新采购订单付款状态
      const updatedOrder = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: newPaidAmount >= purchaseOrder.totalAmount ? "paid" : "partial_paid",
          paymentMethod: paymentMethod
        }
      })

      return {
        paymentRecord,
        updatedOrder,
        newPaidAmount,
        remainingAmount: purchaseOrder.totalAmount - newPaidAmount
      }
    })

  } catch (error) {
    console.error("❌ 处理采购付款失败:", error)
    throw error
  }
}
