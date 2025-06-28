"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Package,
  Warehouse,
  TrendingUp,
  Clock,
  Database,
  Zap
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface PurchaseOrderItem {
  id: number
  productId?: number
  productName?: string
  product?: {
    id: number
    name: string
    sku?: string
  }
  quantity: number
  price: number
  receivedQuantity: number
}

interface PurchaseOrder {
  id: number
  orderNumber: string
  supplier: {
    id: number
    name: string
  }
  status: string
  items: PurchaseOrderItem[]
}

interface Warehouse {
  id: number
  name: string
  location?: string
}

interface SyncStatus {
  purchaseOrderId: number
  orderNumber: string
  orderStatus: string
  isSynced: boolean
  totalItems: number
  receivedItems: number
  syncedTransactions: number
  items: Array<{
    id: number
    productName: string
    orderedQuantity: number
    receivedQuantity: number
    isReceived: boolean
    price: number
  }>
  transactions: Array<{
    id: number
    type: string
    quantity: number
    notes: string
    createdAt: string
    product: {
      name: string
    }
    targetWarehouse: {
      name: string
    }
  }>
}

interface InventorySyncPanelProps {
  purchaseOrder: PurchaseOrder
  warehouses: Warehouse[]
  onSyncComplete?: (result: any) => void
}

export function InventorySyncPanel({
  purchaseOrder,
  warehouses,
  onSyncComplete
}: InventorySyncPanelProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("")
  const [syncType, setSyncType] = useState<"auto" | "manual">("auto")
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)

  // 获取同步状态
  useEffect(() => {
    const fetchSyncStatus = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}/inventory-sync`)
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setSyncStatus(result.data)
          }
        }
      } catch (error) {
        console.error("获取同步状态失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (purchaseOrder.id) {
      fetchSyncStatus()
    }
  }, [purchaseOrder.id])

  // 检查是否可以同步
  const canSync = () => {
    return purchaseOrder.status === "received" || 
           purchaseOrder.status === "partial_received"
  }

  // 计算同步统计
  const getSyncStats = () => {
    if (!syncStatus) return null

    const totalReceived = syncStatus.items.reduce((sum, item) => sum + item.receivedQuantity, 0)
    const totalOrdered = syncStatus.items.reduce((sum, item) => sum + item.orderedQuantity, 0)
    const receivedItems = syncStatus.items.filter(item => item.isReceived).length
    const completionRate = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0

    return {
      totalReceived,
      totalOrdered,
      receivedItems,
      totalItems: syncStatus.items.length,
      completionRate,
      transactionCount: syncStatus.syncedTransactions
    }
  }

  // 执行库存同步
  const handleSync = async () => {
    if (!selectedWarehouseId) {
      toast({
        title: "错误",
        description: "请选择目标仓库",
        variant: "destructive"
      })
      return
    }

    setIsSyncing(true)
    setSyncProgress(0)

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}/inventory-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          warehouseId: Number(selectedWarehouseId),
          syncType
        })
      })

      clearInterval(progressInterval)
      setSyncProgress(100)

      if (!response.ok) {
        throw new Error("库存同步失败")
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "同步成功",
          description: result.message
        })
        
        // 重新获取同步状态
        const statusResponse = await fetch(`/api/purchase-orders/${purchaseOrder.id}/inventory-sync`)
        if (statusResponse.ok) {
          const statusResult = await statusResponse.json()
          if (statusResult.success) {
            setSyncStatus(statusResult.data)
          }
        }
        
        onSyncComplete?.(result)
      } else {
        throw new Error(result.error || "库存同步失败")
      }

    } catch (error) {
      console.error("库存同步失败:", error)
      toast({
        title: "同步失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
      setSyncProgress(0)
    }
  }

  const stats = getSyncStats()
  const selectedWarehouse = warehouses.find(w => w.id.toString() === selectedWarehouseId)

  return (
    <div className="space-y-6">
      {/* 同步状态概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            库存同步状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>加载同步状态...</span>
            </div>
          ) : syncStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={syncStatus.isSynced ? "default" : "secondary"}>
                      {syncStatus.isSynced ? "已同步" : "未同步"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      订单号: {syncStatus.orderNumber}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    状态: {syncStatus.orderStatus}
                  </p>
                </div>
                {syncStatus.isSynced && (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
              </div>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats.receivedItems}</div>
                    <div className="text-sm text-muted-foreground">已收货项目</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats.totalReceived}</div>
                    <div className="text-sm text-muted-foreground">收货总量</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">完成率</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats.transactionCount}</div>
                    <div className="text-sm text-muted-foreground">库存事务</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                无法获取同步状态信息
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 同步操作 */}
      {canSync() && !syncStatus?.isSynced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              执行库存同步
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                库存同步将把已收货的商品数量更新到库存系统中，请确认操作无误后执行。
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="warehouse">目标仓库 *</Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择目标仓库" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4" />
                          {warehouse.name}
                          {warehouse.location && (
                            <span className="text-muted-foreground">
                              ({warehouse.location})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="syncType">同步模式</Label>
                <Select value={syncType} onValueChange={(value: "auto" | "manual") => setSyncType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        自动同步
                      </div>
                    </SelectItem>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        手动同步
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isSyncing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>同步进度</span>
                  <span>{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} className="w-full" />
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={handleSync}
                disabled={isSyncing || !selectedWarehouseId}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "同步中..." : "开始同步"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 同步明细 */}
      {syncStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              同步明细
            </CardTitle>
          </CardHeader>
          <CardContent>
            {syncStatus.items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                暂无同步明细
              </p>
            ) : (
              <div className="space-y-4">
                {/* 商品明细 */}
                <div>
                  <h4 className="font-medium mb-2">商品明细</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">商品名称</th>
                          <th className="text-center p-3">订单数量</th>
                          <th className="text-center p-3">收货数量</th>
                          <th className="text-center p-3">状态</th>
                          <th className="text-right p-3">单价</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncStatus.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-3 font-medium">{item.productName}</td>
                            <td className="p-3 text-center">{item.orderedQuantity}</td>
                            <td className="p-3 text-center">{item.receivedQuantity}</td>
                            <td className="p-3 text-center">
                              <Badge variant={item.isReceived ? "default" : "secondary"}>
                                {item.isReceived ? "已收货" : "未收货"}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">¥{item.price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 库存事务记录 */}
                {syncStatus.transactions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">库存事务记录</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {syncStatus.transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="font-medium">{transaction.product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.targetWarehouse.name} · {transaction.notes}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">+{transaction.quantity}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(transaction.createdAt), "MM-dd HH:mm", { locale: zhCN })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
