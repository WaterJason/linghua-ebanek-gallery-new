"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { getInventoryHistory } from "@/lib/actions/inventory-actions"
import { formatDate } from "@/lib/utils"

interface InventoryTransaction {
  id: number
  productId: number
  quantity: number
  type: string
  notes: string | null
  sourceWarehouseId: number | null
  targetWarehouseId: number | null
  createdAt: Date
  updatedAt: Date
  product?: {
    name: string
  }
  sourceWarehouse?: {
    name: string
  }
  targetWarehouse?: {
    name: string
  }
}

interface InventoryHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: number | null
  productName?: string
}

export function InventoryHistoryDialog({
  open,
  onOpenChange,
  productId,
  productName
}: InventoryHistoryDialogProps) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 加载库存历史记录
  useEffect(() => {
    const loadHistory = async () => {
      if (open && productId) {
        try {
          setIsLoading(true)
          const history = await getInventoryHistory(productId)
          setTransactions(history)
        } catch (error) {
          console.error("Error loading inventory history:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadHistory()
  }, [open, productId])

  // 获取交易类型的中文名称和颜色
  const getTransactionTypeInfo = (type: string) => {
    switch (type) {
      case "initial":
        return { label: "初始化", color: "default" }
      case "purchase":
        return { label: "采购入库", color: "green" }
      case "sale":
        return { label: "销售出库", color: "red" }
      case "transfer":
        return { label: "库存转移", color: "blue" }
      case "adjustment":
        return { label: "库存调整", color: "yellow" }
      case "return":
        return { label: "退货入库", color: "purple" }
      default:
        return { label: type, color: "default" }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>库存变更历史 - {productName || "产品"}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex flex-col space-y-2 border-b pb-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>没有找到库存变更记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const typeInfo = getTransactionTypeInfo(transaction.type)
                return (
                  <div key={transaction.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <Badge variant={typeInfo.color as any}>{typeInfo.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm">
                        {transaction.notes || "无备注"}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm">
                        数量变化: <span className={transaction.quantity > 0 ? "text-green-600" : "text-red-600"}>
                          {transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity}
                        </span>
                      </div>
                      
                      {transaction.type === "transfer" && (
                        <div className="text-sm">
                          {transaction.sourceWarehouse?.name || "未知仓库"} → {transaction.targetWarehouse?.name || "未知仓库"}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
