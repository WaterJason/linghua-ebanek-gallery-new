import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth-actions'
import prisma from '@/lib/db'

// 获取用户仪表盘布局
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const layouts = await prisma.dashboardLayout.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ data: layouts })
  } catch (error) {
    console.error('获取仪表盘布局失败:', error)
    return NextResponse.json({ error: '获取仪表盘布局失败' }, { status: 500 })
  }
}

// 创建仪表盘布局
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { name, isDefault, layout } = body

    // 验证必填字段
    if (!name || !layout) {
      return NextResponse.json({ error: '名称和布局为必填字段' }, { status: 400 })
    }

    // 如果设置为默认布局，先取消其他默认布局
    if (isDefault) {
      await prisma.dashboardLayout.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      })
    }

    const dashboardLayout = await prisma.dashboardLayout.create({
      data: {
        userId: user.id,
        name,
        isDefault: isDefault || false,
        layout
      }
    })

    return NextResponse.json({ data: dashboardLayout })
  } catch (error) {
    console.error('创建仪表盘布局失败:', error)
    return NextResponse.json({ error: '创建仪表盘布局失败' }, { status: 500 })
  }
}
