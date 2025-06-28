"use client"

import { useState, useEffect } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { PlusIcon, EditIcon, TrashIcon, PackageIcon } from "lucide-react"
import { useMaterialUnitSync } from "@/hooks/use-material-unit-sync"

interface Material {
  id: string
  name: string
  count: number
}

export default function MaterialsPage() {
  const { toast } = useToast()
  const { materials, isLoading, addMaterial, deleteMaterial, loadMaterials } = useMaterialUnitSync()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [formData, setFormData] = useState({ name: "" })

  // 创建材质
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "错误",
        description: "材质名称不能为空",
        variant: "destructive",
      })
      return
    }

    const success = await addMaterial(formData.name.trim())
    if (success) {
      setFormData({ name: "" })
      setShowCreateDialog(false)
    }
  }

  // 编辑材质
  const handleEdit = async () => {
    if (!selectedMaterial || !formData.name.trim()) {
      toast({
        title: "错误",
        description: "材质名称不能为空",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/products/materials/${selectedMaterial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material: formData.name.trim() })
      })

      if (response.ok) {
        await loadMaterials()
        setFormData({ name: "" })
        setSelectedMaterial(null)
        setShowEditDialog(false)
        toast({
          title: "成功",
          description: `材质更新成功`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "更新失败",
          description: error.details || error.error || "更新材质失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('更新材质失败:', error)
      toast({
        title: "更新失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
    }
  }

  // 删除材质
  const handleDelete = async () => {
    if (!selectedMaterial) return

    const success = await deleteMaterial(selectedMaterial.id)
    if (success) {
      setSelectedMaterial(null)
      setShowDeleteDialog(false)
    }
  }

  // 打开编辑对话框
  const openEditDialog = (material: Material) => {
    setSelectedMaterial(material)
    setFormData({ name: material.name })
    setShowEditDialog(true)
  }

  // 打开删除对话框
  const openDeleteDialog = (material: Material) => {
    setSelectedMaterial(material)
    setShowDeleteDialog(true)
  }

  return (
    <ModernPageContainer
      title="材质管理"
      description="管理产品材质信息"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>材质列表</CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加材质
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PackageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>暂无材质</p>
              <p className="text-sm">点击"添加材质"按钮创建第一个材质</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>材质名称</TableHead>
                  <TableHead>使用统计</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {material.count} 个产品
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(material)}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(material)}
                          disabled={material.count > 0}
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

      {/* 创建材质对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新材质</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="materialName">材质名称</Label>
              <Input
                id="materialName"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="输入材质名称"
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

      {/* 编辑材质对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑材质</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editMaterialName">材质名称</Label>
              <Input
                id="editMaterialName"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="输入材质名称"
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
            <p>确定要删除材质 "{selectedMaterial?.name}" 吗？</p>
            {selectedMaterial?.count > 0 && (
              <p className="text-red-600 text-sm mt-2">
                该材质被 {selectedMaterial.count} 个产品使用，无法删除。
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
              disabled={selectedMaterial?.count > 0}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModernPageContainer>
  )
}
