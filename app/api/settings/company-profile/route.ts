import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getServerSession } from "@/lib/auth-helpers"
import { withPermission } from "@/lib/auth-middleware"

/**
 * 获取公司信息
 */
export async function GET(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.view")
    if (permissionCheck) return permissionCheck

    // 获取公司信息
    const companyProfile = await prisma.companyProfile.findFirst()

    if (!companyProfile) {
      // 返回默认值
      return NextResponse.json({
        companyName: "灵华文化",
        address: "",
        phone: "",
        email: "",
      })
    }

    return NextResponse.json(companyProfile)
  } catch (error) {
    console.error("获取公司信息失败:", error)
    return NextResponse.json(
      { error: "获取公司信息失败" },
      { status: 500 }
    )
  }
}

/**
 * 创建或更新公司信息
 */
export async function POST(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.edit")
    if (permissionCheck) return permissionCheck

    const data = await req.json()
    
    // 验证必填字段
    if (!data.companyName || !data.address || !data.phone || !data.email) {
      return NextResponse.json(
        { error: "公司名称、地址、电话和邮箱为必填项" },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      )
    }

    // 检查是否已存在公司信息
    const existingProfile = await prisma.companyProfile.findFirst()

    let companyProfile
    if (existingProfile) {
      // 更新现有信息
      companyProfile = await prisma.companyProfile.update({
        where: { id: existingProfile.id },
        data: {
          companyName: data.companyName,
          companyNameEn: data.companyNameEn,
          logoUrl: data.logoUrl,
          address: data.address,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
          country: data.country || "中国",
          phone: data.phone,
          fax: data.fax,
          email: data.email,
          website: data.website,
          taxNumber: data.taxNumber,
          businessLicense: data.businessLicense,
          legalRepresentative: data.legalRepresentative,
          registeredCapital: data.registeredCapital,
          businessScope: data.businessScope,
          description: data.description,
          foundedDate: data.foundedDate ? new Date(data.foundedDate) : null,
          updatedAt: new Date(),
        }
      })
    } else {
      // 创建新的公司信息
      companyProfile = await prisma.companyProfile.create({
        data: {
          companyName: data.companyName,
          companyNameEn: data.companyNameEn,
          logoUrl: data.logoUrl,
          address: data.address,
          city: data.city,
          province: data.province,
          postalCode: data.postalCode,
          country: data.country || "中国",
          phone: data.phone,
          fax: data.fax,
          email: data.email,
          website: data.website,
          taxNumber: data.taxNumber,
          businessLicense: data.businessLicense,
          legalRepresentative: data.legalRepresentative,
          registeredCapital: data.registeredCapital,
          businessScope: data.businessScope,
          description: data.description,
          foundedDate: data.foundedDate ? new Date(data.foundedDate) : null,
        }
      })
    }

    return NextResponse.json(companyProfile)
  } catch (error) {
    console.error("保存公司信息失败:", error)
    return NextResponse.json(
      { error: "保存公司信息失败" },
      { status: 500 }
    )
  }
}

/**
 * 删除公司信息
 */
export async function DELETE(req: NextRequest) {
  try {
    // 检查权限
    const permissionCheck = await withPermission(req, "settings.delete")
    if (permissionCheck) return permissionCheck

    // 删除公司信息
    await prisma.companyProfile.deleteMany()

    return NextResponse.json({ message: "公司信息已删除" })
  } catch (error) {
    console.error("删除公司信息失败:", error)
    return NextResponse.json(
      { error: "删除公司信息失败" },
      { status: 500 }
    )
  }
}
