"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ResponsiveDataGrid } from "@/components/ui/responsive-data-grid"
import { PlusIcon, FileUpIcon, CheckIcon, EyeIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChannelSalesImportForm } from "@/components/channel/channel-sales-import-form"
import { ChannelSalesDetail } from "@/components/channel/channel-sales-detail"
import { getChannels, getChannelSales, updateChannelSaleStatus } from "@/lib/actions/channel-actions"

export function ChannelSalesManagement() {
  const { toast } = useToast()
  const [channels, setChannels] = useState([])
  const [sales, setSales] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImportFormOpen, setIsImportFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [selectedChannel, setSelectedChannel] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

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

  // 加载销售数据
  const loadSales = async () => {
    try {
      setIsLoading(true)
      
      const channelId = selectedChannel !== "all" ? parseInt(selectedChannel) : undefined
      const status = selectedStatus !== "all" ? selectedStatus : undefined
      
      const data = await getChannelSales(channelId, status)
      setSales(data)
    } catch (error) {
      toast({
        title: "加载失败",
        description: error.message || "无法加载销售数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 当选择的渠道或状态变化时，重新加载销售数据
  useEffect(() => {
    loadSales()
  }, [selectedChannel, selectedStatus])

  // 处理导入销售数据
  const handleImportSales = () => {
    setIsImportFormOpen(true)
  }

  // 处理查看销售详情
  const handleViewSale = (sale) => {
    setSelectedSale(sale)
    setIsDetailOpen(true)
  }

  // 处理确认销售
  const handleConfirmSale = async (id) => {
    try {
      await updateChannelSaleStatus(id, "confirmed")
      toast({
        title: "确认成功",
        description: "销售记录已成功确认",
      })
      loadSales()
    } catch (error) {
      toast({
        title: "确认失败",
        description: error.message || "无法确认销售记录",
        variant: "destructive",
      })
    }
  }

  // 获取状态文本和样式
  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return { text: "待确认", className: "bg-yellow-100 text-yellow-800" }
      case "confirmed":
        return { text: "已确认", className: "bg-green-100 text-green-800" }
      case "settled":
        return { text: "已结算", className: "bg-blue-100 text-blue-800" }
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
      header: "销售日期",
      accessorKey: "saleDate",
      cell: ({ row }) => (
        <div>{format(new Date(row.original.saleDate), "yyyy-MM-dd")}</div>
      ),
    },
    {
      header: "总金额",
      accessorKey: "totalAmount",
      cell: ({ row }) => (
        <div className="font-medium">¥ {row.original.totalAmount.toFixed(2)}</div>
      ),
    },
    {
      header: "商品数量",
      accessorKey: "items.length",
      cell: ({ row }) => (
        <div>{row.original.items.length}</div>
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
      header: "来源",
      accessorKey: "importSource",
      cell: ({ row }) => (
        <div>{row.original.importSource || "-"}</div>
      ),
    },
    {
      header: "操作",
      id: "actions",
      cell: ({ row }) => {
        const status = row.original.status
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewSale(row.original)}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            
            {status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConfirmSale(row.original.id)}
              >
                <CheckIcon className="mr-2 h-4 w-4" />
                确认
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
              <CardTitle>渠道销售管理</CardTitle>
              <CardDescription>管理渠道销售数据</CardDescription>
            </div>
            <Button onClick={handleImportSales}>
              <FileUpIcon className="mr-2 h-4 w-4" />
              导入销售数据
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
              <div className="w-64">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有状态</SelectItem>
                    <SelectItem value="pending">待确认</SelectItem>
                    <SelectItem value="confirmed">已确认</SelectItem>
                    <SelectItem value="settled">已结算</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <ResponsiveDataGrid
            data={sales}
            columns={columns}
            searchable={true}
            searchKeys={["channel.name", "importSource", "notes"]}
            loading={isLoading}
            emptyText="暂无销售数据"
            onRowClick={(sale) => handleViewSale(sale)}
          />
        </CardContent>
      </Card>

      {/* 导入销售数据表单对话框 */}
      <Dialog open={isImportFormOpen} onOpenChange={setIsImportFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>导入销售数据</DialogTitle>
          </DialogHeader>
          <ChannelSalesImportForm
            channels={channels}
            selectedChannelId={selectedChannel !== "all" ? selectedChannel : undefined}
            onSuccess={() => {
              setIsImportFormOpen(false)
              loadSales()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 销售详情对话框 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>销售详情</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <ChannelSalesDetail
              sale={selectedSale}
              onConfirm={selectedSale.status === "pending" ? () => {
                handleConfirmSale(selectedSale.id)
                setIsDetailOpen(false)
              } : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
