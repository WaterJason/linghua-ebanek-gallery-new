"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ResponsiveDataGrid } from "@/components/ui/responsive-data-grid"
import { PlusIcon, EditIcon, TrashIcon, AlertTriangleIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChannelInventoryForm } from "@/components/channel/channel-inventory-form"
import { getChannels, getChannelInventory, deleteChannelInventory } from "@/lib/actions/channel-actions"

export function ChannelInventoryManagement() {
  const { toast } = useToast()
  const [channels, setChannels] = useState([])
  const [inventory, setInventory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedInventory, setSelectedInventory] = useState(null)
  const [selectedChannel, setSelectedChannel] = useState("all")

  // 加载渠道数据
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const data = await getChannels()
        setChannels(data)
      } catch (error) {
        toast({
          title: "加载失败",
          description: error.message || "无法加载渠道数据",
          variant: "destructive",
        })
      }
    }
    
    loadChannels()
  }, [toast])

  // 加载库存数据
  const loadInventory = async () => {
    try {
      setIsLoading(true)
      
      const channelId = selectedChannel !== "all" ? parseInt(selectedChannel) : undefined
      
      const data = await getChannelInventory(channelId)
      setInventory(data)
    } catch (error) {
      toast({
        title: "加载失败",
        description: error.message || "无法加载库存数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 当选择的渠道变化时，重新加载库存数据
  useEffect(() => {
    loadInventory()
  }, [selectedChannel])

  // 处理添加库存
  const handleAddInventory = () => {
    setSelectedInventory(null)
    setIsFormOpen(true)
  }

  // 处理编辑库存
  const handleEditInventory = (inventory) => {
    setSelectedInventory(inventory)
    setIsFormOpen(true)
  }

  // 处理删除库存
  const handleDeleteInventory = (inventory) => {
    setSelectedInventory(inventory)
    setIsDeleteDialogOpen(true)
  }

  // 确认删除库存
  const confirmDeleteInventory = async () => {
    try {
      await deleteChannelInventory(selectedInventory.id)
      toast({
        title: "删除成功",
        description: "渠道库存已成功删除",
      })
      loadInventory()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast({
        title: "删除失败",
        description: error.message || "无法删除渠道库存",
        variant: "destructive",
      })
    }
  }

  // 表格列定义
  const columns = [
    {
      header: "渠道",
      accessorKey: "channel.name",
    },
    {
      header: "产品",
      accessorKey: "product.name",
    },
    {
      header: "产品编码",
      accessorKey: "product.code",
    },
    {
      header: "库存数量",
      accessorKey: "quantity",
      cell: ({ row }) => {
        const quantity = row.original.quantity
        const minQuantity = row.original.minQuantity
        
        // 如果库存低于最小库存，显示警告
        const isLow = minQuantity !== null && quantity < minQuantity
        
        return (
          <div className="flex items-center">
            <span className={`font-medium ${isLow ? "text-red-600" : ""}`}>
              {quantity}
            </span>
            {isLow && (
              <AlertTriangleIcon className="ml-2 h-4 w-4 text-red-600" />
            )}
          </div>
        )
      },
    },
    {
      header: "最小库存",
      accessorKey: "minQuantity",
      cell: ({ row }) => (
        <div>{row.original.minQuantity !== null ? row.original.minQuantity : "未设置"}</div>
      ),
    },
    {
      header: "备注",
      accessorKey: "notes",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.original.notes || "-"}</div>
      ),
    },
    {
      header: "操作",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleEditInventory(row.original)
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteInventory(row.original)
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>渠道库存管理</CardTitle>
              <CardDescription>管理渠道商品库存</CardDescription>
            </div>
            <Button onClick={handleAddInventory}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加库存
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex gap-4">
              <div className="w-64">
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择渠道" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有渠道</SelectItem>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id.toString()}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <ResponsiveDataGrid
            data={inventory}
            columns={columns}
            searchable={true}
            searchKeys={["channel.name", "product.name", "product.code"]}
            loading={isLoading}
            emptyText="暂无库存数据"
          />
        </CardContent>
      </Card>

      {/* 库存表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedInventory ? "编辑库存" : "添加库存"}</DialogTitle>
          </DialogHeader>
          <ChannelInventoryForm
            inventory={selectedInventory}
            channels={channels}
            onSuccess={() => {
              setIsFormOpen(false)
              loadInventory()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="删除库存"
        description={`确定要删除 "${selectedInventory?.channel?.name}" 的 "${selectedInventory?.product?.name}" 库存记录吗？此操作不可撤销。`}
        onConfirm={confirmDeleteInventory}
      />
    </div>
  )
}
