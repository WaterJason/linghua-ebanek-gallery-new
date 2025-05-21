"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { CalendarIcon, SearchIcon, FilterIcon, RefreshCwIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast"
import { getPosSales } from "@/lib/actions/pos-actions"
import { getEmployees } from "@/lib/actions/employee-actions"
import { cn } from "@/lib/utils"

export function PosSalesManagement() {
  const [sales, setSales] = useState([])
  const [totalSales, setTotalSales] = useState(0)
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(10)
  const [filters, setFilters] = useState({
    employeeId: "all",
    startDate: "",
    endDate: "",
  })

  // 加载员工数据
  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await getEmployees()
        setEmployees(data)
      } catch (error) {
        console.error("Error loading employees:", error)
      }
    }

    loadEmployees()
  }, [])

  // 加载销售数据
  useEffect(() => {
    loadSales()
  }, [page, limit, filters])

  const loadSales = async () => {
    setIsLoading(true)
    try {
      const data = await getPosSales(
        filters.startDate || undefined,
        filters.endDate || undefined,
        filters.employeeId && filters.employeeId !== "all" ? Number(filters.employeeId) : undefined,
        limit,
        page * limit
      )
      setSales(data.data)
      setTotalSales(data.total)
    } catch (error) {
      console.error("Error loading POS sales:", error)
      toast({
        title: "错误",
        description: "加载POS销售记录失败",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
    setPage(0) // 重置页码
  }

  const handleClearFilters = () => {
    setFilters({
      employeeId: "all",
      startDate: "",
      endDate: "",
    })
    setPage(0)
  }

  const handleRefresh = () => {
    loadSales()
  }

  // 计算总页数
  const totalPages = Math.ceil(totalSales / limit)

  // 格式化金额
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">POS销售记录</h3>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCwIcon className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">销售员</label>
              <Select
                value={filters.employeeId}
                onValueChange={(value) => handleFilterChange("employeeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择销售员" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部销售员</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">开始日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(new Date(filters.startDate), "yyyy-MM-dd") : "选择开始日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate ? new Date(filters.startDate) : undefined}
                    onSelect={(date) => handleFilterChange("startDate", date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">结束日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(new Date(filters.endDate), "yyyy-MM-dd") : "选择结束日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate ? new Date(filters.endDate) : undefined}
                    onSelect={(date) => handleFilterChange("endDate", date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end space-x-2">
              <Button onClick={handleClearFilters} variant="outline">
                清除筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 销售记录表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>销售日期</TableHead>
              <TableHead>销售员</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>商品数量</TableHead>
              <TableHead>支付方式</TableHead>
              <TableHead className="text-right">销售金额</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  暂无销售记录
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{format(new Date(sale.date), "yyyy-MM-dd HH:mm")}</TableCell>
                  <TableCell>{sale.employee?.name || "未知"}</TableCell>
                  <TableCell>
                    {sale.customerId ? (
                      sale.customer?.name
                    ) : (
                      sale.customerInfo ? (
                        typeof sale.customerInfo === 'object' ? sale.customerInfo.name : "散客"
                      ) : "散客"
                    )}
                  </TableCell>
                  <TableCell>{sale.items?.length || 0}件</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {sale.paymentMethod === "cash" ? "现金" : 
                       sale.paymentMethod === "card" ? "刷卡" :
                       sale.paymentMethod === "wechat" ? "微信" :
                       sale.paymentMethod === "alipay" ? "支付宝" : sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(sale.totalAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          共 {totalSales} 条记录，第 {page + 1} / {totalPages || 1} 页
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}
