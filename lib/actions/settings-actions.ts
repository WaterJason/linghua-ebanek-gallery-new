"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth-utils"
import { createAuditLog } from "./audit-actions"

/**
 * 获取系统设置
 *
 * @returns 系统设置对象
 */
export async function getSystemSettings() {
  try {
    // 获取系统设置，如果不存在则创建默认设置
    let settings = await prisma.systemSetting.findFirst()

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          companyName: "聆花掐丝珐琅馆",
          coffeeSalesCommissionRate: 20,
          gallerySalesCommissionRate: 10,
          teacherWorkshopFee: 200,
          assistantWorkshopFee: 130,
          teacherWorkshopFeeOutside: 200,
          assistantWorkshopFeeOutside: 130,
          teacherWorkshopFeeInside: 180,
          assistantWorkshopFeeInside: 110,
          enableImageUpload: true,
          enableNotifications: true,
          // 薪资计算规则默认值
          basicWorkingHours: 8,
          basicWorkingDays: 22,
          overtimeRate: 1.5,
          weekendOvertimeRate: 2,
          holidayOvertimeRate: 3,
          socialInsuranceRate: 0,
          taxRate: 0,
        },
      })
    }

    return settings
  } catch (error) {
    console.error("获取系统设置失败:", error)
    throw new Error("获取系统设置失败")
  }
}

/**
 * 更新系统设置
 *
 * @param data - 要更新的系统设置数据
 * @returns 更新后的系统设置
 */
export async function updateSystemSettings(data: any) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 获取当前设置
    let settings = await prisma.systemSetting.findFirst()

    if (settings) {
      // 更新现有设置
      const updatedSettings = await prisma.systemSetting.update({
        where: { id: settings.id },
        data: {
          companyName: data.companyName,
          coffeeSalesCommissionRate: Number.parseFloat(data.coffeeSalesCommissionRate),
          gallerySalesCommissionRate: Number.parseFloat(data.gallerySalesCommissionRate),
          teacherWorkshopFee: Number.parseFloat(data.teacherWorkshopFee),
          assistantWorkshopFee: Number.parseFloat(data.assistantWorkshopFee),
          teacherWorkshopFeeOutside: Number.parseFloat(data.teacherWorkshopFeeOutside || "200"),
          assistantWorkshopFeeOutside: Number.parseFloat(data.assistantWorkshopFeeOutside || "130"),
          teacherWorkshopFeeInside: Number.parseFloat(data.teacherWorkshopFeeInside || "180"),
          assistantWorkshopFeeInside: Number.parseFloat(data.assistantWorkshopFeeInside || "110"),
          enableImageUpload: data.enableImageUpload,
          enableNotifications: data.enableNotifications,
          basicWorkingHours: Number.parseFloat(data.basicWorkingHours || "8"),
          basicWorkingDays: Number.parseInt(data.basicWorkingDays || "22"),
          overtimeRate: Number.parseFloat(data.overtimeRate || "1.5"),
          weekendOvertimeRate: Number.parseFloat(data.weekendOvertimeRate || "2"),
          holidayOvertimeRate: Number.parseFloat(data.holidayOvertimeRate || "3"),
          socialInsuranceRate: Number.parseFloat(data.socialInsuranceRate || "0"),
          taxRate: Number.parseFloat(data.taxRate || "0"),
        },
      })

      // 记录审计日志
      await createAuditLog({
        action: "update",
        entityType: "system",
        entityId: "system_settings",
        userId: user.id,
        userName: user.name || user.email || "未知用户",
        details: "更新系统设置",
        oldValues: JSON.stringify(settings),
        newValues: JSON.stringify(updatedSettings),
      })

      revalidatePath("/settings")
      return updatedSettings
    } else {
      // 创建新设置
      const newSettings = await prisma.systemSetting.create({
        data: {
          companyName: data.companyName,
          coffeeSalesCommissionRate: Number.parseFloat(data.coffeeSalesCommissionRate),
          gallerySalesCommissionRate: Number.parseFloat(data.gallerySalesCommissionRate),
          teacherWorkshopFee: Number.parseFloat(data.teacherWorkshopFee),
          assistantWorkshopFee: Number.parseFloat(data.assistantWorkshopFee),
          teacherWorkshopFeeOutside: Number.parseFloat(data.teacherWorkshopFeeOutside || "200"),
          assistantWorkshopFeeOutside: Number.parseFloat(data.assistantWorkshopFeeOutside || "130"),
          teacherWorkshopFeeInside: Number.parseFloat(data.teacherWorkshopFeeInside || "180"),
          assistantWorkshopFeeInside: Number.parseFloat(data.assistantWorkshopFeeInside || "110"),
          enableImageUpload: data.enableImageUpload,
          enableNotifications: data.enableNotifications,
          basicWorkingHours: Number.parseFloat(data.basicWorkingHours || "8"),
          basicWorkingDays: Number.parseInt(data.basicWorkingDays || "22"),
          overtimeRate: Number.parseFloat(data.overtimeRate || "1.5"),
          weekendOvertimeRate: Number.parseFloat(data.weekendOvertimeRate || "2"),
          holidayOvertimeRate: Number.parseFloat(data.holidayOvertimeRate || "3"),
          socialInsuranceRate: Number.parseFloat(data.socialInsuranceRate || "0"),
          taxRate: Number.parseFloat(data.taxRate || "0"),
        },
      })

      // 记录审计日志
      await createAuditLog({
        action: "create",
        entityType: "system",
        entityId: "system_settings",
        userId: user.id,
        userName: user.name || user.email || "未知用户",
        details: "创建系统设置",
        newValues: JSON.stringify(newSettings),
      })

      revalidatePath("/settings")
      return newSettings
    }
  } catch (error) {
    console.error("更新系统设置失败:", error)
    throw new Error("更新系统设置失败")
  }
}

/**
 * 获取系统参数
 *
 * @returns 系统参数列表
 */
export async function getSystemParameters() {
  try {
    // 首先检查是否已有系统参数，如果没有则初始化
    const existingParams = await prisma.systemParameter.findMany()

    if (existingParams.length === 0) {
      // 初始化默认系统参数
      const defaultParams = [
        { key: "system.name", value: "聆花掐丝珐琅馆ERP系统", description: "系统名称", group: "general" },
        { key: "system.version", value: "1.0.0", description: "系统版本", group: "general" },
        { key: "system.maintenance", value: "false", description: "维护模式", group: "general" },
        { key: "email.sender", value: "noreply@linghua.com", description: "邮件发送者", group: "email" },
        { key: "email.template.welcome", value: "欢迎使用聆花掐丝珐琅馆ERP系统", description: "欢迎邮件模板", group: "email" },
        { key: "backup.auto", value: "true", description: "自动备份", group: "system" },
        { key: "backup.interval", value: "24", description: "备份间隔（小时）", group: "system" },
        { key: "notification.enabled", value: "true", description: "启用通知", group: "notification" },
        { key: "notification.email", value: "true", description: "邮件通知", group: "notification" },
        { key: "security.session_timeout", value: "3600", description: "会话超时时间（秒）", group: "security" },
      ]

      // 批量创建默认参数
      await prisma.systemParameter.createMany({
        data: defaultParams
      })

      return await prisma.systemParameter.findMany({
        orderBy: [
          { group: 'asc' },
          { key: 'asc' }
        ]
      })
    }

    return existingParams
  } catch (error) {
    console.error("获取系统参数失败:", error)
    throw new Error("获取系统参数失败")
  }
}

/**
 * 更新系统参数
 *
 * @param key - 参数键
 * @param value - 参数值
 * @returns 更新后的参数
 */
export async function updateSystemParameter(key: string, value: string) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 查找现有参数
    const existingParam = await prisma.systemParameter.findUnique({
      where: { key }
    })

    if (!existingParam) {
      throw new Error(`系统参数 ${key} 不存在`)
    }

    // 更新参数值
    const updatedParam = await prisma.systemParameter.update({
      where: { key },
      data: {
        value,
        updatedAt: new Date()
      }
    })

    // 记录审计日志
    await createAuditLog({
      action: "update",
      entityType: "system",
      entityId: `system_parameter_${key}`,
      userId: user.id,
      userName: user.name || user.email || "未知用户",
      details: `更新系统参数: ${key}`,
      oldValues: JSON.stringify({ key, value: existingParam.value }),
      newValues: JSON.stringify({ key, value: updatedParam.value }),
    })

    revalidatePath("/settings/parameters")
    return updatedParam
  } catch (error) {
    console.error("更新系统参数失败:", error)
    throw new Error("更新系统参数失败")
  }
}

/**
 * 创建系统参数
 *
 * @param data - 参数数据
 * @returns 创建的参数
 */
export async function createSystemParameter(data: {
  key: string
  value: string
  description: string
  group: string
}) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 检查参数是否已存在
    const existingParam = await prisma.systemParameter.findUnique({
      where: { key: data.key }
    })

    if (existingParam) {
      throw new Error(`系统参数 ${data.key} 已存在`)
    }

    // 创建新参数
    const newParam = await prisma.systemParameter.create({
      data: {
        key: data.key,
        value: data.value,
        description: data.description,
        group: data.group
      }
    })

    // 记录审计日志
    await createAuditLog({
      action: "create",
      entityType: "system",
      entityId: `system_parameter_${data.key}`,
      userId: user.id,
      userName: user.name || user.email || "未知用户",
      details: `创建系统参数: ${data.key}`,
      oldValues: null,
      newValues: JSON.stringify(newParam),
    })

    revalidatePath("/settings/parameters")
    return newParam
  } catch (error) {
    console.error("创建系统参数失败:", error)
    throw new Error("创建系统参数失败")
  }
}

/**
 * 删除系统参数
 *
 * @param key - 参数键
 * @returns 删除结果
 */
export async function deleteSystemParameter(key: string) {
  try {
    // 获取当前用户
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("未登录")
    }

    // 查找要删除的参数
    const existingParam = await prisma.systemParameter.findUnique({
      where: { key }
    })

    if (!existingParam) {
      throw new Error(`系统参数 ${key} 不存在`)
    }

    // 删除参数
    await prisma.systemParameter.delete({
      where: { key }
    })

    // 记录审计日志
    await createAuditLog({
      action: "delete",
      entityType: "system",
      entityId: `system_parameter_${key}`,
      userId: user.id,
      userName: user.name || user.email || "未知用户",
      details: `删除系统参数: ${key}`,
      oldValues: JSON.stringify(existingParam),
      newValues: null,
    })

    revalidatePath("/settings/parameters")
    return { success: true }
  } catch (error) {
    console.error("删除系统参数失败:", error)
    throw new Error("删除系统参数失败")
  }
}
