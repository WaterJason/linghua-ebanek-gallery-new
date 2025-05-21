import { NextResponse } from "next/server"
import { auth } from "@/auth"

import { 
  getFinancialCategory, 
  updateFinancialCategory, 
  deleteFinancialCategory 
} from "@/lib/actions/finance-actions"

/**
 * 获取单个收支分类
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const category = await getFinancialCategory(id)
    if (!category) {
      return NextResponse.json({ error: "收支分类不存在" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error(`Error fetching financial category (ID: ${params.id}):`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取收支分类失败" },
      { status: 500 }
    )
  }
}

/**
 * 更新收支分类
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const data = await request.json()
    const category = await updateFinancialCategory(id, data)
    return NextResponse.json(category)
  } catch (error) {
    console.error(`Error updating financial category (ID: ${params.id}):`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新收支分类失败" },
      { status: 500 }
    )
  }
}

/**
 * 删除收支分类
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录且有权限
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 })
    }

    const result = await deleteFinancialCategory(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error deleting financial category (ID: ${params.id}):`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除收支分类失败" },
      { status: 500 }
    )
  }
}
