"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Warehouse,
  ClipboardCheck,
  Save
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
  notes?: string
}

interface PurchaseOrder {
  id: number
  orderNumber: string
  supplier: {
    id: number
    name: string
  }
  employee: {
    id: number
    name: string
  }
  orderDate: string
  expectedDate?: string
  status: string
  totalAmount: number
  items: PurchaseOrderItem[]
}

interface Warehouse {
  id: number
  name: string
  location?: string
}

interface ReceivingItem {
  id: number
  receiveQuantity: number
  notes?: string
}

interface ReceivingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchaseOrder: PurchaseOrder
  warehouses: Warehouse[]
  onReceivingComplete?: (result: any) => void
}

export function ReceivingDialog({
  open,
  onOpenChange,
  purchaseOrder,
  warehouses,
  onReceivingComplete
}: ReceivingDialogProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("")
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([])
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // 初始化验收项目
  useEffect(() => {
    if (purchaseOrder?.items) {
      const items = purchaseOrder.items.map(item => ({
        id: item.id,
        receiveQuantity: Math.max(0, item.quantity - item.receivedQuantity), // 默认为剩余未收货数量
        notes: ""
      }))
      setReceivingItems(items)
    }
  }, [purchaseOrder])

  // 重置对话框状态
  const resetDialog = () => {
    setSelectedWarehouseId("")
    setNotes("")
    setReceivingItems([])
    setIsLoading(false)
  }

  // 更新验收项目数量
  const updateReceivingItem = (itemId: number, field: keyof ReceivingItem, value: any) => {
    setReceivingItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, [field]: value }
          : item
      )
    )
  }

  // 计算总计信息
  const calculateTotals = () => {
    const totalExpected = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)
    const totalAlreadyReceived = purchaseOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0)
    const totalThisReceiving = receivingItems.reduce((sum, item) => sum + item.receiveQuantity, 0)
    const totalAfterReceiving = totalAlreadyReceived + totalThisReceiving

    return {
      totalExpected,
      totalAlreadyReceived,
      totalThisReceiving,
      totalAfterReceiving,
      completionRate: totalExpected > 0 ? (totalAfterReceiving / totalExpected) * 100 : 0
    }
  }

  // 验证表单
  const validateForm = () => {
    if (!selectedWarehouseId) {
      toast({
        title: "错误",
        description: "请选择入库仓库",
        variant: "destructive"
      })
      return false
    }

    const hasReceivingItems = receivingItems.some(item => item.receiveQuantity > 0)
    if (!hasReceivingItems) {
      toast({
        title: "错误",
        description: "请至少输入一个商品的到货数量",
        variant: "destructive"
      })
      return false
    }

    // 检查是否有超量收货
    const hasOverReceiving = purchaseOrder.items.some(orderItem => {
      const receivingItem = receivingItems.find(item => item.id === orderItem.id)
      if (!receivingItem) return false
      
      const totalAfterReceiving = orderItem.receivedQuantity + receivingItem.receiveQuantity
      return totalAfterReceiving > orderItem.quantity
    })

    if (hasOverReceiving) {
      toast({
        title: "警告",
        description: "检测到超量收货，请确认数量是否正确",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  // 执行到货验收
  const handleReceiving = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}/receive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          warehouseId: Number(selectedWarehouseId),
          items: receivingItems.filter(item => item.receiveQuantity > 0)
        })
      })

      if (!response.ok) {
        throw new Error("到货验收失败")
      }

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "验收成功",
          description: "到货验收已完成，库存已更新"
        })
        
        onReceivingComplete?.(result)
        onOpenChange(false)
        resetDialog()
      } else {
        throw new Error(result.error || "到货验收失败")
      }

    } catch (error) {
      console.error("到货验收失败:", error)
      toast({
        title: "验收失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 关闭对话框
  const handleClose = () => {
    resetDialog()
    onOpenChange(false)
  }

  const totals = calculateTotals()
  const selectedWarehouse = warehouses.find(w => w.id.toString() === selectedWarehouseId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            到货验收 - {purchaseOrder.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 订单信息概览 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">订单信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">供应商:</span>
                  <div className="font-medium">{purchaseOrder.supplier.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">负责人:</span>
                  <div className="font-medium">{purchaseOrder.employee.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">订单日期:</span>
                  <div className="font-medium">
                    {format(new Date(purchaseOrder.orderDate), "yyyy-MM-dd", { locale: zhCN })}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">订单金额:</span>
                  <div className="font-medium">¥{purchaseOrder.totalAmount.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 验收设置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                验收设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warehouse">入库仓库 *</Label>
                  <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择入库仓库" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                          {warehouse.location && (
                            <span className="text-muted-foreground ml-2">
                              ({warehouse.location})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">验收备注</Label>
                  <Textarea
                    id="notes"
                    placeholder="验收备注信息"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 验收明细 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                验收明细
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 汇总信息 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded-lg text-sm">
                  <div>
                    <span className="text-muted-foreground">订单总量:</span>
                    <div className="font-medium">{totals.totalExpected}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">已收货:</span>
                    <div className="font-medium">{totals.totalAlreadyReceived}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">本次收货:</span>
                    <div className="font-medium text-blue-600">{totals.totalThisReceiving}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">完成率:</span>
                    <div className="font-medium">
                      {totals.completionRate.toFixed(1)}%
                      {totals.completionRate >= 100 && (
                        <CheckCircle className="inline h-4 w-4 ml-1 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 商品明细表 */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">商品名称</th>
                        <th className="text-center p-3">订单数量</th>
                        <th className="text-center p-3">已收货</th>
                        <th className="text-center p-3">本次收货</th>
                        <th className="text-center p-3">剩余</th>
                        <th className="text-right p-3">单价</th>
                        <th className="text-left p-3">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrder.items.map((orderItem) => {
                        const receivingItem = receivingItems.find(item => item.id === orderItem.id)
                        const remainingQuantity = orderItem.quantity - orderItem.receivedQuantity - (receivingItem?.receiveQuantity || 0)
                        const isOverReceiving = remainingQuantity < 0

                        return (
                          <tr key={orderItem.id} className="border-t">
                            <td className="p-3">
                              <div>
                                <div className="font-medium">
                                  {orderItem.product?.name || orderItem.productName || "未知商品"}
                                </div>
                                {orderItem.product?.sku && (
                                  <div className="text-xs text-muted-foreground">
                                    SKU: {orderItem.product.sku}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center font-medium">
                              {orderItem.quantity}
                            </td>
                            <td className="p-3 text-center">
                              {orderItem.receivedQuantity}
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                min="0"
                                max={orderItem.quantity - orderItem.receivedQuantity}
                                value={receivingItem?.receiveQuantity || 0}
                                onChange={(e) => updateReceivingItem(
                                  orderItem.id, 
                                  "receiveQuantity", 
                                  Number(e.target.value) || 0
                                )}
                                className={`w-20 text-center ${isOverReceiving ? "border-red-500" : ""}`}
                              />
                            </td>
                            <td className={`p-3 text-center ${isOverReceiving ? "text-red-600 font-medium" : ""}`}>
                              {remainingQuantity}
                              {isOverReceiving && (
                                <AlertTriangle className="inline h-4 w-4 ml-1" />
                              )}
                            </td>
                            <td className="p-3 text-right">
                              ¥{orderItem.price.toFixed(2)}
                            </td>
                            <td className="p-3">
                              <Input
                                placeholder="验收备注"
                                value={receivingItem?.notes || ""}
                                onChange={(e) => updateReceivingItem(
                                  orderItem.id, 
                                  "notes", 
                                  e.target.value
                                )}
                                className="w-32"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {totals.totalThisReceiving > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      本次验收 {totals.totalThisReceiving} 件商品
                      {selectedWarehouse && ` 将入库到 ${selectedWarehouse.name}`}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button 
              onClick={handleReceiving} 
              disabled={isLoading || !selectedWarehouseId || totals.totalThisReceiving === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "验收中..." : "确认验收"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
