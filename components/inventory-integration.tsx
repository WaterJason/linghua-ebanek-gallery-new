"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { getInventory, getWarehouses, transferInventory } from "@/lib/actions/inventory-actions";
import { getProducts } from "@/lib/actions/product-actions";
import { 
  ArrowRightIcon, 
  PackageIcon, 
  RefreshCwIcon, 
  ShoppingCartIcon,
  TruckIcon,
  ReceiptIcon,
  AlertTriangleIcon,
  CheckIcon,
  XIcon
} from "lucide-react"

// 骨架屏组件
export function InventoryIntegrationSkeleton() {
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

export function InventoryIntegration() {
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryData, setInventoryData] = useState<any[]>([])
  const [warehouseData, setWarehouseData] = useState<any[]>([])
  const [productData, setProductData] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      
      // 加载仓库数据
      const warehouses = await getWarehouses()
      setWarehouseData(warehouses)
      
      // 加载库存数据
      const inventory = await getInventory()
      setInventoryData(inventory)
      
      // 加载产品数据
      const products = await getProducts()
      setProductData(products)
      
      // 模拟加载采购订单数据
      // 实际应该从采购模块获取数据
      setPurchaseOrders([
        {
          id: 1,
          orderNumber: "PO-2023-001",
          supplier: "供应商A",
          status: "pending",
          createdAt: new Date().toISOString(),
          items: [
            { productId: products[0]?.id, quantity: 10 },
            { productId: products[1]?.id, quantity: 5 }
          ]
        },
        {
          id: 2,
          orderNumber: "PO-2023-002",
          supplier: "供应商B",
          status: "received",
          createdAt: new Date().toISOString(),
          items: [
            { productId: products[2]?.id, quantity: 8 }
          ]
        }
      ])
      
      // 模拟加载销售订单数据
      // 实际应该从销售模块获取数据
      setSalesOrders([
        {
          id: 1,
          orderNumber: "SO-2023-001",
          customer: "客户A",
          status: "pending",
          createdAt: new Date().toISOString(),
          items: [
            { productId: products[0]?.id, quantity: 2 },
            { productId: products[1]?.id, quantity: 1 }
          ]
        },
        {
          id: 2,
          orderNumber: "SO-2023-002",
          customer: "客户B",
          status: "shipped",
          createdAt: new Date().toISOString(),
          items: [
            { productId: products[2]?.id, quantity: 3 }
          ]
        }
      ])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "加载失败",
        description: "无法加载数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 获取产品名称
  const getProductName = (productId) => {
    const product = productData.find(p => p.id === Number(productId))
    return product ? product.name : "未知产品"
  }

  // 获取产品当前库存
  const getProductInventory = (productId) => {
    // 汇总所有仓库的库存
    return inventoryData
      .filter(item => item.productId === Number(productId))
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  // 处理采购入库
  const handleReceivePurchase = async (order) => {
    try {
      setIsProcessing(true)
      
      // 获取默认仓库（实际应该让用户选择）
      const defaultWarehouse = warehouseData[0]
      
      if (!defaultWarehouse) {
        toast({
          title: "操作失败",
          description: "没有可用的仓库",
          variant: "destructive",
        })
        return
      }
      
      // 记录操作开始
      console.log(`开始处理采购入库: 订单[${order.orderNumber}]`)
      
      // 模拟入库操作
      // 实际应该调用库存入库API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 更新订单状态
      const updatedOrders = purchaseOrders.map(po => {
        if (po.id === order.id) {
          return { ...po, status: "received" }
        }
        return po
      })
      
      setPurchaseOrders(updatedOrders)
      
      // 显示成功提示
      toast({
        title: "入库成功",
        description: `采购订单 ${order.orderNumber} 已成功入库`,
      })
      
      // 重新加载数据
      await loadData()
    } catch (error) {
      console.error("采购入库失败:", error)
      toast({
        title: "入库失败",
        description: error.message || "无法完成采购入库",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 处理销售出库
  const handleShipSalesOrder = async (order) => {
    try {
      setIsProcessing(true)
      
      // 获取默认仓库（实际应该让用户选择）
      const defaultWarehouse = warehouseData[0]
      
      if (!defaultWarehouse) {
        toast({
          title: "操作失败",
          description: "没有可用的仓库",
          variant: "destructive",
        })
        return
      }
      
      // 检查库存是否足够
      for (const item of order.items) {
        const inventory = getProductInventory(item.productId)
        if (inventory < item.quantity) {
          toast({
            title: "库存不足",
            description: `产品 ${getProductName(item.productId)} 库存不足，无法完成出库`,
            variant: "destructive",
          })
          return
        }
      }
      
      // 记录操作开始
      console.log(`开始处理销售出库: 订单[${order.orderNumber}]`)
      
      // 模拟出库操作
      // 实际应该调用库存出库API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 更新订单状态
      const updatedOrders = salesOrders.map(so => {
        if (so.id === order.id) {
          return { ...so, status: "shipped" }
        }
        return so
      })
      
      setSalesOrders(updatedOrders)
      
      // 显示成功提示
      toast({
        title: "出库成功",
        description: `销售订单 ${order.orderNumber} 已成功出库`,
      })
      
      // 重新加载数据
      await loadData()
    } catch (error) {
      console.error("销售出库失败:", error)
      toast({
        title: "出库失败",
        description: error.message || "无法完成销售出库",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 获取订单状态标签
  const getOrderStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><AlertTriangleIcon className="h-3 w-3" />待处理</Badge>
      case "received":
        return <Badge variant="success" className="flex items-center gap-1"><CheckIcon className="h-3 w-3" />已入库</Badge>
      case "shipped":
        return <Badge variant="success" className="flex items-center gap-1"><CheckIcon className="h-3 w-3" />已出库</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return <InventoryIntegrationSkeleton />
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchase">采购入库</TabsTrigger>
          <TabsTrigger value="sales">销售出库</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>采购入库</CardTitle>
                  <CardDescription>处理采购订单入库</CardDescription>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>将采购订单中的产品入库，自动更新库存数量。</p>
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={loadData}>
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {purchaseOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <ShoppingCartIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">没有待处理的采购订单</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单编号</TableHead>
                      <TableHead>供应商</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>产品</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.supplier}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                {getProductName(item.productId)} x {item.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {order.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReceivePurchase(order)}
                              disabled={isProcessing}
                            >
                              <TruckIcon className="h-3 w-3 mr-1" />
                              入库
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>销售出库</CardTitle>
                  <CardDescription>处理销售订单出库</CardDescription>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>将销售订单中的产品出库，自动更新库存数量。</p>
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={loadData}>
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {salesOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <ReceiptIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">没有待处理的销售订单</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单编号</TableHead>
                      <TableHead>客户</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>产品</TableHead>
                      <TableHead>库存状态</TableHead>
                      <TableHead>订单状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                {getProductName(item.productId)} x {item.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.items.every(item => getProductInventory(item.productId) >= item.quantity) ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              库存充足
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              库存不足
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {order.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShipSalesOrder(order)}
                              disabled={isProcessing || !order.items.every(item => getProductInventory(item.productId) >= item.quantity)}
                            >
                              <ArrowRightIcon className="h-3 w-3 mr-1" />
                              出库
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
