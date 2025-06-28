"use client"

import { useState } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { PlusIcon, EditIcon, TrashIcon, RulerIcon } from "lucide-react"
import { useMaterialUnitSync } from "@/hooks/use-material-unit-sync"

interface Unit {
  id: string
  name: string
  count: number
}

export default function UnitsPage() {
  const { toast } = useToast()
  const { units, isLoading, addUnit, deleteUnit, loadUnits } = useMaterialUnitSync()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [formData, setFormData] = useState({ name: "" })

  // 创建单位
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "错误",
        description: "单位名称不能为空",
      })
      return
    }

    const success = await addUnit(formData.name.trim())
    if (success) {
      setFormData({ name: "" })
      setShowCreateDialog(false)
    }
  }

  // 编辑单位
  const handleEdit = async () => {
    if (!selectedUnit || !formData.name.trim()) {
      toast({
        title: "错误",
        description: "单位名称不能为空",
      })
      return
    }

    try {
      const response = await fetch(`/api/products/units/${selectedUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit: formData.name.trim() })
      })

      if (response.ok) {
        await loadUnits()
        setFormData({ name: "" })
        setSelectedUnit(null)
        setShowEditDialog(false)
        toast({
          title: "成功",
          description: `单位更新成功`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "更新失败",
          description: error.details || error.error || "更新单位失败",
        })
      }
    } catch (error) {
      console.error('更新单位失败:', error)
      toast({
        title: "更新失败",
        description: "网络错误，请稍后重试",
      })
    }
  }

  // 删除单位
  const handleDelete = async () => {
    if (!selectedUnit) return

    const success = await deleteUnit(selectedUnit.id)
    if (success) {
      setSelectedUnit(null)
      setShowDeleteDialog(false)
    }
  }

  // 打开编辑对话框
  const openEditDialog = (unit: Unit) => {
    setSelectedUnit(unit)
    setFormData({ name: unit.name })
    setShowEditDialog(true)
  }

  // 打开删除对话框
  const openDeleteDialog = (unit: Unit) => {
    setSelectedUnit(unit)
    setShowDeleteDialog(true)
  }

  return (
    <ModernPageContainer
      title="单位管理"
      description="管理产品计量单位信息"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>单位列表</CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加单位
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : units.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RulerIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>暂无单位</p>
              <p className="text-sm">点击"添加单位"按钮创建第一个单位</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>单位名称</TableHead>
                  <TableHead>使用统计</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {unit.count} 个产品
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(unit)}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(unit)}
                          disabled={unit.count > 0}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 创建单位对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新单位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unitName">单位名称</Label>
              <Input
                id="unitName"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="输入单位名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑单位对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑单位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editUnitName">单位名称</Label>
              <Input
                id="editUnitName"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="输入单位名称"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleEdit()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>确定要删除单位 "{selectedUnit?.name}" 吗？</p>
            {selectedUnit && selectedUnit.count > 0 && (
              <p className="text-red-600 text-sm mt-2">
                该单位被 {selectedUnit.count} 个产品使用，无法删除。
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={selectedUnit ? selectedUnit.count > 0 : true}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModernPageContainer>
  )
}
