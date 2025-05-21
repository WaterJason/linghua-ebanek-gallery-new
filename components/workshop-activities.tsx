"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Calendar,
  Users,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
  Palette,
  MapPin,
  Home,
  Building
} from "lucide-react"
import { format } from "date-fns"
import { WorkshopActivityForm } from "@/components/workshop-activity-form"
import { getWorkshopActivities, deleteWorkshopActivity } from "@/lib/actions/workshop-actions"

// 活动类型映射
const activityTypeMap = {
  "jewelry_enameling": { label: "饰品点蓝手作", icon: <Tag className="h-4 w-4 mr-1" /> },
  "cloisonne_enameling": { label: "掐丝珐琅手作", icon: <Palette className="h-4 w-4 mr-1" /> }
};

// 场地类型映射
const locationTypeMap = {
  "in_gallery": { label: "馆内", icon: <Home className="h-4 w-4 mr-1" /> },
  "outside": { label: "外出", icon: <Building className="h-4 w-4 mr-1" /> }
};

// 底胎类型映射
const baseTypeMap = {
  "jewelry": { label: "饰品", color: "bg-blue-100 text-blue-800" },
  "coaster_bookmark": { label: "杯垫/书签", color: "bg-green-100 text-green-800" },
  "painting": { label: "摆画", color: "bg-purple-100 text-purple-800" },
  "ornament": { label: "摆件", color: "bg-amber-100 text-amber-800" }
};

// 从描述中提取额外信息
function extractExtraInfo(description) {
  if (!description) return {};

  try {
    // 尝试从描述中提取JSON格式的额外信息
    const extraInfoMatch = description.match(/\{EXTRA_INFO:(.*?)\}/);
    if (extraInfoMatch && extraInfoMatch[1]) {
      return JSON.parse(extraInfoMatch[1]);
    }
  } catch (e) {
    console.error("解析额外信息失败:", e);
  }

  return {};
}

export function WorkshopActivities() {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [activeTab, setActiveTab] = useState("active")
  const [activityTypeFilter, setActivityTypeFilter] = useState("all")
  const [locationTypeFilter, setLocationTypeFilter] = useState("all")

  // 加载团建活动数据
  useEffect(() => {
    loadActivities()
  }, [activeTab])

  // 加载团建活动
  async function loadActivities() {
    setIsLoading(true)
    try {
      const data = await getWorkshopActivities()
      // 根据活动状态筛选
      const filteredData = activeTab === "active"
        ? data.filter(a => a.isActive)
        : data.filter(a => !a.isActive)
      setActivities(filteredData)
    } catch (error) {
      console.error("Error loading workshop activities:", error)
      toast({
        title: "加载失败",
        description: "无法加载团建活动数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理搜索和筛选
  const filteredActivities = activities.filter(activity => {
    // 提取额外信息
    const extraInfo = extractExtraInfo(activity.description);

    // 搜索条件
    const matchesSearch =
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.product?.name.toLowerCase().includes(searchTerm.toLowerCase());

    // 活动类型筛选
    const matchesActivityType =
      activityTypeFilter === "all" ||
      extraInfo.activityType === activityTypeFilter;

    // 场地类型筛选
    const matchesLocationType =
      locationTypeFilter === "all" ||
      extraInfo.locationType === locationTypeFilter;

    return matchesSearch && matchesActivityType && matchesLocationType;
  })

  // 处理删除
  async function handleDelete(id) {
    if (confirm("确定要删除这个团建活动吗？此操作不可撤销。")) {
      try {
        await deleteWorkshopActivity(id)
        toast({
          title: "删除成功",
          description: "团建活动已成功删除",
        })
        loadActivities()
      } catch (error) {
        console.error("Error deleting workshop activity:", error)
        toast({
          title: "删除失败",
          description: error.message || "无法删除团建活动",
          variant: "destructive",
        })
      }
    }
  }

  // 处理编辑
  function handleEdit(activity) {
    setEditingActivity(activity)
    setShowForm(true)
  }

  // 处理表单提交完成
  function handleFormSubmitted() {
    setShowForm(false)
    setEditingActivity(null)
    loadActivities()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>团建活动管理</CardTitle>
            <Button onClick={() => { setEditingActivity(null); setShowForm(true) }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              新建团建活动
            </Button>
          </div>
          <CardDescription>
            管理团建活动信息，包括活动名称、价格、参与人数等
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="flex justify-between items-center">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索活动名称..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active">启用中</TabsTrigger>
                  <TabsTrigger value="inactive">已停用</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="icon" onClick={loadActivities}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">活动类型:</span>
              </div>
              <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择活动类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="jewelry_enameling">
                    <div className="flex items-center">
                      {activityTypeMap.jewelry_enameling.icon}
                      <span>{activityTypeMap.jewelry_enameling.label}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cloisonne_enameling">
                    <div className="flex items-center">
                      {activityTypeMap.cloisonne_enameling.icon}
                      <span>{activityTypeMap.cloisonne_enameling.label}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">场地类型:</span>
              </div>
              <Select value={locationTypeFilter} onValueChange={setLocationTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择场地类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部场地</SelectItem>
                  <SelectItem value="in_gallery">
                    <div className="flex items-center">
                      {locationTypeMap.in_gallery.icon}
                      <span>{locationTypeMap.in_gallery.label}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="outside">
                    <div className="flex items-center">
                      {locationTypeMap.outside.icon}
                      <span>{locationTypeMap.outside.label}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">加载团建活动数据...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                {searchTerm ? "没有找到匹配的团建活动" : "暂无团建活动数据"}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setEditingActivity(null); setShowForm(true) }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                创建第一个团建活动
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>活动名称</TableHead>
                    <TableHead>活动类型</TableHead>
                    <TableHead>场地类型</TableHead>
                    <TableHead>底胎类型</TableHead>
                    <TableHead>关联产品</TableHead>
                    <TableHead>参与人数</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>成本</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => {
                    // 提取额外信息
                    const extraInfo = extractExtraInfo(activity.description);
                    const activityType = extraInfo.activityType || "jewelry_enameling";
                    const locationType = extraInfo.locationType || "in_gallery";
                    const baseType = extraInfo.baseType || "jewelry";
                    const toolsFee = extraInfo.toolsFee || 0;

                    // 计算总成本
                    const totalCost = (
                      parseFloat(activity.materialFee || 0) +
                      parseFloat(toolsFee || 0) +
                      parseFloat(activity.teacherFee || 0) +
                      parseFloat(activity.assistantFee || 0)
                    );

                    // 计算利润
                    const profit = parseFloat(activity.price || 0) - totalCost;
                    const profitClass = profit < 0 ? "text-red-500" : "text-green-500";

                    return (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {activityTypeMap[activityType]?.icon}
                            <span>{activityTypeMap[activityType]?.label || "未知类型"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {locationTypeMap[locationType]?.icon}
                            <span>{locationTypeMap[locationType]?.label || "未知场地"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={baseTypeMap[baseType]?.color || "bg-gray-100 text-gray-800"}>
                            {baseTypeMap[baseType]?.label || "未知底胎"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {activity.product?.imageUrl && (
                              <img
                                src={activity.product.imageUrl}
                                alt={activity.product.name}
                                className="h-8 w-8 mr-2 rounded-md object-cover"
                              />
                            )}
                            <span>{activity.product?.name || "未关联产品"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{activity.minParticipants}-{activity.maxParticipants} 人</TableCell>
                        <TableCell>¥{activity.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">总成本: ¥{totalCost.toFixed(2)}</span>
                            <span className={`text-xs ${profitClass}`}>
                              利润: ¥{profit.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(activity)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(activity.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "编辑团建活动" : "新建团建活动"}</DialogTitle>
            <DialogDescription>
              {editingActivity
                ? "修改团建活动的详细信息"
                : "创建新的团建活动，填写活动详细信息"}
            </DialogDescription>
          </DialogHeader>
          <WorkshopActivityForm
            activity={editingActivity}
            onSubmitted={handleFormSubmitted}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
