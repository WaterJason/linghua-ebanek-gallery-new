import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { withPermission } from "@/lib/auth-middleware"

// 获取所有角色
export async function GET(req: NextRequest) {
  try {
    // 检查角色表是否为空，如果为空则尝试初始化
    const roleCount = await prisma.role.count();
    if (roleCount === 0) {
      console.log("角色表为空，尝试初始化账号管理系统...");
      try {
        // 动态导入初始化函数，避免循环依赖
        const { initAccountSystem } = await import("@/lib/init-account-system");
        await initAccountSystem();
        console.log("账号管理系统初始化成功");
      } catch (initError) {
        console.error("初始化账号管理系统失败:", initError);
        // 即使初始化失败，也继续尝试获取角色列表
      }
    }

    // 从数据库获取角色
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    // 如果没有找到角色，返回空数组而不是错误
    if (!roles || roles.length === 0) {
      console.log("未找到角色数据");
      return NextResponse.json([]);
    }

    // 格式化返回数据
    const formattedRoles = roles.map(role => ({
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.userRoles,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map(rp => rp.permission),
    }));

    return NextResponse.json(formattedRoles);
  } catch (error) {
    console.error("获取角色失败:", error);
    // 返回更详细的错误信息，帮助调试
    return NextResponse.json(
      {
        error: "获取角色失败",
        message: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// 创建新角色
export async function POST(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "permissions.create")
    if (permissionCheck) return permissionCheck

    // 获取请求数据
    const data = await req.json()
    const { name, code, description, permissionIds } = data

    // 验证必填字段
    if (!name || !code) {
      return NextResponse.json({ error: "角色名称和代码为必填项" }, { status: 400 })
    }

    // 检查角色代码是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { code },
    })

    if (existingRole) {
      return NextResponse.json({ error: "角色代码已被使用" }, { status: 400 })
    }

    // 创建角色
    const role = await prisma.role.create({
      data: {
        name,
        code,
        description,
        isSystem: false,
      },
    })

    // 分配权限
    if (permissionIds && permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: number) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      })
    }

    // 获取完整角色信息
    const createdRole = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    // 记录系统日志
    await prisma.systemLog.create({
      data: {
        module: "roles",
        level: "info",
        message: `创建角色: ${name}`,
        details: JSON.stringify({
          roleId: role.id,
          name,
          code,
          permissionIds,
        }),
      },
    })

    // 格式化角色数据
    const formattedRole = {
      id: createdRole?.id,
      name: createdRole?.name,
      code: createdRole?.code,
      description: createdRole?.description,
      isSystem: createdRole?.isSystem,
      createdAt: createdRole?.createdAt,
      updatedAt: createdRole?.updatedAt,
      permissions: createdRole?.permissions.map(rp => rp.permission) || [],
    }

    return NextResponse.json(formattedRole)
  } catch (error) {
    console.error("创建角色失败:", error)
    return NextResponse.json({ error: "创建角色失败" }, { status: 500 })
  }
}
