"use server"

import prisma from "@/lib/db"

/**
 * 初始化权限系统
 * 创建基本的角色和权限
 */
export async function initializePermissions() {
  try {
    console.log("开始初始化权限系统...")

    // 创建基本权限
    const permissions = [
      // 员工管理权限
      { name: "查看员工", code: "employees.view", module: "employees" },
      { name: "创建员工", code: "employees.create", module: "employees" },
      { name: "编辑员工", code: "employees.edit", module: "employees" },
      { name: "删除员工", code: "employees.delete", module: "employees" },
      
      // 产品管理权限
      { name: "查看产品", code: "products.view", module: "products" },
      { name: "创建产品", code: "products.create", module: "products" },
      { name: "编辑产品", code: "products.edit", module: "products" },
      { name: "删除产品", code: "products.delete", module: "products" },
      
      // 销售管理权限
      { name: "查看销售", code: "sales.view", module: "sales" },
      { name: "创建销售", code: "sales.create", module: "sales" },
      { name: "编辑销售", code: "sales.edit", module: "sales" },
      { name: "删除销售", code: "sales.delete", module: "sales" },
      
      // 库存管理权限
      { name: "查看库存", code: "inventory.view", module: "inventory" },
      { name: "管理库存", code: "inventory.manage", module: "inventory" },
      
      // 财务管理权限
      { name: "查看财务", code: "finance.view", module: "finance" },
      { name: "管理财务", code: "finance.manage", module: "finance" },
      
      // 系统管理权限
      { name: "系统设置", code: "system.settings", module: "system" },
      { name: "用户管理", code: "users.manage", module: "system" },
      { name: "角色管理", code: "roles.manage", module: "system" },
      
      // 超级权限
      { name: "所有权限", code: "*", module: "system" },
    ]

    // 批量创建权限（如果不存在）
    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: perm
      })
    }

    // 创建基本角色
    const adminRole = await prisma.role.upsert({
      where: { code: "admin" },
      update: {},
      create: {
        name: "超级管理员",
        code: "admin",
        description: "拥有所有权限的超级管理员",
        isSystem: true
      }
    })

    const employeeRole = await prisma.role.upsert({
      where: { code: "employee" },
      update: {},
      create: {
        name: "员工",
        code: "employee", 
        description: "普通员工角色",
        isSystem: true
      }
    })

    const managerRole = await prisma.role.upsert({
      where: { code: "manager" },
      update: {},
      create: {
        name: "经理",
        code: "manager",
        description: "部门经理角色",
        isSystem: true
      }
    })

    // 为超级管理员分配所有权限
    const allPermissions = await prisma.permission.findMany()
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      })
    }

    // 为员工角色分配基本权限
    const employeePermissions = await prisma.permission.findMany({
      where: {
        code: {
          in: [
            "employees.view",
            "products.view", 
            "sales.view",
            "inventory.view",
            "finance.view"
          ]
        }
      }
    })

    for (const permission of employeePermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: employeeRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: employeeRole.id,
          permissionId: permission.id
        }
      })
    }

    // 为经理角色分配管理权限
    const managerPermissions = await prisma.permission.findMany({
      where: {
        code: {
          in: [
            "employees.view", "employees.create", "employees.edit",
            "products.view", "products.create", "products.edit",
            "sales.view", "sales.create", "sales.edit",
            "inventory.view", "inventory.manage",
            "finance.view", "finance.manage"
          ]
        }
      }
    })

    for (const permission of managerPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: permission.id
        }
      })
    }

    // 确保admin@linghua.com用户有管理员角色
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@linghua.com" }
    })

    if (adminUser) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: adminRole.id
          }
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      })
      console.log(`已为用户 ${adminUser.email} 分配管理员角色`)
    }

    // 为所有现有用户分配默认员工角色（如果没有角色）
    const usersWithoutRoles = await prisma.user.findMany({
      where: {
        userRoles: {
          none: {}
        }
      }
    })

    for (const user of usersWithoutRoles) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: employeeRole.id
        }
      })
      console.log(`已为用户 ${user.email} 分配员工角色`)
    }

    console.log("权限系统初始化完成")
    return {
      success: true,
      message: "权限系统初始化完成",
      stats: {
        permissions: permissions.length,
        roles: 3,
        usersUpdated: usersWithoutRoles.length + (adminUser ? 1 : 0)
      }
    }

  } catch (error) {
    console.error("权限系统初始化失败:", error)
    throw new Error(error instanceof Error ? error.message : "权限系统初始化失败")
  }
}

/**
 * 检查权限系统状态
 */
export async function checkPermissionSystemStatus() {
  try {
    const [permissionCount, roleCount, userRoleCount] = await Promise.all([
      prisma.permission.count(),
      prisma.role.count(),
      prisma.userRole.count()
    ])

    return {
      permissions: permissionCount,
      roles: roleCount,
      userRoles: userRoleCount,
      isInitialized: permissionCount > 0 && roleCount > 0
    }
  } catch (error) {
    console.error("检查权限系统状态失败:", error)
    return {
      permissions: 0,
      roles: 0,
      userRoles: 0,
      isInitialized: false
    }
  }
}
