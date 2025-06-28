"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FilterIcon,
  DownloadIcon,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getSalesOrders } from "@/lib/actions/sales-actions"
import { useRouter } from "next/navigation"

export function CustomWorkManagement() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("orders")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [customWorks, setCustomWorks] = useState([])

  useEffect(() => {
    loadCustomWorks()
  }, [])

  const loadCustomWorks = async () => {
    setIsLoading(true)
    try {
      // 获取定制作品订单数据
      const data = await getSalesOrders()
      // 过滤出定制作品订单
      const customOrders = data.filter((order: any) => order.type === "custom")
      setCustomWorks(customOrders)
    } catch (error) {
      console.error("Error loading custom works:", error)
      toast({
        title: "加载失败",
        description: "无法加载定制作品数据，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      "设计中": "secondary",
      "制作中": "default",
      "已完成": "success",
      "已取消": "destructive"
    }
    return <Badge variant={statusMap[status] || "secondary"}>{status}</Badge>
  }

  const filteredCustomWorks = customWorks.filter(work =>
    work.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">定制作品管理</h2>
          <p className="text-muted-foreground">管理定制作品订单和制作进度</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/sales/custom-works/new")}>
            <PlusIcon className="h-4 w-4 mr-2" />
            新建定制订单
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索定制作品..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline">
          <FilterIcon className="h-4 w-4 mr-2" />
          筛选
        </Button>
        <Button variant="outline">
          <DownloadIcon className="h-4 w-4 mr-2" />
          导出
        </Button>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="orders">定制订单</TabsTrigger>
          <TabsTrigger value="progress">制作进度</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>定制订单列表</CardTitle>
              <CardDescription>查看和管理所有定制作品订单</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">加载中...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单号</TableHead>
                      <TableHead>客户</TableHead>
                      <TableHead>产品</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>下单日期</TableHead>
                      <TableHead>交付日期</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomWorks.map((work) => (
                      <TableRow key={work.id}>
                        <TableCell className="font-medium">{work.orderNumber}</TableCell>
                        <TableCell>{work.customerName}</TableCell>
                        <TableCell>{work.productName}</TableCell>
                        <TableCell>{getStatusBadge(work.status)}</TableCell>
                        <TableCell>{work.orderDate}</TableCell>
                        <TableCell>{work.deliveryDate}</TableCell>
                        <TableCell>¥{work.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                查看详情
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <PencilIcon className="mr-2 h-4 w-4" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <TrashIcon className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>制作进度</CardTitle>
              <CardDescription>跟踪定制作品的制作进度</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                制作进度功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>已完成订单</CardTitle>
              <CardDescription>查看已完成的定制作品订单</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                已完成订单功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
