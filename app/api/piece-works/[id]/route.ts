import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/lib/auth"
import { updatePieceWork, deletePieceWork } from "@/lib/actions/piece-work-actions"

// 获取单个计件工作记录
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const pieceWork = await prisma.pieceWork.findUnique({
      where: { id },
      include: {
        employee: true,
        details: {
          include: {
            pieceWorkItem: true,
          },
        },
      },
    })

    if (!pieceWork) {
      return NextResponse.json({ error: "制作工单不存在" }, { status: 404 })
    }

    return NextResponse.json(pieceWork)
  } catch (error) {
    console.error("Error fetching piece work:", error)
    return NextResponse.json({ error: "获取制作工单失败" }, { status: 500 })
  }
}

// 更新计件工作记录
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.employee || !data.date || !data.workType || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: "员工、日期、工作类型和工作项为必填项" }, { status: 400 })
    }

    // 检查计件工作记录是否存在
    const existingPieceWork = await prisma.pieceWork.findUnique({
      where: { id },
      include: {
        details: true,
      },
    })

    if (!existingPieceWork) {
      return NextResponse.json({ error: "制作工单不存在" }, { status: 404 })
    }

    // 使用服务器操作更新计件工作记录
    const result = await updatePieceWork(id, data)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error updating piece work:", error)
    return NextResponse.json({ error: "更新制作工单失败" }, { status: 500 })
  }
}

// 删除计件工作记录
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    // 检查计件工作记录是否存在
    const existingPieceWork = await prisma.pieceWork.findUnique({
      where: { id },
    })

    if (!existingPieceWork) {
      return NextResponse.json({ error: "制作工单不存在" }, { status: 404 })
    }

    // 使用服务器操作删除计件工作记录
    const result = await deletePieceWork(id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error deleting piece work:", error)
    return NextResponse.json({ error: "删除制作工单失败" }, { status: 500 })
  }
}
