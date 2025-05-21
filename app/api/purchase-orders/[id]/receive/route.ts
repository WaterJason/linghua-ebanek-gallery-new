import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

// 采购订单入库
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = Number(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.warehouseId) {
      return NextResponse.json({ error: "仓库为必填项" }, { status: 400 })
    }

    // 获取采购订单信息
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: "采购订单不存在" }, { status: 404 })
    }

    // 检查仓库是否存在
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: Number(data.warehouseId) },
    })

    if (!warehouse) {
      return NextResponse.json({ error: "仓库不存在" }, { status: 404 })
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 更新采购订单状态
      const updatedPurchaseOrder = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: "received",
        },
      })

      // 处理每个订单项
      for (const item of data.items) {
        const orderItem = purchaseOrder.items.find(i => i.id === Number(item.id))
        if (!orderItem) continue

        // 计算本次入库数量
        const receiveQuantity = Number(item.receiveQuantity || 0)
        if (receiveQuantity <= 0) continue

        // 更新订单项的已收货数量
        await tx.purchaseOrderItem.update({
          where: { id: orderItem.id },
          data: {
            receivedQuantity: orderItem.receivedQuantity + receiveQuantity,
          },
        })

        // 查找库存
        const inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            warehouseId: Number(data.warehouseId),
            productId: orderItem.productId,
          },
        })

        // 更新库存
        if (inventoryItem) {
          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: {
              quantity: inventoryItem.quantity + receiveQuantity,
            },
          })
        } else {
          await tx.inventoryItem.create({
            data: {
              warehouseId: Number(data.warehouseId),
              productId: orderItem.productId,
              quantity: receiveQuantity,
            },
          })
        }

        // 记录库存交易
        await tx.inventoryTransaction.create({
          data: {
            type: "in",
            targetWarehouseId: Number(data.warehouseId),
            productId: orderItem.productId,
            quantity: receiveQuantity,
            notes: `采购入库: ${purchaseOrder.orderNumber}`,
            referenceId: purchaseOrder.id,
            referenceType: "purchase",
          },
        })
      }

      return updatedPurchaseOrder
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("采购订单入库失败:", error)
    return NextResponse.json({ error: error.message || "采购订单入库失败" }, { status: 500 })
  }
}
