import prisma from "@/lib/db"
import { createWorkflow, createWorkflowInstance, approveWorkflowStep } from "@/lib/actions/workflow-actions"
import { createNotification } from "@/lib/actions/notification-actions"
import { checkApprovalPermission, getNextApprover } from "@/lib/services/purchase-permissions"

// 采购订单工作流配置
export const PURCHASE_ORDER_WORKFLOW_CONFIG = {
  code: "PURCHASE_ORDER_APPROVAL",
  name: "采购订单审批流程",
  description: "采购订单三级审批工作流",
  entityType: "purchase_order",
  steps: [
    {
      name: "初审",
      description: "采购主管初步审核",
      stepNumber: 1,
      approverType: "role",
      approverId: "purchase_manager",
      isRequired: true
    },
    {
      name: "复审", 
      description: "部门经理复核审批",
      stepNumber: 2,
      approverType: "role",
      approverId: "department_manager",
      isRequired: true
    },
    {
      name: "终审",
      description: "财务总监最终审批",
      stepNumber: 3,
      approverType: "role", 
      approverId: "finance_director",
      isRequired: true
    }
  ]
}

// 采购订单工作流状态映射
export const PURCHASE_ORDER_STATUS_MAP = {
  "draft": "草稿",
  "pending_approval": "待审批",
  "approved": "已审批",
  "rejected": "已拒绝",
  "received": "已收货",
  "partial_received": "部分收货",
  "inventory_synced": "已入库"
}

// 获取或创建采购订单工作流
export async function getOrCreatePurchaseOrderWorkflow() {
  try {
    // 查找现有工作流
    let workflow = await prisma.workflow.findFirst({
      where: {
        code: PURCHASE_ORDER_WORKFLOW_CONFIG.code,
        entityType: "purchase_order"
      },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" }
        }
      }
    })

    // 如果不存在，创建新工作流
    if (!workflow) {
      console.log("🔧 创建采购订单工作流...")
      workflow = await createWorkflow(PURCHASE_ORDER_WORKFLOW_CONFIG)
      console.log("✅ 采购订单工作流创建成功:", workflow.id)
    }

    return workflow
  } catch (error) {
    console.error("❌ 获取或创建采购订单工作流失败:", error)
    throw error
  }
}

// 启动采购订单审批流程
export async function startPurchaseOrderApproval(purchaseOrderId: number, initiatedBy: string, notes?: string) {
  try {
    console.log(`🚀 启动采购订单审批流程: ${purchaseOrderId}`)

    // 获取工作流配置
    const workflow = await getOrCreatePurchaseOrderWorkflow()
    
    // 获取采购订单信息
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
        employee: true
      }
    })

    if (!purchaseOrder) {
      throw new Error("采购订单不存在")
    }

    // 检查是否已有工作流实例
    const existingInstance = await prisma.workflowInstance.findFirst({
      where: {
        workflowId: workflow.id,
        entityId: purchaseOrderId.toString()
      }
    })

    if (existingInstance) {
      console.log("⚠️ 采购订单已有审批流程实例")
      return existingInstance
    }

    // 创建工作流实例
    const workflowInstance = await createWorkflowInstance({
      workflowId: workflow.id,
      entityType: "purchase_order",
      entityId: purchaseOrderId.toString(),
      notes: notes || `采购订单审批 - ${purchaseOrder.orderNumber}`
    })

    // 更新采购订单状态
    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        approvalStatus: "pending_approval",
        currentStep: 1
      }
    })

    console.log("✅ 采购订单审批流程启动成功")
    return workflowInstance

  } catch (error) {
    console.error("❌ 启动采购订单审批流程失败:", error)
    throw error
  }
}

// 处理采购订单审批
export async function processPurchaseOrderApproval(
  purchaseOrderId: number,
  approverId: string,
  action: "approve" | "reject",
  comments?: string
) {
  try {
    console.log(`📝 处理采购订单审批: ${purchaseOrderId}, 动作: ${action}`)

    // 获取工作流实例
    const workflowInstance = await prisma.workflowInstance.findFirst({
      where: {
        entityId: purchaseOrderId.toString(),
        status: "pending"
      },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { stepNumber: "asc" }
            }
          }
        },
        approvals: {
          include: {
            workflowStep: true
          }
        }
      }
    })

    if (!workflowInstance) {
      throw new Error("未找到有效的工作流实例")
    }

    // 获取当前步骤
    const currentStep = workflowInstance.workflow.steps.find(
      step => step.stepNumber === workflowInstance.currentStepNumber
    )

    if (!currentStep) {
      throw new Error("未找到当前审批步骤")
    }

    // 使用新的权限检查系统
    const permissionCheck = await checkApprovalPermission(approverId, purchaseOrderId, currentStep.stepNumber)
    if (!permissionCheck.hasPermission) {
      throw new Error(permissionCheck.reason || "您没有权限审批此步骤")
    }

    // 创建采购订单审批记录
    await prisma.purchaseOrderApproval.create({
      data: {
        purchaseOrderId,
        workflowStepId: currentStep.id,
        approverId,
        approverName: await getUserName(approverId),
        status: action === "approve" ? "approved" : "rejected",
        comments,
        approvedAt: new Date()
      }
    })

    if (action === "reject") {
      // 拒绝审批，更新工作流实例和采购订单状态
      await prisma.workflowInstance.update({
        where: { id: workflowInstance.id },
        data: {
          status: "rejected",
          completedAt: new Date()
        }
      })

      await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          approvalStatus: "rejected",
          status: "rejected"
        }
      })

      // 发送拒绝通知
      await sendApprovalNotification(purchaseOrderId, "rejected", workflowInstance.initiatedBy)

      console.log("❌ 采购订单审批被拒绝")
      return { status: "rejected", workflowInstance }
    }

    // 批准当前步骤
    const result = await approveWorkflowStep({
      workflowInstanceId: workflowInstance.id,
      workflowStepId: currentStep.id,
      approverId,
      comments
    })

    // 检查是否完成所有审批
    if (result.status === "approved") {
      // 所有步骤都已批准，更新采购订单状态
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          approvalStatus: "approved",
          status: "approved",
          currentStep: workflowInstance.workflow.steps.length
        }
      })

      // 发送完成通知
      await sendApprovalNotification(purchaseOrderId, "approved", workflowInstance.initiatedBy)

      console.log("✅ 采购订单审批流程完成")
    } else {
      // 进入下一步审批
      const nextStep = workflowInstance.currentStepNumber! + 1
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          currentStep: nextStep
        }
      })

      console.log(`➡️ 采购订单进入下一步审批: 步骤${nextStep}`)
    }

    return { status: result.status, workflowInstance: result }

  } catch (error) {
    console.error("❌ 处理采购订单审批失败:", error)
    throw error
  }
}

// 权限检查已移至 purchase-permissions.ts 服务

// 获取用户名称
async function getUserName(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })
    return user?.name || user?.email || "未知用户"
  } catch (error) {
    console.error("获取用户名称失败:", error)
    return "未知用户"
  }
}

// 发送审批通知
async function sendApprovalNotification(purchaseOrderId: number, status: string, userId: string) {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: { orderNumber: true }
    })

    if (!purchaseOrder) return

    const statusText = PURCHASE_ORDER_STATUS_MAP[status as keyof typeof PURCHASE_ORDER_STATUS_MAP] || status
    
    await createNotification({
      userId,
      title: `采购订单审批${statusText}`,
      message: `您的采购订单 ${purchaseOrder.orderNumber} 审批${statusText}`,
      type: "approval",
      priority: status === "approved" ? "medium" : "high",
      link: `/purchase/orders/${purchaseOrderId}`
    })
  } catch (error) {
    console.error("发送审批通知失败:", error)
  }
}

// 获取采购订单审批状态
export async function getPurchaseOrderApprovalStatus(purchaseOrderId: number) {
  try {
    const workflowInstance = await prisma.workflowInstance.findFirst({
      where: {
        entityId: purchaseOrderId.toString(),
        workflow: {
          entityType: "purchase_order"
        }
      },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { stepNumber: "asc" }
            }
          }
        },
        approvals: {
          include: {
            workflowStep: true
          },
          orderBy: { createdAt: "asc" }
        }
      }
    })

    const purchaseOrderApprovals = await prisma.purchaseOrderApproval.findMany({
      where: { purchaseOrderId },
      include: {
        workflowStep: true,
        approver: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "asc" }
    })

    return {
      workflowInstance,
      approvals: purchaseOrderApprovals
    }
  } catch (error) {
    console.error("获取采购订单审批状态失败:", error)
    throw error
  }
}
