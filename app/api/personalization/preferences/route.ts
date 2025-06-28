import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth-actions'
import prisma from '@/lib/db'

// 获取用户偏好设置
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: any = { userId: user.id }
    if (category) where.category = category

    const preferences = await prisma.userPreference.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: preferences })
  } catch (error) {
    console.error('获取用户偏好失败:', error)
    return NextResponse.json({ error: '获取用户偏好失败' }, { status: 500 })
  }
}

// 设置用户偏好
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { category, key, value } = body

    // 验证必填字段
    if (!category || !key) {
      return NextResponse.json({ error: '分类和键为必填字段' }, { status: 400 })
    }

    // 使用 upsert 操作，如果存在则更新，不存在则创建
    const preference = await prisma.userPreference.upsert({
      where: {
        userId_category_key: {
          userId: user.id,
          category,
          key
        }
      },
      update: {
        value,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        category,
        key,
        value
      }
    })

    return NextResponse.json({ data: preference })
  } catch (error) {
    console.error('设置用户偏好失败:', error)
    return NextResponse.json({ error: '设置用户偏好失败' }, { status: 500 })
  }
}
