import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { ActivityData } from "@/lib/user-activity-logger"
import fs from "fs"
import path from "path"

// 日志文件路径
const LOG_DIR = path.join(process.cwd(), "logs")
const LOG_FILE = path.join(LOG_DIR, "user-activity.log")

// 确保日志目录存在
const ensureLogDir = () => {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

// 写入日志到文件
const writeLogToFile = (log: ActivityData) => {
  ensureLogDir()

  const logEntry = JSON.stringify({
    ...log,
    timestamp: new Date().toISOString() // 使用服务器时间
  }) + "\n"

  fs.appendFileSync(LOG_FILE, logEntry)
}

// 写入日志到数据库
const writeLogToDatabase = async (log: ActivityData) => {
  try {
    // 检查是否有用户活动日志表
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'UserActivityLog'
      );
    `

    // 如果表不存在，则跳过数据库记录
    if (!tableExists) {
      console.warn("UserActivityLog table does not exist, skipping database logging")
      return
    }

    // 写入日志到数据库
    await prisma.userActivityLog.create({
      data: {
        type: log.type,
        userId: log.userId || null,
        userName: log.userName || null,
        userEmail: log.userEmail || null,
        path: log.path,
        details: log.details ? JSON.stringify(log.details) : null,
        sessionId: log.sessionId,
        userAgent: log.deviceInfo.userAgent,
        screenWidth: log.deviceInfo.screenWidth,
        screenHeight: log.deviceInfo.screenHeight,
        language: log.deviceInfo.language,
        platform: log.deviceInfo.platform
      }
    })
  } catch (error) {
    console.error("Failed to write log to database:", error)
    // 如果数据库写入失败，确保至少写入到文件
    writeLogToFile(log)
  }
}

// POST 处理程序 - 接收并存储日志
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions)

    // 获取请求数据
    const log: ActivityData = await request.json()

    // 添加或覆盖用户信息（以服务器端会话为准）
    if (session?.user) {
      log.userId = session.user.id as string
      log.userName = session.user.name as string
      log.userEmail = session.user.email as string
    }

    // 根据配置决定日志存储方式
    const logToFile = process.env.LOG_TO_FILE === "true"
    const logToDatabase = process.env.LOG_TO_DATABASE === "true"

    // 写入日志
    if (logToFile) {
      writeLogToFile(log)
    }

    if (logToDatabase) {
      await writeLogToDatabase(log)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing log:", error)
    return NextResponse.json(
      { error: "Failed to process log" },
      { status: 500 }
    )
  }
}

// GET 处理程序 - 获取日志（仅限管理员）
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且是管理员
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      // 如果不是管理员，返回模拟的系统日志数据
      return getSystemLogs(request)
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type")
    const userId = searchParams.get("userId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // 构建查询条件
    const where: any = {}

    if (type) {
      where.type = type
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.createdAt = {}

      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }

      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // 查询日志
    const logs = await prisma.userActivityLog.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      take: Math.min(limit, 1000), // 限制最大返回数量
      skip: offset
    })

    // 查询总数
    const total = await prisma.userActivityLog.count({ where })

    return NextResponse.json({
      logs,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    )
  }
}

// 获取系统日志（模拟数据，用于非管理员用户）
function getSystemLogs(request: Request) {
  try {
    // 获取查询参数
    const url = new URL(request.url)
    const level = url.searchParams.get("level")
    const module = url.searchParams.get("module")
    const limit = parseInt(url.searchParams.get("limit") || "100")

    // 模拟日志数据
    const logs = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        level: "info",
        module: "系统",
        message: "系统启动成功",
        details: "服务器启动并初始化完成",
        userId: null,
        userName: null
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: "warning",
        module: "数据库",
        message: "数据库连接延迟",
        details: "数据库连接响应时间超过500ms",
        userId: null,
        userName: null
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        level: "error",
        module: "API",
        message: "API请求失败",
        details: "调用外部API时发生超时错误",
        userId: null,
        userName: null
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        level: "info",
        module: "用户",
        message: "用户登录",
        details: "用户成功登录系统",
        userId: "1",
        userName: "管理员"
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        level: "info",
        module: "产品",
        message: "产品更新",
        details: "产品信息已更新",
        userId: "1",
        userName: "管理员"
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        level: "warning",
        module: "库存",
        message: "库存不足",
        details: "产品库存低于警戒线",
        userId: null,
        userName: null
      },
      {
        id: 7,
        timestamp: new Date(Date.now() - 21600000).toISOString(),
        level: "info",
        module: "销售",
        message: "新订单创建",
        details: "创建了新的销售订单",
        userId: "2",
        userName: "销售员"
      },
      {
        id: 8,
        timestamp: new Date(Date.now() - 25200000).toISOString(),
        level: "debug",
        module: "系统",
        message: "缓存刷新",
        details: "系统缓存已刷新",
        userId: null,
        userName: null
      },
      {
        id: 9,
        timestamp: new Date(Date.now() - 28800000).toISOString(),
        level: "error",
        module: "支付",
        message: "支付失败",
        details: "处理支付请求时发生错误",
        userId: "3",
        userName: "客户"
      },
      {
        id: 10,
        timestamp: new Date(Date.now() - 32400000).toISOString(),
        level: "info",
        module: "员工",
        message: "员工信息更新",
        details: "员工信息已更新",
        userId: "1",
        userName: "管理员"
      }
    ]

    // 应用筛选条件
    let filteredLogs = logs
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }
    if (module) {
      filteredLogs = filteredLogs.filter(log => log.module === module)
    }

    // 按时间倒序排序并限制数量
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    filteredLogs = filteredLogs.slice(0, limit)

    return NextResponse.json(filteredLogs)
  } catch (error) {
    console.error("Error fetching system logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    )
  }
}
