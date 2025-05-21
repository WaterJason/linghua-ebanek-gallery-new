import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

// 库存转移
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.sourceWarehouseId || !data.targetWarehouseId || !data.productId || data.quantity === undefined) {
      return NextResponse.json({ error: "源仓库ID、目标仓库ID、产品ID和数量为必填项" }, { status: 400 })
    }

    // 检查源仓库和目标仓库是否相同
    if (Number(data.sourceWarehouseId) === Number(data.targetWarehouseId)) {
      return NextResponse.json({ error: "源仓库和目标仓库不能相同" }, { status: 400 })
    }

    // 检查数量是否为正数
    if (Number(data.quantity) <= 0) {
      return NextResponse.json({ error: "转移数量必须大于0" }, { status: 400 })
    }

    // 检查源仓库库存是否足够
    const sourceInventory = await prisma.inventoryItem.findFirst({
      where: {
        warehouseId: Number(data.sourceWarehouseId),
        productId: Number(data.productId),
      },
    })

    if (!sourceInventory || sourceInventory.quantity < Number(data.quantity)) {
      return NextResponse.json({ error: "源仓库库存不足" }, { status: 400 })
    }

    // 开始事务，确保库存转移的原子性
    const result = await prisma.$transaction(async (tx) => {
      // 减少源仓库库存
      const updatedSourceInventory = await tx.inventoryItem.update({
        where: { id: sourceInventory.id },
        data: {
          quantity: sourceInventory.quantity - Number(data.quantity),
        },
      })

      // 查找目标仓库库存
      const targetInventory = await tx.inventoryItem.findFirst({
        where: {
          warehouseId: Number(data.targetWarehouseId),
          productId: Number(data.productId),
        },
      })

      let updatedTargetInventory

      if (targetInventory) {
        // 更新目标仓库库存
        updatedTargetInventory = await tx.inventoryItem.update({
          where: { id: targetInventory.id },
          data: {
            quantity: targetInventory.quantity + Number(data.quantity),
          },
        })
      } else {
        // 创建目标仓库库存
        updatedTargetInventory = await tx.inventoryItem.create({
          data: {
            warehouseId: Number(data.targetWarehouseId),
            productId: Number(data.productId),
            quantity: Number(data.quantity),
          },
        })
      }

      // 记录库存交易
      const transaction = await tx.inventoryTransaction.create({
        data: {
          type: "transfer",
          sourceWarehouseId: Number(data.sourceWarehouseId),
          targetWarehouseId: Number(data.targetWarehouseId),
          productId: Number(data.productId),
          quantity: Number(data.quantity),
          notes: data.notes || "库存转移",
          referenceType: "transfer",
        },
      })

      return {
        sourceInventory: updatedSourceInventory,
        targetInventory: updatedTargetInventory,
        transaction,
      }
    })

    // 刷新库存页面
    revalidatePath("/inventory")

    return NextResponse.json({
      success: true,
      message: "库存转移成功",
      data: result
    })
  } catch (error) {
    console.error("库存转移失败:", error)
    return NextResponse.json({ error: "库存转移失败" }, { status: 500 })
  }
}
