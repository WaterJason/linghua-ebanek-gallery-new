"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getInventory, getWarehouses, updateInventory } from "@/lib/api/inventory-api";
import { toast } from "@/components/ui/use-toast"
import { AlertTriangleIcon, ArrowUpIcon, PackageIcon, RefreshCwIcon } from "lucide-react"

// 骨架屏组件
export function InventoryAlertsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function InventoryAlerts() {
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryData, setInventoryData] = useState<any[]>([])
  const [warehouseData, setWarehouseData] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([])
  const [minQuantityThreshold, setMinQuantityThreshold] = useState(10)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const warehouses = await getWarehouses()
      setWarehouseData(warehouses)

      const inventory = await getInventory()
      setInventoryData(inventory)

      processAlertData(inventory)
    } catch (error) {
      console.error("Error loading inventory data:", error)
      toast({
        title: "加载失败",
        description: "无法加载库存数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理预警数据
  const processAlertData = (inventory) => {
    // 低库存商品
    const lowStock = inventory.filter(item => {
      const minQuantity = item.minQuantity || minQuantityThreshold
      return item.quantity > 0 && item.quantity <= minQuantity
    })

    // 缺货商品
    const outOfStock = inventory.filter(item => item.quantity === 0)

    setLowStockItems(lowStock)
    setOutOfStockItems(outOfStock)
  }

  // 更新最小库存阈值
  const updateThreshold = () => {
    processAlertData(inventoryData)
    toast({
      title: "已更新",
      description: `最小库存阈值已更新为 ${minQuantityThreshold}`,
    })
  }

  // 更新商品最小库存量
  const updateMinQuantity = async (itemId, minQuantity) => {
    try {
      setIsUpdating(true)

      const item = inventoryData.find(i => i.id === itemId)
      if (!item) return

      await updateInventory(itemId, {
        minQuantity: minQuantity,
        notes: "更新最小库存量"
      })

      toast({
        title: "更新成功",
        description: "最小库存量已更新",
      })

      // 重新加载数据
      await loadData()
    } catch (error) {
      console.error("Error updating min quantity:", error)
      toast({
        title: "更新失败",
        description: error.message || "无法更新最小库存量",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // 获取仓库名称
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouseData.find(w => w.id === warehouseId)
    return warehouse ? warehouse.name : "未知仓库"
  }

  if (isLoading) {
    return <InventoryAlertsSkeleton />
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="low-stock" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="low-stock">低库存预警</TabsTrigger>
          <TabsTrigger value="out-of-stock">缺货商品</TabsTrigger>
        </TabsList>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>低库存预警</CardTitle>
                  <CardDescription>库存低于最小库存量的商品</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="minQuantity">最小库存阈值:</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    value={minQuantityThreshold}
                    onChange={(e) => setMinQuantityThreshold(Number(e.target.value))}
                    className="w-20"
                    min={1}
                  />
                  <Button variant="outline" size="sm" onClick={updateThreshold}>
                    应用
                  </Button>
                  <Button variant="outline" size="icon" onClick={loadData}>
                    <RefreshCwIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <PackageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">没有低库存商品</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead>仓库</TableHead>
                      <TableHead>当前库存</TableHead>
                      <TableHead>最小库存</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.minQuantity || minQuantityThreshold}</TableCell>
                        <TableCell>
                          <Badge variant="warning" className="flex items-center gap-1">
                            <AlertTriangleIcon className="h-3 w-3" />
                            低库存
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateMinQuantity(item.id, (item.minQuantity || minQuantityThreshold) - 5)}
                              disabled={isUpdating}
                            >
                              降低阈值
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                共 {lowStockItems.length} 个低库存商品
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="out-of-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>缺货商品</CardTitle>
                  <CardDescription>库存为零的商品</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={loadData}>
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {outOfStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <PackageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">没有缺货商品</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead>仓库</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>最小库存</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outOfStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangleIcon className="h-3 w-3" />
                            缺货
                          </Badge>
                        </TableCell>
                        <TableCell>{item.minQuantity || minQuantityThreshold}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // 跳转到采购页面
                              window.location.href = "/purchase/new"
                            }}
                          >
                            <ArrowUpIcon className="h-3 w-3 mr-1" />
                            采购
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                共 {outOfStockItems.length} 个缺货商品
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
