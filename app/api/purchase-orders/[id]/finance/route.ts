import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { 
  processPurchaseFinanceIntegration,
  getPurchaseOrderFinanceStatus,
  processPurchasePayment
} from "@/lib/services/finance-integration"

// 财务集成数据类型
interface FinanceIntegrationData {
  action: "integrate" | "payment"
  amount?: number
  paymentMethod?: string
  notes?: string
}

// 采购订单财务集成API
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 采购订单财务集成API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }
    
    const purchaseOrderId = parseInt(params.id)
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }
    
    const body = await request.json() as FinanceIntegrationData
    const { action, amount, paymentMethod, notes } = body
    
    // 验证必填字段
    if (!action || !["integrate", "payment"].includes(action)) {
      return NextResponse.json({ 
        error: "无效的操作类型" 
      }, { status: 400 })
    }
    
    // 获取采购订单信息
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
        employee: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
    
    if (!purchaseOrder) {
      return NextResponse.json({ error: "采购订单不存在" }, { status: 404 })
    }
    
    console.log(`📝 执行财务操作: ${action}，订单: ${purchaseOrder.orderNumber}`)
    
    let result
    
    if (action === "integrate") {
      // 财务集成操作
      const financeData = {
        purchaseOrderId,
        supplierId: purchaseOrder.supplierId,
        totalAmount: purchaseOrder.totalAmount,
        paidAmount: purchaseOrder.paidAmount,
        paymentMethod: purchaseOrder.paymentMethod,
        items: purchaseOrder.items.map(item => ({
          productId: item.productId!,
          quantity: item.quantity,
          unitCost: item.price,
          totalCost: item.quantity * item.price
        })),
        operatorId: session.user.id,
        notes
      }
      
      const integrationResult = await processPurchaseFinanceIntegration(financeData)
      
      result = {
        action: "integrate",
        integrationResult,
        purchaseOrder
      }
      
    } else if (action === "payment") {
      // 付款操作
      if (!amount || amount <= 0) {
        return NextResponse.json({ 
          error: "付款金额必须大于0" 
        }, { status: 400 })
      }
      
      if (!paymentMethod) {
        return NextResponse.json({ 
          error: "请指定付款方式" 
        }, { status: 400 })
      }
      
      const paymentResult = await processPurchasePayment(
        purchaseOrderId,
        amount,
        paymentMethod,
        session.user.id,
        notes
      )
      
      result = {
        action: "payment",
        paymentResult,
        purchaseOrder: paymentResult.updatedOrder
      }
    }
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 财务操作完成，耗时: ${responseTime}ms`)
    
    // 构建响应消息
    let message = ""
    switch (action) {
      case "integrate":
        message = "财务集成完成"
        break
      case "payment":
        message = `付款成功，金额: ¥${amount}`
        break
    }
    
    return NextResponse.json({
      success: true,
      message,
      data: result,
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 采购订单财务操作失败:", error)
    
    return NextResponse.json({
      error: "财务操作失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}

// 获取采购订单财务状态
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 获取采购订单财务状态API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }
    
    const purchaseOrderId = parseInt(params.id)
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }
    
    // 获取财务状态
    const financeStatus = await getPurchaseOrderFinanceStatus(purchaseOrderId)
    
    // 获取采购订单基本信息
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            balance: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    if (!purchaseOrder) {
      return NextResponse.json({ error: "采购订单不存在" }, { status: 404 })
    }
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 获取财务状态成功，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: true,
      data: {
        purchaseOrder: {
          id: purchaseOrder.id,
          orderNumber: purchaseOrder.orderNumber,
          totalAmount: purchaseOrder.totalAmount,
          paidAmount: purchaseOrder.paidAmount,
          paymentStatus: purchaseOrder.paymentStatus,
          paymentMethod: purchaseOrder.paymentMethod,
          supplier: purchaseOrder.supplier,
          employee: purchaseOrder.employee
        },
        financeStatus,
        summary: {
          totalCost: financeStatus.totalCost,
          totalPayment: financeStatus.totalPayment,
          unpaidAmount: financeStatus.unpaidAmount,
          paymentProgress: financeStatus.totalCost > 0 
            ? (financeStatus.totalPayment / financeStatus.totalCost) * 100 
            : 0,
          isFullyPaid: financeStatus.unpaidAmount <= 0,
          recordCount: financeStatus.records.length
        }
      },
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 获取财务状态失败:", error)
    
    return NextResponse.json({
      error: "获取财务状态失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}

// 更新财务记录
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 更新采购订单财务记录API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }
    
    const purchaseOrderId = parseInt(params.id)
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }
    
    const body = await request.json()
    const { recordId, amount, notes } = body
    
    if (!recordId || !amount) {
      return NextResponse.json({ 
        error: "记录ID和金额为必填项" 
      }, { status: 400 })
    }
    
    // 更新财务记录
    const updatedRecord = await prisma.financeRecord.update({
      where: { 
        id: recordId,
        referenceId: purchaseOrderId.toString()
      },
      data: {
        amount,
        notes,
        updatedAt: new Date()
      }
    })
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 财务记录更新成功，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: true,
      message: "财务记录更新成功",
      data: updatedRecord,
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 更新财务记录失败:", error)
    
    return NextResponse.json({
      error: "更新财务记录失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}
