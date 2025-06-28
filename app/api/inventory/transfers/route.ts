import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { InventoryAutomationEngine } from '@/lib/inventory-automation/inventory-automation-engine'

const automationEngine = new InventoryAutomationEngine()

/**
 * GET /api/inventory/transfers - 获取库存转移记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const transferType = searchParams.get('transferType')
    const productionOrderId = searchParams.get('productionOrderId')
    const warehouseId = searchParams.get('warehouseId')

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (transferType) {
      where.transferType = transferType
    }
    
    if (productionOrderId) {
      where.productionOrderId = parseInt(productionOrderId)
    }
    
    if (warehouseId) {
      where.OR = [
        { sourceWarehouseId: parseInt(warehouseId) },
        { targetWarehouseId: parseInt(warehouseId) }
      ]
    }

    // 获取转移记录
    const [transfers, total] = await Promise.all([
      prisma.inventoryTransfer.findMany({
        where,
        include: {
          product: true,
          sourceWarehouse: true,
          targetWarehouse: true,
          requester: true,
          approver: true,
          receiver: true,
          productionOrder: {
            include: {
              product: true
            }
          },
          items: true,
          statusHistory: {
            include: {
              changedByUser: true
            },
            orderBy: {
              timestamp: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.inventoryTransfer.count({ where })
    ])

    return NextResponse.json({
      data: transfers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取库存转移记录失败:', error)
    return NextResponse.json(
      { error: '获取库存转移记录失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/transfers - 创建库存转移请求
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productionOrderId,
      sourceWarehouseId,
      targetWarehouseId,
      productId,
      quantity,
      transferType,
      requestedBy,
      notes,
      shippingMethod,
      expectedDeliveryDate
    } = body

    // 验证必填字段
    if (!sourceWarehouseId || !targetWarehouseId || !productId || !quantity || !transferType || !requestedBy) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 验证仓库是否存在
    const [sourceWarehouse, targetWarehouse] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: sourceWarehouseId } }),
      prisma.warehouse.findUnique({ where: { id: targetWarehouseId } })
    ])

    if (!sourceWarehouse || !targetWarehouse) {
      return NextResponse.json(
        { error: '源仓库或目标仓库不存在' },
        { status: 404 }
      )
    }

    // 验证产品是否存在
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json(
        { error: '产品不存在' },
        { status: 404 }
      )
    }

    // 创建转移请求
    const transfer = await automationEngine.createTransferRequest({
      productionOrderId,
      sourceWarehouseId,
      targetWarehouseId,
      productId,
      quantity,
      transferType,
      requestedBy,
      notes,
      shippingMethod,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined
    })

    return NextResponse.json(transfer, { status: 201 })
  } catch (error) {
    console.error('创建库存转移请求失败:', error)
    return NextResponse.json(
      { error: error.message || '创建库存转移请求失败' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/inventory/transfers - 批量更新转移状态
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { transferIds, newStatus, updatedBy, notes } = body

    if (!transferIds || !Array.isArray(transferIds) || !newStatus || !updatedBy) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 批量更新转移状态
    const results = []
    for (const transferId of transferIds) {
      try {
        await automationEngine.updateTransferStatus(transferId, newStatus, updatedBy, notes)
        results.push({ transferId, success: true })
      } catch (error) {
        results.push({ transferId, success: false, error: error.message })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('批量更新转移状态失败:', error)
    return NextResponse.json(
      { error: '批量更新转移状态失败' },
      { status: 500 }
    )
  }
}
