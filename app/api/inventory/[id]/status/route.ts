import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const inventoryId = parseInt(params.id)
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: "无效的库存ID" }, { status: 400 })
    }

    const { stage, notes } = await request.json()

    if (!stage) {
      return NextResponse.json({ error: "阶段参数为必填项" }, { status: 400 })
    }

    // 检查库存项是否存在
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryId },
      include: {
        product: true,
        warehouse: true
      }
    })

    if (!inventoryItem) {
      return NextResponse.json({ error: "库存项不存在" }, { status: 404 })
    }

    // 根据阶段确定目标仓库类型
    const targetWarehouseType = getWarehouseTypeFromStage(stage)

    // 查找对应类型的仓库
    const targetWarehouse = await prisma.warehouse.findFirst({
      where: {
        type: targetWarehouseType,
        isActive: true
      }
    })

    if (!targetWarehouse) {
      return NextResponse.json({
        error: `未找到类型为 ${targetWarehouseType} 的活跃仓库`
      }, { status: 400 })
    }

    // 开始事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 如果需要转移到不同的仓库
      if (inventoryItem.warehouseId !== targetWarehouse.id) {
        // 在目标仓库创建或更新库存
        const existingTargetInventory = await tx.inventoryItem.findFirst({
          where: {
            productId: inventoryItem.productId,
            warehouseId: targetWarehouse.id
          }
        })

        if (existingTargetInventory) {
          // 更新目标仓库库存
          await tx.inventoryItem.update({
            where: { id: existingTargetInventory.id },
            data: {
              quantity: existingTargetInventory.quantity + inventoryItem.quantity
            }
          })
        } else {
          // 在目标仓库创建新库存
          await tx.inventoryItem.create({
            data: {
              productId: inventoryItem.productId,
              warehouseId: targetWarehouse.id,
              quantity: inventoryItem.quantity,
              minQuantity: inventoryItem.minQuantity
            }
          })
        }

        // 删除原库存项
        await tx.inventoryItem.delete({
          where: { id: inventoryId }
        })

        // 记录转移交易
        await tx.inventoryTransaction.create({
          data: {
            type: "transfer",
            productId: inventoryItem.productId,
            quantity: inventoryItem.quantity,
            sourceWarehouseId: inventoryItem.warehouseId,
            targetWarehouseId: targetWarehouse.id,
            notes: notes || `供应链状态更新: ${stage}`,
            referenceType: "supply_chain_update"
          }
        })
      }

      // 记录状态变更
      await tx.inventoryTransaction.create({
        data: {
          type: "status_update",
          productId: inventoryItem.productId,
          quantity: 0, // 状态更新不涉及数量变化
          targetWarehouseId: targetWarehouse.id,
          notes: notes || `供应链状态更新为: ${stage}`,
          referenceType: "supply_chain_status"
        }
      })

      return { success: true }
    })

    return NextResponse.json({
      success: true,
      message: "供应链状态更新成功",
      newStage: stage,
      newWarehouse: targetWarehouse.name
    })

  } catch (error) {
    console.error("Error updating supply chain status:", error)
    return NextResponse.json({
      error: "更新供应链状态失败"
    }, { status: 500 })
  }
}

// 根据供应链阶段确定仓库类型
function getWarehouseTypeFromStage(stage: string): string {
  switch (stage) {
    case 'design':
    case 'material_procurement':
      return 'physical'
    case 'shipping_to_production':
    case 'in_production':
    case 'quality_check':
      return 'production_base'
    case 'shipping_back':
    case 'packaging':
    case 'completed':
      return 'virtual'
    default:
      return 'physical'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const inventoryId = parseInt(params.id)
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: "无效的库存ID" }, { status: 400 })
    }

    // 获取库存项的状态历史
    const statusHistory = await prisma.inventoryTransaction.findMany({
      where: {
        OR: [
          {
            AND: [
              { referenceType: "supply_chain_status" },
              {
                product: {
                  inventoryItems: {
                    some: { id: inventoryId }
                  }
                }
              }
            ]
          },
          {
            AND: [
              { referenceType: "supply_chain_update" },
              {
                OR: [
                  { sourceWarehouseId: { not: null } },
                  { targetWarehouseId: { not: null } }
                ]
              },
              {
                product: {
                  inventoryItems: {
                    some: { id: inventoryId }
                  }
                }
              }
            ]
          }
        ]
      },
      include: {
        product: true,
        sourceWarehouse: true,
        targetWarehouse: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      statusHistory
    })

  } catch (error) {
    console.error("Error fetching supply chain status history:", error)
    return NextResponse.json({
      error: "获取供应链状态历史失败"
    }, { status: 500 })
  }
}
