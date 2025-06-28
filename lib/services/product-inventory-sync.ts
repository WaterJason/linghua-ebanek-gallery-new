/**
 * 产品与库存模块实时同步服务
 * 确保产品管理模块的所有变更立即同步到库存模块
 */

import prisma from "@/lib/db"

export interface ProductSyncResult {
  success: boolean
  message: string
  details?: any
  affectedInventoryItems?: number
}

/**
 * 产品创建后同步到库存模块
 * 为新产品在所有仓库中创建初始库存记录
 */
export async function syncNewProductToInventory(productId: number): Promise<ProductSyncResult> {
  try {
    console.log(`🔄 [ProductSync] 同步新产品到库存模块: ${productId}`)

    // 获取产品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        productCategory: true
      }
    })

    if (!product) {
      return {
        success: false,
        message: "产品不存在"
      }
    }

    // 获取所有仓库
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true }
    })

    if (warehouses.length === 0) {
      console.warn(`⚠️ [ProductSync] 没有找到活跃的仓库，跳过库存记录创建`)
      return {
        success: true,
        message: "产品同步成功，但没有活跃仓库",
        affectedInventoryItems: 0
      }
    }

    // 为每个仓库创建初始库存记录
    const inventoryItems = []
    for (const warehouse of warehouses) {
      // 检查是否已存在库存记录
      const existingItem = await prisma.inventoryItem.findFirst({
        where: {
          productId: product.id,
          warehouseId: warehouse.id
        }
      })

      if (!existingItem) {
        const inventoryItem = await prisma.inventoryItem.create({
          data: {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: product.inventory || 0, // 使用产品的初始库存
            minQuantity: 10, // 默认最低库存
            notes: `产品创建时自动生成 - ${new Date().toLocaleString()}`
          }
        })
        inventoryItems.push(inventoryItem)

        // 记录库存交易
        await prisma.inventoryTransaction.create({
          data: {
            productId: product.id,
            quantity: product.inventory || 0,
            type: 'initial',
            notes: `新产品初始库存 - ${product.name}`,
            targetWarehouseId: warehouse.id
          }
        })
      }
    }

    console.log(`✅ [ProductSync] 产品 ${product.name} 同步完成，创建了 ${inventoryItems.length} 个库存记录`)

    return {
      success: true,
      message: "新产品同步到库存模块成功",
      details: {
        productId: product.id,
        productName: product.name,
        warehousesCount: warehouses.length,
        createdInventoryItems: inventoryItems.length
      },
      affectedInventoryItems: inventoryItems.length
    }

  } catch (error) {
    console.error("❌ [ProductSync] 新产品同步失败:", error)
    return {
      success: false,
      message: "新产品同步失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

/**
 * 产品更新后同步到库存模块
 * 更新库存记录中的产品相关信息
 */
export async function syncProductUpdateToInventory(
  productId: number, 
  updatedFields: any
): Promise<ProductSyncResult> {
  try {
    console.log(`🔄 [ProductSync] 同步产品更新到库存模块: ${productId}`, updatedFields)

    // 获取产品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        productCategory: true
      }
    })

    if (!product) {
      return {
        success: false,
        message: "产品不存在"
      }
    }

    // 获取所有相关的库存记录
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { productId: product.id }
    })

    let affectedItems = 0

    // 如果产品价格发生变化，需要同步
    if (updatedFields.price !== undefined) {
      console.log(`🔄 [ProductSync] 同步产品价格变更: ${updatedFields.price}`)
      // 价格变更已在 inventory-sync-service.ts 中的 syncSalePriceToSalesModule 处理
    }

    // 如果产品库存发生变化，需要同步到库存记录
    if (updatedFields.inventory !== undefined) {
      console.log(`🔄 [ProductSync] 同步产品库存变更: ${updatedFields.inventory}`)
      
      // 如果只有一个仓库，直接更新该仓库的库存
      if (inventoryItems.length === 1) {
        const item = inventoryItems[0]
        const oldQuantity = item.quantity
        const newQuantity = parseInt(updatedFields.inventory) || 0
        
        if (oldQuantity !== newQuantity) {
          await prisma.inventoryItem.update({
            where: { id: item.id },
            data: { 
              quantity: newQuantity,
              notes: `${item.notes || ''}\n产品模块库存同步: ${oldQuantity} → ${newQuantity} (${new Date().toLocaleString()})`
            }
          })

          // 记录库存交易
          await prisma.inventoryTransaction.create({
            data: {
              productId: product.id,
              quantity: newQuantity - oldQuantity,
              type: 'adjustment',
              notes: `产品模块库存同步 - ${product.name}`,
              targetWarehouseId: item.warehouseId
            }
          })

          affectedItems++
        }
      } else if (inventoryItems.length > 1) {
        // 多个仓库的情况，需要重新分配库存
        console.log(`⚠️ [ProductSync] 产品在多个仓库中有库存，需要手动分配`)
      } else {
        // 没有库存记录，创建默认库存记录
        const defaultWarehouse = await prisma.warehouse.findFirst({
          where: { isActive: true }
        })
        
        if (defaultWarehouse) {
          await prisma.inventoryItem.create({
            data: {
              productId: product.id,
              warehouseId: defaultWarehouse.id,
              quantity: parseInt(updatedFields.inventory) || 0,
              minQuantity: 10,
              notes: `产品更新时自动创建 - ${new Date().toLocaleString()}`
            }
          })
          affectedItems++
        }
      }
    }

    // 如果产品分类发生变化，库存记录会自动通过关联获取最新信息
    if (updatedFields.categoryId !== undefined) {
      console.log(`🔄 [ProductSync] 产品分类已更新，库存记录将自动获取最新分类信息`)
    }

    console.log(`✅ [ProductSync] 产品 ${product.name} 更新同步完成，影响 ${affectedItems} 个库存记录`)

    return {
      success: true,
      message: "产品更新同步到库存模块成功",
      details: {
        productId: product.id,
        productName: product.name,
        updatedFields: Object.keys(updatedFields),
        inventoryItemsCount: inventoryItems.length
      },
      affectedInventoryItems: affectedItems
    }

  } catch (error) {
    console.error("❌ [ProductSync] 产品更新同步失败:", error)
    return {
      success: false,
      message: "产品更新同步失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

/**
 * 产品删除后从库存模块清理
 * 删除所有相关的库存记录和交易记录
 */
export async function syncProductDeleteToInventory(productId: number): Promise<ProductSyncResult> {
  try {
    console.log(`🔄 [ProductSync] 从库存模块清理已删除产品: ${productId}`)

    // 获取所有相关的库存记录
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { productId: productId },
      include: {
        warehouse: {
          select: { name: true }
        }
      }
    })

    if (inventoryItems.length === 0) {
      return {
        success: true,
        message: "产品删除同步完成，没有库存记录需要清理",
        affectedInventoryItems: 0
      }
    }

    // 记录删除前的库存信息
    const inventoryInfo = inventoryItems.map(item => ({
      warehouseName: item.warehouse.name,
      quantity: item.quantity
    }))

    // 删除库存交易记录
    await prisma.inventoryTransaction.deleteMany({
      where: { productId: productId }
    })

    // 删除库存记录
    await prisma.inventoryItem.deleteMany({
      where: { productId: productId }
    })

    console.log(`✅ [ProductSync] 产品 ${productId} 的库存数据清理完成，删除了 ${inventoryItems.length} 个库存记录`)

    return {
      success: true,
      message: "产品删除同步到库存模块成功",
      details: {
        productId: productId,
        deletedInventoryItems: inventoryItems.length,
        inventoryInfo: inventoryInfo
      },
      affectedInventoryItems: inventoryItems.length
    }

  } catch (error) {
    console.error("❌ [ProductSync] 产品删除同步失败:", error)
    return {
      success: false,
      message: "产品删除同步失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

/**
 * 批量同步产品到库存模块
 * 用于系统维护或数据修复
 */
export async function batchSyncProductsToInventory(productIds: number[]): Promise<ProductSyncResult> {
  try {
    console.log(`🔄 [ProductSync] 批量同步产品到库存模块: ${productIds.length} 个产品`)

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const productId of productIds) {
      try {
        const result = await syncNewProductToInventory(productId)
        results.push({ productId, ...result })
        
        if (result.success) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        console.error(`❌ [ProductSync] 产品 ${productId} 同步失败:`, error)
        results.push({
          productId,
          success: false,
          message: "同步失败",
          details: error instanceof Error ? error.message : "未知错误"
        })
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
    console.error("❌ [ProductSync] 批量同步失败:", error)
    return {
      success: false,
      message: "批量同步失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}

/**
 * 验证产品与库存数据一致性
 * 检查产品和库存记录之间的数据是否一致
 */
export async function validateProductInventoryConsistency(): Promise<ProductSyncResult> {
  try {
    console.log(`🔍 [ProductSync] 验证产品与库存数据一致性`)

    // 获取所有产品
    const products = await prisma.product.findMany({
      where: {
        type: {
          notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      }
    })

    const inconsistencies = []

    for (const product of products) {
      // 检查是否有库存记录
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: { productId: product.id }
      })

      // 计算总库存
      const totalInventory = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)

      // 检查产品表中的库存是否与实际库存一致
      if (product.inventory !== totalInventory) {
        inconsistencies.push({
          productId: product.id,
          productName: product.name,
          productInventory: product.inventory,
          actualInventory: totalInventory,
          difference: totalInventory - (product.inventory || 0),
          inventoryItemsCount: inventoryItems.length
        })
      }
    }

    return {
      success: inconsistencies.length === 0,
      message: inconsistencies.length === 0 
        ? "产品与库存数据一致性验证通过" 
        : `发现 ${inconsistencies.length} 个数据不一致问题`,
      details: {
        checkedProducts: products.length,
        inconsistencies
      }
    }

  } catch (error) {
    console.error("❌ [ProductSync] 数据一致性验证失败:", error)
    return {
      success: false,
      message: "数据一致性验证失败",
      details: error instanceof Error ? error.message : "未知错误"
    }
  }
}
