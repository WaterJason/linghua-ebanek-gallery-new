"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { PlusIcon, PackageIcon } from "lucide-react"
import { useMaterialUnitSync } from "@/hooks/use-material-unit-sync"

interface MaterialSelectorProps {
  value: string | null
  onChange: (value: string | null) => void
  label?: string
  placeholder?: string
  allowCreate?: boolean
}

export function MaterialSelector({
  value,
  onChange,
  label = "材质",
  placeholder = "选择材质",
  allowCreate = true
}: MaterialSelectorProps) {
  const { toast } = useToast()
  const { materials: syncMaterials, isLoading, addMaterial } = useMaterialUnitSync()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newMaterial, setNewMaterial] = useState("")

  // 只使用同步的材质数据，确保与管理页面完全一致
  const materials = syncMaterials.map(m => m.name).sort()

  console.log(`[MaterialSelector] 当前材质数量: ${materials.length}`, materials)
  console.log(`[MaterialSelector] 当前选中值: "${value}"`)
  console.log(`[MaterialSelector] 是否包含当前值: ${value ? materials.includes(value) : false}`)

  // 创建新材质
  const handleCreateMaterial = async () => {
    if (!newMaterial.trim()) {
      toast({
        title: "错误",
        description: "材质名称不能为空",
        variant: "destructive",
      })
      return
    }

    const materialName = newMaterial.trim()

    // 检查是否已存在
    if (materials.includes(materialName)) {
      toast({
        title: "错误",
        description: "该材质已存在",
        variant: "destructive",
      })
      return
    }

    // 使用同步的添加材质方法
    const success = await addMaterial(materialName)
    if (success) {
      // 自动选择新创建的材质
      onChange(materialName)
      setNewMaterial("")
      setShowCreateDialog(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <PackageIcon className="h-4 w-4" />
          {label}
        </Label>
        {allowCreate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            新增
          </Button>
        )}
      </div>

      <Select
        value={value || "none"}
        onValueChange={(selectedValue) => onChange(selectedValue === "none" ? null : selectedValue)}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">未指定</SelectItem>
          {isLoading ? (
            <SelectItem value="loading" disabled>加载中...</SelectItem>
          ) : (
            <>
              {/* 如果当前值不在材质列表中，添加一个临时选项 */}
              {value && !materials.includes(value) && (
                <SelectItem key={`current-${value}`} value={value}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500" />
                    {value} (当前值)
                  </div>
                </SelectItem>
              )}
              {materials.map(material => (
                <SelectItem key={material} value={material}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                    {material}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {/* 创建材质对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新材质</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="materialName">材质名称</Label>
              <Input
                id="materialName"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="输入材质名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateMaterial()
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>常用材质：珐琅、景泰蓝、铜胎珐琅、银胎珐琅、掐丝珐琅等</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateMaterial}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
