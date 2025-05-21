import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

// 获取所有供应商
export async function GET(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("isActive")
    
    let whereClause = {}
    
    if (isActive === "true") {
      whereClause = { isActive: true }
    } else if (isActive === "false") {
      whereClause = { isActive: false }
    }
    
    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      orderBy: {
        id: "asc",
      },
    })
    
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error("获取供应商列表失败:", error)
    return NextResponse.json({ error: "获取供应商列表失败" }, { status: 500 })
  }
}

// 创建供应商
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.name || data.name.trim() === "") {
      return NextResponse.json({ error: "供应商名称为必填项" }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name.trim(),
        contactPerson: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error("创建供应商失败:", error)
    return NextResponse.json({ error: "创建供应商失败" }, { status: 500 })
  }
}

// 更新供应商
export async function PUT(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: "供应商ID为必填项" }, { status: 400 })
    }

    // 验证必填字段
    if (!updateData.name || updateData.name.trim() === "") {
      return NextResponse.json({ error: "供应商名称为必填项" }, { status: 400 })
    }

    const supplier = await prisma.supplier.update({
      where: { id: Number(id) },
      data: {
        name: updateData.name.trim(),
        contactPerson: updateData.contactPerson || null,
        phone: updateData.phone || null,
        email: updateData.email || null,
        address: updateData.address || null,
        description: updateData.description || null,
        isActive: updateData.isActive !== undefined ? updateData.isActive : true,
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error("更新供应商失败:", error)
    return NextResponse.json({ error: "更新供应商失败" }, { status: 500 })
  }
}

// 删除供应商
export async function DELETE(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "供应商ID为必填项" }, { status: 400 })
    }

    // 检查是否有关联的采购订单
    const purchaseOrderCount = await prisma.purchaseOrder.count({
      where: { supplierId: Number(id) },
    })

    if (purchaseOrderCount > 0) {
      return NextResponse.json({ error: "该供应商有关联的采购订单，无法删除" }, { status: 400 })
    }

    await prisma.supplier.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除供应商失败:", error)
    return NextResponse.json({ error: "删除供应商失败" }, { status: 500 })
  }
}
