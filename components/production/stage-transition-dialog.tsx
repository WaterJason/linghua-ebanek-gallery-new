'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useEnhancedOperations } from '@/hooks/use-enhanced-operations'
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  MapPin,
  User,
  Clock
} from 'lucide-react'

interface ProductionOrder {
  id: number
  orderNumber: string
  productName: string
  currentStage: string
  status: string
  location: string
  assignedTo?: string
  employee: {
    name: string
  }
}

interface StageTransitionDialogProps {
  order: ProductionOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const stages = [
  { id: 'DESIGN', title: '产品设计', location: '广州设计中心' },
  { id: 'MATERIAL_PROCUREMENT', title: '底胎采购', location: '广州设计中心' },
  { id: 'SHIPPING_TO_PRODUCTION', title: '物流发送', location: '物流运输中' },
  { id: 'IN_PRODUCTION', title: '工艺制作', location: '广西生产基地' },
  { id: 'QUALITY_CHECK', title: '质量检验', location: '广西生产基地' },
  { id: 'SHIPPING_BACK', title: '物流返回', location: '物流运输中' },
  { id: 'PACKAGING', title: '包装装裱', location: '广州包装中心' },
  { id: 'SALES_READY', title: '渠道销售', location: '广州包装中心' },
]

const stageConditions = {
  DESIGN: ['design_approved', 'specifications_complete'],
  MATERIAL_PROCUREMENT: ['materials_received', 'quality_checked'],
  SHIPPING_TO_PRODUCTION: ['materials_delivered', 'production_scheduled'],
  IN_PRODUCTION: ['production_complete', 'initial_inspection_passed'],
  QUALITY_CHECK: ['quality_approved', 'packaging_ready'],
  SHIPPING_BACK: ['products_received', 'packaging_materials_ready'],
  PACKAGING: ['packaging_complete', 'final_inspection_passed'],
  SALES_READY: ['inventory_updated', 'sales_ready']
}

const conditionLabels = {
  design_approved: '设计已确认',
  specifications_complete: '规格说明完整',
  materials_received: '材料已到货',
  quality_checked: '材料质检通过',
  materials_delivered: '材料已送达',
  production_scheduled: '生产已排程',
  production_complete: '生产已完成',
  initial_inspection_passed: '初检通过',
  quality_approved: '质检合格',
  packaging_ready: '包装准备就绪',
  products_received: '产品已收到',
  packaging_materials_ready: '包装材料准备完毕',
  packaging_complete: '包装完成',
  final_inspection_passed: '终检通过',
  inventory_updated: '库存已更新',
  sales_ready: '销售准备就绪'
}

export function StageTransitionDialog({ order, open, onOpenChange, onSuccess }: StageTransitionDialogProps) {
  const [targetStage, setTargetStage] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [conditions, setConditions] = useState<Record<string, boolean>>({})
  const [warnings, setWarnings] = useState<string[]>([])
  const [availableStages, setAvailableStages] = useState<string[]>([])

  const { executeOperation, isOperationInProgress } = useEnhancedOperations()

  // 获取可用的下一阶段
  useEffect(() => {
    if (!order) return

    // 模拟获取可用阶段 - 实际应该从状态机API获取
    const currentIndex = stages.findIndex(s => s.id === order.currentStage)
    const nextStages = stages.slice(currentIndex + 1, currentIndex + 3).map(s => s.id)
    
    // 添加一些特殊状态转换
    if (order.currentStage === 'QUALITY_CHECK') {
      nextStages.push('IN_PRODUCTION') // 返工
    }
    
    setAvailableStages(nextStages)
    
    // 重置状态
    setTargetStage('')
    setNotes('')
    setConditions({})
    setWarnings([])
  }, [order])

  // 检查转换条件
  useEffect(() => {
    if (!targetStage) return

    const requiredConditions = stageConditions[targetStage as keyof typeof stageConditions] || []
    const newConditions: Record<string, boolean> = {}
    
    requiredConditions.forEach(condition => {
      newConditions[condition] = conditions[condition] || false
    })
    
    setConditions(newConditions)

    // 生成警告
    const newWarnings: string[] = []
    const unmetConditions = requiredConditions.filter(condition => !newConditions[condition])
    
    if (unmetConditions.length > 0) {
      newWarnings.push(`以下条件尚未满足: ${unmetConditions.map(c => conditionLabels[c as keyof typeof conditionLabels]).join(', ')}`)
    }

    setWarnings(newWarnings)
  }, [targetStage, conditions])

  // 执行状态转换
  const handleTransition = async () => {
    if (!order || !targetStage) return

    await executeOperation(
      async () => {
        const response = await fetch('/api/production/smart-transition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            targetStage,
            operatorId: 1, // 当前用户ID
            userRole: 'manager',
            conditions,
            notes
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '状态转换失败')
        }

        onSuccess()
      },
      {
        loadingMessage: '正在转换状态...',
        successMessage: '状态转换成功',
        errorMessage: '状态转换失败'
      }
    )
  }

  if (!order) return null

  const currentStageInfo = stages.find(s => s.id === order.currentStage)
  const targetStageInfo = stages.find(s => s.id === targetStage)
  const requiredConditions = stageConditions[targetStage as keyof typeof stageConditions] || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>状态转换</DialogTitle>
          <DialogDescription>
            为订单 {order.orderNumber} 执行状态转换
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 订单信息 */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">订单号:</span>
                <span className="ml-2 font-medium">{order.orderNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">产品:</span>
                <span className="ml-2">{order.productName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">当前阶段:</span>
                <Badge variant="outline" className="ml-2">
                  {currentStageInfo?.title}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">当前地点:</span>
                <div className="flex items-center gap-1 ml-2">
                  <MapPin className="h-3 w-3" />
                  <span>{order.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 目标阶段选择 */}
          <div className="space-y-2">
            <Label htmlFor="target-stage">目标阶段</Label>
            <Select value={targetStage} onValueChange={setTargetStage}>
              <SelectTrigger>
                <SelectValue placeholder="选择目标阶段" />
              </SelectTrigger>
              <SelectContent>
                {availableStages.map(stageId => {
                  const stage = stages.find(s => s.id === stageId)
                  return (
                    <SelectItem key={stageId} value={stageId}>
                      <div className="flex items-center gap-2">
                        <span>{stage?.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {stage?.location}
                        </Badge>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 状态转换预览 */}
          {targetStage && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <Badge variant="outline">{currentStageInfo?.title}</Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {currentStageInfo?.location}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600" />
              <div className="text-center">
                <Badge variant="default">{targetStageInfo?.title}</Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {targetStageInfo?.location}
                </div>
              </div>
            </div>
          )}

          {/* 转换条件 */}
          {requiredConditions.length > 0 && (
            <div className="space-y-3">
              <Label>转换条件</Label>
              <div className="space-y-2">
                {requiredConditions.map(condition => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox
                      id={condition}
                      checked={conditions[condition] || false}
                      onCheckedChange={(checked) => 
                        setConditions(prev => ({ ...prev, [condition]: checked as boolean }))
                      }
                    />
                    <Label htmlFor={condition} className="text-sm">
                      {conditionLabels[condition as keyof typeof conditionLabels]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 警告信息 */}
          {warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              placeholder="请输入转换备注..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* 预计影响 */}
          {targetStage && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div>• 订单将转移到: {targetStageInfo?.location}</div>
                  <div>• 预计处理时间: 根据阶段而定</div>
                  <div>• 负责人将自动分配</div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleTransition}
            disabled={!targetStage || isOperationInProgress}
          >
            {isOperationInProgress ? '转换中...' : '确认转换'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
