import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { InventoryAutomationEngine } from '@/lib/inventory-automation/inventory-automation-engine'

const automationEngine = new InventoryAutomationEngine()

/**
 * GET /api/inventory/transfers/[id] - 获取单个转移记录详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transferId = parseInt(params.id)

    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id: transferId },
      include: {
        product: true,
        sourceWarehouse: true,
        targetWarehouse: true,
        requester: true,
        approver: true,
        receiver: true,
        productionOrder: {
          include: {
            product: true,
            employee: true,
            productionBase: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        statusHistory: {
          include: {
            changedByUser: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    })

    if (!transfer) {
      return NextResponse.json(
        { error: '转移记录不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(transfer)
  } catch (error) {
    console.error('获取转移记录详情失败:', error)
    return NextResponse.json(
      { error: '获取转移记录详情失败' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/inventory/transfers/[id] - 更新转移记录
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transferId = parseInt(params.id)
    const body = await request.json()
    const {
      status,
      actualQuantity,
      damageQuantity,
      qualityStatus,
      qualityNotes,
      trackingNumber,
      shippingCost,
      receivedBy,
      notes,
      updatedBy
    } = body

    if (!updatedBy) {
      return NextResponse.json(
        { error: '缺少更新人信息' },
        { status: 400 }
      )
    }

    // 获取当前转移记录
    const currentTransfer = await prisma.inventoryTransfer.findUnique({
      where: { id: transferId },
      include: {
        items: true
      }
    })

    if (!currentTransfer) {
      return NextResponse.json(
        { error: '转移记录不存在' },
        { status: 404 }
      )
    }

    // 更新转移记录
    const updateData: any = {}
    
    if (actualQuantity !== undefined) {
      updateData.actualQuantity = actualQuantity
    }
    
    if (damageQuantity !== undefined) {
      updateData.damageQuantity = damageQuantity
    }
    
    if (qualityStatus) {
      updateData.qualityStatus = qualityStatus
    }
    
    if (qualityNotes) {
      updateData.qualityNotes = qualityNotes
    }
    
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber
    }
    
    if (shippingCost !== undefined) {
      updateData.shippingCost = shippingCost
    }
    
    if (receivedBy) {
      updateData.receivedBy = receivedBy
    }
    
    if (notes) {
      updateData.notes = notes
    }

    // 更新转移记录基本信息
    if (Object.keys(updateData).length > 0) {
      await prisma.inventoryTransfer.update({
        where: { id: transferId },
        data: updateData
      })
    }

    // 如果更新了实际数量，同时更新转移明细
    if (actualQuantity !== undefined && currentTransfer.items.length > 0) {
      await prisma.inventoryTransferItem.update({
        where: { id: currentTransfer.items[0].id },
        data: {
          actualQuantity,
          damageQuantity: damageQuantity || 0,
          qualityStatus: qualityStatus || 'PENDING'
        }
      })
    }

    // 如果更新了状态，使用自动化引擎处理
    if (status && status !== currentTransfer.status) {
      await automationEngine.updateTransferStatus(transferId, status, updatedBy, notes)
    }

    // 获取更新后的记录
    const updatedTransfer = await prisma.inventoryTransfer.findUnique({
      where: { id: transferId },
      include: {
        product: true,
        sourceWarehouse: true,
        targetWarehouse: true,
        requester: true,
        approver: true,
        receiver: true,
        productionOrder: true,
        items: true,
        statusHistory: {
          include: {
            changedByUser: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    })

    return NextResponse.json(updatedTransfer)
  } catch (error) {
    console.error('更新转移记录失败:', error)
    return NextResponse.json(
      { error: error.message || '更新转移记录失败' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/inventory/transfers/[id] - 取消转移记录
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transferId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const cancelledBy = parseInt(searchParams.get('cancelledBy') || '0')

    if (!cancelledBy) {
      return NextResponse.json(
        { error: '缺少取消人信息' },
        { status: 400 }
      )
    }

    // 检查转移记录状态
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id: transferId }
    })

    if (!transfer) {
      return NextResponse.json(
        { error: '转移记录不存在' },
        { status: 404 }
      )
    }

    // 只有待处理、已审批、已发货状态的记录可以取消
    if (!['PENDING', 'APPROVED', 'SHIPPED'].includes(transfer.status)) {
      return NextResponse.json(
        { error: '当前状态不允许取消' },
        { status: 400 }
      )
    }

    // 更新状态为已取消
    await automationEngine.updateTransferStatus(transferId, 'CANCELLED', cancelledBy, '手动取消转移')

    return NextResponse.json({ message: '转移记录已取消' })
  } catch (error) {
    console.error('取消转移记录失败:', error)
    return NextResponse.json(
      { error: '取消转移记录失败' },
      { status: 500 }
    )
  }
}
