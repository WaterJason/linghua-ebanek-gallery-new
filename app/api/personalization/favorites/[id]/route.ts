import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth-actions'
import prisma from '@/lib/db'

// 更新收藏
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // 验证收藏是否属于当前用户
    const existingFavorite = await prisma.userFavorite.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingFavorite) {
      return NextResponse.json({ error: '收藏不存在或无权限' }, { status: 404 })
    }

    const favorite = await prisma.userFavorite.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ data: favorite })
  } catch (error) {
    console.error('更新收藏失败:', error)
    return NextResponse.json({ error: '更新收藏失败' }, { status: 500 })
  }
}

// 删除收藏
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { id } = params

    // 验证收藏是否属于当前用户
    const existingFavorite = await prisma.userFavorite.findFirst({
      where: { id, userId: user.id }
    })

    if (!existingFavorite) {
      return NextResponse.json({ error: '收藏不存在或无权限' }, { status: 404 })
    }

    await prisma.userFavorite.delete({
      where: { id }
    })

    return NextResponse.json({ message: '删除成功' })
  } catch (error) {
    console.error('删除收藏失败:', error)
    return NextResponse.json({ error: '删除收藏失败' }, { status: 500 })
  }
}
