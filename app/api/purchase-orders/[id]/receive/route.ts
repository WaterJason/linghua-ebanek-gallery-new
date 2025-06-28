import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { batchUpdateInventory } from "@/lib/services/inventory-integration"

// 简化的验收项目类型 (兼容现有数据库结构)
interface ReceivingItem {
  id: number // 采购订单项目ID
  receiveQuantity: number // 本次入库数量
  notes?: string
}

// 验收数据类型
interface ReceivingData {
  warehouseId: number
  items: ReceivingItem[]
  notes?: string
}

// 采购订单到货验收API
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 采购订单到货验收API被调用")

    // 检查用户权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = Number(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }

    const data = await request.json() as ReceivingData

    // 验证必填字段
    if (!data.warehouseId || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: "仓库和验收项目为必填项" }, { status: 400 })
    }

    // 获取采购订单信息
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        employee: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: "采购订单不存在" }, { status: 404 })
    }

    // 检查订单状态 (暂时注释掉审批状态检查，等数据库迁移完成后启用)
    // if (purchaseOrder.approvalStatus !== "approved") {
    //   return NextResponse.json({
    //     error: "只有已审批的采购订单才能进行到货验收"
    //   }, { status: 400 })
    // }

    // 验证仓库是否存在
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId }
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
        if (!orderItem || !orderItem.productId) continue

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

        // 使用库存集成服务更新库存
        try {
          await batchUpdateInventory({
            items: [{
              productId: orderItem.productId,
              warehouseId: Number(data.warehouseId),
              quantity: receiveQuantity,
              unitCost: orderItem.price,
              notes: `采购入库: ${purchaseOrder.orderNumber}`
            }],
            operationType: "purchase_receive",
            referenceId: purchaseOrder.id,
            referenceType: "purchase_order",
            operatorId: session.user.id,
            notes: `采购订单到货验收: ${purchaseOrder.orderNumber}`
          })

          console.log(`✅ 库存更新成功: 产品${orderItem.productId}, 数量${receiveQuantity}`)
        } catch (inventoryError) {
          console.error("❌ 库存更新失败:", inventoryError)
          // 抛出错误以回滚事务
          throw new Error(`库存更新失败: ${inventoryError instanceof Error ? inventoryError.message : "未知错误"}`)
        }
      }

      return updatedPurchaseOrder
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("采购订单入库失败:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "采购订单入库失败"
    }, { status: 500 })
  }
}
