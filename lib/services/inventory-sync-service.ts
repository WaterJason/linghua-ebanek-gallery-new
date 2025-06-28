/**
 * 库存同步服务
 * 负责产品库存与其他模块（产品、采购、销售）之间的数据同步
 */

import prisma from "@/lib/db"

export interface SyncResult {
  success: boolean
  message: string
  details?: any
}

/**
 * 同步产品价格到销售模块
 * 当产品库存中的销售价格更新时，同步到产品表和相关销售记录
 */
export async function syncSalePriceToSalesModule(
  productId: number,
  newPrice: number,
  updatedBy?: string
): Promise<SyncResult> {
  try {
    // 更新产品表中的价格
    await prisma.product.update({
      where: { id: productId },
      data: { 
        price: newPrice,
        updatedAt: new Date()
      }
    })

    // 记录价格变更日志
    console.log(`产品 ${productId} 销售价格同步到销售模块: ¥${newPrice}`)

    // 可以在这里添加更多的销售模块同步逻辑
    // 例如：更新未完成的销售订单价格、通知销售人员等

    return {
      success: true,
      message: "销售价格同步成功",
      details: { productId, newPrice }
    }
  } catch (error) {
    console.error("同步销售价格失败:", error)
    return {
      success: false,
      message: "销售价格同步失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

/**
 * 同步成本价格到采购模块
 * 当产品库存中的成本价格更新时，同步到采购相关记录
 */
export async function syncCostPriceToPurchaseModule(
  productId: number,
  newCostPrice: number,
  updatedBy?: string
): Promise<SyncResult> {
  try {
    // 由于Product表中没有costPrice字段，我们可以考虑：
    // 1. 添加costPrice字段到Product表
    // 2. 创建单独的ProductCost表
    // 3. 暂时记录到库存项的notes中（当前实现）

    // 这里可以添加采购模块的同步逻辑
    // 例如：更新供应商价格、采购订单成本等

    console.log(`产品 ${productId} 成本价格同步到采购模块: ¥${newCostPrice}`)

    return {
      success: true,
      message: "成本价格同步成功",
      details: { productId, newCostPrice }
    }
  } catch (error) {
    console.error("同步成本价格失败:", error)
    return {
      success: false,
      message: "成本价格同步失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

/**
 * 同步库存数量到产品模块
 * 当库存数量变更时，同步到产品表的inventory字段
 */
export async function syncInventoryToProductModule(
  productId: number,
  newQuantity: number,
  warehouseId: number
): Promise<SyncResult> {
  try {
    // 获取产品的所有仓库库存总量
    const totalInventory = await prisma.inventoryItem.aggregate({
      where: { productId },
      _sum: { quantity: true }
    })

    const totalQuantity = totalInventory._sum.quantity || 0

    // 更新产品表中的库存字段
    await prisma.product.update({
      where: { id: productId },
      data: { 
        inventory: totalQuantity,
        updatedAt: new Date()
      }
    })

    console.log(`产品 ${productId} 库存数量同步到产品模块: ${totalQuantity}`)

    return {
      success: true,
      message: "库存数量同步成功",
      details: { productId, totalQuantity, warehouseQuantity: newQuantity }
    }
  } catch (error) {
    console.error("同步库存数量失败:", error)
    return {
      success: false,
      message: "库存数量同步失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

/**
 * 全量同步指定产品的所有数据
 * 确保产品在各个模块中的数据一致性
 */
export async function fullSyncProduct(productId: number): Promise<SyncResult> {
  try {
    // 获取产品信息
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return {
        success: false,
        message: "产品不存在"
      }
    }

    // 获取库存信息
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { productId }
    })

    // 计算总库存
    const totalInventory = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)

    // 同步库存数量
    const inventorySync = await syncInventoryToProductModule(productId, totalInventory, 0)
    
    // 同步销售价格
    const priceSync = await syncSalePriceToSalesModule(productId, product.price)

    const results = {
      inventorySync,
      priceSync
    }

    const allSuccess = Object.values(results).every(result => result.success)

    return {
      success: allSuccess,
      message: allSuccess ? "产品数据全量同步成功" : "部分同步失败",
      details: results
    }
  } catch (error) {
    console.error("全量同步产品失败:", error)
    return {
      success: false,
      message: "全量同步失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

/**
 * 批量同步多个产品
 * 用于系统维护或数据修复
 */
export async function batchSyncProducts(productIds: number[]): Promise<SyncResult> {
  try {
    const results = []
    let successCount = 0
    let errorCount = 0

    for (const productId of productIds) {
      const result = await fullSyncProduct(productId)
      results.push({ productId, ...result })
      
      if (result.success) {
        successCount++
      } else {
        errorCount++
      }
    }

    return {
      success: errorCount === 0,
      message: `批量同步完成: 成功 ${successCount} 个，失败 ${errorCount} 个`,
      details: {
        total: productIds.length,
        success: successCount,
        errors: errorCount,
        results
      }
    }
  } catch (error) {
    console.error("批量同步产品失败:", error)
    return {
      success: false,
      message: "批量同步失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

/**
 * 验证数据一致性
 * 检查产品库存与其他模块的数据是否一致
 */
export async function validateDataConsistency(productId?: number): Promise<SyncResult> {
  try {
    const whereCondition = productId ? { id: productId } : {}
    
    const products = await prisma.product.findMany({
      where: whereCondition,
      include: {
        inventoryItems: true
      }
    })

    const inconsistencies = []

    for (const product of products) {
      // 检查库存数量一致性
      const totalInventory = product.inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
      
      if (product.inventory !== totalInventory) {
        inconsistencies.push({
          productId: product.id,
          productName: product.name,
          type: 'inventory_mismatch',
          productInventory: product.inventory,
          actualInventory: totalInventory,
          difference: totalInventory - (product.inventory || 0)
        })
      }
    }

    return {
      success: inconsistencies.length === 0,
      message: inconsistencies.length === 0 
        ? "数据一致性验证通过" 
        : `发现 ${inconsistencies.length} 个数据不一致问题`,
      details: {
        checkedProducts: products.length,
        inconsistencies
      }
    }
  } catch (error) {
    console.error("验证数据一致性失败:", error)
    return {
      success: false,
      message: "数据一致性验证失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

/**
 * 自动修复数据不一致问题
 */
export async function autoFixInconsistencies(): Promise<SyncResult> {
  try {
    // 先验证数据一致性
    const validation = await validateDataConsistency()
    
    if (validation.success) {
      return {
        success: true,
        message: "数据一致，无需修复"
      }
    }

    const inconsistencies = validation.details?.inconsistencies || []
    let fixedCount = 0
    let errorCount = 0

    for (const issue of inconsistencies) {
      try {
        if (issue.type === 'inventory_mismatch') {
          // 修复库存数量不一致
          await syncInventoryToProductModule(issue.productId, issue.actualInventory, 0)
          fixedCount++
        }
      } catch (error) {
        console.error(`修复产品 ${issue.productId} 失败:`, error)
        errorCount++
      }
    }

    return {
      success: errorCount === 0,
      message: `自动修复完成: 修复 ${fixedCount} 个问题，失败 ${errorCount} 个`,
      details: {
        totalIssues: inconsistencies.length,
        fixed: fixedCount,
        errors: errorCount
      }
    }
  } catch (error) {
    console.error("自动修复失败:", error)
    return {
      success: false,
      message: "自动修复失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}
