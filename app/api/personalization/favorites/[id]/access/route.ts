import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth-actions'
import prisma from '@/lib/db'

// 记录收藏访问
export async function POST(
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

    // 更新访问次数和最后访问时间
    const favorite = await prisma.userFavorite.update({
      where: { id },
      data: {
        accessCount: { increment: 1 },
        lastAccess: new Date()
      }
    })

    return NextResponse.json({ data: favorite })
  } catch (error) {
    console.error('记录收藏访问失败:', error)
    return NextResponse.json({ error: '记录收藏访问失败' }, { status: 500 })
  }
}
