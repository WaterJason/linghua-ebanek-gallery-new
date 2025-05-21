"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Calendar,
  Users,
  Tag,
  Clock,
  FileText,
  RefreshCw,
  Building,
  MapPin,
  DollarSign,
  Eye
} from "lucide-react"
import { format } from "date-fns"
import { WorkshopOrderForm } from "@/components/workshop-order-form"
import { getWorkshops, deleteWorkshop } from "@/lib/actions/workshop-order-actions"

// 活动类型映射
const activityTypeMap = {
  "jewelry_enameling": { label: "饰品点蓝手作", color: "bg-blue-100 text-blue-800" },
  "cloisonne_enameling": { label: "掐丝珐琅手作", color: "bg-purple-100 text-purple-800" }
};

// 场地类型映射
const locationTypeMap = {
  "in_gallery": { label: "馆内", color: "bg-green-100 text-green-800" },
  "outside": { label: "外出", color: "bg-amber-100 text-amber-800" }
};

// 订单状态映射
const orderStatusMap = {
  "pending": { label: "待确认", color: "bg-yellow-100 text-yellow-800" },
  "confirmed": { label: "已确认", color: "bg-blue-100 text-blue-800" },
  "completed": { label: "已完成", color: "bg-green-100 text-green-800" },
  "cancelled": { label: "已取消", color: "bg-red-100 text-red-800" }
};

// 支付状态映射
const paymentStatusMap = {
  "unpaid": { label: "未支付", color: "bg-red-100 text-red-800" },
  "deposit_paid": { label: "已付定金", color: "bg-yellow-100 text-yellow-800" },
  "fully_paid": { label: "已付全款", color: "bg-green-100 text-green-800" }
};

export function WorkshopOrders() {
  const [workshops, setWorkshops] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingWorkshop, setEditingWorkshop] = useState(null)
  const [activeTab, setActiveTab] = useState("all")
  const [showDetails, setShowDetails] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState(null)

  // 加载团建订单数据
  useEffect(() => {
    loadWorkshops()
  }, [activeTab])

  // 加载团建订单
  async function loadWorkshops() {
    setIsLoading(true)
    try {
      const data = await getWorkshops()
      // 根据状态筛选
      let filteredData = data
      if (activeTab !== "all") {
        filteredData = data.filter(w => w.status === activeTab)
      }
      setWorkshops(filteredData)
    } catch (error) {
      console.error("Error loading workshops:", error)
      toast({
        title: "加载失败",
        description: "无法加载团建订单数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理搜索
  const filteredWorkshops = workshops.filter(workshop =>
    workshop.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (workshop.assistant?.name && workshop.assistant.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // 处理删除
  async function handleDelete(id) {
    if (confirm("确定要删除这个团建订单吗？此操作不可撤销。")) {
      try {
        await deleteWorkshop(id)
        toast({
          title: "删除成功",
          description: "团建订单已成功删除",
        })
        loadWorkshops()
      } catch (error) {
        console.error("Error deleting workshop:", error)
        toast({
          title: "删除失败",
          description: error.message || "无法删除团建订单",
          variant: "destructive",
        })
      }
    }
  }

  // 处理编辑
  function handleEdit(workshop) {
    setEditingWorkshop(workshop)
    setShowForm(true)
  }

  // 查看详情
  function handleViewDetails(workshop) {
    setSelectedWorkshop(workshop)
    setShowDetails(true)
  }

  // 处理表单提交完成
  function handleFormSubmitted() {
    setShowForm(false)
    setEditingWorkshop(null)
    loadWorkshops()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>团建订单管理</CardTitle>
            <Button onClick={() => { setEditingWorkshop(null); setShowForm(true) }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              新建团建订单
            </Button>
          </div>
          <CardDescription>
            管理非遗掐丝珐琅手作沙龙/团建订单，包括饰品点蓝手作、掐丝珐琅手作等特色业务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索客户、地点、讲师..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[500px]">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="pending">待确认</TabsTrigger>
                <TabsTrigger value="confirmed">已确认</TabsTrigger>
                <TabsTrigger value="completed">已完成</TabsTrigger>
                <TabsTrigger value="cancelled">已取消</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" onClick={loadWorkshops}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">加载团建订单数据...</p>
            </div>
          ) : filteredWorkshops.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                {searchTerm ? "没有找到匹配的团建订单" : "暂无团建订单数据"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setEditingWorkshop(null); setShowForm(true) }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                创建第一个团建订单
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单日期</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>活动类型</TableHead>
                    <TableHead>场地</TableHead>
                    <TableHead>讲师</TableHead>
                    <TableHead>参与人数</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkshops.map((workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(workshop.date), "yyyy-MM-dd")}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(workshop.date), "HH:mm")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{workshop.customer?.name || "未知客户"}</TableCell>
                      <TableCell>
                        <Badge className={activityTypeMap[workshop.activityType]?.color || "bg-gray-100"}>
                          {activityTypeMap[workshop.activityType]?.label || workshop.activityType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge className={locationTypeMap[workshop.locationType]?.color || "bg-gray-100"}>
                            {locationTypeMap[workshop.locationType]?.label || workshop.locationType}
                          </Badge>
                          <span className="text-xs mt-1 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {workshop.location}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{workshop.teacher?.name || "未知讲师"}</span>
                          {workshop.assistant && (
                            <span className="text-xs text-muted-foreground">
                              助理: {workshop.assistant.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{workshop.participants} 人</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>¥{workshop.totalAmount.toFixed(2)}</span>
                          <Badge className={paymentStatusMap[workshop.paymentStatus]?.color || "bg-gray-100"}>
                            {paymentStatusMap[workshop.paymentStatus]?.label || workshop.paymentStatus}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={orderStatusMap[workshop.status]?.color || "bg-gray-100"}>
                          {orderStatusMap[workshop.status]?.label || workshop.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(workshop)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(workshop)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(workshop.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新建/编辑团建订单表单 */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <ScrollableDialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingWorkshop ? "编辑团建订单" : "新建团建订单"}</DialogTitle>
            <DialogDescription>
              {editingWorkshop
                ? "修改团建订单的详细信息"
                : "创建新的团建订单，填写活动详细信息"}
            </DialogDescription>
          </DialogHeader>
          <WorkshopOrderForm
            workshop={editingWorkshop}
            onSubmitted={handleFormSubmitted}
          />
        </ScrollableDialogContent>
      </Dialog>

      {/* 查看团建订单详情 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <ScrollableDialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>团建订单详情</DialogTitle>
            <DialogDescription>
              查看团建订单的详细信息
            </DialogDescription>
          </DialogHeader>
          {selectedWorkshop && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">客户信息</h3>
                  <p className="text-lg font-medium">{selectedWorkshop.customer?.name || "未知客户"}</p>
                  {selectedWorkshop.customer?.phone && (
                    <p className="text-sm">电话: {selectedWorkshop.customer.phone}</p>
                  )}
                  {selectedWorkshop.customer?.email && (
                    <p className="text-sm">邮箱: {selectedWorkshop.customer.email}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">订单状态</h3>
                  <div className="flex items-center">
                    <Badge className={orderStatusMap[selectedWorkshop.status]?.color || "bg-gray-100"}>
                      {orderStatusMap[selectedWorkshop.status]?.label || selectedWorkshop.status}
                    </Badge>
                    <Badge className={`ml-2 ${paymentStatusMap[selectedWorkshop.paymentStatus]?.color || "bg-gray-100"}`}>
                      {paymentStatusMap[selectedWorkshop.paymentStatus]?.label || selectedWorkshop.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">活动日期</h3>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{format(new Date(selectedWorkshop.date), "yyyy-MM-dd HH:mm")}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">活动类型</h3>
                  <Badge className={activityTypeMap[selectedWorkshop.activityType]?.color || "bg-gray-100"}>
                    {activityTypeMap[selectedWorkshop.activityType]?.label || selectedWorkshop.activityType}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">活动时长</h3>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{selectedWorkshop.duration} 小时</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">场地类型</h3>
                  <Badge className={locationTypeMap[selectedWorkshop.locationType]?.color || "bg-gray-100"}>
                    {locationTypeMap[selectedWorkshop.locationType]?.label || selectedWorkshop.locationType}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">具体地点</h3>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{selectedWorkshop.location}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">参与人数</h3>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{selectedWorkshop.participants} 人</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">讲师</h3>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{selectedWorkshop.teacher?.name || "未知讲师"}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">助理</h3>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{selectedWorkshop.assistant?.name || "无助理"}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">项目负责人</h3>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{selectedWorkshop.manager?.name || "未指定"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">总金额</h3>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span className="text-lg font-bold">¥{selectedWorkshop.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">定金金额</h3>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>¥{selectedWorkshop.depositAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">支付方式</h3>
                  <span>{selectedWorkshop.paymentMethod || "未指定"}</span>
                </div>
              </div>

              {selectedWorkshop.serviceItems && selectedWorkshop.serviceItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">服务项目</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>项目名称</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>单价</TableHead>
                        <TableHead>小计</TableHead>
                        <TableHead>备注</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedWorkshop.serviceItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product?.name || `项目 ${index + 1}`}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>¥{item.price.toFixed(2)}</TableCell>
                          <TableCell>¥{(item.quantity * item.price).toFixed(2)}</TableCell>
                          <TableCell>{item.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedWorkshop.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">备注</h3>
                  <p className="p-3 bg-muted rounded-md">{selectedWorkshop.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  关闭
                </Button>
                <Button onClick={() => { setShowDetails(false); handleEdit(selectedWorkshop); }}>
                  编辑订单
                </Button>
              </div>
            </div>
          )}
        </ScrollableDialogContent>
      </Dialog>
    </div>
  )
}
