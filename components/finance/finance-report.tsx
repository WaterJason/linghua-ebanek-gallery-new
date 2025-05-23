"use client"

import { useState, useEffect } from "react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CalendarIcon,
  DownloadIcon
} from "lucide-react"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { getFinancialTransactions, getFinancialCategories } from "@/lib/actions/finance-actions"

export function FinanceReport() {
  const { toast } = useToast()
  const [reportData, setReportData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date()),
  })

  // 加载报表数据
  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true)
      try {
        // 获取交易数据
        const { data: transactions } = await getFinancialTransactions(
          "all",
          dateRange.from.toISOString(),
          dateRange.to.toISOString(),
          null,
          null,
          1000,
          0,
          "transactionDate",
          "desc"
        )

        // 获取分类数据
        const categories = await getFinancialCategories("all")

        // 构建报表数据
        const reportData = {
          transactions,
          categories,
          summary: {
            totalIncome: transactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0),
            totalExpense: transactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0),
            transactionCount: transactions.length
          }
        }

        setReportData(reportData)
        setIsLoading(false)
      } catch (error) {
        console.error("加载报表数据失败:", error)
        toast({
          variant: "destructive",
          title: "加载失败",
          description: "无法加载财务报表数据，请稍后再试",
        })
        setIsLoading(false)
      }
    }

    loadReportData()
  }, [toast, dateRange])

  // 格式化金额
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>财务报表</CardTitle>
              <CardDescription>查看财务数据分析和报表</CardDescription>
            </div>
            <div className="flex gap-2">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
              <Button variant="outline">
                <DownloadIcon className="mr-2 h-4 w-4" />
                导出报表
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">总览</TabsTrigger>
              <TabsTrigger value="income">收入分析</TabsTrigger>
              <TabsTrigger value="expense">支出分析</TabsTrigger>
              <TabsTrigger value="trend">趋势分析</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">总收入</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {isLoading ? (
                        <Skeleton className="h-8 w-32" />
                      ) : (
                        formatCurrency(reportData?.summary?.totalIncome || 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">总支出</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {isLoading ? (
                        <Skeleton className="h-8 w-32" />
                      ) : (
                        formatCurrency(reportData?.summary?.totalExpense || 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">净收入</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoading ? (
                        <Skeleton className="h-8 w-32" />
                      ) : (
                        formatCurrency((reportData?.summary?.totalIncome || 0) - (reportData?.summary?.totalExpense || 0))
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">交易笔数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isLoading ? (
                        <Skeleton className="h-8 w-32" />
                      ) : (
                        reportData?.summary?.transactionCount || 0
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>月度收支趋势</CardTitle>
                  <CardDescription>
                    查看期间内的月度收支变化
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">图表功能正在开发中...</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>收入分类分析</CardTitle>
                    <CardDescription>
                      收入来源分布
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">图表功能正在开发中...</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>支出分类分析</CardTitle>
                    <CardDescription>
                      支出分布
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">图表功能正在开发中...</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="income" className="space-y-4 mt-4">
              <div className="p-8 text-center">
                <p className="text-muted-foreground">收入分析功能正在开发中...</p>
              </div>
            </TabsContent>

            <TabsContent value="expense" className="space-y-4 mt-4">
              <div className="p-8 text-center">
                <p className="text-muted-foreground">支出分析功能正在开发中...</p>
              </div>
            </TabsContent>

            <TabsContent value="trend" className="space-y-4 mt-4">
              <div className="p-8 text-center">
                <p className="text-muted-foreground">趋势分析功能正在开发中...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
