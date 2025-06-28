'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, Clock, AlertTriangle, User, Zap, Shield, 
  Eye, FileText, Truck, Factory, Package, Palette, Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface ProductionStage {
  id: string
  name: string
  description: string
  location: string
  automationLevel: 'FULL' | 'SEMI' | 'MANUAL'
  requiresApproval: boolean
  approvalRoles: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  estimatedDuration: number // 小时
  qualityCheckpoints: string[]
  autoTriggers: string[]
  manualControls: string[]
  dependencies: string[]
  icon: any
}

interface StageExecution {
  stageId: string
  status: 'PENDING' | 'IN_PROGRESS' | 'WAITING_APPROVAL' | 'COMPLETED' | 'BLOCKED'
  startedAt?: string
  completedAt?: string
  approvedBy?: { name: string; role: string }
  notes?: string
  qualityResults?: Array<{ checkpoint: string; result: string; inspector: string }>
  exceptions?: Array<{ type: string; description: string; resolvedAt?: string }>
}

const productionStages: ProductionStage[] = [
  {
    id: 'DESIGN',
    name: '设计阶段',
    description: '产品设计和工艺规划',
    location: '广州设计中心',
    automationLevel: 'MANUAL',
    requiresApproval: true,
    approvalRoles: ['DESIGN_MANAGER', 'PRODUCT_MANAGER'],
    riskLevel: 'MEDIUM',
    estimatedDuration: 24,
    qualityCheckpoints: ['设计规范检查', '工艺可行性评估', '成本预算审核'],
    autoTriggers: [],
    manualControls: ['设计师确认', '工艺师审核', '管理层批准'],
    dependencies: [],
    icon: Palette
  },
  {
    id: 'MATERIAL_PROCUREMENT',
    name: '采购阶段',
    description: '原材料和底胎采购',
    location: '广州采购中心',
    automationLevel: 'SEMI',
    requiresApproval: true,
    approvalRoles: ['PROCUREMENT_MANAGER'],
    riskLevel: 'MEDIUM',
    estimatedDuration: 48,
    qualityCheckpoints: ['供应商资质检查', '材料质量验收', '数量核对'],
    autoTriggers: ['库存不足自动提醒', '供应商评分更新'],
    manualControls: ['采购员下单', '质检员验收', '仓管员入库'],
    dependencies: ['DESIGN'],
    icon: FileText
  },
  {
    id: 'SHIPPING_TO_PRODUCTION',
    name: '发货阶段',
    description: '原料发往生产基地',
    location: '广州→广西',
    automationLevel: 'SEMI',
    requiresApproval: false,
    approvalRoles: [],
    riskLevel: 'LOW',
    estimatedDuration: 24,
    qualityCheckpoints: ['包装完整性检查', '运输保险确认'],
    autoTriggers: ['物流单号生成', '运输状态跟踪', '到货提醒'],
    manualControls: ['仓管员发货确认', '物流员装车', '收货员签收'],
    dependencies: ['MATERIAL_PROCUREMENT'],
    icon: Truck
  },
  {
    id: 'IN_PRODUCTION',
    name: '生产阶段',
    description: '珐琅工艺制作',
    location: '广西生产基地',
    automationLevel: 'MANUAL',
    requiresApproval: false,
    approvalRoles: [],
    riskLevel: 'HIGH',
    estimatedDuration: 72,
    qualityCheckpoints: ['工艺标准检查', '半成品质量检验', '生产进度确认'],
    autoTriggers: ['生产计划自动排程', '质检节点提醒'],
    manualControls: ['工艺师操作', '质检员检验', '生产主管确认'],
    dependencies: ['SHIPPING_TO_PRODUCTION'],
    icon: Factory
  },
  {
    id: 'QUALITY_CHECK',
    name: '质检阶段',
    description: '半成品质量检验',
    location: '广西生产基地',
    automationLevel: 'MANUAL',
    requiresApproval: true,
    approvalRoles: ['QUALITY_MANAGER'],
    riskLevel: 'CRITICAL',
    estimatedDuration: 8,
    qualityCheckpoints: ['外观质量检查', '尺寸精度测量', '工艺标准符合性'],
    autoTriggers: ['不合格品自动隔离'],
    manualControls: ['质检员全检', '质量经理审核', '不合格品处理'],
    dependencies: ['IN_PRODUCTION'],
    icon: Eye
  },
  {
    id: 'SHIPPING_BACK',
    name: '返回阶段',
    description: '半成品返回精加工',
    location: '广西→广州',
    automationLevel: 'SEMI',
    requiresApproval: false,
    approvalRoles: [],
    riskLevel: 'MEDIUM',
    estimatedDuration: 24,
    qualityCheckpoints: ['包装保护检查', '数量核对确认'],
    autoTriggers: ['物流单号生成', '运输状态跟踪', '到货提醒', '数量差异检测'],
    manualControls: ['仓管员发货', '物流员运输', '收货员验收'],
    dependencies: ['QUALITY_CHECK'],
    icon: Truck
  },
  {
    id: 'PACKAGING',
    name: '包装阶段',
    description: '点蓝工艺和配饰装裱',
    location: '广州包装中心',
    automationLevel: 'MANUAL',
    requiresApproval: false,
    approvalRoles: [],
    riskLevel: 'MEDIUM',
    estimatedDuration: 16,
    qualityCheckpoints: ['点蓝质量检查', '配饰安装检验', '包装完整性确认'],
    autoTriggers: ['计件工资自动计算'],
    manualControls: ['点蓝师操作', '配饰师装裱', '包装员打包'],
    dependencies: ['SHIPPING_BACK'],
    icon: Package
  },
  {
    id: 'SALES_READY',
    name: '销售阶段',
    description: '成品入库准备销售',
    location: '广州成品仓',
    automationLevel: 'SEMI',
    requiresApproval: true,
    approvalRoles: ['WAREHOUSE_MANAGER'],
    riskLevel: 'LOW',
    estimatedDuration: 4,
    qualityCheckpoints: ['最终质量确认', '包装标识检查', '库存系统更新'],
    autoTriggers: ['成品库存自动更新', '销售系统同步', '成本核算完成'],
    manualControls: ['仓管员入库', '质检员终检', '系统管理员确认'],
    dependencies: ['PACKAGING'],
    icon: CheckCircle
  }
]

const automationLevelConfig = {
  FULL: { label: '完全自动化', color: 'bg-green-100 text-green-800', icon: Zap },
  SEMI: { label: '半自动化', color: 'bg-blue-100 text-blue-800', icon: Settings },
  MANUAL: { label: '人工操作', color: 'bg-orange-100 text-orange-800', icon: User }
}

const riskLevelConfig = {
  LOW: { label: '低风险', color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: '中风险', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: '高风险', color: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: '关键风险', color: 'bg-red-100 text-red-800' }
}

const statusConfig = {
  PENDING: { label: '待开始', color: 'bg-gray-100 text-gray-800', icon: Clock },
  IN_PROGRESS: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: Settings },
  WAITING_APPROVAL: { label: '待审批', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  BLOCKED: { label: '已阻塞', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
}

export default function ProductionStageControl() {
  const [selectedStage, setSelectedStage] = useState<ProductionStage | null>(null)
  const [stageExecutions, setStageExecutions] = useState<Record<string, StageExecution>>({})
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')

  // 模拟当前执行状态
  useEffect(() => {
    const mockExecutions: Record<string, StageExecution> = {
      'DESIGN': { stageId: 'DESIGN', status: 'COMPLETED', completedAt: '2024-12-18T10:00:00Z' },
      'MATERIAL_PROCUREMENT': { stageId: 'MATERIAL_PROCUREMENT', status: 'COMPLETED', completedAt: '2024-12-19T14:00:00Z' },
      'SHIPPING_TO_PRODUCTION': { stageId: 'SHIPPING_TO_PRODUCTION', status: 'COMPLETED', completedAt: '2024-12-20T08:00:00Z' },
      'IN_PRODUCTION': { stageId: 'IN_PRODUCTION', status: 'IN_PROGRESS', startedAt: '2024-12-20T09:00:00Z' },
      'QUALITY_CHECK': { stageId: 'QUALITY_CHECK', status: 'PENDING' },
      'SHIPPING_BACK': { stageId: 'SHIPPING_BACK', status: 'PENDING' },
      'PACKAGING': { stageId: 'PACKAGING', status: 'PENDING' },
      'SALES_READY': { stageId: 'SALES_READY', status: 'PENDING' }
    }
    setStageExecutions(mockExecutions)
  }, [])

  const handleStageAction = async (stage: ProductionStage, action: 'START' | 'COMPLETE' | 'APPROVE') => {
    try {
      const execution = stageExecutions[stage.id]
      
      if (action === 'START' && execution?.status === 'PENDING') {
        // 检查依赖是否完成
        const dependenciesCompleted = stage.dependencies.every(depId => 
          stageExecutions[depId]?.status === 'COMPLETED'
        )
        
        if (!dependenciesCompleted) {
          toast.error('前置阶段尚未完成，无法开始此阶段')
          return
        }

        // 开始阶段
        setStageExecutions(prev => ({
          ...prev,
          [stage.id]: {
            ...execution,
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString()
          }
        }))
        
        toast.success(`${stage.name}已开始`)
        
      } else if (action === 'COMPLETE' && execution?.status === 'IN_PROGRESS') {
        // 完成阶段
        const newStatus = stage.requiresApproval ? 'WAITING_APPROVAL' : 'COMPLETED'
        
        setStageExecutions(prev => ({
          ...prev,
          [stage.id]: {
            ...execution,
            status: newStatus,
            completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined
          }
        }))
        
        if (stage.requiresApproval) {
          toast.success(`${stage.name}已完成，等待审批`)
        } else {
          toast.success(`${stage.name}已完成`)
          // 自动触发下一阶段的自动化操作
          await triggerAutomation(stage)
        }
        
      } else if (action === 'APPROVE' && execution?.status === 'WAITING_APPROVAL') {
        setSelectedStage(stage)
        setShowApprovalDialog(true)
      }
      
    } catch (error) {
      console.error('阶段操作失败:', error)
      toast.error('阶段操作失败')
    }
  }

  const handleApproval = async (approved: boolean) => {
    try {
      if (!selectedStage) return

      const execution = stageExecutions[selectedStage.id]
      
      setStageExecutions(prev => ({
        ...prev,
        [selectedStage.id]: {
          ...execution,
          status: approved ? 'COMPLETED' : 'BLOCKED',
          completedAt: approved ? new Date().toISOString() : undefined,
          approvedBy: { name: '当前用户', role: 'MANAGER' }, // TODO: 从用户会话获取
          notes: approvalNotes
        }
      }))

      if (approved) {
        toast.success(`${selectedStage.name}审批通过`)
        // 触发自动化操作
        await triggerAutomation(selectedStage)
      } else {
        toast.error(`${selectedStage.name}审批拒绝`)
      }

      setShowApprovalDialog(false)
      setSelectedStage(null)
      setApprovalNotes('')
      
    } catch (error) {
      console.error('审批操作失败:', error)
      toast.error('审批操作失败')
    }
  }

  const triggerAutomation = async (stage: ProductionStage) => {
    try {
      // 触发阶段完成后的自动化操作
      for (const trigger of stage.autoTriggers) {
        console.log(`触发自动化操作: ${trigger}`)
        // TODO: 实际的自动化触发逻辑
      }

      // 如果有下一个阶段，检查是否可以自动开始
      const nextStageId = getNextStageId(stage.id)
      if (nextStageId) {
        const nextStage = productionStages.find(s => s.id === nextStageId)
        if (nextStage && nextStage.automationLevel === 'FULL') {
          // 自动开始下一阶段
          setTimeout(() => {
            handleStageAction(nextStage, 'START')
          }, 1000)
        }
      }
      
    } catch (error) {
      console.error('触发自动化失败:', error)
    }
  }

  const getNextStageId = (currentStageId: string): string | null => {
    const currentIndex = productionStages.findIndex(s => s.id === currentStageId)
    if (currentIndex >= 0 && currentIndex < productionStages.length - 1) {
      return productionStages[currentIndex + 1].id
    }
    return null
  }

  const getAutomationBadge = (level: string) => {
    const config = automationLevelConfig[level as keyof typeof automationLevelConfig]
    if (!config) return <Badge variant="outline">{level}</Badge>
    
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getRiskBadge = (level: string) => {
    const config = riskLevelConfig[level as keyof typeof riskLevelConfig]
    if (!config) return <Badge variant="outline">{level}</Badge>
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return <Badge variant="secondary">{status}</Badge>
    
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const canPerformAction = (stage: ProductionStage, action: 'START' | 'COMPLETE' | 'APPROVE'): boolean => {
    const execution = stageExecutions[stage.id]
    
    switch (action) {
      case 'START':
        return execution?.status === 'PENDING' && 
               stage.dependencies.every(depId => stageExecutions[depId]?.status === 'COMPLETED')
      case 'COMPLETE':
        return execution?.status === 'IN_PROGRESS'
      case 'APPROVE':
        return execution?.status === 'WAITING_APPROVAL'
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">生产流程控制</h1>
          <p className="text-gray-600">8阶段生产流程的人工干预和自动化管理</p>
        </div>
      </div>

      {/* 流程概览 */}
      <Card>
        <CardHeader>
          <CardTitle>生产流程概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {productionStages.map((stage, index) => {
              const execution = stageExecutions[stage.id]
              const StageIcon = stage.icon
              
              return (
                <Card key={stage.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                          <StageIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{stage.name}</h3>
                          <p className="text-sm text-gray-600">{stage.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">阶段 {index + 1}</div>
                        <div className="text-xs text-gray-500">{stage.estimatedDuration}小时</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* 状态和标签 */}
                    <div className="flex flex-wrap gap-2">
                      {execution && getStatusBadge(execution.status)}
                      {getAutomationBadge(stage.automationLevel)}
                      {getRiskBadge(stage.riskLevel)}
                      {stage.requiresApproval && (
                        <Badge variant="outline">
                          <Shield className="w-3 h-3 mr-1" />
                          需要审批
                        </Badge>
                      )}
                    </div>

                    {/* 描述 */}
                    <p className="text-sm text-gray-600">{stage.description}</p>

                    {/* 控制要点 */}
                    <div className="space-y-2">
                      {stage.automationLevel !== 'FULL' && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 mb-1">人工控制要点:</h4>
                          <div className="flex flex-wrap gap-1">
                            {stage.manualControls.slice(0, 2).map((control, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {control}
                              </Badge>
                            ))}
                            {stage.manualControls.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{stage.manualControls.length - 2}项
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {stage.autoTriggers.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-700 mb-1">自动化触发:</h4>
                          <div className="flex flex-wrap gap-1">
                            {stage.autoTriggers.slice(0, 2).map((trigger, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {trigger}
                              </Badge>
                            ))}
                            {stage.autoTriggers.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{stage.autoTriggers.length - 2}项
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex space-x-2 pt-2">
                      {canPerformAction(stage, 'START') && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStageAction(stage, 'START')}
                        >
                          开始阶段
                        </Button>
                      )}
                      
                      {canPerformAction(stage, 'COMPLETE') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStageAction(stage, 'COMPLETE')}
                        >
                          完成阶段
                        </Button>
                      )}
                      
                      {canPerformAction(stage, 'APPROVE') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStageAction(stage, 'APPROVE')}
                        >
                          审批
                        </Button>
                      )}
                    </div>

                    {/* 执行信息 */}
                    {execution && (execution.startedAt || execution.completedAt) && (
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        {execution.startedAt && (
                          <div>开始: {new Date(execution.startedAt).toLocaleString()}</div>
                        )}
                        {execution.completedAt && (
                          <div>完成: {new Date(execution.completedAt).toLocaleString()}</div>
                        )}
                        {execution.approvedBy && (
                          <div>审批人: {execution.approvedBy.name}</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 审批对话框 */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>阶段审批</DialogTitle>
          </DialogHeader>
          
          {selectedStage && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedStage.name}</strong> 已完成，需要您的审批确认。
                  <br />
                  审批角色: {selectedStage.approvalRoles.join(', ')}
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="approvalNotes">审批意见</Label>
                <Textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="请输入审批意见..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleApproval(false)}>
                  拒绝
                </Button>
                <Button onClick={() => handleApproval(true)}>
                  通过
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
