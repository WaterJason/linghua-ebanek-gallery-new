"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react"
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from "@/lib/actions/inventory-actions";
import { toast } from "@/components/ui/use-toast"

export function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      const data = await getWarehouses()
      setWarehouses(data)
    } catch (error) {
      console.error("Error loading warehouses:", error)
      toast({
        title: "错误",
        description: "加载仓库列表失败",
        variant: "destructive",
      })
    }
  }

  const handleAddWarehouse = () => {
    setEditingWarehouse({ id: 0, name: "", type: "physical", location: "", description: "", isActive: true })
    setIsDialogOpen(true)
  }

  const handleEditWarehouse = (warehouse) => {
    setEditingWarehouse({ ...warehouse })
    setIsDialogOpen(true)
  }

  const handleDeleteWarehouse = async (id) => {
    if (!confirm("确定要删除这个仓库吗？")) return

    try {
      await deleteWarehouse(id)
      toast({
        title: "成功",
        description: "仓库已删除",
      })
      loadWarehouses()
    } catch (error) {
      console.error("Error deleting warehouse:", error)
      toast({
        title: "错误",
        description: error.message || "删除仓库失败",
        variant: "destructive",
      })
    }
  }

  const handleSaveWarehouse = async () => {
    if (!editingWarehouse.name || !editingWarehouse.type) {
      toast({
        title: "错误",
        description: "仓库名称和类型为必填项",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const warehouseData = {
        name: editingWarehouse.name,
        type: editingWarehouse.type,
        location: editingWarehouse.location || null,
        description: editingWarehouse.description || null,
        isActive: editingWarehouse.isActive !== undefined ? editingWarehouse.isActive : true
      }

      if (editingWarehouse.id === 0) {
        await createWarehouse(warehouseData)
        toast({
          title: "成功",
          description: "仓库已创建",
        })
      } else {
        await updateWarehouse(editingWarehouse.id, warehouseData)
        toast({
          title: "成功",
          description: "仓库已更新",
        })
      }

      setIsDialogOpen(false)
      loadWarehouses()
    } catch (error) {
      console.error("Error saving warehouse:", error)
      toast({
        title: "错误",
        description: error.message || "保存仓库失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">仓库管理</h3>
        <Button onClick={handleAddWarehouse}>
          <PlusIcon className="mr-2 h-4 w-4" />
          添加仓库
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>仓库名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>位置</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  暂无仓库数据
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell>{warehouse.type === "physical" ? "实体仓库" : "虚拟仓库"}</TableCell>
                  <TableCell>{warehouse.location || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        warehouse.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {warehouse.isActive ? "启用" : "禁用"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditWarehouse(warehouse)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteWarehouse(warehouse.id)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWarehouse?.id === 0 ? "添加仓库" : "编辑仓库"}</DialogTitle>
            <DialogDescription>
              {editingWarehouse?.id === 0 ? "添加新的仓库信息" : "编辑现有仓库信息"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                仓库名称
              </Label>
              <Input
                id="name"
                value={editingWarehouse?.name || ""}
                onChange={(e) => setEditingWarehouse({ ...editingWarehouse, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                仓库类型
              </Label>
              <Select
                value={editingWarehouse?.type || "physical"}
                onValueChange={(value) => setEditingWarehouse({ ...editingWarehouse, type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择仓库类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">实体仓库</SelectItem>
                  <SelectItem value="virtual">虚拟仓库</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                位置
              </Label>
              <Input
                id="location"
                value={editingWarehouse?.location || ""}
                onChange={(e) => setEditingWarehouse({ ...editingWarehouse, location: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                描述
              </Label>
              <Textarea
                id="description"
                value={editingWarehouse?.description || ""}
                onChange={(e) => setEditingWarehouse({ ...editingWarehouse, description: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                启用状态
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="isActive"
                  checked={editingWarehouse?.isActive}
                  onCheckedChange={(checked) => setEditingWarehouse({ ...editingWarehouse, isActive: checked })}
                />
                <Label htmlFor="isActive">{editingWarehouse?.isActive ? "启用" : "禁用"}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveWarehouse} disabled={isLoading}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
