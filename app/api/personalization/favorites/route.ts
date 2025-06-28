import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth-actions'
import prisma from '@/lib/db'

// 获取用户收藏列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    const where: any = { userId: user.id }
    if (type) where.type = type
    if (category) where.category = category

    const favorites = await prisma.userFavorite.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { accessCount: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ data: favorites })
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    return NextResponse.json({ error: '获取收藏列表失败' }, { status: 500 })
  }
}

// 添加收藏
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, url, icon, category, description, config } = body

    // 验证必填字段
    if (!type || !title) {
      return NextResponse.json({ error: '类型和标题为必填字段' }, { status: 400 })
    }

    // 检查是否已存在相同的收藏
    const existingFavorite = await prisma.userFavorite.findFirst({
      where: {
        userId: user.id,
        type,
        title,
        url: url || null
      }
    })

    if (existingFavorite) {
      return NextResponse.json({ error: '该收藏已存在' }, { status: 409 })
    }

    // 获取当前用户收藏数量，用于设置排序
    const favoriteCount = await prisma.userFavorite.count({
      where: { userId: user.id }
    })

    const favorite = await prisma.userFavorite.create({
      data: {
        userId: user.id,
        type,
        title,
        url,
        icon,
        category,
        description,
        config,
        sortOrder: favoriteCount
      }
    })

    return NextResponse.json({ data: favorite })
  } catch (error) {
    console.error('添加收藏失败:', error)
    return NextResponse.json({ error: '添加收藏失败' }, { status: 500 })
  }
}
