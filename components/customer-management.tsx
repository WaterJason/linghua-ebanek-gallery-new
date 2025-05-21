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
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from "lucide-react"
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/lib/actions/customer-actions";
import { toast } from "@/components/ui/use-toast"

export function CustomerManagement() {
  const [customers, setCustomers] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")

  useEffect(() => {
    loadCustomers()
  }, [searchQuery, selectedType])

  const loadCustomers = async () => {
    try {
      const data = await getCustomers(
        selectedType && selectedType !== "all" ? selectedType : undefined,
        searchQuery
      )
      setCustomers(data)
    } catch (error) {
      console.error("Error loading customers:", error)
      toast({
        title: "错误",
        description: "加载客户列表失败",
        variant: "destructive",
      })
    }
  }

  const handleAddCustomer = () => {
    setEditingCustomer({ id: 0, name: "", phone: "", email: "", address: "", type: "individual", notes: "", isActive: true })
    setIsDialogOpen(true)
  }

  const handleEditCustomer = (customer) => {
    setEditingCustomer({ ...customer })
    setIsDialogOpen(true)
  }

  const handleDeleteCustomer = async (id) => {
    if (!confirm("确定要删除这个客户吗？")) return

    try {
      await deleteCustomer(id)
      toast({
        title: "成功",
        description: "客户已删除",
      })
      loadCustomers()
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "错误",
        description: error.message || "删除客户失败",
        variant: "destructive",
      })
    }
  }

  const handleSaveCustomer = async () => {
    if (!editingCustomer.name) {
      toast({
        title: "错误",
        description: "客户名称为必填项",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (editingCustomer.id === 0) {
        await createCustomer(editingCustomer)
        toast({
          title: "成功",
          description: "客户已创建",
        })
      } else {
        await updateCustomer(editingCustomer.id, editingCustomer)
        toast({
          title: "成功",
          description: "客户已更新",
        })
      }

      setIsDialogOpen(false)
      loadCustomers()
    } catch (error) {
      console.error("Error saving customer:", error)
      toast({
        title: "错误",
        description: error.message || "保存客户失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCustomerTypeText = (type) => {
    switch (type) {
      case "individual":
        return "个人客户"
      case "company":
        return "企业客户"
      case "channel":
        return "渠道客户"
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">客户管理</h3>
        <Button onClick={handleAddCustomer}>
          <PlusIcon className="mr-2 h-4 w-4" />
          添加客户
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索客户名称、电话或邮箱"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="所有客户类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有客户类型</SelectItem>
            <SelectItem value="individual">个人客户</SelectItem>
            <SelectItem value="company">企业客户</SelectItem>
            <SelectItem value="channel">渠道客户</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客户名称</TableHead>
              <TableHead>电话</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  暂无客户数据
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{getCustomerTypeText(customer.type)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        customer.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {customer.isActive ? "启用" : "禁用"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer.id)}>
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
            <DialogTitle>{editingCustomer?.id === 0 ? "添加客户" : "编辑客户"}</DialogTitle>
            <DialogDescription>
              {editingCustomer?.id === 0 ? "添加新的客户信息" : "编辑现有客户信息"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                客户名称
              </Label>
              <Input
                id="name"
                value={editingCustomer?.name || ""}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                电话
              </Label>
              <Input
                id="phone"
                value={editingCustomer?.phone || ""}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                邮箱
              </Label>
              <Input
                id="email"
                value={editingCustomer?.email || ""}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                客户类型
              </Label>
              <Select
                value={editingCustomer?.type || "individual"}
                onValueChange={(value) => setEditingCustomer({ ...editingCustomer, type: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择客户类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">个人客户</SelectItem>
                  <SelectItem value="company">企业客户</SelectItem>
                  <SelectItem value="channel">渠道客户</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="address" className="text-right pt-2">
                地址
              </Label>
              <Textarea
                id="address"
                value={editingCustomer?.address || ""}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                备注
              </Label>
              <Textarea
                id="notes"
                value={editingCustomer?.notes || ""}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
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
                  checked={editingCustomer?.isActive}
                  onCheckedChange={(checked) => setEditingCustomer({ ...editingCustomer, isActive: checked })}
                />
                <Label htmlFor="isActive">{editingCustomer?.isActive ? "启用" : "禁用"}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveCustomer} disabled={isLoading}>
              {isLoading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
