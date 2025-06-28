"use server";

/**
 * 工作流服务
 *
 * 本模块提供工作流相关的功能，包括创建工作流、获取工作流列表、管理工作流步骤等。
 *
 * @module 工作流
 * @category 核心模块
 */

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { logEntityCreation, logEntityUpdate, logEntityDeletion } from "./audit-actions";
import { createNotification } from "./notification-actions";

// 工作流状态
export type WorkflowStatus = "pending" | "approved" | "rejected" | "canceled";

// 审批状态
export type ApprovalStatus = "pending" | "approved" | "rejected";

// 创建工作流参数
export interface CreateWorkflowParams {
  code: string;
  name: string;
  description?: string;
  entityType: string;
  isActive?: boolean;
  steps: Array<{
    name: string;
    description?: string;
    stepNumber: number;
    approverType: string;
    approverId?: string;
    isRequired?: boolean;
  }>;
}

// 更新工作流参数
export interface UpdateWorkflowParams {
  id: number;
  name?: string;
  description?: string;
  isActive?: boolean;
}

// 创建工作流步骤参数
export interface CreateWorkflowStepParams {
  workflowId: number;
  name: string;
  description?: string;
  stepNumber: number;
  approverType: string;
  approverId?: string;
  isRequired?: boolean;
}

// 更新工作流步骤参数
export interface UpdateWorkflowStepParams {
  id: number;
  name?: string;
  description?: string;
  stepNumber?: number;
  approverType?: string;
  approverId?: string;
  isRequired?: boolean;
}

// 创建工作流实例参数
export interface CreateWorkflowInstanceParams {
  workflowId: number;
  entityType?: string;
  entityId: string;
  notes?: string;
}

// 审批工作流参数
export interface ApproveWorkflowParams {
  workflowInstanceId: string;
  status: ApprovalStatus;
  comments?: string;
}

/**
 * 创建工作流
 *
 * @param params 创建工作流参数
 * @returns 创建的工作流
 */
export async function createWorkflow(params: CreateWorkflowParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 检查代码是否已存在
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { code: params.code },
    });

    if (existingWorkflow) {
      throw new Error(`工作流代码 ${params.code} 已存在`);
    }

    // 创建工作流
    const workflow = await prisma.workflow.create({
      data: {
        code: params.code,
        name: params.name,
        description: params.description,
        entityType: params.entityType,
        isActive: params.isActive !== undefined ? params.isActive : true,
      },
    });

    // 创建工作流步骤
    if (params.steps && params.steps.length > 0) {
      await prisma.workflowStep.createMany({
        data: params.steps.map(step => ({
          workflowId: workflow.id,
          name: step.name,
          description: step.description,
          stepNumber: step.stepNumber,
          approverType: step.approverType,
          approverId: step.approverId,
          isRequired: step.isRequired !== undefined ? step.isRequired : true,
        })),
      });
    }

    // 记录审计日志
    await logEntityCreation("system", workflow.id.toString(), workflow, "创建工作流");

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return workflow;
  } catch (error) {
    console.error("创建工作流失败:", error);
    throw new Error(error instanceof Error ? error.message : "创建工作流失败");
  }
}

/**
 * 更新工作流
 *
 * @param params 更新工作流参数
 * @returns 更新的工作流
 */
export async function updateWorkflow(params: UpdateWorkflowParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询工作流
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id },
    });

    if (!workflow) {
      throw new Error("工作流不存在");
    }

    // 更新工作流
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: params.id },
      data: {
        name: params.name,
        description: params.description,
        isActive: params.isActive,
      },
    });

    // 记录审计日志
    await logEntityUpdate(
      "system",
      updatedWorkflow.id.toString(),
      workflow,
      updatedWorkflow,
      "更新工作流"
    );

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return updatedWorkflow;
  } catch (error) {
    console.error("更新工作流失败:", error);
    throw new Error(error instanceof Error ? error.message : "更新工作流失败");
  }
}

/**
 * 删除工作流
 *
 * @param id 工作流ID
 * @returns 删除的工作流
 */
export async function deleteWorkflow(id: number) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询工作流
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: true,
        instances: {
          where: {
            status: "pending",
          },
        },
      },
    });

    if (!workflow) {
      throw new Error("工作流不存在");
    }

    // 检查是否有正在进行的工作流实例
    if (workflow.instances && workflow.instances.length > 0) {
      throw new Error("无法删除有正在进行的工作流实例的工作流");
    }

    // 删除工作流
    const deletedWorkflow = await prisma.workflow.delete({
      where: { id },
    });

    // 记录审计日志
    await logEntityDeletion(
      "system",
      deletedWorkflow.id.toString(),
      workflow,
      "删除工作流"
    );

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return deletedWorkflow;
  } catch (error) {
    console.error("删除工作流失败:", error);
    throw new Error(error instanceof Error ? error.message : "删除工作流失败");
  }
}

/**
 * 获取工作流列表
 *
 * @param entityType 可选的实体类型过滤
 * @returns 工作流列表
 */
export async function getWorkflows(entityType?: string) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }

    // 构建查询条件
    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    // 查询工作流列表
    const workflows = await prisma.workflow.findMany({
      where,
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
      orderBy: { code: "asc" },
    });

    return workflows;
  } catch (error) {
    console.error("获取工作流列表失败:", error);
    throw new Error("获取工作流列表失败");
  }
}

/**
 * 根据实体类型获取工作流
 *
 * @param entityType 实体类型
 * @returns 工作流列表
 */
export async function getWorkflowByEntityType(entityType: string) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }

    // 查询工作流列表
    const workflows = await prisma.workflow.findMany({
      where: {
        entityType,
        isActive: true,
      },
      include: {
        steps: {
          orderBy: {
            stepNumber: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return workflows;
  } catch (error) {
    console.error("获取工作流列表失败:", error);
    throw new Error("获取工作流列表失败");
  }
}

/**
 * 获取工作流详情
 *
 * @param id 工作流ID
 * @returns 工作流详情
 */
export async function getWorkflow(id: number) {
  try {
    // 查询工作流
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
    });

    if (!workflow) {
      throw new Error("工作流不存在");
    }

    return workflow;
  } catch (error) {
    console.error("获取工作流详情失败:", error);
    throw new Error("获取工作流详情失败");
  }
}

/**
 * 创建工作流实例
 *
 * @param params 创建工作流实例参数
 * @returns 创建的工作流实例
 */
export async function createWorkflowInstance(params: CreateWorkflowInstanceParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }

    // 查询工作流
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.workflowId },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
    });

    if (!workflow) {
      throw new Error("工作流不存在");
    }

    // 检查工作流是否激活
    if (!workflow.isActive) {
      throw new Error("工作流未激活");
    }

    // 检查是否有步骤
    if (!workflow.steps || workflow.steps.length === 0) {
      throw new Error("工作流没有步骤");
    }

    // 创建工作流实例
    const workflowInstance = await prisma.workflowInstance.create({
      data: {
        workflowId: params.workflowId,
        entityType: params.entityType || workflow.entityType,
        entityId: params.entityId,
        status: "pending",
        initiatedBy: currentUser.id,
        notes: params.notes,
        currentStepNumber: workflow.steps[0].stepNumber,
      },
    });

    // 创建第一个步骤的审批
    const firstStep = workflow.steps[0];
    await prisma.workflowApproval.create({
      data: {
        workflowInstanceId: workflowInstance.id,
        workflowStepId: firstStep.id,
        approverId: firstStep.approverId || "",
        status: "pending",
      },
    });

    // 发送通知给审批人
    if (firstStep.approverId) {
      await createNotification({
        userId: firstStep.approverId,
        title: `需要您审批 - ${workflow.name}`,
        message: `您有一个新的审批任务：${workflow.name} - ${firstStep.name}`,
        type: "approval",
        priority: "high",
        link: `/workflows/approvals/${workflowInstance.id}`,
      });
    }

    // 记录审计日志
    await logEntityCreation(
      "system",
      workflowInstance.id,
      workflowInstance,
      `创建工作流实例 - ${workflow.name}`
    );

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return workflowInstance;
  } catch (error) {
    console.error("创建工作流实例失败:", error);
    throw new Error(error instanceof Error ? error.message : "创建工作流实例失败");
  }
}

/**
 * 审批工作流
 *
 * @param params 审批工作流参数
 * @returns 更新的工作流实例
 */
export async function approveWorkflow(params: ApproveWorkflowParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }

    // 查询工作流实例
    const workflowInstance = await prisma.workflowInstance.findUnique({
      where: { id: params.workflowInstanceId },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { stepNumber: "asc" },
            },
          },
        },
        approvals: {
          include: {
            workflowStep: true,
          },
        },
      },
    });

    if (!workflowInstance) {
      throw new Error("工作流实例不存在");
    }

    // 检查工作流实例状态
    if (workflowInstance.status !== "pending") {
      throw new Error("工作流实例已完成或已取消");
    }

    // 获取当前步骤
    const currentStepNumber = workflowInstance.currentStepNumber;
    if (!currentStepNumber) {
      throw new Error("工作流实例没有当前步骤");
    }

    const currentStep = workflowInstance.workflow.steps.find(
      step => step.stepNumber === currentStepNumber
    );

    if (!currentStep) {
      throw new Error("当前步骤不存在");
    }

    // 获取当前步骤的审批
    const currentApproval = workflowInstance.approvals.find(
      approval => approval.workflowStepId === currentStep.id && approval.status === "pending"
    );

    if (!currentApproval) {
      throw new Error("当前步骤没有待处理的审批");
    }

    // 检查审批人
    if (currentStep.approverId && currentStep.approverId !== currentUser.id) {
      throw new Error("您不是当前步骤的审批人");
    }

    // 更新审批状态
    await prisma.workflowApproval.update({
      where: { id: currentApproval.id },
      data: {
        status: params.status,
        comments: params.comments,
        actionDate: new Date(),
      },
    });

    // 如果拒绝，更新工作流实例状态
    if (params.status === "rejected") {
      await prisma.workflowInstance.update({
        where: { id: params.workflowInstanceId },
        data: {
          status: "rejected",
          completedAt: new Date(),
        },
      });

      // 发送通知给发起人
      await createNotification({
        userId: workflowInstance.initiatedBy,
        title: `审批被拒绝 - ${workflowInstance.workflow.name}`,
        message: `您的审批请求被拒绝：${workflowInstance.workflow.name} - ${currentStep.name}`,
        type: "approval",
        priority: "high",
        link: `/workflows/instances/${workflowInstance.id}`,
      });

      // 记录审计日志
      await logEntityUpdate(
        "system",
        workflowInstance.id,
        { status: workflowInstance.status },
        { status: "rejected" },
        `拒绝工作流 - ${workflowInstance.workflow.name}`
      );

      // 重新验证工作流页面
      revalidatePath("/workflows");

      return {
        ...workflowInstance,
        status: "rejected",
      };
    }

    // 如果批准，检查是否有下一步
    const nextStep = workflowInstance.workflow.steps.find(
      step => step.stepNumber > currentStepNumber
    );

    // 如果没有下一步，更新工作流实例状态为已批准
    if (!nextStep) {
      await prisma.workflowInstance.update({
        where: { id: params.workflowInstanceId },
        data: {
          status: "approved",
          completedAt: new Date(),
        },
      });

      // 发送通知给发起人
      await createNotification({
        userId: workflowInstance.initiatedBy,
        title: `审批已通过 - ${workflowInstance.workflow.name}`,
        message: `您的审批请求已通过：${workflowInstance.workflow.name}`,
        type: "approval",
        priority: "medium",
        link: `/workflows/instances/${workflowInstance.id}`,
      });

      // 记录审计日志
      await logEntityUpdate(
        "system",
        workflowInstance.id,
        { status: workflowInstance.status },
        { status: "approved" },
        `完成工作流 - ${workflowInstance.workflow.name}`
      );

      // 重新验证工作流页面
      revalidatePath("/workflows");

      return {
        ...workflowInstance,
        status: "approved",
      };
    }

    // 如果有下一步，更新工作流实例的当前步骤
    await prisma.workflowInstance.update({
      where: { id: params.workflowInstanceId },
      data: {
        currentStepNumber: nextStep.stepNumber,
      },
    });

    // 创建下一步的审批
    await prisma.workflowApproval.create({
      data: {
        workflowInstanceId: workflowInstance.id,
        workflowStepId: nextStep.id,
        approverId: nextStep.approverId || "",
        status: "pending",
      },
    });

    // 发送通知给下一步审批人
    if (nextStep.approverId) {
      await createNotification({
        userId: nextStep.approverId,
        title: `需要您审批 - ${workflowInstance.workflow.name}`,
        message: `您有一个新的审批任务：${workflowInstance.workflow.name} - ${nextStep.name}`,
        type: "approval",
        priority: "high",
        link: `/workflows/approvals/${workflowInstance.id}`,
      });
    }

    // 记录审计日志
    await logEntityUpdate(
      "system",
      workflowInstance.id,
      { currentStepNumber: workflowInstance.currentStepNumber },
      { currentStepNumber: nextStep.stepNumber },
      `审批工作流步骤 - ${workflowInstance.workflow.name} - ${currentStep.name}`
    );

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return {
      ...workflowInstance,
      currentStepNumber: nextStep.stepNumber,
    };
  } catch (error) {
    console.error("审批工作流失败:", error);
    throw new Error(error instanceof Error ? error.message : "审批工作流失败");
  }
}

/**
 * 取消工作流实例
 *
 * @param id 工作流实例ID
 * @param reason 取消原因
 * @returns 更新的工作流实例
 */
export async function cancelWorkflowInstance(id: string, reason?: string) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }

    // 查询工作流实例
    const workflowInstance = await prisma.workflowInstance.findUnique({
      where: { id },
      include: {
        workflow: true,
      },
    });

    if (!workflowInstance) {
      throw new Error("工作流实例不存在");
    }

    // 检查工作流实例状态
    if (workflowInstance.status !== "pending") {
      throw new Error("工作流实例已完成或已取消");
    }

    // 检查是否是发起人或管理员
    if (workflowInstance.initiatedBy !== currentUser.id && currentUser.role !== "admin") {
      throw new Error("您没有权限取消此工作流实例");
    }

    // 更新工作流实例状态
    const updatedWorkflowInstance = await prisma.workflowInstance.update({
      where: { id },
      data: {
        status: "canceled",
        completedAt: new Date(),
        notes: reason ? `${workflowInstance.notes || ""}\n取消原因: ${reason}` : workflowInstance.notes,
      },
    });

    // 记录审计日志
    await logEntityUpdate(
      "system",
      id,
      { status: workflowInstance.status },
      { status: "canceled" },
      `取消工作流实例 - ${workflowInstance.workflow.name}`
    );

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return updatedWorkflowInstance;
  } catch (error) {
    console.error("取消工作流实例失败:", error);
    throw new Error(error instanceof Error ? error.message : "取消工作流实例失败");
  }
}

/**
 * 获取工作流实例列表
 *
 * @param status 可选的状态过滤
 * @param entityType 可选的实体类型过滤
 * @param entityId 可选的实体ID过滤
 * @returns 工作流实例列表
 */
export async function getWorkflowInstances(status?: WorkflowStatus, entityType?: string, entityId?: string) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }

    // 构建查询条件
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (entityType) {
      where.workflow = {
        entityType,
      };
    }

    // 查询工作流实例列表
    const workflowInstances = await prisma.workflowInstance.findMany({
      where,
      include: {
        workflow: true,
        approvals: {
          include: {
            workflowStep: true,
          },
          orderBy: {
            workflowStep: {
              stepNumber: "asc",
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return workflowInstances;
  } catch (error) {
    console.error("获取工作流实例列表失败:", error);
    throw new Error("获取工作流实例列表失败");
  }
}

/**
 * 获取工作流实例详情
 *
 * @param id 工作流实例ID
 * @returns 工作流实例详情
 */
export async function getWorkflowInstance(id: string): Promise<any>;
/**
 * 获取与特定实体关联的工作流实例
 *
 * @param entityType 实体类型
 * @param entityId 实体ID
 * @returns 工作流实例详情
 */
export async function getWorkflowInstance(entityType: string, entityId: string): Promise<any>;
export async function getWorkflowInstance(idOrEntityType: string, entityId?: string) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }

    let workflowInstance;

    if (entityId) {
      // 通过实体类型和ID查询
      workflowInstance = await prisma.workflowInstance.findFirst({
        where: {
          entityType: idOrEntityType,
          entityId: entityId
        },
        include: {
          workflow: {
            include: {
              steps: {
                orderBy: { stepNumber: "asc" },
              },
            },
          },
          approvals: {
            include: {
              workflowStep: true,
            },
            orderBy: {
              workflowStep: {
                stepNumber: "asc",
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc"
        }
      });
    } else {
      // 通过实例ID查询
      workflowInstance = await prisma.workflowInstance.findUnique({
        where: { id: idOrEntityType },
        include: {
          workflow: {
            include: {
              steps: {
                orderBy: { stepNumber: "asc" },
              },
            },
          },
          approvals: {
            include: {
              workflowStep: true,
            },
            orderBy: {
              workflowStep: {
                stepNumber: "asc",
              },
            },
          },
        },
      });

      if (!workflowInstance) {
        throw new Error("工作流实例不存在");
      }
    }

    return workflowInstance;
  } catch (error) {
    console.error("获取工作流实例详情失败:", error);
    if (entityId) {
      // 如果是通过实体查询，找不到不抛出错误
      return null;
    }
    throw new Error("获取工作流实例详情失败");
  }
}

/**
 * 获取待我审批的工作流实例列表
 *
 * @returns 待审批的工作流实例列表
 */
export async function getMyPendingApprovals() {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }

    // 查询待审批的工作流实例
    const pendingApprovals = await prisma.workflowApproval.findMany({
      where: {
        approverId: currentUser.id,
        status: "pending",
        workflowInstance: {
          status: "pending",
        },
      },
      include: {
        workflowInstance: {
          include: {
            workflow: true,
          },
        },
        workflowStep: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return pendingApprovals;
  } catch (error) {
    console.error("获取待审批工作流实例列表失败:", error);
    throw new Error("获取待审批工作流实例列表失败");
  }
}

/**
 * 获取我发起的工作流实例列表
 *
 * @param status 可选的状态过滤
 * @returns 我发起的工作流实例列表
 */
export async function getMyWorkflowInstances(status?: WorkflowStatus) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }

    // 构建查询条件
    const where: any = {
      initiatedBy: currentUser.id,
    };

    if (status) {
      where.status = status;
    }

    // 查询工作流实例列表
    const workflowInstances = await prisma.workflowInstance.findMany({
      where,
      include: {
        workflow: true,
        approvals: {
          include: {
            workflowStep: true,
          },
          orderBy: {
            workflowStep: {
              stepNumber: "asc",
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return workflowInstances;
  } catch (error) {
    console.error("获取我发起的工作流实例列表失败:", error);
    throw new Error("获取我发起的工作流实例列表失败");
  }
}

/**
 * 创建工作流步骤
 *
 * @param params 创建工作流步骤参数
 * @returns 创建的工作流步骤
 */
export async function createWorkflowStep(params: CreateWorkflowStepParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询工作流
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.workflowId },
      include: {
        steps: true,
      },
    });

    if (!workflow) {
      throw new Error("工作流不存在");
    }

    // 创建工作流步骤
    const workflowStep = await prisma.workflowStep.create({
      data: {
        workflowId: params.workflowId,
        name: params.name,
        description: params.description,
        stepNumber: params.stepNumber,
        approverType: params.approverType,
        approverId: params.approverId,
        isRequired: params.isRequired !== undefined ? params.isRequired : true,
      },
    });

    // 记录审计日志
    await logEntityCreation("system", workflowStep.id.toString(), workflowStep, "创建工作流步骤");

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return workflowStep;
  } catch (error) {
    console.error("创建工作流步骤失败:", error);
    throw new Error(error instanceof Error ? error.message : "创建工作流步骤失败");
  }
}

/**
 * 更新工作流步骤
 *
 * @param params 更新工作流步骤参数
 * @returns 更新的工作流步骤
 */
export async function updateWorkflowStep(params: UpdateWorkflowStepParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询工作流步骤
    const workflowStep = await prisma.workflowStep.findUnique({
      where: { id: params.id },
    });

    if (!workflowStep) {
      throw new Error("工作流步骤不存在");
    }

    // 更新工作流步骤
    const updatedWorkflowStep = await prisma.workflowStep.update({
      where: { id: params.id },
      data: {
        name: params.name,
        description: params.description,
        stepNumber: params.stepNumber,
        approverType: params.approverType,
        approverId: params.approverId,
        isRequired: params.isRequired,
      },
    });

    // 记录审计日志
    await logEntityUpdate(
      "system",
      updatedWorkflowStep.id.toString(),
      workflowStep,
      updatedWorkflowStep,
      "更新工作流步骤"
    );

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return updatedWorkflowStep;
  } catch (error) {
    console.error("更新工作流步骤失败:", error);
    throw new Error(error instanceof Error ? error.message : "更新工作流步骤失败");
  }
}

/**
 * 删除工作流步骤
 *
 * @param id 工作流步骤ID
 * @returns 删除的工作流步骤
 */
export async function deleteWorkflowStep(id: number) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询工作流步骤
    const workflowStep = await prisma.workflowStep.findUnique({
      where: { id },
      include: {
        workflow: {
          include: {
            instances: {
              where: {
                status: "pending",
              },
            },
          },
        },
      },
    });

    if (!workflowStep) {
      throw new Error("工作流步骤不存在");
    }

    // 检查是否有正在进行的工作流实例
    if (workflowStep.workflow.instances && workflowStep.workflow.instances.length > 0) {
      throw new Error("无法删除有正在进行的工作流实例的步骤");
    }

    // 删除工作流步骤
    const deletedWorkflowStep = await prisma.workflowStep.delete({
      where: { id },
    });

    // 记录审计日志
    await logEntityDeletion(
      "system",
      deletedWorkflowStep.id.toString(),
      workflowStep,
      "删除工作流步骤"
    );

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return deletedWorkflowStep;
  } catch (error) {
    console.error("删除工作流步骤失败:", error);
    throw new Error(error instanceof Error ? error.message : "删除工作流步骤失败");
  }
}

/**
 * 上移工作流步骤
 *
 * @param id 工作流步骤ID
 * @returns 更新的工作流步骤
 */
export async function moveWorkflowStepUp(id: number) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询工作流步骤
    const workflowStep = await prisma.workflowStep.findUnique({
      where: { id },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { stepNumber: "asc" },
            },
          },
        },
      },
    });

    if (!workflowStep) {
      throw new Error("工作流步骤不存在");
    }

    const currentStepNumber = workflowStep.stepNumber;
    const steps = workflowStep.workflow.steps;

    // 找到上一个步骤
    const previousStep = steps.find(step => step.stepNumber === currentStepNumber - 1);
    if (!previousStep) {
      throw new Error("已经是第一个步骤");
    }

    // 交换步骤顺序
    await prisma.$transaction([
      prisma.workflowStep.update({
        where: { id: workflowStep.id },
        data: { stepNumber: previousStep.stepNumber },
      }),
      prisma.workflowStep.update({
        where: { id: previousStep.id },
        data: { stepNumber: currentStepNumber },
      }),
    ]);

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return workflowStep;
  } catch (error) {
    console.error("上移工作流步骤失败:", error);
    throw new Error(error instanceof Error ? error.message : "上移工作流步骤失败");
  }
}

/**
 * 下移工作流步骤
 *
 * @param id 工作流步骤ID
 * @returns 更新的工作流步骤
 */
export async function moveWorkflowStepDown(id: number) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }

    // 查询工作流步骤
    const workflowStep = await prisma.workflowStep.findUnique({
      where: { id },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { stepNumber: "asc" },
            },
          },
        },
      },
    });

    if (!workflowStep) {
      throw new Error("工作流步骤不存在");
    }

    const currentStepNumber = workflowStep.stepNumber;
    const steps = workflowStep.workflow.steps;

    // 找到下一个步骤
    const nextStep = steps.find(step => step.stepNumber === currentStepNumber + 1);
    if (!nextStep) {
      throw new Error("已经是最后一个步骤");
    }

    // 交换步骤顺序
    await prisma.$transaction([
      prisma.workflowStep.update({
        where: { id: workflowStep.id },
        data: { stepNumber: nextStep.stepNumber },
      }),
      prisma.workflowStep.update({
        where: { id: nextStep.id },
        data: { stepNumber: currentStepNumber },
      }),
    ]);

    // 重新验证工作流页面
    revalidatePath("/workflows");

    return workflowStep;
  } catch (error) {
    console.error("下移工作流步骤失败:", error);
    throw new Error(error instanceof Error ? error.message : "下移工作流步骤失败");
  }
}