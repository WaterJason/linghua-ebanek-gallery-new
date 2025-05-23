"use client"

import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EditIcon } from "lucide-react"

interface AccountDetailProps {
  account: any
  onEdit?: () => void
  onClose?: () => void
}

export function AccountDetail({ account, onEdit, onClose }: AccountDetailProps) {
  // 格式化金额
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // 格式化日期
  const formatDate = (date) => {
    if (!date) return "-"
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
  }

  // 获取账户类型显示名称
  const getAccountTypeName = (type) => {
    switch (type) {
      case "bank": return "银行账户"
      case "cash": return "现金账户"
      case "alipay": return "支付宝"
      case "wechat": return "微信支付"
      case "other": return "其他账户"
      default: return type
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{account.name}</h3>
        <Badge variant={account.isActive ? "default" : "secondary"}>
          {account.isActive ? "活跃" : "非活跃"}
        </Badge>
      </div>
      
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">账户类型</p>
              <p>{getAccountTypeName(account.type)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">账号</p>
              <p>{account.accountNumber || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">当前余额</p>
              <p className="font-medium">{formatCurrency(account.currentBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">创建时间</p>
              <p>{formatDate(account.createdAt)}</p>
            </div>
          </div>
          
          {account.description && (
            <div>
              <p className="text-sm text-muted-foreground">描述</p>
              <p>{account.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          关闭
        </Button>
        <Button onClick={onEdit}>
          <EditIcon className="mr-2 h-4 w-4" />
          编辑账户
        </Button>
      </div>
    </div>
  )
}
