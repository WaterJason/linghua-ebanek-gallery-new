"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BatchEditData, ProductCategory } from "@/types/product"
import { AlertCircleIcon, CheckCircleIcon, PackageIcon } from "lucide-react"

interface ProductBatchEditProps {
  selectedIds: number[]
  categories: ProductCategory[]
  units: string[]
  materials: string[]
  onBatchEdit: (field: string, value: any, reason: string) => Promise<void>
  onCancel: () => void
}

export function ProductBatchEdit({
  selectedIds,
  categories,
  units,
  materials,
  onBatchEdit,
  onCancel
}: ProductBatchEditProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 字段选择状态
  const [selectedField, setSelectedField] = useState<string>("")

  // 字段值
  const [fieldValue, setFieldValue] = useState<any>("")

  // 修改原因
  const [reason, setReason] = useState<string>("")

  // 处理字段选择变化
  const handleFieldChange = (field: string) => {
    setSelectedField(field)
    // 重置字段值
    setFieldValue("")
  }

  // 处理字段值变化
  const handleValueChange = (value: any) => {
    setFieldValue(value)
  }

  // 处理原因变化
  const handleReasonChange = (value: string) => {
    setReason(value)
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 检查是否选择了字段
    if (!selectedField) {
      setError("请选择要编辑的字段")
      return
    }

    // 检查是否输入了值
    if (fieldValue === "" && selectedField !== "categoryId") {
      setError("请输入新的值")
      return
    }

    // 检查是否输入了修改原因
    if (!reason) {
      setError("请输入修改原因")
      return
    }

    // 验证字段值
    if (selectedField === "price" && (isNaN(parseFloat(fieldValue)) || parseFloat(fieldValue) <= 0)) {
      setError("价格必须是大于0的数字")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 处理特殊字段的值
      let processedValue = fieldValue

      if (selectedField === "price" || selectedField === "inventory") {
        processedValue = parseFloat(fieldValue)
      } else if (selectedField === "categoryId") {
        processedValue = fieldValue === "" ? null : parseInt(fieldValue)
      }

      // 调用批量编辑函数
      await onBatchEdit(selectedField, processedValue, reason)

      toast({
        title: "批量编辑成功",
        description: `已更新 ${selectedIds.length} 个产品`,
      })
    } catch (error) {
      console.error("批量编辑错误:", error)
      setError(error instanceof Error ? error.message : "批量编辑过程中发生错误")

      toast({
        title: "批量编辑失败",
        description: error instanceof Error ? error.message : "批量编辑过程中发生错误",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            批量编辑产品 ({selectedIds.length}个)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* 选择要编辑的字段 */}
              <div className="grid gap-1.5 w-full">
                <Label htmlFor="edit-field" className="text-sm font-medium">
                  选择要编辑的字段
                </Label>
                <Select
                  value={selectedField}
                  onValueChange={handleFieldChange}
                >
                  <SelectTrigger id="edit-field">
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

              {/* 输入新的值 */}
              <div className="grid gap-1.5 w-full">
                <Label htmlFor="edit-value" className="text-sm font-medium">
                  输入新的值
                </Label>

                {selectedField === "categoryId" ? (
                  <Select
                    value={fieldValue ? fieldValue.toString() : ""}
                    onValueChange={handleValueChange}
                  >
                    <SelectTrigger id="edit-value">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">未分类</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : selectedField === "status" ? (
                  <Select
                    value={fieldValue}
                    onValueChange={handleValueChange}
                  >
                    <SelectTrigger id="edit-value">
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">上架</SelectItem>
                      <SelectItem value="inactive">下架</SelectItem>
                    </SelectContent>
                  </Select>
                ) : selectedField === "unit" ? (
                  <Select
                    value={fieldValue}
                    onValueChange={handleValueChange}
                  >
                    <SelectTrigger id="edit-value">
                      <SelectValue placeholder="选择单位" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit, index) => (
                        <SelectItem key={index} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : selectedField === "material" ? (
                  <Select
                    value={fieldValue}
                    onValueChange={handleValueChange}
                  >
                    <SelectTrigger id="edit-value">
                      <SelectValue placeholder="选择材质" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material, index) => (
                        <SelectItem key={index} value={material}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="edit-value"
                    value={fieldValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    type={selectedField === "price" || selectedField === "inventory" ? "number" : "text"}
                    min={0}
                    step={selectedField === "price" ? 0.01 : 1}
                    placeholder={`输入新的${selectedField === "price" ? "价格" : selectedField === "inventory" ? "库存" : "值"}`}
                  />
                )}
              </div>

              {/* 修改原因 */}
              <div className="grid gap-1.5 w-full">
                <Label htmlFor="edit-reason" className="text-sm font-medium">
                  修改原因
                </Label>
                <Input
                  id="edit-reason"
                  value={reason}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  placeholder="请输入修改原因，方便后续追踪"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                将对 {selectedIds.length} 个选中的产品进行批量编辑
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "处理中..." : "应用更改"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
