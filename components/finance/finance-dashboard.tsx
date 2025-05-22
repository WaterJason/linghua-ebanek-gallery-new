"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icons } from "@/components/icons"
import { formatCurrency } from "@/lib/utils"

export function FinanceDashboard() {
  const router = useRouter()
  const [accountBalances, setAccountBalances] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAccountBalances = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/finance/summary?type=balances")
        
        if (!response.ok) {
          throw new Error("获取账户余额失败")
        }
        
        const data = await response.json()
        setAccountBalances(data)
      } catch (error) {
        console.error("Error fetching account balances:", error)
        setError(error instanceof Error ? error.message : "获取账户余额失败")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccountBalances()
  }, [])

  // 计算总余额
  const totalBalance = accountBalances.reduce((sum, account) => sum + account.currentBalance, 0)

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                资金账户总余额
              </CardTitle>
              <Icons.wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  formatCurrency(totalBalance)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                所有账户余额总和
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/finance/accounts">
                  查看账户详情
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                本月收入
              </CardTitle>
              <Icons.arrowUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "计算中..."
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                本月所有收入总和
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/finance/reports">
                  查看收入详情
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                本月支出
              </CardTitle>
              <Icons.arrowDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "计算中..."
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                本月所有支出总和
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/finance/reports">
                  查看支出详情
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                最近交易
              </CardTitle>
              <Icons.history className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "0"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                最近7天的交易数量
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/finance/transactions">
                  查看交易记录
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>账户余额</CardTitle>
              <CardDescription>
                各资金账户当前余额
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  <span>加载中...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8 text-red-500">
                  <span>{error}</span>
                </div>
              ) : accountBalances.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <span>暂无账户数据</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {accountBalances.map((account) => (
                    <div key={account.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="ml-2">
                          <p className="text-sm font-medium">{account.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {account.accountType === "bank" && "银行账户"}
                            {account.accountType === "cash" && "现金账户"}
                            {account.accountType === "alipay" && "支付宝"}
                            {account.accountType === "wechat" && "微信支付"}
                            {account.accountType === "other" && "其他账户"}
                          </p>
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(account.currentBalance)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/finance/accounts">
                  管理账户
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>
                常用财务操作
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" size="sm" asChild>
                <Link href="/finance/transactions">
                  <Icons.plus className="mr-2 h-4 w-4" />
                  记录收入
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" size="sm" asChild>
                <Link href="/finance/transactions">
                  <Icons.minus className="mr-2 h-4 w-4" />
                  记录支出
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" size="sm" asChild>
                <Link href="/finance/transactions">
                  <Icons.transfer className="mr-2 h-4 w-4" />
                  账户转账
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" size="sm" asChild>
                <Link href="/finance/reports">
                  <Icons.chart className="mr-2 h-4 w-4" />
                  查看财务报表
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      <TabsContent value="accounts" className="space-y-4">
        <Button onClick={() => router.push("/finance/accounts")}>
          进入资金账户管理
        </Button>
      </TabsContent>
      <TabsContent value="transactions" className="space-y-4">
        <Button onClick={() => router.push("/finance/transactions")}>
          进入交易记录管理
        </Button>
      </TabsContent>
      <TabsContent value="reports" className="space-y-4">
        <Button onClick={() => router.push("/finance/reports")}>
          进入财务报表
        </Button>
      </TabsContent>
    </Tabs>
  )
}
