"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SmartInput } from "@/components/ui/smart-input"
import { SmartTooltip } from "@/components/ui/tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  PlusIcon,
  SearchIcon,
  CreditCardIcon,
  DollarSignIcon,
  TrendingUpIcon,
  CalendarIcon,
  EditIcon,
  TrashIcon
} from "lucide-react"
import { getFinancialTransactions } from "@/lib/actions/finance-actions"
import { toast } from "@/components/ui/use-toast"

export function FinanceIncomeManagement() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [incomeData, setIncomeData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // 智能建议数据
  const incomeSearchSuggestions = [
    { id: '1', value: '销售收入', label: '销售收入', category: '收入类型', frequency: 20 },
    { id: '2', value: '微信支付', label: '微信支付', category: '支付方式', frequency: 15 },
    { id: '3', value: '支付宝', label: '支付宝', category: '支付方式', frequency: 12 },
    { id: '4', value: '现金', label: '现金', category: '支付方式', frequency: 8 },
    { id: '5', value: '银行转账', label: '银行转账', category: '支付方式', frequency: 6 },
  ]

  // 加载收入数据
  useEffect(() => {
    loadIncomeData()
  }, [])

  const loadIncomeData = async () => {
    try {
      setIsLoading(true)
      // 获取收入类型的财务交易
      const transactions = await getFinancialTransactions({
        type: "income",
        limit: 100
      })
      setIncomeData(transactions)
    } catch (error) {
      console.error("Error loading income data:", error)
      toast({
        title: "加载失败",
        description: "无法加载收入数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 计算统计数据
  const stats = {
    todayIncome: incomeData.filter(income => {
      const today = new Date().toDateString()
      return new Date(income.transactionDate).toDateString() === today
    }).reduce((sum, income) => sum + income.amount, 0),

    weekIncome: incomeData.filter(income => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(income.transactionDate) >= weekAgo
    }).reduce((sum, income) => sum + income.amount, 0),

    monthIncome: incomeData.filter(income => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(income.transactionDate) >= monthAgo
    }).reduce((sum, income) => sum + income.amount, 0),

    totalTransactions: incomeData.length
  }

  // 过滤收入记录
  const filteredIncome = incomeData.filter(income =>
    income.counterparty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    income.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    income.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(income.transactionDate).toLocaleDateString().includes(searchTerm)
  )

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日收入</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.todayIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">今日收入金额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本周收入</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.weekIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">近7天收入金额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月收入</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.monthIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">本月收入金额</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">收入笔数</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">总收入笔数</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">收入概览</TabsTrigger>
            <TabsTrigger value="records">收入记录</TabsTrigger>
            <TabsTrigger value="analysis">收入分析</TabsTrigger>
            <TabsTrigger value="entry">录入收入</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <SmartTooltip
                content="搜索收入记录，支持付款方、支付方式、备注等字段"
                type="help"
                title="收入搜索"
              >
                <SmartInput
                  suggestions={incomeSearchSuggestions}
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSuggestionSelect={(suggestion) => {
                    setSearchTerm(suggestion.value)
                  }}
                  placeholder="搜索收入记录..."
                  showHistory={true}
                  showFrequent={true}
                  className="pl-8 w-64"
                />
              </SmartTooltip>
            </div>
            <SmartTooltip
              content="录入新的收入记录，包括金额、付款方和支付方式"
              type="help"
              title="新增收入"
            >
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                新增收入
              </Button>
            </SmartTooltip>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>收入趋势</CardTitle>
              <CardDescription>收入数据概览和趋势分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUpIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">收入趋势图表将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>收入记录</CardTitle>
              <CardDescription>查看和管理收入记录</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p>加载中...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>付款方</TableHead>
                      <TableHead>支付方式</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncome.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          暂无收入记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredIncome.map((income) => (
                        <TableRow key={income.id}>
                          <TableCell>
                            {new Date(income.transactionDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            +¥{income.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>{income.counterparty || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{income.paymentMethod || "现金"}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {income.category?.name || "未分类"}
                            </Badge>
                          </TableCell>
                          <TableCell>{income.notes || "-"}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <SmartTooltip
                                content="编辑收入记录信息"
                                type="info"
                                title="编辑"
                              >
                                <Button variant="ghost" size="sm">
                                  <EditIcon className="h-4 w-4" />
                                </Button>
                              </SmartTooltip>
                              <SmartTooltip
                                content="删除收入记录，此操作不可恢复"
                                type="warning"
                                title="删除"
                              >
                                <Button variant="ghost" size="sm">
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </SmartTooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>收入分析</CardTitle>
              <CardDescription>收入数据分析和报表</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSignIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">收入分析图表将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>录入收入</CardTitle>
              <CardDescription>录入新的收入记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCardIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">收入录入表单将在此显示</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </TooltipProvider>
  )
}
