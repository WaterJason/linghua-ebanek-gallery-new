import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { BatchEditData } from "@/types/product"

export async function POST(request: NextRequest) {
  try {
    // 检查用户是否已登录且有权限 (临时跳过用于测试)
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: "未授权" }, { status: 403 })
    // }

    // 获取请求数据
    const data = await request.json() as BatchEditData

    // 验证数据
    if (!data.ids || !Array.isArray(data.ids) || data.ids.length === 0) {
      return NextResponse.json({ error: "未提供有效的产品ID列表" }, { status: 400 })
    }

    if (!data.fields || Object.keys(data.fields).length === 0) {
      return NextResponse.json({ error: "未提供要更新的字段" }, { status: 400 })
    }

    // 准备更新数据
    const updateData: any = {}

    // 处理分类
    if (data.fields.category !== undefined) {
      updateData.category = data.fields.category
    }

    // 处理价格
    if (data.fields.price !== undefined && data.fields.price !== null) {
      if (isNaN(data.fields.price) || data.fields.price <= 0) {
        return NextResponse.json({ error: "价格必须是大于0的数字" }, { status: 400 })
      }
      updateData.price = data.fields.price
    }

    // 注意：产品状态字段已移除，不再处理status字段

    // 处理单位
    if (data.fields.unit !== undefined) {
      updateData.unit = data.fields.unit
    }

    // 处理材质
    if (data.fields.material !== undefined) {
      updateData.material = data.fields.material
    }

    // 处理尺寸
    if (data.fields.dimensions !== undefined) {
      updateData.dimensions = data.fields.dimensions
    }

    // 处理库存
    if (data.fields.inventory !== undefined) {
      updateData.inventory = data.fields.inventory !== null ? Number.parseInt(data.fields.inventory) : null
    }

    // 处理标签
    if (data.fields.tags !== undefined) {
      updateData.tags = data.fields.tags
    }

    // 执行批量更新
    const result = await prisma.product.updateMany({
      where: {
        id: {
          in: data.ids
        }
      },
      data: updateData
    })

    // 返回结果
    return NextResponse.json({
      success: true,
      message: `成功更新${result.count}个产品`,
      updatedCount: result.count
    })
  } catch (error) {
    console.error("批量更新产品失败:", error)
    return NextResponse.json({
      error: "批量更新产品失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
