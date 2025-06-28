import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import {
  syncSalePriceToSalesModule,
  syncCostPriceToPurchaseModule,
  syncInventoryToProductModule,
  fullSyncProduct,
  batchSyncProducts,
  validateDataConsistency,
  autoFixInconsistencies
} from "@/lib/services/inventory-sync-service"

// 同步产品库存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productId, productIds, data } = body

    // 如果没有action参数，使用原有的产品库存同步逻辑
    if (!action) {
      if (!productId) {
        return NextResponse.json({ error: "缺少产品ID" }, { status: 400 })
      }
      return await handleLegacyProductSync(productId)
    }

    // 新的同步操作
    let result

    switch (action) {
      case 'sync_sale_price':
        if (!productId || !data?.price) {
          return NextResponse.json({ error: "缺少产品ID或价格" }, { status: 400 })
        }
        result = await syncSalePriceToSalesModule(productId, data.price, data.updatedBy)
        break

      case 'sync_cost_price':
        if (!productId || !data?.costPrice) {
          return NextResponse.json({ error: "缺少产品ID或成本价格" }, { status: 400 })
        }
        result = await syncCostPriceToPurchaseModule(productId, data.costPrice, data.updatedBy)
        break

      case 'sync_inventory':
        if (!productId || data?.quantity === undefined || !data?.warehouseId) {
          return NextResponse.json({ error: "缺少产品ID、数量或仓库ID" }, { status: 400 })
        }
        result = await syncInventoryToProductModule(productId, data.quantity, data.warehouseId)
        break

      case 'full_sync':
        if (!productId) {
          return NextResponse.json({ error: "缺少产品ID" }, { status: 400 })
        }
        result = await fullSyncProduct(productId)
        break

      case 'batch_sync':
        if (!productIds || !Array.isArray(productIds)) {
          return NextResponse.json({ error: "缺少产品ID列表" }, { status: 400 })
        }
        result = await batchSyncProducts(productIds)
        break

      case 'validate_consistency':
        result = await validateDataConsistency(productId)
        break

      case 'auto_fix':
        result = await autoFixInconsistencies()
        break

      default:
        return NextResponse.json({ error: "不支持的操作类型" }, { status: 400 })
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.details,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("数据同步操作失败:", error)
    return NextResponse.json({
      error: "同步操作失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

// 原有的产品库存同步逻辑
async function handleLegacyProductSync(productId: string) {

  try {
    // 获取产品信息
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      select: {
        id: true,
        name: true,
        inventory: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 })
    }

    // 查找该产品的库存记录
    const existingInventory = await prisma.inventoryItem.findFirst({
      where: { productId: product.id },
      include: {
        warehouse: { select: { name: true } }
      }
    })

    if (existingInventory) {
      // 更新现有库存记录
      const oldQuantity = existingInventory.quantity
      const newQuantity = product.inventory || 0

      if (oldQuantity !== newQuantity) {
        await prisma.$transaction(async (tx) => {
          // 更新库存记录
          await tx.inventoryItem.update({
            where: { id: existingInventory.id },
            data: {
              quantity: newQuantity,
              updatedAt: new Date()
            }
          })

          // 记录库存变更
          await tx.inventoryTransaction.create({
            data: {
              productId: product.id,
              quantity: Math.abs(newQuantity - oldQuantity),
              type: newQuantity > oldQuantity ? "sync_in" : "sync_out",
              notes: `从产品管理模块同步库存`,
              ...(newQuantity > oldQuantity && { targetWarehouseId: existingInventory.warehouseId }),
              ...(newQuantity < oldQuantity && { sourceWarehouseId: existingInventory.warehouseId }),
              referenceType: "sync"
            }
          })
        })

        return NextResponse.json({
          success: true,
          message: "库存数据已同步更新",
          sync: {
            productName: product.name,
            warehouseName: existingInventory.warehouse.name,
            oldQuantity,
            newQuantity,
            change: newQuantity - oldQuantity
          }
        })
      } else {
        return NextResponse.json({
          success: true,
          message: "库存数据已是最新，无需同步",
          sync: {
            productName: product.name,
            warehouseName: existingInventory.warehouse.name,
            quantity: newQuantity
          }
        })
      }
    } else {
      // 创建新的库存记录
      // 查找默认仓库
      const defaultWarehouse = await prisma.warehouse.findFirst({
        where: { isDefault: true }
      })

      if (!defaultWarehouse) {
        // 查找任意一个仓库
        const anyWarehouse = await prisma.warehouse.findFirst()

        if (!anyWarehouse) {
          return NextResponse.json({
            error: "没有找到任何仓库，无法创建库存记录"
          }, { status: 400 })
        }

        await prisma.$transaction(async (tx) => {
          // 创建新的库存记录
          await tx.inventoryItem.create({
            data: {
              productId: product.id,
              quantity: product.inventory || 0,
              warehouseId: anyWarehouse.id
            }
          })

          // 记录库存变更
          await tx.inventoryTransaction.create({
            data: {
              productId: product.id,
              quantity: product.inventory || 0,
              type: "sync_initial",
              notes: `从产品管理模块初始化库存（使用仓库：${anyWarehouse.name}）`,
              targetWarehouseId: anyWarehouse.id,
              referenceType: "sync"
            }
          })
        })

        return NextResponse.json({
          success: true,
          message: `已创建新的库存记录（使用仓库：${anyWarehouse.name}）`,
          sync: {
            productName: product.name,
            warehouseName: anyWarehouse.name,
            quantity: product.inventory || 0,
            action: "created"
          }
        })
      }

      await prisma.$transaction(async (tx) => {
        // 创建新的库存记录
        await tx.inventoryItem.create({
          data: {
            productId: product.id,
            quantity: product.inventory || 0,
            warehouseId: defaultWarehouse.id
          }
        })

        // 记录库存变更
        await tx.inventoryTransaction.create({
          data: {
            productId: product.id,
            quantity: product.inventory || 0,
            type: "sync_initial",
            notes: `从产品管理模块初始化库存`,
            targetWarehouseId: defaultWarehouse.id,
            referenceType: "sync"
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: "已创建新的库存记录",
        sync: {
          productName: product.name,
          warehouseName: defaultWarehouse.name,
          quantity: product.inventory || 0,
          action: "created"
        }
      })
    }

  } catch (error) {
    console.error("同步产品库存失败:", error)
    return NextResponse.json({ error: "同步产品库存失败" }, { status: 500 })
  }
}

/**
 * GET /api/inventory/sync - 获取同步状态和统计信息
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'status'

    if (action === 'validate') {
      // 验证数据一致性
      const productId = searchParams.get('productId')
      const result = await validateDataConsistency(productId ? parseInt(productId) : undefined)

      return NextResponse.json({
        success: true,
        validation: result,
        timestamp: new Date().toISOString()
      })
    }

    // 默认返回同步状态
    return NextResponse.json({
      success: true,
      status: "ready",
      availableActions: [
        "sync_sale_price",
        "sync_cost_price",
        "sync_inventory",
        "full_sync",
        "batch_sync",
        "validate_consistency",
        "auto_fix"
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("获取同步状态失败:", error)
    return NextResponse.json({
      error: "获取状态失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
