"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { PlusIcon, RulerIcon } from "lucide-react"
import { useMaterialUnitSync } from "@/hooks/use-material-unit-sync"

interface UnitSelectorProps {
  value: string | null
  onChange: (value: string | null) => void
  label?: string
  placeholder?: string
  allowCreate?: boolean
}

export function UnitSelector({
  value,
  onChange,
  label = "单位",
  placeholder = "选择单位",
  allowCreate = true
}: UnitSelectorProps) {
  const { toast } = useToast()
  const { units: syncUnits, isLoading, addUnit } = useMaterialUnitSync()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newUnit, setNewUnit] = useState("")

  // 只使用同位的单位数据，确保与管理页面完全一致
  const units = syncUnits.map(u => u.name).sort()

  console.log(`[UnitSelector] 当前单位数量: ${units.length}`, units)
  console.log(`[UnitSelector] 当前选中值: "${value}"`)
  console.log(`[UnitSelector] 是否包含当前值: ${value ? units.includes(value) : false}`)

  // 创建新单位
  const handleCreateUnit = async () => {
    if (!newUnit.trim()) {
      toast({
        title: "错误",
        description: "单位名称不能为空",
        variant: "destructive",
      })
      return
    }

    const unitName = newUnit.trim()

    // 检查是否已存在
    if (units.includes(unitName)) {
      toast({
        title: "错误",
        description: "该单位已存在",
        variant: "destructive",
      })
      return
    }

    // 使用同步的添加单位方法
    const success = await addUnit(unitName)
    if (success) {
      // 自动选择新创建的单位
      onChange(unitName)
      setNewUnit("")
      setShowCreateDialog(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <RulerIcon className="h-4 w-4" />
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
              {/* 如果当前值不在单位列表中，添加一个临时选项 */}
              {value && !units.includes(value) && (
                <SelectItem key={`current-${value}`} value={value}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500" />
                    {value} (当前值)
                  </div>
                </SelectItem>
              )}
              {units.map(unit => (
                <SelectItem key={unit} value={unit}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
                    {unit}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {/* 创建单位对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新单位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitName">单位名称</Label>
              <Input
                id="unitName"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="输入单位名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateUnit()
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>常用单位：套、件、个、对、只、副、幅、组等</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateUnit}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
