import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { checkUserPermission } from "@/lib/services/purchase-permissions"

// 获取单个采购订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 获取采购订单详情API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }
    
    const purchaseOrderId = parseInt(params.id)
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }
    
    // 检查查看权限
    const permissionCheck = await checkUserPermission(
      session.user.id,
      "purchase_view_all",
      purchaseOrderId
    )
    
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: "权限不足",
        details: permissionCheck.reason 
      }, { status: 403 })
    }
    
    // 获取采购订单详情
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true,
            address: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
                cost: true
              }
            }
          },
          orderBy: { id: "asc" }
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    })
    
    if (!purchaseOrder) {
      return NextResponse.json({ error: "采购订单不存在" }, { status: 404 })
    }
    
    // 获取库存事务记录
    const inventoryTransactions = await prisma.inventoryTransaction.findMany({
      where: {
        referenceId: purchaseOrderId,
        referenceType: "purchase_order"
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        },
        targetWarehouse: {
          select: { id: true, name: true, location: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
    
    // 获取财务记录
    const financeRecords = await prisma.financeRecord.findMany({
      where: {
        referenceId: purchaseOrderId.toString(),
        referenceType: "purchase_order"
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 获取采购订单详情成功，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: true,
      data: {
        ...purchaseOrder,
        inventoryTransactions,
        financeRecords,
        summary: {
          totalItems: purchaseOrder.items.length,
          totalQuantity: purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0),
          receivedQuantity: purchaseOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0),
          pendingQuantity: purchaseOrder.items.reduce((sum, item) => sum + (item.quantity - item.receivedQuantity), 0),
          inventoryTransactionCount: inventoryTransactions.length,
          financeRecordCount: financeRecords.length
        }
      },
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 获取采购订单详情失败:", error)
    
    return NextResponse.json({
      error: "获取采购订单详情失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}

// 更新采购订单
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 更新采购订单API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }
    
    const purchaseOrderId = parseInt(params.id)
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }
    
    // 检查编辑权限
    const permissionCheck = await checkUserPermission(
      session.user.id,
      "purchase_edit",
      purchaseOrderId
    )
    
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: "权限不足",
        details: permissionCheck.reason 
      }, { status: 403 })
    }
    
    const body = await request.json()
    const { 
      supplierId, 
      expectedDate, 
      notes, 
      items,
      paymentMethod,
      paymentStatus 
    } = body
    
    // 验证必填字段
    if (!supplierId || !expectedDate || !items || items.length === 0) {
      return NextResponse.json({ 
        error: "缺少必填字段",
        details: "供应商、预计到货日期和订单项目为必填项"
      }, { status: 400 })
    }
    
    // 检查采购订单是否存在且可编辑
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: { 
        id: true, 
        status: true, 
        approvalStatus: true,
        employeeId: true
      }
    })
    
    if (!existingOrder) {
      return NextResponse.json({ error: "采购订单不存在" }, { status: 404 })
    }
    
    // 检查是否可以编辑
    if (existingOrder.approvalStatus === "approved" || existingOrder.status === "received") {
      return NextResponse.json({ 
        error: "订单状态不允许编辑",
        details: "已审批或已收货的订单不能编辑"
      }, { status: 400 })
    }
    
    // 计算总金额
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
    
    // 更新采购订单
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 删除现有订单项目
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId }
      })
      
      // 更新订单基本信息
      const order = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          supplierId,
          expectedDate: new Date(expectedDate),
          notes,
          totalAmount,
          paymentMethod,
          paymentStatus,
          updatedAt: new Date()
        }
      })
      
      // 创建新的订单项目
      await tx.purchaseOrderItem.createMany({
        data: items.map(item => ({
          purchaseOrderId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || ""
        }))
      })
      
      // 返回完整的订单信息
      return await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
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
    })
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 更新采购订单成功，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: true,
      message: "采购订单更新成功",
      data: updatedOrder,
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 更新采购订单失败:", error)
    
    return NextResponse.json({
      error: "更新采购订单失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}

// 删除采购订单
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 删除采购订单API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }
    
    const purchaseOrderId = parseInt(params.id)
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }
    
    // 检查删除权限
    const permissionCheck = await checkUserPermission(
      session.user.id,
      "purchase_delete",
      purchaseOrderId
    )
    
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: "权限不足",
        details: permissionCheck.reason 
      }, { status: 403 })
    }
    
    // 检查采购订单是否存在且可删除
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: { 
        id: true, 
        orderNumber: true,
        status: true, 
        approvalStatus: true,
        employeeId: true
      }
    })
    
    if (!existingOrder) {
      return NextResponse.json({ error: "采购订单不存在" }, { status: 404 })
    }
    
    // 检查是否可以删除
    if (existingOrder.status === "received" || existingOrder.approvalStatus === "approved") {
      return NextResponse.json({ 
        error: "订单状态不允许删除",
        details: "已审批或已收货的订单不能删除"
      }, { status: 400 })
    }
    
    // 删除采购订单（正确处理所有关联数据）
    await prisma.$transaction(async (tx) => {
      console.log(`🗑️ 开始删除采购订单: ${purchaseOrderId}`)

      // 1. 删除到货验收明细
      const receivingItems = await tx.purchaseOrderReceivingItem.findMany({
        where: {
          receiving: {
            purchaseOrderId
          }
        }
      })

      if (receivingItems.length > 0) {
        await tx.purchaseOrderReceivingItem.deleteMany({
          where: {
            id: {
              in: receivingItems.map(item => item.id)
            }
          }
        })
        console.log(`✅ 删除到货验收明细: ${receivingItems.length} 条`)
      }

      // 2. 删除到货验收记录
      const receivingCount = await tx.purchaseOrderReceiving.deleteMany({
        where: { purchaseOrderId }
      })
      console.log(`✅ 删除到货验收记录: ${receivingCount.count} 条`)

      // 3. 删除工作流审批记录
      const workflowApprovals = await tx.workflowApproval.findMany({
        where: {
          workflowInstance: {
            entityId: purchaseOrderId.toString(),
            entityType: "purchase_order"
          }
        }
      })

      if (workflowApprovals.length > 0) {
        await tx.workflowApproval.deleteMany({
          where: {
            id: {
              in: workflowApprovals.map(approval => approval.id)
            }
          }
        })
        console.log(`✅ 删除工作流审批记录: ${workflowApprovals.length} 条`)
      }

      // 4. 删除工作流实例
      const workflowInstances = await tx.workflowInstance.deleteMany({
        where: {
          entityId: purchaseOrderId.toString(),
          entityType: "purchase_order"
        }
      })
      console.log(`✅ 删除工作流实例: ${workflowInstances.count} 条`)

      // 5. 删除采购订单审批记录
      const approvalCount = await tx.purchaseOrderApproval.deleteMany({
        where: { purchaseOrderId }
      })
      console.log(`✅ 删除采购订单审批记录: ${approvalCount.count} 条`)

      // 6. 删除订单项目
      const itemCount = await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId }
      })
      console.log(`✅ 删除订单项目: ${itemCount.count} 条`)

      // 7. 最后删除采购订单主记录
      await tx.purchaseOrder.delete({
        where: { id: purchaseOrderId }
      })
      console.log(`✅ 删除采购订单主记录`)
    })
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 删除采购订单成功，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: true,
      message: `采购订单 ${existingOrder.orderNumber} 删除成功`,
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 删除采购订单失败:", error)
    
    return NextResponse.json({
      error: "删除采购订单失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}
