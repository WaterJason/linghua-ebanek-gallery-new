import { NextRequest, NextResponse } from "next/server"
import { withPermission } from "@/lib/auth-middleware"
import { configManager } from "@/lib/config-manager"

/**
 * 获取实时配置
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keys = searchParams.get('keys')?.split(',')
    const group = searchParams.get('group')

    if (keys) {
      // 获取指定配置
      const config = await configManager.getMultiple(keys)
      return NextResponse.json({
        success: true,
        data: config,
        timestamp: new Date().toISOString()
      })
    } else if (group) {
      // 获取分组配置
      const config = await configManager.getGroup(group)
      return NextResponse.json({
        success: true,
        data: config,
        timestamp: new Date().toISOString()
      })
    } else {
      // 获取缓存统计
      const stats = configManager.getCacheStats()
      return NextResponse.json({
        success: true,
        data: {
          cacheStats: stats,
          message: "配置缓存状态正常"
        },
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error("获取配置失败:", error)
    return NextResponse.json({ error: "获取配置失败" }, { status: 500 })
  }
}

/**
 * 实时更新配置
 */
export async function PUT(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.edit")
    if (permissionCheck) return permissionCheck

    const data = await req.json()
    const { key, value, type } = data

    if (!key) {
      return NextResponse.json({ error: "配置键不能为空" }, { status: 400 })
    }

    // 实时更新配置
    await configManager.set(key, value, type)

    return NextResponse.json({
      success: true,
      message: `配置 ${key} 已实时更新`,
      data: { key, value, type },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("更新配置失败:", error)
    return NextResponse.json({ error: "更新配置失败" }, { status: 500 })
  }
}

/**
 * 刷新配置缓存
 */
export async function POST(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.edit")
    if (permissionCheck) return permissionCheck

    const data = await req.json()
    const { action } = data

    switch (action) {
      case 'refresh':
        await configManager.refreshCache()
        return NextResponse.json({
          success: true,
          message: "配置缓存已刷新",
          timestamp: new Date().toISOString()
        })

      case 'clear':
        configManager.clearCache()
        return NextResponse.json({
          success: true,
          message: "配置缓存已清空",
          timestamp: new Date().toISOString()
        })

      case 'stats':
        const stats = configManager.getCacheStats()
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({ error: "无效的操作" }, { status: 400 })
    }
  } catch (error) {
    console.error("配置缓存操作失败:", error)
    return NextResponse.json({ error: "配置缓存操作失败" }, { status: 500 })
  }
}
