import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import ExcelJS from "exceljs"

// 获取所有产品并导出为Excel
export async function GET() {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取所有产品
    const products = await prisma.product.findMany({
      orderBy: {
        id: "asc",
      },
    })

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "聆花掐丝珐琅馆"
    workbook.created = new Date()

    // 添加工作表
    const worksheet = workbook.addWorksheet("产品列表")

    // 设置列
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "产品名称", key: "name", width: 30 },
      { header: "价格", key: "price", width: 15 },
      { header: "提成比例", key: "commissionRate", width: 15 },
      { header: "类型", key: "type", width: 15 },
      { header: "图片URL", key: "imageUrl", width: 50 },
      { header: "描述", key: "description", width: 50 },
      { header: "创建时间", key: "createdAt", width: 20 },
    ]

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" }

    // 添加数据
    products.forEach((product) => {
      worksheet.addRow({
        id: product.id,
        name: product.name,
        price: product.price,
        commissionRate: product.commissionRate,
        type: product.type,
        imageUrl: product.imageUrl || "",
        description: product.description || "",
        createdAt: product.createdAt.toLocaleString(),
      })
    })

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer()

    // 设置响应头
    const headers = new Headers()
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    headers.set("Content-Disposition", `attachment; filename="products_${new Date().toISOString().split("T")[0]}.xlsx"`)

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("导出产品数据失败:", error)
    return NextResponse.json({ error: "导出产品数据失败" }, { status: 500 })
  }
}

// 根据提供的数据导出为Excel或CSV
export async function POST(request: NextRequest) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get("format") || "excel"
    const fieldsParam = searchParams.get("fields") || ""
    const fields = fieldsParam ? fieldsParam.split(",") : []

    // 获取请求数据
    const products = await request.json()

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "没有可导出的数据" }, { status: 400 })
    }

    // 如果没有指定字段，使用所有字段
    const exportFields = fields.length > 0 ? fields : Object.keys(products[0])

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "聆花掐丝珐琅馆"
    workbook.created = new Date()

    // 添加工作表
    const worksheet = workbook.addWorksheet("产品列表")

    // 设置列
    const columns = exportFields.map(field => {
      // 根据字段名设置列标题和宽度
      const headerMap: Record<string, string> = {
        name: "产品名称",
        price: "价格",
        commissionRate: "提成比例",
        category: "分类",
        barcode: "条码",
        dimensions: "尺寸",
        material: "材质",
        unit: "单位",
        description: "描述",
        details: "作品介绍",
        inventory: "库存",
        imageUrl: "图片URL",
        cost: "成本",
        sku: "SKU",
      }

      const widthMap: Record<string, number> = {
        name: 30,
        price: 15,
        commissionRate: 15,
        category: 20,
        barcode: 20,
        dimensions: 20,
        material: 20,
        unit: 10,
        description: 50,
        details: 50,
        inventory: 10,
        imageUrl: 50,
        cost: 15,
        sku: 20,
      }

      return {
        header: headerMap[field] || field,
        key: field,
        width: widthMap[field] || 20
      }
    })

    worksheet.columns = columns

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" }

    // 添加数据
    products.forEach(product => {
      const rowData: Record<string, any> = {}

      exportFields.forEach(field => {
        if (product[field] !== undefined) {
          rowData[field] = product[field]
        } else {
          rowData[field] = ""
        }
      })

      worksheet.addRow(rowData)
    })

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `products_export_${timestamp}`

    // 根据格式导出
    if (format === "csv") {
      // 导出为CSV
      const csvBuffer = await workbook.csv.writeBuffer()

      return new NextResponse(csvBuffer, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      })
    } else {
      // 导出为Excel
      const buffer = await workbook.xlsx.writeBuffer()

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      })
    }
  } catch (error) {
    console.error("导出产品数据失败:", error)
    return NextResponse.json({
      error: "导出产品数据失败",
      details: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 })
  }
}
