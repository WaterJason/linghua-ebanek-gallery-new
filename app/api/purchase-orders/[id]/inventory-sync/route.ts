import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"
import prisma from "@/lib/db"
import { batchUpdateInventory, getInventoryTransactionHistory } from "@/lib/services/inventory-integration"

// 库存同步数据类型
interface InventorySyncData {
  warehouseId: number
  syncType: "auto" | "manual" // 同步类型：自动或手动
  items?: Array<{
    purchaseOrderItemId: number
    actualCost?: number // 实际成本
    qualityGrade?: "A" | "B" | "C" | "D"
    notes?: string
  }>
}

// 采购订单库存同步API
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 采购订单库存同步API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }
    
    const purchaseOrderId = Number(params.id)
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }
    
    const data = await request.json() as InventorySyncData
    
    // 验证必填字段
    if (!data.warehouseId || !data.syncType) {
      return NextResponse.json({ 
        error: "仓库ID和同步类型为必填项" 
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
    
    // 检查订单状态
    if (purchaseOrder.status !== "received" && purchaseOrder.status !== "partial_received") {
      return NextResponse.json({ 
        error: "只有已收货或部分收货的采购订单才能进行库存同步" 
      }, { status: 400 })
    }
    
    // 验证仓库是否存在
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId }
    })
    
    if (!warehouse) {
      return NextResponse.json({ error: "指定的仓库不存在" }, { status: 404 })
    }
    
    console.log(`📝 开始同步采购订单库存: ${purchaseOrder.orderNumber}`)
    
    // 准备批量库存更新数据
    const inventoryItems = purchaseOrder.items
      .filter(item => item.productId && item.receivedQuantity > 0)
      .map(orderItem => {
        // 查找对应的手动同步数据
        const manualData = data.items?.find(item =>
          item.purchaseOrderItemId === orderItem.id
        )

        return {
          productId: orderItem.productId!,
          warehouseId: data.warehouseId,
          quantity: orderItem.receivedQuantity,
          unitCost: manualData?.actualCost || orderItem.price,
          qualityGrade: manualData?.qualityGrade || "A",
          notes: `${data.syncType === 'auto' ? '自动' : '手动'}同步 - ${orderItem.product?.name || "未知产品"}`
        }
      })

    if (inventoryItems.length === 0) {
      return NextResponse.json({
        error: "没有可同步的库存项目",
        details: "所有项目都未收货或缺少产品信息"
      }, { status: 400 })
    }

    // 使用库存集成服务进行批量同步
    const syncResult = await batchUpdateInventory({
      items: inventoryItems,
      operationType: "purchase_sync",
      referenceId: purchaseOrder.id,
      referenceType: "purchase_order",
      operatorId: session.user.id,
      notes: `采购库存同步: ${purchaseOrder.orderNumber} - ${data.syncType === 'auto' ? '自动' : '手动'}同步`
    })

    // 更新采购订单状态
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status: syncResult.success ? "inventory_synced" : "partial_synced",
        updatedAt: new Date()
      },
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

    const result = {
      updatedOrder,
      syncResult,
      summary: {
        totalSyncedItems: syncResult.successItems,
        totalSyncedQuantity: inventoryItems.reduce((sum, item) => sum + item.quantity, 0),
        syncType: data.syncType,
        warehouseName: warehouse.name,
        errors: syncResult.errors
      }
    }
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 库存同步完成，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: syncResult.success,
      message: syncResult.success
        ? `库存同步完成，共同步 ${result.summary.totalSyncedItems} 个产品项目`
        : `库存同步部分完成，成功 ${result.summary.totalSyncedItems} 个，失败 ${syncResult.failedItems} 个`,
      data: {
        purchaseOrder: result.updatedOrder,
        syncResult: result.syncResult,
        summary: result.summary
      },
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 库存同步失败:", error)
    
    return NextResponse.json({
      error: "库存同步失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}

// 获取库存同步状态
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    console.log("🔍 获取库存同步状态API被调用")
    
    // 检查用户权限
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }
    
    const purchaseOrderId = Number(params.id)
    if (isNaN(purchaseOrderId)) {
      return NextResponse.json({ error: "无效的采购订单ID" }, { status: 400 })
    }
    
    // 获取采购订单信息
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
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
    
    // 使用库存集成服务获取事务记录
    const inventoryTransactions = await getInventoryTransactionHistory(
      undefined, // productId
      undefined, // warehouseId
      purchaseOrderId, // referenceId
      50 // limit
    )
    
    // 构建同步状态摘要
    const syncStatus = {
      purchaseOrderId,
      orderNumber: purchaseOrder.orderNumber,
      orderStatus: purchaseOrder.status,
      isSynced: purchaseOrder.status === "inventory_synced",
      totalItems: purchaseOrder.items.length,
      receivedItems: purchaseOrder.items.filter(item => item.receivedQuantity > 0).length,
      syncedTransactions: inventoryTransactions.length,
      items: purchaseOrder.items.map(item => ({
        id: item.id,
        productName: item.product?.name || "未知产品",
        orderedQuantity: item.quantity,
        receivedQuantity: item.receivedQuantity,
        isReceived: item.receivedQuantity > 0,
        price: item.price
      })),
      transactions: inventoryTransactions
    }
    
    const responseTime = Date.now() - startTime
    console.log(`✅ 获取库存同步状态成功，耗时: ${responseTime}ms`)
    
    return NextResponse.json({
      success: true,
      data: syncStatus,
      responseTime
    })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ 获取库存同步状态失败:", error)
    
    return NextResponse.json({
      error: "获取库存同步状态失败",
      details: error instanceof Error ? error.message : "未知错误",
      responseTime
    }, { status: 500 })
  }
}
