import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// 获取单个库存记录
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的库存ID" }, { status: 400 })
    }

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            imageUrl: true,
            material: true,
            unit: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true
          }
        }
      }
    })

    if (!inventoryItem) {
      return NextResponse.json({ error: "库存记录不存在" }, { status: 404 })
    }

    return NextResponse.json(inventoryItem)
  } catch (error) {
    console.error("获取库存记录失败:", error)
    return NextResponse.json({ error: "获取库存记录失败" }, { status: 500 })
  }
}

// 更新单个库存记录
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的库存ID" }, { status: 400 })
    }

    const body = await request.json()
    const { quantity, minQuantity, notes } = body

    // 验证数据
    if (quantity !== undefined && (quantity < 0 || !Number.isInteger(quantity))) {
      return NextResponse.json({ error: "库存数量必须是非负整数" }, { status: 400 })
    }

    if (minQuantity !== undefined && (minQuantity < 0 || !Number.isInteger(minQuantity))) {
      return NextResponse.json({ error: "最小库存量必须是非负整数" }, { status: 400 })
    }

    // 检查库存记录是否存在
    const existingInventory = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        product: { select: { name: true } },
        warehouse: { select: { name: true } }
      }
    })

    if (!existingInventory) {
      return NextResponse.json({ error: "库存记录不存在" }, { status: 404 })
    }

    const oldQuantity = existingInventory.quantity

    // 更新库存记录
    const updatedInventory = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(minQuantity !== undefined && { minQuantity }),
        updatedAt: new Date()
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            imageUrl: true,
            material: true,
            unit: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            type: true,
            location: true
          }
        }
      }
    })

    // 如果数量发生变化，记录库存交易
    if (quantity !== undefined && quantity !== oldQuantity) {
      await prisma.inventoryTransaction.create({
        data: {
          type: quantity > oldQuantity ? "adjustment_in" : "adjustment_out",
          productId: existingInventory.productId,
          quantity: Math.abs(quantity - oldQuantity),
          notes: notes || "手动调整库存",
          targetWarehouseId: existingInventory.warehouseId,
          referenceType: "manual"
        }
      })
    }

    return NextResponse.json(updatedInventory)
  } catch (error) {
    console.error("更新库存记录失败:", error)
    return NextResponse.json({ error: "更新库存记录失败" }, { status: 500 })
  }
}

// 删除单个库存记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的库存ID" }, { status: 400 })
    }

    // 检查库存记录是否存在
    const existingInventory = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        product: { select: { name: true } },
        warehouse: { select: { name: true } }
      }
    })

    if (!existingInventory) {
      return NextResponse.json({ error: "库存记录不存在" }, { status: 404 })
    }

    // 删除库存记录
    await prisma.inventoryItem.delete({
      where: { id }
    })

    // 记录删除操作
    await prisma.inventoryTransaction.create({
      data: {
        type: "delete",
        productId: existingInventory.productId,
        quantity: existingInventory.quantity,
        notes: "删除库存记录",
        sourceWarehouseId: existingInventory.warehouseId,
        referenceType: "manual"
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "库存记录已删除",
      deletedItem: {
        id: existingInventory.id,
        productName: existingInventory.product.name,
        warehouseName: existingInventory.warehouse.name,
        quantity: existingInventory.quantity
      }
    })
  } catch (error) {
    console.error("删除库存记录失败:", error)
    return NextResponse.json({ error: "删除库存记录失败" }, { status: 500 })
  }
}
