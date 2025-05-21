"use server";

import prisma from "@/lib/db";

/**
 * 检查用户是否拥有超级管理员权限
 * 
 * @param userId 用户ID
 * @returns 是否拥有超级管理员权限
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // 检查用户是否是超级管理员邮箱
    if (user.email === "admin@linghua.com") {
      return true;
    }

    // 检查用户是否有超级管理员角色
    const hasSuperAdminRole = user.userRoles.some(
      (userRole) => userRole.role.code === "super_admin"
    );

    if (hasSuperAdminRole) {
      return true;
    }

    // 兼容旧版本：检查用户角色是否为 admin
    if (user.role === "admin") {
      return true;
    }

    return false;
  } catch (error) {
    console.error("检查超级管理员权限失败:", error);
    return false;
  }
}

/**
 * 检查用户是否拥有指定权限
 * 
 * @param userId 用户ID
 * @param permissionCode 权限代码
 * @returns 是否拥有指定权限
 */
export async function hasPermission(userId: string, permissionCode: string): Promise<boolean> {
  try {
    // 首先检查是否是超级管理员
    const superAdmin = await isSuperAdmin(userId);
    if (superAdmin) {
      return true;
    }

    // 获取用户角色
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // 检查用户角色是否拥有指定权限
    for (const userRole of userRoles) {
      const hasPermission = userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.code === permissionCode
      );
      if (hasPermission) {
        return true;
      }
    }

    // 基本权限检查 - 所有用户都有的基本权限
    if (
      permissionCode === "products.view" ||
      permissionCode === "inventory.view" ||
      permissionCode === "employees.view"
    ) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("检查权限失败:", error);
    return false;
  }
}

/**
 * 确保超级管理员拥有所有权限
 * 
 * 此函数会检查超级管理员角色是否拥有所有权限，如果没有，会添加缺失的权限
 */
export async function ensureSuperAdminPermissions(): Promise<void> {
  try {
    // 获取超级管理员角色
    const superAdminRole = await prisma.role.findFirst({
      where: { code: "super_admin" },
    });

    if (!superAdminRole) {
      console.error("超级管理员角色不存在");
      return;
    }

    // 获取所有权限
    const allPermissions = await prisma.permission.findMany();

    // 获取超级管理员已有的权限
    const existingPermissions = await prisma.rolePermission.findMany({
      where: { roleId: superAdminRole.id },
      select: { permissionId: true },
    });

    const existingPermissionIds = existingPermissions.map((p) => p.permissionId);

    // 找出缺失的权限
    const missingPermissions = allPermissions.filter(
      (permission) => !existingPermissionIds.includes(permission.id)
    );

    if (missingPermissions.length === 0) {
      console.log("超级管理员已拥有所有权限");
      return;
    }

    // 添加缺失的权限
    await prisma.rolePermission.createMany({
      data: missingPermissions.map((permission) => ({
        roleId: superAdminRole.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    console.log(`已为超级管理员添加 ${missingPermissions.length} 个缺失的权限`);
  } catch (error) {
    console.error("确保超级管理员权限失败:", error);
  }
}
