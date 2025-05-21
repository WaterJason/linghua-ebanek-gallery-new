"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ResponsiveDataGrid } from "@/components/ui/responsive-data-grid"
import { PlusIcon, TrashIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChannelDepositForm } from "@/components/channel/channel-deposit-form"
import { getChannels, getChannelDeposits, getChannelDepositBalance, deleteChannelDeposit } from "@/lib/actions/channel-actions"

export function ChannelDepositManagement() {
  const { toast } = useToast()
  const [channels, setChannels] = useState([])
  const [deposits, setDeposits] = useState([])
  const [depositBalance, setDepositBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDeposit, setSelectedDeposit] = useState(null)
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

  // 加载押金数据
  const loadDeposits = async () => {
    try {
      setIsLoading(true)
      
      const channelId = selectedChannel !== "all" ? parseInt(selectedChannel) : undefined
      
      const data = await getChannelDeposits(channelId)
      setDeposits(data)
      
      // 如果选择了特定渠道，加载押金余额
      if (channelId) {
        const balanceData = await getChannelDepositBalance(channelId)
        setDepositBalance(balanceData.balance)
      } else {
        setDepositBalance(0)
      }
    } catch (error) {
      toast({
        title: "加载失败",
        description: error.message || "无法加载押金数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 当选择的渠道变化时，重新加载押金数据
  useEffect(() => {
    loadDeposits()
  }, [selectedChannel])

  // 处理添加押金
  const handleAddDeposit = () => {
    setSelectedDeposit(null)
    setIsFormOpen(true)
  }

  // 处理删除押金
  const handleDeleteDeposit = (deposit) => {
    setSelectedDeposit(deposit)
    setIsDeleteDialogOpen(true)
  }

  // 确认删除押金
  const confirmDeleteDeposit = async () => {
    try {
      await deleteChannelDeposit(selectedDeposit.id)
      toast({
        title: "删除成功",
        description: "押金记录已成功删除",
      })
      loadDeposits()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast({
        title: "删除失败",
        description: error.message || "无法删除押金记录",
        variant: "destructive",
      })
    }
  }

  // 获取押金类型文本和样式
  const getDepositTypeInfo = (type) => {
    switch (type) {
      case "deposit":
        return { text: "收取", className: "bg-green-100 text-green-800" }
      case "refund":
        return { text: "退还", className: "bg-red-100 text-red-800" }
      case "deduction":
        return { text: "抵扣", className: "bg-yellow-100 text-yellow-800" }
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
      header: "日期",
      accessorKey: "date",
      cell: ({ row }) => (
        <div>{format(new Date(row.original.date), "yyyy-MM-dd")}</div>
      ),
    },
    {
      header: "类型",
      accessorKey: "type",
      cell: ({ row }) => {
        const typeInfo = getDepositTypeInfo(row.original.type)
        return (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.className}`}>
            {typeInfo.text}
          </div>
        )
      },
    },
    {
      header: "金额",
      accessorKey: "amount",
      cell: ({ row }) => {
        const type = row.original.type
        const prefix = type === "deposit" ? "+" : "-"
        return (
          <div className={`font-medium ${type === "deposit" ? "text-green-600" : "text-red-600"}`}>
            {prefix} ¥ {row.original.amount.toFixed(2)}
          </div>
        )
      },
    },
    {
      header: "支付方式",
      accessorKey: "paymentMethod",
      cell: ({ row }) => (
        <div>{row.original.paymentMethod || "-"}</div>
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
              handleDeleteDeposit(row.original)
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
              <CardTitle>渠道押金管理</CardTitle>
              <CardDescription>管理渠道押金的收取、退还和抵扣</CardDescription>
            </div>
            <Button onClick={handleAddDeposit}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加押金记录
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex gap-4 items-center">
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
              
              {selectedChannel !== "all" && (
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">当前押金余额:</span>
                  <span className="text-lg font-bold text-primary">
                    ¥ {depositBalance.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <ResponsiveDataGrid
            data={deposits}
            columns={columns}
            searchable={true}
            searchKeys={["channel.name", "notes", "paymentMethod"]}
            loading={isLoading}
            emptyText="暂无押金记录"
          />
        </CardContent>
      </Card>

      {/* 押金表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加押金记录</DialogTitle>
          </DialogHeader>
          <ChannelDepositForm
            channels={channels}
            selectedChannelId={selectedChannel !== "all" ? selectedChannel : undefined}
            onSuccess={() => {
              setIsFormOpen(false)
              loadDeposits()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="删除押金记录"
        description={`确定要删除 "${selectedDeposit?.channel?.name}" 的押金记录吗？此操作不可撤销。`}
        onConfirm={confirmDeleteDeposit}
      />
    </div>
  )
}
