"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { receivePurchaseOrder } from "@/lib/actions/purchase-actions";
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface PurchaseReceiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
  warehouses: any[]
  onReceived: () => void
}

export function PurchaseReceiveDialog({
  open,
  onOpenChange,
  order,
  warehouses,
  onReceived,
}: PurchaseReceiveDialogProps) {
  const [warehouseId, setWarehouseId] = useState("")
  const [receiveItems, setReceiveItems] = useState(
    order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name || "",
      quantity: item.quantity,
      receivedQuantity: item.receivedQuantity || 0,
      receiveQuantity: item.quantity - (item.receivedQuantity || 0),
    }))
  )
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({
    warehouseId: false,
    items: false,
  })

  const handleWarehouseChange = (value) => {
    setWarehouseId(value)
    setErrors({ ...errors, warehouseId: false })
  }

  const handleQuantityChange = (index, value) => {
    const newValue = parseInt(value)
    if (isNaN(newValue) || newValue < 0) return

    const updatedItems = [...receiveItems]
    const item = updatedItems[index]
    const remainingQuantity = item.quantity - item.receivedQuantity

    // 确保入库数量不超过剩余数量
    updatedItems[index] = {
      ...item,
      receiveQuantity: Math.min(newValue, remainingQuantity),
    }

    setReceiveItems(updatedItems)
    setErrors({ ...errors, items: false })
  }

  const validateForm = () => {
    const newErrors = {
      warehouseId: !warehouseId,
      items: !receiveItems.some((item) => item.receiveQuantity > 0),
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "错误",
        description: "请选择仓库并至少入库一个产品",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await receivePurchaseOrder(order.id, {
        warehouseId: Number(warehouseId),
        items: receiveItems
          .filter((item) => item.receiveQuantity > 0)
          .map((item) => ({
            id: item.id,
            receiveQuantity: item.receiveQuantity,
          })),
      })

      toast({
        title: "成功",
        description: "采购入库成功",
      })
      onReceived()
    } catch (error) {
      console.error("Error receiving purchase order:", error)
      toast({
        title: "错误",
        description: error.message || "采购入库失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return format(new Date(dateString), "yyyy-MM-dd", { locale: zhCN })
  }

  const formatCurrency = (amount) => {
    return `¥${amount.toFixed(2)}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>采购入库</DialogTitle>
          <DialogDescription>
            将采购订单商品入库
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 订单信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium">订单编号</h3>
              <p>{order.orderNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">采购日期</h3>
              <p>{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">供应商</h3>
              <p>{order.supplier?.name || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">总金额</h3>
              <p>{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>

          {/* 选择仓库 */}
          <div>
            <Label htmlFor="warehouseId" className={errors.warehouseId ? "text-destructive" : ""}>
              入库仓库 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={warehouseId}
              onValueChange={handleWarehouseChange}
              disabled={isLoading}
            >
              <SelectTrigger id="warehouseId" className={errors.warehouseId ? "border-destructive" : ""}>
                <SelectValue placeholder="选择仓库" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.warehouseId && <p className="text-xs text-destructive mt-1">请选择入库仓库</p>}
          </div>

          {/* 入库商品列表 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className={errors.items ? "text-destructive" : ""}>
                入库商品 <span className="text-destructive">*</span>
              </Label>
              {errors.items && <p className="text-xs text-destructive">请至少入库一个商品</p>}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品</TableHead>
                    <TableHead>订单数量</TableHead>
                    <TableHead>已入库数量</TableHead>
                    <TableHead>剩余数量</TableHead>
                    <TableHead>本次入库数量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receiveItems.map((item, index) => {
                    const remainingQuantity = item.quantity - item.receivedQuantity
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.receivedQuantity}</TableCell>
                        <TableCell>{remainingQuantity}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={remainingQuantity}
                            value={item.receiveQuantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            disabled={isLoading || remainingQuantity === 0}
                            className="w-20"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "入库中..." : "确认入库"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
