'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEnhancedOperations } from '@/hooks/use-enhanced-operations'

interface CreateProductionOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface OrderFormData {
  productionBaseId: string
  employeeId: string
  productId: string
  quantity: number
  priority: string
  estimatedEndDate: string
  location: string
  totalAmount: number
  shippingMethod: string
  notes: string
}

export function CreateProductionOrderDialog({ open, onOpenChange, onSuccess }: CreateProductionOrderDialogProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    productionBaseId: '',
    employeeId: '',
    productId: '',
    quantity: 1,
    priority: 'NORMAL',
    estimatedEndDate: '',
    location: '广州设计中心',
    totalAmount: 0,
    shippingMethod: 'standard',
    notes: ''
  })

  const { executeOperation, isOperationInProgress } = useEnhancedOperations()

  // 更新表单数据
  const updateFormData = (field: keyof OrderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 提交表单
  const handleSubmit = async () => {
    await executeOperation(
      async () => {
        const response = await fetch('/api/production/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            productionBaseId: parseInt(formData.productionBaseId),
            employeeId: parseInt(formData.employeeId),
            productId: parseInt(formData.productId),
            estimatedEndDate: formData.estimatedEndDate ? new Date(formData.estimatedEndDate) : undefined
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '创建订单失败')
        }

        onSuccess()
      },
      {
        loadingMessage: '正在创建订单...',
        successMessage: '订单创建成功',
        errorMessage: '订单创建失败'
      }
    )
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      productionBaseId: '',
      employeeId: '',
      productId: '',
      quantity: 1,
      priority: 'NORMAL',
      estimatedEndDate: '',
      location: '广州设计中心',
      totalAmount: 0,
      shippingMethod: 'standard',
      notes: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) resetForm()
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建生产订单</DialogTitle>
          <DialogDescription>
            填写以下信息创建新的生产订单
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productionBase">生产基地</Label>
              <Select value={formData.productionBaseId} onValueChange={(value) => updateFormData('productionBaseId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择生产基地" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">广西生产基地</SelectItem>
                  <SelectItem value="2">广州设计中心</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">负责员工</Label>
              <Select value={formData.employeeId} onValueChange={(value) => updateFormData('employeeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择负责员工" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">张师傅</SelectItem>
                  <SelectItem value="2">李设计师</SelectItem>
                  <SelectItem value="3">王质检员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">产品</Label>
              <Select value={formData.productId} onValueChange={(value) => updateFormData('productId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择产品" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">掐丝珐琅花瓶</SelectItem>
                  <SelectItem value="2">掐丝珐琅盘子</SelectItem>
                  <SelectItem value="3">掐丝珐琅碗</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => updateFormData('quantity', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">优先级</Label>
              <Select value={formData.priority} onValueChange={(value) => updateFormData('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">低</SelectItem>
                  <SelectItem value="NORMAL">普通</SelectItem>
                  <SelectItem value="HIGH">高</SelectItem>
                  <SelectItem value="URGENT">紧急</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">初始地点</Label>
              <Select value={formData.location} onValueChange={(value) => updateFormData('location', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="广州设计中心">广州设计中心</SelectItem>
                  <SelectItem value="广西生产基地">广西生产基地</SelectItem>
                  <SelectItem value="广州包装中心">广州包装中心</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedEndDate">预计完成日期</Label>
              <Input
                id="estimatedEndDate"
                type="date"
                value={formData.estimatedEndDate}
                onChange={(e) => updateFormData('estimatedEndDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">订单金额</Label>
              <Input
                id="totalAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => updateFormData('totalAmount', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingMethod">物流方式</Label>
            <Select value={formData.shippingMethod} onValueChange={(value) => updateFormData('shippingMethod', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">标准物流</SelectItem>
                <SelectItem value="express">快递</SelectItem>
                <SelectItem value="urgent">加急</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              placeholder="请输入订单备注..."
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.productionBaseId || !formData.employeeId || !formData.productId || isOperationInProgress}
          >
            {isOperationInProgress ? '创建中...' : '创建订单'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
