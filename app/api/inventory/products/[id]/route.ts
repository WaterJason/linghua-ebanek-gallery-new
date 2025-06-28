import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import {
  syncSalePriceToSalesModule,
  syncCostPriceToPurchaseModule,
  syncInventoryToProductModule
} from "@/lib/services/inventory-sync-service"

/**
 * PATCH /api/inventory/products/[id] - 更新单个产品库存字段
 * 支持双击编辑功能的实时更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()

  try {
    const inventoryId = parseInt(params.id)
    const body = await request.json()
    const { field, value, warehouseId, timestamp } = body

    if (!field || value === undefined) {
      return NextResponse.json({
        error: "缺少必要参数：field 和 value"
      }, { status: 400 })
    }

    // 验证字段类型
    const allowedFields = ['quantity', 'minQuantity', 'salePrice', 'costPrice']
    if (!allowedFields.includes(field)) {
      return NextResponse.json({
        error: `不支持的字段: ${field}`
      }, { status: 400 })
    }

    // 验证数值
    const numericValue = parseFloat(value)
    if (isNaN(numericValue) || numericValue < 0) {
      return NextResponse.json({
        error: "数值必须为非负数"
      }, { status: 400 })
    }

    // 并发控制：检查时间戳防止冲突
    if (timestamp) {
      const requestAge = Date.now() - timestamp
      if (requestAge > 30000) { // 30秒超时
        return NextResponse.json({
          error: "请求超时，请刷新页面后重试"
        }, { status: 408 })
      }
    }

    // 查找库存记录
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId },
      include: {
        product: true,
        warehouse: true
      }
    })

    if (!inventoryItem) {
      return NextResponse.json({ error: "库存记录不存在" }, { status: 404 })
    }

    // 检查记录是否被其他用户修改（乐观锁）
    if (timestamp && inventoryItem.updatedAt.getTime() > timestamp - 1000) {
      return NextResponse.json({
        error: "记录已被其他用户修改，请刷新后重试",
        code: "CONFLICT"
      }, { status: 409 })
    }

    // 记录更新前的值
    const oldValue = inventoryItem[field as keyof typeof inventoryItem] as number || 0

    // 根据字段类型执行不同的更新逻辑
    if (field === 'quantity' || field === 'minQuantity') {
      // 更新库存相关字段
      await prisma.inventoryItem.update({
        where: { id: inventoryId },
        data: {
          [field]: Math.floor(numericValue), // 库存数量使用整数
          updatedAt: new Date()
        }
      })

      // 如果是库存数量变更，记录库存交易
      if (field === 'quantity') {
        const quantityChange = Math.floor(numericValue) - oldValue

        if (quantityChange !== 0) {
          await prisma.inventoryTransaction.create({
            data: {
              productId: inventoryItem.productId,
              quantity: quantityChange,
              type: 'adjustment',
              notes: `手动调整库存: ${oldValue} → ${Math.floor(numericValue)}`,
              targetWarehouseId: inventoryItem.warehouseId,
              referenceType: 'manual_edit'
            }
          })
        }
      }

    } else if (field === 'salePrice') {
      // 更新产品销售价格，同时同步到销售模块
      await prisma.product.update({
        where: { id: inventoryItem.productId },
        data: {
          price: numericValue,
          updatedAt: new Date()
        }
      })

      // 记录价格变更日志
      console.log(`产品 ${inventoryItem.product.name} 销售价格更新: ${oldValue} → ${numericValue}`)

    } else if (field === 'costPrice') {
      // 成本价格更新 - 由于Product表中没有costPrice字段，
      // 这里可以考虑添加到产品表或创建单独的成本价格表
      // 暂时记录到库存项的notes中
      const currentNotes = inventoryItem.notes || ''
      const costPriceNote = `成本价格: ¥${numericValue.toFixed(2)}`

      // 更新或添加成本价格信息到notes
      const updatedNotes = currentNotes.includes('成本价格:')
        ? currentNotes.replace(/成本价格: ¥[\d.]+/, costPriceNote)
        : currentNotes ? `${currentNotes}; ${costPriceNote}` : costPriceNote

      await prisma.inventoryItem.update({
        where: { id: inventoryId },
        data: {
          notes: updatedNotes,
          updatedAt: new Date()
        }
      })

      console.log(`产品 ${inventoryItem.product.name} 成本价格更新: ${oldValue} → ${numericValue}`)
    }

    // 获取更新后的数据
    const updatedItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId },
      include: {
        product: {
          include: {
            productCategory: true
          }
        },
        warehouse: true
      }
    })

    if (!updatedItem) {
      throw new Error("更新后无法获取数据")
    }

    // 计算库存状态
    const minQuantity = updatedItem.minQuantity || 10
    let status: 'sufficient' | 'low' | 'out' = 'sufficient'
    if (updatedItem.quantity === 0) {
      status = 'out'
    } else if (updatedItem.quantity < minQuantity) {
      status = 'low'
    }

    // 返回更新后的数据
    const responseData = {
      id: updatedItem.id,
      productId: updatedItem.product.id,
      productName: updatedItem.product.name,
      productImage: updatedItem.product.imageUrl,
      category: updatedItem.product.productCategory?.name || updatedItem.product.category || '未分类',
      sku: updatedItem.product.barcode,
      barcode: updatedItem.product.barcode,
      warehouseId: updatedItem.warehouseId,
      warehouseName: updatedItem.warehouse.name,
      quantity: updatedItem.quantity,
      minQuantity: updatedItem.minQuantity || 0,
      salePrice: updatedItem.product.price,
      costPrice: extractCostPriceFromNotes(updatedItem.notes),
      lastUpdated: updatedItem.updatedAt.toISOString(),
      status,
      updatedField: field,
      oldValue,
      newValue: numericValue
    }

    const responseTime = Date.now() - startTime

    // 性能监控：记录慢查询
    if (responseTime > 100) {
      console.warn(`慢查询警告: 库存更新耗时 ${responseTime}ms, 产品ID: ${inventoryItem.productId}`)
    }

    // 执行数据同步到相关模块
    let syncStatus = "completed"
    try {
      if (field === 'quantity') {
        console.log(`🔄 [PATCH /api/inventory/products] 同步库存数量到产品模块`)
        await syncInventoryToProductModule(updatedItem.productId, numericValue, updatedItem.warehouseId)
      } else if (field === 'salePrice') {
        console.log(`🔄 [PATCH /api/inventory/products] 同步销售价格到销售模块`)
        await syncSalePriceToSalesModule(updatedItem.productId, numericValue)
      } else if (field === 'costPrice') {
        console.log(`🔄 [PATCH /api/inventory/products] 同步成本价格到采购模块`)
        await syncCostPriceToPurchaseModule(updatedItem.productId, numericValue)
      }
      console.log(`✅ [PATCH /api/inventory/products] 数据同步完成`)
    } catch (syncError) {
      console.warn('⚠️ [PATCH /api/inventory/products] 数据同步警告:', syncError)
      syncStatus = "warning"
      // 同步失败不影响主要功能，只记录警告
    }

    return NextResponse.json({
      success: true,
      message: `${getFieldLabel(field)}更新成功`,
      data: responseData,
      performance: {
        responseTime,
        timestamp: Date.now()
      },
      syncStatus
    })

  } catch (error) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json({
      error: "更新失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}

/**
 * 从notes中提取成本价格
 */
function extractCostPriceFromNotes(notes: string | null): number {
  if (!notes) return 0

  const match = notes.match(/成本价格: ¥([\d.]+)/)
  return match ? parseFloat(match[1]) : 0
}

/**
 * 获取字段的中文标签
 */
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    quantity: '库存数量',
    minQuantity: '最低库存',
    salePrice: '销售价格',
    costPrice: '成本价格'
  }
  return labels[field] || field
}
