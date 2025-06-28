import prisma from "@/lib/db"

// 库存操作类型
export type InventoryOperationType = 
  | "purchase_receive"    // 采购入库
  | "purchase_sync"       // 采购同步
  | "purchase_return"     // 采购退货
  | "adjustment"          // 库存调整
  | "transfer"            // 库存调拨

// 库存事务数据
export interface InventoryTransactionData {
  type: InventoryOperationType
  productId: number
  warehouseId: number
  quantity: number
  unitCost?: number
  notes?: string
  referenceId?: number
  referenceType?: string
  operatorId?: string
}

// 批量库存更新数据
export interface BatchInventoryUpdate {
  items: Array<{
    productId: number
    warehouseId: number
    quantity: number
    unitCost?: number
    qualityGrade?: "A" | "B" | "C" | "D"
    notes?: string
  }>
  operationType: InventoryOperationType
  referenceId?: number
  referenceType?: string
  operatorId?: string
  notes?: string
}

// 库存同步结果
export interface InventorySyncResult {
  success: boolean
  totalItems: number
  successItems: number
  failedItems: number
  transactions: Array<{
    id: number
    productId: number
    productName: string
    quantity: number
    warehouseId: number
    warehouseName: string
  }>
  errors: Array<{
    productId: number
    productName: string
    error: string
  }>
}

// 创建库存事务记录
export async function createInventoryTransaction(data: InventoryTransactionData): Promise<any> {
  try {
    console.log(`📦 创建库存事务: ${data.type}, 产品ID: ${data.productId}, 数量: ${data.quantity}`)

    return await prisma.$transaction(async (tx) => {
      // 获取产品信息
      const product = await tx.product.findUnique({
        where: { id: data.productId },
        select: { id: true, name: true, cost: true }
      })

      if (!product) {
        throw new Error(`产品不存在: ID ${data.productId}`)
      }

      // 获取或创建库存记录
      let inventoryItem = await tx.inventoryItem.findFirst({
        where: {
          productId: data.productId,
          warehouseId: data.warehouseId
        }
      })

      const newQuantity = data.quantity
      const isInbound = ["purchase_receive", "purchase_sync", "adjustment"].includes(data.type)

      if (inventoryItem) {
        // 更新现有库存
        const updatedQuantity = isInbound 
          ? inventoryItem.quantity + newQuantity
          : inventoryItem.quantity - newQuantity

        if (updatedQuantity < 0 && !isInbound) {
          throw new Error(`库存不足: 产品 ${product.name}, 当前库存: ${inventoryItem.quantity}, 需要: ${newQuantity}`)
        }

        inventoryItem = await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            quantity: Math.max(0, updatedQuantity),
            updatedAt: new Date()
          }
        })
      } else if (isInbound) {
        // 创建新库存记录（仅限入库操作）
        inventoryItem = await tx.inventoryItem.create({
          data: {
            productId: data.productId,
            warehouseId: data.warehouseId,
            quantity: newQuantity,
            minQuantity: 0
          }
        })
      } else {
        throw new Error(`产品 ${product.name} 在指定仓库中无库存记录`)
      }

      // 创建库存事务记录
      const transaction = await tx.inventoryTransaction.create({
        data: {
          type: data.type,
          productId: data.productId,
          targetWarehouseId: data.warehouseId,
          quantity: newQuantity,
          notes: data.notes || `${data.type} - ${product.name}`,
          referenceId: data.referenceId,
          referenceType: data.referenceType || "manual"
        }
      })

      // 更新产品成本（如果提供）
      if (data.unitCost && data.unitCost !== product.cost) {
        await tx.product.update({
          where: { id: data.productId },
          data: {
            cost: data.unitCost,
            updatedAt: new Date()
          }
        })
      }

      return {
        transaction,
        inventoryItem,
        product
      }
    })

  } catch (error) {
    console.error("❌ 创建库存事务失败:", error)
    throw error
  }
}

// 批量更新库存
export async function batchUpdateInventory(data: BatchInventoryUpdate): Promise<InventorySyncResult> {
  const startTime = Date.now()
  
  try {
    console.log(`📦 批量更新库存: ${data.items.length} 个项目`)

    const result: InventorySyncResult = {
      success: true,
      totalItems: data.items.length,
      successItems: 0,
      failedItems: 0,
      transactions: [],
      errors: []
    }

    // 分批处理，避免事务过大
    const batchSize = 10
    for (let i = 0; i < data.items.length; i += batchSize) {
      const batch = data.items.slice(i, i + batchSize)
      
      await prisma.$transaction(async (tx) => {
        for (const item of batch) {
          try {
            // 获取产品和仓库信息
            const [product, warehouse] = await Promise.all([
              tx.product.findUnique({
                where: { id: item.productId },
                select: { id: true, name: true, cost: true }
              }),
              tx.warehouse.findUnique({
                where: { id: item.warehouseId },
                select: { id: true, name: true }
              })
            ])

            if (!product) {
              result.errors.push({
                productId: item.productId,
                productName: "未知产品",
                error: "产品不存在"
              })
              result.failedItems++
              continue
            }

            if (!warehouse) {
              result.errors.push({
                productId: item.productId,
                productName: product.name,
                error: "仓库不存在"
              })
              result.failedItems++
              continue
            }

            // 创建库存事务
            const transactionResult = await createInventoryTransaction({
              type: data.operationType,
              productId: item.productId,
              warehouseId: item.warehouseId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              notes: item.notes || data.notes,
              referenceId: data.referenceId,
              referenceType: data.referenceType,
              operatorId: data.operatorId
            })

            result.transactions.push({
              id: transactionResult.transaction.id,
              productId: item.productId,
              productName: product.name,
              quantity: item.quantity,
              warehouseId: item.warehouseId,
              warehouseName: warehouse.name
            })

            result.successItems++

          } catch (error) {
            console.error(`❌ 处理库存项目失败: 产品ID ${item.productId}`, error)
            
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { name: true }
            })

            result.errors.push({
              productId: item.productId,
              productName: product?.name || "未知产品",
              error: error instanceof Error ? error.message : "未知错误"
            })
            result.failedItems++
          }
        }
      })
    }

    result.success = result.failedItems === 0

    const responseTime = Date.now() - startTime
    console.log(`✅ 批量库存更新完成，耗时: ${responseTime}ms`)
    console.log(`📊 成功: ${result.successItems}/${result.totalItems}, 失败: ${result.failedItems}`)

    return result

  } catch (error) {
    console.error("❌ 批量更新库存失败:", error)
    throw error
  }
}

// 获取库存状态
export async function getInventoryStatus(productId: number, warehouseId?: number) {
  try {
    const where: any = { productId }
    if (warehouseId) {
      where.warehouseId = warehouseId
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true, cost: true }
        },
        warehouse: {
          select: { id: true, name: true, location: true }
        }
      }
    })

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)

    return {
      productId,
      totalQuantity,
      warehouses: inventoryItems.map(item => ({
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        isLowStock: item.quantity <= item.minQuantity
      })),
      product: inventoryItems[0]?.product
    }

  } catch (error) {
    console.error("❌ 获取库存状态失败:", error)
    throw error
  }
}

// 检查库存可用性
export async function checkInventoryAvailability(
  items: Array<{ productId: number; quantity: number; warehouseId?: number }>
): Promise<Array<{ productId: number; available: boolean; currentStock: number; required: number }>> {
  try {
    const results = []

    for (const item of items) {
      const where: any = { productId: item.productId }
      if (item.warehouseId) {
        where.warehouseId = item.warehouseId
      }

      const inventoryItems = await prisma.inventoryItem.findMany({
        where,
        select: { quantity: true }
      })

      const totalStock = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0)
      const available = totalStock >= item.quantity

      results.push({
        productId: item.productId,
        available,
        currentStock: totalStock,
        required: item.quantity
      })
    }

    return results

  } catch (error) {
    console.error("❌ 检查库存可用性失败:", error)
    throw error
  }
}

// 获取库存事务历史
export async function getInventoryTransactionHistory(
  productId?: number,
  warehouseId?: number,
  referenceId?: number,
  limit: number = 50
) {
  try {
    const where: any = {}
    
    if (productId) where.productId = productId
    if (warehouseId) where.targetWarehouseId = warehouseId
    if (referenceId) where.referenceId = referenceId

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        },
        targetWarehouse: {
          select: { id: true, name: true, location: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    })

    return transactions

  } catch (error) {
    console.error("❌ 获取库存事务历史失败:", error)
    throw error
  }
}
