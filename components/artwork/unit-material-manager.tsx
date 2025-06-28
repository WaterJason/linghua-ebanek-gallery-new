"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { PlusIcon, XIcon, RulerIcon, PaintBucketIcon } from "lucide-react"

interface UnitMaterialManagerProps {
  units: string[]
  materials: string[]
  onAddUnit: (unit: string) => Promise<void>
  onRemoveUnit: (unit: string) => Promise<void>
  onAddMaterial: (material: string) => Promise<void>
  onRemoveMaterial: (material: string) => Promise<void>
}

export function UnitMaterialManager({
  units,
  materials,
  onAddUnit,
  onRemoveUnit,
  onAddMaterial,
  onRemoveMaterial
}: UnitMaterialManagerProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("units")
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false)
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [newUnit, setNewUnit] = useState("")
  const [newMaterial, setNewMaterial] = useState("")
  const [itemToDelete, setItemToDelete] = useState("")
  const [deleteType, setDeleteType] = useState<"unit" | "material">("unit")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 处理添加单位
  const handleAddUnit = async () => {
    if (!newUnit.trim()) {
      toast({
        title: "错误",
        description: "单位名称不能为空",
        variant: "destructive",
      })
      return
    }
    
    if (units.includes(newUnit.trim())) {
      toast({
        title: "错误",
        description: "该单位已存在",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await onAddUnit(newUnit.trim())
      setNewUnit("")
      setIsUnitDialogOpen(false)
      toast({
        title: "成功",
        description: "单位添加成功",
      })
    } catch (error) {
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加单位失败",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 处理添加材质
  const handleAddMaterial = async () => {
    if (!newMaterial.trim()) {
      toast({
        title: "错误",
        description: "材质名称不能为空",
        variant: "destructive",
      })
      return
    }
    
    if (materials.includes(newMaterial.trim())) {
      toast({
        title: "错误",
        description: "该材质已存在",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await onAddMaterial(newMaterial.trim())
      setNewMaterial("")
      setIsMaterialDialogOpen(false)
      toast({
        title: "成功",
        description: "材质添加成功",
      })
    } catch (error) {
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加材质失败",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 处理删除确认
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    
    setIsSubmitting(true)
    
    try {
      if (deleteType === "unit") {
        await onRemoveUnit(itemToDelete)
        toast({
          title: "成功",
          description: "单位删除成功",
        })
      } else {
        await onRemoveMaterial(itemToDelete)
        toast({
          title: "成功",
          description: "材质删除成功",
        })
      }
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除失败",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsConfirmDialogOpen(false)
    }
  }
  
  // 处理删除单位
  const handleDeleteUnit = (unit: string) => {
    setItemToDelete(unit)
    setDeleteType("unit")
    setIsConfirmDialogOpen(true)
  }
  
  // 处理删除材质
  const handleDeleteMaterial = (material: string) => {
    setItemToDelete(material)
    setDeleteType("material")
    setIsConfirmDialogOpen(true)
  }
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="units">
            <RulerIcon className="h-4 w-4 mr-2" />
            单位管理
          </TabsTrigger>
          <TabsTrigger value="materials">
            <PaintBucketIcon className="h-4 w-4 mr-2" />
            材质管理
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>作品单位</CardTitle>
              <Button size="sm" onClick={() => setIsUnitDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                添加单位
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {units.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无单位</p>
                ) : (
                  units.map((unit, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {unit}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full"
                        onClick={() => handleDeleteUnit(unit)}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>作品材质</CardTitle>
              <Button size="sm" onClick={() => setIsMaterialDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                添加材质
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {materials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无材质</p>
                ) : (
                  materials.map((material, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {material}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full"
                        onClick={() => handleDeleteMaterial(material)}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 添加单位对话框 */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加单位</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit-name">单位名称</Label>
              <Input
                id="unit-name"
                placeholder="例如：件、幅、套"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnitDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleAddUnit} disabled={isSubmitting}>
              {isSubmitting ? "添加中..." : "添加单位"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 添加材质对话框 */}
      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加材质</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material-name">材质名称</Label>
              <Input
                id="material-name"
                placeholder="例如：景泰蓝、珐琅、陶瓷"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaterialDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleAddMaterial} disabled={isSubmitting}>
              {isSubmitting ? "添加中..." : "添加材质"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title={`删除${deleteType === "unit" ? "单位" : "材质"}`}
        description={`确定要删除${deleteType === "unit" ? "单位" : "材质"} "${itemToDelete}" 吗？如果有作品使用此${deleteType === "unit" ? "单位" : "材质"}，可能会影响作品显示。`}
        confirmLabel="确认删除"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
