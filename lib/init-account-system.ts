"use server";

import prisma from "@/lib/db"
import { PERMISSION_MODULES } from "@/config/permissions"
import { ensureSuperAdminPermissions } from "@/lib/auth-utils"

// 初始化账号管理系统
export async function initAccountSystem() {
  try {
    console.log("开始初始化账号管理系统...")

    // 检查是否已经初始化
    const existingRoles = await prisma.role.count()
    if (existingRoles > 0) {
      console.log("账号管理系统已初始化，跳过初始化过程")
      return
    }

    // 创建默认角色
    const roles = [
      {
        name: "超级管理员",
        code: "super_admin",
        description: "系统超级管理员，拥有所有权限",
        isSystem: true,
      },
      {
        name: "管理员",
        code: "admin",
        description: "系统管理员，拥有大部分管理权限",
        isSystem: true,
      },
      {
        name: "经理",
        code: "manager",
        description: "部门经理，拥有部门管理权限",
        isSystem: true,
      },
      {
        name: "员工",
        code: "employee",
        description: "普通员工，拥有基本操作权限",
        isSystem: true,
      },
      {
        name: "财务",
        code: "finance",
        description: "财务人员，拥有财务相关权限",
        isSystem: true,
      },
      {
        name: "销售",
        code: "sales",
        description: "销售人员，拥有销售相关权限",
        isSystem: true,
      },
      {
        name: "库存管理员",
        code: "inventory",
        description: "库存管理员，拥有库存相关权限",
        isSystem: true,
      },
    ]

    console.log("创建默认角色...")
    for (const role of roles) {
      await prisma.role.create({
        data: role,
      })
    }

    // 创建权限
    console.log("创建系统权限...")
    const permissions = []

    // 从PERMISSION_MODULES生成权限
    for (const module of PERMISSION_MODULES) {
      const moduleCode = module.code
      const modulePermissions = module.permissions.map(permission => ({
        name: permission.name,
        code: `${moduleCode}.${permission.code}`,
        module: moduleCode,
        description: permission.description,
      }))

      permissions.push(...modulePermissions)
    }

    // 批量创建权限
    await prisma.permission.createMany({
      data: permissions,
      skipDuplicates: true,
    })

    // 获取所有角色和权限
    const allRoles = await prisma.role.findMany()
    const allPermissions = await prisma.permission.findMany()

    // 为超级管理员分配所有权限
    console.log("为超级管理员分配所有权限...")
    const superAdminRole = allRoles.find(role => role.code === "super_admin")
    if (superAdminRole) {
      const superAdminPermissions = allPermissions.map(permission => ({
        roleId: superAdminRole.id,
        permissionId: permission.id,
      }))

      await prisma.rolePermission.createMany({
        data: superAdminPermissions,
        skipDuplicates: true,
      })
    }

    // 为管理员分配大部分权限（除了系统设置和权限管理）
    console.log("为管理员分配权限...")
    const adminRole = allRoles.find(role => role.code === "admin")
    if (adminRole) {
      const adminPermissions = allPermissions
        .filter(permission => !permission.code.startsWith("system.") && !permission.code.startsWith("permissions."))
        .map(permission => ({
          roleId: adminRole.id,
          permissionId: permission.id,
        }))

      await prisma.rolePermission.createMany({
        data: adminPermissions,
        skipDuplicates: true,
      })
    }

    // 为其他角色分配相关权限
    console.log("为其他角色分配权限...")

    // 经理权限
    const managerRole = allRoles.find(role => role.code === "manager")
    if (managerRole) {
      const managerPermissions = allPermissions
        .filter(permission =>
          permission.code.startsWith("employees.") ||
          permission.code.startsWith("schedule.") ||
          permission.code.startsWith("reports.view")
        )
        .map(permission => ({
          roleId: managerRole.id,
          permissionId: permission.id,
        }))

      await prisma.rolePermission.createMany({
        data: managerPermissions,
        skipDuplicates: true,
      })
    }

    // 财务权限
    const financeRole = allRoles.find(role => role.code === "finance")
    if (financeRole) {
      const financePermissions = allPermissions
        .filter(permission =>
          permission.code.startsWith("finance.") ||
          permission.code.startsWith("reports.view") ||
          permission.code.startsWith("salary.")
        )
        .map(permission => ({
          roleId: financeRole.id,
          permissionId: permission.id,
        }))

      await prisma.rolePermission.createMany({
        data: financePermissions,
        skipDuplicates: true,
      })
    }

    // 销售权限
    const salesRole = allRoles.find(role => role.code === "sales")
    if (salesRole) {
      const salesPermissions = allPermissions
        .filter(permission =>
          permission.code.startsWith("sales.") ||
          permission.code.startsWith("customers.") ||
          permission.code.startsWith("channels.")
        )
        .map(permission => ({
          roleId: salesRole.id,
          permissionId: permission.id,
        }))

      await prisma.rolePermission.createMany({
        data: salesPermissions,
        skipDuplicates: true,
      })
    }

    // 库存管理员权限
    const inventoryRole = allRoles.find(role => role.code === "inventory")
    if (inventoryRole) {
      const inventoryPermissions = allPermissions
        .filter(permission =>
          permission.code.startsWith("inventory.") ||
          permission.code.startsWith("products.view") ||
          permission.code.startsWith("purchase.")
        )
        .map(permission => ({
          roleId: inventoryRole.id,
          permissionId: permission.id,
        }))

      await prisma.rolePermission.createMany({
        data: inventoryPermissions,
        skipDuplicates: true,
      })
    }

    console.log("账号管理系统初始化完成")

    // 确保超级管理员拥有所有权限
    await ensureSuperAdminPermissions()
  } catch (error) {
    console.error("初始化账号管理系统失败:", error)
    throw error
  }
}
