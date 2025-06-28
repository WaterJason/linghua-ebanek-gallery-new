import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth-actions'
import prisma from '@/lib/db'

// 获取用户报表配置
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType')

    const where: any = { userId: user.id }
    if (reportType) where.reportType = reportType

    const configs = await prisma.reportConfig.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ data: configs })
  } catch (error) {
    console.error('获取报表配置失败:', error)
    return NextResponse.json({ error: '获取报表配置失败' }, { status: 500 })
  }
}

// 创建报表配置
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { reportType, name, description, config, isDefault } = body

    // 验证必填字段
    if (!reportType || !name || !config) {
      return NextResponse.json({ error: '报表类型、名称和配置为必填字段' }, { status: 400 })
    }

    // 如果设置为默认配置，先取消同类型的其他默认配置
    if (isDefault) {
      await prisma.reportConfig.updateMany({
        where: { userId: user.id, reportType, isDefault: true },
        data: { isDefault: false }
      })
    }

    const reportConfig = await prisma.reportConfig.create({
      data: {
        userId: user.id,
        reportType,
        name,
        description,
        config,
        isDefault: isDefault || false
      }
    })

    return NextResponse.json({ data: reportConfig })
  } catch (error) {
    console.error('创建报表配置失败:', error)
    return NextResponse.json({ error: '创建报表配置失败' }, { status: 500 })
  }
}
