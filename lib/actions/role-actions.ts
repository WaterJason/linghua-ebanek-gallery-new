/**
 * 角色管理模块
 *
 * 本模块提供角色管理相关的功能，包括角色的增删改查、角色权限管理等。
 *
 * @module 角色管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaRole,
  PrismaPermission,
  PrismaRolePermission,
  CreateRoleInput,
  UpdateRoleInput
} from "@/types/prisma-models";
import {
  validateCreateRole,
  validateUpdateRole
} from "@/lib/validation";
import { findRecord, findRecords, createRecord, updateRecord } from "@/lib/prisma-wrapper";

/**
 * 获取所有角色
 *
 * 获取所有角色，包括用户数量信息。如果角色表为空，会尝试初始化账号管理系统。
 *
 * @returns 角色列表，包含用户数量信息
 *
 * @example
 * ```typescript
 * // 获取所有角色
 * const roles = await getRoles();
 * console.log(roles[0].name); // 输出第一个角色的名称
 * console.log(roles[0].userCount); // 输出第一个角色的用户数量
 * ```
 *
 * @category 查询
 */
export async function getRoles(): Promise<(PrismaRole & { userCount: number })[]> {
  try {
    // 检查角色表是否为空，如果为空则尝试初始化
    const roleCount = await prisma.role.count();
    if (roleCount === 0) {
      console.log("角色表为空，尝试初始化账号管理系统...");
      try {
        // 动态导入初始化函数，避免循环依赖
        const { initAccountSystem } = await import("../init-account-system");
        await initAccountSystem();
        console.log("账号管理系统初始化成功");
      } catch (initError) {
        console.error("初始化账号管理系统失败:", initError);
        // 即使初始化失败，也继续尝试获取角色列表
      }
    }

    // 使用类型安全的包装函数获取角色
    const roles = await findRecords('role', {
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    // 格式化返回数据
    return roles.map(role => ({
      ...(role as PrismaRole),
      userCount: role._count.userRoles,
    }));
  } catch (error) {
    console.error("获取角色失败:", error);
    // 返回空数组而不是抛出错误，以便前端可以优雅地处理
    return [];
  }
}

/**
 * 获取单个角色
 */
export async function getRole(id: number) {
  try {
    // 获取角色
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      throw new Error("角色不存在");
    }

    // 格式化返回数据
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.userRoles,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  } catch (error) {
    console.error("获取角色失败:", error);
    throw new Error("获取角色失败");
  }
}

/**
 * 创建角色
 *
 * 创建新的角色记录，并可选择分配权限。
 *
 * @param data - 角色创建数据
 * @returns 创建的角色
 *
 * @example
 * ```typescript
 * // 创建新角色
 * const role = await createRole({
 *   name: '销售经理',
 *   code: 'sales_manager',
 *   description: '负责销售团队管理',
 *   permissionIds: [1, 2, 3]
 * });
 * console.log(role.id); // 输出新创建的角色ID
 * ```
 *
 * @throws 如果验证失败、角色已存在或创建失败，会抛出错误
 *
 * @category 创建
 */
export async function createRole(data: CreateRoleInput): Promise<PrismaRole> {
  try {
    // 验证数据
    const validation = validateCreateRole(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查角色代码是否已存在
    const existingRole = await prisma.role.findFirst({
      where: {
        OR: [
          { code: data.code },
          { name: data.name },
        ],
      },
    });

    if (existingRole) {
      throw new Error("角色名称或代码已存在");
    }

    // 使用类型安全的包装函数创建角色
    const role = await createRecord('role', {
      name: data.name,
      code: data.code,
      description: data.description || "",
      isSystem: false, // 用户创建的角色不是系统角色
    });

    // 如果指定了权限，分配权限
    if (data.permissionIds && Array.isArray(data.permissionIds) && data.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: data.permissionIds.map((permissionId: number) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/settings/roles");
    return role as PrismaRole;
  } catch (error) {
    console.error("创建角色失败:", error);
    throw new Error(error instanceof Error ? error.message : "创建角色失败");
  }
}

/**
 * 更新角色
 */
export async function updateRole(id: number, data: any) {
  try {
    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new Error("角色不存在");
    }

    // 如果是系统角色，不允许修改代码
    if (existingRole.isSystem && data.code && data.code !== existingRole.code) {
      throw new Error("系统角色的代码不能修改");
    }

    // 如果更改了名称或代码，检查是否已存在
    if ((data.name && data.name !== existingRole.name) || (data.code && data.code !== existingRole.code)) {
      const duplicateRole = await prisma.role.findFirst({
        where: {
          OR: [
            { code: data.code || existingRole.code },
            { name: data.name || existingRole.name },
          ],
          NOT: {
            id,
          },
        },
      });

      if (duplicateRole) {
        throw new Error("角色名称或代码已存在");
      }
    }

    // 更新角色
    const role = await prisma.role.update({
      where: { id },
      data: {
        name: data.name || existingRole.name,
        code: data.code || existingRole.code,
        description: data.description !== undefined ? data.description : existingRole.description,
      },
    });

    revalidatePath("/settings/roles");
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  } catch (error) {
    console.error("更新角色失败:", error);
    throw new Error(error instanceof Error ? error.message : "更新角色失败");
  }
}

/**
 * 删除角色
 */
export async function deleteRole(id: number) {
  try {
    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!existingRole) {
      throw new Error("角色不存在");
    }

    // 如果是系统角色，不允许删除
    if (existingRole.isSystem) {
      throw new Error("系统角色不能删除");
    }

    // 如果角色已分配给用户，不允许删除
    if (existingRole._count.userRoles > 0) {
      throw new Error("该角色已分配给用户，不能删除");
    }

    // 删除角色权限关联
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // 删除角色
    await prisma.role.delete({
      where: { id },
    });

    revalidatePath("/settings/roles");
    return { success: true };
  } catch (error) {
    console.error("删除角色失败:", error);
    throw new Error(error instanceof Error ? error.message : "删除角色失败");
  }
}

/**
 * 获取角色权限
 */
export async function getRolePermissions(roleId: number) {
  try {
    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error("角色不存在");
    }

    // 获取角色权限
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    // 格式化返回数据
    const permissions = rolePermissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      code: rp.permission.code,
      module: rp.permission.module,
      description: rp.permission.description,
    }));

    return permissions;
  } catch (error) {
    console.error("获取角色权限失败:", error);
    throw new Error("获取角色权限失败");
  }
}

/**
 * 更新角色权限
 */
export async function updateRolePermissions(roleId: number, permissionIds: number[]) {
  try {
    // 检查角色是否存在
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error("角色不存在");
    }

    // 开始事务
    await prisma.$transaction(async (tx) => {
      // 删除现有角色权限
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // 添加新的角色权限
      if (permissionIds.length > 0) {
        const permissionData = permissionIds.map(permissionId => ({
          roleId,
          permissionId,
        }));

        await tx.rolePermission.createMany({
          data: permissionData,
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("更新角色权限失败:", error);
    throw new Error("更新角色权限失败");
  }
}

/**
 * 获取权限列表
 */
export async function getPermissions(module?: string) {
  try {
    // 构建查询条件
    const whereClause = module ? { module } : {};

    // 从数据库获取权限
    const permissions = await prisma.permission.findMany({
      where: whereClause,
      orderBy: [
        { module: "asc" },
        { code: "asc" },
      ],
    });

    return permissions;
  } catch (error) {
    console.error("获取权限失败:", error);
    throw new Error("获取权限失败");
  }
}
