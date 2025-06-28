import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerSession } from "@/lib/auth-helpers"
import { withPermission } from "@/lib/auth-middleware"
import { configManager } from "@/lib/config-manager"

/**
 * 获取系统参数
 */
export async function GET(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.view")
    if (permissionCheck) return permissionCheck

    // 获取系统参数
    const parameters = await prisma.systemParameter.findMany({
      orderBy: [
        { group: 'asc' },
        { key: 'asc' }
      ]
    })

    // 如果没有参数，初始化默认参数
    if (parameters.length === 0) {
      const defaultParams = [
        { key: "system.name", value: "聆花掐丝珐琅馆ERP系统", description: "系统名称", group: "general", type: "string" },
        { key: "system.version", value: "1.0.0", description: "系统版本", group: "general", type: "string" },
        { key: "system.maintenance", value: "false", description: "维护模式", group: "general", type: "boolean" },
        { key: "company.name", value: "聆花掐丝珐琅馆", description: "公司名称", group: "company", type: "string" },
        { key: "company.address", value: "北京市朝阳区", description: "公司地址", group: "company", type: "string" },
        { key: "company.phone", value: "010-12345678", description: "公司电话", group: "company", type: "string" },
        { key: "company.email", value: "contact@linghua.com", description: "公司邮箱", group: "company", type: "string" },
        { key: "email.sender", value: "noreply@linghua.com", description: "邮件发送者", group: "email", type: "string" },
        { key: "backup.auto", value: "true", description: "自动备份", group: "system", type: "boolean" },
        { key: "backup.interval", value: "24", description: "备份间隔（小时）", group: "system", type: "number" },
        { key: "notification.enabled", value: "true", description: "启用通知", group: "notification", type: "boolean" },
        { key: "security.session_timeout", value: "3600", description: "会话超时时间（秒）", group: "security", type: "number" },
      ]

      // 批量创建默认参数
      await prisma.systemParameter.createMany({
        data: defaultParams
      })

      // 重新获取参数
      const newParameters = await prisma.systemParameter.findMany({
        orderBy: [
          { group: 'asc' },
          { key: 'asc' }
        ]
      })

      return NextResponse.json(newParameters)
    }

    return NextResponse.json(parameters)
  } catch (error) {
    console.error("获取系统参数失败:", error)
    return NextResponse.json({ error: "获取系统参数失败" }, { status: 500 })
  }
}

/**
 * 更新系统参数
 */
export async function PUT(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.edit")
    if (permissionCheck) return permissionCheck

    const data = await req.json()
    const { parameters } = data

    if (!parameters || typeof parameters !== 'object') {
      return NextResponse.json({ error: "参数格式错误" }, { status: 400 })
    }

    // 使用配置管理器批量更新参数，自动处理缓存和通知
    await configManager.setMultiple(parameters)

    // 获取更新后的参数
    const updatedParameters = await prisma.systemParameter.findMany({
      orderBy: [
        { group: 'asc' },
        { key: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      message: "系统参数更新成功，配置已实时生效",
      data: updatedParameters,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("更新系统参数失败:", error)
    return NextResponse.json({ error: "更新系统参数失败" }, { status: 500 })
  }
}

/**
 * 创建系统参数
 */
export async function POST(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.create")
    if (permissionCheck) return permissionCheck

    const data = await req.json()
    const { key, value, description, group, type } = data

    // 验证必填字段
    if (!key || !value) {
      return NextResponse.json({ error: "参数键和值为必填项" }, { status: 400 })
    }

    // 检查参数是否已存在
    const existingParam = await prisma.systemParameter.findUnique({
      where: { key }
    })

    if (existingParam) {
      return NextResponse.json({ error: "参数键已存在" }, { status: 400 })
    }

    // 使用配置管理器创建新参数，自动处理缓存
    await configManager.set(key, value, type || "string")

    // 获取创建的参数
    const newParameter = await prisma.systemParameter.findUnique({
      where: { key }
    })

    return NextResponse.json({
      success: true,
      message: "系统参数创建成功，配置已实时生效",
      data: newParameter,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("创建系统参数失败:", error)
    return NextResponse.json({ error: "创建系统参数失败" }, { status: 500 })
  }
}
