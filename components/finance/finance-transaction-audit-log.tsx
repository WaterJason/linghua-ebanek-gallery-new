"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { EntityAuditLog } from "@/components/audit/entity-audit-log"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FinancialTransaction {
  id: number
  type: "income" | "expense" | "transfer"
  amount: number
  accountId: number
  account?: {
    id: number
    name: string
  }
  categoryId?: number
  category?: {
    id: number
    name: string
  }
  transactionDate: Date
  counterparty?: string
  notes?: string
  status: "completed" | "pending" | "cancelled"
  createdAt: Date
  updatedAt: Date
}

interface FinanceTransactionAuditLogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: FinancialTransaction | null
}

export function FinanceTransactionAuditLog({
  open,
  onOpenChange,
  transaction
}: FinanceTransactionAuditLogProps) {
  const [activeTab, setActiveTab] = useState("audit")

  // 获取交易类型的中文名称和颜色
  const getTransactionTypeInfo = (type: string) => {
    switch (type) {
      case "income":
        return { label: "收入", color: "green" }
      case "expense":
        return { label: "支出", color: "red" }
      case "transfer":
        return { label: "转账", color: "blue" }
      default:
        return { label: type, color: "default" }
    }
  }

  // 获取交易状态的中文名称和颜色
  const getTransactionStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "已完成", color: "green" }
      case "pending":
        return { label: "待处理", color: "yellow" }
      case "cancelled":
        return { label: "已取消", color: "red" }
      default:
        return { label: status, color: "default" }
    }
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  }

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  if (!transaction) {
    return null;
  }

  const typeInfo = getTransactionTypeInfo(transaction.type);
  const statusInfo = getTransactionStatusInfo(transaction.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>交易记录详情</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">交易详情</TabsTrigger>
            <TabsTrigger value="audit">操作日志</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant={typeInfo.color as any}>{typeInfo.label}</Badge>
                  <Badge variant={statusInfo.color as any} className="ml-2">{statusInfo.label}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  创建时间: {formatDate(transaction.createdAt)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">金额</div>
                  <div className={`text-lg font-semibold ${transaction.type === 'income' ? 'text-green-600' : transaction.type === 'expense' ? 'text-red-600' : ''}`}>
                    {formatAmount(transaction.amount)}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">交易日期</div>
                  <div className="text-sm">
                    {formatDate(transaction.transactionDate)}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">账户</div>
                  <div className="text-sm">
                    {transaction.account?.name || "-"}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">分类</div>
                  <div className="text-sm">
                    {transaction.category?.name || "-"}
                  </div>
                </div>
                
                <div className="space-y-1 col-span-2">
                  <div className="text-sm font-medium text-muted-foreground">交易对方</div>
                  <div className="text-sm">
                    {transaction.counterparty || "-"}
                  </div>
                </div>
                
                <div className="space-y-1 col-span-2">
                  <div className="text-sm font-medium text-muted-foreground">备注</div>
                  <div className="text-sm">
                    {transaction.notes || "-"}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="audit" className="mt-4">
            <ScrollArea className="h-[400px]">
              <EntityAuditLog
                entityType="finance_transaction"
                entityId={transaction.id.toString()}
                limit={20}
                showHeader={false}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
