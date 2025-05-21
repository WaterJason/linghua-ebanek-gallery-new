"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ResponsiveDataGrid } from "@/components/ui/responsive-data-grid"
import { PlusIcon, TruckIcon, CheckIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChannelDistributionForm } from "@/components/channel/channel-distribution-form"
import { getChannels, getChannelDistributions, updateChannelDistributionStatus } from "@/lib/actions/channel-actions"

export function ChannelDistributionManagement() {
  const { toast } = useToast()
  const [channels, setChannels] = useState([])
  const [distributions, setDistributions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
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

  // 加载配货数据
  const loadDistributions = async () => {
    try {
      setIsLoading(true)
      
      const channelId = selectedChannel !== "all" ? parseInt(selectedChannel) : undefined
      
      const data = await getChannelDistributions(channelId)
      setDistributions(data)
    } catch (error) {
      toast({
        title: "加载失败",
        description: error.message || "无法加载配货数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 当选择的渠道变化时，重新加载配货数据
  useEffect(() => {
    loadDistributions()
  }, [selectedChannel])

  // 处理添加配货
  const handleAddDistribution = () => {
    setIsFormOpen(true)
  }

  // 处理更新配货状态
  const handleUpdateStatus = async (id, status) => {
    try {
      await updateChannelDistributionStatus(id, status)
      toast({
        title: "更新成功",
        description: "配货状态已成功更新",
      })
      loadDistributions()
    } catch (error) {
      toast({
        title: "更新失败",
        description: error.message || "无法更新配货状态",
        variant: "destructive",
      })
    }
  }

  // 获取状态文本和样式
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return { text: "待发货", className: "bg-yellow-100 text-yellow-800" }
      case "shipped":
        return { text: "已发货", className: "bg-blue-100 text-blue-800" }
      case "received":
        return { text: "已收货", className: "bg-green-100 text-green-800" }
      default:
        return { text: "未知", className: "bg-gray-100 text-gray-800" }
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
      accessorKey: "channelInventory.product.name",
    },
    {
      header: "产品编码",
      accessorKey: "channelInventory.product.code",
    },
    {
      header: "数量",
      accessorKey: "quantity",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.quantity}</div>
      ),
    },
    {
      header: "配货日期",
      accessorKey: "distributionDate",
      cell: ({ row }) => (
        <div>{format(new Date(row.original.distributionDate), "yyyy-MM-dd")}</div>
      ),
    },
    {
      header: "状态",
      accessorKey: "status",
      cell: ({ row }) => {
        const statusInfo = getStatusInfo(row.original.status)
        return (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
        )
      },
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
      cell: ({ row }) => {
        const status = row.original.status
        
        return (
          <div className="flex items-center gap-2">
            {status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(row.original.id, "shipped")}
              >
                <TruckIcon className="mr-2 h-4 w-4" />
                标记为已发货
              </Button>
            )}
            {status === "shipped" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(row.original.id, "received")}
              >
                <CheckIcon className="mr-2 h-4 w-4" />
                标记为已收货
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>渠道配货管理</CardTitle>
              <CardDescription>管理渠道商品的配货和发货</CardDescription>
            </div>
            <Button onClick={handleAddDistribution}>
              <PlusIcon className="mr-2 h-4 w-4" />
              新增配货
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
            data={distributions}
            columns={columns}
            searchable={true}
            searchKeys={["channel.name", "channelInventory.product.name", "channelInventory.product.code", "notes"]}
            loading={isLoading}
            emptyText="暂无配货数据"
          />
        </CardContent>
      </Card>

      {/* 配货表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增配货</DialogTitle>
          </DialogHeader>
          <ChannelDistributionForm
            channels={channels}
            selectedChannelId={selectedChannel !== "all" ? selectedChannel : undefined}
            onSuccess={() => {
              setIsFormOpen(false)
              loadDistributions()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
