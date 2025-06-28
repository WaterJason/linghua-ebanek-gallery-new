import prisma from "@/lib/db"

// 采购权限类型
export type PurchasePermission = 
  | "purchase_create"      // 创建采购订单
  | "purchase_edit"        // 编辑采购订单
  | "purchase_delete"      // 删除采购订单
  | "purchase_approve_l1"  // 一级审批权限
  | "purchase_approve_l2"  // 二级审批权限
  | "purchase_approve_l3"  // 三级审批权限
  | "purchase_receive"     // 到货验收权限
  | "purchase_payment"     // 付款权限
  | "purchase_view_all"    // 查看所有采购订单
  | "purchase_import"      // 批量导入权限
  | "purchase_export"      // 导出权限

// 权限级别
export type PermissionLevel = "none" | "own" | "department" | "all"

// 用户权限信息
export interface UserPermissions {
  userId: string
  userName: string
  email: string
  roles: Array<{
    id: number
    code: string
    name: string
  }>
  permissions: PurchasePermission[]
  approvalLevel: number // 0: 无审批权限, 1-3: 审批级别
  maxApprovalAmount: number // 最大审批金额
  departmentId?: number
  isAdmin: boolean
}

// 权限检查结果
export interface PermissionCheckResult {
  hasPermission: boolean
  reason?: string
  level: PermissionLevel
  maxAmount?: number
}

// 获取用户采购权限
export async function getUserPurchasePermissions(userId: string): Promise<UserPermissions> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      // 检查是否为系统管理员账户
      if (userId === "admin" || userId === "1") {
        console.log("🔓 检测到系统管理员账户，授予所有权限")
        return {
          userId: userId,
          userName: "系统管理员",
          email: "admin@linghua.com",
          roles: [{ id: 1, code: "super_admin", name: "超级管理员" }],
          permissions: [
            "purchase_create", "purchase_edit", "purchase_delete", "purchase_view_all",
            "purchase_approve_l1", "purchase_approve_l2", "purchase_approve_l3",
            "purchase_receive", "purchase_payment", "purchase_import", "purchase_export"
          ],
          approvalLevel: 3,
          maxApprovalAmount: Number.MAX_SAFE_INTEGER,
          departmentId: null,
          isAdmin: true
        }
      }

      console.warn(`⚠️ 用户不存在: ${userId}`)
      throw new Error("用户不存在")
    }

    // 检查是否为超级管理员
    const isAdmin = user.email === "admin@linghua.com" || 
                   user.userRoles.some(ur => ur.role.code === "super_admin")

    // 收集所有权限
    const allPermissions = new Set<string>()
    user.userRoles.forEach(userRole => {
      userRole.role.permissions.forEach(permission => {
        allPermissions.add(permission.code)
      })
    })

    // 映射采购相关权限
    const purchasePermissions: PurchasePermission[] = []
    let approvalLevel = 0
    let maxApprovalAmount = 0

    // 基础权限映射
    if (allPermissions.has("purchase_create") || isAdmin) {
      purchasePermissions.push("purchase_create")
    }
    if (allPermissions.has("purchase_edit") || isAdmin) {
      purchasePermissions.push("purchase_edit")
    }
    if (allPermissions.has("purchase_delete") || isAdmin) {
      purchasePermissions.push("purchase_delete")
    }
    if (allPermissions.has("purchase_receive") || isAdmin) {
      purchasePermissions.push("purchase_receive")
    }
    if (allPermissions.has("purchase_payment") || isAdmin) {
      purchasePermissions.push("purchase_payment")
    }
    if (allPermissions.has("purchase_import") || isAdmin) {
      purchasePermissions.push("purchase_import")
    }
    if (allPermissions.has("purchase_export") || isAdmin) {
      purchasePermissions.push("purchase_export")
    }
    if (allPermissions.has("purchase_view_all") || isAdmin) {
      purchasePermissions.push("purchase_view_all")
    }

    // 审批权限和金额限制
    if (isAdmin) {
      approvalLevel = 3
      maxApprovalAmount = Number.MAX_SAFE_INTEGER
      purchasePermissions.push("purchase_approve_l1", "purchase_approve_l2", "purchase_approve_l3")
    } else {
      // 根据角色确定审批级别
      const roles = user.userRoles.map(ur => ur.role.code)
      
      if (roles.includes("finance_director") || roles.includes("general_manager")) {
        approvalLevel = 3
        maxApprovalAmount = 100000 // 10万
        purchasePermissions.push("purchase_approve_l3")
      } else if (roles.includes("department_manager") || roles.includes("purchase_manager")) {
        approvalLevel = 2
        maxApprovalAmount = 50000 // 5万
        purchasePermissions.push("purchase_approve_l2")
      } else if (roles.includes("purchase_supervisor") || roles.includes("team_leader")) {
        approvalLevel = 1
        maxApprovalAmount = 10000 // 1万
        purchasePermissions.push("purchase_approve_l1")
      }
    }

    return {
      userId: user.id,
      userName: user.name || user.email || "未知用户",
      email: user.email || "",
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        code: ur.role.code,
        name: ur.role.name
      })),
      permissions: purchasePermissions,
      approvalLevel,
      maxApprovalAmount,
      departmentId: user.departmentId,
      isAdmin
    }

  } catch (error) {
    console.error("❌ 获取用户采购权限失败:", error)
    throw error
  }
}

// 检查用户是否有指定权限
export async function checkUserPermission(
  userId: string, 
  permission: PurchasePermission,
  resourceId?: number,
  amount?: number
): Promise<PermissionCheckResult> {
  try {
    const userPermissions = await getUserPurchasePermissions(userId)

    // 超级管理员拥有所有权限
    if (userPermissions.isAdmin) {
      return {
        hasPermission: true,
        level: "all",
        maxAmount: Number.MAX_SAFE_INTEGER
      }
    }

    // 检查基础权限
    if (!userPermissions.permissions.includes(permission)) {
      return {
        hasPermission: false,
        reason: "用户没有此权限",
        level: "none"
      }
    }

    // 检查审批权限和金额限制
    if (permission.startsWith("purchase_approve_") && amount) {
      if (amount > userPermissions.maxApprovalAmount) {
        return {
          hasPermission: false,
          reason: `审批金额超过限制，最大可审批金额: ¥${userPermissions.maxApprovalAmount}`,
          level: "own",
          maxAmount: userPermissions.maxApprovalAmount
        }
      }
    }

    // 检查资源访问权限
    if (resourceId && permission === "purchase_view_all") {
      // 如果有查看所有权限，直接允许
      return {
        hasPermission: true,
        level: "all"
      }
    }

    // 检查是否只能访问自己创建的资源
    if (resourceId && !userPermissions.permissions.includes("purchase_view_all")) {
      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: resourceId },
        select: { employeeId: true }
      })

      // 修复用户ID类型匹配问题
      const userIdAsNumber = parseInt(userId)
      if (purchaseOrder && purchaseOrder.employeeId !== userIdAsNumber) {
        return {
          hasPermission: false,
          reason: "只能访问自己创建的采购订单",
          level: "own"
        }
      }
    }

    return {
      hasPermission: true,
      level: userPermissions.permissions.includes("purchase_view_all") ? "all" : "own",
      maxAmount: userPermissions.maxApprovalAmount
    }

  } catch (error) {
    console.error("❌ 检查用户权限失败:", error)
    return {
      hasPermission: false,
      reason: "权限检查失败",
      level: "none"
    }
  }
}

// 检查审批权限
export async function checkApprovalPermission(
  userId: string,
  purchaseOrderId: number,
  requiredLevel: number
): Promise<PermissionCheckResult> {
  try {
    const userPermissions = await getUserPurchasePermissions(userId)

    // 超级管理员拥有所有审批权限
    if (userPermissions.isAdmin) {
      return {
        hasPermission: true,
        level: "all"
      }
    }

    // 检查审批级别
    if (userPermissions.approvalLevel < requiredLevel) {
      return {
        hasPermission: false,
        reason: `需要 ${requiredLevel} 级审批权限，当前用户为 ${userPermissions.approvalLevel} 级`,
        level: "none"
      }
    }

    // 获取采购订单信息检查金额
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: { totalAmount: true, employeeId: true }
    })

    if (!purchaseOrder) {
      return {
        hasPermission: false,
        reason: "采购订单不存在",
        level: "none"
      }
    }

    // 检查金额限制
    if (purchaseOrder.totalAmount > userPermissions.maxApprovalAmount) {
      return {
        hasPermission: false,
        reason: `订单金额 ¥${purchaseOrder.totalAmount} 超过审批限额 ¥${userPermissions.maxApprovalAmount}`,
        level: "own",
        maxAmount: userPermissions.maxApprovalAmount
      }
    }

    // 检查是否为自己创建的订单（通常不能自己审批自己的订单）
    // 修复用户ID类型匹配问题
    const userIdAsNumber = parseInt(userId)
    if (purchaseOrder.employeeId === userIdAsNumber) {
      return {
        hasPermission: false,
        reason: "不能审批自己创建的采购订单",
        level: "own"
      }
    }

    return {
      hasPermission: true,
      level: "all",
      maxAmount: userPermissions.maxApprovalAmount
    }

  } catch (error) {
    console.error("❌ 检查审批权限失败:", error)
    return {
      hasPermission: false,
      reason: "权限检查失败",
      level: "none"
    }
  }
}

// 获取用户可访问的采购订单查询条件
export async function getUserPurchaseOrderFilter(userId: string): Promise<any> {
  try {
    const userPermissions = await getUserPurchasePermissions(userId)

    // 超级管理员或有查看所有权限的用户
    if (userPermissions.isAdmin || userPermissions.permissions.includes("purchase_view_all")) {
      return {} // 无限制
    }

    // 只能查看自己创建的订单
    // 确保用户ID转换为数字类型
    const userIdAsNumber = parseInt(userId)
    if (isNaN(userIdAsNumber)) {
      console.warn(`⚠️ 无效的用户ID: ${userId}`)
      return {
        employeeId: -1 // 返回无效ID，确保查询不到任何结果
      }
    }

    return {
      employeeId: userIdAsNumber
    }

  } catch (error) {
    console.error("❌ 获取用户采购订单过滤条件失败:", error)
    return {
      employeeId: parseInt(userId) // 默认只能查看自己的
    }
  }
}

// 获取下一级审批人
export async function getNextApprover(currentLevel: number, amount: number): Promise<string[]> {
  try {
    const nextLevel = currentLevel + 1
    let roleCode = ""

    switch (nextLevel) {
      case 1:
        roleCode = "purchase_supervisor"
        break
      case 2:
        roleCode = "department_manager"
        break
      case 3:
        roleCode = "finance_director"
        break
      default:
        return []
    }

    // 查找具有指定角色的用户
    const users = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              code: roleCode
            }
          }
        }
      },
      select: { id: true }
    })

    // 过滤出有足够审批金额权限的用户
    const approvers = []
    for (const user of users) {
      const permissions = await getUserPurchasePermissions(user.id)
      if (permissions.maxApprovalAmount >= amount) {
        approvers.push(user.id)
      }
    }

    return approvers

  } catch (error) {
    console.error("❌ 获取下一级审批人失败:", error)
    return []
  }
}
