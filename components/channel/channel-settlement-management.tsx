"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ResponsiveDataGrid } from "@/components/ui/responsive-data-grid"
import { PlusIcon, FileTextIcon, CreditCardIcon, EyeIcon, FileUpIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChannelSettlementForm } from "@/components/channel/channel-settlement-form"
import { ChannelSettlementDetail } from "@/components/channel/channel-settlement-detail"
import { ChannelInvoiceForm } from "@/components/channel/channel-invoice-form"
import { getChannels, getChannelSettlements, updateChannelSettlementStatus } from "@/lib/actions/channel-actions"

export function ChannelSettlementManagement() {
  const { toast } = useToast()
  const [channels, setChannels] = useState([])
  const [settlements, setSettlements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState(null)
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

  // 加载结算数据
  const loadSettlements = async () => {
    try {
      setIsLoading(true)
      
      const channelId = selectedChannel !== "all" ? parseInt(selectedChannel) : undefined
      const status = selectedStatus !== "all" ? selectedStatus : undefined
      
      const data = await getChannelSettlements(channelId, status)
      setSettlements(data)
    } catch (error) {
      toast({
        title: "加载失败",
        description: error.message || "无法加载结算数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 当选择的渠道或状态变化时，重新加载结算数据
  useEffect(() => {
    loadSettlements()
  }, [selectedChannel, selectedStatus])

  // 处理创建结算单
  const handleCreateSettlement = () => {
    setIsFormOpen(true)
  }

  // 处理查看结算详情
  const handleViewSettlement = (settlement) => {
    setSelectedSettlement(settlement)
    setIsDetailOpen(true)
  }

  // 处理确认结算单
  const handleConfirmSettlement = async (id) => {
    try {
      await updateChannelSettlementStatus(id, { status: "confirmed" })
      toast({
        title: "确认成功",
        description: "结算单已成功确认",
      })
      loadSettlements()
    } catch (error) {
      toast({
        title: "确认失败",
        description: error.message || "无法确认结算单",
        variant: "destructive",
      })
    }
  }

  // 处理标记为已付款
  const handleMarkAsPaid = async (id) => {
    try {
      await updateChannelSettlementStatus(id, {
        status: "paid",
        paidAmount: selectedSettlement.totalAmount,
        paymentDate: new Date(),
      })
      toast({
        title: "更新成功",
        description: "结算单已标记为已付款",
      })
      loadSettlements()
      setIsDetailOpen(false)
    } catch (error) {
      toast({
        title: "更新失败",
        description: error.message || "无法更新结算单状态",
        variant: "destructive",
      })
    }
  }

  // 处理添加发票
  const handleAddInvoice = (settlement) => {
    setSelectedSettlement(settlement)
    setIsInvoiceFormOpen(true)
  }

  // 获取状态文本和样式
  const getStatusInfo = (status) => {
    switch (status) {
      case "draft":
        return { text: "草稿", className: "bg-gray-100 text-gray-800" }
      case "confirmed":
        return { text: "已确认", className: "bg-green-100 text-green-800" }
      case "paid":
        return { text: "已付款", className: "bg-blue-100 text-blue-800" }
      default:
        return { text: "未知", className: "bg-gray-100 text-gray-800" }
    }
  }

  // 表格列定义
  const columns = [
    {
      header: "结算单号",
      accessorKey: "settlementNo",
    },
    {
      header: "渠道",
      accessorKey: "channel.name",
    },
    {
      header: "结算周期",
      accessorKey: "startDate",
      cell: ({ row }) => (
        <div>
          {format(new Date(row.original.startDate), "yyyy-MM-dd")} 至 {format(new Date(row.original.endDate), "yyyy-MM-dd")}
        </div>
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
      header: "已付金额",
      accessorKey: "paidAmount",
      cell: ({ row }) => (
        <div>¥ {row.original.paidAmount.toFixed(2)}</div>
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
      header: "操作",
      id: "actions",
      cell: ({ row }) => {
        const status = row.original.status
        
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleViewSettlement(row.original)
              }}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            
            {status === "draft" && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleConfirmSettlement(row.original.id)
                }}
              >
                <FileTextIcon className="mr-2 h-4 w-4" />
                确认
              </Button>
            )}
            
            {status === "confirmed" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedSettlement(row.original)
                    handleAddInvoice(row.original)
                  }}
                >
                  <FileUpIcon className="mr-2 h-4 w-4" />
                  添加发票
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedSettlement(row.original)
                    handleMarkAsPaid(row.original.id)
                  }}
                >
                  <CreditCardIcon className="mr-2 h-4 w-4" />
                  标记付款
                </Button>
              </>
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
              <CardTitle>渠道结算管理</CardTitle>
              <CardDescription>管理渠道结算单和发票</CardDescription>
            </div>
            <Button onClick={handleCreateSettlement}>
              <PlusIcon className="mr-2 h-4 w-4" />
              创建结算单
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
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="confirmed">已确认</SelectItem>
                    <SelectItem value="paid">已付款</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <ResponsiveDataGrid
            data={settlements}
            columns={columns}
            searchable={true}
            searchKeys={["settlementNo", "channel.name", "notes"]}
            loading={isLoading}
            emptyText="暂无结算数据"
            onRowClick={(settlement) => handleViewSettlement(settlement)}
          />
        </CardContent>
      </Card>

      {/* 结算单表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>创建结算单</DialogTitle>
          </DialogHeader>
          <ChannelSettlementForm
            channels={channels}
            selectedChannelId={selectedChannel !== "all" ? selectedChannel : undefined}
            onSuccess={() => {
              setIsFormOpen(false)
              loadSettlements()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 结算单详情对话框 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>结算单详情</DialogTitle>
          </DialogHeader>
          {selectedSettlement && (
            <ChannelSettlementDetail
              settlement={selectedSettlement}
              onConfirm={selectedSettlement.status === "draft" ? () => {
                handleConfirmSettlement(selectedSettlement.id)
                setIsDetailOpen(false)
              } : undefined}
              onMarkAsPaid={selectedSettlement.status === "confirmed" ? () => {
                handleMarkAsPaid(selectedSettlement.id)
              } : undefined}
              onAddInvoice={selectedSettlement.status === "confirmed" ? () => {
                setIsDetailOpen(false)
                handleAddInvoice(selectedSettlement)
              } : undefined}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 发票表单对话框 */}
      <Dialog open={isInvoiceFormOpen} onOpenChange={setIsInvoiceFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加发票</DialogTitle>
          </DialogHeader>
          {selectedSettlement && (
            <ChannelInvoiceForm
              settlement={selectedSettlement}
              onSuccess={() => {
                setIsInvoiceFormOpen(false)
                loadSettlements()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
