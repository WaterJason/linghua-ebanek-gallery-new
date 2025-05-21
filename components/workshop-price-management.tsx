"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from "lucide-react"
import { getProducts } from "@/lib/actions/product-actions";
import { getChannels } from "@/lib/actions/channel-actions";
import { getWorkshopPrices, createWorkshopPrice, updateWorkshopPrice, deleteWorkshopPrice, getWorkshopActivities } from "@/lib/actions/workshop-actions";
import { toast } from "@/components/ui/use-toast"

export function WorkshopPriceManagement() {
  const [prices, setPrices] = useState([])
  const [filteredPrices, setFilteredPrices] = useState([])
  const [activities, setActivities] = useState([])
  const [channels, setChannels] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("all")
  const [selectedActivity, setSelectedActivity] = useState("all")

  useEffect(() => {
    loadData()
  }, [selectedChannel, selectedActivity])

  useEffect(() => {
    filterPrices()
  }, [prices, searchQuery])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [activitiesData, channelsData, pricesData] = await Promise.all([
        getWorkshopActivities(),
        getChannels(),
        getWorkshopPrices(
          selectedChannel !== "all" ? selectedChannel : undefined,
          selectedActivity !== "all" ? selectedActivity : undefined
        )
      ])

      setActivities(activitiesData)
      setChannels(channelsData.filter(channel => channel.isActive))
      setPrices(pricesData)
      setFilteredPrices(pricesData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "加载失败",
        description: error.message || "无法加载团建价格数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterPrices = () => {
    let filtered = [...prices]

    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(price =>
        (price.activity?.name?.toLowerCase().includes(query) || false) ||
        price.channel.name.toLowerCase().includes(query)
      )
    }

    setFilteredPrices(filtered)
  }

  const handleAddPrice = () => {
    setEditingPrice({
      id: 0,
      activityId: "",
      channelId: "",
      basePrice: 0,
      minParticipants: 5,
      maxParticipants: 30,
      pricePerPerson: 0,
      materialFee: 0,
      teacherFee: 0,
      assistantFee: 0,
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const handleEditPrice = (price) => {
    setEditingPrice({
      ...price,
      activityId: price.activityId ? price.activityId.toString() : "",
      channelId: price.channelId.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDeletePrice = async (id) => {
    if (!confirm("确定要删除这个价格配置吗？")) return

    try {
      await deleteWorkshopPrice(id)
      setPrices(prices.filter(p => p.id !== id))
      toast({
        title: "删除成功",
        description: "团建价格配置已删除",
      })
    } catch (error) {
      console.error("Error deleting price:", error)
      toast({
        title: "删除失败",
        description: error.message || "删除团建价格配置时出错",
        variant: "destructive",
      })
    }
  }

  const handleSavePrice = async () => {
    if (!editingPrice.channelId ||
        editingPrice.basePrice === "" || editingPrice.pricePerPerson === "") {
      toast({
        title: "验证失败",
        description: "渠道、基础价格和人均价格为必填项",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const priceData = {
        ...editingPrice,
        activityId: editingPrice.activityId ? parseInt(editingPrice.activityId) : null,
        channelId: parseInt(editingPrice.channelId),
        basePrice: parseFloat(editingPrice.basePrice),
        pricePerPerson: parseFloat(editingPrice.pricePerPerson),
        materialFee: parseFloat(editingPrice.materialFee || 0),
        teacherFee: parseFloat(editingPrice.teacherFee || 0),
        assistantFee: parseFloat(editingPrice.assistantFee || 0),
        minParticipants: parseInt(editingPrice.minParticipants || 1),
        maxParticipants: parseInt(editingPrice.maxParticipants || 100),
      }

      if (editingPrice.id === 0) {
        // 创建新价格
        const newPrice = await createWorkshopPrice(priceData)
        setPrices([...prices, newPrice])
        toast({
          title: "添加成功",
          description: "团建价格配置已添加",
        })
      } else {
        // 更新现有价格
        const updatedPrice = await updateWorkshopPrice(editingPrice.id, priceData)
        setPrices(prices.map(p => (p.id === updatedPrice.id ? updatedPrice : p)))
        toast({
          title: "更新成功",
          description: "团建价格配置已更新",
        })
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving price:", error)
      toast({
        title: "保存失败",
        description: error.message || "保存团建价格配置时出错",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>团建价格管理</CardTitle>
              <CardDescription>管理不同渠道和产品的团建价格配置</CardDescription>
            </div>
            <Button onClick={handleAddPrice}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加价格配置
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
                <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择团建活动" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有团建活动</SelectItem>
                    {activities.map((activity) => (
                      <SelectItem key={activity.id} value={activity.id.toString()}>
                        {activity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-64">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索产品或渠道..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : filteredPrices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || selectedChannel !== "all" || selectedProduct !== "all"
                ? "没有找到匹配的价格配置"
                : "暂无团建价格配置数据"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>团建活动</TableHead>
                  <TableHead>渠道</TableHead>
                  <TableHead className="text-right">基础价格</TableHead>
                  <TableHead className="text-right">人均价格</TableHead>
                  <TableHead className="text-right">人数范围</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrices.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell className="font-medium">
                      {price.activity ? price.activity.name : "自定义价格"}
                    </TableCell>
                    <TableCell>{price.channel.name}</TableCell>
                    <TableCell className="text-right">¥{price.basePrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">¥{price.pricePerPerson.toFixed(2)}/人</TableCell>
                    <TableCell className="text-right">{price.minParticipants}-{price.maxParticipants}人</TableCell>
                    <TableCell>
                      <Badge variant={price.isActive ? "default" : "secondary"}>
                        {price.isActive ? "启用" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPrice(price)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePrice(price.id)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 价格编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingPrice?.id === 0 ? "添加价格配置" : "编辑价格配置"}</DialogTitle>
            <DialogDescription>
              {editingPrice?.id === 0 ? "添加新的团建价格配置" : "编辑现有团建价格配置"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activity" className="text-right">
                团建活动
              </Label>
              <Select
                value={editingPrice?.activityId || ""}
                onValueChange={(value) => setEditingPrice({ ...editingPrice, activityId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择团建活动（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">自定义价格</SelectItem>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id.toString()}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="channel" className="text-right">
                渠道 *
              </Label>
              <Select
                value={editingPrice?.channelId || ""}
                onValueChange={(value) => setEditingPrice({ ...editingPrice, channelId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择渠道" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id.toString()}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="basePrice" className="text-right">
                基础价格 *
              </Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={editingPrice?.basePrice || ""}
                onChange={(e) => setEditingPrice({ ...editingPrice, basePrice: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pricePerPerson" className="text-right">
                人均价格 *
              </Label>
              <Input
                id="pricePerPerson"
                type="number"
                step="0.01"
                min="0"
                value={editingPrice?.pricePerPerson || ""}
                onChange={(e) => setEditingPrice({ ...editingPrice, pricePerPerson: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="participantRange" className="text-right">
                人数范围
              </Label>
              <div className="col-span-3 flex gap-2 items-center">
                <Input
                  id="minParticipants"
                  type="number"
                  min="1"
                  value={editingPrice?.minParticipants || ""}
                  onChange={(e) => setEditingPrice({ ...editingPrice, minParticipants: e.target.value })}
                  className="w-24"
                />
                <span>至</span>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={editingPrice?.maxParticipants || ""}
                  onChange={(e) => setEditingPrice({ ...editingPrice, maxParticipants: e.target.value })}
                  className="w-24"
                />
                <span>人</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="materialFee" className="text-right">
                材料费
              </Label>
              <Input
                id="materialFee"
                type="number"
                step="0.01"
                min="0"
                value={editingPrice?.materialFee || ""}
                onChange={(e) => setEditingPrice({ ...editingPrice, materialFee: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacherFee" className="text-right">
                讲师费
              </Label>
              <Input
                id="teacherFee"
                type="number"
                step="0.01"
                min="0"
                value={editingPrice?.teacherFee || ""}
                onChange={(e) => setEditingPrice({ ...editingPrice, teacherFee: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assistantFee" className="text-right">
                助教费
              </Label>
              <Input
                id="assistantFee"
                type="number"
                step="0.01"
                min="0"
                value={editingPrice?.assistantFee || ""}
                onChange={(e) => setEditingPrice({ ...editingPrice, assistantFee: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                状态
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="isActive"
                  checked={editingPrice?.isActive}
                  onCheckedChange={(checked) => setEditingPrice({ ...editingPrice, isActive: checked })}
                />
                <Label htmlFor="isActive">{editingPrice?.isActive ? "启用" : "禁用"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleSavePrice} disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
