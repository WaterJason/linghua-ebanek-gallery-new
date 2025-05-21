/**
 * 认证管理模块
 *
 * 本模块提供认证管理相关的功能，包括获取当前用户信息、用户登录历史记录、两步验证等。
 *
 * @module 认证管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import {
  PrismaUser,
  PrismaUserLoginHistory,
  UserLoginRecordParams
} from "@/types/prisma-models";
import { validateUserLoginRecord } from "@/lib/validation";
import { ErrorUtils } from "@/lib/error-utils";
import { cookies } from "next/headers";

/**
 * 获取当前登录用户信息
 *
 * 获取当前登录用户的详细信息，包括用户设置和角色。
 *
 * @returns 当前登录用户信息
 *
 * @example
 * ```typescript
 * // 获取当前登录用户信息
 * const user = await getCurrentUser();
 * console.log(user.name); // 输出当前用户名称
 * console.log(user.userRoles); // 输出当前用户角色列表
 * ```
 *
 * @throws 如果用户未登录或获取用户信息失败，会抛出错误
 *
 * @category 查询
 */
export async function getCurrentUser(): Promise<PrismaUser | null> {
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

    // 使用会话中的用户ID查询用户信息
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        userSettings: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      console.error("用户不存在:", session.user.id);
      return null;
    }

    return user;
  } catch (error) {
    // 使用统一的错误处理机制，但不抛出错误
    console.error("获取当前用户失败:", error);
    return null;
  }
}

/**
 * 获取用户登录历史
 *
 * 获取指定用户的最近登录历史记录。
 *
 * @param userId - 用户ID
 * @returns 用户登录历史记录列表
 *
 * @example
 * ```typescript
 * // 获取用户登录历史
 * const loginHistory = await getUserLoginHistory('user123');
 * console.log(loginHistory[0].loginTime); // 输出最近一次登录时间
 * ```
 *
 * @throws 如果获取登录历史失败，会抛出错误
 *
 * @category 查询
 */
export async function getUserLoginHistory(userId: string): Promise<PrismaUserLoginHistory[]> {
  try {
    // 验证参数
    if (!userId) {
      throw new ErrorUtils.ValidationError("用户ID不能为空", { userId }, "authentication");
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ErrorUtils.NotFoundError("用户不存在", { userId }, "authentication");
    }

    // 获取用户登录历史
    const loginHistory = await prisma.userLoginHistory.findMany({
      where: { userId },
      orderBy: {
        loginTime: "desc",
      },
      take: 10, // 只获取最近10条记录
    });

    return loginHistory;
  } catch (error) {
    // 使用统一的错误处理机制
    const appError = await ErrorUtils.handleError(error, "authentication");
    throw appError;
  }
}

/**
 * 记录用户登录
 *
 * 记录用户登录信息，包括IP地址、用户代理等。
 *
 * @param userId - 用户ID
 * @param ipAddress - IP地址
 * @param userAgent - 用户代理
 * @returns 创建的登录记录，如果记录失败则返回null
 *
 * @example
 * ```typescript
 * // 记录用户登录
 * const loginRecord = await recordUserLogin('user123', '192.168.1.1', 'Mozilla/5.0...');
 * if (loginRecord) {
 *   console.log('登录记录创建成功');
 * }
 * ```
 *
 * @category 创建
 */
export async function recordUserLogin(userId: string, ipAddress: string, userAgent: string): Promise<PrismaUserLoginHistory | null> {
  try {
    // 验证数据
    const validation = validateUserLoginRecord({ userId, ipAddress, userAgent });
    if (!validation.isValid) {
      // 使用统一的错误处理方式，但不抛出错误
      console.error("Invalid login record data:", validation.errors);
      return null;
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // 使用统一的错误处理方式，但不抛出错误
      console.error("User not found:", userId);
      return null;
    }

    // 记录用户登录
    const loginRecord = await prisma.userLoginHistory.create({
      data: {
        userId,
        ipAddress,
        userAgent,
        loginTime: new Date(),
        status: "success",
      },
    });

    return loginRecord;
  } catch (error) {
    // 使用统一的错误处理机制，但不抛出错误
    await ErrorUtils.handleError(error, "authentication");
    // 这里不抛出错误，因为登录记录失败不应该影响用户登录
    return null;
  }
}

/**
 * 启用两步验证
 */
export async function enableTwoFactorAuth(userId: string) {
  try {
    // 在实际应用中，这里应该生成2FA密钥并返回给用户
    // 例如：const secret = speakeasy.generateSecret({ length: 20 });

    // 更新用户设置
    await prisma.userSettings.update({
      where: { userId },
      data: {
        enableTwoFactorAuth: true,
        twoFactorAuthSecret: "dummy_secret_key", // 在实际应用中，这应该是一个真实的密钥
      },
    });

    return {
      success: true,
      qrCodeUrl: "https://example.com/qrcode", // 在实际应用中，这应该是一个真实的QR码URL
    };
  } catch (error) {
    console.error("Error enabling two-factor auth:", error);
    throw new Error("启用两步验证失败");
  }
}

/**
 * 禁用两步验证
 */
export async function disableTwoFactorAuth(userId: string) {
  try {
    // 更新用户设置
    await prisma.userSettings.update({
      where: { userId },
      data: {
        enableTwoFactorAuth: false,
        twoFactorAuthSecret: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error disabling two-factor auth:", error);
    throw new Error("禁用两步验证失败");
  }
}
