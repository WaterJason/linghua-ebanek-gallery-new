"use server";

/**
 * 审计日志服务
 * 
 * 本模块提供审计日志相关的功能，包括记录操作日志、查询日志等。
 * 
 * @module 审计日志
 * @category 核心模块
 */

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { headers } from "next/headers";

// 审计操作类型
export type AuditAction = 
  | "create"    // 创建
  | "update"    // 更新
  | "delete"    // 删除
  | "view"      // 查看
  | "export"    // 导出
  | "import"    // 导入
  | "login"     // 登录
  | "logout"    // 登出
  | "approve"   // 审批
  | "reject"    // 拒绝
  | "cancel"    // 取消
  | "other";    // 其他

// 实体类型
export type EntityType = 
  | "user"      // 用户
  | "product"   // 产品
  | "order"     // 订单
  | "inventory" // 库存
  | "purchase"  // 采购
  | "customer"  // 客户
  | "supplier"  // 供应商
  | "employee"  // 员工
  | "workshop"  // 团建
  | "schedule"  // 排班
  | "finance"   // 财务
  | "channel"   // 渠道
  | "system"    // 系统
  | "other";    // 其他

// 创建审计日志参数
export interface CreateAuditLogParams {
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  details?: string;
  userId?: string;
}

// 查询审计日志参数
export interface GetAuditLogsParams {
  action?: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * 创建审计日志
 * 
 * @param params 创建审计日志参数
 * @returns 创建的审计日志
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    // 如果没有指定用户ID，获取当前用户
    let userId = params.userId;
    if (!userId) {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        userId = currentUser.id;
      }
    }
    
    // 获取请求头信息
    const headersList = headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";
    
    // 创建审计日志
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
        newValues: params.newValues ? JSON.stringify(params.newValues) : null,
        details: params.details,
        ipAddress,
        userAgent,
      },
    });
    
    return auditLog;
  } catch (error) {
    console.error("创建审计日志失败:", error);
    // 审计日志创建失败不应该影响主要业务流程，所以这里不抛出异常
    return null;
  }
}

/**
 * 获取审计日志列表
 * 
 * @param params 查询审计日志参数
 * @returns 审计日志列表和总数
 */
export async function getAuditLogs(params?: GetAuditLogsParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("未授权");
    }
    
    // 构建查询条件
    const where: any = {};
    
    if (params?.action) {
      where.action = params.action;
    }
    
    if (params?.entityType) {
      where.entityType = params.entityType;
    }
    
    if (params?.entityId) {
      where.entityId = params.entityId;
    }
    
    if (params?.userId) {
      where.userId = params.userId;
    }
    
    if (params?.startDate || params?.endDate) {
      where.timestamp = {};
      
      if (params?.startDate) {
        where.timestamp.gte = params.startDate;
      }
      
      if (params?.endDate) {
        where.timestamp.lte = params.endDate;
      }
    }
    
    // 查询审计日志
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: params?.limit || 50,
      skip: params?.offset || 0,
    });
    
    // 查询总数
    const total = await prisma.auditLog.count({ where });
    
    return { auditLogs, total };
  } catch (error) {
    console.error("获取审计日志列表失败:", error);
    throw new Error("获取审计日志列表失败");
  }
}

/**
 * 获取实体的审计日志
 * 
 * @param entityType 实体类型
 * @param entityId 实体ID
 * @param limit 限制数量
 * @returns 审计日志列表
 */
export async function getEntityAuditLogs(entityType: EntityType, entityId: string, limit = 10) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }
    
    // 查询审计日志
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    
    return auditLogs;
  } catch (error) {
    console.error("获取实体审计日志失败:", error);
    throw new Error("获取实体审计日志失败");
  }
}

/**
 * 记录实体创建操作
 * 
 * @param entityType 实体类型
 * @param entityId 实体ID
 * @param values 创建的值
 * @param details 详细信息
 */
export async function logEntityCreation(entityType: EntityType, entityId: string, values: Record<string, any>, details?: string) {
  return createAuditLog({
    action: "create",
    entityType,
    entityId,
    newValues: values,
    details,
  });
}

/**
 * 记录实体更新操作
 * 
 * @param entityType 实体类型
 * @param entityId 实体ID
 * @param oldValues 更新前的值
 * @param newValues 更新后的值
 * @param details 详细信息
 */
export async function logEntityUpdate(entityType: EntityType, entityId: string, oldValues: Record<string, any>, newValues: Record<string, any>, details?: string) {
  return createAuditLog({
    action: "update",
    entityType,
    entityId,
    oldValues,
    newValues,
    details,
  });
}

/**
 * 记录实体删除操作
 * 
 * @param entityType 实体类型
 * @param entityId 实体ID
 * @param values 删除的实体值
 * @param details 详细信息
 */
export async function logEntityDeletion(entityType: EntityType, entityId: string, values: Record<string, any>, details?: string) {
  return createAuditLog({
    action: "delete",
    entityType,
    entityId,
    oldValues: values,
    details,
  });
}
