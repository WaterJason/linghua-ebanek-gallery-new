import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import {
  startPurchaseOrderApproval,
  processPurchaseOrderApproval,
  getPurchaseOrderApprovalStatus
} from "@/lib/workflow/purchase-order-workflow"
import { checkApprovalPermission, getNextApprover, checkUserPermission } from "@/lib/services/purchase-permissions"

// 审批动作类型
type ApprovalAction = "approve" | "reject" | "submit_for_approval"

// 采购订单审批API
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 采购订单审批API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }
    
    const purchaseOrderId = parseInt(params.id)
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }
    
    const body = await request.json()
    const { action, comments, nextApproverId } = body as {
      action: ApprovalAction
      comments?: string
      nextApproverId?: string
    }
    
    // 验证必填字段
    if (!action || !["approve", "reject", "submit_for_approval"].includes(action)) {
      return NextResponse.json({ error: "无效的审批动作" }, { status: 400 })
    }
    
    // 获取采购订单信息
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
        employee: true,
        items: {
          include: {
            product: true
          }
        },
        approvals: {
          orderBy: { createdAt: "desc" }
        }
      }
    })
    
    if (!purchaseOrder) {
      return NextResponse.json({ error: "采购订单不存在" }, { status: 404 })
    }
    
    // 使用新的权限检查系统
    const permissionCheck = await checkApprovalPermission(session.user.id, purchaseOrderId, 1)
    if (!permissionCheck.hasPermission && action !== "submit_for_approval") {
      return NextResponse.json({
        error: "权限不足",
        details: permissionCheck.reason
      }, { status: 403 })
    }
    
    // 检查订单状态
    if (action === "submit_for_approval" && purchaseOrder.approvalStatus !== "draft") {
      return NextResponse.json({ error: "只有草稿状态的订单才能提交审批" }, { status: 400 })
    }
    
    if ((action === "approve" || action === "reject") && purchaseOrder.approvalStatus !== "pending_approval") {
      return NextResponse.json({ error: "只有待审批状态的订单才能进行审批操作" }, { status: 400 })
    }
    
    console.log(`📝 执行审批操作: ${action}，当前步骤: ${purchaseOrder.currentStep}`)

    let result

    if (action === "submit_for_approval") {
      // 提交审批，启动工作流
      const workflowInstance = await startPurchaseOrderApproval(
        purchaseOrderId,
        session.user.id,
        comments
      )

      // 获取更新后的采购订单
      const updatedOrder = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          supplier: true,
          employee: true,
          items: {
            include: {
              product: true
            }
          },
          approvals: {
            orderBy: { createdAt: "desc" },
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      result = {
        workflowInstance,
        updatedOrder
      }

    } else {
      // 审批或拒绝，处理工作流步骤
      const workflowResult = await processPurchaseOrderApproval(
        purchaseOrderId,
        session.user.id,
        action,
        comments
      )

      // 获取更新后的采购订单
      const updatedOrder = await prisma.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          supplier: true,
          employee: true,
          items: {
            include: {
              product: true
            }
          },
          approvals: {
            orderBy: { createdAt: "desc" },
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      result = {
        workflowResult,
        updatedOrder
      }
    }
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 审批操作完成，耗时: ${responseTime}ms`)
    
    // 构建响应消息
    let message = ""
    switch (action) {
      case "submit_for_approval":
        message = "采购订单已提交审批"
        break
      case "approve":
        message = result.updatedOrder.approvalStatus === "approved" 
          ? "采购订单审批通过" 
          : "采购订单已通过当前审批步骤"
        break
      case "reject":
        message = "采购订单已被拒绝"
        break
    }
    
    return NextResponse.json({
      success: true,
      message,
      data: {
        purchaseOrder: result.updatedOrder,
        workflowInstance: result.workflowInstance || result.workflowResult?.workflowInstance,
        currentStep: result.updatedOrder.currentStep,
        approvalStatus: result.updatedOrder.approvalStatus
      },
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 采购订单审批失败:", error)
    
    return NextResponse.json({
      error: "审批操作失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}

// 获取审批历史记录
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 获取审批历史记录API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }
    
    const purchaseOrderId = parseInt(params.id)
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }
    
    // 获取审批状态和历史记录
    const approvalStatus = await getPurchaseOrderApprovalStatus(purchaseOrderId)
    const approvals = approvalStatus.approvals
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 获取审批历史记录成功，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: true,
      data: approvals,
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 获取审批历史记录失败:", error)
    
    return NextResponse.json({
      error: "获取审批历史记录失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}
