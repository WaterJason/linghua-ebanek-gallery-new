import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { triggerStageChange } from '@/lib/automation/production-stage-automation'

/**
 * PATCH /api/production/orders/[id]/stage - 更新生产订单阶段（兼容旧版本）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productionOrderId = parseInt(params.id)
    const { stage, status, notes, operatorId, location } = await request.json()

    // 获取当前生产订单信息
    const currentOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: '生产订单不存在' },
        { status: 404 }
      )
    }

    const fromStage = currentOrder.currentStage
    const toStage = stage

    // 更新生产订单
    const updatedOrder = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        currentStage: toStage,
        status: status || currentOrder.status,
        location: location || currentOrder.location,
        updatedAt: new Date()
      }
    })

    // 记录阶段变更历史
    if (fromStage !== toStage) {
      await prisma.productionStageHistory.create({
        data: {
          productionOrderId,
          fromStage,
          toStage,
          changedBy: operatorId || 1,
          notes: notes || `阶段变更：${fromStage} → ${toStage}`
        }
      })

      // 触发自动化流程
      triggerStageChange(
        productionOrderId,
        fromStage,
        toStage,
        operatorId || 1,
        { notes, location, status }
      ).catch(error => {
        console.error('自动化流程执行失败:', error)
      })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      stageChange: fromStage !== toStage ? {
        from: fromStage,
        to: toStage,
        timestamp: new Date()
      } : null
    })
  } catch (error) {
    console.error('更新生产阶段失败:', error)
    return NextResponse.json(
      { error: '更新生产阶段失败' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/production/orders/[id]/stage - 更新生产订单阶段（新版本）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productionOrderId = parseInt(params.id)
    const body = await request.json()
    const { stage, updatedBy, notes } = body

    if (!stage || !updatedBy) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 获取当前生产订单信息
    const currentOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: true,
        employee: true,
        productionBase: true
      }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: '生产订单不存在' },
        { status: 404 }
      )
    }

    const fromStage = currentOrder.currentStage
    const toStage = stage

    // 更新生产订单阶段
    const updatedOrder = await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: {
        currentStage: toStage,
        updatedAt: new Date()
      },
      include: {
        product: true,
        employee: true,
        productionBase: true,
        stageHistories: {
          orderBy: {
            changedAt: 'desc'
          },
          take: 5
        }
      }
    })

    // 记录阶段变更历史
    await prisma.productionStageHistory.create({
      data: {
        productionOrderId,
        fromStage,
        toStage,
        changedBy: updatedBy,
        notes: notes || `阶段变更：${fromStage} → ${toStage}`
      }
    })

    // 触发自动化流程（异步执行，不阻塞响应）
    triggerStageChange(
      productionOrderId,
      fromStage,
      toStage,
      updatedBy,
      { notes, timestamp: new Date() }
    ).catch(error => {
      console.error('自动化流程执行失败:', error)
    })

    return NextResponse.json({
      message: '生产阶段更新成功',
      order: updatedOrder,
      stageChange: {
        from: fromStage,
        to: toStage,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('更新生产阶段失败:', error)
    return NextResponse.json(
      { error: '更新生产阶段失败' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/production/orders/[id]/stage - 获取生产订单阶段历史
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productionOrderId = parseInt(params.id)

    // 获取阶段历史
    const stageHistories = await prisma.productionStageHistory.findMany({
      where: { productionOrderId },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        changedAt: 'desc'
      }
    })

    // 获取当前订单信息
    const currentOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      select: {
        id: true,
        orderNumber: true,
        currentStage: true,
        status: true,
        progressPercentage: true
      }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: '生产订单不存在' },
        { status: 404 }
      )
    }

    // 计算阶段进度
    const stageOrder = [
      'DESIGN',
      'MATERIAL_PROCUREMENT',
      'SHIPPING_TO_PRODUCTION',
      'IN_PRODUCTION',
      'QUALITY_CHECK',
      'SHIPPING_BACK',
      'PACKAGING',
      'SALES_READY'
    ]

    const currentStageIndex = stageOrder.indexOf(currentOrder.currentStage || 'DESIGN')
    const progressPercentage = currentStageIndex >= 0
      ? ((currentStageIndex + 1) / stageOrder.length) * 100
      : 0

    return NextResponse.json({
      currentOrder: {
        ...currentOrder,
        progressPercentage: Math.round(progressPercentage)
      },
      stageHistories,
      stageFlow: stageOrder.map((stage, index) => ({
        stage,
        completed: index <= currentStageIndex,
        current: index === currentStageIndex,
        order: index + 1
      }))
    })
  } catch (error) {
    console.error('获取生产阶段历史失败:', error)
    return NextResponse.json(
      { error: '获取生产阶段历史失败' },
      { status: 500 }
    )
  }
}
