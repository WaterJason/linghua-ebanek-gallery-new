import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

/**
 * GET /api/inventory/automation-rules - 获取库存自动化规则
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const isActive = searchParams.get('isActive')
    const triggerEvent = searchParams.get('triggerEvent')

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {}
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    
    if (triggerEvent) {
      where.triggerEvent = triggerEvent
    }

    // 获取自动化规则
    const [rules, total] = await Promise.all([
      prisma.inventoryAutomationRule.findMany({
        where,
        include: {
          sourceWarehouse: true,
          targetWarehouse: true,
          executions: {
            take: 5,
            orderBy: {
              executedAt: 'desc'
            },
            include: {
              productionOrder: {
                include: {
                  product: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.inventoryAutomationRule.count({ where })
    ])

    return NextResponse.json({
      data: rules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取库存自动化规则失败:', error)
    return NextResponse.json(
      { error: '获取库存自动化规则失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/automation-rules - 创建库存自动化规则
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      triggerEvent,
      sourceStage,
      targetStage,
      sourceWarehouseId,
      targetWarehouseId,
      transferType,
      conditions,
      actions,
      isActive = true
    } = body

    // 验证必填字段
    if (!name || !triggerEvent || !transferType) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 验证仓库是否存在
    if (sourceWarehouseId) {
      const sourceWarehouse = await prisma.warehouse.findUnique({
        where: { id: sourceWarehouseId }
      })
      if (!sourceWarehouse) {
        return NextResponse.json(
          { error: '源仓库不存在' },
          { status: 404 }
        )
      }
    }

    if (targetWarehouseId) {
      const targetWarehouse = await prisma.warehouse.findUnique({
        where: { id: targetWarehouseId }
      })
      if (!targetWarehouse) {
        return NextResponse.json(
          { error: '目标仓库不存在' },
          { status: 404 }
        )
      }
    }

    // 创建自动化规则
    const rule = await prisma.inventoryAutomationRule.create({
      data: {
        name,
        description,
        triggerEvent,
        sourceStage: sourceStage || null,
        targetStage: targetStage || null,
        sourceWarehouseId,
        targetWarehouseId,
        transferType,
        conditions: conditions || null,
        actions: actions || null,
        isActive
      },
      include: {
        sourceWarehouse: true,
        targetWarehouse: true
      }
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error('创建库存自动化规则失败:', error)
    return NextResponse.json(
      { error: error.message || '创建库存自动化规则失败' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/inventory/automation-rules - 批量更新规则状态
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ruleIds, isActive } = body

    if (!ruleIds || !Array.isArray(ruleIds) || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 批量更新规则状态
    const updatedRules = await prisma.inventoryAutomationRule.updateMany({
      where: {
        id: { in: ruleIds }
      },
      data: {
        isActive
      }
    })

    return NextResponse.json({
      message: `批量${isActive ? '启用' : '禁用'}成功`,
      updatedCount: updatedRules.count
    })
  } catch (error) {
    console.error('批量更新规则状态失败:', error)
    return NextResponse.json(
      { error: '批量更新规则状态失败' },
      { status: 500 }
    )
  }
}
