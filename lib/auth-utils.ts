"use server";

import prisma from "@/lib/db";

/**
 * 获取当前登录用户信息
 *
 * 获取当前登录用户的详细信息，包括用户设置和角色。
 *
 * @returns 当前登录用户信息
 */
export async function getCurrentUser() {
  try {
    // 从会话中获取当前用户信息 - 使用动态导入避免循环依赖
    // 使用更健壮的导入方式
    let auth;
    try {
      // 确保在服务器端环境中执行
      if (typeof window === 'undefined') {
        const authModule = await import("@/auth");
        auth = authModule.auth;
      } else {
        console.error("getCurrentUser 应该只在服务器端调用");
        return null;
      }
    } catch (e) {
      console.error("Failed to import auth module:", e);
      return null;
    }

    if (!auth) {
      console.error("认证模块加载失败");
      return null;
    }

    // 在服务器端安全地调用 auth() 函数
    let session;
    try {
      session = await auth();
    } catch (e) {
      console.error("获取会话失败:", e);
      return null;
    }

    if (!session || !session.user || !session.user.id) {
      // 未登录不是错误，而是正常的状态
      return null;
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      // 如果用户不存在，返回会话中的基本信息
      return {
        id: session.user.id,
        name: session.user.name || "用户",
        email: session.user.email,
        role: "user",
        userRoles: [],
        userSettings: {
          theme: "light",
          language: "zh-CN",
          enableNotifications: true
        }
      };
    }

    return user;
  } catch (error) {
    console.error("获取当前用户失败:", error);
    return null;
  }
}

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
