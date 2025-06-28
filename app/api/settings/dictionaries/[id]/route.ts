import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerSession } from "@/lib/auth-helpers"
import { withPermission } from "@/lib/auth-middleware"

/**
 * 获取单个数据字典
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.view")
    if (permissionCheck) return permissionCheck

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "无效的字典ID" },
        { status: 400 }
      )
    }

    const dictionary = await prisma.dataDictionary.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!dictionary) {
      return NextResponse.json(
        { error: "字典不存在" },
        { status: 404 }
      )
    }

    return NextResponse.json(dictionary)
  } catch (error) {
    console.error("获取数据字典失败:", error)
    return NextResponse.json(
      { error: "获取数据字典失败" },
      { status: 500 }
    )
  }
}

/**
 * 更新数据字典
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.edit")
    if (permissionCheck) return permissionCheck

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "无效的字典ID" },
        { status: 400 }
      )
    }

    const data = await req.json()
    const { code, name, description, isActive } = data

    // 验证必填字段
    if (!code || !name) {
      return NextResponse.json(
        { error: "字典代码和名称为必填项" },
        { status: 400 }
      )
    }

    // 检查字典是否存在
    const existingDict = await prisma.dataDictionary.findUnique({
      where: { id }
    })

    if (!existingDict) {
      return NextResponse.json(
        { error: "字典不存在" },
        { status: 404 }
      )
    }

    // 检查代码是否与其他字典冲突
    if (code !== existingDict.code) {
      const codeConflict = await prisma.dataDictionary.findFirst({
        where: {
          code,
          id: { not: id }
        }
      })

      if (codeConflict) {
        return NextResponse.json(
          { error: "字典代码已存在" },
          { status: 400 }
        )
      }
    }

    // 更新字典
    const updatedDictionary = await prisma.dataDictionary.update({
      where: { id },
      data: {
        code,
        name,
        description: description || "",
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json(updatedDictionary)
  } catch (error) {
    console.error("更新数据字典失败:", error)
    return NextResponse.json(
      { error: "更新数据字典失败" },
      { status: 500 }
    )
  }
}

/**
 * 删除数据字典
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.delete")
    if (permissionCheck) return permissionCheck

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "无效的字典ID" },
        { status: 400 }
      )
    }

    // 检查字典是否存在
    const existingDict = await prisma.dataDictionary.findUnique({
      where: { id }
    })

    if (!existingDict) {
      return NextResponse.json(
        { error: "字典不存在" },
        { status: 404 }
      )
    }

    // 检查是否为系统字典
    if (existingDict.isSystem) {
      return NextResponse.json(
        { error: "系统字典不能删除" },
        { status: 400 }
      )
    }

    // 删除字典项
    await prisma.dataDictionaryItem.deleteMany({
      where: { dictionaryId: id }
    })

    // 删除字典
    await prisma.dataDictionary.delete({
      where: { id }
    })

    return NextResponse.json({ message: "字典已删除" })
  } catch (error) {
    console.error("删除数据字典失败:", error)
    return NextResponse.json(
      { error: "删除数据字典失败" },
      { status: 500 }
    )
  }
}
