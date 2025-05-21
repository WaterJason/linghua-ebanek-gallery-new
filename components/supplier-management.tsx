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
import { Switch } from "@/components/ui/switch"
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from "lucide-react"
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/lib/actions/purchase-actions";
import { toast } from "@/components/ui/use-toast"

export function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredSuppliers, setFilteredSuppliers] = useState([])

  useEffect(() => {
    loadSuppliers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSuppliers(suppliers)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredSuppliers(
        suppliers.filter(
          (supplier) =>
            supplier.name.toLowerCase().includes(query) ||
            (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(query)) ||
            (supplier.phone && supplier.phone.toLowerCase().includes(query)) ||
            (supplier.email && supplier.email.toLowerCase().includes(query))
        )
      )
    }
  }, [searchQuery, suppliers])

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers()
      setSuppliers(data)
      setFilteredSuppliers(data)
    } catch (error) {
      console.error("Error loading suppliers:", error)
      toast({
        title: "错误",
        description: "加载供应商列表失败",
        variant: "destructive",
      })
    }
  }

  const handleAddSupplier = () => {
    setEditingSupplier({ id: 0, name: "", contactPerson: "", phone: "", email: "", address: "", description: "", isActive: true })
    setIsDialogOpen(true)
  }

  const handleEditSupplier = (supplier) => {
    setEditingSupplier({ ...supplier })
    setIsDialogOpen(true)
  }

  const handleDeleteSupplier = async (id) => {
    if (!confirm("确定要删除这个供应商吗？")) return

    try {
      await deleteSupplier(id)
      toast({
        title: "成功",
        description: "供应商已删除",
      })
      loadSuppliers()
    } catch (error) {
      console.error("Error deleting supplier:", error)
      toast({
        title: "错误",
        description: error.message || "删除供应商失败",
        variant: "destructive",
      })
    }
  }

  const handleSaveSupplier = async () => {
    if (!editingSupplier.name) {
      toast({
        title: "错误",
        description: "供应商名称为必填项",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (editingSupplier.id === 0) {
        await createSupplier(editingSupplier)
        toast({
          title: "成功",
          description: "供应商已创建",
        })
      } else {
        await updateSupplier(editingSupplier.id, editingSupplier)
        toast({
          title: "成功",
          description: "供应商已更新",
        })
      }

      setIsDialogOpen(false)
      loadSuppliers()
    } catch (error) {
      console.error("Error saving supplier:", error)
      toast({
        title: "错误",
        description: error.message || "保存供应商失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">供应商管理</h3>
        <Button onClick={handleAddSupplier}>
          <PlusIcon className="mr-2 h-4 w-4" />
          添加供应商
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索供应商名称、联系人、电话或邮箱"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>供应商名称</TableHead>
              <TableHead>联系人</TableHead>
              <TableHead>电话</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  暂无供应商数据
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contactPerson || "-"}</TableCell>
                  <TableCell>{supplier.phone || "-"}</TableCell>
                  <TableCell>{supplier.email || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        supplier.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {supplier.isActive ? "启用" : "禁用"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditSupplier(supplier)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSupplier(supplier.id)}>
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
            <DialogTitle>{editingSupplier?.id === 0 ? "添加供应商" : "编辑供应商"}</DialogTitle>
            <DialogDescription>
              {editingSupplier?.id === 0 ? "添加新的供应商信息" : "编辑现有供应商信息"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                供应商名称
              </Label>
              <Input
                id="name"
                value={editingSupplier?.name || ""}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactPerson" className="text-right">
                联系人
              </Label>
              <Input
                id="contactPerson"
                value={editingSupplier?.contactPerson || ""}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                电话
              </Label>
              <Input
                id="phone"
                value={editingSupplier?.phone || ""}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                邮箱
              </Label>
              <Input
                id="email"
                value={editingSupplier?.email || ""}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="address" className="text-right pt-2">
                地址
              </Label>
              <Textarea
                id="address"
                value={editingSupplier?.address || ""}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                描述
              </Label>
              <Textarea
                id="description"
                value={editingSupplier?.description || ""}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, description: e.target.value })}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                启用状态
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="isActive"
                  checked={editingSupplier?.isActive}
                  onCheckedChange={(checked) => setEditingSupplier({ ...editingSupplier, isActive: checked })}
                />
                <Label htmlFor="isActive">{editingSupplier?.isActive ? "启用" : "禁用"}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveSupplier} disabled={isLoading}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
