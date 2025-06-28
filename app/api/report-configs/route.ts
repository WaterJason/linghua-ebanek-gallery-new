import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { auth } from "@/auth"

// 获取用户的报表配置
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("reportType")
    const isPublic = searchParams.get("isPublic") === "true"

    const where: any = {
      OR: [
        { userId: session.user.id },
        { isPublic: true }
      ]
    }

    if (reportType) {
      where.reportType = reportType
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic
    }

    const configs = await prisma.userPreference.findMany({
      where: {
        ...where,
        category: 'reports'
      },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    // 解析配置数据
    const reportConfigs = configs.map(config => ({
      id: config.id,
      name: config.key,
      ...config.value,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }))

    return NextResponse.json(reportConfigs)
  } catch (error) {
    console.error("Error fetching report configs:", error)
    return NextResponse.json({ error: "获取报表配置失败" }, { status: 500 })
  }
}

// 创建新的报表配置
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      reportType,
      fields,
      filters,
      sorts,
      grouping,
      chartConfig,
      isDefault = false,
      isPublic = false
    } = body

    // 验证必填字段
    if (!name || !reportType || !fields || !chartConfig) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    // 如果设置为默认配置，先取消其他默认配置
    if (isDefault) {
      await prisma.userPreference.updateMany({
        where: {
          userId: session.user.id,
          category: 'reports',
          key: {
            contains: reportType
          }
        },
        data: {
          value: {
            path: ['isDefault'],
            set: false
          }
        }
      })
    }

    // 创建配置数据
    const configData = {
      name,
      description,
      reportType,
      fields,
      filters: filters || [],
      sorts: sorts || [],
      grouping,
      chartConfig,
      isDefault,
      isPublic,
      createdBy: session.user.id
    }

    const config = await prisma.userPreference.create({
      data: {
        userId: session.user.id,
        category: 'reports',
        key: `${reportType}_${name.toLowerCase().replace(/\s+/g, '_')}`,
        value: configData
      }
    })

    return NextResponse.json({
      id: config.id,
      ...configData,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    })
  } catch (error) {
    console.error("Error creating report config:", error)
    return NextResponse.json({ error: "创建报表配置失败" }, { status: 500 })
  }
}

// 更新报表配置
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "缺少配置ID" }, { status: 400 })
    }

    // 检查配置是否存在且用户有权限
    const existingConfig = await prisma.userPreference.findFirst({
      where: {
        id,
        userId: session.user.id,
        category: 'reports'
      }
    })

    if (!existingConfig) {
      return NextResponse.json({ error: "配置不存在或无权限" }, { status: 404 })
    }

    // 如果设置为默认配置，先取消其他默认配置
    if (updateData.isDefault) {
      await prisma.userPreference.updateMany({
        where: {
          userId: session.user.id,
          category: 'reports',
          key: {
            contains: updateData.reportType || existingConfig.value.reportType
          },
          id: {
            not: id
          }
        },
        data: {
          value: {
            path: ['isDefault'],
            set: false
          }
        }
      })
    }

    // 更新配置
    const updatedConfig = await prisma.userPreference.update({
      where: { id },
      data: {
        value: {
          ...existingConfig.value,
          ...updateData,
          updatedAt: new Date()
        }
      }
    })

    return NextResponse.json({
      id: updatedConfig.id,
      ...updatedConfig.value,
      createdAt: updatedConfig.createdAt,
      updatedAt: updatedConfig.updatedAt
    })
  } catch (error) {
    console.error("Error updating report config:", error)
    return NextResponse.json({ error: "更新报表配置失败" }, { status: 500 })
  }
}

// 删除报表配置
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "缺少配置ID" }, { status: 400 })
    }

    // 检查配置是否存在且用户有权限
    const existingConfig = await prisma.userPreference.findFirst({
      where: {
        id,
        userId: session.user.id,
        category: 'reports'
      }
    })

    if (!existingConfig) {
      return NextResponse.json({ error: "配置不存在或无权限" }, { status: 404 })
    }

    // 删除配置
    await prisma.userPreference.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting report config:", error)
    return NextResponse.json({ error: "删除报表配置失败" }, { status: 500 })
  }
}
