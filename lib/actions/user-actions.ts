/**
 * 用户管理模块
 *
 * 本模块提供用户管理相关的功能，包括用户的增删改查、用户角色管理、用户个人资料管理等。
 *
 * @module 用户管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaUser,
  UserCreateParams,
  UserUpdateParams,
  UserRolesUpdateParams,
  UserProfileUpdateParams,
  UserPasswordUpdateParams,
  UserSettingsUpdateParams
} from "@/types/prisma-models";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateUserRoles,
  validateUpdateUserProfile,
  validateUpdateUserPassword
} from "@/lib/validation";
import { findRecord, findRecords, createRecord, updateRecord } from "@/lib/prisma-wrapper";

/**
 * 获取单个用户信息
 *
 * 根据用户ID获取用户详细信息，包括角色和员工信息。
 *
 * @param userId - 用户ID
 * @returns 用户信息，包含角色和员工信息
 * @throws 如果获取用户失败
 *
 * @example
 * ```typescript
 * // 获取单个用户
 * const user = await getUser("user_id");
 * console.log(user.name); // 输出用户名称
 * console.log(user.roles); // 输出用户角色列表
 * ```
 *
 * @category 查询
 */
export async function getUser(userId: string) {
  try {
    // 使用类型安全的包装函数获取用户
    const user = await findRecord('user', {
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        employee: true,
      },
    });

    if (!user) {
      return null;
    }

    // 格式化返回数据
    return {
      ...(user as PrismaUser),
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
        description: ur.role.description,
      })),
    };
  } catch (error) {
    console.error("获取用户信息失败:", error);
    throw new Error("获取用户信息失败");
  }
}

/**
 * 获取所有用户
 *
 * 获取所有用户的列表，包含角色和员工信息。
 *
 * @returns 所有用户的列表，包含角色和员工信息
 * @throws 如果获取用户失败
 *
 * @example
 * ```typescript
 * // 获取所有用户
 * const users = await getUsers();
 * console.log(users[0].name); // 输出第一个用户的名称
 * console.log(users[0].roles); // 输出第一个用户的角色列表
 * ```
 *
 * @category 查询
 */
export async function getUsers(): Promise<(PrismaUser & { roles: any[] })[]> {
  try {
    // 使用类型安全的包装函数获取用户
    const users = await findRecords('user', {
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        employee: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 格式化返回数据
    return users.map(user => ({
      ...(user as PrismaUser),
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
        description: ur.role.description,
      })),
    }));
  } catch (error) {
    console.error("获取用户列表失败:", error);
    throw new Error("获取用户列表失败");
  }
}

/**
 * 获取基本用户列表（不包含详细信息）
 */
export async function getUsersBasic() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
}

/**
 * 创建用户
 *
 * 创建新的用户记录，并可选择分配角色。
 *
 * @param data - 用户创建参数
 * @returns 创建的用户信息
 * @throws 如果用户创建失败，例如邮箱已被注册
 *
 * @example
 * ```typescript
 * // 创建新用户
 * const newUser = await createUser({
 *   name: "张三",
 *   email: "zhangsan@example.com",
 *   password: "password123",
 *   role: "user",
 *   roleIds: [1, 2]
 * });
 * console.log(newUser.id); // 输出新创建的用户ID
 * ```
 *
 * @category 创建
 */
export async function createUser(data: UserCreateParams): Promise<PrismaUser & { roles: number[] }> {
  try {
    // 验证数据
    const validation = validateCreateUser(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("该邮箱已被注册");
    }

    // 使用类型安全的包装函数创建用户
    const user = await createRecord('user', {
      name: data.name,
      email: data.email,
      password: data.password, // 注意：实际应用中应该对密码进行哈希处理
      role: data.role || "user",
    });

    // 如果指定了角色，分配角色
    if (data.roleIds && Array.isArray(data.roleIds) && data.roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: data.roleIds.map((roleId: number) => ({
          userId: user.id,
          roleId,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath("/settings/account");
    return {
      ...(user as PrismaUser),
      roles: data.roleIds || [],
    };
  } catch (error) {
    console.error("创建用户失败:", error);
    throw new Error(error instanceof Error ? error.message : "创建用户失败");
  }
}

/**
 * 创建基本用户（简化版本）
 */
export async function createUserBasic(data: any) {
  try {
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    })

    if (existingUser) {
      throw new Error("邮箱已被注册")
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role || "user",
      },
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to create user")
  }
}

/**
 * 更新用户
 *
 * @param id - 用户ID
 * @param data - 用户更新参数
 * @returns 更新后的用户信息
 * @throws 如果用户更新失败，例如用户不存在或邮箱已被其他用户使用
 *
 * @example
 * ```ts
 * const updatedUser = await updateUser("user_id", {
 *   name: "李四",
 *   email: "lisi@example.com",
 *   roleIds: [2, 3]
 * });
 * ```
 */
export async function updateUser(id: string, data: UserUpdateParams) {
  try {
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("用户不存在");
    }

    // 如果更改了邮箱，检查新邮箱是否已被使用
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error("该邮箱已被其他用户使用");
      }
    }

    // 准备更新数据
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.password) updateData.password = data.password; // 注意：实际应用中应该对密码进行哈希处理

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // 如果指定了角色，更新角色
    if (data.roleIds && Array.isArray(data.roleIds)) {
      // 删除现有角色
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // 添加新角色
      if (data.roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: data.roleIds.map((roleId: number) => ({
            userId: id,
            roleId,
          })),
          skipDuplicates: true,
        });
      }
    }

    revalidatePath("/settings/account");
    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      roles: data.roleIds || [],
    };
  } catch (error) {
    console.error("更新用户失败:", error);
    throw new Error(error instanceof Error ? error.message : "更新用户失败");
  }
}

/**
 * 更新用户（详细版本，包含系统日志记录）
 */
export async function updateUserDetailed(id: string, data: any) {
  try {
    console.log("Server Action: Updating user with data:", { id, ...data });

    // 检查邮箱是否已被其他用户使用
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: {
            id,
          },
        },
      })

      if (existingUser) {
        throw new Error("邮箱已被其他用户使用")
      }
    }

    // 获取当前用户信息，包括角色
    const currentUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: true,
        employee: true,
      }
    });

    if (!currentUser) {
      throw new Error("用户不存在");
    }

    // 检查是否更改了系统角色
    const roleChanged = data.role && data.role !== currentUser.role;
    console.log("Server Action: Role changed:", roleChanged, "Current:", currentUser.role, "New:", data.role);

    // 更新用户基本信息
    const updateData: any = {
      name: data.name,
      email: data.email,
    };

    // 如果提供了角色，更新角色
    if (data.role) {
      updateData.role = data.role;
    }

    // 如果提供了密码，更新密码
    if (data.password) {
      // 在实际应用中，应该对密码进行哈希处理
      updateData.password = data.password;
    }

    // 更新用户
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true,
          }
        }
      }
    });

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "用户管理",
        level: "info",
        message: `更新用户: ${user.email}`,
        details: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          roleChanged,
        }),
        userId: id, // 记录操作者ID
        timestamp: new Date(), // 确保设置时间戳
      }
    });

    // 格式化返回数据
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roles: user.userRoles.map(ur => ur.roleId),
      employee: user.employee,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    console.log("Server Action: User updated successfully:", formattedUser);
    return formattedUser;
  } catch (error) {
    console.error("Error updating user:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update user")
  }
}

/**
 * 删除用户
 */
export async function deleteUser(id: string) {
  try {
    console.log("Server Action: Deleting user with id:", id);

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error("用户不存在");
    }

    // 删除用户角色关联
    await prisma.userRole.deleteMany({
      where: { userId: id },
    });

    // 删除用户
    await prisma.user.delete({
      where: { id },
    });

    console.log("Server Action: User deleted successfully");

    revalidatePath("/settings/account");
    return { success: true };
  } catch (error) {
    console.error("Server Action: Error deleting user:", error);
    throw new Error(error instanceof Error ? error.message : "删除用户失败");
  }
}

/**
 * 获取用户角色
 */
export async function getUserRoles(userId: string) {
  try {
    // 获取用户角色
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    // 格式化角色数据
    const roles = userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code,
      description: ur.role.description,
      isSystem: ur.role.isSystem,
    }));

    // 同时返回角色ID数组，方便前端使用
    const roleIds = userRoles.map(ur => ur.roleId);

    // 获取用户信息，包括旧版roles字段
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return {
      roles,
      roleIds,
      legacyRoles: user?.roles || [],
    };
  } catch (error) {
    console.error("获取用户角色失败:", error);
    throw new Error("获取用户角色失败");
  }
}

/**
 * 更新用户角色
 *
 * @param userId - 用户ID
 * @param roleIds - 角色ID数组
 * @returns 更新结果，包含更新后的角色列表
 * @throws 如果更新用户角色失败，例如用户不存在
 *
 * @example
 * ```ts
 * const result = await updateUserRoles("user_id", [1, 3, 5]);
 * ```
 */
export async function updateUserRoles(userId: string, roleIds: number[]) {
  try {
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    // 开始事务
    await prisma.$transaction(async (tx) => {
      // 删除现有用户角色
      await tx.userRole.deleteMany({
        where: { userId },
      });

      // 添加新的用户角色
      if (roleIds.length > 0) {
        const roleData = roleIds.map(roleId => ({
          userId,
          roleId: typeof roleId === 'string' ? parseInt(roleId) : roleId,
        }));

        await tx.userRole.createMany({
          data: roleData,
          skipDuplicates: true,
        });
      }

      // 同时更新旧版roles字段，保持兼容性
      await tx.user.update({
        where: { id: userId },
        data: {
          roles: roleIds.map(r => typeof r === 'string' ? parseInt(r) : r),
        },
      });
    });

    // 获取更新后的用户角色
    const updatedUserRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    // 格式化角色数据
    const updatedRoles = updatedUserRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code,
      description: ur.role.description,
      isSystem: ur.role.isSystem,
    }));

    // 同时返回角色ID数组，方便前端使用
    const updatedRoleIds = updatedUserRoles.map(ur => ur.roleId);

    revalidatePath("/settings/account");
    return {
      success: true,
      roles: updatedRoles,
      roleIds: updatedRoleIds,
    };
  } catch (error) {
    console.error("更新用户角色失败:", error);
    throw new Error(error instanceof Error ? error.message : "更新用户角色失败");
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(userId: string, data: any) {
  try {
    // 验证必填字段
    if (!data.name || data.name.trim() === "") {
      throw new Error("用户名不能为空");
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error("请输入有效的电子邮件地址");
    }

    // 检查电子邮件是否已被其他用户使用
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        id: {
          not: userId,
        },
      },
    });

    if (existingUser) {
      throw new Error("该电子邮件地址已被使用");
    }

    // 更新用户资料
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name.trim(),
        email: data.email,
        phone: data.phone || null,
        bio: data.bio || null,
        image: data.image || null,
      },
    });

    revalidatePath("/accounts/profile");
    return updatedUser;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error(error instanceof Error ? error.message : "更新用户资料失败");
  }
}

/**
 * 更新用户密码
 */
export async function updateUserPassword(userId: string, data: any) {
  try {
    // 验证必填字段
    if (!data.currentPassword) {
      throw new Error("当前密码不能为空");
    }

    if (!data.newPassword) {
      throw new Error("新密码不能为空");
    }

    if (data.newPassword !== data.confirmPassword) {
      throw new Error("新密码和确认密码不匹配");
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new Error("用户不存在");
    }

    // 在实际应用中，这里应该验证当前密码是否正确
    // 例如：if (!await bcrypt.compare(data.currentPassword, user.password)) {
    //   throw new Error("当前密码不正确");
    // }

    // 更新密码
    // 在实际应用中，这里应该对新密码进行哈希处理
    // 例如：const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    const hashedPassword = data.newPassword; // 简化处理，实际应用中不要这样做

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user password:", error);
    throw new Error(error instanceof Error ? error.message : "更新密码失败");
  }
}

/**
 * 更新用户设置
 */
export async function updateUserSettings(userId: string, data: any) {
  try {
    // 检查用户设置是否存在
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (existingSettings) {
      // 更新现有设置
      const updatedSettings = await prisma.userSettings.update({
        where: { userId },
        data: {
          theme: data.theme || existingSettings.theme,
          language: data.language || existingSettings.language,
          enableNotifications: data.enableNotifications !== undefined ? data.enableNotifications : existingSettings.enableNotifications,
          enableTwoFactorAuth: data.enableTwoFactorAuth !== undefined ? data.enableTwoFactorAuth : existingSettings.enableTwoFactorAuth,
        },
      });

      revalidatePath("/accounts/profile");
      revalidatePath("/accounts/settings");
      return updatedSettings;
    } else {
      // 创建新设置
      const newSettings = await prisma.userSettings.create({
        data: {
          userId,
          theme: data.theme || "light",
          language: data.language || "zh-CN",
          enableNotifications: data.enableNotifications !== undefined ? data.enableNotifications : true,
          enableTwoFactorAuth: data.enableTwoFactorAuth !== undefined ? data.enableTwoFactorAuth : false,
        },
      });

      revalidatePath("/accounts/profile");
      revalidatePath("/accounts/settings");
      return newSettings;
    }
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw new Error(error instanceof Error ? error.message : "更新用户设置失败");
  }
}

/**
 * 获取用户登录历史
 * @param userId 用户ID
 * @param limit 限制数量
 * @returns 登录历史记录
 */
export async function getUserLoginHistory(userId?: string, limit = 50) {
  try {
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    const loginHistory = await prisma.auditLog.findMany({
      where: {
        ...where,
        action: 'login'
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return loginHistory.map(log => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || 'Unknown',
      userEmail: log.user?.email || 'Unknown',
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      details: log.details
    }))
  } catch (error) {
    console.error("Error getting user login history:", error)
    return []
  }
}