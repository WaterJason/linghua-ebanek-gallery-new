"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  CheckIcon, 
  XIcon, 
  PackageIcon,
  ImageIcon 
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ProductInventoryItem {
  id: number
  productId: number
  productName: string
  productImage?: string
  category?: string
  sku?: string
  barcode?: string
  warehouseId: number
  warehouseName: string
  quantity: number
  minQuantity?: number
  salePrice: number
  costPrice?: number
  lastUpdated: string
  status: 'sufficient' | 'low' | 'out'
}

interface MobileEditDialogProps {
  isOpen: boolean
  onClose: () => void
  item: ProductInventoryItem | null
  onSave: (field: string, value: number) => Promise<boolean>
}

export function MobileEditDialog({ isOpen, onClose, item, onSave }: MobileEditDialogProps) {
  const [editValues, setEditValues] = useState({
    quantity: 0,
    minQuantity: 0,
    salePrice: 0,
    costPrice: 0
  })
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 初始化编辑值
  useEffect(() => {
    if (item) {
      setEditValues({
        quantity: item.quantity,
        minQuantity: item.minQuantity || 0,
        salePrice: item.salePrice,
        costPrice: item.costPrice || 0
      })
      setHasChanges(false)
    }
  }, [item])

  // 检查是否有变更
  useEffect(() => {
    if (!item) return
    
    const hasChanged = 
      editValues.quantity !== item.quantity ||
      editValues.minQuantity !== (item.minQuantity || 0) ||
      Math.abs(editValues.salePrice - item.salePrice) > 0.01 ||
      Math.abs(editValues.costPrice - (item.costPrice || 0)) > 0.01
    
    setHasChanges(hasChanged)
  }, [editValues, item])

  const handleValueChange = (field: keyof typeof editValues, value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue < 0) return // 防止负数
    
    setEditValues(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  const handleSave = async () => {
    if (!item || !hasChanges) {
      onClose()
      return
    }

    setIsSaving(true)
    
    try {
      const changes = []
      
      // 检查每个字段的变更
      if (editValues.quantity !== item.quantity) {
        changes.push({ field: 'quantity', value: editValues.quantity })
      }
      if (editValues.minQuantity !== (item.minQuantity || 0)) {
        changes.push({ field: 'minQuantity', value: editValues.minQuantity })
      }
      if (Math.abs(editValues.salePrice - item.salePrice) > 0.01) {
        changes.push({ field: 'salePrice', value: editValues.salePrice })
      }
      if (Math.abs(editValues.costPrice - (item.costPrice || 0)) > 0.01) {
        changes.push({ field: 'costPrice', value: editValues.costPrice })
      }

      // 逐个保存变更
      let allSuccess = true
      for (const change of changes) {
        const success = await onSave(change.field, change.value)
        if (!success) {
          allSuccess = false
          break
        }
      }

      if (allSuccess) {
        toast({
          title: "保存成功",
          description: `已更新 ${changes.length} 个字段`,
          variant: "default",
        })
        onClose()
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      // 可以添加确认对话框
      const confirmed = window.confirm("有未保存的更改，确定要取消吗？")
      if (!confirmed) return
    }
    onClose()
  }

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑库存信息</DialogTitle>
          <DialogDescription>
            修改产品的库存数量和价格信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 产品信息 */}
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            {item.productImage ? (
              <div className="h-12 w-12 rounded-md overflow-hidden">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"
                  }}
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="font-medium">{item.productName}</div>
              <div className="text-sm text-muted-foreground">
                {item.sku && <span className="mr-2">SKU: {item.sku}</span>}
                {item.category && <Badge variant="outline" className="text-xs">{item.category}</Badge>}
              </div>
            </div>
          </div>

          {/* 编辑字段 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">库存数量</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={editValues.quantity}
                onChange={(e) => handleValueChange('quantity', e.target.value)}
                className="text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minQuantity">最低库存</Label>
              <Input
                id="minQuantity"
                type="number"
                min="0"
                value={editValues.minQuantity}
                onChange={(e) => handleValueChange('minQuantity', e.target.value)}
                className="text-center"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salePrice">销售价格</Label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                step="0.01"
                value={editValues.salePrice}
                onChange={(e) => handleValueChange('salePrice', e.target.value)}
                className="text-right"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="costPrice">成本价格</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={editValues.costPrice}
                onChange={(e) => handleValueChange('costPrice', e.target.value)}
                className="text-right"
              />
            </div>
          </div>

          {/* 状态信息 */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>仓库: {item.warehouseName}</span>
            <Badge variant={
              item.status === 'sufficient' ? 'default' :
              item.status === 'low' ? 'destructive' : 'secondary'
            }>
              {item.status === 'sufficient' ? '充足' :
               item.status === 'low' ? '不足' : '缺货'}
            </Badge>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            <XIcon className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                保存中...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                保存更改
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
