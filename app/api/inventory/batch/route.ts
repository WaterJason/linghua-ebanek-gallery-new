import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// 批量更新库存记录
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { inventoryIds, actionType, quantity, notes, warehouseId } = body

    if (!inventoryIds || !Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return NextResponse.json({ error: "请选择要更新的库存记录" }, { status: 400 })
    }

    if (!actionType) {
      return NextResponse.json({ error: "请指定操作类型" }, { status: 400 })
    }

    const results = []
    const errors = []

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      for (const id of inventoryIds) {
        try {
          const inventoryId = parseInt(id)
          if (isNaN(inventoryId)) {
            errors.push({ id, error: "无效的库存ID" })
            continue
          }

          // 获取当前库存记录
          const existingInventory = await tx.inventoryItem.findUnique({
            where: { id: inventoryId },
            include: {
              product: { select: { name: true } },
              warehouse: { select: { name: true } }
            }
          })

          if (!existingInventory) {
            errors.push({ id: inventoryId, error: "库存记录不存在" })
            continue
          }

          let updateData: any = {}
          let transactionType = ""
          let transactionQuantity = 0

          switch (actionType) {
            case "set_quantity":
              if (quantity === undefined || quantity < 0) {
                errors.push({ id: inventoryId, error: "无效的库存数量" })
                continue
              }
              updateData.quantity = parseInt(quantity)
              transactionType = quantity > existingInventory.quantity ? "adjustment_in" : "adjustment_out"
              transactionQuantity = Math.abs(quantity - existingInventory.quantity)
              break

            case "add_quantity":
              if (quantity === undefined || quantity <= 0) {
                errors.push({ id: inventoryId, error: "增加数量必须大于0" })
                continue
              }
              updateData.quantity = existingInventory.quantity + parseInt(quantity)
              transactionType = "adjustment_in"
              transactionQuantity = parseInt(quantity)
              break

            case "subtract_quantity":
              if (quantity === undefined || quantity <= 0) {
                errors.push({ id: inventoryId, error: "减少数量必须大于0" })
                continue
              }
              if (existingInventory.quantity < quantity) {
                errors.push({ id: inventoryId, error: "库存不足，无法减少指定数量" })
                continue
              }
              updateData.quantity = existingInventory.quantity - parseInt(quantity)
              transactionType = "adjustment_out"
              transactionQuantity = parseInt(quantity)
              break

            case "set_min_quantity":
              if (quantity === undefined || quantity < 0) {
                errors.push({ id: inventoryId, error: "无效的最小库存量" })
                continue
              }
              updateData.minQuantity = parseInt(quantity)
              break

            default:
              errors.push({ id: inventoryId, error: "不支持的操作类型" })
              continue
          }

          // 更新库存记录
          const updatedInventory = await tx.inventoryItem.update({
            where: { id: inventoryId },
            data: {
              ...updateData,
              updatedAt: new Date()
            },
            include: {
              product: { select: { name: true } },
              warehouse: { select: { name: true } }
            }
          })

          // 记录库存交易（仅对数量变更）
          if (transactionType && transactionQuantity > 0) {
            await tx.inventoryTransaction.create({
              data: {
                type: transactionType,
                productId: existingInventory.productId,
                quantity: transactionQuantity,
                notes: notes || `批量${actionType}操作`,
                ...(transactionType.includes("in") && { targetWarehouseId: existingInventory.warehouseId }),
                ...(transactionType.includes("out") && { sourceWarehouseId: existingInventory.warehouseId }),
                referenceType: "batch_operation"
              }
            })
          }

          results.push({
            id: inventoryId,
            productName: updatedInventory.product.name,
            warehouseName: updatedInventory.warehouse.name,
            oldQuantity: existingInventory.quantity,
            newQuantity: updatedInventory.quantity,
            action: actionType
          })

        } catch (error) {
          console.error(`批量更新库存记录 ${id} 失败:`, error)
          errors.push({ 
            id, 
            error: error instanceof Error ? error.message : "更新失败" 
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `成功更新 ${results.length} 条记录`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: inventoryIds.length,
        successful: results.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error("批量更新库存记录失败:", error)
    return NextResponse.json({ error: "批量更新库存记录失败" }, { status: 500 })
  }
}

// 批量删除库存记录
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "请选择要删除的库存记录" }, { status: 400 })
    }

    const results = []
    const errors = []

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        try {
          const inventoryId = parseInt(id)
          if (isNaN(inventoryId)) {
            errors.push({ id, error: "无效的库存ID" })
            continue
          }

          // 获取库存记录信息
          const existingInventory = await tx.inventoryItem.findUnique({
            where: { id: inventoryId },
            include: {
              product: { select: { name: true } },
              warehouse: { select: { name: true } }
            }
          })

          if (!existingInventory) {
            errors.push({ id: inventoryId, error: "库存记录不存在" })
            continue
          }

          // 删除库存记录
          await tx.inventoryItem.delete({
            where: { id: inventoryId }
          })

          // 记录删除操作
          await tx.inventoryTransaction.create({
            data: {
              type: "delete",
              productId: existingInventory.productId,
              quantity: existingInventory.quantity,
              notes: "批量删除库存记录",
              sourceWarehouseId: existingInventory.warehouseId,
              referenceType: "batch_operation"
            }
          })

          results.push({
            id: inventoryId,
            productName: existingInventory.product.name,
            warehouseName: existingInventory.warehouse.name,
            quantity: existingInventory.quantity
          })

        } catch (error) {
          console.error(`批量删除库存记录 ${id} 失败:`, error)
          errors.push({ 
            id, 
            error: error instanceof Error ? error.message : "删除失败" 
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `成功删除 ${results.length} 条记录`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: ids.length,
        successful: results.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error("批量删除库存记录失败:", error)
    return NextResponse.json({ error: "批量删除库存记录失败" }, { status: 500 })
  }
}
