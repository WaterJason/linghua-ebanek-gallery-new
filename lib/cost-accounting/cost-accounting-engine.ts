/**
 * 成本核算引擎
 * 负责处理双地点生产流程中的成本计算和分摊
 */

import prisma from '@/lib/db'

export interface CostRecordRequest {
  productionOrderId: number
  costCategory: 'DIRECT_MATERIAL' | 'DIRECT_LABOR' | 'MANUFACTURING_OVERHEAD' | 'SHIPPING_COST' | 'QUALITY_COST' | 'ADMINISTRATIVE_COST'
  costType: 'MATERIAL' | 'LABOR' | 'SHIPPING' | 'OVERHEAD' | 'QUALITY' | 'OTHER'
  stage: string
  location: string
  amount: number
  quantity?: number
  description?: string
  employeeId?: number
  recordedBy: number
  
  // 人工成本专用字段
  workType?: string
  workHours?: number
  hourlyRate?: number
  pieceRate?: number
  pieceCount?: number
  
  // 材料成本专用字段
  materialType?: string
  supplier?: string
  
  // 物流成本专用字段
  shippingMethod?: string
  distance?: number
  weight?: number
}

export interface PieceWorkRecordRequest {
  productionOrderId?: number
  employeeId: number
  workDate: Date
  workType: 'CLOISONNE_BLUE' | 'ACCESSORY_WORK' | 'POLISHING' | 'ASSEMBLY' | 'PACKAGING' | 'QUALITY_CHECK'
  location: string
  pieceCount: number
  pieceRate: number
  qualityGrade?: string
  qualityBonus?: number
  qualityPenalty?: number
  notes?: string
}

export interface CostAnalysisResult {
  totalCost: number
  costByCategory: Array<{
    category: string
    amount: number
    percentage: number
  }>
  costByStage: Array<{
    stage: string
    amount: number
    percentage: number
  }>
  costByLocation: Array<{
    location: string
    amount: number
    percentage: number
  }>
  laborCostDetails: Array<{
    employeeId: number
    employeeName: string
    workType: string
    amount: number
    hours?: number
    pieces?: number
  }>
  profitAnalysis: {
    revenue: number
    totalCost: number
    grossProfit: number
    profitMargin: number
  }
}

export class CostAccountingEngine {
  
  /**
   * 记录生产成本
   */
  async recordProductionCost(request: CostRecordRequest): Promise<any> {
    try {
      // 验证生产订单是否存在
      const productionOrder = await prisma.productionOrder.findUnique({
        where: { id: request.productionOrderId }
      })

      if (!productionOrder) {
        throw new Error(`生产订单不存在: ${request.productionOrderId}`)
      }

      // 计算单位成本
      const unitCost = request.quantity ? request.amount / request.quantity : null

      // 创建成本记录
      const costDetail = await prisma.productionCostDetail.create({
        data: {
          productionOrderId: request.productionOrderId,
          costCategory: request.costCategory,
          costType: request.costType,
          stage: request.stage as any,
          location: request.location,
          amount: request.amount,
          quantity: request.quantity,
          unitCost,
          employeeId: request.employeeId,
          workType: request.workType,
          workHours: request.workHours,
          hourlyRate: request.hourlyRate,
          pieceRate: request.pieceRate,
          pieceCount: request.pieceCount,
          materialType: request.materialType,
          supplier: request.supplier,
          shippingMethod: request.shippingMethod,
          distance: request.distance,
          weight: request.weight,
          description: request.description,
          recordedBy: request.recordedBy
        },
        include: {
          employee: true,
          recordedByUser: true
        }
      })

      // 更新生产订单总成本
      await this.updateProductionOrderTotalCost(request.productionOrderId)

      return costDetail
    } catch (error) {
      console.error('记录生产成本失败:', error)
      throw error
    }
  }

  /**
   * 记录计件工资
   */
  async recordPieceWork(request: PieceWorkRecordRequest): Promise<any> {
    try {
      // 计算总金额
      const totalAmount = request.pieceCount * request.pieceRate + 
                         (request.qualityBonus || 0) - 
                         (request.qualityPenalty || 0)

      // 创建计件工资记录
      const pieceWorkRecord = await prisma.pieceWorkRecord.create({
        data: {
          productionOrderId: request.productionOrderId,
          employeeId: request.employeeId,
          workDate: request.workDate,
          workType: request.workType,
          location: request.location,
          pieceCount: request.pieceCount,
          pieceRate: request.pieceRate,
          totalAmount,
          qualityGrade: request.qualityGrade,
          qualityBonus: request.qualityBonus || 0,
          qualityPenalty: request.qualityPenalty || 0,
          notes: request.notes
        },
        include: {
          employee: true,
          productionOrder: true
        }
      })

      // 如果关联了生产订单，自动创建人工成本记录
      if (request.productionOrderId) {
        await this.recordProductionCost({
          productionOrderId: request.productionOrderId,
          costCategory: 'DIRECT_LABOR',
          costType: 'LABOR',
          stage: this.getStageByWorkType(request.workType),
          location: request.location,
          amount: totalAmount,
          quantity: request.pieceCount,
          employeeId: request.employeeId,
          workType: request.workType,
          pieceRate: request.pieceRate,
          pieceCount: request.pieceCount,
          description: `计件工资：${request.workType}`,
          recordedBy: request.employeeId
        })
      }

      return pieceWorkRecord
    } catch (error) {
      console.error('记录计件工资失败:', error)
      throw error
    }
  }

  /**
   * 自动记录物流成本
   */
  async recordShippingCost(transferId: number, shippingCost: number, recordedBy: number): Promise<void> {
    try {
      const transfer = await prisma.inventoryTransfer.findUnique({
        where: { id: transferId },
        include: {
          productionOrder: true
        }
      })

      if (!transfer || !transfer.productionOrder) {
        return
      }

      // 确定阶段
      let stage: string
      switch (transfer.transferType) {
        case 'MATERIAL_TO_PRODUCTION':
          stage = 'SHIPPING_TO_PRODUCTION'
          break
        case 'SEMI_PRODUCT_RETURN':
          stage = 'SHIPPING_BACK'
          break
        default:
          stage = 'SHIPPING_TO_PRODUCTION'
      }

      // 记录物流成本
      await this.recordProductionCost({
        productionOrderId: transfer.productionOrderId!,
        costCategory: 'SHIPPING_COST',
        costType: 'SHIPPING',
        stage,
        location: `${transfer.sourceWarehouse?.name} → ${transfer.targetWarehouse?.name}`,
        amount: shippingCost,
        quantity: transfer.quantity,
        shippingMethod: transfer.shippingMethod || '物流快递',
        description: `物流费用：${transfer.transferNumber}`,
        recordedBy
      })

      // 更新转移记录的物流费用
      await prisma.inventoryTransfer.update({
        where: { id: transferId },
        data: { shippingCost }
      })

    } catch (error) {
      console.error('记录物流成本失败:', error)
      throw error
    }
  }

  /**
   * 生成成本分析报告
   */
  async generateCostAnalysis(productionOrderId: number): Promise<CostAnalysisResult> {
    try {
      // 获取生产订单信息
      const productionOrder = await prisma.productionOrder.findUnique({
        where: { id: productionOrderId },
        include: {
          costDetails: {
            include: {
              employee: true
            }
          }
        }
      })

      if (!productionOrder) {
        throw new Error(`生产订单不存在: ${productionOrderId}`)
      }

      const costDetails = productionOrder.costDetails
      const totalCost = costDetails.reduce((sum, cost) => sum + cost.amount, 0)

      // 按类别分组
      const costByCategory = this.groupCostsByCategory(costDetails, totalCost)

      // 按阶段分组
      const costByStage = this.groupCostsByStage(costDetails, totalCost)

      // 按地点分组
      const costByLocation = this.groupCostsByLocation(costDetails, totalCost)

      // 人工成本详情
      const laborCostDetails = this.getLaborCostDetails(costDetails)

      // 利润分析
      const profitAnalysis = {
        revenue: productionOrder.totalAmount || 0,
        totalCost,
        grossProfit: (productionOrder.totalAmount || 0) - totalCost,
        profitMargin: productionOrder.totalAmount ? 
          ((productionOrder.totalAmount - totalCost) / productionOrder.totalAmount) * 100 : 0
      }

      return {
        totalCost,
        costByCategory,
        costByStage,
        costByLocation,
        laborCostDetails,
        profitAnalysis
      }
    } catch (error) {
      console.error('生成成本分析失败:', error)
      throw error
    }
  }

  /**
   * 批量处理计件工资审核
   */
  async batchApprovePieceWork(recordIds: number[], reviewedBy: number, reviewNotes?: string): Promise<void> {
    try {
      await prisma.pieceWorkRecord.updateMany({
        where: {
          id: { in: recordIds },
          status: 'PENDING'
        },
        data: {
          status: 'APPROVED',
          reviewedBy,
          reviewedAt: new Date(),
          reviewNotes
        }
      })

      // 自动生成薪酬记录
      await this.generateSalaryRecords(recordIds)
    } catch (error) {
      console.error('批量审核计件工资失败:', error)
      throw error
    }
  }

  /**
   * 更新生产订单总成本
   */
  private async updateProductionOrderTotalCost(productionOrderId: number): Promise<void> {
    const totalCost = await prisma.productionCostDetail.aggregate({
      where: { productionOrderId },
      _sum: { amount: true }
    })

    await prisma.productionOrder.update({
      where: { id: productionOrderId },
      data: { totalAmount: totalCost._sum.amount || 0 }
    })
  }

  /**
   * 根据工作类型获取阶段
   */
  private getStageByWorkType(workType: string): string {
    const stageMapping: { [key: string]: string } = {
      'CLOISONNE_BLUE': 'PACKAGING',
      'ACCESSORY_WORK': 'PACKAGING',
      'POLISHING': 'IN_PRODUCTION',
      'ASSEMBLY': 'PACKAGING',
      'PACKAGING': 'PACKAGING',
      'QUALITY_CHECK': 'QUALITY_CHECK'
    }
    return stageMapping[workType] || 'IN_PRODUCTION'
  }

  /**
   * 按类别分组成本
   */
  private groupCostsByCategory(costDetails: any[], totalCost: number) {
    const categoryMap = new Map()
    
    costDetails.forEach(cost => {
      const category = cost.costCategory
      const current = categoryMap.get(category) || 0
      categoryMap.set(category, current + cost.amount)
    })

    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalCost > 0 ? (amount / totalCost) * 100 : 0
    }))
  }

  /**
   * 按阶段分组成本
   */
  private groupCostsByStage(costDetails: any[], totalCost: number) {
    const stageMap = new Map()
    
    costDetails.forEach(cost => {
      const stage = cost.stage
      const current = stageMap.get(stage) || 0
      stageMap.set(stage, current + cost.amount)
    })

    return Array.from(stageMap.entries()).map(([stage, amount]) => ({
      stage,
      amount,
      percentage: totalCost > 0 ? (amount / totalCost) * 100 : 0
    }))
  }

  /**
   * 按地点分组成本
   */
  private groupCostsByLocation(costDetails: any[], totalCost: number) {
    const locationMap = new Map()
    
    costDetails.forEach(cost => {
      const location = cost.location
      const current = locationMap.get(location) || 0
      locationMap.set(location, current + cost.amount)
    })

    return Array.from(locationMap.entries()).map(([location, amount]) => ({
      location,
      amount,
      percentage: totalCost > 0 ? (amount / totalCost) * 100 : 0
    }))
  }

  /**
   * 获取人工成本详情
   */
  private getLaborCostDetails(costDetails: any[]) {
    return costDetails
      .filter(cost => cost.costCategory === 'DIRECT_LABOR')
      .map(cost => ({
        employeeId: cost.employeeId,
        employeeName: cost.employee?.name || '未知',
        workType: cost.workType || '未知',
        amount: cost.amount,
        hours: cost.workHours,
        pieces: cost.pieceCount
      }))
  }

  /**
   * 生成薪酬记录
   */
  private async generateSalaryRecords(recordIds: number[]): Promise<void> {
    // 获取已审核的计件工资记录
    const approvedRecords = await prisma.pieceWorkRecord.findMany({
      where: {
        id: { in: recordIds },
        status: 'APPROVED'
      },
      include: {
        employee: true
      }
    })

    // 按员工和月份分组
    const employeeMonthMap = new Map()
    
    approvedRecords.forEach(record => {
      const key = `${record.employeeId}-${record.workDate.getFullYear()}-${record.workDate.getMonth() + 1}`
      if (!employeeMonthMap.has(key)) {
        employeeMonthMap.set(key, {
          employeeId: record.employeeId,
          year: record.workDate.getFullYear(),
          month: record.workDate.getMonth() + 1,
          pieceWorkIncome: 0
        })
      }
      
      const current = employeeMonthMap.get(key)
      current.pieceWorkIncome += record.totalAmount
    })

    // 更新或创建薪酬记录
    for (const [key, data] of employeeMonthMap) {
      await prisma.salaryRecord.upsert({
        where: {
          employeeId_year_month: {
            employeeId: data.employeeId,
            year: data.year,
            month: data.month
          }
        },
        update: {
          pieceWorkIncome: data.pieceWorkIncome
        },
        create: {
          employeeId: data.employeeId,
          year: data.year,
          month: data.month,
          baseSalary: 0,
          scheduleSalary: 0,
          salesCommission: 0,
          pieceWorkIncome: data.pieceWorkIncome,
          workshopIncome: 0,
          coffeeShiftCommission: 0,
          overtimePay: 0,
          bonus: 0,
          deductions: 0,
          socialInsurance: 0,
          tax: 0,
          totalIncome: data.pieceWorkIncome,
          netIncome: data.pieceWorkIncome
        }
      })
    }
  }
}
