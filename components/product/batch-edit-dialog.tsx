"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ProductCategory } from "@/types/product"

interface BatchEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProductIds: number[]
  onBatchEdit: (field: string, value: any, reason: string) => Promise<void>
  categories: ProductCategory[]
}

export function BatchEditDialog({
  open,
  onOpenChange,
  selectedProductIds,
  onBatchEdit,
  categories
}: BatchEditDialogProps) {
  const [field, setField] = useState<string>("")
  const [value, setValue] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 重置表单
  const resetForm = () => {
    setField("")
    setValue("")
    setReason("")
  }

  // 处理关闭对话框
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  // 处理提交
  const handleSubmit = async () => {
    if (!field) {
      toast({
        title: "请选择要编辑的字段",
        variant: "destructive",
      })
      return
    }

    if (!value && field !== "categoryId") {
      toast({
        title: "请输入新的值",
        variant: "destructive",
      })
      return
    }

    if (!reason) {
      toast({
        title: "请输入修改原因",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // 根据字段类型转换值
      let processedValue: any = value
      if (field === "price" || field === "inventory") {
        processedValue = Number(value)
        if (isNaN(processedValue)) {
          throw new Error(`${field === "price" ? "价格" : "库存"}必须是有效的数字`)
        }
      } else if (field === "categoryId") {
        processedValue = value === "" ? null : Number(value)
      }
      
      await onBatchEdit(field, processedValue, reason)
      
      toast({
        title: "批量编辑成功",
        description: `已成功更新 ${selectedProductIds.length} 个产品`,
      })
      
      handleOpenChange(false)
    } catch (error) {
      console.error("批量编辑失败:", error)
      toast({
        title: "批量编辑失败",
        description: error instanceof Error ? error.message : "批量编辑产品失败",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>批量编辑产品</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="field">选择要编辑的字段</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger id="field">
                <SelectValue placeholder="选择字段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">价格</SelectItem>
                <SelectItem value="inventory">库存</SelectItem>
                <SelectItem value="categoryId">分类</SelectItem>
                <SelectItem value="status">状态</SelectItem>
                <SelectItem value="material">材质</SelectItem>
                <SelectItem value="unit">单位</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">新的值</Label>
            {field === "categoryId" ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger id="value">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">未分类</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field === "status" ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger id="value">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">上架</SelectItem>
                  <SelectItem value="inactive">下架</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type={field === "price" || field === "inventory" ? "number" : "text"}
                min={0}
                step={field === "price" ? 0.01 : 1}
              />
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">修改原因</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请输入修改原因，方便后续追踪"
              rows={3}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            将对 {selectedProductIds.length} 个选中的产品进行批量编辑
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "处理中..." : "确认修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
