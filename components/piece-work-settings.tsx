"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react"
import { getPieceWorkItems, createPieceWorkItem, updatePieceWorkItem, deletePieceWorkItem } from "@/lib/actions/workshop-actions";
import { toast } from "@/components/ui/use-toast"

export function PieceWorkSettings() {
  const [accessoryItems, setAccessoryItems] = useState([])
  const [enamellingSets, setEnamellingSets] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [currentTab, setCurrentTab] = useState("accessory")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 获取计件工项数据
  useEffect(() => {
    async function fetchPieceWorkItems() {
      try {
        const [accessoryData, enamellingData] = await Promise.all([
          getPieceWorkItems("accessory"),
          getPieceWorkItems("enamelling"),
        ])

        setAccessoryItems(accessoryData)
        setEnamellingSets(enamellingData)
      } catch (error) {
        console.error("Error fetching piece work items:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPieceWorkItems()
  }, [])

  const handleAddItem = (type) => {
    setEditingItem({ id: 0, name: "", price: 0, type })
    setCurrentTab(type)
    setIsDialogOpen(true)
  }

  const handleEditItem = (item, type) => {
    setEditingItem({ ...item })
    setCurrentTab(type)
    setIsDialogOpen(true)
  }

  const handleDeleteItem = async (id, type) => {
    if (confirm("确定要删除这个工项吗？")) {
      try {
        await deletePieceWorkItem(id)
        if (type === "accessory") {
          setAccessoryItems(accessoryItems.filter((item) => item.id !== id))
        } else {
          setEnamellingSets(enamellingSets.filter((item) => item.id !== id))
        }
        toast({
          title: "删除成功",
          description: "工项已成功删除",
        })
      } catch (error) {
        console.error("Error deleting piece work item:", error)
        toast({
          title: "删除失败",
          description: "删除工项时出错",
          variant: "destructive",
        })
      }
    }
  }

  const handleSaveItem = async () => {
    setSubmitting(true)
    try {
      if (editingItem.id === 0) {
        // 添加新工项
        const newItem = await createPieceWorkItem(editingItem)
        if (currentTab === "accessory") {
          setAccessoryItems([...accessoryItems, newItem])
        } else {
          setEnamellingSets([...enamellingSets, newItem])
        }
        toast({
          title: "添加成功",
          description: "新工项已成功添加",
        })
      } else {
        // 更新现有工项
        const updatedItem = await updatePieceWorkItem(editingItem.id, editingItem)
        if (currentTab === "accessory") {
          setAccessoryItems(accessoryItems.map((item) => (item.id === editingItem.id ? updatedItem : item)))
        } else {
          setEnamellingSets(enamellingSets.map((item) => (item.id === editingItem.id ? updatedItem : item)))
        }
        toast({
          title: "更新成功",
          description: "工项信息已成功更新",
        })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving piece work item:", error)
      toast({
        title: "保存失败",
        description: "保存工项信息时出错",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">加载工项数据中...</div>
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="accessory" onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accessory">配饰工项</TabsTrigger>
          <TabsTrigger value="enamelling">点蓝工项</TabsTrigger>
        </TabsList>

        <TabsContent value="accessory" className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">配饰工项列表</h3>
            <Button onClick={() => handleAddItem("accessory")}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加工项
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工项名称</TableHead>
                  <TableHead className="text-right">单价 (¥/件)</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessoryItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      暂无配饰工项数据
                    </TableCell>
                  </TableRow>
                ) : (
                  accessoryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditItem(item, "accessory")}>
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id, "accessory")}>
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
        </TabsContent>

        <TabsContent value="enamelling" className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">点蓝工项列表</h3>
            <Button onClick={() => handleAddItem("enamelling")}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加工项
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工项名称</TableHead>
                  <TableHead className="text-right">单价 (¥/件)</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enamellingSets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      暂无点蓝工项数据
                    </TableCell>
                  </TableRow>
                ) : (
                  enamellingSets.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditItem(item, "enamelling")}>
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id, "enamelling")}>
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
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.id === 0 ? "添加工项" : "编辑工项"}</DialogTitle>
            <DialogDescription>填写工项信息，点击保存完成操作。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                工项名称
              </Label>
              <Input
                id="name"
                value={editingItem?.name || ""}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                单价 (¥/件)
              </Label>
              <Input
                id="price"
                type="number"
                value={editingItem?.price || 0}
                onChange={(e) => setEditingItem({ ...editingItem, price: Number.parseFloat(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveItem} disabled={submitting}>
              {submitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
