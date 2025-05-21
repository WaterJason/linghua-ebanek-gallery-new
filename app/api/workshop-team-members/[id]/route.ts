import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

// 获取单个团建服务团队成员
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const teamMember = await prisma.workshopTeamMember.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true,
            phone: true,
            email: true,
            status: true,
          },
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json({ error: "团建服务团队成员不存在" }, { status: 404 })
    }

    return NextResponse.json(teamMember)
  } catch (error) {
    console.error("Error fetching workshop team member:", error)
    return NextResponse.json({ error: "获取团建服务团队成员失败" }, { status: 500 })
  }
}

// 更新团建服务团队成员
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
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
    if (!data.employeeId || !data.role) {
      return NextResponse.json({ error: "员工ID和角色为必填项" }, { status: 400 })
    }

    // 检查团队成员是否存在
    const existingMember = await prisma.workshopTeamMember.findUnique({
      where: { id },
    })

    if (!existingMember) {
      return NextResponse.json({ error: "团建服务团队成员不存在" }, { status: 404 })
    }

    // 如果更改了员工ID或角色，检查是否已存在相同员工和角色的记录
    if (parseInt(data.employeeId) !== existingMember.employeeId || data.role !== existingMember.role) {
      const duplicateMember = await prisma.workshopTeamMember.findFirst({
        where: {
          employeeId: parseInt(data.employeeId),
          role: data.role,
          NOT: {
            id,
          },
        },
      })

      if (duplicateMember) {
        return NextResponse.json({ error: "该员工已经以相同角色存在于团队中" }, { status: 400 })
      }
    }

    // 更新团队成员
    const teamMember = await prisma.workshopTeamMember.update({
      where: { id },
      data: {
        employeeId: parseInt(data.employeeId),
        role: data.role,
        specialties: data.specialties || [],
        rating: parseFloat(data.rating) || 5.0,
        maxWorkshopsPerDay: parseInt(data.maxWorkshopsPerDay) || 2,
        isActive: data.isActive,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true,
            phone: true,
            email: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json(teamMember)
  } catch (error) {
    console.error("Error updating workshop team member:", error)
    return NextResponse.json({ error: "更新团建服务团队成员失败" }, { status: 500 })
  }
}

// 删除团建服务团队成员
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    // 检查团队成员是否存在
    const existingMember = await prisma.workshopTeamMember.findUnique({
      where: { id },
    })

    if (!existingMember) {
      return NextResponse.json({ error: "团建服务团队成员不存在" }, { status: 404 })
    }

    // 删除团队成员
    await prisma.workshopTeamMember.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting workshop team member:", error)
    return NextResponse.json({ error: "删除团建服务团队成员失败" }, { status: 500 })
  }
}
