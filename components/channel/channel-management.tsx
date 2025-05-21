"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ResponsiveDataGrid } from "@/components/ui/responsive-data-grid"
import { PlusIcon, EditIcon, TrashIcon, EyeIcon } from "lucide-react"
import { ChannelForm } from "@/components/channel/channel-form"
import { ChannelDetail } from "@/components/channel/channel-detail"
import { getChannels, deleteChannel } from "@/lib/actions/channel-actions"

export function ChannelManagement() {
  const { toast } = useToast()
  const [channels, setChannels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState(null)

  // 加载渠道数据
  const loadChannels = async () => {
    try {
      setIsLoading(true)
      const data = await getChannels()
      setChannels(data)
    } catch (error) {
      toast({
        title: "加载失败",
        description: error.message || "无法加载渠道数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadChannels()
  }, [])

  // 处理添加渠道
  const handleAddChannel = () => {
    setSelectedChannel(null)
    setIsFormOpen(true)
  }

  // 处理编辑渠道
  const handleEditChannel = (channel) => {
    setSelectedChannel(channel)
    setIsFormOpen(true)
  }

  // 处理查看渠道详情
  const handleViewChannel = (channel) => {
    setSelectedChannel(channel)
    setIsDetailOpen(true)
  }

  // 处理删除渠道
  const handleDeleteChannel = (channel) => {
    setSelectedChannel(channel)
    setIsDeleteDialogOpen(true)
  }

  // 确认删除渠道
  const confirmDeleteChannel = async () => {
    try {
      await deleteChannel(selectedChannel.id)
      toast({
        title: "删除成功",
        description: `渠道 ${selectedChannel.name} 已成功删除`,
      })
      loadChannels()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast({
        title: "删除失败",
        description: error.message || "无法删除渠道",
        variant: "destructive",
      })
    }
  }

  // 表格列定义
  const columns = [
    {
      header: "渠道名称",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      header: "编码",
      accessorKey: "code",
    },
    {
      header: "联系人",
      accessorKey: "contactName",
    },
    {
      header: "联系电话",
      accessorKey: "contactPhone",
    },
    {
      header: "结算周期",
      accessorKey: "settlementCycle",
      cell: ({ row }) => (
        <div>{row.original.settlementCycle === 1 ? "月结" : "双月结"}</div>
      ),
    },
    {
      header: "状态",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.original.status
        let statusText = "未知"
        let statusClass = "bg-gray-100 text-gray-800"
        
        if (status === "active") {
          statusText = "合作中"
          statusClass = "bg-green-100 text-green-800"
        } else if (status === "paused") {
          statusText = "暂停合作"
          statusClass = "bg-yellow-100 text-yellow-800"
        } else if (status === "terminated") {
          statusText = "终止合作"
          statusClass = "bg-red-100 text-red-800"
        }
        
        return (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {statusText}
          </div>
        )
      },
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
              handleViewChannel(row.original)
            }}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleEditChannel(row.original)
            }}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteChannel(row.original)
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
              <CardTitle>渠道商管理</CardTitle>
              <CardDescription>管理所有渠道商的基本信息</CardDescription>
            </div>
            <Button onClick={handleAddChannel}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加渠道商
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveDataGrid
            data={channels}
            columns={columns}
            searchable={true}
            searchKeys={["name", "code", "contactName", "contactPhone"]}
            loading={isLoading}
            emptyText="暂无渠道数据"
            onRowClick={(channel) => handleViewChannel(channel)}
          />
        </CardContent>
      </Card>

      {/* 渠道表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedChannel ? "编辑渠道" : "添加渠道"}</DialogTitle>
          </DialogHeader>
          <ChannelForm
            channel={selectedChannel}
            onSuccess={() => {
              setIsFormOpen(false)
              loadChannels()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 渠道详情对话框 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>渠道详情</DialogTitle>
          </DialogHeader>
          {selectedChannel && (
            <ChannelDetail
              channelId={selectedChannel.id}
              onEdit={() => {
                setIsDetailOpen(false)
                handleEditChannel(selectedChannel)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="删除渠道"
        description={`确定要删除渠道 "${selectedChannel?.name}" 吗？此操作不可撤销。`}
        onConfirm={confirmDeleteChannel}
      />
    </div>
  )
}
