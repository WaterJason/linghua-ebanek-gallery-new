import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"

// 获取所有团建服务团队成员
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const isActive = searchParams.get("isActive")

    let whereClause: any = {}

    if (role) {
      whereClause.role = role
    }

    if (isActive === "true") {
      whereClause.isActive = true
    } else if (isActive === "false") {
      whereClause.isActive = false
    }

    const teamMembers = await prisma.workshopTeamMember.findMany({
      where: whereClause,
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
      orderBy: {
        id: "asc",
      },
    })

    return NextResponse.json(teamMembers)
  } catch (error) {
    console.error("Error fetching workshop team members:", error)
    return NextResponse.json({ error: "获取团建服务团队成员失败" }, { status: 500 })
  }
}

// 创建团建服务团队成员
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.employeeId || !data.role) {
      return NextResponse.json({ error: "员工ID和角色为必填项" }, { status: 400 })
    }

    // 检查员工是否存在
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(data.employeeId) },
    })

    if (!employee) {
      return NextResponse.json({ error: "员工不存在" }, { status: 400 })
    }

    // 检查是否已存在相同员工和角色的记录
    const existingMember = await prisma.workshopTeamMember.findFirst({
      where: {
        employeeId: parseInt(data.employeeId),
        role: data.role,
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "该员工已经以相同角色存在于团队中" }, { status: 400 })
    }

    // 创建团队成员
    const teamMember = await prisma.workshopTeamMember.create({
      data: {
        employeeId: parseInt(data.employeeId),
        role: data.role,
        specialties: data.specialties || [],
        rating: parseFloat(data.rating) || 5.0,
        maxWorkshopsPerDay: parseInt(data.maxWorkshopsPerDay) || 2,
        isActive: data.isActive !== undefined ? data.isActive : true,
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
    console.error("Error creating workshop team member:", error)
    return NextResponse.json({ error: "创建团建服务团队成员失败" }, { status: 500 })
  }
}
