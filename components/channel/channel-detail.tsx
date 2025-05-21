"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EditIcon } from "lucide-react"
import { getChannel, getChannelDepositBalance } from "@/lib/actions/channel-actions"

export function ChannelDetail({ channelId, onEdit }) {
  const { toast } = useToast()
  const [channel, setChannel] = useState(null)
  const [depositBalance, setDepositBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("basic")

  // 加载渠道详情
  useEffect(() => {
    const loadChannelDetail = async () => {
      try {
        setIsLoading(true)
        const channelData = await getChannel(channelId)
        setChannel(channelData)
        
        // 加载押金余额
        const depositData = await getChannelDepositBalance(channelId)
        setDepositBalance(depositData.balance)
      } catch (error) {
        toast({
          title: "加载失败",
          description: error.message || "无法加载渠道详情",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    if (channelId) {
      loadChannelDetail()
    }
  }, [channelId, toast])

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  // 渲染渠道详情
  if (!channel) {
    return <div>未找到渠道信息</div>
  }

  // 获取合作状态文本和样式
  const getStatusInfo = (status) => {
    switch (status) {
      case "active":
        return { text: "合作中", className: "text-green-600" }
      case "paused":
        return { text: "暂停合作", className: "text-yellow-600" }
      case "terminated":
        return { text: "终止合作", className: "text-red-600" }
      default:
        return { text: "未知", className: "text-gray-600" }
    }
  }

  const statusInfo = getStatusInfo(channel.status)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{channel.name}</h2>
          <p className="text-muted-foreground">编码: {channel.code}</p>
        </div>
        <Button variant="outline" onClick={onEdit}>
          <EditIcon className="mr-2 h-4 w-4" />
          编辑
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="stats">统计信息</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>联系信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">联系人</p>
                <p className="text-sm text-muted-foreground">{channel.contactName || "未设置"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">联系电话</p>
                <p className="text-sm text-muted-foreground">{channel.contactPhone || "未设置"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">联系邮箱</p>
                <p className="text-sm text-muted-foreground">{channel.contactEmail || "未设置"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">联系地址</p>
                <p className="text-sm text-muted-foreground">{channel.address || "未设置"}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>结算信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">开户银行</p>
                <p className="text-sm text-muted-foreground">{channel.bankName || "未设置"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">银行账号</p>
                <p className="text-sm text-muted-foreground">{channel.bankAccount || "未设置"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">结算周期</p>
                <p className="text-sm text-muted-foreground">
                  {channel.settlementCycle === 1 ? "月结" : "双月结"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">当前押金余额</p>
                <p className="text-sm font-medium text-primary">¥ {depositBalance.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>合作信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">合作开始日期</p>
                <p className="text-sm text-muted-foreground">
                  {channel.cooperationStart 
                    ? format(new Date(channel.cooperationStart), "yyyy-MM-dd")
                    : "未设置"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">合作状态</p>
                <p className={`text-sm font-medium ${statusInfo.className}`}>
                  {statusInfo.text}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium">描述</p>
                <p className="text-sm text-muted-foreground">{channel.description || "无"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>数据统计</CardTitle>
              <CardDescription>渠道相关数据统计</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">产品数量</p>
                <p className="text-2xl font-bold">{channel._count?.inventory || 0}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">价格设置</p>
                <p className="text-2xl font-bold">{channel._count?.prices || 0}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">押金记录</p>
                <p className="text-2xl font-bold">{channel._count?.deposits || 0}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">销售记录</p>
                <p className="text-2xl font-bold">{channel._count?.sales || 0}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
