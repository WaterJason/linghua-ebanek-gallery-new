"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  PlusIcon, 
  SearchIcon, 
  CreditCardIcon, 
  DollarSignIcon,
  TrendingDownIcon,
  CalendarIcon,
  EditIcon,
  TrashIcon
} from "lucide-react"
import { getFinancialTransactions } from "@/lib/actions/finance-actions"
import { toast } from "@/components/ui/use-toast"

export function FinanceExpenseManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expenseData, setExpenseData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExpenseData()
  }, [])

  const loadExpenseData = async () => {
    try {
      setIsLoading(true)
      const transactions = await getFinancialTransactions({
        type: "expense",
        limit: 100
      })
      setExpenseData(transactions)
    } catch (error) {
      console.error("Error loading expense data:", error)
      toast({
        title: "加载失败",
        description: "无法加载支出数据",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const stats = {
    todayExpense: expenseData.filter(expense => {
      const today = new Date().toDateString()
      return new Date(expense.transactionDate).toDateString() === today
    }).reduce((sum, expense) => sum + expense.amount, 0),
    
    weekExpense: expenseData.filter(expense => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(expense.transactionDate) >= weekAgo
    }).reduce((sum, expense) => sum + expense.amount, 0),
    
    monthExpense: expenseData.filter(expense => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(expense.transactionDate) >= monthAgo
    }).reduce((sum, expense) => sum + expense.amount, 0),
    
    totalTransactions: expenseData.length
  }

  const filteredExpense = expenseData.filter(expense => 
    expense.counterparty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(expense.transactionDate).toLocaleDateString().includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日支出</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">¥{stats.todayExpense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">今日支出金额</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本周支出</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">¥{stats.weekExpense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">近7天支出金额</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月支出</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">¥{stats.monthExpense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">本月支出金额</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">支出笔数</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">总支出笔数</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>支出记录</CardTitle>
              <CardDescription>查看和管理支出记录</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索支出记录..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                新增支出
              </Button>
            </div>
          </div>
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
                  <TableHead>收款方</TableHead>
                  <TableHead>支付方式</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpense.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      暂无支出记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpense.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.transactionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        -¥{expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{expense.counterparty || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.paymentMethod || "现金"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {expense.category?.name || "未分类"}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.notes || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
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
    </div>
  )
}
