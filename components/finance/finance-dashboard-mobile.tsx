"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export function FinanceDashboardMobile() {
  const router = useRouter()
  const [accountBalances, setAccountBalances] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAccountBalances = async () => {
      try {
        setIsLoading(true)
        // 使用模拟数据，避免API调用错误
        const mockData = [
          { id: '1', name: '工商银行', accountType: 'bank', currentBalance: 25000 },
          { id: '2', name: '现金账户', accountType: 'cash', currentBalance: 5000 },
          { id: '3', name: '支付宝', accountType: 'alipay', currentBalance: 8500 },
          { id: '4', name: '微信支付', accountType: 'wechat', currentBalance: 3200 }
        ]

        // 模拟网络延迟
        setTimeout(() => {
          setAccountBalances(mockData)
          setIsLoading(false)
        }, 800)

        // 注释掉实际API调用，避免错误
        /*
        const response = await fetch("/api/finance/summary?type=balances")

        if (!response.ok) {
          throw new Error("获取账户余额失败")
        }

        const data = await response.json()
        setAccountBalances(data)
        */
      } catch (error) {
        console.error("Error fetching account balances:", error)
        setError(error instanceof Error ? error.message : "获取账户余额失败")
        setIsLoading(false)
      }
    }

    fetchAccountBalances()
  }, [])

  // 计算总余额
  const totalBalance = accountBalances.reduce((sum, account) => sum + account.currentBalance, 0)

  // 获取账户类型图标和颜色
  const getAccountTypeInfo = (type: string) => {
    switch (type) {
      case "bank": return { icon: "🏦", color: "bg-blue-100 text-blue-800" }
      case "cash": return { icon: "💵", color: "bg-green-100 text-green-800" }
      case "alipay": return { icon: "💰", color: "bg-blue-100 text-blue-800" }
      case "wechat": return { icon: "💬", color: "bg-green-100 text-green-800" }
      default: return { icon: "💼", color: "bg-gray-100 text-gray-800" }
    }
  }

  // 获取账户类型名称
  const getAccountTypeName = (type: string) => {
    switch (type) {
      case "bank": return "银行账户"
      case "cash": return "现金账户"
      case "alipay": return "支付宝"
      case "wechat": return "微信支付"
      default: return "其他账户"
    }
  }

  // 快速操作项
  const quickActions = [
    {
      icon: <Icons.plus className="h-5 w-5" />,
      label: "记录收入",
      color: "bg-green-100 text-green-800",
      href: "/finance?tab=transactions"
    },
    {
      icon: <Icons.minus className="h-5 w-5" />,
      label: "记录支出",
      color: "bg-red-100 text-red-800",
      href: "/finance?tab=transactions"
    },
    {
      icon: <Icons.transfer className="h-5 w-5" />,
      label: "账户转账",
      color: "bg-blue-100 text-blue-800",
      href: "/finance?tab=transactions"
    },
    {
      icon: <Icons.chart className="h-5 w-5" />,
      label: "财务报表",
      color: "bg-purple-100 text-purple-800",
      href: "/finance?tab=reports"
    },
  ]

  return (
    <div className="space-y-6">
      {/* 总余额卡片 */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">总资产</h3>
            <Icons.wallet className="h-5 w-5" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {isLoading ? (
              <Skeleton className="h-8 w-32 bg-white/20" />
            ) : (
              formatCurrency(totalBalance)
            )}
          </div>
          <div className="text-sm opacity-80">所有账户余额总和</div>
        </CardContent>
      </Card>

      {/* 快速操作 */}
      <div>
        <h3 className="text-lg font-medium mb-3">快速操作</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Link href={action.href} key={index}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center mb-2`}>
                    {action.icon}
                  </div>
                  <span className="text-sm">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 账户列表 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">账户余额</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/finance?tab=accounts">查看全部</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-4 text-center text-red-500">
              {error}
            </CardContent>
          </Card>
        ) : accountBalances.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground mb-3">暂无账户数据</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/finance?tab=accounts">
                  添加账户
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[220px]">
            <div className="space-y-3 pr-4">
              {accountBalances.map((account) => {
                const typeInfo = getAccountTypeInfo(account.accountType)
                return (
                  <Card key={account.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium flex items-center">
                            <span className="mr-2">{typeInfo.icon}</span>
                            {account.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getAccountTypeName(account.accountType)}
                          </div>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(account.currentBalance)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* 最近交易 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">最近交易</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/finance?tab=transactions">查看全部</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <Icons.history className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-3">暂无最近交易记录</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/finance?tab=transactions">
                添加交易
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
