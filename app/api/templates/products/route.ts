import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import ExcelJS from "exceljs"

export async function GET() {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession()
    if (!session) {
      console.log("模板下载未授权: 用户未登录")
      return NextResponse.json({
        error: "未授权",
        message: "请先登录后再下载模板"
      }, {
        status: 403
      })
    }

    // 检查用户角色权限
    const userRole = session.user?.role
    if (userRole !== "admin" && userRole !== "manager" && userRole !== "staff") {
      console.log(`模板下载未授权: 用户角色 ${userRole} 无权限`)
      return NextResponse.json({
        error: "未授权",
        message: "您没有下载模板的权限"
      }, {
        status: 403
      })
    }

    // 创建Excel工作簿
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "聆花掐丝珐琅馆"
    workbook.created = new Date()

    // 添加工作表
    const worksheet = workbook.addWorksheet("产品导入模板")

    // 设置列
    worksheet.columns = [
      { header: "产品名称", key: "name", width: 30 },
      { header: "价格", key: "price", width: 15 },
      { header: "提成比例", key: "commissionRate", width: 15 },
      { header: "分类", key: "category", width: 20 },
      { header: "条码", key: "barcode", width: 20 },
      { header: "尺寸", key: "dimensions", width: 20 },
      { header: "材质", key: "material", width: 20 },
      { header: "单位", key: "unit", width: 10 },
      { header: "描述", key: "description", width: 50 },
      { header: "库存", key: "inventory", width: 10 },
    ]

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" }
    }

    // 添加示例数据
    worksheet.addRow({
      name: "示例产品1",
      price: 100,
      commissionRate: 10,
      category: "珐琅首饰",
      barcode: "1234567890",
      dimensions: "10x5cm",
      material: "铜",
      unit: "个",
      description: "这是一个示例产品描述",
      inventory: 10,
    })

    worksheet.addRow({
      name: "示例产品2",
      price: 200,
      commissionRate: 15,
      category: "珐琅摆件",
      barcode: "0987654321",
      dimensions: "20x15cm",
      material: "银",
      unit: "件",
      description: "这是另一个示例产品描述",
      inventory: 5,
    })

    // 添加说明工作表
    const instructionSheet = workbook.addWorksheet("使用说明")

    // 设置说明内容
    instructionSheet.columns = [
      { header: "字段", key: "field", width: 20 },
      { header: "说明", key: "description", width: 60 },
      { header: "是否必填", key: "required", width: 15 },
      { header: "格式要求", key: "format", width: 30 },
    ]

    // 设置表头样式
    instructionSheet.getRow(1).font = { bold: true }
    instructionSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" }
    instructionSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" }
    }

    // 添加字段说明
    const fieldInstructions = [
      { field: "产品名称", description: "产品的名称", required: "是", format: "文本" },
      { field: "价格", description: "产品的销售价格", required: "是", format: "数字，大于0" },
      { field: "提成比例", description: "销售提成比例", required: "否", format: "数字，0-100之间" },
      { field: "分类", description: "产品所属分类", required: "否", format: "文本，已存在的分类名称" },
      { field: "条码", description: "产品条形码", required: "否", format: "文本" },
      { field: "尺寸", description: "产品尺寸", required: "否", format: "文本，建议格式：长x宽x高" },
      { field: "材质", description: "产品材质", required: "否", format: "文本" },
      { field: "单位", description: "产品计量单位", required: "否", format: "文本，如：个、件、套" },
      { field: "描述", description: "产品详细描述", required: "否", format: "文本" },
      { field: "库存", description: "产品初始库存数量", required: "否", format: "数字，大于等于0" },
    ]

    fieldInstructions.forEach(instruction => {
      instructionSheet.addRow(instruction)
    })

    // 添加使用说明
    instructionSheet.addRow({})
    instructionSheet.addRow({})

    const noteRow = instructionSheet.addRow(["注意事项"])
    noteRow.font = { bold: true, size: 12 }
    noteRow.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFD700" }
    }

    const notes = [
      "1. 必填字段必须填写，否则导入将失败。",
      "2. 价格必须是大于0的数字。",
      "3. 提成比例必须是0-100之间的数字，表示百分比。",
      "4. 如果分类不存在，系统将自动创建。",
      "5. 库存必须是大于等于0的整数。",
      "6. 导入时，系统会根据产品名称判断是新增还是更新。",
      "7. 如果产品名称已存在，系统将更新该产品的信息。",
      "8. 如果产品名称不存在，系统将创建新产品。",
      "9. 请不要修改表头名称，否则导入将失败。",
      "10. 请不要添加额外的列，系统将忽略这些列。",
    ]

    notes.forEach(note => {
      instructionSheet.addRow([note])
    })

    // 设置活动工作表为第一个
    workbook.views = [
      {
        firstSheet: 0,
        activeTab: 0,
        visibility: "visible"
      }
    ]

    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer()

    // 设置响应头
    const headers = new Headers()
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    headers.set("Content-Disposition", `attachment; filename="product_import_template.xlsx"`)

    return new NextResponse(buffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("生成产品导入模板失败:", error)
    return NextResponse.json({ error: "生成产品导入模板失败" }, { status: 500 })
  }
}
